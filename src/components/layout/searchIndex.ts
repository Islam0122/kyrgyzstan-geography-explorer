import { glossary } from '../../data/glossary'
import { lakeInfo, places, regionInfo, ridgeInfo, riverInfo } from '../../data/lessons/geoObjects'
import { modules } from '../../data/lessons/modules'
import type { L } from '../../types'

export interface SearchItem {
  key: string
  group: 'places' | 'terms' | 'pages'
  title: L
  sub?: L
  to: string
  kind: string
}

const K = (ru: string, ky: string): L => ({ ru, ky })

export const searchIndex: SearchItem[] = [
  ...regionInfo.map((r) => ({ key: `region:${r.id}`, group: 'places' as const, title: r.name, sub: r.center, to: `/atlas?sel=region:${r.id}`, kind: 'region' })),
  ...riverInfo.map((r) => ({ key: `river:${r.id}`, group: 'places' as const, title: r.name, sub: K('река', 'дарыя'), to: `/atlas?sel=river:${r.id}`, kind: 'river' })),
  ...lakeInfo.map((l) => ({ key: `lake:${l.id}`, group: 'places' as const, title: l.name, sub: l.kind, to: `/atlas?sel=lake:${l.id}`, kind: 'lake' })),
  ...ridgeInfo.map((r) => ({ key: `ridge:${r.id}`, group: 'places' as const, title: r.name, sub: r.system, to: `/atlas?sel=ridge:${r.id}`, kind: 'ridge' })),
  ...places.map((p) => ({ key: `place:${p.id}`, group: 'places' as const, title: p.name, sub: K(p.kind, p.kind), to: `/atlas?sel=place:${p.id}`, kind: p.kind })),
  ...glossary.map((g) => ({ key: `term:${g.id}`, group: 'terms' as const, title: g.term, sub: g.def, to: `/glossary#${g.id}`, kind: 'term' })),
  ...modules.map((m) => ({ key: `page:${m.id}`, group: 'pages' as const, title: m.title, sub: m.short, to: m.path, kind: 'module' })),
]

export function searchItems(q: string, lang: 'ru' | 'ky') {
  const s = q.trim().toLowerCase()
  if (!s) return []
  return searchIndex
    .map((it) => {
      const a = it.title[lang].toLowerCase()
      const b = it.title.ru.toLowerCase() + ' ' + it.title.ky.toLowerCase()
      const score = a.startsWith(s) ? 3 : a.includes(s) ? 2 : b.includes(s) ? 1.5 : (it.sub?.[lang] ?? '').toLowerCase().includes(s) ? 0.5 : 0
      return { it, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((x) => x.it)
}
