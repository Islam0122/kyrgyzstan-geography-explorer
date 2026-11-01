import { Camera } from 'lucide-react'
import type { Photo } from '../../data/images'
import { useI18n } from '../../hooks/useI18n'

/** Shimmer shown while a real photo is loading. */
export function PhotoSkeleton({ className = '' }: { className?: string }) {
  return <div className={`photo-skeleton absolute inset-0 ${className}`} aria-hidden="true" />
}

/**
 * Neutral placeholder for a photo that has not been added yet (or failed to load with no real
 * fallback). Deliberately NOT a drawing of a landscape: just the subject, place and a note.
 */
export function PhotoPlaceholder({ photo, compact = false, quiet = false, className = '' }: { photo?: Photo; compact?: boolean; quiet?: boolean; className?: string }) {
  const { t, tr } = useI18n()
  if (quiet)
    return (
      <div className={`photo-placeholder photo-placeholder--quiet absolute inset-0 ${className}`} role="img" aria-label={`${photo ? tr(photo.title) + ' — ' : ''}${t('photo.pending')}`} />
    )
  return (
    <div className={`photo-placeholder absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4 text-center ${className}`} role="img" aria-label={`${photo ? tr(photo.title) + ' — ' : ''}${t('photo.pending')}`}>
      <span className="grid size-10 place-items-center rounded-full border border-current/20 bg-white/5">
        <Camera size={18} strokeWidth={1.75} />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">{t('photo.pending')}</span>
      {!compact && photo && (
        <>
          <span className="max-w-[28ch] font-display text-sm font-bold leading-tight text-[color:var(--ph-ink)]">{tr(photo.title)}</span>
          <span className="max-w-[34ch] text-[11px] leading-snug opacity-75">{tr(photo.location)}</span>
        </>
      )}
    </div>
  )
}
