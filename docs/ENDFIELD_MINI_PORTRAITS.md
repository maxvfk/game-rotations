# Arknights: Endfield — миниатюры для карточек действий

**Стартовый набор:** Si, Arcane, Tangtang, Xaihi.  
**Исходники:** [канонический реестр 34 оригинальных PNG](../data/portraits/arknights-endfield.json) и файлы в \`public/portraits/arknights-endfield/\`.  
**Реестр миниатюр:** [arknights-endfield-mini.json](../data/portraits/arknights-endfield-mini.json).

## Спецификация

- Отдельные PNG **48×48 px** для физического хранения, отображение на сайте **24×24 CSS px**.
- Для каждого оператора 96×96 px crop из канонического PNG 150×208–210 px; координаты в реестре \`crop\` отсчитываются от верхнего левого угла **оригинала**, а не от screenshot.
- Сохранён альфа-канал. Downsample: детерминированное 2×2 box averaging с premultiplied alpha; PNG RGBA8 без внешних зависимостей.
- В manifest хранятся ID, путь исходника, путь производного PNG, crop и **полный SHA-256 миниатюры**. Имена и provenance исходника не дублируются.
- Оригинальные 34 PNG и существующий registry не изменены.

## Сборка и проверка

\`\`\`bash
node scripts/generate-endfield-minis.mjs --check
node scripts/generate-endfield-minis.mjs --write   # только явная регенерация
npm run validate:portraits
npm run build
\`\`\`

Генератор читает **только локальные** оригинальные PNG с pinned SHA-256. В режиме \`--check\` без записи регенерирует каждый mini in memory, сравнивает весь файл побайтно с закоммиченным и проверяет SHA-256 реестра. В \`--write\` делает те же проверки и сохраняет файлы. Новые персонажи добавляются после обновления verified original registry, затем добавления соответствующих миниатюр. Любое изменение crop требует пересчёта file bytes/hash и визуального ревью.

**Охват текущего PR:** только подготовка каталога, mini PNG, reproducible generator и CI validation. Рендер Game Rotations пока **не переключается** на новые изображения. Следующий отдельный PR должен выбирать mini по \`input.actor\` с fallback на \`characters[].portrait\`, а потом добавлять Compact mode. Не меняй \`book.characters[].portrait\`: они используются в header/catalog и имеют собственные invariants.

## Правообладатели

Производные изображения сделаны из ранее зафиксированных публичных материалов игры, авторские права принадлежат правообладателям Arknights: Endfield; атрибуция не предоставляет самостоятельной лицензии.
