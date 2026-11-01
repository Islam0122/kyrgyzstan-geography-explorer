import { Link } from 'react-router-dom'
import { BookMarked } from 'lucide-react'
import { sourceById } from '../../data/sources'
import { useI18n } from '../../hooks/useI18n'

export function SourceChips({ ids }: { ids?: string[] }) {
  const { t, tr } = useI18n()
  if (!ids?.length) return null
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
      <BookMarked size={13} aria-hidden="true" />
      <span className="font-semibold">{t('common.sources')}:</span>
      {ids.map((id) => (
        <Link key={id} to={`/sources#${id}`} className="rounded-full border border-line px-2 py-0.5 hover:border-glacier hover:text-ink">
          {sourceById[id]?.short ? tr(sourceById[id].short) : (sourceById[id]?.title.split(/[,(.—]/)[0].trim() ?? id)}
        </Link>
      ))}
    </div>
  )
}
