import { Link, useParams } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { QuizRunner } from '../components/quiz/QuizRunner'
import { Icon } from '../components/ui/Icon'
import { ProgressRing } from '../components/ui/ProgressRing'
import { modules, moduleById } from '../data/lessons/modules'
import { finalExam, quizzes } from '../data/quiz'
import { useI18n } from '../hooks/useI18n'
import { PASS } from '../hooks/useProgress'
import { useAppStore } from '../store/useAppStore'
import type { ModuleId } from '../types'

export default function QuizPage() {
  const { id } = useParams()
  const { t, tr } = useI18n()
  const recs = useAppStore((s) => s.quizzes)

  if (id === 'final') {
    return (
      <div className="px-4 py-8 md:px-8">
        <div className="mx-auto mb-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold">{t('quiz.final')}</h1>
          <p className="text-muted">{t('quiz.final.lead')}</p>
        </div>
        <QuizRunner key="final" quizId="final" questions={finalExam} title={t('quiz.final')} />
      </div>
    )
  }
  if (id && id in quizzes) {
    const m = moduleById[id as ModuleId]
    return (
      <div className="px-4 py-8 md:px-8">
        <QuizRunner key={id} quizId={id} questions={quizzes[id as ModuleId]} title={`${t('quiz.module')} ${m.num} · ${tr(m.title)}`} backTo={m.path} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('quiz.title')}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const r = recs[m.id]
          return (
            <Link key={m.id} to={`/quiz/${m.id}`} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-white" style={{ background: m.accent }}>
                <Icon name={m.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted">
                  {t('module.label')} {m.num} · {quizzes[m.id].length} {t('quiz.question').toLowerCase()}
                </div>
                <div className="font-bold leading-snug">{tr(m.title)}</div>
                <div className={`mt-1 text-xs font-bold ${r ? (r.best >= PASS ? 'text-mountain' : 'text-amber-500') : 'text-muted'}`}>{r ? `${t('quiz.best')}: ${r.best}%` : t('quiz.notStarted')}</div>
              </div>
            </Link>
          )
        })}
      </div>
      <Link to="/quiz/final" className="mt-6 flex items-center gap-5 rounded-[1.25rem] bg-gradient-to-r from-navy to-[#1d4a7a] p-6 text-white shadow-xl">
        <GraduationCap size={42} />
        <div className="flex-1">
          <div className="font-display text-xl font-bold">{t('quiz.final')}</div>
          <div className="text-sm text-white/75">
            {t('quiz.final.lead')} · {finalExam.length} {t('quiz.question').toLowerCase()}
          </div>
        </div>
        {recs.final && <ProgressRing value={recs.final.best / 100} size={60} color="#ffd166" />}
      </Link>
    </div>
  )
}
