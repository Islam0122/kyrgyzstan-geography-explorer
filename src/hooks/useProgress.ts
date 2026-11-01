import { useMemo } from 'react'
import { modules } from '../data/lessons/modules'
import { quizzes } from '../data/quiz'
import { useAppStore } from '../store/useAppStore'
import type { ModuleId } from '../types'
import type { UIKey } from '../data/translations/ru'

export const PASS = 60

export const LEVELS = [0, 80, 200, 380, 620, 900]

export function levelOf(xp: number) {
  let lvl = 1
  LEVELS.forEach((need, i) => {
    if (xp >= need) lvl = i + 1
  })
  const cur = LEVELS[lvl - 1]
  const next = LEVELS[lvl] ?? null
  return { level: lvl, key: `level.${lvl}` as UIKey, cur, next, pct: next ? (xp - cur) / (next - cur) : 1 }
}

export interface BadgeDef {
  id: string
  name: UIKey
  desc: UIKey
  icon: string
  got: boolean
}

export function useProgress() {
  const st = useAppStore()
  return useMemo(() => {
    const perModule = Object.fromEntries(
      modules.map((m) => {
        const read = m.sections.filter((s) => st.sections.includes(`${m.id}:${s.id}`)).length
        const q = st.quizzes[m.id]
        const quizOk = !!q && q.best >= PASS
        const pct = (read + (quizOk ? 2 : 0)) / (m.sections.length + 2)
        return [m.id, { read, total: m.sections.length, quiz: q, quizOk, pct, done: read === m.sections.length && quizOk }]
      }),
    ) as unknown as Record<ModuleId, { read: number; total: number; quiz?: { best: number }; quizOk: boolean; pct: number; done: boolean }>
    const exam = st.quizzes.final
    const examOk = !!exam && exam.best >= PASS
    const moduleShare = Object.values(perModule).reduce((a, m) => a + m.pct, 0) / modules.length
    const coursePct = Math.round((moduleShare * 0.85 + (examOk ? 0.15 : 0)) * 100)
    const done = (id: ModuleId) => perModule[id].done
    const badges: BadgeDef[] = [
      { id: 'first', name: 'badge.first', desc: 'badge.first.d', icon: 'footprints', got: st.sections.length > 0 },
      { id: 'cartographer', name: 'badge.cartographer', desc: 'badge.cartographer.d', icon: 'map', got: st.mapObjects.length >= 10 },
      { id: 'navigator', name: 'badge.navigator', desc: 'badge.navigator.d', icon: 'compass', got: done('geography') },
      { id: 'mountaineer', name: 'badge.mountaineer', desc: 'badge.mountaineer.d', icon: 'mountain', got: done('relief') },
      { id: 'meteo', name: 'badge.meteo', desc: 'badge.meteo.d', icon: 'cloud', got: done('climate') },
      { id: 'hydro', name: 'badge.hydro', desc: 'badge.hydro.d', icon: 'droplets', got: done('water') },
      { id: 'botanist', name: 'badge.botanist', desc: 'badge.botanist.d', icon: 'sprout', got: done('vegetation') },
      { id: 'forester', name: 'badge.forester', desc: 'badge.forester.d', icon: 'trees', got: done('forests') },
      { id: 'perfect', name: 'badge.perfect', desc: 'badge.perfect.d', icon: 'star', got: Object.values(st.quizzes).some((q) => q.best === 100) },
      { id: 'speaker', name: 'badge.speaker', desc: 'badge.speaker.d', icon: 'presentation', got: st.presentationDone },
      { id: 'collector', name: 'badge.collector', desc: 'badge.collector.d', icon: 'heart', got: st.favorites.length >= 5 },
      { id: 'polyglot', name: 'badge.polyglot', desc: 'badge.polyglot.d', icon: 'languages', got: st.langsUsed.length >= 2 },
      { id: 'graduate', name: 'badge.graduate', desc: 'badge.graduate.d', icon: 'graduation', got: examOk },
    ]
    return { perModule, coursePct, exam, examOk, badges, level: levelOf(st.xp), xp: st.xp, totalQuestions: quizzes }
  }, [st])
}
