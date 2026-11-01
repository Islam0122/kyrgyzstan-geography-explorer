import { useEffect, useState } from 'react'
import type { Photo } from '../data/images'
import { peekPhoto, resolvePhotoSource, type Resolution } from '../lib/commons'

export type PhotoState = { status: 'loading' } | { status: 'ready'; res: Resolution } | { status: 'none' }

function fromRes(res: Resolution | undefined): PhotoState | undefined {
  if (!res) return undefined
  return res.items.length ? { status: 'ready', res } : { status: 'none' }
}

/**
 * Resolves the real image for a catalogue photo (local file → cached Commons → Commons API).
 * `enabled = false` defers the network lookup (e.g. until the slot is near the viewport).
 */
export function usePhotoSource(ph: Photo | undefined, enabled = true): PhotoState {
  const [state, setState] = useState<{ id?: string; s: PhotoState }>(() => ({ id: ph?.id, s: (ph && fromRes(peekPhoto(ph))) ?? (ph ? { status: 'loading' } : { status: 'none' }) }))
  let cur = state
  if (state.id !== ph?.id) {
    cur = { id: ph?.id, s: (ph && fromRes(peekPhoto(ph))) ?? (ph ? { status: 'loading' } : { status: 'none' }) }
    setState(cur)
  }
  const needs = !!ph && enabled && cur.s.status === 'loading'
  useEffect(() => {
    if (!needs || !ph) return
    let alive = true
    resolvePhotoSource(ph).then((res) => {
      if (alive) setState({ id: ph.id, s: fromRes(res) ?? { status: 'none' } })
    })
    return () => {
      alive = false
    }
  }, [needs, ph])
  return cur.s
}
