import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, GraduationCap, Maximize, Minimize, X } from 'lucide-react'
import { ClimogramChart } from '../components/charts/ClimateCharts'
import { HeroPhoto } from '../components/media/HeroPhoto'
import { MountainSection } from '../components/interactive/MountainSection'
import { Relief3D } from '../components/interactive/Relief3D'
import { GeoMap } from '../components/map/GeoMap'
import { Legends } from '../components/map/Legends'
import type { Selection } from '../components/map/layers'
import { ThemeSync } from '../components/layout/Layout'
import { Icon } from '../components/ui/Icon'
import { demStats } from '../data/maps'
import { protectReasons } from '../data/lessons/forests'
import { hotspots } from '../data/lessons/relief'
import { riverInfo } from '../data/lessons/geoObjects'
import { useI18n } from '../hooks/useI18n'
import { useAppStore } from '../store/useAppStore'
import type { L } from '../types'

function SlideFrame({ kicker, title, points, children, reverse }: { kicker: string; title: string; points?: L[]; children?: ReactNode; reverse?: boolean }) {
  const { tr } = useI18n()
  return (
    <div className={`mx-auto grid h-full max-w-[1500px] items-center gap-6 px-5 py-6 md:px-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-10 ${reverse ? 'lg:[direction:rtl]' : ''}`}>
      <div className="[direction:ltr]">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-glacier">{kicker}</div>
        <h2 className="mt-2 font-display text-3xl font-bold leading-tight md:text-5xl">{title}</h2>
        {points && (
          <ul className="mt-6 space-y-3 text-base md:text-xl">
            {points.map((p, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.12 }} className="flex gap-3">
                <span className="mt-2.5 size-2.5 shrink-0 rounded-full bg-glacier" />
                <span>{tr(p)}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
      <div className="min-h-0 [direction:ltr]">{children}</div>
    </div>
  )
}

function WaterSlide() {
  const { tr } = useI18n()
  const [sel, setSel] = useState<Selection>({ type: 'river', id: 'naryn' })
  return (
    <div className="space-y-2">
      <GeoMap overlays={['rivers', 'streams', 'lakes', 'glaciers']} selection={sel} onSelect={(s) => s.type === 'river' && setSel(s)} className="h-[52vh]" minimal />
      <div className="flex flex-wrap gap-1.5">
        {riverInfo.slice(0, 6).map((r) => (
          <button key={r.id} type="button" onClick={() => setSel({ type: 'river', id: r.id })} className={`rounded-full px-3 py-1 text-sm font-bold ${sel.id === r.id ? 'bg-glacier text-navy' : 'bg-white/10'}`}>
            {tr(r.name)}
          </button>
        ))}
      </div>
    </div>
  )
}

function ClimateSlide() {
  const { tr } = useI18n()
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(['bishkek', 'tianshan'] as const).map((id) => (
        <div key={id} className="rounded-2xl bg-white/95 p-3 text-navy">
          <div className="mb-1 font-bold">{id === 'bishkek' ? tr({ ru: 'Бишкек, 756 м', ky: 'Бишкек, 756 м' }) : tr({ ru: 'Станция Тянь-Шань, 3639 м', ky: 'Тянь-Шань станциясы, 3639 м' })}</div>
          <ClimogramChart id={id} height={250} />
        </div>
      ))}
    </div>
  )
}

export default function PresentationPage() {
  const { t, tr } = useI18n()
  const nav = useNavigate()
  const done = useAppStore((s) => s.setPresentationDone)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [fs, setFs] = useState(false)
  const [hs, setHs] = useState<string | null>('pobeda')
  const root = useRef<HTMLDivElement>(null)

  const slides: { id: string; render: () => ReactNode; dark?: boolean }[] = [
    {
      id: 'title',
      render: () => (
        <div className="relative grid h-full place-items-center overflow-hidden text-center text-snow">
          <HeroPhoto parallax={false} />
          <div className="relative px-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">
              Kyrgyzstan Geography Explorer
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-gradient mt-4 font-display text-4xl font-bold leading-tight md:text-7xl">
              {t('hero.title')}
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mx-auto mt-6 max-w-3xl text-lg text-white/85 md:text-2xl">
              {t('hero.subtitle')}
            </motion.p>
          </div>
        </div>
      ),
    },
    {
      id: 'position',
      render: () => (
        <SlideFrame
          kicker={`${t('module.label')} 01`}
          title={tr({ ru: 'Географическое положение', ky: 'Географиялык абалы' })}
          points={[
            { ru: 'Северо-восток Центральной Азии, без выхода к морю', ky: 'Борбордук Азиянын түндүк-чыгышы, деңизге чыгуусу жок' },
            { ru: 'Соседи: Казахстан, Узбекистан, Таджикистан, Китай', ky: 'Кошуналары: Казакстан, Өзбекстан, Тажикстан, Кытай' },
            { ru: '199,9 тыс. км², 7 областей; столица — Бишкек', ky: '199,9 миң км², 7 облус; борбору — Бишкек' },
            { ru: `${String(demStats.share_above['1000']).replace('.', ',')} % территории выше 1000 м (ЦМР)`, ky: `Аймактын ${String(demStats.share_above['1000']).replace('.', ',')} % 1000 мден жогору (РСМ)` },
          ]}
        >
          <GeoMap overlays={['admin', 'cities', 'lakes']} regionFill className="h-[58vh]" minimal />
        </SlideFrame>
      ),
    },
    {
      id: 'relief',
      render: () => (
        <SlideFrame
          kicker={`${t('module.label')} 02`}
          title={tr({ ru: 'Рельеф', ky: 'Рельеф' })}
          points={[
            { ru: 'Тянь-Шань и Памиро-Алай; пик Победы — 7439 м', ky: 'Тянь-Шань жана Памир-Алай; Жеңиш чокусу — 7439 м' },
            { ru: 'Тектоника: хребты — поднятия, котловины — опускания', ky: 'Тектоника: кыркалар — көтөрүлүүлөр, ойдуңдар — чөгүүлөр' },
            { ru: 'Ледники, эрозия и сели продолжают менять рельеф', ky: 'Мөңгүлөр, эрозия жана селдер рельефти өзгөртө берет' },
          ]}
        >
          <Relief3D hotspots={hotspots} active={hs} onPick={setHs} />
        </SlideFrame>
      ),
    },
    {
      id: 'climate',
      render: () => (
        <SlideFrame
          kicker={`${t('module.label')} 03`}
          title={tr({ ru: 'Климат', ky: 'Климат' })}
          points={[
            { ru: 'Резко континентальный, сухой, солнечный', ky: 'Кескин континенттик, кургак, күн ачык' },
            { ru: 'С высотой холоднее ≈0,6 °C на 100 м', ky: 'Бийиктеген сайын 100 мге ≈0,6 °C суугураак' },
            { ru: 'Осадков от ≈200 мм (Чатыр-Куль) до 460+ мм (Джалал-Абад)', ky: 'Жаан-чачын ≈200 мм (Чатыр-Көл) — 460+ мм (Жалал-Абад)' },
          ]}
        >
          <ClimateSlide />
        </SlideFrame>
      ),
    },
    {
      id: 'water',
      render: () => (
        <SlideFrame
          kicker={`${t('module.label')} 04`}
          title={tr({ ru: 'Водные ресурсы', ky: 'Суу ресурстары' })}
          points={[
            { ru: '«Водонапорная башня» Центральной Азии', ky: 'Борбордук Азиянын «суу мунарасы»' },
            { ru: 'Нарын + Кара-Дарья = Сыр-Дарья', ky: 'Нарын + Кара-Дарыя = Сыр-Дарыя' },
            { ru: 'Иссык-Куль — бессточное незамерзающее озеро', ky: 'Ысык-Көл — агымсыз, тоңбогон көл' },
            { ru: 'Питание рек — ледники и снега', ky: 'Дарыялардын азыгы — мөңгүлөр жана карлар' },
          ]}
        >
          <WaterSlide />
        </SlideFrame>
      ),
    },
    {
      id: 'vegetation',
      render: () => (
        <SlideFrame kicker={`${t('module.label')} 05`} title={tr({ ru: 'Растительный покров', ky: 'Өсүмдүктөр дүйнөсү' })}>
          <div className="max-h-[78vh] overflow-y-auto rounded-2xl bg-surface-solid text-ink">
            <MountainSection initial={2400} />
          </div>
        </SlideFrame>
      ),
    },
    {
      id: 'forests',
      render: () => (
        <SlideFrame
          kicker={`${t('module.label')} 06`}
          title={tr({ ru: 'Леса Кыргызстана', ky: 'Кыргызстандын токойлору' })}
          points={[
            { ru: 'Арча — юг, сухие склоны, 1500–3600 м', ky: 'Арча — түштүк, кургак капталдар, 1500–3600 м' },
            { ru: 'Ель Шренка — северные склоны вокруг Иссык-Куля', ky: 'Шренк карагайы — Ысык-Көлдүн айланасындагы түндүк капталдар' },
            { ru: 'Пихта Семёнова — редкий эндемик Запада', ky: 'Семенов май карагайы — Батыштын сейрек эндемиги' },
            { ru: 'Орехоплодовые леса — Арсланбоб', ky: 'Жаңгак-мөмө токойлору — Арстанбап' },
          ]}
        >
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <GeoMap base="none" overlays={['forests', 'sites', 'lakes']} className="h-[58vh]" minimal />
            <div className="hidden text-ink md:block">
              <Legends overlays={['forests']} />
            </div>
          </div>
        </SlideFrame>
      ),
    },
    {
      id: 'ecology',
      render: () => (
        <SlideFrame kicker={t('forest.why')} title={tr({ ru: 'Экологическое значение', ky: 'Экологиялык мааниси' })}>
          <div className="grid gap-3 sm:grid-cols-2">
            {protectReasons.map((r, k) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.1 }} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <Icon name={r.icon} className="text-mountain" size={28} />
                <div className="mt-2 font-display text-lg font-bold">{tr(r.title)}</div>
                <p className="mt-1 text-sm text-white/80">{tr(r.text)}</p>
              </motion.div>
            ))}
          </div>
        </SlideFrame>
      ),
    },
    {
      id: 'summary',
      render: () => (
        <SlideFrame
          kicker={tr({ ru: 'Итоги', ky: 'Жыйынтык' })}
          title={tr({ ru: 'Что мы узнали', ky: 'Эмнелерди билдик' })}
          points={[
            { ru: 'Кыргызстан — горная страна: рельеф определяет всё остальное', ky: 'Кыргызстан — тоолуу өлкө: рельеф калганынын баарын аныктайт' },
            { ru: 'Высота управляет климатом и поясами растительности', ky: 'Бийиктик климатты жана өсүмдүк алкактарын башкарат' },
            { ru: 'Ледники и реки — богатство для всего региона', ky: 'Мөңгүлөр жана дарыялар — бүт аймактын байлыгы' },
            { ru: 'Леса малы по площади, но бесценны — их нужно беречь', ky: 'Токойлордун аянты аз, бирок баа жеткис — аларды сактоо керек' },
          ]}
        >
          <GeoMap overlays={['rivers', 'lakes', 'ridges', 'peaks', 'glaciers']} className="h-[58vh]" minimal />
        </SlideFrame>
      ),
    },
    {
      id: 'test',
      render: () => (
        <div className="grid h-full place-items-center px-6 text-center">
          <div>
            <GraduationCap size={72} className="mx-auto text-amber-300" />
            <h2 className="mt-4 font-display text-4xl font-bold md:text-6xl">{t('quiz.title')}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{t('quiz.final.lead')}</p>
            <Link to="/quiz/final" className="mt-8 inline-flex rounded-full bg-amber-300 px-8 py-4 text-lg font-bold text-navy">
              {t('pres.toQuiz')}
            </Link>
          </div>
        </div>
      ),
    },
  ]
  const n = slides.length

  const go = useCallback(
    (k: number) => {
      const nk = Math.max(0, Math.min(n - 1, k))
      setDir(nk > i ? 1 : -1)
      setI(nk)
    },
    [i, n],
  )

  useEffect(() => {
    if (i === n - 1) done()
  }, [i, n, done])

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen()
    else root.current?.requestFullscreen?.().catch(() => undefined)
  }, [])

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        go(i + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(i - 1)
      else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(n - 1)
      else if (e.key.toLowerCase() === 'f') toggleFs()
      else if (e.key === 'Escape' && !document.fullscreenElement) nav('/')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFs)
    }
  }, [go, i, n, nav, toggleFs])

  // swipe
  const touch = useRef<number | null>(null)

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[4000] flex flex-col bg-[radial-gradient(ellipse_at_top,#173455,#08111e_70%)] text-snow"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        const target = e.target as HTMLElement
        if (Math.abs(dx) > 70 && !target.closest('.leaflet-container,canvas,svg,input')) go(i + (dx < 0 ? 1 : -1))
        touch.current = null
      }}
    >
      <ThemeSync />
      <div className="h-1 w-full bg-white/10">
        <motion.div className="h-full bg-gradient-to-r from-glacier to-mountain" animate={{ width: `${((i + 1) / n) * 100}%` }} />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slides[i].id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 80, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: dir * -80, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 overflow-y-auto"
          >
            {slides[i].render()}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 bg-navy/60 px-3 py-2 backdrop-blur md:px-6">
        <Link to="/" className="flex items-center gap-1 rounded-full px-3 py-2 text-sm hover:bg-white/10" aria-label={t('pres.exit')}>
          <X size={18} /> <span className="hidden sm:inline">{t('pres.exit')}</span>
        </Link>
        <div className="hidden text-xs text-white/50 lg:block">{t('pres.keys')}</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden gap-1 sm:flex">
            {slides.map((s, k) => (
              <button key={s.id} type="button" onClick={() => go(k)} aria-label={`${t('pres.slide')} ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-glacier' : 'w-2 bg-white/30 hover:bg-white/60'}`} />
            ))}
          </div>
          <span className="min-w-14 text-center text-sm font-bold tabular-nums">
            {i + 1} / {n}
          </span>
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30" aria-label={t('pres.prev')}>
            <ChevronLeft />
          </button>
          <button type="button" onClick={() => go(i + 1)} disabled={i === n - 1} className="grid size-10 place-items-center rounded-full bg-glacier text-navy hover:brightness-110 disabled:opacity-30" aria-label={t('pres.next')}>
            <ChevronRight />
          </button>
          <button type="button" onClick={toggleFs} className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={t('pres.fullscreen')} title={t('pres.fullscreen')}>
            {fs ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
