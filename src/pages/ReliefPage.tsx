import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { GlacialDiagram, TectonicsDiagram, ValleyProfiles } from '../components/interactive/Diagrams'
import { Relief3D } from '../components/interactive/Relief3D'
import { GeoMap } from '../components/map/GeoMap'
import { InfoPanel } from '../components/map/InfoPanel'
import type { Selection } from '../components/map/layers'
import { ModuleLayout } from '../components/ui/ModuleLayout'
import { demStats } from '../data/maps'
import { hotspots, reliefLesson } from '../data/lessons/relief'
import { useI18n } from '../hooks/useI18n'

function Hypsometry() {
  const { t, tr } = useI18n()
  const sa = demStats.share_above as Record<string, number>
  const data = [
    { band: '< 1000', v: 100 - sa['1000'] },
    { band: '1000–2000', v: sa['1000'] - sa['2000'] },
    { band: '2000–3000', v: sa['2000'] - sa['3000'] },
    { band: '3000–4000', v: sa['3000'] - sa['4000'] },
    { band: '> 4000', v: sa['4000'] },
  ].map((d) => ({ ...d, v: Math.round(d.v * 10) / 10 }))
  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-bold">{t('relief.hypso')}, %</div>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="band" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} unit="%" />
            <Tooltip contentStyle={{ background: 'var(--surface-solid)', border: '1px solid var(--line)', borderRadius: 12 }} formatter={(v) => [`${v} %`, tr({ ru: 'доля площади', ky: 'аянттын үлүшү' })]} />
            <Bar dataKey="v" fill="#b5835a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] text-muted">{t('common.computed')} (AWS Terrain Tiles)</div>
    </div>
  )
}

export default function ReliefPage() {
  const { t, tr } = useI18n()
  const [hs, setHs] = useState<string | null>('pobeda')
  const [sel, setSel] = useState<Selection | null>({ type: 'ridge', id: 'terskey' })
  const h = hotspots.find((x) => x.id === hs)
  return (
    <ModuleLayout
      id="relief"
      lesson={reliefLesson}
      wide={['model3d']}
      asides={{ tectonics: <TectonicsDiagram />, ranges: <Hypsometry /> }}
      extras={{
        model3d: (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div>
              <Relief3D hotspots={hotspots} active={hs} onPick={setHs} />
              <p className="mt-2 text-xs text-muted">
                {t('relief.3d.hint')} {t('relief.3d.note')}
              </p>
            </div>
            <div className="space-y-3">
              {h && (
                <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-earth">{tr(h.kind)}</div>
                  <div className="mt-1 font-display text-xl font-bold">{tr(h.title)}</div>
                  <div className="mt-1 text-xs font-bold text-muted">{t('relief.process')}</div>
                  <p className="mt-2 text-sm">{tr(h.text)}</p>
                </motion.div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {hotspots.map((x) => (
                  <button key={x.id} type="button" onClick={() => setHs(x.id)} className={`rounded-full px-2.5 py-1 text-xs font-bold ${hs === x.id ? 'bg-amber-300 text-navy' : 'bg-surface-2 hover:bg-line'}`}>
                    {tr(x.title).split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ),
        ranges: (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <GeoMap overlays={['ridges', 'peaks', 'hillshade', 'lakes']} selection={sel} onSelect={setSel} className="h-[460px]" />
            <InfoPanel selection={sel} />
          </div>
        ),
        valleys: <ValleyProfiles />,
        glacial: <GlacialDiagram />,
      }}
    />
  )
}
