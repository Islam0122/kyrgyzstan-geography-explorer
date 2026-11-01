import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, RotateCcw, Trophy, XCircle } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { PASS } from '../../hooks/useProgress'
import { useAppStore } from '../../store/useAppStore'
import type { L, MatchQ, Question } from '../../types'
import { GeoMap } from '../map/GeoMap'
import { ProgressRing } from '../ui/ProgressRing'

type Answer = number | number[] | boolean | number[] /* match: index of right for each left */ | null

/** deterministic shuffle so options don't move between renders */
function shuffle<T>(arr: T[], seed: number) {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** score 0..1 for one answer */
export function scoreOf(q: Question, a: Answer): number {
  if (a === null) return 0
  switch (q.type) {
    case 'single':
    case 'map':
      return a === q.answer ? 1 : 0
    case 'truefalse':
      return a === q.answer ? 1 : 0
    case 'multiple': {
      const sel = new Set(a as number[])
      const right = new Set(q.answers)
      let hit = 0
      let wrong = 0
      sel.forEach((s) => (right.has(s) ? hit++ : wrong++))
      return Math.max(0, (hit - wrong) / right.size)
    }
    case 'match': {
      const m = a as number[]
      return m.filter((v, i) => v === i).length / q.pairs.length
    }
  }
}

function MatchInput({ q, value, onChange, locked, seed }: { q: MatchQ; value: number[]; onChange: (v: number[]) => void; locked: boolean; seed: number }) {
  const { t, tr } = useI18n()
  const rights = useMemo(() => shuffle(q.pairs.map((p, i) => ({ i, r: p.right })), seed), [q, seed])
  return (
    <div className="space-y-2">
      {q.pairs.map((p, i) => {
        const ok = locked && value[i] === i
        const bad = locked && value[i] !== i
        return (
          <div key={i} className={`grid items-center gap-2 rounded-xl border p-2 sm:grid-cols-2 ${ok ? 'border-mountain bg-mountain/10' : bad ? 'border-red-500 bg-red-500/10' : 'border-line'}`}>
            <div className="px-2 font-semibold">{tr(p.left)}</div>
            <select
              disabled={locked}
              value={value[i] ?? -1}
              onChange={(e) => {
                const v = [...value]
                v[i] = +e.target.value
                onChange(v)
              }}
              className="w-full rounded-lg border border-line bg-surface-solid px-2 py-2 text-sm"
              aria-label={tr(p.left)}
            >
              <option value={-1}>{t('quiz.match.pick')}</option>
              {rights.map((r) => (
                <option key={r.i} value={r.i}>
                  {tr(r.r)}
                </option>
              ))}
            </select>
            {bad && <div className="px-2 text-xs text-mountain sm:col-span-2">✓ {tr(p.right)}</div>}
          </div>
        )
      })}
    </div>
  )
}

function OptionList({ options, value, multi, locked, correct, onPick, seed }: { options: L[]; value: Answer; multi: boolean; locked: boolean; correct: number[]; onPick: (i: number) => void; seed: number }) {
  const { tr } = useI18n()
  const order = useMemo(() => shuffle(options.map((_, i) => i), seed), [options, seed])
  const sel = (i: number) => (multi ? ((value as number[] | null) ?? []).includes(i) : value === i)
  return (
    <div className="grid gap-2">
      {order.map((i, pos) => {
        const o = options[i]
        const s = sel(i)
        const isRight = correct.includes(i)
        const cls = locked ? (isRight ? 'border-mountain bg-mountain/12' : s ? 'border-red-500 bg-red-500/10' : 'border-line opacity-70') : s ? 'border-glacier bg-glacier/12' : 'border-line hover:border-glacier/60 hover:bg-surface-2'
        return (
          <button key={i} type="button" disabled={locked} onClick={() => onPick(i)} aria-pressed={s} className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-medium transition ${cls}`}>
            <span className={`grid size-6 shrink-0 place-items-center border-2 text-[11px] font-bold ${multi ? 'rounded-md' : 'rounded-full'} ${s ? 'border-glacier bg-glacier text-navy' : 'border-line'}`}>{String.fromCharCode(65 + pos)}</span>
            <span className="flex-1">{tr(o)}</span>
            {locked && isRight && <CheckCircle2 className="text-mountain" size={20} />}
            {locked && s && !isRight && <XCircle className="text-red-500" size={20} />}
          </button>
        )
      })}
    </div>
  )
}

export function QuizRunner({ quizId, questions, title, backTo }: { quizId: string; questions: Question[]; title: string; backTo?: string }) {
  const { t, tr } = useI18n()
  const record = useAppStore((s) => s.recordQuiz)
  const best = useAppStore((s) => s.quizzes[quizId])
  const [attempt, setAttempt] = useState(1)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(() => null))
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false))
  const [done, setDone] = useState(false)

  const q = questions[idx]
  const a = answers[idx]
  const locked = checked[idx]
  const setA = (v: Answer) => setAnswers((arr) => arr.map((x, i) => (i === idx ? v : x)))
  const score = answers.reduce<number>((s, ans, i) => s + scoreOf(questions[i], ans), 0)
  const percent = Math.round((score / questions.length) * 100)
  const ready = a !== null && (q.type !== 'multiple' || (a as number[]).length > 0) && (q.type !== 'match' || (a as number[]).filter((x) => x >= 0).length === (q as MatchQ).pairs.length)
  const s = locked ? scoreOf(q, a) : 0

  const finish = () => {
    setDone(true)
    record(quizId, percent, Math.round(score))
  }
  const restart = () => {
    setAttempt((x) => x + 1)
    setIdx(0)
    setAnswers(questions.map(() => null))
    setChecked(questions.map(() => false))
    setDone(false)
  }

  if (done) {
    const passed = percent >= PASS
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-3xl p-6 md:p-10">
        <div className="flex flex-col items-center text-center">
          <Trophy size={44} className={passed ? 'text-amber-400' : 'text-muted'} />
          <h2 className="mt-3 font-display text-2xl font-bold">{t('quiz.result')}</h2>
          <p className={`mt-1 font-semibold ${passed ? 'text-mountain' : 'text-red-500'}`}>{passed ? t('quiz.passed') : t('quiz.failed')}</p>
          <div className="mt-6 flex items-center gap-8">
            <ProgressRing value={percent / 100} size={120} stroke={10} color={passed ? 'var(--mountain)' : '#e63946'} />
            <div className="text-left text-sm">
              <div>
                {t('quiz.score')}: <b>{(Math.round(score * 10) / 10).toString().replace('.', ',')} / {questions.length}</b>
              </div>
              <div>
                {t('quiz.percent')}: <b>{percent}%</b>
              </div>
              {best && (
                <div>
                  {t('quiz.best')}: <b>{best.best}%</b> · {t('quiz.attempts')}: {best.attempts}
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={restart} className="inline-flex items-center gap-2 rounded-full bg-glacier px-5 py-2.5 font-bold text-navy">
              <RotateCcw size={18} /> {t('quiz.retry')}
            </button>
            {backTo && (
              <Link to={backTo} className="rounded-full border border-line px-5 py-2.5 font-bold">
                {t('quiz.toModule')}
              </Link>
            )}
            <Link to="/progress" className="rounded-full border border-line px-5 py-2.5 font-bold">
              {t('nav.progress')}
            </Link>
          </div>
        </div>
        <div className="mt-10">
          <h3 className="mb-3 font-display text-lg font-bold">{t('quiz.review')}</h3>
          <ol className="space-y-2">
            {questions.map((qq, i) => {
              const sc = scoreOf(qq, answers[i])
              return (
                <li key={qq.id} className="flex gap-3 rounded-xl border border-line p-3 text-sm">
                  {sc === 1 ? <CheckCircle2 className="shrink-0 text-mountain" size={20} /> : <XCircle className={`shrink-0 ${sc > 0 ? 'text-amber-500' : 'text-red-500'}`} size={20} />}
                  <div>
                    <div className="font-semibold">
                      {i + 1}. {tr(qq.q)}
                    </div>
                    <div className="mt-0.5 text-muted">{tr(qq.explain)}</div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </motion.div>
    )
  }

  const typeHint = { single: 'quiz.single', multiple: 'quiz.multiple', truefalse: 'quiz.truefalse', map: 'quiz.map', match: 'quiz.match' } as const

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-bold uppercase tracking-wider text-muted">{title}</div>
          <div className="font-display text-lg font-bold">
            {t('quiz.question')} {idx + 1} {t('quiz.of')} {questions.length}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-muted">{t('quiz.score')}</div>
          <div className="font-bold">{(Math.round(score * 10) / 10).toString().replace('.', ',')}</div>
        </div>
      </div>
      <div className="mb-5 flex gap-1">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`${t('quiz.question')} ${i + 1}`}
            className={`h-2 flex-1 rounded-full transition ${i === idx ? 'bg-glacier' : checked[i] ? (scoreOf(qq, answers[i]) === 1 ? 'bg-mountain' : 'bg-red-400') : 'bg-line'}`}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={`${attempt}-${idx}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="card p-5 md:p-7">
          <div className="mb-1 text-xs font-bold text-glacier">{t(typeHint[q.type])}</div>
          <h2 className="mb-5 font-display text-xl font-bold leading-snug">{tr(q.q)}</h2>
          {q.type === 'map' && <GeoMap overlays={[]} highlight={q.target} quiz className="mb-4 h-[300px]" minimal />}
          {(q.type === 'single' || q.type === 'map') && <OptionList seed={attempt * 7919 + idx * 31 + 3} options={q.options} value={a} multi={false} locked={locked} correct={[q.answer]} onPick={(i) => setA(i)} />}
          {q.type === 'multiple' && (
            <OptionList
              seed={attempt * 7919 + idx * 31 + 3}
              options={q.options}
              value={a}
              multi
              locked={locked}
              correct={q.answers}
              onPick={(i) => {
                const cur = (a as number[] | null) ?? []
                setA(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i])
              }}
            />
          )}
          {q.type === 'truefalse' && (
            <div className="grid grid-cols-2 gap-3">
              {[true, false].map((v) => {
                const s2 = a === v
                const right = q.answer === v
                const cls = locked ? (right ? 'border-mountain bg-mountain/12' : s2 ? 'border-red-500 bg-red-500/10' : 'border-line opacity-70') : s2 ? 'border-glacier bg-glacier/12' : 'border-line hover:bg-surface-2'
                return (
                  <button key={String(v)} type="button" disabled={locked} onClick={() => setA(v)} className={`rounded-xl border-2 px-4 py-4 text-lg font-bold transition ${cls}`}>
                    {v ? t('quiz.true') : t('quiz.false')}
                  </button>
                )
              })}
            </div>
          )}
          {q.type === 'match' && <MatchInput q={q} seed={attempt * 31 + idx} value={(a as number[] | null) ?? q.pairs.map(() => -1)} onChange={(v) => setA(v)} locked={locked} />}

          {locked && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-5 rounded-xl p-4 ${s === 1 ? 'bg-mountain/12' : s > 0 ? 'bg-amber-400/15' : 'bg-red-500/10'}`}>
              <div className="flex items-center gap-2 font-bold">
                {s === 1 ? <CheckCircle2 className="text-mountain" size={20} /> : <XCircle className={s > 0 ? 'text-amber-500' : 'text-red-500'} size={20} />}
                {s === 1 ? t('quiz.correct') : s > 0 ? t('quiz.partial') : t('quiz.wrong')}
              </div>
              <div className="mt-1 text-sm">
                <b>{t('quiz.explain')}:</b> {tr(q.explain)}
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            {!locked ? (
              <button type="button" disabled={!ready} onClick={() => setChecked((c) => c.map((x, i) => (i === idx ? true : x)))} className="rounded-full bg-glacier px-6 py-2.5 font-bold text-navy disabled:opacity-40">
                {t('quiz.check')}
              </button>
            ) : idx < questions.length - 1 ? (
              <button type="button" onClick={() => setIdx(idx + 1)} className="rounded-full bg-glacier px-6 py-2.5 font-bold text-navy">
                {t('quiz.next')}
              </button>
            ) : (
              <button type="button" onClick={finish} disabled={checked.some((c) => !c)} className="rounded-full bg-mountain px-6 py-2.5 font-bold text-white disabled:opacity-40" title={checked.some((c) => !c) ? '…' : undefined}>
                {t('quiz.finish')}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
