import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { asset, heightmapMeta, rasterBounds } from '../../data/maps'
import type { Hotspot } from '../../data/lessons/relief'
import { useI18n } from '../../hooks/useI18n'

/**
 * Real 3D terrain of Kyrgyzstan from the DEM heightmap (public/rasters/heightmap.png:
 * R,G = elevation in metres (16 bit), B = 255 Kyrgyzstan land / 128 lakes / 0 outside).
 */

const WORLD_W = 10
const KM_W = 970 // ≈ width of the raster in km at 41.5°N
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))

const STOPS: [number, [number, number, number]][] = [
  [0, [86, 140, 92]],
  [700, [124, 168, 103]],
  [1200, [196, 200, 132]],
  [1800, [205, 178, 125]],
  [2500, [170, 128, 92]],
  [3200, [140, 104, 84]],
  [3800, [176, 160, 150]],
  [4300, [228, 228, 234]],
  [7500, [255, 255, 255]],
]
function tint(e: number): [number, number, number] {
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, ca] = STOPS[i]
    const [b, cb] = STOPS[i + 1]
    if (e <= b) {
      const t = Math.max(0, (e - a) / (b - a))
      return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]
    }
  }
  return [255, 255, 255]
}

export function Relief3D({ hotspots, active, onPick }: { hotspots: Hotspot[]; active: string | null; onPick: (id: string) => void }) {
  const { t, tr } = useI18n()
  const host = useRef<HTMLDivElement>(null)
  const labels = useRef<Record<string, HTMLButtonElement | null>>({})
  const api = useRef<{ setExag: (v: number) => void; reset: () => void; setAuto: (v: boolean) => void } | null>(null)
  const [exag, setExag] = useState(6)
  const [auto, setAuto] = useState(true)
  const [status, setStatus] = useState<'loading' | 'ok' | 'nowebgl'>('loading')

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setStatus('nowebgl')
      return
    }
    let disposed = false
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0b1424, 14, 30)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100)
    const home = new THREE.Vector3(0.6, 6.2, 7.4)
    camera.position.copy(home)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.maxPolarAngle = Math.PI * 0.47
    controls.minDistance = 1.5
    controls.maxDistance = 16
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5

    scene.add(new THREE.HemisphereLight(0xdfefff, 0x3a3020, 1.1))
    const sun = new THREE.DirectionalLight(0xfff3dd, 2.2)
    sun.position.set(-6, 8, -4)
    scene.add(sun)

    const W = heightmapMeta.w
    const H = heightmapMeta.h
    const worldH = (WORLD_W * H) / W
    const unitPerM = WORLD_W / (KM_W * 1000)
    let mesh: THREE.Mesh | null = null
    const exagRef = { current: 6 }
    let heights: Float32Array | null = null
    const [[south, west], [north, east]] = rasterBounds

    const toLocal = (lat: number, lon: number) => {
      const fx = (lon - west) / (east - west)
      const fy = (merc(north) - merc(lat)) / (merc(north) - merc(south))
      const ix = Math.min(W - 1, Math.max(0, Math.round(fx * (W - 1))))
      const iy = Math.min(H - 1, Math.max(0, Math.round(fy * (H - 1))))
      const h = heights ? heights[iy * W + ix] : 0
      return new THREE.Vector3((fx - 0.5) * WORLD_W, (0.5 - fy) * worldH, h * unitPerM)
    }

    const img = new Image()
    img.onload = () => {
      if (disposed) return
      const c = document.createElement('canvas')
      c.width = W
      c.height = H
      const ctx = c.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0)
      const px = ctx.getImageData(0, 0, W, H).data
      const geo = new THREE.PlaneGeometry(WORLD_W, worldH, W - 1, H - 1)
      const pos = geo.attributes.position as THREE.BufferAttribute
      const colors = new Float32Array(pos.count * 3)
      heights = new Float32Array(W * H)
      for (let i = 0; i < pos.count; i++) {
        const e = px[i * 4] * 256 + px[i * 4 + 1]
        const cls = px[i * 4 + 2]
        heights[i] = e
        pos.setZ(i, e * unitPerM)
        let [r, g, b] = cls === 128 ? [60, 130, 196] : tint(e)
        if (cls === 0) {
          const k = 0.38
          r = r * k + 30 * (1 - k)
          g = g * k + 40 * (1 - k)
          b = b * k + 60 * (1 - k)
        }
        colors[i * 3] = r / 255
        colors[i * 3 + 1] = g / 255
        colors[i * 3 + 2] = b / 255
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geo.computeVertexNormals()
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })
      mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = -Math.PI / 2
      mesh.scale.z = exagRef.current
      scene.add(mesh)
      // base plate
      const plate = new THREE.Mesh(new THREE.BoxGeometry(WORLD_W, 0.06, worldH), new THREE.MeshStandardMaterial({ color: 0x0f1d30 }))
      plate.position.y = -0.031
      scene.add(plate)
      setStatus('ok')
    }
    img.onerror = () => setStatus('nowebgl')
    img.src = asset('rasters/heightmap.png')

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const tmp = new THREE.Vector3()
    const project = () => {
      if (!mesh) return
      for (const h of hotspots) {
        const lab = labels.current[h.id]
        if (!lab) continue
        const p = toLocal(h.lat, h.lon)
        p.z += 0.05 / exagRef.current
        tmp.copy(p)
        mesh.localToWorld(tmp)
        tmp.y += 0.08
        tmp.project(camera)
        const vis = tmp.z < 1 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1
        lab.style.display = vis ? 'flex' : 'none'
        lab.style.transform = `translate(-50%, -100%) translate(${((tmp.x + 1) / 2) * el.clientWidth}px, ${((1 - tmp.y) / 2) * el.clientHeight}px)`
      }
    }

    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      controls.update()
      renderer.render(scene, camera)
      project()
    }
    loop()

    api.current = {
      setExag: (v) => {
        exagRef.current = v
        if (mesh) mesh.scale.z = v
      },
      reset: () => {
        camera.position.copy(home)
        controls.target.set(0, 0, 0)
      },
      setAuto: (v) => {
        controls.autoRotate = v
      },
    }
    controls.addEventListener('start', () => {
      controls.autoRotate = false
      setAuto(false)
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [hotspots])

  useEffect(() => api.current?.setExag(exag), [exag])
  useEffect(() => api.current?.setAuto(auto), [auto])

  return (
    <div className="relative h-[460px] overflow-hidden rounded-[1.25rem] border border-line bg-[radial-gradient(ellipse_at_top,#1d3b5e,#0b1424_70%)] md:h-[580px]">
      <div ref={host} className="absolute inset-0" />
      {status === 'loading' && <div className="absolute inset-0 grid place-items-center text-sm text-white/70">{t('common.loading')}</div>}
      {status === 'nowebgl' && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/80">{t('relief.3d.nowebgl')}</div>}
      {status === 'ok' &&
        hotspots.map((h) => (
          <button
            key={h.id}
            ref={(b) => {
              labels.current[h.id] = b
            }}
            type="button"
            onClick={() => onPick(h.id)}
            className={`absolute left-0 top-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-bold shadow-lg transition-colors ${active === h.id ? 'bg-amber-300 text-navy' : 'bg-white/90 text-navy hover:bg-white'}`}
            style={{ display: 'none' }}
          >
            <span className={`size-2 rounded-full ${active === h.id ? 'bg-navy' : 'bg-glacier'}`} />
            {tr(h.title).split(',')[0]}
          </button>
        ))}
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 rounded-2xl bg-navy/70 p-2 text-xs text-white backdrop-blur">
        <label className="flex flex-1 items-center gap-2 px-1">
          <span className="whitespace-nowrap">{t('relief.3d.exag')}</span>
          <input type="range" min={1} max={15} step={0.5} value={exag} onChange={(e) => setExag(+e.target.value)} className="min-w-24 flex-1 accent-[var(--glacier)]" />
          <span className="w-8 font-bold">×{exag}</span>
        </label>
        <button type="button" onClick={() => setAuto((a) => !a)} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20" aria-pressed={auto}>
          {auto ? <Pause size={13} /> : <Play size={13} />} {t('relief.3d.rotate')}
        </button>
        <button type="button" onClick={() => api.current?.reset()} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">
          <RotateCcw size={13} /> {t('relief.3d.reset')}
        </button>
      </div>
    </div>
  )
}
