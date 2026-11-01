import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Lang, ModuleId } from '../types'

export type Theme = 'dark' | 'light'

export interface QuizRecord {
  best: number // best percent 0..100
  last: number
  attempts: number
  bestCorrect: number
}

export interface Toast {
  id: number
  text: string
  kind: 'xp' | 'badge' | 'info'
}

interface State {
  lang: Lang
  theme: Theme
  langsUsed: Lang[]
  /** `${module}:${section}` ids that were read */
  sections: string[]
  /** map objects opened (ids) */
  mapObjects: string[]
  quizzes: Record<string, QuizRecord>
  favorites: string[]
  presentationDone: boolean
  certName: string
  xp: number
  toasts: Toast[]

  setLang: (l: Lang) => void
  toggleTheme: () => void
  markSection: (module: ModuleId, section: string) => void
  openMapObject: (id: string) => void
  recordQuiz: (quizId: string, percent: number, correct: number) => void
  toggleFavorite: (id: string) => void
  setPresentationDone: () => void
  setCertName: (n: string) => void
  pushToast: (text: string, kind?: Toast['kind']) => void
  dropToast: (id: number) => void
  reset: () => void
}

const XP_SECTION = 10
const XP_MAP = 2
const XP_PER_CORRECT = 5

let toastSeq = 1

const initial = {
  sections: [] as string[],
  mapObjects: [] as string[],
  quizzes: {} as Record<string, QuizRecord>,
  favorites: [] as string[],
  presentationDone: false,
  certName: '',
  xp: 0,
}

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      lang: 'ru',
      theme: 'dark',
      langsUsed: ['ru'],
      toasts: [],
      ...initial,

      setLang: (lang) =>
        set((s) => ({ lang, langsUsed: s.langsUsed.includes(lang) ? s.langsUsed : [...s.langsUsed, lang] })),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      markSection: (module, section) => {
        const key = `${module}:${section}`
        if (get().sections.includes(key)) return
        set((s) => ({ sections: [...s.sections, key], xp: s.xp + XP_SECTION }))
        get().pushToast(`+${XP_SECTION} XP`, 'xp')
      },

      openMapObject: (id) => {
        if (get().mapObjects.includes(id)) return
        set((s) => ({ mapObjects: [...s.mapObjects, id], xp: s.xp + XP_MAP }))
      },

      recordQuiz: (quizId, percent, correct) => {
        const prev = get().quizzes[quizId]
        // XP only for answers beyond the previous best attempt, so retries can't farm XP
        const xpGain = Math.max(0, correct - (prev?.bestCorrect ?? 0)) * XP_PER_CORRECT
        set((s) => ({
          quizzes: {
            ...s.quizzes,
            [quizId]: {
              best: Math.max(prev?.best ?? 0, percent),
              last: percent,
              attempts: (prev?.attempts ?? 0) + 1,
              bestCorrect: Math.max(prev?.bestCorrect ?? 0, correct),
            },
          },
          xp: s.xp + xpGain,
        }))
        if (xpGain > 0) get().pushToast(`+${xpGain} XP`, 'xp')
      },

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
        })),

      setPresentationDone: () => {
        if (get().presentationDone) return
        set((s) => ({ presentationDone: true, xp: s.xp + 30 }))
        get().pushToast('+30 XP', 'xp')
      },
      setCertName: (certName) => set({ certName }),

      pushToast: (text, kind = 'info') => {
        const id = toastSeq++
        set((s) => ({ toasts: [...s.toasts.slice(-3), { id, text, kind }] }))
        setTimeout(() => get().dropToast(id), 2600)
      },
      dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      reset: () => set({ ...initial, langsUsed: [get().lang] }),
    }),
    {
      name: 'kge-state-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ toasts: _t, ...rest }) => {
        void _t
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function'))
      },
    },
  ),
)
