import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'
import { ForestBelts } from '../components/interactive/ForestBelts'
import { GeoMap } from '../components/map/GeoMap'
import { InfoPanel } from '../components/map/InfoPanel'
import { Legends } from '../components/map/Legends'
import type { Selection } from '../components/map/layers'
import { Icon } from '../components/ui/Icon'
import { ModuleLayout } from '../components/ui/ModuleLayout'
import { Scene } from '../components/ui/Scene'
import { forestTypes, forestsLesson, protectReasons, type ForestType } from '../data/lessons/forests'
import { placeById } from '../data/lessons/geoObjects'
import { useI18n } from '../hooks/useI18n'

function ForestCard({ f, onSite }: { f: ForestType; onSite: (id: string) => void }) {
  const { t, tr } = useI18n()
  return (
    <div className="card overflow-hidden">
      <div className="relative">
        <Scene kind={f.scene} seed={`forest-${f.id}`} className="aspect-[16/7] w-full" animated />
        <span className="absolute bottom-1 left-2 rounded bg-black/40 px-1.5 text-[10px] text-white">{t('common.illustration')}</span>
        {f.id === 'fir' && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            <ShieldAlert size={13} /> {tr({ ru: 'Красная книга КР', ky: 'КР Кызыл китеби' })}
          </span>
        )}
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('forest.belt')}</div>
            <div className="font-semibold">{tr(f.beltText)}</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full" style={{ marginLeft: `${(f.from / 4000) * 100}%`, width: `${((f.to - f.from) / 4000) * 100}%`, background: f.color }} />
            </div>
            <div className="mt-0.5 flex justify-between text-[10px] text-muted">
              <span>0</span>
              <span>2000</span>
              <span>4000 {t('common.m')}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('forest.ecosystem')}</div>
            <p>{tr(f.ecosystem)}</p>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('forest.value')}</div>
            <p>{tr(f.value)}</p>
          </div>
          {f.sites.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {f.sites.map((s) => (
                <button key={s} type="button" onClick={() => onSite(s)} className="rounded-full border border-line px-2.5 py-1 text-xs font-bold hover:border-glacier">
                  📍 {tr(placeById[s].name)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t('forest.species')}</div>
          <ul className="space-y-2">
            {f.species.map((s) => (
              <li key={s.latin} className="rounded-xl border border-line p-3">
                <div className="font-bold">{tr(s.name)}</div>
                <div className="text-xs italic text-muted">{s.latin}</div>
                <div className="mt-1 text-sm">{tr(s.note)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function ForestsPage() {
  const { tr } = useI18n()
  const [sel, setSel] = useState<Selection | null>(null)
  const site = (id: string) => {
    setSel({ type: 'place', id })
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' })
  }
  const card = (id: ForestType['id']) => <ForestCard f={forestTypes.find((x) => x.id === id)!} onSite={site} />
  return (
    <ModuleLayout
      id="forests"
      lesson={forestsLesson}
      wide={['map', 'juniper', 'spruce', 'fir', 'walnut', 'deciduous', 'belts', 'protect']}
      extras={{
        map: (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <GeoMap base="none" overlays={['forests', 'sites', 'lakes', 'rivers', 'admin']} selection={sel} onSelect={setSel} className="h-[520px] md:h-[620px]" />
            <div className="space-y-4">
              <Legends overlays={['forests']} />
              <InfoPanel selection={sel} />
            </div>
          </div>
        ),
        juniper: card('juniper'),
        spruce: card('spruce'),
        fir: card('fir'),
        walnut: card('walnut'),
        deciduous: card('deciduous'),
        belts: <ForestBelts />,
        protect: (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {protectReasons.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card p-5">
                <span className="grid size-11 place-items-center rounded-2xl bg-mountain/15 text-mountain">
                  <Icon name={r.icon} size={22} />
                </span>
                <div className="mt-3 font-display text-base font-bold">{tr(r.title)}</div>
                <p className="mt-1 text-sm text-muted">{tr(r.text)}</p>
              </motion.div>
            ))}
          </div>
        ),
      }}
    />
  )
}
