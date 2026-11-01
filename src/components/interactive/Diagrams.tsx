import { motion } from 'framer-motion'
import { useState } from 'react'
import { useI18n } from '../../hooks/useI18n'
import type { L } from '../../types'

/** Animated block diagram: plate push → horsts (ranges) and grabens (basins). */
export function TectonicsDiagram() {
  const { tr } = useI18n()
  const [phase, setPhase] = useState(1)
  const lift = (k: number) => (phase ? k : 0)
  const blocks = [
    { x: 40, w: 90, up: 70, label: { ru: 'хребет', ky: 'кырка' } },
    { x: 130, w: 80, up: -25, label: { ru: 'котловина', ky: 'ойдуң' } },
    { x: 210, w: 100, up: 95, label: { ru: 'хребет', ky: 'кырка' } },
    { x: 310, w: 70, up: -15, label: { ru: 'впадина', ky: 'көңдөй' } },
    { x: 380, w: 90, up: 60, label: { ru: 'хребет', ky: 'кырка' } },
  ]
  return (
    <div className="card overflow-hidden p-4">
      <svg viewBox="0 0 520 260" className="w-full">
        <defs>
          <linearGradient id="td-rock" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b5835a" />
            <stop offset="1" stopColor="#6b4a33" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="520" height="260" fill="transparent" />
        {blocks.map((b, i) => (
          <motion.g key={i} animate={{ y: -lift(b.up) }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
            <rect x={b.x} y={150} width={b.w} height={110} fill="url(#td-rock)" stroke="#3b2a1e" />
            {[0, 1, 2].map((k) => (
              <line key={k} x1={b.x} x2={b.x + b.w} y1={170 + k * 25} y2={170 + k * 25} stroke="#e0c09a" strokeOpacity={0.35} />
            ))}
            {b.up > 50 && <polygon points={`${b.x + 10},150 ${b.x + b.w / 2},${150 - 18} ${b.x + b.w - 10},150`} fill="#f4f8fb" />}
            {b.up < 0 && <rect x={b.x} y={140} width={b.w} height={10} fill="#d8c27a" />}
            <text x={b.x + b.w / 2} y={b.up < 0 ? 132 : 125 - (b.up > 50 ? 20 : 0)} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">
              {tr(b.label)}
            </text>
          </motion.g>
        ))}
        {[130, 210, 310, 380].map((x) => (
          <line key={x} x1={x} x2={x} y1={60} y2={260} stroke="#e63946" strokeDasharray="4 4" strokeWidth={1.5} />
        ))}
        <motion.g animate={{ x: phase ? 10 : 0 }} transition={{ duration: 1.4 }}>
          <polygon points="0,200 30,185 30,215" fill="#e63946" />
          <text x="4" y="240" fontSize="10" fill="currentColor">{tr({ ru: 'давление', ky: 'басым' })}</text>
        </motion.g>
        <motion.g animate={{ x: phase ? -10 : 0 }} transition={{ duration: 1.4 }}>
          <polygon points="520,200 490,185 490,215" fill="#e63946" />
        </motion.g>
        <text x="260" y="22" textAnchor="middle" fontSize="11" fill="currentColor" opacity={0.7}>
          {tr({ ru: 'красный пунктир — разломы', ky: 'кызыл үзүк сызык — жаракалар' })}
        </text>
      </svg>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => setPhase(0)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${!phase ? 'bg-earth text-white' : 'bg-surface-2'}`}>
          {tr({ ru: 'До поднятия', ky: 'Көтөрүлүүгө чейин' })}
        </button>
        <button type="button" onClick={() => setPhase(1)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${phase ? 'bg-earth text-white' : 'bg-surface-2'}`}>
          {tr({ ru: 'После поднятия', ky: 'Көтөрүлгөндөн кийин' })}
        </button>
      </div>
    </div>
  )
}

/** Glacial landforms: clickable labelled cross-section. */
export function GlacialDiagram() {
  const { tr } = useI18n()
  const items: { id: string; x: number; y: number; t: L; d: L }[] = [
    { id: 'cirque', x: 95, y: 70, t: { ru: 'Кар (цирк)', ky: 'Кар (цирк)' }, d: { ru: 'Чаша в верховьях, где накапливается снег и зарождается ледник.', ky: 'Кар топтолуп, мөңгү пайда болгон жогорку агымдагы табак.' } },
    { id: 'horn', x: 60, y: 22, t: { ru: 'Карлинг', ky: 'Карлинг' }, d: { ru: 'Острая вершина, подточенная карами с нескольких сторон.', ky: 'Бир нече тараптан карлар жеп кеткен учтуу чоку.' } },
    { id: 'glacier', x: 200, y: 120, t: { ru: 'Долинный ледник', ky: 'Өрөөн мөңгүсү' }, d: { ru: 'Медленно движущийся по долине поток льда.', ky: 'Өрөөн боюнча жай жылган муз агымы.' } },
    { id: 'trough', x: 330, y: 165, t: { ru: 'Трог', ky: 'Трог' }, d: { ru: 'U-образная долина, выпаханная ледником.', ky: 'Мөңгү казып чыгарган U сымал өрөөн.' } },
    { id: 'moraine', x: 430, y: 190, t: { ru: 'Конечная морена', ky: 'Акыркы морена' }, d: { ru: 'Вал из обломков на месте края ледника; за ней может образоваться озеро.', ky: 'Мөңгүнүн четиндеги сыныктардан турган дөңсөө; анын артында көл пайда болушу мүмкүн.' } },
  ]
  const [act, setAct] = useState('glacier')
  const a = items.find((i) => i.id === act)!
  return (
    <div className="card grid gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
      <svg viewBox="0 0 520 240" className="w-full">
        <path d="M0,240 L0,60 L60,10 L90,55 L130,40 L170,90 L520,200 L520,240 Z" fill="#8c7a6b" />
        <path d="M70,60 Q100,95 140,85 Q240,120 420,185 L440,195 Q300,175 150,110 Q100,100 75,70 Z" fill="#e9f5fd" stroke="#a9cfe6" />
        <path d="M420,183 q15,-12 35,0 q10,8 25,2 L490,205 L410,205 Z" fill="#a08c74" />
        <ellipse cx="500" cy="212" rx="20" ry="5" fill="#4fa3e0" />
        {items.map((i) => (
          <g key={i.id} onClick={() => setAct(i.id)} className="cursor-pointer">
            <circle cx={i.x} cy={i.y} r={act === i.id ? 11 : 8} fill={act === i.id ? '#ffd166' : '#4fb3e3'} stroke="#fff" strokeWidth="2" />
            <text x={i.x} y={i.y + 4} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0b1424">
              {items.indexOf(i) + 1}
            </text>
          </g>
        ))}
      </svg>
      <div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((i, k) => (
            <button key={i.id} type="button" onClick={() => setAct(i.id)} className={`rounded-full px-2.5 py-1 text-xs font-bold ${act === i.id ? 'bg-glacier text-navy' : 'bg-surface-2'}`}>
              {k + 1}. {tr(i.t)}
            </button>
          ))}
        </div>
        <motion.div key={act} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <div className="font-display text-lg font-bold">{tr(a.t)}</div>
          <p className="mt-1 text-sm text-muted">{tr(a.d)}</p>
        </motion.div>
      </div>
    </div>
  )
}

/** Valley profiles V vs U, fan */
export function ValleyProfiles() {
  const { tr } = useI18n()
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { d: 'M0,10 L60,100 L120,10', t: { ru: 'V-образная (речная)', ky: 'V сымал (дарыялык)' }, c: '#4fb3e3' },
        { d: 'M0,10 Q10,95 60,98 Q110,95 120,10', t: { ru: 'U-образная (трог)', ky: 'U сымал (трог)' }, c: '#9fdcf6' },
        { d: 'M0,40 L40,40 L40,60 L80,60 L80,80 L120,80', t: { ru: 'Речные террасы', ky: 'Дарыя террасалары' }, c: '#b5835a' },
      ].map((v) => (
        <div key={v.t.ru} className="card p-4 text-center">
          <svg viewBox="0 0 120 110" className="mx-auto h-24">
            <path d={v.d} fill="none" stroke={v.c} strokeWidth="5" strokeLinejoin="round" />
          </svg>
          <div className="mt-2 text-sm font-bold">{tr(v.t)}</div>
        </div>
      ))}
    </div>
  )
}
