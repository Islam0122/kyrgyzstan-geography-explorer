import { memo, useId } from 'react'
import type { SceneKind } from '../../types'

/**
 * Procedural landscape illustrations (SVG). Used instead of photos so the course has no
 * licensing issues and works offline. Each kind = sky + mountain layers + a foreground motif.
 */

function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function ridge(r: () => number, base: number, amp: number, n: number, sharp = 1) {
  const pts: [number, number][] = [[0, 240]]
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 400
    const peak = i % 2 === 1
    const y = base - (peak ? amp * (0.55 + r() * 0.45) * sharp : amp * r() * 0.35)
    pts.push([x, y])
  }
  pts.push([400, 240])
  return pts
}
const P = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ')

function snowCaps(pts: [number, number][], depth: number) {
  // small triangles at each local peak
  const caps: string[] = []
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]
    if (y < pts[i - 1][1] && y < pts[i + 1][1]) {
      const lx = x - ((x - pts[i - 1][0]) * depth) / 2.2
      const ly = y + (pts[i - 1][1] - y) * (depth / 2.2)
      const rx = x + ((pts[i + 1][0] - x) * depth) / 2.2
      const ry = y + (pts[i + 1][1] - y) * (depth / 2.2)
      caps.push(`${x},${y} ${rx},${ry} ${(x + rx) / 2},${ry - 3} ${x},${ry + 4} ${(x + lx) / 2},${ly - 2} ${lx},${ly}`)
    }
  }
  return caps
}

const SKY: Partial<Record<SceneKind, [string, string]>> = {
  desert: ['#f7d9a6', '#f2b77c'],
  steppe: ['#bfe3f5', '#f4e2b5'],
  city: ['#ffb38a', '#7a8fd6'],
  glacier: ['#cfe9fb', '#eaf6ff'],
  alpine: ['#8fc8f0', '#d9efff'],
  clouds: ['#5f8fc2', '#c6def3'],
  plateau: ['#a7cbe6', '#e7eef2'],
}

function Trees({ kind, r }: { kind: SceneKind; r: () => number }) {
  const items: React.ReactNode[] = []
  const count = kind === 'walnut' || kind === 'deciduous' ? 16 : 26
  for (let i = 0; i < count; i++) {
    const x = r() * 420 - 10
    const y = 175 + r() * 60
    const s = 0.6 + ((y - 175) / 60) * 0.9
    if (kind === 'spruce' || kind === 'fir') {
      const c = kind === 'fir' ? '#1d4f52' : '#24563a'
      const h = 34 * s
      items.push(
        <g key={i}>
          <rect x={x - 1} y={y - 4} width={2} height={6} fill="#3d2b1f" />
          <polygon points={`${x},${y - h} ${x + 7 * s},${y - h * 0.45} ${x + 4 * s},${y - h * 0.45} ${x + 10 * s},${y} ${x - 10 * s},${y} ${x - 4 * s},${y - h * 0.45} ${x - 7 * s},${y - h * 0.45}`} fill={c} />
        </g>,
      )
    } else if (kind === 'juniper') {
      items.push(
        <g key={i}>
          <rect x={x - 1.2} y={y - 8 * s} width={2.4} height={10 * s} fill="#5b3f2a" />
          <ellipse cx={x} cy={y - 14 * s} rx={8 * s} ry={11 * s} fill={r() > 0.5 ? '#6f7f3e' : '#58703a'} />
        </g>,
      )
    } else if (kind === 'walnut') {
      items.push(
        <g key={i}>
          <rect x={x - 2} y={y - 12 * s} width={4} height={14 * s} fill="#5b3f2a" />
          <circle cx={x} cy={y - 20 * s} r={14 * s} fill={r() > 0.5 ? '#6fa83a' : '#86bf45'} />
          <circle cx={x + 6 * s} cy={y - 24 * s} r={8 * s} fill="#9ccf55" opacity={0.7} />
        </g>,
      )
    } else {
      const poplar = r() > 0.5
      items.push(
        poplar ? (
          <ellipse key={i} cx={x} cy={y - 18 * s} rx={5 * s} ry={20 * s} fill={r() > 0.4 ? '#c7a43a' : '#9bb54a'} />
        ) : (
          <g key={i}>
            <rect x={x - 1} y={y - 8 * s} width={2} height={9 * s} fill="#e8e4dc" />
            <circle cx={x} cy={y - 15 * s} r={9 * s} fill={r() > 0.5 ? '#d8b448' : '#e3c766'} />
          </g>
        ),
      )
    }
  }
  return <>{items}</>
}

function SceneImpl({ kind, seed, className, animated = false }: { kind: SceneKind; seed?: string; className?: string; animated?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const r = rng(seed ?? kind)
  const sky = SKY[kind] ?? ['#6fb3e6', '#d7ecf8']
  const far = ridge(r, 120, 70, 9, kind === 'peaks' || kind === 'glacier' ? 1.3 : 1)
  const mid = ridge(r, 160, 55, 7)
  const near = ridge(r, 200, 30, 5)
  const highSnow = kind !== 'desert' && kind !== 'city'
  const groundColor: Record<string, string> = {
    desert: '#d8b87a',
    steppe: '#c9c47a',
    meadow: '#7fbf63',
    alpine: '#8dbf86',
    spruce: '#4c8a55',
    fir: '#3f7a5c',
    juniper: '#a39a62',
    walnut: '#6fa84a',
    deciduous: '#9cb35a',
    lake: '#7fae6a',
    valley: '#93b866',
    river: '#7aa86a',
    glacier: '#c9d7e2',
    plateau: '#b8b48a',
    city: '#8a9a7a',
    peaks: '#7b8f7a',
    clouds: '#7fa87a',
  }
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <linearGradient id={`far${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8aa3c0" />
          <stop offset="1" stopColor="#b9c9da" />
        </linearGradient>
        <linearGradient id={`mid${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={kind === 'desert' ? '#b98b5e' : '#5f7d8f'} />
          <stop offset="1" stopColor={kind === 'desert' ? '#cfa274' : '#7d9aa3'} />
        </linearGradient>
        <linearGradient id={`water${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f8fcf" />
          <stop offset="1" stopColor="#1f5f9a" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#sky${uid})`} />
      {kind === 'city' && <circle cx="300" cy="70" r="22" fill="#ffe2a8" opacity="0.9" />}
      {kind !== 'city' && <circle cx="320" cy="48" r="14" fill="#fff6d8" opacity="0.85" />}
      {/* clouds */}
      <g opacity={kind === 'clouds' ? 0.95 : 0.7}>
        {[0, 1, 2].map((i) => (
          <g key={i} className={animated ? 'cloud' : undefined} style={animated ? { animationDuration: `${40 + i * 18}s`, animationDelay: `${-i * 13}s` } : undefined}>
            <ellipse cx={60 + i * 120} cy={40 + i * 14} rx={34} ry={9} fill="#fff" />
            <ellipse cx={80 + i * 120} cy={34 + i * 14} rx={20} ry={10} fill="#fff" />
          </g>
        ))}
      </g>
      <polygon points={P(far)} fill={`url(#far${uid})`} />
      {highSnow && snowCaps(far, kind === 'peaks' || kind === 'glacier' ? 0.9 : 0.6).map((c, i) => <polygon key={i} points={c} fill="#f8fbff" />)}
      <polygon points={P(mid)} fill={`url(#mid${uid})`} />
      {highSnow && kind !== 'steppe' && snowCaps(mid, 0.35).map((c, i) => <polygon key={i} points={c} fill="#eef5fb" opacity={0.9} />)}
      {kind === 'glacier' && <path d="M150,150 C180,170 170,200 200,240 L260,240 C240,200 250,170 230,150 Z" fill="#e6f3fb" stroke="#bcd8ea" />}
      <polygon points={P(near)} fill={groundColor[kind] ?? '#7fae6a'} />
      {kind === 'lake' && (
        <g>
          <ellipse cx="200" cy="212" rx="210" ry="30" fill={`url(#water${uid})`} />
          <ellipse cx="160" cy="205" rx="60" ry="3" fill="#ffffff" opacity="0.35" />
          <ellipse cx="260" cy="218" rx="40" ry="2" fill="#ffffff" opacity="0.3" />
        </g>
      )}
      {kind === 'river' && <path d="M210,170 C180,190 260,200 200,215 S150,235 180,240" stroke="#3f8fcf" strokeWidth="12" fill="none" />}
      {kind === 'valley' && (
        <g>
          <path d="M0,215 C120,205 260,225 400,210 L400,240 L0,240 Z" fill="#b8cf73" />
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={i * 52} y={222 + (i % 2) * 6} width="40" height="5" fill="#d8d47a" opacity="0.8" />
          ))}
        </g>
      )}
      {kind === 'plateau' && (
        <g>
          <rect x="0" y="198" width="400" height="42" fill="#c8c18e" />
          {[90, 140, 300].map((x) => (
            <g key={x}>
              <path d={`M${x - 10},212 Q${x},196 ${x + 10},212 Z`} fill="#f4efe4" />
              <rect x={x - 10} y="211" width="20" height="5" fill="#e2dccd" />
            </g>
          ))}
        </g>
      )}
      {kind === 'city' && (
        <g>
          {Array.from({ length: 14 }).map((_, i) => {
            const h = 14 + r() * 34
            return <rect key={i} x={i * 29} y={232 - h} width={22} height={h} fill={i % 2 ? '#3a4a66' : '#4b5d80'} />
          })}
        </g>
      )}
      {(kind === 'steppe' || kind === 'desert' || kind === 'meadow' || kind === 'alpine') && (
        <g>
          {Array.from({ length: kind === 'desert' ? 14 : 50 }).map((_, i) => {
            const x = r() * 400
            const y = 200 + r() * 40
            if (kind === 'desert') return <circle key={i} cx={x} cy={y} r={2 + r() * 3} fill="#8a8a4a" opacity="0.7" />
            if (kind === 'steppe') return <path key={i} d={`M${x},${y} q2,-8 4,-12 M${x + 2},${y} q1,-6 -2,-10`} stroke="#9a9a4a" strokeWidth="1" fill="none" />
            const colors = kind === 'alpine' ? ['#f2f2ff', '#c9a3ff', '#ffd65a', '#ff8fb1'] : ['#ffd65a', '#ff7a7a', '#ffffff', '#b68cff']
            return <circle key={i} cx={x} cy={y} r={1.6 + r() * 1.4} fill={colors[i % colors.length]} />
          })}
          {kind === 'desert' && <path d="M0,232 Q100,218 200,230 T400,226 L400,240 L0,240Z" fill="#e6c88f" />}
        </g>
      )}
      {(kind === 'spruce' || kind === 'fir' || kind === 'juniper' || kind === 'walnut' || kind === 'deciduous') && <Trees kind={kind} r={r} />}
    </svg>
  )
}

export const Scene = memo(SceneImpl)
