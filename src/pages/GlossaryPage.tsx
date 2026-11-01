import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { glossary } from '../data/glossary'
import { modules, moduleById } from '../data/lessons/modules'
import { useI18n } from '../hooks/useI18n'
import type { ModuleId } from '../types'

export default function GlossaryPage() {
  const { t, tr, lang } = useI18n()
  const [q, setQ] = useState('')
  const [mod, setMod] = useState<ModuleId | 'all'>('all')
  const list = useMemo(
    () =>
      glossary
        .filter((g) => mod === 'all' || g.module === mod)
        .filter((g) => !q || `${g.term.ru} ${g.term.ky} ${tr(g.def)}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.term[lang].localeCompare(b.term[lang], lang)),
    [q, mod, tr, lang],
  )
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('glossary.title')}</h1>
      <p className="mt-2 text-muted">{t('glossary.lead')}</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3">
          <Search size={17} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('glossary.filter')} className="flex-1 bg-transparent outline-none" />
        </label>
        <select value={mod} onChange={(e) => setMod(e.target.value as ModuleId | 'all')} className="h-11 rounded-xl border border-line bg-surface-solid px-3 text-sm" aria-label={t('nav.modules')}>
          <option value="all">{t('common.all')}</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.num}. {tr(m.short)}
            </option>
          ))}
        </select>
      </div>
      <dl className="mt-6 grid gap-3 md:grid-cols-2">
        {list.map((g) => (
          <div key={g.id} id={g.id} className="card scroll-mt-24 p-4 target:ring-2 target:ring-glacier">
            <dt className="font-display font-bold">{tr(g.term)}</dt>
            <dd className="mt-1 text-sm">{tr(g.def)}</dd>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>
                {lang === 'ru' ? `KG: ${g.term.ky}` : `RU: ${g.term.ru}`}
              </span>
              <Link to={moduleById[g.module].path} className="font-semibold text-glacier">
                {moduleById[g.module].num}
              </Link>
            </div>
          </div>
        ))}
      </dl>
      {list.length === 0 && <p className="mt-10 text-center text-muted">{t('search.empty')}</p>}
    </div>
  )
}
