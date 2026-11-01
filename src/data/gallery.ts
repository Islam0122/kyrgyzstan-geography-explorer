import type { L, ModuleId, SceneKind } from '../types'

export interface GalleryItem {
  id: string
  scene: SceneKind
  title: L
  caption: L
  module: ModuleId
  /** Optional real photo: add a file to public/photos and fill credit + license */
  photo?: { src: string; credit: string; license: string }
}

export const gallery: GalleryItem[] = [
  { id: 'peaks', scene: 'peaks', module: 'relief', title: { ru: 'Центральный Тянь-Шань', ky: 'Борбордук Тянь-Шань' }, caption: { ru: 'Горный узел пика Победы и Хан-Тенгри — царство льда и скал.', ky: 'Жеңиш чокусу менен Хан-Теңирдин тоо түйүнү — муз жана аска падышачылыгы.' } },
  { id: 'lake', scene: 'lake', module: 'water', title: { ru: 'Иссык-Куль', ky: 'Ысык-Көл' }, caption: { ru: 'Незамерзающее озеро в кольце снежных хребтов.', ky: 'Ак кар кыркалардын шакегиндеги тоңбогон көл.' } },
  { id: 'glacier', scene: 'glacier', module: 'water', title: { ru: 'Ледник Инылчек', ky: 'Эңилчек мөңгүсү' }, caption: { ru: 'Один из крупнейших ледников Тянь-Шаня.', ky: 'Тянь-Шандын эң ири мөңгүлөрүнүн бири.' } },
  { id: 'plateau', scene: 'plateau', module: 'relief', title: { ru: 'Сырты Внутреннего Тянь-Шаня', ky: 'Ички Тянь-Шандын сырттары' }, caption: { ru: 'Холодные высокогорные плато на высоте 3000–4000 м.', ky: '3000–4000 м бийиктиктеги суук бийик тоолуу платолор.' } },
  { id: 'meadow', scene: 'meadow', module: 'vegetation', title: { ru: 'Жайлоо Сон-Куль', ky: 'Соң-Көл жайлоосу' }, caption: { ru: 'Субальпийские луга — летние пастбища.', ky: 'Субальп шалбаалары — жайкы жайыттар.' } },
  { id: 'spruce', scene: 'spruce', module: 'forests', title: { ru: 'Ельники Терскей Ала-Тоо', ky: 'Тескей Ала-Тоонун карагайлары' }, caption: { ru: 'Ель Шренка на северных склонах.', ky: 'Түндүк капталдардагы Шренк карагайы.' } },
  { id: 'walnut', scene: 'walnut', module: 'forests', title: { ru: 'Арсланбоб', ky: 'Арстанбап' }, caption: { ru: 'Орехоплодовые леса Ферганского хребта.', ky: 'Фергана кырка тоосунун жаңгак-мөмө токойлору.' } },
  { id: 'juniper', scene: 'juniper', module: 'forests', title: { ru: 'Арчовники юга', ky: 'Түштүктүн арча токойлору' }, caption: { ru: 'Светлые арчовые леса на сухих склонах.', ky: 'Кургак капталдардагы жарык арча токойлору.' } },
  { id: 'fir', scene: 'fir', module: 'forests', title: { ru: 'Пихта Семёнова', ky: 'Семенов май карагайы' }, caption: { ru: 'Редкие пихтовые леса Западного Тянь-Шаня.', ky: 'Батыш Тянь-Шандын сейрек май карагай токойлору.' } },
  { id: 'steppe', scene: 'steppe', module: 'vegetation', title: { ru: 'Горные степи', ky: 'Тоо талаалары' }, caption: { ru: 'Злаковые степи предгорий.', ky: 'Тоо этектериндеги дан өсүмдүктүү талаалар.' } },
  { id: 'desert', scene: 'desert', module: 'vegetation', title: { ru: 'Полупустыни предгорий', ky: 'Тоо этектериндеги жарым чөлдөр' }, caption: { ru: 'Полынь и эфемеры на подгорных равнинах.', ky: 'Тоо этегиндеги түздүктөрдөгү шыралжын жана эфемерлер.' } },
  { id: 'alpine', scene: 'alpine', module: 'vegetation', title: { ru: 'Альпийские луга', ky: 'Альп шалбаалары' }, caption: { ru: 'Яркие цветы короткого высокогорного лета.', ky: 'Кыска бийик тоолуу жайдын ачык гүлдөрү.' } },
  { id: 'river', scene: 'river', module: 'water', title: { ru: 'Ущелья Нарына', ky: 'Нарындын капчыгайлары' }, caption: { ru: 'Горная река в глубоком каньоне.', ky: 'Терең каньондогу тоо дарыясы.' } },
  { id: 'valley', scene: 'valley', module: 'geography', title: { ru: 'Чуйская долина', ky: 'Чүй өрөөнү' }, caption: { ru: 'Плодородная долина у подножия Кыргызского хребта.', ky: 'Кыргыз Ала-Тоосунун этегиндеги түшүмдүү өрөөн.' } },
  { id: 'city', scene: 'city', module: 'geography', title: { ru: 'Бишкек', ky: 'Бишкек' }, caption: { ru: 'Столица на фоне гор.', ky: 'Тоолордун фонундагы борбор шаар.' } },
  { id: 'deciduous', scene: 'deciduous', module: 'forests', title: { ru: 'Пойменные леса', ky: 'Жайылма токойлор' }, caption: { ru: 'Тополя и ивы вдоль горных рек.', ky: 'Тоо дарыяларынын бойундагы теректер жана талдар.' } },
]
