import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export function Toasts() {
  const toasts = useAppStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[2000] flex flex-col items-end gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30 }}
            className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lg"
          >
            <Sparkles size={16} className={t.kind === 'xp' ? 'text-amber-400' : 'text-glacier'} />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
