import { lazy, Suspense, Component, type ReactNode } from 'react'
import { HashRouter, Link, Route, Routes } from 'react-router-dom'
import { Layout, ThemeSync } from './components/layout/Layout'
import { useI18n } from './hooks/useI18n'
import HomePage from './pages/HomePage'

const AtlasPage = lazy(() => import('./pages/AtlasPage'))
const GeographyPage = lazy(() => import('./pages/GeographyPage'))
const ReliefPage = lazy(() => import('./pages/ReliefPage'))
const ClimatePage = lazy(() => import('./pages/ClimatePage'))
const WaterPage = lazy(() => import('./pages/WaterPage'))
const VegetationPage = lazy(() => import('./pages/VegetationPage'))
const ForestsPage = lazy(() => import('./pages/ForestsPage'))
const PresentationPage = lazy(() => import('./pages/PresentationPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'))
const GalleryPage = lazy(() => import('./pages/GalleryPage'))
const SourcesPage = lazy(() => import('./pages/SourcesPage'))
const ProgressPage = lazy(() => import('./pages/ProgressPage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))

function Loading() {
  const { t } = useI18n()
  return (
    <div className="grid min-h-[60vh] place-items-center text-muted" role="status">
      <div className="flex items-center gap-3">
        <span className="size-5 animate-spin rounded-full border-2 border-line border-t-glacier" />
        {t('common.loading')}
      </div>
    </div>
  )
}

function ErrorView({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-2xl font-bold">{t('common.error')}</h1>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={onRetry} className="rounded-full bg-glacier px-5 py-2 font-bold text-navy">
            {t('common.retry')}
          </button>
          <Link to="/" onClick={onRetry} className="rounded-full border border-line px-5 py-2 font-bold">
            {t('common.toHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

class Boundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() {
    return { err: true }
  }
  componentDidCatch(e: unknown) {
    console.error(e)
  }
  render() {
    return this.state.err ? <ErrorView onRetry={() => this.setState({ err: false })} /> : this.props.children
  }
}

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <div className="font-display text-6xl font-bold text-glacier">404</div>
        <p className="mt-2">{t('common.notFound')}</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-glacier px-5 py-2 font-bold text-navy">
          {t('common.toHome')}
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ThemeSync />
      <Routes>
        <Route path="/presentation" element={<Boundary><Suspense fallback={<Loading />}><PresentationPage /></Suspense></Boundary>} />
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          {(
            [
              ['atlas', AtlasPage],
              ['geography', GeographyPage],
              ['relief', ReliefPage],
              ['climate', ClimatePage],
              ['water', WaterPage],
              ['vegetation', VegetationPage],
              ['forests', ForestsPage],
              ['quiz', QuizPage],
              ['quiz/:id', QuizPage],
              ['glossary', GlossaryPage],
              ['gallery', GalleryPage],
              ['sources', SourcesPage],
              ['progress', ProgressPage],
              ['favorites', FavoritesPage],
            ] as const
          ).map(([path, C]) => (
            <Route
              key={path}
              path={path}
              element={
                <Boundary>
                  <Suspense fallback={<Loading />}>
                    <C />
                  </Suspense>
                </Boundary>
              }
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
