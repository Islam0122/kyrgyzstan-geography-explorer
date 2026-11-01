import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { useProgress } from '../../hooks/useProgress'
import type { ModuleMeta } from '../../types'
import { Icon } from './Icon'
import { ProgressRing } from './ProgressRing'
import { Scene } from './Scene'

export function ModuleHero({ m }: { m: ModuleMeta }) {
  const { t, tr } = useI18n()
  const p = useProgress().perModule[m.id]
  return (
    <header className="relative overflow-hidden rounded-b-[2rem] text-snow">
      <div className="absolute inset-0">
        <Scene kind={m.scene} seed={`hero-${m.id}`} className="kenburns h-full w-full" animated />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/20" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 md:px-8 md:pb-14 md:pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
            <Icon name={m.icon} size={14} />
            {t('module.label')} {m.num}
          </div>
          <h1 className="max-w-4xl font-display text-3xl font-bold leading-tight md:text-5xl">{tr(m.title)}</h1>
          <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">{tr(m.lead)}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 backdrop-blur">
              <ProgressRing value={p.pct} size={46} stroke={5} color={m.accent} />
              <div className="text-sm">
                <div className="font-bold">{t('module.progress')}</div>
                <div className="text-white/70">
                  {p.read}/{p.total} {t('module.learned')}
                </div>
              </div>
            </div>
            <Link to={`/quiz/${m.id}`} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy transition hover:scale-[1.03]">
              <ClipboardCheck size={18} /> {t('module.test')}
            </Link>
          </div>
        </motion.div>
        <nav className="mt-8 flex gap-2 overflow-x-auto pb-1" aria-label={t('module.sections')}>
          {m.sections.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur hover:bg-white/15">
              {i + 1}. {tr(s.title)}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
