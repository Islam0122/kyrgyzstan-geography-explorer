import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { climateStations } from '../../data/maps'
import { stationNames } from '../../data/lessons/climate'
import { useI18n } from '../../hooks/useI18n'

const MONTHS = {
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
  ky: ['Үчт', 'Бирд', 'Жалг', 'Чын', 'Бугу', 'Кулж', 'Теке', 'Б.оон', 'А.оон', 'Тогуз', 'Жети', 'Беш'],
}
const tipStyle = { background: 'var(--surface-solid)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--ink)' }
const axis = { fontSize: 11, fill: 'var(--muted)' }

export function useStation(id: string) {
  return climateStations.find((s) => s.id === id) ?? climateStations[0]
}

export function StationPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { tr } = useI18n()
  return (
    <div className="flex flex-wrap gap-1.5">
      {climateStations.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          aria-pressed={value === s.id}
          className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${value === s.id ? 'bg-amber-400 text-navy' : 'bg-surface-2 hover:bg-line'}`}
        >
          {tr(stationNames[s.id])} <span className="opacity-60">{s.elev} m</span>
        </button>
      ))}
    </div>
  )
}

export function ClimogramChart({ id, height = 300 }: { id: string; height?: number }) {
  const { t, lang } = useI18n()
  const s = useStation(id)
  const data = MONTHS[lang].map((m, i) => ({ m, temp: s.temp?.[i] ?? null, prcp: s.prcp?.[i] ?? null }))
  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="m" tick={axis} />
            <YAxis yAxisId="p" tick={axis} unit="" orientation="right" />
            <YAxis yAxisId="t" tick={axis} />
            <Tooltip contentStyle={tipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {s.prcp && <Bar yAxisId="p" dataKey="prcp" name={t('climate.prcp')} fill="#4fb3e3" radius={[5, 5, 0, 0]} />}
            {s.temp && <Line yAxisId="t" type="monotone" dataKey="temp" name={t('climate.temp')} stroke="#e76f51" strokeWidth={3} dot={{ r: 3 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-[11px] text-muted">
        GHCN {s.ghcn} · {s.lat.toFixed(2)}° N, {s.lon.toFixed(2)}° E · {s.elev} m
        {s.temp && ` · ${t('climate.temp').split(',')[0]}: ${s.tempPeriod} (${s.tempYears} ${t('climate.years')})`}
        {s.prcp && ` · ${t('climate.prcp').split(',')[0]}: ${s.prcpPeriod} (≥${s.prcpYears} ${t('climate.years')})`}
      </div>
      {!s.temp && <div className="mt-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs">{t('climate.noTemp')}</div>}
    </div>
  )
}

export function SeasonsChart({ id }: { id: string }) {
  const { t } = useI18n()
  const s = useStation(id)
  const seasons = [
    { k: 'climate.winter' as const, idx: [11, 0, 1], c: '#7fb6e6' },
    { k: 'climate.spring' as const, idx: [2, 3, 4], c: '#8fd19e' },
    { k: 'climate.summer' as const, idx: [5, 6, 7], c: '#f4a261' },
    { k: 'climate.autumn' as const, idx: [8, 9, 10], c: '#d4a373' },
  ]
  const data = seasons.map((x) => ({
    name: t(x.k),
    temp: s.temp ? Math.round((x.idx.reduce((a, i) => a + s.temp![i], 0) / 3) * 10) / 10 : null,
    prcp: s.prcp ? x.idx.reduce((a, i) => a + s.prcp![i], 0) : null,
  }))
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {data.map((d, i) => (
        <div key={d.name} className="card p-4" style={{ borderTop: `4px solid ${seasons[i].c}` }}>
          <div className="text-sm font-bold">{d.name}</div>
          <div className="mt-2 font-display text-2xl font-bold">{d.temp !== null ? `${d.temp > 0 ? '+' : ''}${String(d.temp).replace('.', ',')}°` : '—'}</div>
          <div className="text-sm text-muted">{d.prcp !== null ? `${d.prcp} ${t('common.mm')}` : '—'}</div>
        </div>
      ))}
    </div>
  )
}

export function CompareChart() {
  const { t, tr } = useI18n()
  const [metric, setMetric] = useState<'temp' | 'prcp' | 'amp'>('prcp')
  const data = useMemo(
    () =>
      climateStations
        .map((s) => ({
          name: tr(stationNames[s.id]).split(' (')[0],
          elev: s.elev,
          temp: s.temp ? Math.round((s.temp.reduce((a, b) => a + b, 0) / 12) * 10) / 10 : null,
          prcp: s.prcp ? s.prcp.reduce((a, b) => a + b, 0) : null,
          amp: s.temp ? Math.round((Math.max(...s.temp) - Math.min(...s.temp)) * 10) / 10 : null,
        }))
        .filter((d) => d[metric] !== null)
        .sort((a, b) => a.elev - b.elev),
    [metric, tr],
  )
  const label = metric === 'temp' ? t('climate.meanYear') + ', °C' : metric === 'prcp' ? t('climate.annual') + ', ' + t('common.mm') : t('climate.amplitude') + ', °C'
  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold">{t('climate.metric')}:</span>
        {(['prcp', 'temp', 'amp'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMetric(m)} className={`rounded-full px-3 py-1 text-xs font-bold ${metric === m ? 'bg-glacier text-navy' : 'bg-surface-2'}`}>
            {m === 'temp' ? t('climate.meanYear') : m === 'prcp' ? t('climate.annual') : t('climate.amplitude')}
          </button>
        ))}
      </div>
      <div className="h-80">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis type="number" tick={axis} />
            <YAxis type="category" dataKey="name" tick={axis} width={110} />
            <Tooltip contentStyle={tipStyle} formatter={(v) => [v as number, label]} labelFormatter={(l, p) => `${l} · ${p?.[0]?.payload?.elev ?? ''} m`} />
            <Bar dataKey={metric} name={label} fill={metric === 'prcp' ? '#4fb3e3' : metric === 'temp' ? '#e76f51' : '#b5835a'} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] text-muted">{t('climate.dataNote')}</div>
    </div>
  )
}

/** Temperature vs altitude scatter-like line: stations with full temperature series */
export function LapseChart() {
  const { tr } = useI18n()
  const data = climateStations
    .filter((s) => s.temp)
    .map((s) => ({ name: tr(stationNames[s.id]).split(' (')[0], elev: s.elev, jul: s.temp![6], jan: s.temp![0] }))
    .sort((a, b) => a.elev - b.elev)
  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-bold">{tr({ ru: 'Температура января и июля в зависимости от высоты', ky: 'Январь жана июлдун температурасы бийиктикке жараша' })}</div>
      <div className="h-64">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="elev" tick={axis} unit=" m" />
            <YAxis tick={axis} unit="°" />
            <Tooltip contentStyle={tipStyle} labelFormatter={(l, p) => `${p?.[0]?.payload?.name ?? ''} · ${l} m`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="jul" name={tr({ ru: 'Июль', ky: 'Июль' })} stroke="#e76f51" strokeWidth={3} />
            <Line dataKey="jan" name={tr({ ru: 'Январь', ky: 'Январь' })} stroke="#4fb3e3" strokeWidth={3} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
