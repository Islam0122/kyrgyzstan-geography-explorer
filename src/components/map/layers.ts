import type { UIKey } from '../../data/translations/ru'

export type BaseId = 'relief' | 'osm' | 'topo' | 'sat' | 'terrain' | 'none'
export type OverlayId =
  | 'admin'
  | 'cities'
  | 'ridges'
  | 'peaks'
  | 'hillshade'
  | 'rivers'
  | 'streams'
  | 'lakes'
  | 'glaciers'
  | 'climate'
  | 'belts'
  | 'forests'
  | 'sites'

export type ModeId = 'general' | 'relief' | 'water' | 'climate' | 'nature'

export const BASES: { id: BaseId; label: UIKey }[] = [
  { id: 'relief', label: 'map.base.relief' },
  { id: 'osm', label: 'map.base.osm' },
  { id: 'topo', label: 'map.base.topo' },
  { id: 'sat', label: 'map.base.sat' },
  { id: 'terrain', label: 'map.base.terrain' },
  { id: 'none', label: 'map.base.none' },
]

export const OVERLAYS: { id: OverlayId; label: UIKey; color: string }[] = [
  { id: 'admin', label: 'map.layer.admin', color: '#f2f2f2' },
  { id: 'cities', label: 'map.layer.cities', color: '#ff6b6b' },
  { id: 'ridges', label: 'map.layer.ridges', color: '#b5835a' },
  { id: 'peaks', label: 'map.layer.peaks', color: '#ffffff' },
  { id: 'hillshade', label: 'map.layer.hillshade', color: '#8a94a6' },
  { id: 'rivers', label: 'map.layer.rivers', color: '#2f8fd8' },
  { id: 'streams', label: 'map.layer.streams', color: '#7fc1ef' },
  { id: 'lakes', label: 'map.layer.lakes', color: '#3f8fcf' },
  { id: 'glaciers', label: 'map.layer.glaciers', color: '#e6f3fb' },
  { id: 'climate', label: 'map.layer.climate', color: '#f6b04f' },
  { id: 'belts', label: 'map.layer.belts', color: '#7cbf5a' },
  { id: 'forests', label: 'map.layer.forests', color: '#2f6e4a' },
]

export const MODES: { id: ModeId; label: UIKey; base: BaseId; overlays: OverlayId[] }[] = [
  { id: 'general', label: 'map.mode.general', base: 'relief', overlays: ['admin', 'cities', 'rivers', 'lakes', 'peaks'] },
  { id: 'relief', label: 'map.mode.relief', base: 'relief', overlays: ['hillshade', 'ridges', 'peaks', 'glaciers', 'lakes'] },
  { id: 'water', label: 'map.mode.water', base: 'relief', overlays: ['rivers', 'streams', 'lakes', 'glaciers', 'cities'] },
  { id: 'climate', label: 'map.mode.climate', base: 'relief', overlays: ['climate', 'admin', 'lakes'] },
  { id: 'nature', label: 'map.mode.nature', base: 'none', overlays: ['belts', 'forests', 'lakes', 'rivers', 'sites'] },
]

export type Selection =
  | { type: 'region'; id: string }
  | { type: 'river'; id: string }
  | { type: 'lake'; id: string }
  | { type: 'ridge'; id: string }
  | { type: 'place'; id: string }
  | { type: 'station'; id: string }
  | { type: 'belt'; id: string }
