import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ExternalLink, MapPin, X } from 'lucide-react'
import { photoById, photoCategories } from '../../data/images'
import { usePhotoSource } from '../../hooks/usePhotoSource'
import { useI18n } from '../../hooks/useI18n'
import { useLightbox } from '../../store/useLightbox'
import { RealPhoto } from './RealPhoto'

/** Global lightbox (mounted once in App). Open it with `useLightbox().open(ids, index)`. */
export function PhotoLightbox() {
  const { t, tr } = useI18n()
  const { ids, index, close, go } = useLightbox()
  const ph = ids.length ? photoById[ids[index]] : undefined
  const state = usePhotoSource(ph, true)
  const item = state.status === 'ready' ? state.res.items[0] : undefined
  const closeRef = useRef<HTMLButtonElement>(null)
  const loc = useLocation()
  useEffect(() => close(), [loc.pathname, close])

  useEffect(() => {
    if (!ph) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [ph, close, go])

  const cat = ph ? photoCategories.find((c) => c.id === ph.category) : undefined

  return (
    <AnimatePresence>
      {ph && (
        <motion.div
          className="fixed inset-0 z-[4000] flex items-center justify-center bg-[#050b14]/92 p-2 backdrop-blur-md md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={tr(ph.title)}
        >
          <motion.figure
            key={ph.id}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-[#0b1424] text-snow shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <RealPhoto photo={ph} className="max-h-[68vh] w-full !bg-black" sizes="100vw" priority fit="contain">
              <div className="pointer-events-none aspect-[16/9] w-full" />
            </RealPhoto>
            <figcaption className="grid gap-3 overflow-y-auto p-4 text-sm md:grid-cols-[1.4fr_1fr] md:p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/60">
                  {cat && <span className="rounded-full bg-white/10 px-2 py-0.5">{tr(cat.label)}</span>}
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {tr(ph.location)}
                  </span>
                </div>
                <h2 className="mt-1.5 font-display text-xl font-bold md:text-2xl">{tr(ph.title)}</h2>
                <p className="mt-1.5 text-white/80">{tr(ph.description)}</p>
                {item?.caption && <p className="mt-2 text-xs italic text-white/55">“{item.caption}”</p>}
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-xs text-white/75">
                {item ? (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt className="text-white/50">{t('photo.author')}</dt>
                    <dd className="font-semibold text-white">{item.photographer}</dd>
                    <dt className="text-white/50">{t('photo.source')}</dt>
                    <dd>
                      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-glacier hover:underline">
                        {item.source} <ExternalLink size={11} />
                      </a>
                    </dd>
                    <dt className="text-white/50">{t('photo.license')}</dt>
                    <dd>
                      {item.licenseUrl ? (
                        <a href={item.licenseUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          {item.license}
                        </a>
                      ) : (
                        item.license
                      )}
                    </dd>
                  </dl>
                ) : (
                  <div>{state.status === 'loading' ? t('common.loading') : t('photo.unavailable')}</div>
                )}
              </div>
            </figcaption>
            <button ref={closeRef} type="button" onClick={close} className="absolute right-3 top-3 z-[2] grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70" aria-label={t('common.close')}>
              <X />
            </button>
            {ids.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-3 top-[34vh] z-[2] grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70" aria-label={t('common.back')}>
                  <ChevronLeft />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute right-3 top-[34vh] z-[2] grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70" aria-label={t('common.next')}>
                  <ChevronRight />
                </button>
                <div className="absolute left-3 top-3 z-[2] rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                  {index + 1} / {ids.length}
                </div>
              </>
            )}
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
