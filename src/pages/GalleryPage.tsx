import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { Scene } from '../components/ui/Scene'
import { gallery } from '../data/gallery'
import { moduleById } from '../data/lessons/modules'
import { useI18n } from '../hooks/useI18n'

export default function GalleryPage() {
  const { t, tr } = useI18n()
  const [open, setOpen] = useState<string | null>(null)
  const item = gallery.find((g) => g.id === open)
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('gallery.title')}</h1>
      <p className="mt-2 text-muted">{t('gallery.lead')}</p>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {gallery.map((g, i) => (
          <motion.button
            key={g.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 3) * 0.06 }}
            onClick={() => setOpen(g.id)}
            className="group card mb-4 block w-full break-inside-avoid overflow-hidden text-left"
          >
            {g.photo ? (
              <img src={g.photo.src} alt={tr(g.title)} className={`w-full object-cover ${i % 3 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`} loading="lazy" />
            ) : (
              <Scene kind={g.scene} seed={`gal-${g.id}`} className={`w-full transition duration-700 group-hover:scale-105 ${i % 3 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`} />
            )}
            <div className="p-4">
              <div className="font-display font-bold">{tr(g.title)}</div>
              <div className="text-sm text-muted">{tr(g.caption)}</div>
            </div>
          </motion.button>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">{t('gallery.note')}</p>
      <AnimatePresence>
        {item && (
          <motion.div className="fixed inset-0 z-[3000] grid place-items-center bg-navy/85 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.figure initial={{ scale: 0.94 }} animate={{ scale: 1 }} className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-surface-solid" onClick={(e) => e.stopPropagation()}>
              <Scene kind={item.scene} seed={`gal-${item.id}`} className="aspect-[16/9] w-full" animated />
              <figcaption className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div>
                  <div className="font-display text-lg font-bold">{tr(item.title)}</div>
                  <div className="text-sm text-muted">
                    {tr(item.caption)} · {t('common.illustration')}
                  </div>
                </div>
                <Link to={moduleById[item.module].path} className="rounded-full bg-glacier px-4 py-2 text-sm font-bold text-navy">
                  {t('module.label')} {moduleById[item.module].num}
                </Link>
              </figcaption>
              <button type="button" onClick={() => setOpen(null)} className="glass absolute right-3 top-3 grid size-10 place-items-center rounded-full" aria-label={t('common.close')}>
                <X />
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
