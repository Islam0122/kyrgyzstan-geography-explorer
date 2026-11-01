/** Shimmer shown while a real photo is being found / loaded. */
export function PhotoSkeleton({ className = '' }: { className?: string }) {
  return <div className={`photo-skeleton absolute inset-0 ${className}`} aria-hidden="true" />
}

/**
 * Background used only when no real photo could be obtained (e.g. the visitor is offline):
 * a calm dark tone — no icons, no text, no drawn landscape.
 */
export function PhotoEmpty({ className = '' }: { className?: string }) {
  return <div className={`photo-empty absolute inset-0 ${className}`} aria-hidden="true" />
}
