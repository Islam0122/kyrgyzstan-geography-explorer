import { Reveal } from '../components/ui/Reveal'
import { PhotoGallery } from '../components/media/PhotoGallery'
import { HeroPhoto } from '../components/media/HeroPhoto'
import { isPhotoReady, photos } from '../data/images'
import { useI18n } from '../hooks/useI18n'

export default function GalleryPage() {
  const { t } = useI18n()
  const ready = photos.filter(isPhotoReady).length
  return (
    <>
      <header className="relative -mt-16 overflow-hidden pt-16 text-snow">
        <HeroPhoto id="water-issyk-kul" parallax={false} />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 md:px-8 md:pb-16 md:pt-24">
          <Reveal>
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Photo Gallery</div>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-6xl">{t('gallery.title')}</h1>
            <p className="mt-4 max-w-2xl text-white/85 md:text-lg">{t('gallery.lead')}</p>
            <div className="mt-5 text-xs font-semibold text-white/60">
              {t('photo.credits.ready')}: {ready} / {photos.length}
            </div>
          </Reveal>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <PhotoGallery />
        <p className="mt-6 text-xs text-muted">{t('gallery.note')}</p>
      </div>
    </>
  )
}
