import { motion, useScroll, useTransform } from 'framer-motion'
import { HOME_HERO_PHOTO, photoById } from '../../data/images'
import { usePhotoSource } from '../../hooks/usePhotoSource'
import { RealPhoto } from './RealPhoto'

/**
 * Full-screen hero background: a real photo of the Tian Shan with slow Ken Burns movement,
 * scroll parallax and a cinematic darkening gradient for readable typography.
 */
export function HeroPhoto({ id = HOME_HERO_PHOTO, parallax = true }: { id?: string; parallax?: boolean }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, parallax ? 180 : 0])
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy">
      <motion.div className="absolute inset-[-4%_0_-12%_0]" style={{ y }}>
        <RealPhoto id={id} className="h-full w-full !bg-navy" sizes="100vw" priority kenburns overlay="hero" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_55%,rgba(5,11,20,.6),transparent_62%)]" />
    </div>
  )
}

/** Author line for a hero photo (licence requirement). */
export function HeroCredit({ id = HOME_HERO_PHOTO, className = '' }: { id?: string; className?: string }) {
  const state = usePhotoSource(photoById[id], true)
  if (state.status !== 'ready') return null
  const item = state.res.items[0]
  return (
    <a href={item.sourceUrl} target="_blank" rel="noreferrer" className={`text-[10.5px] text-white/60 hover:text-white ${className}`}>
      © {item.photographer} · {item.source} · {item.license}
    </a>
  )
}
