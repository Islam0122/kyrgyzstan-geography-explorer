import { useState } from 'react'
import { ClimogramChart, CompareChart, LapseChart, SeasonsChart, StationPicker } from '../components/charts/ClimateCharts'
import { GeoMap } from '../components/map/GeoMap'
import type { Selection } from '../components/map/layers'
import { ModuleLayout } from '../components/ui/ModuleLayout'
import { climateLesson } from '../data/lessons/climate'
import { useI18n } from '../hooks/useI18n'

function AirMasses() {
  const { tr } = useI18n()
  const arrows = [
    { d: 'M20,120 C90,110 140,110 190,120', c: '#4fb3e3', t: { ru: 'умеренные (атлантические)', ky: 'мелүүн (атлантикалык)' }, x: 30, y: 105 },
    { d: 'M200,10 C200,50 205,70 210,100', c: '#9fdcf6', t: { ru: 'арктические', ky: 'арктикалык' }, x: 215, y: 30 },
    { d: 'M220,230 C215,200 212,180 210,150', c: '#f4a261', t: { ru: 'тропические', ky: 'тропикалык' }, x: 225, y: 220 },
    { d: 'M380,60 C330,80 280,100 240,115', c: '#c9d6e3', t: { ru: 'Сибирский антициклон (зима)', ky: 'Сибирь антициклону (кыш)' }, x: 250, y: 55 },
  ]
  return (
    <div className="card p-4">
      <svg viewBox="0 0 400 240" className="w-full">
        <defs>
          {arrows.map((a, i) => (
            <marker key={i} id={`am${i}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={a.c} />
            </marker>
          ))}
        </defs>
        <ellipse cx="210" cy="128" rx="44" ry="22" fill="#3c9a5f" opacity={0.8} />
        <text x="210" y="132" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">KG</text>
        {arrows.map((a, i) => (
          <g key={i}>
            <path d={a.d} stroke={a.c} strokeWidth="5" fill="none" markerEnd={`url(#am${i})`} className="river-flow" />
            <text x={a.x} y={a.y} fontSize="11" fontWeight="700" fill="currentColor">
              {tr(a.t)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default function ClimatePage() {
  const { t } = useI18n()
  const [st, setSt] = useState('bishkek')
  const [sel, setSel] = useState<Selection | null>(null)
  return (
    <ModuleLayout
      id="climate"
      lesson={climateLesson}
      asides={{ airmasses: <AirMasses />, altitude: <LapseChart /> }}
      extras={{
        temperature: (
          <div className="space-y-4">
            <StationPicker value={st} onChange={setSt} />
            <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
              <div className="card p-4">
                <ClimogramChart id={st} />
              </div>
              <GeoMap
                overlays={['climate', 'admin', 'lakes']}
                selection={sel ?? { type: 'station', id: st }}
                onSelect={(s) => {
                  setSel(s)
                  if (s.type === 'station') setSt(s.id)
                }}
                className="h-[360px]"
                minimal
              />
            </div>
          </div>
        ),
        seasons: (
          <div className="space-y-4">
            <StationPicker value={st} onChange={setSt} />
            <div className="text-sm font-bold">{t('climate.seasons')}</div>
            <SeasonsChart id={st} />
          </div>
        ),
        precipitation: <CompareChart />,
      }}
    />
  )
}
