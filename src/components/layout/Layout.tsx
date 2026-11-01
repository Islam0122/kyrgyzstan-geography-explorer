import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useI18n } from '../../hooks/useI18n'
import { useAppStore } from '../../store/useAppStore'
import { Toasts } from '../ui/Toasts'
import { Header } from './Header'
import { SearchPalette } from './SearchPalette'
import { Sidebar } from './Sidebar'

export function Layout() {
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const { t } = useI18n()
  const loc = useLocation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!loc.hash) window.scrollTo({ top: 0 })
    else setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 120)
  }, [loc.pathname, loc.hash])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[5000] focus:rounded focus:bg-surface-solid focus:p-2">
        Skip
      </a>
      <Header onMenu={() => setMenu(true)} onSearch={() => setSearch(true)} />
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <SearchPalette open={search} onClose={() => setSearch(false)} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line px-4 py-8 text-center text-xs text-muted">
        <div className="mx-auto max-w-5xl space-y-2">
          <div className="font-display font-bold text-ink">Kyrgyzstan Geography Explorer</div>
          <div>
            {t('prog.saved')} ·{' '}
            <Link to="/sources" className="underline hover:text-ink">
              {t('nav.sources')}
            </Link>
          </div>
          <div>Natural Earth · AWS Terrain Tiles (Mapzen/SRTM) · NOAA GHCN-Daily · © OpenStreetMap</div>
        </div>
      </footer>
      <Toasts />
    </div>
  )
}

/** keeps <html> attributes in sync with the store */
export function ThemeSync() {
  const theme = useAppStore((s) => s.theme)
  const lang = useAppStore((s) => s.lang)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = lang === 'ky' ? 'ky' : 'ru'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#08111e' : '#f3f6f9')
  }, [theme, lang])
  return null
}
