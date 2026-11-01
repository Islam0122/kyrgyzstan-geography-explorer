import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookA, FileText, MapPin, Search } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { FavButton } from '../ui/FavButton'
import { searchItems } from './searchIndex'

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, tr, lang } = useI18n()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const nav = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchItems(q, lang), [q, lang])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => input.current?.focus(), 30)
    }
  }, [open])

  const go = (to: string) => {
    onClose()
    nav(to)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[3000] flex items-start justify-center bg-navy/60 p-3 pt-[10vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('header.search')}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface-solid shadow-2xl"
            initial={{ y: -16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -16, opacity: 0 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="text-muted" />
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose()
                  if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, results.length - 1))
                  if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
                  if (e.key === 'Enter' && results[active]) go(results[active].to)
                }}
                placeholder={t('search.placeholder')}
                className="h-14 flex-1 bg-transparent text-base outline-none"
              />
              <kbd className="hidden rounded border border-line px-1.5 text-[10px] text-muted sm:block">Esc</kbd>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {q && results.length === 0 && <li className="p-6 text-center text-sm text-muted">{t('search.empty')}</li>}
              {results.map((r, i) => (
                <li key={r.key}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => go(r.to)}
                    onKeyDown={(e) => e.key === 'Enter' && go(r.to)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? 'bg-surface-2' : ''}`}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-glacier">
                      {r.group === 'places' ? <MapPin size={16} /> : r.group === 'terms' ? <BookA size={16} /> : <FileText size={16} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{tr(r.title)}</span>
                      <span className="block truncate text-xs text-muted">
                        {t(r.group === 'places' ? 'search.places' : r.group === 'terms' ? 'search.terms' : 'search.pages')}
                        {r.sub && r.group !== 'places' ? ` · ${tr(r.sub)}` : ''}
                      </span>
                    </span>
                    {r.group === 'places' && <FavButton id={r.key} />}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
