import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ClipboardCheck } from 'lucide-react'
import { modules } from '../../data/lessons/modules'
import { useI18n } from '../../hooks/useI18n'
import type { ModuleId } from '../../types'

export function ModuleFooter({ id }: { id: ModuleId }) {
  const { t, tr } = useI18n()
  const i = modules.findIndex((m) => m.id === id)
  const prev = modules[i - 1]
  const next = modules[i + 1]
  return (
    <div className="my-12 grid gap-4 md:grid-cols-3">
      {prev ? (
        <Link to={prev.path} className="card flex items-center gap-3 p-4 hover:border-glacier">
          <ArrowLeft className="shrink-0" />
          <div>
            <div className="text-xs text-muted">{t('module.prev')}</div>
            <div className="font-semibold">{tr(prev.title)}</div>
          </div>
        </Link>
      ) : (
        <div className="hidden md:block" />
      )}
      <Link to={`/quiz/${id}`} className="flex items-center justify-center gap-2 rounded-[1.25rem] bg-mountain p-4 font-bold text-white shadow-lg transition hover:brightness-110">
        <ClipboardCheck /> {t('module.test')}
      </Link>
      {next ? (
        <Link to={next.path} className="card flex items-center justify-end gap-3 p-4 text-right hover:border-glacier">
          <div>
            <div className="text-xs text-muted">{t('module.next')}</div>
            <div className="font-semibold">{tr(next.title)}</div>
          </div>
          <ArrowRight className="shrink-0" />
        </Link>
      ) : (
        <Link to="/quiz/final" className="card flex items-center justify-end gap-3 p-4 text-right hover:border-glacier">
          <div>
            <div className="text-xs text-muted">{t('nav.exam')}</div>
            <div className="font-semibold">{t('quiz.final')}</div>
          </div>
          <ArrowRight className="shrink-0" />
        </Link>
      )}
    </div>
  )
}
