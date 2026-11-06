# Arknights: Endfield — миниатюры для карточек действий

**Стартовый набор:** Si, Arcane, Tangtang, Xaihi.  
**Исходники:** [канонический реестр 34 оригинальных PNG](../data/portraits/arknights-endfield.json) и файлы в `public/portraits/arknights-endfield/`.  
**Реестр миниатюр:** [arknights-endfield-mini.json](../data/portraits/arknights-endfield-mini.json).

## Спецификация

- Отдельные PNG **48×48 px** для физического хранения, отображение на сайте **24×24 CSS px**.
- Для каждого оператора 96×96 px crop из канонического PNG 150×208–210 px; координаты в реестре `crop` отсчитываются от верхнего левого угла **оригинала**, а не от screenshot.
- Сохранён альфа-канал. Downsample: детерминированное 2×2 box averaging с premultiplied alpha; PNG RGBA8 без внешних зависимостей.
- В manifest хранятся ID, путь исходника, путь производного PNG, crop и **полный SHA-256 миниатюры**. Имена и provenance исходника не дублируются.
- Оригинальные 34 PNG и существующий registry не изменены.

## Просмотр четырёх образцов

| Si | Arcane | Tangtang | Xaihi |
|:--:|:--:|:--:|:--:|
| ![Si](../public/portraits/arknights-endfield-mini/si.png) | ![Arcane](../public/portraits/arknights-endfield-mini/arcane.png) | ![Tangtang](../public/portraits/arknights-endfield-mini/tangtang.png) | ![Xaihi](../public/portraits/arknights-endfield-mini/xaihi.png) |

Все изображения в таблице — **реальные 48×48 PNG из текущей ветки**. На сайте они будут показываться как 24×24 CSS px.

## Сборка и проверка

```bash
node scripts/generate-endfield-minis.mjs --check
node scripts/generate-endfield-minis.mjs --write   # только явная регенерация
npm run validate:portraits
npm run build
```

Генератор читает **только локальные** оригинальные PNG с pinned SHA-256. В режиме `--check` без записи регенерирует каждый mini in memory, сравнивает весь файл побайтно с закоммиченным и проверяет SHA-256 реестра. В `--write` делает те же проверки и сохраняет файлы. Новые персонажи добавляются после обновления verified original registry, затем добавления соответствующих миниатюр. Любое изменение crop требует пересчёта file bytes/hash и визуального ревью.

**Этап 03 — подключено к рендеру:** в `src/rotation.ts` для каждой карточки Endfield миниатюра разрешается по `input.actor`, а при его отсутствии — по `stage.person`. Источник картинки — этот mini-каталог; если ID отсутствует, используется `book.characters[].portrait`. При ошибке загрузки миниатюры выполняется один fallback на полный портрет, а при повторной ошибке показывается нейтральный glyph. Каждое действие сохраняет подпись и цвет типа навыка. Миниатюра — 24×24 CSS px (`.action-portrait`), исходный файл 48×48 PNG. Оригинальные `book.characters[].portrait` не меняются: они нужны заголовкам и каталогу. Загрузка для PWA offline включена стандартным glob `**/*.{html,js,css,svg,webp,json,png}` в `vite.config.ts`. Тесты проверяют четыре изображения, владельца действия, Prydwen/Maygi, fallback, мобильную верстку, офлайн-повторное открытие и независимость WuWa. **Компактный режим уже включён** и использует те же mini/fallback по `input.actor`; Full/Compact проверяются на 320/390 px и offline PWA.

## Правообладатели

Производные изображения сделаны из ранее зафиксированных публичных материалов игры, авторские права принадлежат правообладателям Arknights: Endfield; атрибуция не предоставляет самостоятельной лицензии.
