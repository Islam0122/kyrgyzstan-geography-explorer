import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Expand } from 'lucide-react'
import { fallbackChain, isPhotoReady, photoById, photoForScene, photoSrc, photoSrcSet, type Photo } from '../../data/images'
import { useI18n } from '../../hooks/useI18n'
import { useLightbox } from '../../store/useLightbox'
import type { SceneKind } from '../../types'
import { PhotoPlaceholder, PhotoSkeleton } from './PhotoSkeleton'

export interface RealPhotoProps {
  /** photo id from data/images.ts */
  id?: string
  photo?: Photo
  /** generic landscape kind (used when no id is given) */
  scene?: SceneKind
  seed?: string
  /** wrapper classes: size / aspect / rounding, e.g. "aspect-video w-full rounded-2xl" */
  className?: string
  imgClassName?: string
  sizes?: string
  /** above-the-fold image: eager loading + high fetch priority */
  priority?: boolean
  /** zoom on hover of the closest `.group` */
  zoom?: boolean
  kenburns?: boolean
  /** darkening for text readability */
  overlay?: 'none' | 'bottom' | 'full' | 'hero'
  /** open the lightbox on click; pass ids to browse a group */
  lightbox?: boolean | string[]
  /** small author · licence line over the photo */
  credit?: boolean
  /** compact placeholder (no title) for small slots */
  compact?: boolean
  /** minimal placeholder for backgrounds (hero) */
  quiet?: boolean
  children?: ReactNode
}

export function resolvePhoto({ id, photo, scene, seed }: Pick<RealPhotoProps, 'id' | 'photo' | 'scene' | 'seed'>): Photo | undefined {
  if (photo) return photo
  if (id && photoById[id]) return photoById[id]
  if (scene) return photoForScene(scene, seed)
  return undefined
}

const OVERLAY: Record<NonNullable<RealPhotoProps['overlay']>, string> = {
  none: '',
  bottom: 'bg-gradient-to-t from-navy/85 via-navy/25 to-transparent',
  full: 'bg-navy/35',
  hero: 'bg-[linear-gradient(180deg,rgba(8,17,30,.55)_0%,rgba(8,17,30,.15)_35%,rgba(8,17,30,.55)_70%,rgba(8,17,30,.97)_100%)]',
}

/**
 * Real photograph with lazy loading, responsive srcset, skeleton, error handling with fallback to
 * another real photo and a neutral placeholder when the photo has not been added yet.
 */
export function RealPhoto(props: RealPhotoProps) {
  const { className = '', imgClassName = '', sizes = '(min-width: 1024px) 50vw, 100vw', priority, zoom, kenburns, overlay = 'none', lightbox, credit, compact, quiet, children } = props
  const { tr, t } = useI18n()
  const openLb = useLightbox((s) => s.open)
  const base = resolvePhoto(props)

  // chain of real photos to try: the photo itself, then verified fallbacks
  const chainKey = base?.id ?? ''
  const [st, setSt] = useState({ key: chainKey, idx: 0, loaded: false })
  if (st.key !== chainKey) setSt({ key: chainKey, idx: 0, loaded: false })
  const chain = base ? [base, ...fallbackChain(base)].filter(isPhotoReady) : []
  const cur: Photo | undefined = chain[st.idx]

  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) setSt((s) => (s.loaded ? s : { ...s, loaded: true }))
  }, [cur?.id])

  const motion = `${zoom ? 'transition-transform duration-[900ms] ease-out group-hover:scale-[1.06] group-hover/photo:scale-[1.06]' : ''} ${kenburns ? 'kenburns' : ''}`

  const body = (
    <>
      {cur ? (
        <>
          {!st.loaded && <PhotoSkeleton />}
          <img
            ref={imgRef}
            key={cur.id}
            src={photoSrc(cur)}
            srcSet={photoSrcSet(cur)}
            sizes={cur.responsive ? sizes : undefined}
            width={cur.width}
            height={cur.height}
            alt={`${tr(cur.title)} — ${tr(cur.location)}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            draggable={false}
            onLoad={() => setSt((s) => ({ ...s, loaded: true }))}
            onError={() => setSt((s) => ({ ...s, idx: s.idx + 1, loaded: false }))}
            style={{ objectPosition: cur.focus ?? '50% 50%' }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${st.loaded ? 'opacity-100' : 'opacity-0'} ${motion} ${imgClassName}`}
          />
        </>
      ) : (
        <PhotoPlaceholder photo={base} compact={compact} quiet={quiet} />
      )}
      {overlay !== 'none' && <div className={`pointer-events-none absolute inset-0 ${OVERLAY[overlay]}`} />}
      {credit && cur && (
        <span className="pointer-events-none absolute bottom-1.5 right-2 max-w-[70%] truncate rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/90 backdrop-blur-sm">
          © {cur.photographer} · {cur.license}
        </span>
      )}
      {children}
    </>
  )

  const wrapper = `relative isolate overflow-hidden bg-surface-2 ${className}`
  if (lightbox && base) {
    const group = Array.isArray(lightbox) ? lightbox : [base.id]
    const index = Math.max(0, group.indexOf(base.id))
    return (
      <button
        type="button"
        onClick={() => openLb(group.includes(base.id) ? group : [base.id, ...group], index)}
        className={`group/photo block w-full cursor-zoom-in text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glacier ${wrapper}`}
        aria-label={`${t('photo.open')}: ${tr(base.title)}`}
      >
        {body}
        <span className="pointer-events-none absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100">
          <Expand size={15} />
        </span>
      </button>
    )
  }
  return <div className={wrapper}>{body}</div>
}

/** Figure with photo + caption (title · location · credit). Click opens the lightbox. */
export function RealPhotoCard({ id, scene, seed, group, className = '', aspect = 'aspect-[16/9]' }: { id?: string; scene?: SceneKind; seed?: string; group?: string[]; className?: string; aspect?: string }) {
  const { tr, t } = useI18n()
  const ph = resolvePhoto({ id, scene, seed })
  if (!ph) return null
  const ready = isPhotoReady(ph)
  return (
    <figure className={`card overflow-hidden ${className}`}>
      <RealPhoto photo={ph} className={`w-full ${aspect}`} lightbox={group ?? true} zoom />
      <figcaption className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs">
        <div className="min-w-0">
          <div className="truncate font-semibold">{tr(ph.title)}</div>
          <div className="truncate text-muted">{tr(ph.location)}</div>
        </div>
        <div className="shrink-0 text-right text-[10.5px] text-muted">{ready ? `© ${ph.photographer} · ${ph.license}` : t('photo.pending')}</div>
      </figcaption>
    </figure>
  )
}
