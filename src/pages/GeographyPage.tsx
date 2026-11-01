import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Compass } from 'lucide-react'
import { GeoMap } from '../components/map/GeoMap'
import { InfoPanel } from '../components/map/InfoPanel'
import type { Selection } from '../components/map/layers'
import { ModuleLayout } from '../components/ui/ModuleLayout'
import { Scene } from '../components/ui/Scene'
import { demStats } from '../data/maps'
import { geographyLesson } from '../data/lessons/geography'
import { places, regionInfo } from '../data/lessons/geoObjects'
import { useI18n } from '../hooks/useI18n'

function Neighbours() {
  const { tr } = useI18n()
  const n = [
    { pos: 'top-1 left-1/2 -translate-x-1/2', name: { ru: 'Казахстан', ky: 'Казакстан' }, dir: { ru: 'север', ky: 'түндүк' } },
    { pos: 'left-1 top-1/2 -translate-y-1/2', name: { ru: 'Узбекистан', ky: 'Өзбекстан' }, dir: { ru: 'запад', ky: 'батыш' } },
    { pos: 'bottom-1 left-6', name: { ru: 'Таджикистан', ky: 'Тажикстан' }, dir: { ru: 'юго-запад, юг', ky: 'түштүк-батыш, түштүк' } },
    { pos: 'right-1 bottom-1/3', name: { ru: 'Китай', ky: 'Кытай' }, dir: { ru: 'юго-восток, восток', ky: 'түштүк-чыгыш, чыгыш' } },
  ]
  return (
    <div className="card relative aspect-square max-h-[380px] w-full overflow-hidden">
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative grid size-40 place-items-center rounded-full border-2 border-dashed border-glacier/50">
          <Compass className="text-glacier" size={44} />
          <div className="absolute -bottom-7 font-display text-sm font-bold">{tr({ ru: 'Кыргызстан', ky: 'Кыргызстан' })}</div>
        </div>
      </div>
      {n.map((x) => (
        <div key={x.name.ru} className={`absolute ${x.pos} rounded-xl border border-line bg-surface-solid px-3 py-1.5 text-center shadow`}>
          <div className="text-sm font-bold">{tr(x.name)}</div>
          <div className="text-[11px] text-muted">{tr(x.dir)}</div>
        </div>
      ))}
    </div>
  )
}

function PositionStats() {
  const { tr } = useI18n()
  const [w, s, e, n] = demStats.extent
  const dms = (v: number) => `${Math.floor(v)}°${String(Math.round((v % 1) * 60)).padStart(2, '0')}′`
  const items = [
    { v: `${dms(s)} – ${dms(n)}`, l: { ru: 'северной широты', ky: 'түндүк кеңдик' } },
    { v: `${dms(w)} – ${dms(e)}`, l: { ru: 'восточной долготы', ky: 'чыгыш узундук' } },
    { v: `${String(demStats.share_above['1000']).replace('.', ',')} %`, l: { ru: 'площади выше 1000 м (ЦМР)', ky: 'аянттын 1000 мден жогорку бөлүгү (РСМ)' } },
    { v: `≈${demStats.mean_elev} м`, l: { ru: 'средняя высота (ЦМР)', ky: 'орточо бийиктик (РСМ)' } },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((x) => (
        <div key={x.v} className="card p-4">
          <div className="font-display text-lg font-bold text-glacier">{x.v}</div>
          <div className="text-xs text-muted">{tr(x.l)}</div>
        </div>
      ))}
    </div>
  )
}

export default function GeographyPage() {
  const { tr, t } = useI18n()
  const [sel, setSel] = useState<Selection | null>({ type: 'region', id: 'chuy' })
  const [sel2, setSel2] = useState<Selection | null>(null)
  const [sel3, setSel3] = useState<Selection | null>(null)
  const cities = places.filter((p) => p.kind === 'city')

  return (
    <ModuleLayout
      id="geography"
      lesson={geographyLesson}
      asides={{ position: <PositionStats />, borders: <Neighbours /> }}
      extras={{
        borders: <GeoMap overlays={['admin']} className="h-[360px]" minimal />,
        regions: (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <GeoMap overlays={['admin', 'cities', 'lakes']} regionFill selection={sel} onSelect={setSel} className="h-[460px]" />
              <InfoPanel selection={sel} className="lg:max-h-[460px] lg:overflow-y-auto" />
            </div>
            <div className="flex flex-wrap gap-2">
              {regionInfo.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSel({ type: 'region', id: r.id })}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${sel?.type === 'region' && sel.id === r.id ? 'border-glacier bg-glacier/15' : 'border-line hover:bg-surface-2'}`}
                >
                  <span className="size-3 rounded-full" style={{ background: r.color }} />
                  {tr(r.name)}
                  {r.area && <span className="text-xs text-muted">{String(r.area).replace('.', ',')}</span>}
                </button>
              ))}
            </div>
          </div>
        ),
        capital: (
          <div className="card grid overflow-hidden md:grid-cols-2">
            <Scene kind="city" seed="bishkek-big" className="aspect-[16/10] h-full w-full" animated />
            <div className="p-5">
              <div className="font-display text-xl font-bold">{tr({ ru: 'Бишкек', ky: 'Бишкек' })}</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>📍 42,87° N, 74,58° E</li>
                <li>⛰ {tr({ ru: 'Высота метеостанции — 756 м', ky: 'Метеостанциянын бийиктиги — 756 м' })}</li>
                <li>🌡 {tr({ ru: 'Январь ≈ −2,6 °C, июль ≈ +25,6 °C (1991–2020)', ky: 'Январь ≈ −2,6 °C, июль ≈ +25,6 °C (1991–2020)' })}</li>
                <li>💧 {tr({ ru: 'Осадки ≈ 437 мм/год (1961–1990)', ky: 'Жаан-чачын ≈ 437 мм/жыл (1961–1990)' })}</li>
              </ul>
              <Link to="/atlas?sel=place:c-bishkek" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-glacier">
                {t('common.showOnMap')} <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        ),
        cities: (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <GeoMap overlays={['cities', 'admin', 'lakes', 'rivers']} selection={sel2} onSelect={setSel2} placeKinds={['city']} className="h-[420px]" />
            <div className="space-y-3">
              <InfoPanel selection={sel2} />
              <div className="flex flex-wrap gap-1.5">
                {cities.map((c) => (
                  <button key={c.id} type="button" onClick={() => setSel2({ type: 'place', id: c.id })} className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold hover:bg-surface-2">
                    {tr(c.name)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ),
        mountains: (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <GeoMap overlays={['ridges', 'peaks', 'glaciers', 'hillshade']} selection={sel3} onSelect={setSel3} className="h-[440px]" />
            <InfoPanel selection={sel3} />
          </div>
        ),
        objects: (
          <Link to="/atlas" className="group card flex items-center justify-between gap-4 p-5 hover:border-glacier">
            <div>
              <div className="font-display text-lg font-bold">{t('home.map.open')}</div>
              <div className="text-sm text-muted">{t('map.dataNote')}</div>
            </div>
            <ArrowUpRight className="shrink-0 transition group-hover:translate-x-1" />
          </Link>
        ),
      }}
    />
  )
}
