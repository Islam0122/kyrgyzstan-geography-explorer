import { motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Compass, Lightbulb, MapPin, MonitorPlay, Sparkles } from 'lucide-react'
import { HeroCredit, HeroPhoto } from '../components/media/HeroPhoto'
import { RealPhoto } from '../components/media/RealPhoto'
import { KgOutline } from '../components/map/KgOutline'
import { Icon } from '../components/ui/Icon'
import { ProgressRing } from '../components/ui/ProgressRing'
import { Reveal } from '../components/ui/Reveal'
import { funFacts, headlineStats } from '../data/facts'
import { modules } from '../data/lessons/modules'
import { HOME_HERO_STRIP, modulePhotos, photoById } from '../data/images'
import { useAppStore } from '../store/useAppStore'
import { useI18n } from '../hooks/useI18n'
import { useProgress } from '../hooks/useProgress'

const HomeMap = lazy(() => import('../components/map/HomeMap'))

function SectionTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <Reveal className="mb-8 max-w-3xl">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {lead && <p className="mt-3 text-muted md:text-lg">{lead}</p>}
    </Reveal>
  )
}

export default function HomePage() {
  const { t, tr, lang } = useI18n()
  const setLang = useAppStore((s) => s.setLang)
  const nav = useNavigate()
  const prog = useProgress()
  const [fact, setFact] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setFact((f) => (f + 1) % funFacts.length), 7000)
    return () => clearInterval(id)
  }, [])
  const nextModule = modules.find((m) => !prog.perModule[m.id].done) ?? modules[0]

  return (
    <>
      {/* HERO */}
      <section className="relative -mt-16 flex min-h-[100svh] items-center overflow-hidden pt-16 text-snow">
        <HeroPhoto />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 md:px-8 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                <Sparkles size={14} className="text-amber-300" /> {t('hero.badge')}
              </span>
              <span className="inline-flex rounded-full border border-white/20 bg-black/25 p-0.5 text-xs font-bold backdrop-blur" role="group" aria-label="RU / KY">
                {(['ru', 'ky'] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} className={`rounded-full px-3 py-1 transition ${lang === l ? 'bg-white text-navy' : 'text-white/80 hover:text-white'}`}>
                    {l === 'ru' ? 'RU' : 'KY'}
                  </button>
                ))}
              </span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }} className="font-display text-4xl font-bold leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,.45)] sm:text-5xl md:text-6xl xl:text-[5.25rem]">
              {t('hero.title')}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-6 max-w-2xl text-lg text-white/90 drop-shadow md:text-xl">
              {t('hero.subtitle')}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }} className="mt-8 flex flex-wrap gap-3">
              <Link to="/geography" className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-bold text-navy shadow-xl transition hover:scale-[1.03]">
                <Compass size={20} /> {t('hero.start')}
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link to="/presentation" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 font-bold backdrop-blur transition hover:bg-white/20">
                <MonitorPlay size={20} /> {t('hero.present')}
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-10 hidden max-w-xl grid-cols-3 gap-3 sm:grid">
              {HOME_HERO_STRIP.map((id) => (
                <div key={id} className="overflow-hidden rounded-2xl border border-white/15 shadow-xl">
                  <RealPhoto id={id} className="aspect-[4/3] w-full" sizes="240px" lightbox={HOME_HERO_STRIP} zoom overlay="bottom">
                    <span className="pointer-events-none absolute bottom-1.5 left-2.5 right-2 truncate text-xs font-bold text-white">{tr(photoById[id].title)}</span>
                  </RealPhoto>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.4 }} className="rounded-3xl border border-white/15 bg-navy/30 p-4 pt-10 backdrop-blur-md md:p-6 md:pt-12">
            <KgOutline onPick={(id) => nav(`/atlas?sel=region:${id}`)} />
            <div className="mt-3 flex items-center justify-between text-xs text-white/70">
              <span>39°11′–43°16′ N · 69°14′–80°15′ E</span>
              <Link to="/atlas" className="font-bold text-white hover:underline">
                {t('nav.atlas')} →
              </Link>
            </div>
          </motion.div>
        </div>
        <a href="#modules" className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-xs text-white/70" aria-label={t('hero.scroll')}>
          {t('hero.scroll')}
          <ChevronDown className="animate-bounce" />
        </a>
        <HeroCredit className="absolute bottom-3 right-4 hidden sm:block" />
      </section>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* MODULES */}
        <section id="modules" className="scroll-mt-20 py-16 md:py-24">
          <SectionTitle title={t('home.modules')} lead={t('home.modules.lead')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => {
              const p = prog.perModule[m.id]
              return (
                <Reveal key={m.id} delay={i * 0.06}>
                  <Link
                    to={m.path}
                    className="group relative isolate flex h-full min-h-[400px] flex-col justify-between overflow-hidden rounded-[1.4rem] border border-white/10 text-white shadow-[0_18px_40px_-18px_rgba(5,11,20,.6)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-20px_rgba(5,11,20,.75)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-glacier active:scale-[0.985] md:min-h-[440px]"
                  >
                    <RealPhoto id={modulePhotos[m.id].card} className="!absolute inset-0 -z-10" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" zoom overlay="card" />
                    <div className="flex items-start justify-between p-5">
                      <span className="font-display text-5xl font-bold leading-none tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,.5)]">{m.num}</span>
                      <span className="grid size-11 place-items-center rounded-2xl text-white shadow-lg ring-1 ring-white/25" style={{ background: m.accent }}>
                        <Icon name={m.icon} />
                      </span>
                    </div>
                    <div className="p-5 pt-0">
                      <div className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{tr(photoById[modulePhotos[m.id].card].location)}</span>
                      </div>
                      <h3 className="font-display text-xl font-bold leading-snug drop-shadow">{tr(m.title)}</h3>
                      <p className="mt-2 line-clamp-3 text-sm text-white/80">{tr(m.lead)}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p.pct * 100}%`, background: m.accent }} />
                        </div>
                        <span className="text-xs font-bold text-white/85">{Math.round(p.pct * 100)}%</span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* MAP */}
        <section className="py-10 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle title={t('home.map')} lead={t('home.map.lead')} />
            <Link to="/atlas" className="mb-8 inline-flex items-center gap-2 rounded-full bg-glacier px-5 py-2.5 text-sm font-bold text-navy">
              {t('home.map.open')} <ArrowRight size={16} />
            </Link>
          </div>
          <Reveal>
            <Suspense fallback={<div className="card h-[440px] animate-pulse" />}>
              <HomeMap />
            </Suspense>
          </Reveal>
        </section>

        {/* STATS */}
        <section className="py-16 md:py-24">
          <SectionTitle title={t('home.stats')} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {headlineStats.map((s, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="card h-full p-5">
                  <div className="font-display text-3xl font-bold text-glacier">
                    {s.value}
                    <span className="ml-1 text-base text-muted">{tr(s.unit)}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{tr(s.label)}</div>
                  <div className="mt-1 text-[11px] text-muted">{tr(s.note)}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FACTS + PROGRESS */}
        <section className="grid gap-6 pb-24 lg:grid-cols-2">
          <Reveal>
            <div className="card relative h-full overflow-hidden p-6 md:p-8">
              <div className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
                <Lightbulb className="text-amber-400" /> {t('home.facts')}
              </div>
              <motion.p key={fact} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="min-h-[96px] text-lg leading-relaxed">
                {tr(funFacts[fact].text)}
              </motion.p>
              <div className="mt-6 flex items-center gap-1.5">
                {funFacts.map((_, i) => (
                  <button key={i} type="button" onClick={() => setFact(i)} aria-label={`${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === fact ? 'w-8 bg-amber-400' : 'w-3 bg-line'}`} />
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card h-full p-6 md:p-8">
              <div className="font-display text-xl font-bold">{t('home.progress')}</div>
              <p className="mt-1 text-sm text-muted">{t('home.progress.lead')}</p>
              <div className="mt-5 flex items-center gap-5">
                <ProgressRing value={prog.coursePct / 100} size={92} stroke={9} />
                <div>
                  <div className="text-sm text-muted">{t('prog.level')} {prog.level.level}</div>
                  <div className="font-display text-xl font-bold">{t(prog.level.key)}</div>
                  <div className="text-sm font-semibold text-amber-500">{prog.xp} XP</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {prog.badges.map((b) => (
                  <span key={b.id} title={t(b.desc)} className={`grid size-10 place-items-center rounded-xl border ${b.got ? 'border-amber-400/60 bg-amber-400/15 text-amber-500' : 'border-line text-muted opacity-50'}`}>
                    <Icon name={b.icon} size={18} />
                  </span>
                ))}
              </div>
              <Link to={nextModule.path} className="mt-6 inline-flex items-center gap-2 rounded-full bg-mountain px-5 py-2.5 text-sm font-bold text-white">
                {t('home.continue')}: {tr(nextModule.title)} <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  )
}
