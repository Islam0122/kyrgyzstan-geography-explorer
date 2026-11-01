import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { Award, BookA, BookMarked, ClipboardCheck, GraduationCap, Home, Images, Map, Presentation, Star, X } from 'lucide-react'
import { modules } from '../../data/lessons/modules'
import { useI18n } from '../../hooks/useI18n'
import { useProgress } from '../../hooks/useProgress'
import { Icon } from '../ui/Icon'
import { ProgressRing } from '../ui/ProgressRing'
import { Logo } from './Header'

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, tr } = useI18n()
  const { perModule, coursePct } = useProgress()
  const item = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink'}`
  const tools = [
    { to: '/', icon: Home, label: t('nav.home'), end: true },
    { to: '/atlas', icon: Map, label: t('nav.atlas') },
    { to: '/presentation', icon: Presentation, label: t('nav.presentation') },
    { to: '/quiz', icon: ClipboardCheck, label: t('nav.quiz') },
    { to: '/quiz/final', icon: GraduationCap, label: t('nav.exam') },
  ]
  const more = [
    { to: '/glossary', icon: BookA, label: t('nav.glossary') },
    { to: '/gallery', icon: Images, label: t('nav.gallery') },
    { to: '/favorites', icon: Star, label: t('nav.favorites') },
    { to: '/progress', icon: Award, label: t('nav.progress') },
    { to: '/sources', icon: BookMarked, label: t('nav.sources') },
  ]
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[1500] bg-navy/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="fixed inset-y-0 left-0 z-[1600] flex w-[88vw] max-w-[330px] flex-col overflow-y-auto border-r border-line bg-surface-solid p-4"
            initial={{ x: -340 }}
            animate={{ x: 0 }}
            exit={{ x: -340 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            aria-label={t('nav.menu')}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo />
                <span className="font-display text-sm font-bold">Explorer</span>
              </div>
              <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl hover:bg-surface-2" aria-label={t('nav.close')}>
                <X size={19} />
              </button>
            </div>
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
              <ProgressRing value={coursePct / 100} size={48} />
              <div className="text-sm">
                <div className="font-bold">{t('prog.course')}</div>
                <div className="text-muted">{coursePct}%</div>
              </div>
            </div>
            <nav className="space-y-0.5" onClick={onClose}>
              {tools.map((x) => (
                <NavLink key={x.to} to={x.to} end={x.end} className={item}>
                  <x.icon size={18} /> {x.label}
                </NavLink>
              ))}
              <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted">{t('nav.modules')}</div>
              {modules.map((m) => (
                <NavLink key={m.id} to={m.path} className={item}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: m.accent }}>
                    <Icon name={m.icon} size={15} />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-[10px] text-muted">{m.num}</span>
                    <span className="line-clamp-2">{tr(m.title)}</span>
                  </span>
                  <span className="text-[10px] font-bold text-muted">{Math.round(perModule[m.id].pct * 100)}%</span>
                </NavLink>
              ))}
              <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wider text-muted">{t('nav.tools')}</div>
              {more.map((x) => (
                <NavLink key={x.to} to={x.to} className={item}>
                  <x.icon size={18} /> {x.label}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
