import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Expand } from 'lucide-react'
import { photoById, photoForScene, type Photo } from '../../data/images'
import { usePhotoSource } from '../../hooks/usePhotoSource'
import { useI18n } from '../../hooks/useI18n'
import { useLightbox } from '../../store/useLightbox'
import type { SceneKind } from '../../types'
import { PhotoEmpty, PhotoSkeleton } from './PhotoSkeleton'

export interface RealPhotoProps {
  /** photo id from data/images.ts */
  id?: string
  photo?: Photo
  /** generic landscape kind (used when no id is given) */
  scene?: SceneKind
  seed?: string
  /** wrapper classes: size / aspect / rounding, e.g. "aspect-video w-full rounded-2xl" */
  className?: string
  imgClassName?: string
  sizes?: string
  /** above-the-fold image: resolve + load immediately with high priority */
  priority?: boolean
  /** zoom on hover of the closest `.group` */
  zoom?: boolean
  kenburns?: boolean
  /** darkening for text readability */
  overlay?: 'none' | 'bottom' | 'full' | 'hero' | 'card'
  /** open the lightbox on click; pass ids to browse a group */
  lightbox?: boolean | string[]
  /** small author · licence line over the photo */
  credit?: boolean
  /** "contain" for the lightbox */
  fit?: 'cover' | 'contain'
  children?: ReactNode
}

export function resolvePhoto({ id, photo, scene, seed }: Pick<RealPhotoProps, 'id' | 'photo' | 'scene' | 'seed'>): Photo | undefined {
  if (photo) return photo
  if (id && photoById[id]) return photoById[id]
  if (scene) return photoForScene(scene, seed)
  return undefined
}

const OVERLAY: Record<NonNullable<RealPhotoProps['overlay']>, string> = {
  none: '',
  bottom: 'bg-gradient-to-t from-navy/85 via-navy/25 to-transparent',
  full: 'bg-navy/35',
  hero: 'bg-[linear-gradient(180deg,rgba(5,11,20,.62)_0%,rgba(5,11,20,.25)_32%,rgba(5,11,20,.5)_68%,rgba(5,11,20,.97)_100%)]',
  card: 'bg-[linear-gradient(180deg,rgba(5,11,20,.55)_0%,rgba(5,11,20,.08)_28%,rgba(5,11,20,.55)_55%,rgba(5,11,20,.94)_100%)]',
}

/** Becomes true once the element is within `margin` of the viewport. */
export function useNearViewport<T extends Element>(skip = false, margin = '400px') {
  const ref = useRef<T>(null)
  const [near, setNear] = useState(skip)
  useEffect(() => {
    if (near || !ref.current) return
    if (typeof IntersectionObserver === 'undefined') return setNear(true)
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: margin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [near, margin])
  return [ref, near] as const
}

/**
 * Real photograph (local file or Wikimedia Commons) with lazy lookup + lazy loading, responsive
 * srcset, skeleton while loading, automatic switch to the next candidate photo on a load error,
 * and a calm dark background if no photo can be obtained.
 */
export function RealPhoto(props: RealPhotoProps) {
  const { className = '', imgClassName = '', sizes = '(min-width: 1024px) 50vw, 100vw', priority, zoom, kenburns, overlay = 'none', lightbox, credit, fit = 'cover', children } = props
  const { tr, t } = useI18n()
  const openLb = useLightbox((s) => s.open)
  const base = resolvePhoto(props)
  const [ref, near] = useNearViewport<HTMLDivElement>(!!priority)
  const state = usePhotoSource(base, near)

  const items = state.status === 'ready' ? state.res.items : []
  const key = `${base?.id}|${items.map((x) => x.src).join()}`
  const [st, setSt] = useState({ key, idx: 0, loaded: false })
  if (st.key !== key) setSt({ key, idx: 0, loaded: false })
  const cur = st.key === key ? items[st.idx] : items[0]

  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) setSt((s) => (s.loaded ? s : { ...s, loaded: true }))
  }, [cur?.src])

  const motion = `${zoom ? 'transition-transform duration-[900ms] ease-out group-hover:scale-[1.06] group-hover/photo:scale-[1.06]' : ''} ${kenburns ? 'kenburns' : ''}`
  const failed = state.status === 'none' || (state.status === 'ready' && !cur)

  const body = (
    <>
      {cur && (
        <img
          ref={imgRef}
          key={cur.src}
          src={cur.src}
          srcSet={cur.srcSet}
          sizes={cur.srcSet ? sizes : undefined}
          width={cur.width}
          height={cur.height}
          alt={base ? `${tr(base.title)} — ${tr(base.location)}` : ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={() => setSt((s) => ({ ...s, loaded: true }))}
          onError={() => setSt((s) => ({ ...s, idx: s.idx + 1, loaded: false }))}
          style={{ objectPosition: base?.focus ?? '50% 50%' }}
          className={`absolute inset-0 h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-700 ${st.loaded ? 'opacity-100' : 'opacity-0'} ${motion} ${imgClassName}`}
        />
      )}
      {!failed && !st.loaded && <PhotoSkeleton />}
      {failed && <PhotoEmpty />}
      {overlay !== 'none' && <div className={`pointer-events-none absolute inset-0 ${OVERLAY[overlay]}`} />}
      {credit && cur && st.loaded && (
        <span className="pointer-events-none absolute bottom-1.5 right-2 max-w-[75%] truncate rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
          © {cur.photographer} · {cur.license}
        </span>
      )}
      {children}
    </>
  )

  const wrapper = `relative isolate overflow-hidden bg-[#0d1828] ${className}`
  if (lightbox && base && !failed) {
    const group = Array.isArray(lightbox) ? lightbox : [base.id]
    const list = group.includes(base.id) ? group : [base.id, ...group]
    return (
      <div ref={ref} className={wrapper}>
        <button
          type="button"
          onClick={() => openLb(list, list.indexOf(base.id))}
          className="group/photo absolute inset-0 z-[1] cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glacier"
          aria-label={`${t('photo.open')}: ${tr(base.title)}`}
        >
          <span className="pointer-events-none absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100">
            <Expand size={15} />
          </span>
        </button>
        {body}
      </div>
    )
  }
  return (
    <div ref={ref} className={wrapper}>
      {body}
    </div>
  )
}

/** Figure with photo + caption (title · location · credit). Click opens the lightbox. Hidden if no photo exists. */
export function RealPhotoCard({ id, scene, seed, group, className = '', aspect = 'aspect-[16/9]' }: { id?: string; scene?: SceneKind; seed?: string; group?: string[]; className?: string; aspect?: string }) {
  const { tr } = useI18n()
  const ph = resolvePhoto({ id, scene, seed })
  const [ref, near] = useNearViewport<HTMLElement>()
  const state = usePhotoSource(ph, near)
  if (!ph || state.status === 'none') return null
  const item = state.status === 'ready' ? state.res.items[0] : undefined
  return (
    <figure ref={ref} className={`card group overflow-hidden ${className}`}>
      <RealPhoto photo={ph} className={`w-full ${aspect}`} lightbox={group ?? true} zoom />
      <figcaption className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs">
        <div className="min-w-0">
          <div className="truncate font-semibold">{tr(ph.title)}</div>
          <div className="truncate text-muted">{tr(ph.location)}</div>
        </div>
        {item && (
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="max-w-[45%] shrink-0 truncate text-right text-[10.5px] text-muted hover:text-ink">
            © {item.photographer} · {item.license}
          </a>
        )}
      </figcaption>
    </figure>
  )
}
