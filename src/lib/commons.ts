import { commonsSpecs, isPhotoReady, photoSrc, photoSrcSet, type CommonsSpec, type Photo } from '../data/images'

/**
 * Real photographs from Wikimedia Commons, resolved in the visitor's browser.
 *
 * Commons exposes a public CORS-enabled API (`origin=*`). For every photo slot we run its search
 * (`commonsSpecs`), keep only free-licensed photographs that really show the subject in Kyrgyzstan,
 * and take the author / licence / source page from the file's own Commons metadata.
 * Results are cached in localStorage (per visitor) so a page is resolved only once a week.
 * A local file in public/photos (status 'ready' in images.ts) always wins over Commons.
 */

export interface ResolvedPhoto {
  src: string
  srcSet?: string
  width: number
  height: number
  photographer: string
  license: string
  licenseUrl?: string
  source: string
  sourceUrl: string
  /** Commons file title, e.g. "File:Issyk-Kul.jpg" (empty for local files) */
  file: string
  /** short description from Commons (plain text, may be empty) */
  caption?: string
}

export interface Resolution {
  /** best match first; next ones are used when an image fails to load */
  items: ResolvedPhoto[]
}

const API = 'https://commons.wikimedia.org/w/api.php'
const CACHE_KEY = 'kge-commons-v1'
const TTL_OK = 7 * 24 * 3600e3
const TTL_EMPTY = 24 * 3600e3
const MAX_PARALLEL = 4
const THUMB = 1280

const KG = /kyrgyz|kirgiz|kirghiz|киргиз|кыргыз/i
const FREE = /^(cc0|cc[ -]?by|public domain|pd\b|pd-|attribution)/i
const NON_FREE = /\b(nc|nd)\b|non-?commercial|no ?deriv|fair use/i
const BAD = /\b(map|karte|diagram|logo|stamp|coin|banknote|poster|flag|scheme|chart|museum|zoo|zoological|tiergarten|painting|drawing|illustration|herbarium|specimen|satellite|landsat|sentinel|screenshot)\b|карта|схема|марка|зоопарк/i

interface CacheEntry {
  at: number
  items: ResolvedPhoto[]
}

/* ───────────── cache (localStorage, best-effort) ───────────── */

let cache: Record<string, CacheEntry> | null = null
function loadCache(): Record<string, CacheEntry> {
  if (cache) return cache
  cache = {}
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) cache = JSON.parse(raw) as Record<string, CacheEntry>
  } catch {
    cache = {}
  }
  return cache
}
let saveTimer: ReturnType<typeof setTimeout> | undefined
function saveCache() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache ?? {}))
    } catch {
      /* storage full / blocked — the in-memory cache still works */
    }
  }, 300)
}
function fresh(e: CacheEntry | undefined) {
  return !!e && Date.now() - e.at < (e.items.length ? TTL_OK : TTL_EMPTY)
}

/* ───────────── concurrency limit ───────────── */

let running = 0
const queue: (() => void)[] = []
function limited<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running++
      fn()
        .then(resolve, reject)
        .finally(() => {
          running--
          queue.shift()?.()
        })
    }
    if (running < MAX_PARALLEL) run()
    else queue.push(run)
  })
}

/* ───────────── one photo per slot: avoid showing the same file twice ───────────── */

const claimed = new Map<string, string>() // file → photo id
function claim(id: string, items: ResolvedPhoto[]) {
  const free = items.filter((x) => !x.file || !claimed.has(x.file) || claimed.get(x.file) === id)
  const list = free.length ? free : items
  if (list[0]?.file) claimed.set(list[0].file, id)
  return list
}

/* ───────────── Commons API ───────────── */

interface ApiImageInfo {
  url: string
  thumburl?: string
  thumbwidth?: number
  thumbheight?: number
  width: number
  height: number
  mime: string
  descriptionurl: string
  extmetadata?: Record<string, { value?: unknown }>
}
interface ApiPage {
  title: string
  index?: number
  imageinfo?: ApiImageInfo[]
}

export function stripHtml(v: unknown): string {
  if (typeof v !== 'string') return ''
  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (div) {
    div.innerHTML = v
    return (div.textContent ?? '').replace(/\s+/g, ' ').trim()
  }
  return v.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

const meta = (ii: ApiImageInfo, k: string) => stripHtml(ii.extmetadata?.[k]?.value)

/** Rewrites a Commons thumbnail URL to another standard width. */
function thumbAt(url: string, w: number) {
  return url.replace(/\/(\d+)px-([^/]+)$/, `/${w}px-$2`)
}

export function acceptPage(p: ApiPage, spec: CommonsSpec, minWidth: number, landscape: boolean): ResolvedPhoto | null {
  const ii = p.imageinfo?.[0]
  if (!ii || ii.mime !== 'image/jpeg' || !ii.thumburl) return null
  if (ii.width < Math.min(minWidth, 1600) * 0.8) return null
  if (landscape && ii.width / ii.height < 1.2) return null
  const license = meta(ii, 'LicenseShortName')
  if (!FREE.test(license) || NON_FREE.test(license)) return null
  const desc = meta(ii, 'ImageDescription')
  const cats = meta(ii, 'Categories')
  const title = p.title.replace(/^File:/, '')
  if (BAD.test(title) || BAD.test(cats)) return null
  const text = `${title} ${desc} ${cats} ${meta(ii, 'ObjectName')}`.toLowerCase()
  if (spec.must?.length && !spec.must.some((m) => text.includes(m.toLowerCase()))) return null
  if (!spec.kgUnique && !KG.test(text)) return null
  const photographer = meta(ii, 'Artist') || meta(ii, 'Credit') || 'Wikimedia Commons'
  const thumb = ii.thumburl
  const widths = [960, THUMB, 1920].filter((w) => w <= ii.width)
  return {
    src: thumb,
    srcSet: widths.length > 1 ? widths.map((w) => `${thumbAt(thumb, w)} ${w}w`).join(', ') : undefined,
    width: ii.thumbwidth ?? THUMB,
    height: ii.thumbheight ?? Math.round((THUMB * ii.height) / ii.width),
    photographer: photographer.length > 80 ? photographer.slice(0, 77) + '…' : photographer,
    license,
    licenseUrl: meta(ii, 'LicenseUrl') || undefined,
    source: 'Wikimedia Commons',
    sourceUrl: ii.descriptionurl,
    file: p.title,
    caption: desc.length > 220 ? desc.slice(0, 217) + '…' : desc || undefined,
  }
}

async function queryCommons(spec: CommonsSpec): Promise<ApiPage[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: String(THUMB),
    iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|ImageDescription|Categories|ObjectName',
    iiextmetadatalanguage: 'en',
  })
  if (spec.file) params.set('titles', spec.file)
  else {
    params.set('generator', 'search')
    params.set('gsrnamespace', '6')
    params.set('gsrlimit', '30')
    params.set('gsrsearch', `${spec.query} filetype:bitmap`)
  }
  const res = await fetch(`${API}?${params}`, { credentials: 'omit' })
  if (!res.ok) throw new Error(`Commons ${res.status}`)
  const json = (await res.json()) as { query?: { pages?: ApiPage[] | Record<string, ApiPage> } }
  const pages = json.query?.pages ?? []
  const list = Array.isArray(pages) ? pages : Object.values(pages)
  return list.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
}

/* ───────────── public API ───────────── */

function localResolution(ph: Photo): Resolution {
  return {
    items: [
      {
        src: photoSrc(ph),
        srcSet: photoSrcSet(ph),
        width: ph.width ?? 1920,
        height: ph.height ?? 1080,
        photographer: ph.photographer!,
        license: ph.license!,
        licenseUrl: ph.licenseUrl,
        source: ph.source!,
        sourceUrl: ph.sourceUrl!,
        file: '',
      },
    ],
  }
}

const inflight = new Map<string, Promise<Resolution>>()

/** Synchronous lookup (local file or cached Commons result) — avoids a loading flash. */
export function peekPhoto(ph: Photo): Resolution | undefined {
  if (isPhotoReady(ph)) return localResolution(ph)
  const e = loadCache()[ph.id]
  if (fresh(e)) return { items: claim(ph.id, e!.items) }
  return undefined
}

export function resolvePhotoSource(ph: Photo): Promise<Resolution> {
  const peek = peekPhoto(ph)
  if (peek) return Promise.resolve(peek)
  const spec = commonsSpecs[ph.id]
  if (!spec) return Promise.resolve({ items: [] })
  let p = inflight.get(ph.id)
  if (!p) {
    const landscape = ph.aspect === '16:9' || ph.aspect === '21:9'
    p = limited(() => queryCommons(spec))
      .then((pages) => {
        const items: ResolvedPhoto[] = []
        for (const page of pages) {
          const r = acceptPage(page, spec, ph.minWidth, landscape)
          if (r && !items.some((x) => x.file === r.file)) items.push(r)
          if (items.length >= 4) break
        }
        loadCache()[ph.id] = { at: Date.now(), items }
        saveCache()
        return { items: claim(ph.id, items) }
      })
      .catch(() => ({ items: [] as ResolvedPhoto[] })) // offline / blocked: not cached, retried next visit
      .finally(() => inflight.delete(ph.id))
    inflight.set(ph.id, p)
  }
  return p
}
