import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { searchIndex } from '../components/layout/searchIndex'
import { FavButton } from '../components/ui/FavButton'
import { useI18n } from '../hooks/useI18n'
import { useAppStore } from '../store/useAppStore'

export default function FavoritesPage() {
  const { t, tr } = useI18n()
  const favs = useAppStore((s) => s.favorites)
  const items = favs.map((f) => searchIndex.find((s) => s.key === f)).filter((x): x is NonNullable<typeof x> => !!x)
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
        <Star className="text-amber-400" fill="currentColor" /> {t('fav.title')}
      </h1>
      {items.length === 0 ? (
        <p className="card mt-8 p-8 text-center text-muted">{t('fav.empty')}</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.key} className="card flex items-center gap-3 p-4">
              <Link to={it.to} className="min-w-0 flex-1">
                <div className="truncate font-bold">{tr(it.title)}</div>
                <div className="text-xs text-glacier">{t('common.showOnMap')} →</div>
              </Link>
              <FavButton id={it.key} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
