import type { L, SceneKind } from '../../types'

/** Text block of a lesson section. Pages render these next to interactive widgets. */
export interface Block {
  text: L[]
  points?: L[]
  facts?: L[]
  scene?: SceneKind
  sources?: string[]
}
export type LessonContent = Record<string, Block>
