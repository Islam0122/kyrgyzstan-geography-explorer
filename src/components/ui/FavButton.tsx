import { Star } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { useAppStore } from '../../store/useAppStore'

export function FavButton({ id, className = '' }: { id: string; className?: string }) {
  const { t } = useI18n()
  const on = useAppStore((s) => s.favorites.includes(id))
  const toggle = useAppStore((s) => s.toggleFavorite)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggle(id)
      }}
      aria-pressed={on}
      title={on ? t('common.unfavorite') : t('common.favorite')}
      aria-label={on ? t('common.unfavorite') : t('common.favorite')}
      className={`grid size-9 place-items-center rounded-full border border-line transition hover:scale-105 ${on ? 'bg-amber-400/20 text-amber-400' : 'text-muted hover:text-ink'} ${className}`}
    >
      <Star size={17} fill={on ? 'currentColor' : 'none'} />
    </button>
  )
}
