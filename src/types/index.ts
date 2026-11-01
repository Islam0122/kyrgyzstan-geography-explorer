export type Lang = 'ru' | 'ky'

/** Bilingual string. Every user-visible text in data files uses this shape. */
export interface L {
  ru: string
  ky: string
}

export type ModuleId = 'geography' | 'relief' | 'climate' | 'water' | 'vegetation' | 'forests'

export type SceneKind =
  | 'peaks'
  | 'lake'
  | 'valley'
  | 'glacier'
  | 'river'
  | 'desert'
  | 'steppe'
  | 'meadow'
  | 'alpine'
  | 'spruce'
  | 'fir'
  | 'juniper'
  | 'walnut'
  | 'deciduous'
  | 'city'
  | 'plateau'
  | 'clouds'

export interface Section {
  id: string
  title: L
}

export interface ModuleMeta {
  id: ModuleId
  num: string
  path: string
  title: L
  short: L
  lead: L
  icon: IconName
  accent: string
  scene: SceneKind
  sections: Section[]
}

export type IconName =
  | 'map'
  | 'mountain'
  | 'cloud'
  | 'droplets'
  | 'sprout'
  | 'trees'

/** Source reference id from data/sources.ts */
export type SourceId = string

export interface Fact {
  text: L
  source?: SourceId
}

export interface Place {
  id: string
  name: L
  kind: PlaceKind
  lat: number
  lon: number
  /** true if coordinates are approximate (for orientation only) */
  approx?: boolean
  text?: L
  module?: ModuleId
  elev?: number
}

export type PlaceKind = 'city' | 'peak' | 'lake' | 'river' | 'region' | 'ridge' | 'glacier' | 'forest' | 'reserve' | 'pass' | 'site'

export type QuestionType = 'single' | 'multiple' | 'truefalse' | 'map' | 'match'

interface QBase {
  id: string
  q: L
  explain: L
}

export interface SingleQ extends QBase {
  type: 'single'
  options: L[]
  answer: number
}
export interface MultipleQ extends QBase {
  type: 'multiple'
  options: L[]
  answers: number[]
}
export interface TrueFalseQ extends QBase {
  type: 'truefalse'
  answer: boolean
}
/** Identify a highlighted object on the map */
export interface MapQ extends QBase {
  type: 'map'
  /** which geo layer & feature id to highlight */
  target: { layer: 'regions' | 'lakes' | 'rivers' | 'ridges'; id: string }
  options: L[]
  answer: number
}
export interface MatchQ extends QBase {
  type: 'match'
  pairs: { left: L; right: L }[]
}
export type Question = SingleQ | MultipleQ | TrueFalseQ | MapQ | MatchQ
