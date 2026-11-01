import {
  Bird, BookOpen, Cloud, Compass, Droplets, Footprints, GraduationCap, Heart, Languages, Layers, Leaf, Map, Mountain,
  Presentation, Sprout, Star, Trees, type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  map: Map, mountain: Mountain, cloud: Cloud, droplets: Droplets, sprout: Sprout, trees: Trees, footprints: Footprints,
  compass: Compass, star: Star, presentation: Presentation, heart: Heart, languages: Languages, graduation: GraduationCap,
  layers: Layers, bird: Bird, leaf: Leaf, book: BookOpen,
}

export function Icon({ name, className, size = 20 }: { name: string; className?: string; size?: number }) {
  const C = icons[name] ?? Map
  return <C className={className} size={size} aria-hidden="true" />
}
