import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { aspectCss, photoCategories, photos as allPhotos, type Photo, type PhotoCategory } from '../../data/images'
import { usePhotoSource } from '../../hooks/usePhotoSource'
import { useI18n } from '../../hooks/useI18n'
import { useLightbox } from '../../store/useLightbox'
import { RealPhoto, useNearViewport } from './RealPhoto'

type Filter = PhotoCategory | 'all'

function GalleryItem({ ph, i, onOpen, onNone }: { ph: Photo; i: number; onOpen: (id: string) => void; onNone: (id: string) => void }) {
  const { t, tr } = useI18n()
  const [ref, near] = useNearViewport<HTMLElement>(false, '600px')
  const state = usePhotoSource(ph, near)
  useEffect(() => {
    if (state.status === 'none') onNone(ph.id)
  }, [state.status, onNone, ph.id])
  if (state.status === 'none') return null
  const item = state.status === 'ready' ? state.res.items[0] : undefined
  const cat = photoCategories.find((c) => c.id === ph.category)
  return (
    <motion.figure
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, delay: (i % 3) * 0.05 }}
      className="group card mb-4 break-inside-avoid overflow-hidden"
    >
      <button type="button" onClick={() => onOpen(ph.id)} className="relative block w-full cursor-zoom-in text-left" aria-label={`${t('photo.open')}: ${tr(ph.title)}`}>
        <div style={{ aspectRatio: aspectCss[ph.aspect === '21:9' ? '16:9' : ph.aspect] }}>
          <RealPhoto photo={ph} className="h-full w-full" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" zoom overlay="bottom" />
        </div>
        {cat && <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{tr(cat.label)}</span>}
      </button>
      <figcaption className="p-4">
        <div className="font-display font-bold leading-snug">{tr(ph.title)}</div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin size={12} className="shrink-0" /> {tr(ph.location)}
        </div>
        <p className="mt-2 text-sm text-muted">{tr(ph.description)}</p>
        {item && (
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-[11px] text-muted hover:text-ink">
            © {item.photographer} · {item.source} · {item.license}
          </a>
        )}
      </figcaption>
    </motion.figure>
  )
}

/** Masonry photo gallery with category filters and lightbox. */
export function PhotoGallery({ items = allPhotos, initial = 'all' }: { items?: Photo[]; initial?: Filter }) {
  const { t, tr } = useI18n()
  const [filter, setFilter] = useState<Filter>(initial)
  const [missing, setMissing] = useState<Set<string>>(() => new Set())
  const open = useLightbox((s) => s.open)
  const onNone = useCallback((id: string) => setMissing((m) => (m.has(id) ? m : new Set(m).add(id))), [])

  const available = useMemo(() => items.filter((x) => !missing.has(x.id)), [items, missing])
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: available.length }
    for (const ph of available) c[ph.category] = (c[ph.category] ?? 0) + 1
    return c
  }, [available])
  const shown = useMemo(() => (filter === 'all' ? available : available.filter((x) => x.category === filter)), [available, filter])
  const ids = shown.map((x) => x.id)

  const chips: { id: Filter; label: string }[] = [{ id: 'all', label: t('common.all') }, ...photoCategories.map((c) => ({ id: c.id, label: tr(c.label) }))]

  return (
    <div>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label={t('gallery.filter')}>
        {chips.map((c) => {
          const active = filter === c.id
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(c.id)}
              className={`relative shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? 'border-transparent text-navy' : 'border-line bg-surface hover:bg-surface-2'}`}
            >
              {active && <motion.span layoutId="gal-chip" className="absolute inset-0 rounded-full bg-glacier" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">
                {c.label} <span className={active ? 'opacity-70' : 'text-muted'}>{counts[c.id] ?? 0}</span>
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={filter} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {shown.map((ph, i) => (
            <GalleryItem key={ph.id} ph={ph} i={i} onOpen={(id) => open(ids, ids.indexOf(id))} onNone={onNone} />
          ))}
        </motion.div>
      </AnimatePresence>
      {!shown.length && <p className="py-10 text-center text-sm text-muted">{t('photo.unavailable')}</p>}
    </div>
  )
}
