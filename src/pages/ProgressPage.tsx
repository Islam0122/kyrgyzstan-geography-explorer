import { Link } from 'react-router-dom'
import { Award, Printer, Trash2 } from 'lucide-react'
import { Logo } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { ProgressRing } from '../components/ui/ProgressRing'
import { modules } from '../data/lessons/modules'
import { useI18n } from '../hooks/useI18n'
import { useProgress } from '../hooks/useProgress'
import { useAppStore } from '../store/useAppStore'

export default function ProgressPage() {
  const { t, tr, lang } = useI18n()
  const p = useProgress()
  const name = useAppStore((s) => s.certName)
  const setName = useAppStore((s) => s.setCertName)
  const reset = useAppStore((s) => s.reset)
  const examPct = p.exam?.best ?? 0
  const date = new Date().toLocaleDateString(lang === 'ky' ? 'ky-KG' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">{t('nav.progress')}</h1>
      <p className="mt-1 text-sm text-muted">{t('prog.saved')}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="card flex items-center gap-5 p-6">
          <ProgressRing value={p.coursePct / 100} size={96} stroke={9} />
          <div>
            <div className="text-sm text-muted">{t('prog.course')}</div>
            <div className="font-display text-3xl font-bold">{p.coursePct}%</div>
          </div>
        </div>
        <div className="card p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted">
                {t('prog.level')} {p.level.level}
              </div>
              <div className="font-display text-2xl font-bold">{t(p.level.key)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted">{t('prog.xp')}</div>
              <div className="font-display text-2xl font-bold text-amber-500">{p.xp} XP</div>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-mountain transition-all" style={{ width: `${p.level.pct * 100}%` }} />
          </div>
          {p.level.next && (
            <div className="mt-1 text-xs text-muted">
              {p.level.next - p.xp} XP {t('prog.toNext')}
            </div>
          )}
        </div>
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-bold">{t('prog.modules')}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const pm = p.perModule[m.id]
          return (
            <Link key={m.id} to={m.path} className="card flex items-center gap-4 p-4">
              <ProgressRing value={pm.pct} size={56} color={m.accent} />
              <div className="min-w-0">
                <div className="text-xs text-muted">{m.num}</div>
                <div className="truncate font-bold">{tr(m.title)}</div>
                <div className="text-xs text-muted">
                  {pm.read}/{pm.total} · {t('quiz.best')}: {pm.quiz ? `${pm.quiz.best}%` : '—'}
                  {pm.done && <span className="ml-1 font-bold text-mountain">✓ {t('module.done')}</span>}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-bold">{t('prog.badges')}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {p.badges.map((b) => (
          <div key={b.id} className={`card p-4 text-center ${b.got ? '' : 'opacity-45 grayscale'}`}>
            <span className={`mx-auto grid size-14 place-items-center rounded-2xl ${b.got ? 'bg-amber-400/20 text-amber-500' : 'bg-surface-2 text-muted'}`}>
              <Icon name={b.icon} size={26} />
            </span>
            <div className="mt-2 font-bold">{t(b.name)}</div>
            <div className="text-xs text-muted">{t(b.desc)}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-10 font-display text-xl font-bold">{t('prog.certificate')}</h2>
      {!p.examOk ? (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
          <p className="text-sm">{t('prog.cert.locked')}</p>
          <Link to="/quiz/final" className="rounded-full bg-glacier px-5 py-2.5 text-sm font-bold text-navy">
            {t('quiz.final')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-bold">{t('prog.cert.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 flex-1 rounded-xl border border-line bg-surface-solid px-3" maxLength={80} />
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-mountain px-5 py-2.5 font-bold text-white">
              <Printer size={17} /> {t('prog.cert.print')}
            </button>
          </label>
          <div id="certificate" className="relative overflow-hidden rounded-2xl border-[10px] border-double border-[#c8a24a] bg-[#fffdf6] p-8 text-center text-[#0b1424] shadow-xl md:p-14">
            <div className="absolute inset-0 opacity-[0.07]" style={{ background: 'repeating-linear-gradient(45deg,#3c9a5f 0 2px,transparent 2px 14px)' }} />
            <div className="relative">
              <div className="flex justify-center">
                <Logo />
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-[#8a6d22]">Kyrgyzstan Geography Explorer</div>
              <div className="mt-4 font-display text-4xl font-bold md:text-5xl">{t('prog.cert.title')}</div>
              <div className="mt-6 text-sm">{t('prog.cert.text')}</div>
              <div className="mx-auto mt-2 max-w-xl border-b-2 border-[#c8a24a] pb-1 font-display text-2xl font-bold md:text-3xl">{name || '—'}</div>
              <div className="mx-auto mt-4 max-w-xl text-base">{t('prog.cert.course')}</div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-8 text-sm">
                <div>
                  <div className="text-xs text-[#5a6b80]">{t('prog.cert.result')}</div>
                  <div className="font-display text-2xl font-bold text-[#3c9a5f]">{examPct}%</div>
                </div>
                <div>
                  <div className="text-xs text-[#5a6b80]">{t('prog.level')}</div>
                  <div className="font-bold">{t(p.level.key)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#5a6b80]">XP</div>
                  <div className="font-bold">{p.xp}</div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <Award className="text-[#c8a24a]" /> {date}
              </div>
              <div className="mt-4 text-[10px] text-[#5a6b80]">{t('prog.cert.demo')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('prog.reset.confirm'))) reset()
          }}
          className="inline-flex items-center gap-2 rounded-full border border-red-500/50 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
        >
          <Trash2 size={16} /> {t('prog.reset')}
        </button>
      </div>
    </div>
  )
}
