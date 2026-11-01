import { useState } from 'react'
import { Waves } from 'lucide-react'
import { GeoMap } from '../components/map/GeoMap'
import { InfoPanel } from '../components/map/InfoPanel'
import type { Selection } from '../components/map/layers'
import { ModuleLayout } from '../components/ui/ModuleLayout'
import { FavButton } from '../components/ui/FavButton'
import { demStats } from '../data/maps'
import { lakeInfo, riverInfo } from '../data/lessons/geoObjects'
import { waterLesson } from '../data/lessons/water'
import { useI18n } from '../hooks/useI18n'

function BasinsDiagram() {
  const { tr } = useI18n()
  const basins = [
    { name: { ru: 'Сыр-Дарья → Арал', ky: 'Сыр-Дарыя → Арал' }, rivers: ['naryn', 'karadarya', 'chatkal', 'akbuura', 'atbashy', 'kokomeren'], c: '#2f8fd8' },
    { name: { ru: 'Амударья → Арал', ky: 'Аму-Дарыя → Арал' }, rivers: ['kyzylsuu'], c: '#d86b5a' },
    { name: { ru: 'Тарим (Китай)', ky: 'Тарим (Кытай)' }, rivers: ['saryjaz'], c: '#9fd3ff' },
    { name: { ru: 'Бессточные области', ky: 'Агымсыз аймактар' }, rivers: ['chuy', 'talas'], c: '#e0b04f' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {basins.map((b) => (
        <div key={b.name.ru} className="card p-4" style={{ borderLeft: `5px solid ${b.c}` }}>
          <div className="font-bold">{tr(b.name)}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {b.rivers.map((r) => (
              <span key={r} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                {tr(riverInfo.find((x) => x.id === r)!.name)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WaterPage() {
  const { t, tr } = useI18n()
  const [sel, setSel] = useState<Selection | null>({ type: 'river', id: 'naryn' })
  const [lake, setLake] = useState<Selection | null>({ type: 'lake', id: 'issykkul' })
  const [gl, setGl] = useState<Selection | null>({ type: 'place', id: 'g-inylchek' })
  const trace = demStats.river_trace_km as Record<string, number>
  return (
    <ModuleLayout
      id="water"
      lesson={waterLesson}
      wide={['map', 'rivers']}
      asides={{ basins: <BasinsDiagram /> }}
      extras={{
        map: (
          <div className="space-y-3">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <GeoMap overlays={['rivers', 'streams', 'lakes', 'glaciers', 'cities']} selection={sel} onSelect={setSel} className="h-[480px] md:h-[560px]" />
              <InfoPanel selection={sel} className="lg:max-h-[560px] lg:overflow-y-auto" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Waves size={16} className="text-glacier" />
              <span className="mr-1 text-xs font-bold text-muted">{t('map.animate')}:</span>
              {riverInfo.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSel({ type: 'river', id: r.id })}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${sel?.type === 'river' && sel.id === r.id ? 'bg-glacier text-navy' : 'bg-surface-2 hover:bg-line'}`}
                >
                  {tr(r.name)}
                </button>
              ))}
            </div>
          </div>
        ),
        rivers: (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {riverInfo.map((r) => (
              <article key={r.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold">{tr(r.name)}</h3>
                    <div className="text-xs font-semibold" style={{ color: r.color }}>
                      {tr(r.basin)}
                    </div>
                  </div>
                  <FavButton id={`river:${r.id}`} />
                </div>
                <dl className="mt-3 flex-1 space-y-2 text-sm">
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted">{t('river.source')}</dt>
                    <dd>{tr(r.source)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted">{t('river.flow')}</dt>
                    <dd>{tr(r.flow)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold uppercase text-muted">{t('river.use')}</dt>
                    <dd>{tr(r.use)}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                  <span>
                    {r.length ? `${r.length} ${t('common.km')} · ` : ''}
                    {trace[r.id] ? `≈${trace[r.id]} ${t('common.km')} (${tr({ ru: 'в КР, ЦМР', ky: 'КРда, РСМ' })})` : ''}
                  </span>
                  <button
                    type="button"
                    className="font-bold text-glacier"
                    onClick={() => {
                      setSel({ type: 'river', id: r.id })
                      document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    {t('common.showOnMap')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ),
        lakes: (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <GeoMap overlays={['lakes', 'rivers']} selection={lake} onSelect={setLake} className="h-[400px]" />
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {lakeInfo.map((l) => (
                  <button key={l.id} type="button" onClick={() => setLake({ type: 'lake', id: l.id })} className={`rounded-full px-3 py-1 text-xs font-bold ${lake?.type === 'lake' && lake.id === l.id ? 'bg-glacier text-navy' : 'bg-surface-2'}`}>
                    {tr(l.name)}
                  </button>
                ))}
              </div>
              <InfoPanel selection={lake} />
            </div>
          </div>
        ),
        glaciers: (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <GeoMap overlays={['glaciers', 'peaks', 'rivers', 'hillshade']} selection={gl} onSelect={setGl} className="h-[400px]" />
            <InfoPanel selection={gl} />
          </div>
        ),
      }}
    />
  )
}
