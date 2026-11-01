import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Thermometer } from 'lucide-react'
import { belts, southShift, type Belt } from '../../data/lessons/vegetation'
import { useI18n } from '../../hooks/useI18n'
import { RealPhoto } from '../media/RealPhoto'
import { beltPhotos } from '../../data/images'

const MAX = 7000
const MIN = 400
const VB_H = 420
const yOf = (h: number) => VB_H - ((h - MIN) / (MAX - MIN)) * (VB_H - 20)

export function beltAt(h: number, south: boolean): Belt {
  const s = south ? southShift : 0
  return belts.find((b, i) => (i === belts.length - 1 ? true : h < b.to + s)) ?? belts[0]
}

/** Interactive vertical section of a mountain with altitudinal vegetation belts. */
export function MountainSection({ initial = 2300 }: { initial?: number }) {
  const { t, tr } = useI18n()
  const [h, setH] = useState(initial)
  const [south, setSouth] = useState(false)
  const s = south ? southShift : 0
  const belt = beltAt(h, south)

  // mountain profile: x(y) half-width shrinking with altitude
  const profile = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 60; i++) {
      const alt = MIN + ((MAX - MIN) * i) / 60
      const w = 300 * Math.pow(1 - (alt - MIN) / (MAX - MIN), 0.85) + Math.sin(i * 1.7) * 6
      pts.push(`${300 - w},${yOf(alt)}`)
    }
    for (let i = 60; i >= 0; i--) {
      const alt = MIN + ((MAX - MIN) * i) / 60
      const w = 300 * Math.pow(1 - (alt - MIN) / (MAX - MIN), 0.85) + Math.cos(i * 1.3) * 6
      pts.push(`${300 + w},${yOf(alt)}`)
    }
    return pts.join(' ')
  }, [])

  // approximate air temperature (lapse 0.6°/100 m) for July & January from Bishkek normals (756 m)
  const tJul = 25.6 - ((h - 756) * 0.6) / 100
  const tJan = -2.6 - ((h - 756) * 0.45) / 100

  return (
    <div className="card overflow-hidden">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="relative p-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => setSouth(false)} className={`rounded-full px-3 py-1 text-xs font-bold ${!south ? 'bg-mountain text-white' : 'bg-surface-2'}`}>
              {t('veg.north')}
            </button>
            <button type="button" onClick={() => setSouth(true)} className={`rounded-full px-3 py-1 text-xs font-bold ${south ? 'bg-mountain text-white' : 'bg-surface-2'}`}>
              {t('veg.south')}
            </button>
          </div>
          <svg
            viewBox={`0 0 600 ${VB_H}`}
            className="w-full cursor-pointer touch-none select-none"
            onPointerDown={(e) => {
              const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
              const y = ((e.clientY - r.top) / r.height) * VB_H
              const alt = MIN + ((VB_H - y) / (VB_H - 20)) * (MAX - MIN)
              setH(Math.round(Math.max(MIN, Math.min(MAX, alt)) / 50) * 50)
            }}
            role="img"
            aria-label={t('veg.drag')}
          >
            <defs>
              <clipPath id="ms-clip">
                <polygon points={profile} />
              </clipPath>
              <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#5f8fc2" stopOpacity="0.35" />
                <stop offset="1" stopColor="#cfe4ef" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <rect width="600" height={VB_H} fill="url(#ms-sky)" />
            <g clipPath="url(#ms-clip)">
              {belts.map((b, i) => {
                const from = i === 0 ? MIN : b.from + s
                const to = i === belts.length - 1 ? MAX : b.to + s
                return <rect key={b.id} x="0" y={yOf(to)} width="600" height={yOf(from) - yOf(to)} fill={b.color} opacity={belt.id === b.id ? 1 : 0.75} />
              })}
            </g>
            <polygon points={profile} fill="none" stroke="rgba(0,0,0,.25)" />
            {[1000, 2000, 3000, 4000, 5000, 6000, 7000].map((a) => (
              <g key={a}>
                <line x1="0" x2="34" y1={yOf(a)} y2={yOf(a)} stroke="currentColor" strokeOpacity="0.3" />
                <text x="2" y={yOf(a) - 3} fontSize="10" fill="currentColor" opacity="0.6">
                  {a} {t('common.m')}
                </text>
              </g>
            ))}
            {belts.slice(0, -1).map((b) => (
              <text key={b.id} x="590" y={yOf(b.to + s) + 12} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.55">
                {b.to + s}
              </text>
            ))}
            <motion.g animate={{ y: yOf(h) }} transition={{ type: 'spring', stiffness: 200, damping: 25 }}>
              <line x1="30" x2="600" y1="0" y2="0" stroke="#ffd166" strokeWidth="2.5" strokeDasharray="6 4" />
              <rect x="470" y="-24" width="122" height="20" rx="10" fill="#ffd166" />
              <text x="531" y="-10" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0b1424">
                {h} {t('common.m')}
              </text>
            </motion.g>
          </svg>
          <label className="mt-2 flex items-center gap-3 text-sm">
            <span className="font-bold">{t('veg.altitude')}</span>
            <input className="veg-range flex-1" type="range" min={MIN} max={MAX} step={50} value={h} onChange={(e) => setH(+e.target.value)} aria-label={t('veg.altitude')} />
          </label>
          <p className="mt-1 text-xs text-muted">{t('veg.drag')}</p>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={belt.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="border-t border-line md:border-l md:border-t-0">
            <div className="relative">
              <RealPhoto id={beltPhotos[belt.id]} scene={belt.scene} seed={`belt-${belt.id}`} className="aspect-[16/8] w-full" lightbox={Object.values(beltPhotos)} credit zoom />
            </div>
            <div className="space-y-3 p-5">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('veg.belt')}</div>
                <h3 className="font-display text-xl font-bold" style={{ color: belt.id === 'nival' ? undefined : belt.color }}>
                  {tr(belt.name)}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <div className="text-[11px] font-bold text-muted">{t('veg.range')}</div>
                  <div className="font-bold">
                    {belt.id === 'desert' ? `< ${belt.to + s}` : belt.id === 'nival' ? `> ${belt.from + s}` : `${belt.from + s}–${belt.to + s}`} {t('common.m')}
                  </div>
                </div>
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-muted">
                    <Thermometer size={12} /> VII / I ≈
                  </div>
                  <div className="font-bold">
                    {tJul > 0 ? '+' : ''}
                    {tJul.toFixed(0)}° / {tJan.toFixed(0)}°
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('veg.plants')}</div>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {belt.plants.map((p) => (
                    <li key={p.ru} className="rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold">
                      {tr(p)}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('veg.climate')}</div>
                <p className="text-sm">{tr(belt.climate)}</p>
              </div>
              <p className="text-sm text-muted">{tr(belt.text)}</p>
              <p className="text-[10px] text-muted">
                {tr({ ru: 'Температура — оценка: нормы Бишкека (GHCN, 1991–2020) с вертикальным градиентом ≈0,6 °C/100 м (лето) и ≈0,45 °C/100 м (зима).', ky: 'Температура — баалоо: Бишкектин нормалары (GHCN, 1991–2020) ≈0,6 °C/100 м (жай) жана ≈0,45 °C/100 м (кыш) вертикалдык градиент менен.' })}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
