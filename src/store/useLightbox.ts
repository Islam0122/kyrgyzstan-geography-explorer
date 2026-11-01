import { create } from 'zustand'

/** Non-persisted UI store for the global photo lightbox. */
interface LightboxState {
  ids: string[]
  index: number
  open: (ids: string[], index?: number) => void
  close: () => void
  go: (delta: number) => void
}

export const useLightbox = create<LightboxState>((set) => ({
  ids: [],
  index: 0,
  open: (ids, index = 0) => set({ ids, index: Math.max(0, Math.min(index, ids.length - 1)) }),
  close: () => set({ ids: [], index: 0 }),
  go: (delta) => set((s) => (s.ids.length ? { index: (s.index + delta + s.ids.length) % s.ids.length } : s)),
}))
