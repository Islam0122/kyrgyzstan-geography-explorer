import type { ReactNode } from 'react'
import { moduleById } from '../../data/lessons/modules'
import type { LessonContent } from '../../data/lessons/types'
import type { ModuleId } from '../../types'
import { ModuleFooter } from './ModuleFooter'
import { ModuleHero } from './ModuleHero'
import { SectionBlock } from './SectionBlock'

/**
 * Shared layout of the six module pages: hero + sections (text from data/lessons) +
 * per-section interactive widgets supplied by the page.
 */
export function ModuleLayout({
  id,
  lesson,
  extras = {},
  asides = {},
  wide = [],
}: {
  id: ModuleId
  lesson: LessonContent
  extras?: Record<string, ReactNode>
  asides?: Record<string, ReactNode>
  wide?: string[]
}) {
  const m = moduleById[id]
  return (
    <>
      <ModuleHero m={m} />
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {m.sections.map((s, i) => (
          <SectionBlock key={s.id} module={id} id={s.id} index={i} title={s.title} block={lesson[s.id]} aside={asides[s.id]} wide={wide.includes(s.id)}>
            {extras[s.id]}
          </SectionBlock>
        ))}
        <ModuleFooter id={id} />
      </div>
    </>
  )
}
