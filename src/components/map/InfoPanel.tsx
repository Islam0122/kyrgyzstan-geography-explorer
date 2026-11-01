import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MapPin, MousePointerClick, X } from 'lucide-react'
import { climateStations, demStats, geo } from '../../data/maps'
import { stationNames } from '../../data/lessons/climate'
import { lakeById, placeById, regionById, ridgeById, riverById } from '../../data/lessons/geoObjects'
import { moduleById } from '../../data/lessons/modules'
import { useI18n } from '../../hooks/useI18n'
import type { L as Lt, ModuleId, SceneKind } from '../../types'
import { FavButton } from '../ui/FavButton'
import { RealPhoto } from '../media/RealPhoto'
import { objectPhotos } from '../../data/images'
import type { Selection } from './layers'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-2.5 text-sm">
      <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div>{children}</div>
    </div>
  )
}

interface Resolved {
  title: Lt
  subtitle?: Lt
  scene: SceneKind
  module?: ModuleId
  favId: string
  body: React.ReactNode
}

export function useResolve() {
  const { t, tr } = useI18n()
  return (s: Selection): Resolved | null => {
    if (s.type === 'region') {
      const r = regionById[s.id]
      if (!r) return null
      return {
        title: r.name,
        subtitle: r.center,
        scene: r.scene,
        module: 'geography',
        favId: `region:${s.id}`,
        body: (
          <>
            {r.area && (
              <Row label={t('common.area')}>
                {String(r.area).replace('.', ',')} {t('common.km2')}
              </Row>
            )}
            <Row label={t('common.center')}>{tr(r.center)}</Row>
            <Row label={t('common.position')}>{tr(r.position)}</Row>
            <p className="border-t border-line py-2.5 text-sm">{tr(r.description)}</p>
            <Row label={t('common.facts')}>
              <ul className="list-disc space-y-1 pl-4">
                {r.facts.map((f, i) => (
                  <li key={i}>{tr(f)}</li>
                ))}
              </ul>
            </Row>
          </>
        ),
      }
    }
    if (s.type === 'river') {
      const r = riverById[s.id]
      if (!r) return null
      const trace = (demStats.river_trace_km as Record<string, number>)[s.id]
      const f = geo.rivers.features.find((x) => x.properties.id === s.id)
      return {
        title: r.name,
        subtitle: r.basin,
        scene: r.scene,
        module: 'water',
        favId: `river:${s.id}`,
        body: (
          <>
            <Row label={t('river.source')}>{tr(r.source)}</Row>
            <Row label={t('river.flow')}>{tr(r.flow)}</Row>
            <Row label={t('river.basin')}>{tr(r.basin)}</Row>
            <Row label={t('river.tributaries')}>{tr(r.tributaries)}</Row>
            <Row label={t('river.use')}>{tr(r.use)}</Row>
            {r.length && (
              <Row label={t('river.length')}>
                {r.length} {t('common.km')} {r.lengthNote ? `(${tr(r.lengthNote)})` : ''}
              </Row>
            )}
            {trace && (
              <Row label={t('river.trace')}>
                ≈{trace} {t('common.km')}
                {f ? ` · ${f.properties.src_elev} → ${f.properties.end_elev} ${t('common.m')}` : ''}
              </Row>
            )}
          </>
        ),
      }
    }
    if (s.type === 'lake') {
      const l = lakeById[s.id]
      if (!l) return null
      return {
        title: l.name,
        subtitle: l.kind,
        scene: 'lake',
        module: 'water',
        favId: `lake:${s.id}`,
        body: (
          <>
            <p className="border-t border-line py-2.5 text-sm">{tr(l.text)}</p>
            <Row label={t('common.facts')}>
              <ul className="list-disc space-y-1 pl-4">
                {l.facts.map((f, i) => (
                  <li key={i}>{tr(f)}</li>
                ))}
              </ul>
            </Row>
          </>
        ),
      }
    }
    if (s.type === 'ridge') {
      const r = ridgeById[s.id]
      if (!r) return null
      const f = geo.ridges.features.find((x) => x.properties.id === s.id)
      return {
        title: r.name,
        subtitle: r.system,
        scene: 'peaks',
        module: 'relief',
        favId: `ridge:${s.id}`,
        body: (
          <>
            <p className="border-t border-line py-2.5 text-sm">{tr(r.text)}</p>
            {f && (
              <Row label={t('common.elevation')}>
                max ≈{f.properties.dem_max} {t('common.m')} · ⌀ ≈{f.properties.dem_mean} {t('common.m')}
                <div className="text-xs text-muted">{t('common.computed')} (~460 m)</div>
              </Row>
            )}
          </>
        ),
      }
    }
    if (s.type === 'place') {
      const p = placeById[s.id]
      if (!p) return null
      const scene: SceneKind = p.kind === 'city' ? 'city' : p.kind === 'peak' ? 'peaks' : p.kind === 'glacier' ? 'glacier' : p.id === 's-arslanbob' ? 'walnut' : p.id === 's-besharal' ? 'fir' : 'spruce'
      return {
        title: p.name,
        scene,
        module: p.module,
        favId: `place:${s.id}`,
        body: (
          <>
            {p.elev && (
              <Row label={t('common.elevation')}>
                {p.elev} {t('common.m')}
              </Row>
            )}
            {p.text && <p className="border-t border-line py-2.5 text-sm">{tr(p.text)}</p>}
            <Row label="φ, λ">
              {p.lat.toFixed(2)}° N, {p.lon.toFixed(2)}° E{p.approx && <span className="ml-1 text-xs text-muted">({t('common.approx')})</span>}
            </Row>
          </>
        ),
      }
    }
    if (s.type === 'station') {
      const st = climateStations.find((x) => x.id === s.id)
      if (!st) return null
      const annual = st.prcp?.reduce((a, b) => a + b, 0)
      const mean = st.temp ? st.temp.reduce((a, b) => a + b, 0) / 12 : null
      return {
        title: stationNames[st.id],
        subtitle: { ru: `${t('climate.station')} · GHCN ${st.ghcn}`, ky: `${t('climate.station')} · GHCN ${st.ghcn}` },
        scene: 'clouds',
        module: 'climate',
        favId: `station:${s.id}`,
        body: (
          <>
            <Row label={t('common.elevation')}>
              {st.elev} {t('common.m')}
            </Row>
            {mean !== null && st.temp && (
              <Row label={`${t('climate.meanYear')} (${st.tempPeriod})`}>
                {mean.toFixed(1).replace('.', ',')} °C · I: {st.temp[0]} °C · VII: {st.temp[6]} °C
              </Row>
            )}
            {annual && (
              <Row label={`${t('climate.annual')} (${st.prcpPeriod})`}>
                {annual} {t('common.mm')}
              </Row>
            )}
          </>
        ),
      }
    }
    return null
  }
}

export function InfoPanel({ selection, onClose, className = '' }: { selection: Selection | null; onClose?: () => void; className?: string }) {
  const { t, tr } = useI18n()
  const resolve = useResolve()
  const r = selection ? resolve(selection) : null
  return (
    <AnimatePresence mode="wait">
      {r ? (
        <motion.aside
          key={r.favId}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          className={`card overflow-hidden ${className}`}
          aria-live="polite"
        >
          <div className="relative">
            <RealPhoto id={objectPhotos[r.favId]} scene={r.scene} seed={r.favId} className="aspect-[16/7] w-full" sizes="420px" lightbox credit compact />
            <div className="absolute right-2 top-2 flex gap-1.5">
              <FavButton id={r.favId} className="glass" />
              {onClose && (
                <button type="button" onClick={onClose} className="glass grid size-9 place-items-center rounded-full" aria-label={t('common.close')}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[52vh] overflow-y-auto p-4 lg:max-h-none">
            <h3 className="font-display text-lg font-bold leading-tight">{tr(r.title)}</h3>
            {r.subtitle && <div className="mb-2 text-sm text-muted">{tr(r.subtitle)}</div>}
            {r.body}
            {r.module && (
              <Link to={moduleById[r.module].path} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-glacier hover:underline">
                <MapPin size={14} /> {t('module.label')} {moduleById[r.module].num}: {tr(moduleById[r.module].title)}
              </Link>
            )}
          </div>
        </motion.aside>
      ) : (
        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`card flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted ${className}`}>
          <MousePointerClick className="text-glacier" />
          {t('map.hint')}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
