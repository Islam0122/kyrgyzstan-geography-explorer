import { MountainSection } from '../components/interactive/MountainSection'
import { GeoMap } from '../components/map/GeoMap'
import { Legends } from '../components/map/Legends'
import { ModuleLayout } from '../components/ui/ModuleLayout'
import { SceneCard } from '../components/ui/SectionBlock'
import { belts, vegetationLesson } from '../data/lessons/vegetation'
import { useI18n } from '../hooks/useI18n'
import type { Belt } from '../data/lessons/vegetation'

function BeltCard({ b }: { b: Belt }) {
  const { t, tr } = useI18n()
  return (
    <div className="space-y-3">
      <SceneCard kind={b.scene} seed={`vb-${b.id}`} />
      <div className="card p-4 text-sm">
        <div className="mb-1 text-[11px] font-bold uppercase text-muted">{t('veg.range')}</div>
        <div className="font-bold">
          ≈{b.from}–{b.to} {t('common.m')} <span className="font-normal text-muted">({t('veg.north')})</span>
        </div>
        <div className="mb-1 mt-3 text-[11px] font-bold uppercase text-muted">{t('veg.plants')}</div>
        <div className="flex flex-wrap gap-1.5">
          {b.plants.map((p) => (
            <span key={p.ru} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold">
              {tr(p)}
            </span>
          ))}
        </div>
        <div className="mb-1 mt-3 text-[11px] font-bold uppercase text-muted">{t('veg.climate')}</div>
        <div>{tr(b.climate)}</div>
      </div>
    </div>
  )
}

export default function VegetationPage() {
  const by = Object.fromEntries(belts.map((b) => [b.id, b]))
  return (
    <ModuleLayout
      id="vegetation"
      lesson={vegetationLesson}
      wide={['zonation']}
      asides={{
        desert: <BeltCard b={by.desert} />,
        steppe: <BeltCard b={by.steppe} />,
        meadows: <BeltCard b={by.forest} />,
        subalpine: <BeltCard b={by.subalpine} />,
        alpine: <BeltCard b={by.alpine} />,
      }}
      extras={{
        zonation: <MountainSection />,
        distribution: (
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <GeoMap base="none" overlays={['belts', 'lakes', 'rivers']} className="h-[460px]" />
            <Legends overlays={['belts']} />
          </div>
        ),
      }}
    />
  )
}
