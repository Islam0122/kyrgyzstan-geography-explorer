import { ExternalLink } from 'lucide-react'
import { sources } from '../data/sources'
import { useI18n } from '../hooks/useI18n'

export default function SourcesPage() {
  const { t, tr } = useI18n()
  const groups = [
    { k: 'data', title: t('sources.data') },
    { k: 'lit', title: t('sources.lit') },
    { k: 'method', title: t('sources.method') },
  ] as const
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('sources.title')}</h1>
      <p className="mt-2 text-muted">{t('sources.lead')}</p>
      {groups.map((g) => (
        <section key={g.k} className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold">{g.title}</h2>
          <div className="space-y-3">
            {sources
              .filter((s) => s.kind === g.k)
              .map((s) => (
                <article key={s.id} id={s.id} className={`card scroll-mt-24 p-5 target:ring-2 target:ring-glacier ${s.id === 'lecture' ? 'border-amber-400/60' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-bold">{s.title}</h3>
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-glacier">
                        {new URL(s.url).hostname} <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{tr(s.detail)}</p>
                  {s.license && <div className="mt-2 text-xs text-muted">License: {s.license}</div>}
                </article>
              ))}
          </div>
        </section>
      ))}
      <section id="lecture-note" className="mt-10 rounded-2xl border border-amber-400/60 bg-amber-400/10 p-5 text-sm">
        <h2 className="mb-2 font-display text-lg font-bold">{t('sources.lecture')}</h2>
        <p>
          {tr({
            ru: 'Модули 5–6 должны опираться на лекцию №5–6 («ЛЕК 5-6_Растит. покров. Леса-в2.docx»). При подготовке проекта этот файл не был доступен в репозитории, поэтому тексты, высотные диапазоны и списки видов составлены по опубликованной литературе (Головкова, 1990; Атлас КиргССР, 1987; Красная книга КР, 2006). Все тексты модулей 5–6 собраны в файлах src/data/lessons/vegetation.ts и forests.ts — их легко сверить с лекцией и заменить.',
            ky: '5–6-модулдар №5–6 лекцияга («ЛЕК 5-6_Растит. покров. Леса-в2.docx») таянышы керек. Долбоорду даярдоодо бул файл репозиторийде жок болгондуктан, тексттер, бийиктик диапазондору жана түрлөрдүн тизмелери жарыяланган адабият боюнча түзүлдү (Головкова, 1990; КирССР атласы, 1987; КР Кызыл китеби, 2006). 5–6-модулдардын бардык тексттери src/data/lessons/vegetation.ts жана forests.ts файлдарында — аларды лекция менен салыштырып алмаштырууга оңой.',
          })}
        </p>
        <p className="mt-2">
          {tr({
            ru: 'Обозначения в интерфейсе: «справочно» — значение из литературы; «ЦМР» / «расчёт» — вычислено в проекте по открытым данным; «≈» — приблизительное значение или координаты.',
            ky: 'Интерфейстеги белгилер: «маалымдама» — адабияттан алынган маани; «РСМ» / «эсеп» — долбоордо ачык маалыматтар боюнча эсептелген; «≈» — болжолдуу маани же координаттар.',
          })}
        </p>
      </section>
    </div>
  )
}
