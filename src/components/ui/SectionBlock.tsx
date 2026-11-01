import { useEffect, useRef, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'
import type { Block } from '../../data/lessons/types'
import { useI18n } from '../../hooks/useI18n'
import { useAppStore } from '../../store/useAppStore'
import type { L, ModuleId } from '../../types'
import { Reveal } from './Reveal'
import { Scene } from './Scene'
import { SourceChips } from './SourceChips'

/**
 * A lesson section. It is marked as "read" (XP) once it has been visible for ~2 s.
 */
export function SectionBlock({
  module,
  id,
  title,
  index,
  block,
  children,
  aside,
  wide = false,
}: {
  module: ModuleId
  id: string
  title: L
  index: number
  block?: Block
  children?: ReactNode
  aside?: ReactNode
  wide?: boolean
}) {
  const { tr } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const read = useAppStore((s) => s.sections.includes(`${module}:${id}`))
  const mark = useAppStore((s) => s.markSection)

  useEffect(() => {
    if (read || !ref.current) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) timer = setTimeout(() => mark(module, id), 1800)
        else if (timer) clearTimeout(timer)
      },
      { threshold: 0.35 },
    )
    io.observe(ref.current)
    return () => {
      io.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [read, mark, module, id])

  const showAside = aside ?? (block?.scene ? <SceneCard kind={block.scene} seed={`${module}-${id}`} /> : null)

  return (
    <section ref={ref} id={id} className="scroll-mt-24 py-10 md:py-14">
      <Reveal>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 font-display text-sm font-bold text-muted">{String(index + 1).padStart(2, '0')}</span>
          <h2 className="font-display text-xl font-bold tracking-tight md:text-3xl">{tr(title)}</h2>
          {read && <CheckCircle2 className="shrink-0 text-mountain" size={22} aria-label="✓" />}
        </div>
      </Reveal>
      <div className={wide || !showAside ? '' : 'grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]'}>
        <Reveal delay={0.05}>
          {block && (
            <div className="space-y-4 text-[15.5px] leading-relaxed md:text-base">
              {block.text.map((p, i) => (
                <p key={i}>{tr(p)}</p>
              ))}
              {block.points && (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {block.points.map((p, i) => (
                    <li key={i} className="flex gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-glacier" />
                      {tr(p)}
                    </li>
                  ))}
                </ul>
              )}
              <SourceChips ids={block.sources} />
            </div>
          )}
          {wide && children && <div className="mt-6">{children}</div>}
        </Reveal>
        {!wide && showAside && <Reveal delay={0.12}>{showAside}</Reveal>}
      </div>
      {!wide && children && <div className="mt-8">{children}</div>}
    </section>
  )
}

export function SceneCard({ kind, seed, caption }: { kind: Block['scene'] & string; seed?: string; caption?: string }) {
  const { t } = useI18n()
  return (
    <figure className="card overflow-hidden">
      <Scene kind={kind} seed={seed} className="aspect-[5/3] w-full" animated />
      <figcaption className="px-4 py-2 text-[11px] text-muted">
        {caption ? `${caption} · ` : ''}
        {t('common.illustration')}
      </figcaption>
    </figure>
  )
}
