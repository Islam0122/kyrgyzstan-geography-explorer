import { belts } from '../../data/lessons/vegetation'
import { forestTypes } from '../../data/lessons/forests'
import { useI18n } from '../../hooks/useI18n'
import type { OverlayId } from './layers'

export function Legends({ overlays }: { overlays: OverlayId[] }) {
  const { t, tr } = useI18n()
  const showBelts = overlays.includes('belts')
  const showForests = overlays.includes('forests')
  if (!showBelts && !showForests) return null
  return (
    <div className="card space-y-3 p-4 text-xs">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{t('map.legend')}</div>
      {showBelts && (
        <div>
          <div className="mb-1.5 font-bold">{t('map.layer.belts')}</div>
          <ul className="space-y-1">
            {belts.map((b) => (
              <li key={b.id} className="flex items-center gap-2">
                <span className="size-3 rounded-sm border border-line" style={{ background: b.color }} />
                {tr(b.name)} <span className="text-muted">
                  {b.id === 'nival' ? `> ${b.from}` : `${b.from}–${b.to}`} {t('common.m')}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-muted">{tr({ ru: 'Схема по ЦМР; на юге границы подняты на 300 м.', ky: 'РСМ боюнча схема; түштүктө чектер 300 мге көтөрүлгөн.' })}</p>
        </div>
      )}
      {showForests && (
        <div>
          <div className="mb-1.5 font-bold">{t('map.layer.forests')}</div>
          <ul className="space-y-1">
            {forestTypes.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <span className="size-3 rounded-sm" style={{ background: f.color }} />
                {tr(f.name)}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-muted">{tr({ ru: 'Модель потенциальных районов (ЦМР × районы по литературе × экспозиция). Не карта лесного фонда.', ky: 'Потенциалдуу аймактардын модели (РСМ × адабият боюнча аймактар × экспозиция). Токой фондусунун картасы эмес.' })}</p>
        </div>
      )}
    </div>
  )
}
