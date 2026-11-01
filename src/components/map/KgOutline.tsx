import { useMemo, useState } from 'react'
import { geo } from '../../data/maps'
import { regionById } from '../../data/lessons/geoObjects'
import { useI18n } from '../../hooks/useI18n'

/** Lightweight SVG map of the oblasts (real Natural Earth geometry, equirectangular). */
export function KgOutline({ onPick, className, selected }: { onPick?: (id: string) => void; className?: string; selected?: string | null }) {
  const { tr } = useI18n()
  const [hover, setHover] = useState<string | null>(null)
  const W = 1000
  const { paths, H } = useMemo(() => {
    const [x0, y0, x1, y1] = [69.2, 39.15, 80.3, 43.3]
    const k = Math.cos((41.3 * Math.PI) / 180)
    const sx = W / ((x1 - x0) * k)
    const H = (y1 - y0) * sx
    const pr = (c: number[]) => `${(((c[0] - x0) * k) * sx).toFixed(1)},${((y1 - c[1]) * sx).toFixed(1)}`
    const paths = geo.regions.features.map((f) => {
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
      const d = polys.map((p) => p.map((ring) => 'M' + ring.map(pr).join('L') + 'Z').join('')).join('')
      return { id: f.properties.id, d }
    })
    return { paths, H }
  }, [])
  const label = hover ?? selected
  return (
    <div className={`relative ${className ?? ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full drop-shadow-[0_10px_30px_rgba(79,179,227,.35)]">
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.d}
            role="button"
            tabIndex={0}
            aria-label={tr(regionById[p.id]?.name)}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(p.id)}
            onClick={() => onPick?.(p.id)}
            onKeyDown={(e) => e.key === 'Enter' && onPick?.(p.id)}
            className="cursor-pointer outline-none transition-[fill-opacity] duration-200"
            fill={regionById[p.id]?.color ?? '#888'}
            fillOpacity={label === p.id ? 0.95 : 0.55}
            stroke="rgba(255,255,255,.85)"
            strokeWidth={label === p.id ? 3 : 1.2}
          />
        ))}
      </svg>
      {label && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy shadow">{tr(regionById[label]?.name)}</div>
      )}
    </div>
  )
}
