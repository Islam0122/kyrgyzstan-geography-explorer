import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo } from 'react'

/** Layered parallax mountain panorama with drifting clouds ("camera movement"). */
function ridgePath(seed: number, base: number, amp: number, n: number, jag = 0.35) {
  let h = seed
  const r = () => {
    h = (h * 16807) % 2147483647
    return h / 2147483647
  }
  let d = `M0,600 L0,${base}`
  for (let i = 1; i <= n; i++) {
    const x = (i / n) * 1600
    const peak = i % 2 === 1
    const y = base - (peak ? amp * (0.5 + r() * 0.5) : amp * r() * jag)
    d += ` L${x.toFixed(1)},${y.toFixed(1)}`
  }
  return d + ' L1600,600 Z'
}

export function HeroLandscape() {
  const { scrollY } = useScroll()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 20 })
  const sy = useSpring(my, { stiffness: 40, damping: 20 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2)
      my.set((e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [mx, my])

  const layers = useMemo(
    () => [
      { d: ridgePath(7, 330, 230, 13, 0.25), fill: 'url(#hl-far)', depth: 0.15, snow: true },
      { d: ridgePath(29, 400, 170, 11), fill: 'url(#hl-mid)', depth: 0.35, snow: true },
      { d: ridgePath(71, 470, 120, 9), fill: 'url(#hl-near)', depth: 0.6, snow: false },
      { d: ridgePath(113, 540, 70, 7), fill: 'url(#hl-front)', depth: 1, snow: false },
    ],
    [],
  )

  const y0 = useTransform(scrollY, [0, 800], [0, 60])
  const y1 = useTransform(scrollY, [0, 800], [0, 120])
  const y2 = useTransform(scrollY, [0, 800], [0, 200])
  const y3 = useTransform(scrollY, [0, 800], [0, 280])
  const ys = [y0, y1, y2, y3]
  const xs = [useTransform(sx, (v) => v * -6), useTransform(sx, (v) => v * -14), useTransform(sx, (v) => v * -24), useTransform(sx, (v) => v * -38)]
  const skyY = useTransform(sy, (v) => v * -6)

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div className="absolute inset-0" style={{ y: skyY }}>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a1a33_0%,#1d4a7a_38%,#6aa6cf_68%,#cfe4ef_100%)]" />
        <div className="absolute left-[68%] top-[16%] size-24 rounded-full bg-[radial-gradient(circle,#fff7dc_0%,rgba(255,240,200,.5)_40%,transparent_70%)] blur-[1px]" />
      </motion.div>
      {/* clouds */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="cloud absolute left-0 h-16 w-72 opacity-70" style={{ top: `${10 + i * 9}%`, animationDuration: `${60 + i * 25}s`, animationDelay: `${-i * 17}s` }}>
          <div className="absolute inset-0 rounded-full bg-white/70 blur-xl" />
          <div className="absolute left-10 top-2 h-10 w-40 rounded-full bg-white/80 blur-md" />
        </div>
      ))}
      <svg className="absolute inset-x-[-4%] bottom-0 h-[78%] w-[108%]" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="hl-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9cb6d1" />
            <stop offset="1" stopColor="#5e7fa3" />
          </linearGradient>
          <linearGradient id="hl-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a7894" />
            <stop offset="1" stopColor="#2f4a66" />
          </linearGradient>
          <linearGradient id="hl-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2e5d4b" />
            <stop offset="1" stopColor="#1b3a33" />
          </linearGradient>
          <linearGradient id="hl-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#163028" />
            <stop offset="1" stopColor="#0b1424" />
          </linearGradient>
          <linearGradient id="hl-snow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="0.28" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="0.36" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {layers.map((l, i) => (
            <clipPath key={i} id={`hl-clip${i}`}>
              <path d={l.d} />
            </clipPath>
          ))}
        </defs>
        {layers.map((l, i) => (
          <motion.g key={i} style={{ x: xs[i], y: ys[i] }}>
            <path d={l.d} fill={l.fill} />
            {l.snow && (
              <g clipPath={`url(#hl-clip${i})`}>
                <rect x="0" y={i === 0 ? 80 : 210} width="1600" height="330" fill="url(#hl-snow)" />
              </g>
            )}
          </motion.g>
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-transparent to-navy" />
    </div>
  )
}
