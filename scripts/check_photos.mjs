// Validates src/data/images.ts against public/photos.
//   node scripts/check_photos.mjs            → report
//   node scripts/check_photos.mjs --list     → Markdown list of photos still to be added
// Exit code 1 if a "ready" photo is missing its file or credits, or ids are inconsistent.
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const { photos, commonsSpecs, photoById, modulePhotos, sectionPhotos, beltPhotos, forestTypePhotos, objectPhotos, scenePhotos, HOME_HERO_PHOTO, HOME_HERO_STRIP } = await import('../src/data/images.ts')

const errors = []
const ids = new Set()
for (const p of photos) {
  if (ids.has(p.id)) errors.push(`duplicate id ${p.id}`)
  ids.add(p.id)
  if (p.url !== `photos/${p.folder}/${p.id}.webp`) errors.push(`${p.id}: url must be photos/${p.folder}/${p.id}.webp`)
  if (p.status !== 'ready' && !commonsSpecs[p.id]) errors.push(`${p.id}: no local file and no Commons search spec`)
  for (const f of p.fallbacks ?? []) if (!photoById[f]) errors.push(`${p.id}: unknown fallback ${f}`)
  if (p.status === 'ready') {
    for (const k of ['photographer', 'source', 'sourceUrl', 'license']) if (!p[k]) errors.push(`${p.id}: ready but ${k} is empty`)
    const file = join('public', p.url)
    if (!existsSync(file)) errors.push(`${p.id}: file ${file} not found`)
    else if (statSync(file).size < 20_000) errors.push(`${p.id}: ${file} is suspiciously small`)
    if (p.responsive) for (const w of [640, 1280]) if (!existsSync(file.replace(/\.webp$/, `-${w}.webp`))) errors.push(`${p.id}: responsive variant ${w} missing`)
  }
}
const refs = [
  ...Object.values(modulePhotos).flatMap((m) => [m.card, m.hero]),
  HOME_HERO_PHOTO,
  ...HOME_HERO_STRIP,
  ...Object.values(sectionPhotos),
  ...Object.values(beltPhotos),
  ...Object.values(forestTypePhotos),
  ...Object.values(objectPhotos),
  ...Object.values(scenePhotos).flat(),
]
for (const k of Object.keys(commonsSpecs)) if (!photoById[k]) errors.push(`commonsSpecs: unknown id ${k}`)
for (const r of refs) if (!photoById[r]) errors.push(`reference to unknown photo id ${r}`)
const cards = Object.values(modulePhotos).map((m) => m.card)
if (new Set(cards).size !== cards.length) errors.push('module cards must use different photos')

if (process.argv.includes('--list')) {
  const pending = photos.filter((p) => p.status !== 'ready')
  console.log(`| # | id → файл | Категория | Что снять | Место | Кадр | Мин. ширина |\n|---|---|---|---|---|---|---|`)
  pending.forEach((p, i) => console.log(`| ${i + 1} | \`${p.id}\` → \`public/${p.url}\` | ${p.category} | **${p.title.ru}.** ${p.brief.ru} | ${p.location.ru} | ${p.aspect} | ${p.minWidth}px |`))
} else {
  const ready = photos.filter((p) => p.status === 'ready').length
  console.log(`photos: ${photos.length} entries, ${ready} local files, ${photos.length - ready} resolved from Wikimedia Commons at runtime`)
  console.log(`references checked: ${refs.length}`)
}
if (errors.length) {
  console.error(errors.map((e) => '✗ ' + e).join('\n'))
  process.exit(1)
}
console.error('✓ catalogue consistent')
