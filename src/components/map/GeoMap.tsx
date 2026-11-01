import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minus, Plus, Scan } from 'lucide-react'
import { asset, climateStations, geo, KG_BOUNDS, rasterBounds } from '../../data/maps'
import { lakeById, placeById, places, regionById, ridgeById, riverById } from '../../data/lessons/geoObjects'
import { stationNames } from '../../data/lessons/climate'
import { useI18n } from '../../hooks/useI18n'
import { useAppStore } from '../../store/useAppStore'
import type { BaseId, OverlayId, Selection } from './layers'

export interface GeoMapProps {
  base?: BaseId
  overlays: OverlayId[]
  selection?: Selection | null
  onSelect?: (s: Selection) => void
  /** draw this feature emphasised (quiz) */
  highlight?: { layer: 'regions' | 'lakes' | 'rivers' | 'ridges'; id: string } | null
  /** quiz mode: no names, no clicks */
  quiz?: boolean
  /** colour regions with their own palette */
  regionFill?: boolean
  /** animate water flow along the selected river */
  animateRiver?: boolean
  className?: string
  minimal?: boolean
  /** filter which places are shown by kind */
  placeKinds?: string[]
}

const TILES: Record<Exclude<BaseId, 'relief' | 'none'>, { url: string; attr: string; maxZoom: number }> = {
  osm: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap contributors', maxZoom: 18 },
  topo: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap contributors, SRTM | © OpenTopoMap (CC-BY-SA)', maxZoom: 16 },
  sat: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics', maxZoom: 17 },
  terrain: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri — Source: USGS, Esri, TANA, DeLorme, NPS', maxZoom: 13 },
}

function lineMid(coords: number[][]) {
  const c = coords[Math.floor(coords.length / 2)]
  return L.latLng(c[1], c[0])
}

export function GeoMap({
  base = 'relief',
  overlays,
  selection,
  onSelect,
  highlight,
  quiz = false,
  regionFill = false,
  animateRiver = true,
  className = 'h-[520px]',
  minimal = false,
  placeKinds,
}: GeoMapProps) {
  const { t, tr, lang } = useI18n()
  const theme = useAppStore((s) => s.theme)
  const openObj = useAppStore((s) => s.openMapObject)
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const baseLayer = useRef<L.Layer | null>(null)
  const groups = useRef<L.LayerGroup | null>(null)
  const touched = useRef(false)
  const [offline, setOffline] = useState(false)
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect

  // create map once
  useEffect(() => {
    if (!el.current) return
    const m = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 5,
      maxZoom: 14,
      maxBounds: L.latLngBounds([36.5, 64], [46, 86]),
      worldCopyJump: false,
      scrollWheelZoom: !minimal,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
    })
    m.fitBounds(KG_BOUNDS, { padding: [8, 8] })
    m.attributionControl.setPrefix(false)
    map.current = m
    groups.current = L.layerGroup().addTo(m)
    const box = el.current
    touched.current = false
    m.on('dragstart', () => (touched.current = true))
    box.addEventListener('wheel', () => (touched.current = true), { passive: true })
    const zoomClass = () => {
      const z = m.getZoom()
      box.classList.toggle('z-lo', z < 7)
      box.classList.toggle('z-mid', z < 8)
    }
    m.on('zoomend', zoomClass)
    const ro = new ResizeObserver(() => {
      m.invalidateSize()
      if (!touched.current) m.fitBounds(KG_BOUNDS, { padding: [8, 8], animate: false })
      zoomClass()
    })
    ro.observe(box)
    return () => {
      ro.disconnect()
      m.remove()
      map.current = null
    }
  }, [minimal])

  // base layer
  useEffect(() => {
    const m = map.current
    if (!m) return
    if (baseLayer.current) m.removeLayer(baseLayer.current)
    baseLayer.current = null
    setOffline(false)
    if (base === 'relief') {
      baseLayer.current = L.imageOverlay(asset('rasters/relief.webp'), rasterBounds, {
        attribution: 'Relief: AWS Terrain Tiles (Mapzen, SRTM) · Natural Earth',
        zIndex: 1,
      }).addTo(m)
    } else if (base !== 'none') {
      const cfg = TILES[base]
      let errors = 0
      const tl = L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: cfg.maxZoom, subdomains: 'abc' })
      tl.on('tileerror', () => {
        errors++
        if (errors > 3) setOffline(true)
      })
      baseLayer.current = tl.addTo(m)
    }
  }, [base])

  // overlays — rebuilt on any relevant change (data is small)
  useEffect(() => {
    const m = map.current
    const g = groups.current
    if (!m || !g) return
    g.clearLayers()
    const on = (id: OverlayId) => overlays.includes(id)
    const dark = theme === 'dark'
    const pick = (s: Selection) => {
      if (quiz) return
      openObj(`${s.type}:${s.id}`)
      selectRef.current?.(s)
    }
    const panes = ['rasters', 'polys', 'lines', 'points'] as const
    panes.forEach((p, i) => {
      if (!m.getPane(p)) {
        const pane = m.createPane(p)
        pane.style.zIndex = String(410 + i * 10)
      }
    })
    const rasterOverlay = (file: string, opacity: number) =>
      L.imageOverlay(asset(`rasters/${file}`), rasterBounds, { opacity, pane: 'rasters', interactive: false }).addTo(g)

    if (base === 'none' || on('belts') || on('forests')) {
      // context: neighbours & country fill when no base map
      L.geoJSON(geo.neighbours, { pane: 'polys', interactive: false, style: { color: dark ? '#2a3a52' : '#c5d0dc', weight: 1, fillColor: dark ? '#0f1b2c' : '#e3e9ef', fillOpacity: base === 'none' ? 1 : 0 } }).addTo(g)
    }
    if (on('hillshade')) rasterOverlay('hillshade.webp', 0.8)
    if (on('belts')) rasterOverlay('belts.webp', 0.95)
    if (on('forests')) rasterOverlay('forests.webp', 1)

    // country outline (always)
    L.geoJSON(geo.country, { pane: 'polys', interactive: false, style: { color: dark ? '#e9f0f8' : '#0d1b2e', weight: 2.2, fill: false, opacity: 0.9 } }).addTo(g)

    if (on('admin') || regionFill || highlight?.layer === 'regions') {
      L.geoJSON(geo.regions, {
        pane: 'polys',
        style: (f) => {
          const id = f?.properties.id
          const isHi = highlight?.layer === 'regions' && highlight.id === id
          const isSel = selection?.type === 'region' && selection.id === id
          const col = regionById[id]?.color ?? '#888'
          return {
            color: isHi || isSel ? '#ffd166' : dark ? 'rgba(255,255,255,.75)' : 'rgba(13,27,46,.6)',
            weight: isHi || isSel ? 3.5 : 1.2,
            dashArray: isHi || isSel ? undefined : '4 3',
            fillColor: isHi ? '#ffd166' : col,
            fillOpacity: isHi ? 0.55 : regionFill ? (isSel ? 0.55 : 0.28) : isSel ? 0.3 : 0.02,
          }
        },
        onEachFeature: (f, layer) => {
          const id = f.properties.id
          if (!quiz) {
            layer.on('click', () => pick({ type: 'region', id }))
            layer.on('mouseover', () => (layer as L.Path).setStyle({ fillOpacity: 0.45 }))
            layer.on('mouseout', () => (layer as L.Path).setStyle({ fillOpacity: regionFill ? (selection?.type === 'region' && selection.id === id ? 0.55 : 0.28) : selection?.type === 'region' && selection.id === id ? 0.3 : 0.02 }))
            layer.bindTooltip(tr(regionById[id]?.name), { sticky: true, className: 'kg-tip' })
          }
        },
      }).addTo(g)
    }

    if (on('glaciers')) {
      L.geoJSON(geo.glaciers, { pane: 'polys', interactive: false, style: { color: '#bcd8ea', weight: 0.8, fillColor: '#f2f8fd', fillOpacity: 0.9 } }).addTo(g)
    }

    if (on('lakes') || highlight?.layer === 'lakes') {
      L.geoJSON(geo.lakes, {
        pane: 'polys',
        style: (f) => {
          const isHi = highlight?.layer === 'lakes' && highlight.id === f?.properties.id
          const isSel = selection?.type === 'lake' && selection.id === f?.properties.id
          return { color: isHi || isSel ? '#ffd166' : '#1f6fb0', weight: isHi || isSel ? 3 : 1, fillColor: isHi ? '#ffd166' : '#3f8fcf', fillOpacity: 0.85 }
        },
        onEachFeature: (f, layer) => {
          const id = f.properties.id
          if (quiz) return
          layer.on('click', () => pick({ type: 'lake', id }))
          const info = lakeById[id]
          if (info && !minimal) layer.bindTooltip(tr(info.name), { permanent: id === 'issykkul' || id === 'songkol' || id === 'chatyrkol', direction: 'center', className: 'kg-label' })
        },
      }).addTo(g)
    }

    if (on('streams')) {
      L.geoJSON(geo.streams, { pane: 'lines', interactive: false, style: (f) => ({ color: '#6fb6e8', weight: (f?.properties.o ?? 1) * 0.8 + 0.4, opacity: 0.85 }) }).addTo(g)
    }

    if (on('rivers') || highlight?.layer === 'rivers') {
      L.geoJSON(geo.rivers, {
        pane: 'lines',
        style: (f) => {
          const id = f?.properties.id
          const isHi = highlight?.layer === 'rivers' && highlight.id === id
          const isSel = selection?.type === 'river' && selection.id === id
          if (highlight?.layer === 'rivers' && !isHi) return { opacity: 0, weight: 0 }
          return { color: isHi ? '#ffd166' : isSel ? '#0b5fbf' : '#2f8fd8', weight: isHi || isSel ? 5 : 3, opacity: 0.95, lineCap: 'round' }
        },
        onEachFeature: (f, layer) => {
          const id = f.properties.id
          if (quiz) return
          // fat invisible hit area for touch
          const g0 = f.geometry as GeoJSON.LineString | GeoJSON.MultiLineString
          const coords = (g0.type === 'LineString' ? [g0.coordinates] : g0.coordinates) as number[][][]
          L.polyline(coords.map((c) => c.map(([x, y]) => [y, x] as [number, number])), { pane: 'lines', weight: 18, opacity: 0 })
            .on('click', () => pick({ type: 'river', id }))
            .bindTooltip(tr(riverById[id]?.name), { sticky: true, className: 'kg-tip' })
            .addTo(g)
          layer.on('click', () => pick({ type: 'river', id }))
          if (!minimal) {
            L.marker(lineMid(coords[0]), { pane: 'points', interactive: false, icon: L.divIcon({ className: '', html: '' }) })
              .bindTooltip(tr(riverById[id]?.name), { permanent: true, direction: 'top', className: 'kg-label lbl-mid', opacity: 0.9 })
              .addTo(g)
          }
        },
      }).addTo(g)
      if (animateRiver && selection?.type === 'river') {
        const f = geo.rivers.features.find((x) => x.properties.id === selection.id)
        if (f) {
          const coords = (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][]
          L.polyline(coords.map((c) => c.map(([x, y]) => [y, x] as [number, number])), { pane: 'lines', color: '#e8f7ff', weight: 3, className: 'river-flow', interactive: false }).addTo(g)
          const start = coords[0][0]
          L.circleMarker([start[1], start[0]], { pane: 'points', radius: 6, color: '#fff', weight: 2, fillColor: '#0b5fbf', fillOpacity: 1 })
            .bindTooltip(t('river.source'), { permanent: true, direction: 'right', className: 'kg-label' })
            .addTo(g)
        }
      }
    }

    if (on('ridges') || highlight?.layer === 'ridges') {
      L.geoJSON(geo.ridges, {
        pane: 'lines',
        style: (f) => {
          const id = f?.properties.id
          const isHi = highlight?.layer === 'ridges' && highlight.id === id
          const isSel = selection?.type === 'ridge' && selection.id === id
          if (highlight?.layer === 'ridges' && !isHi) return { opacity: 0, weight: 0 }
          return { color: isHi ? '#ffd166' : isSel ? '#ffd166' : '#8b4f2a', weight: isHi || isSel ? 5 : 3, opacity: 0.9, dashArray: isHi || isSel ? undefined : '8 5' }
        },
        onEachFeature: (f, layer) => {
          const id = f.properties.id
          if (quiz) return
          layer.on('click', () => pick({ type: 'ridge', id }))
          const g1 = f.geometry as GeoJSON.LineString | GeoJSON.MultiLineString
          const coords = (g1.type === 'LineString' ? g1.coordinates : g1.coordinates[0]) as number[][]
          L.polyline(coords.map(([x, y]) => [y, x] as [number, number]), { pane: 'lines', weight: 16, opacity: 0 })
            .on('click', () => pick({ type: 'ridge', id }))
            .addTo(g)
          if (!minimal)
            L.marker(lineMid(coords), { pane: 'points', interactive: false, icon: L.divIcon({ className: '', html: '' }) })
              .bindTooltip(tr(ridgeById[id]?.name).replace(/\s*\(.*\)/, ''), { permanent: true, direction: 'center', className: 'kg-label lbl-lo', opacity: 0.85 })
              .addTo(g)
        },
      }).addTo(g)
    }

    const kinds = new Set<string>()
    if (on('cities')) kinds.add('city')
    if (on('peaks')) {
      kinds.add('peak')
      kinds.add('glacier')
    }
    if (on('sites') || on('forests')) {
      kinds.add('forest')
      kinds.add('reserve')
      kinds.add('site')
    }
    if (!quiz)
      places
        .filter((p) => kinds.has(p.kind) && (!placeKinds || placeKinds.includes(p.kind)))
        .forEach((p) => {
          const isSel = selection?.type === 'place' && selection.id === p.id
          const capital = p.id === 'c-bishkek'
          let marker: L.Layer
          if (p.kind === 'peak' || p.kind === 'glacier') {
            marker = L.marker([p.lat, p.lon], {
              pane: 'points',
              icon: L.divIcon({
                className: '',
                iconSize: [18, 16],
                iconAnchor: [9, 14],
                html: `<svg width="18" height="16" viewBox="0 0 18 16"><path d="M9 1 L17 15 H1 Z" fill="${p.kind === 'glacier' ? '#9fdcf6' : isSel ? '#ffd166' : '#ffffff'}" stroke="#0b1424" stroke-width="1.5"/></svg>`,
              }),
            })
          } else if (p.kind === 'city') {
            marker = L.circleMarker([p.lat, p.lon], { pane: 'points', radius: capital ? 7 : 4.5, color: '#fff', weight: 2, fillColor: capital ? '#e63946' : '#ff6b6b', fillOpacity: 1 })
          } else {
            marker = L.circleMarker([p.lat, p.lon], { pane: 'points', radius: 7, color: '#fff', weight: 2, fillColor: p.kind === 'reserve' ? '#1f5a5e' : '#3c9a5f', fillOpacity: 1 })
          }
          ;(marker as L.Marker)
            .on('click', () => pick({ type: 'place', id: p.id }))
            .bindTooltip(tr(p.name) + (p.elev ? ` · ${p.elev} ${t('common.m')}` : ''), {
              permanent: !minimal && (p.kind !== 'city' || ['c-bishkek', 'c-osh', 'c-karakol', 'c-naryn', 'c-jalalabad', 'c-talas', 'c-batken'].includes(p.id)),
              direction: 'right',
              offset: [6, 0],
              className: `kg-label ${p.id === 'c-bishkek' || p.id === 'c-osh' || p.id === 'p-pobeda' || p.id === 'p-lenin' ? '' : p.kind === 'city' ? 'lbl-lo' : 'lbl-mid'}`,
            })
            .addTo(g)
        })

    if (on('climate')) {
      climateStations.forEach((s) => {
        const isSel = selection?.type === 'station' && selection.id === s.id
        const annual = s.prcp ? s.prcp.reduce((a, b) => a + b, 0) : null
        const r = annual ? 5 + Math.sqrt(annual) / 3 : 6
        L.circleMarker([s.lat, s.lon], { pane: 'points', radius: r, color: isSel ? '#ffd166' : '#fff', weight: isSel ? 3 : 1.5, fillColor: '#f6b04f', fillOpacity: 0.85 })
          .on('click', () => pick({ type: 'station', id: s.id }))
          .bindTooltip(`${tr(stationNames[s.id])} · ${s.elev} ${t('common.m')}${annual ? ` · ${annual} ${t('common.mm')}` : ''}`, { className: 'kg-tip', direction: 'top' })
          .addTo(g)
      })
    }
  }, [overlays, selection, highlight, quiz, regionFill, animateRiver, lang, theme, base, minimal, placeKinds, t, tr, openObj])

  // focus on selection
  useEffect(() => {
    const m = map.current
    if (!m || !selection) return
    touched.current = true
    if (selection.type === 'place') {
      const p = placeById[selection.id]
      if (p) m.flyTo([p.lat, p.lon], Math.max(m.getZoom(), 8), { duration: 0.8 })
    }
    if (selection.type === 'region' || selection.type === 'river' || selection.type === 'lake' || selection.type === 'ridge') {
      const coll = selection.type === 'region' ? geo.regions : selection.type === 'river' ? geo.rivers : selection.type === 'lake' ? geo.lakes : geo.ridges
      const f = (coll.features as { properties: { id: string } }[]).find((x) => x.properties.id === selection.id)
      if (f) m.flyToBounds(L.geoJSON(f as never).getBounds(), { padding: [40, 40], duration: 0.8, maxZoom: 9 })
    }
  }, [selection])

  // fit highlight in quiz
  useEffect(() => {
    if (map.current && quiz) map.current.fitBounds(KG_BOUNDS, { padding: [10, 10] })
  }, [quiz, highlight])

  const btn = 'grid size-9 place-items-center rounded-xl glass text-ink hover:text-glacier'
  return (
    <div className={`relative isolate overflow-hidden rounded-[1.25rem] border border-line ${className}`}>
      <div ref={el} className="absolute inset-0" role="application" aria-label={t('home.map')} />
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-2">
        <button type="button" className={btn} onClick={() => {
            touched.current = true
            map.current?.zoomIn()
          }} title={t('map.zoomIn')} aria-label={t('map.zoomIn')}>
          <Plus size={18} />
        </button>
        <button type="button" className={btn} onClick={() => {
            touched.current = true
            map.current?.zoomOut()
          }} title={t('map.zoomOut')} aria-label={t('map.zoomOut')}>
          <Minus size={18} />
        </button>
        <button type="button" className={btn} onClick={() => map.current?.flyToBounds(KG_BOUNDS, { duration: 0.6 })} title={t('map.reset')} aria-label={t('map.reset')}>
          <Scan size={18} />
        </button>
        {!minimal && (
          <button
            type="button"
            className={btn}
            onClick={() => {
              const box = el.current?.parentElement
              if (!box) return
              if (document.fullscreenElement) document.exitFullscreen()
              else box.requestFullscreen?.().catch(() => undefined)
            }}
            title={t('map.fullscreen')}
            aria-label={t('map.fullscreen')}
          >
            <Maximize2 size={16} />
          </button>
        )}
      </div>
      {offline && <div className="absolute bottom-8 left-3 right-14 z-[500] rounded-xl glass px-3 py-2 text-xs">{t('map.offline')}</div>}
    </div>
  )
}
