import { motion } from 'framer-motion'
import { useState } from 'react'
import { forestTypes, type ForestType } from '../../data/lessons/forests'
import { useI18n } from '../../hooks/useI18n'

const MIN = 600
const MAX = 4000
const H = 380
const y = (a: number) => H - ((a - MIN) / (MAX - MIN)) * (H - 20)

/** Two slopes side by side: north-facing (spruce, fir) and south-facing (walnut, juniper). */
export function ForestBelts() {
  const { t, tr } = useI18n()
  const [act, setAct] = useState<ForestType['id']>('spruce')
  const f = forestTypes.find((x) => x.id === act)!
  // which side each type is drawn on
  const side: Record<ForestType['id'], 'N' | 'S' | 'both'> = { spruce: 'N', fir: 'N', walnut: 'S', juniper: 'S', deciduous: 'both' }
  const band = (ft: ForestType) => {
    const xs = side[ft.id] === 'N' ? [40, 290] : side[ft.id] === 'S' ? [310, 560] : [40, 560]
    const shift = ft.id === 'fir' ? 40 : 0
    const w = ft.id === 'deciduous' ? 22 : undefined
    return { x: xs[0] + shift, w: w ?? xs[1] - xs[0] - shift * 2, from: ft.from, to: ft.to }
  }
  return (
    <div className="card grid overflow-hidden md:grid-cols-[1.2fr_1fr]">
      <div className="p-4">
        <svg viewBox={`0 0 600 ${H}`} className="w-full">
          <text x="165" y="16" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor">
            {tr({ ru: 'Северный склон (тень)', ky: 'Түндүк каптал (көлөкө)' })}
          </text>
          <text x="435" y="16" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor">
            {tr({ ru: 'Южный склон (солнце)', ky: 'Түштүк каптал (күн)' })}
          </text>
          <line x1="300" x2="300" y1="24" y2={H} stroke="currentColor" strokeOpacity="0.2" />
          {[1000, 2000, 3000, 4000].map((a) => (
            <g key={a}>
              <line x1="0" x2="600" y1={y(a)} y2={y(a)} stroke="currentColor" strokeOpacity="0.12" />
              <text x="2" y={y(a) - 3} fontSize="10" fill="currentColor" opacity="0.6">
                {a} {t('common.m')}
              </text>
            </g>
          ))}
          {forestTypes.map((ft) => {
            const b = band(ft)
            const on = ft.id === act
            const draw = (x: number, w: number) => (
              <motion.rect
                key={`${ft.id}-${x}`}
                x={x}
                y={y(b.to)}
                width={w}
                height={y(b.from) - y(b.to)}
                rx={8}
                fill={ft.color}
                initial={false}
                animate={{ opacity: on ? 0.95 : 0.35 }}
                stroke={on ? '#ffd166' : 'none'}
                strokeWidth={3}
                className="cursor-pointer"
                onClick={() => setAct(ft.id)}
              />
            )
            return ft.id === 'deciduous' ? (
              <g key={ft.id}>
                {draw(280, 40)}
              </g>
            ) : (
              <g key={ft.id}>{draw(b.x, b.w)}</g>
            )
          })}
          {forestTypes.map((ft) => {
            const b = band(ft)
            const cx = ft.id === 'deciduous' ? 300 : b.x + b.w / 2
            return (
              <text key={ft.id} x={cx} y={(y(b.to) + y(b.from)) / 2 + 4} textAnchor="middle" fontSize={ft.id === 'deciduous' ? 9 : 12} fontWeight="800" fill="#0b1424" className="pointer-events-none" transform={ft.id === 'deciduous' ? `rotate(-90 ${cx} ${(y(b.to) + y(b.from)) / 2})` : undefined}>
                {tr(ft.name).split(' (')[0]}
              </text>
            )
          })}
        </svg>
        <p className="text-xs text-muted">{tr({ ru: 'Нажмите на пояс. Ель и пихта — на теневых склонах; орех и арча — на солнечных; лиственные — вдоль рек через все пояса.', ky: 'Алкакты басыңыз. Карагай жана май карагай — көлөкөлүү капталдарда; жаңгак жана арча — күн тийген капталдарда; жалбырактуулар — дарыялардын бойлорунда бардык алкактар аркылуу.' })}</p>
      </div>
      <motion.div key={act} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-2 border-t border-line p-5 md:border-l md:border-t-0">
        <div className="font-display text-xl font-bold" style={{ color: f.color }}>
          {tr(f.name)}
        </div>
        <div className="text-sm font-bold">{tr(f.beltText)}</div>
        <p className="text-sm text-muted">{tr(f.ecosystem)}</p>
        <ul className="space-y-1 text-sm">
          {f.species.map((s) => (
            <li key={s.latin}>
              • <b>{tr(s.name)}</b> <i className="text-muted">{s.latin}</i>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
