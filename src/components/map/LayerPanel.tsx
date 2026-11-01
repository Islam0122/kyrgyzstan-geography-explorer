import { Layers } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { BASES, MODES, OVERLAYS, type BaseId, type ModeId, type OverlayId } from './layers'

export function LayerPanel({
  base,
  overlays,
  mode,
  onBase,
  onToggle,
  onMode,
}: {
  base: BaseId
  overlays: OverlayId[]
  mode: ModeId | null
  onBase: (b: BaseId) => void
  onToggle: (o: OverlayId) => void
  onMode: (m: ModeId) => void
}) {
  const { t } = useI18n()
  return (
    <div className="card space-y-4 p-4">
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t('map.modes')}</div>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onMode(m.id)}
              aria-pressed={mode === m.id}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${mode === m.id ? 'bg-glacier text-navy' : 'bg-surface-2 hover:bg-line'}`}
            >
              {t(m.label)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{t('map.base')}</div>
        <select value={base} onChange={(e) => onBase(e.target.value as BaseId)} className="w-full rounded-xl border border-line bg-surface-solid px-3 py-2 text-sm" aria-label={t('map.base')}>
          {BASES.map((b) => (
            <option key={b.id} value={b.id}>
              {t(b.label)}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
          <Layers size={13} /> {t('map.layers')}
        </legend>
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
          {OVERLAYS.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
              <input type="checkbox" checked={overlays.includes(o.id)} onChange={() => onToggle(o.id)} className="size-4 accent-[var(--glacier)]" />
              <span className="size-3 shrink-0 rounded-sm border border-line" style={{ background: o.color }} />
              <span className="leading-tight">{t(o.label)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-[11px] leading-snug text-muted">{t('map.dataNote')}</p>
    </div>
  )
}
