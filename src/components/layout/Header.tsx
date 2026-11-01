import { Link, NavLink } from 'react-router-dom'
import { Menu, Moon, Search, Sun } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { useProgress } from '../../hooks/useProgress'
import { useAppStore } from '../../store/useAppStore'

export function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0b1424" />
      <path d="M3 25l8-12 5 7 4-5 9 10z" fill="#4fb3e3" />
      <path d="M11 13l2.6 3.8-2.6-.6-1.7 1.8z" fill="#fff" />
      <path d="M3 25l8-12 5 7" fill="none" stroke="#3c9a5f" strokeWidth="1.4" />
    </svg>
  )
}

export function Header({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { t, lang } = useI18n()
  const setLang = useAppStore((s) => s.setLang)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const { level, xp } = useProgress()
  const link = ({ isActive }: { isActive: boolean }) => `rounded-full px-3 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'}`
  return (
    <header className="glass glass-strong sticky top-0 z-[1000] border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 md:px-6">
        <button type="button" onClick={onMenu} className="grid size-10 place-items-center rounded-xl hover:bg-surface-2" aria-label={t('nav.menu')}>
          <Menu size={21} />
        </button>
        <Link to="/" className="flex items-center gap-2.5" aria-label={t('nav.home')}>
          <Logo />
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-[13px] font-bold tracking-tight">Kyrgyzstan Geography</span>
            <span className="block text-[11px] font-semibold text-muted">Explorer · {t('app.tagline')}</span>
          </span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="main">
          <NavLink to="/atlas" className={link}>
            {t('nav.atlas')}
          </NavLink>
          <NavLink to="/presentation" className={link}>
            {t('nav.presentation')}
          </NavLink>
          <NavLink to="/quiz" className={link}>
            {t('nav.quiz')}
          </NavLink>
          <NavLink to="/glossary" className={link}>
            {t('nav.glossary')}
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={onSearch} className="flex h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm text-muted hover:text-ink" aria-label={t('header.search')}>
            <Search size={17} />
            <span className="hidden md:inline">{t('header.search')}</span>
            <kbd className="hidden rounded border border-line px-1 text-[10px] xl:inline">Ctrl K</kbd>
          </button>
          <Link to="/progress" className="hidden h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-bold sm:flex" title={t('nav.progress')}>
            <span className="grid size-6 place-items-center rounded-full bg-mountain text-[11px] text-white">{level.level}</span>
            {xp} XP
          </Link>
          <button type="button" onClick={toggleTheme} className="grid size-10 place-items-center rounded-xl hover:bg-surface-2" aria-label={theme === 'dark' ? t('header.theme.light') : t('header.theme.dark')} title={theme === 'dark' ? t('header.theme.light') : t('header.theme.dark')}>
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <div className="flex rounded-xl border border-line p-0.5" role="group" aria-label={t('header.lang')}>
            {(['ru', 'ky'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`h-8 rounded-[10px] px-2.5 text-xs font-extrabold transition ${lang === l ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
              >
                {l === 'ru' ? 'RU' : 'KG'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
