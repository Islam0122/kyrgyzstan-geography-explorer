import { motion, useScroll, useTransform } from 'framer-motion'
import { Camera } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { HOME_HERO_PHOTO, isPhotoReady, photoById } from '../../data/images'
import { RealPhoto } from './RealPhoto'

/**
 * Full-screen hero background: a real photo of the Tian Shan with slow Ken Burns movement,
 * scroll parallax and a darkening gradient for readable typography.
 */
export function HeroPhoto({ id = HOME_HERO_PHOTO, parallax = true }: { id?: string; parallax?: boolean }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, parallax ? 180 : 0])
  const ph = photoById[id]
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy" aria-hidden={!isPhotoReady(ph)}>
      <motion.div className="absolute inset-[-4%_0_-12%_0]" style={{ y }}>
        <RealPhoto id={id} className="h-full w-full !bg-navy" sizes="100vw" priority kenburns quiet overlay="hero" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_60%,rgba(8,17,30,.55),transparent_60%)]" />
    </div>
  )
}

/** Author line for the hero photo (licence requirement), or the "photo will be added" note. */
export function HeroCredit({ id = HOME_HERO_PHOTO, className = '' }: { id?: string; className?: string }) {
  const { t } = useI18n()
  const ph = photoById[id]
  if (!isPhotoReady(ph))
    return (
      <span className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/45 ${className}`}>
        <Camera size={12} className="mr-1.5 inline -translate-y-px" />
        {t('photo.pending')}
      </span>
    )
  return (
    <a href={ph.sourceUrl} target="_blank" rel="noreferrer" className={`text-[10.5px] text-white/60 hover:text-white ${className}`}>
      © {ph.photographer} · {ph.source} · {ph.license}
    </a>
  )
}
