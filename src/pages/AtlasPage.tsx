import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GeoMap } from '../components/map/GeoMap'
import { InfoPanel } from '../components/map/InfoPanel'
import { LayerPanel } from '../components/map/LayerPanel'
import { Legends } from '../components/map/Legends'
import { MODES, type BaseId, type ModeId, type OverlayId, type Selection } from '../components/map/layers'
import { useI18n } from '../hooks/useI18n'

const OVERLAY_FOR: Record<Selection['type'], OverlayId> = {
  region: 'admin',
  river: 'rivers',
  lake: 'lakes',
  ridge: 'ridges',
  place: 'cities',
  station: 'climate',
  belt: 'belts',
}

export default function AtlasPage() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState<ModeId | null>('general')
  const [base, setBase] = useState<BaseId>('relief')
  const [overlays, setOverlays] = useState<OverlayId[]>(MODES[0].overlays)
  const [sel, setSel] = useState<Selection | null>(null)

  // deep link: /atlas?sel=river:naryn
  useEffect(() => {
    const raw = params.get('sel')
    if (!raw) return
    const [type, id] = raw.split(':') as [Selection['type'], string]
    if (!id || !(type in OVERLAY_FOR)) return
    setSel({ type, id } as Selection)
    let need = OVERLAY_FOR[type]
    if (type === 'place') need = id.startsWith('c-') ? 'cities' : id.startsWith('p-') || id.startsWith('g-') ? 'peaks' : 'sites'
    setOverlays((o) => (o.includes(need) ? o : [...o, need]))
  }, [params])

  const select = (s: Selection) => {
    setSel(s)
    setParams({ sel: `${s.type}:${s.id}` }, { replace: true })
  }

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{t('nav.atlas')}</h1>
          <p className="text-sm text-muted">{t('map.hint')}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_1fr_340px]">
        <div className="order-2 space-y-4 lg:order-1">
          <LayerPanel
            base={base}
            overlays={overlays}
            mode={mode}
            onBase={(b) => {
              setBase(b)
              setMode(null)
            }}
            onToggle={(o) => {
              setOverlays((cur) => (cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]))
              setMode(null)
            }}
            onMode={(m) => {
              const cfg = MODES.find((x) => x.id === m)!
              setMode(m)
              setBase(cfg.base)
              setOverlays(cfg.overlays)
            }}
          />
          <Legends overlays={overlays} />
        </div>
        <div className="order-1 lg:order-2">
          <GeoMap base={base} overlays={overlays} selection={sel} onSelect={select} className="h-[62vh] min-h-[420px] lg:h-[calc(100dvh-170px)]" />
        </div>
        <div className="order-3">
          <InfoPanel selection={sel} onClose={() => setSel(null)} className="lg:sticky lg:top-20" />
        </div>
      </div>
    </div>
  )
}
