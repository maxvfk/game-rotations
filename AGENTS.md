# Game Rotations — инструкции для новых чатов и агентов

**Назначение:** публикуемая пользователем библиотека **выбранных** практических игровых ротаций, удобных на телефоне и офлайн. Канонический репозиторий приложения — `maxvfk/game-rotations`; ветка выпуска — `main`.

## Канонические изображения Endfield

**Не искать портреты заново.** Для Arknights: Endfield читай [docs/ENDFIELD_PORTRAITS.md](docs/ENDFIELD_PORTRAITS.md) и `data/portraits/arknights-endfield.json` (**34 оригинальных PNG** с ID/name/SHA), просмотрщик `?portraits=arknights-endfield`. ID `endministrator-m` и `endministrator-f` **раздельные**: не выбирай пол автоматически. Скрипт `team:add` сам разрешает `portrait` по реестру. Перед первой Endfield-ротацией отдельно проверь механики, исходные расчёты и добавь `data/controls/arknights-endfield.json` — каталог портретов не означает готовые кнопки.

## Производные 24px миниатюры Endfield

Для действий команды Si имеется отдельный [каталог mini PNG](data/portraits/arknights-endfield-mini.json), по четырём операторским ID. Смотри [docs/ENDFIELD_MINI_PORTRAITS.md](docs/ENDFIELD_MINI_PORTRAITS.md). Физические файлы 48×48 px должны отображаться как 24×24 CSS px; `scripts/generate-endfield-minis.mjs --check` проверяет SHA и byte parity с исходниками. Не меняй canonical `characters[].portrait` в rotation book и catalog, когда подключаешь эти миниатюры: использовать отдельное отображение по `input.actor` с fallback на основной портрет. С этапа 03 миниатюры 24×24 px рендерятся в каждой Endfield-карточке по `input.actor`, fallback — оригинальный портрет, затем glyph. В WuWa рендере миниатюр Endfield быть не должно; отдельно проверять PWA/offline. Режим компактного отображения — следующий отдельный UI milestone.

## Канонические изображения WuWa

**Не ищи миниатюры заново.** Для Wuthering Waves читай [docs/PORTRAITS.md](docs/PORTRAITS.md), выбирай ID в [data/portraits/wuthering-waves.json](data/portraits/wuthering-waves.json), используй точный `portrait` в данных команды. Сайт показывает [каталог изображений](https://maxvfk.github.io/game-rotations/?portraits=wuthering-waves). Не путай Yangyang с Yangyang Xuanling, Rover стихий и другие варианты. Проверка `npm run validate:portraits` обязательна.

## Добавление команды без ручного дублирования JSON

Перед новой ротацией прочитай [docs/AUTHORING_CLI.md](docs/AUTHORING_CLI.md). Для новой команды **сначала** заполни `examples/new-team.authoring.json` в отдельном working copy, проверь live-kit/evidence/выбор пользователя, затем `npm run team:add -- --spec <path>` (dry-run), и только после ревью — `--write`. Book и catalog создаются согласованно, портрет WuWa берётся из реестра. Не используй `add` для перезаписи существующей команды.

После правок существующего book (`source`, `gameVersion`, `investment/portrait`, variant `verification`) запусти `npm run catalog:sync -- --team <id> --write` и `npm run catalog:check`. Не меняй IDs ради генератора. В build включён `npm run test:authoring` с изолированными и отрицательными сценариями.

## Начать здесь

1. Прочитай [docs/ADDING_ROTATIONS.md](docs/ADDING_ROTATIONS.md) перед созданием/изменением ротации.
2. Для всех полей, формата actions, control mappings и ограничений — [docs/FORMAT_REFERENCE.md](docs/FORMAT_REFERENCE.md) и `data/rotation.schema.json`.
3. Для ревью и проверки — [docs/REVIEW_CHECKLIST.md](docs/REVIEW_CHECKLIST.md).
4. Посмотри [examples/](examples/) (вымышленный пример, **не опубликован**) и реальную WuWa в `data/rotations/wuthering-waves/`.

## Source of truth / проекты

- **Исследования, механика, источник/автор, версии и account-specific adapters:** `maxvfk/Games` → `GAME_META_SOURCES.md`, `guides/README.md`, `guides/<game>/`. Точный locator приложения: `maxvfk/Games/SOURCES.md` → `S-021`.
- **Канонический ростер:** Google Sheet «Игровые персонажи» (locator `S-001` в Games/SOURCES). Читать при необходимости; новое явное сообщение пользователя важнее ростера.
- **Сайт и выбранные карточки:** только `maxvfk/game-rotations`. Не создавать в `Games` конкурирующие UI-копии и не превращать сайт в полную TC-базу.
- **Новая идея ≠ разрешение публиковать.** Добавляй ротации, которые пользователь явно выбрал; при других запросах готовь исследование или PR-драфт без самовольного объявления «проверено».

## Action metadata и требования к отображению

Движок понимает необязательные `input.press:"tap"|"hold"` только для `skill`, `optional:true` + `condition` для условных действий, `hint` для пояснения и `variant.loopCaution` для **непроверенного** повторного цикла. См. [docs/FORMAT_REFERENCE.md](docs/FORMAT_REFERENCE.md). Это видимые подсказки, не игровая симуляция и не система автоматических пропусков. Не меняй настоящие действия или степень проверки только ради визуального бейджа.

## Правила для любой ротации

- **Live-kit first:** проверь актуальные generation/spend, triggers/ICD/cooldowns, buffs, window, field/swap, ownership, limits, server/patch. Опубликованный порядок действий сам по себе не доказывает механику. Не смешивай live/beta/leak.
- **Provenance:** источник, автор/TC, версия/сервер, investment, условия (opener/loop, targets, latency, execution), кем адаптировано; если не доказано — помечай `adapted`, `partial` или `experimental`. Статус WuWaLAB `Verified` сам по себе **не делает** ротацию подтверждённой в реальном бою.
- Не меняй существующие ротации, схемы или `id` без явной цели; `id` участвует в сохранённом прогрессе и ссылках.
- **Никаких секретов или личных данных** в публичном GitHub Pages. Имеющиеся картинки являются игровыми иллюстрациями правообладателей; не загружай чужие приватные файлы.
- Отделяй `input.kind` (для кнопки) от `text` (что именно происходит), `check` (ресурс/условие) и `extra` (оговорка).
- Меняй данные, не копируй HTML. Если действия не укладываются в v1, сначала отдельный обзор расширения `src/rotation-types.ts`, `src/rotation.ts`, схем/проверок/тестов; **не** имитируй неподдерживаемую механику чужой кнопкой.

## Безопасная публикация

1. Прочитай текущий `main`, создай короткую feature-ветку. Не перезаписывай concurrent changes.
2. Добавь/обнови `data/rotations/<game>/<team>.json`, `data/catalog.json`, при необходимости `data/controls/<game>.json`, портреты.
3. Выполни `npm ci` (если нет lockfile, `npm install`), `npm run catalog:check`, `npm run validate:data`, `npm run test:onboarding`, `npm run test:authoring`, `npm run test:renderer`, `npm run build`; проведи проверку UI на телефоне, включая PWA/deep-link. В PR CI дополнительно запускает Playwright Chromium mobile/offline smoke (`npm run test:e2e`) после production build; наличие зелёных JSON-валидаторов **не заменяет** renderer tests.
4. Оформи PR с источниками, списком изменённых ротаций, доказательствами, оставшимися неопределённостями, скриншотами при UI-изменениях. Не называй CI-доказательством игровых механик.
5. Merge только после зелёного CI, ревью и проверки изменений; GitHub Pages разворачивается из `main`. Проверь опубликованную страницу после merge. Если write/CI/deploy недоступны — сообщи точный блокер; не объявляй выпуск.
6. При существенном изменении архитектуры/канонического locator обнови `maxvfk/Games/SOURCES.md` (`S-021`), но для обычного добавления новой команды не трогай project memory.

Для обычной игровой консультации не требуется читать весь этот репозиторий; открывай его только при задаче по сайту.



## Endfield: лаконичные заголовки и без прогресса (2026-11-03)

Для **всех** `book.game==='arknights-endfield'` используй `tracksProgress=false`: круглых кнопок `.complete`, панели `.progress-wrap`, кнопки `#reset` нет ни в полном, ни в компактном виде. Legacy ключи `done:*` в localStorage не удаляй, но не считывай/не обновляй для Endfield. Пошаговый `#view` и `#prev/#next` — только навигация; `at` может сохранять текущий шаг без статуса «выполнено». В WuWa оставить `tracksProgress=true` и все текущие функции чеклистов без изменений.

В compact Endfield показывай вместо большого stage header короткую строку `NN / NN · <short stage title>`, извлекая краткое название из `stage.title` без захардкоженных имён TC; сохраняй большие портреты/полный title/subtitle в полном режиме. Не скрывай warning непроверенного loop и не меняй действий, частичных статусов и условных маркеров внутри action chips.

## Compact mode Endfield (2026-11-03)

Для Si-вариантов Maygi и Prydwen в `src/rotation.ts` доступен переключатель `Полный / Компактный`, `localStorage` ключ `game-rotations:v2:<team-id>:compact` (`false` по умолчанию), CSS только под `.game-arknights-endfield.compact-actions`. UI обязан сохранять mini portrait, keycap, `×N` (особенно FS ×2), `hold` из scheme, conditional marker (Stagger), последовательность; stage check/extra остаются в данных, но визуально скрываются в compact и восстанавливаются в полном виде, тогда как `loop-warning` остаётся на экране. Боевые ротации, ID/цвета и WuWa не меняются; Endfield progress UI намеренно убран отдельным улучшением. Полная подпись/condition/hint остаются в title/aria-label. На мобильном от compact режима не должно появляться горизонтального overflow. Следующий этап отдельно — tap-to-expand, если будет нужен.

## Канонический Arts-каталог Endfield (2026-11-04)

**Не ищи Arts-иконки заново:** `data/arts/arknights-endfield.json`, `docs/ENDFIELD_ARTS_ICONS.md`, `public/arts/arknights-endfield/` — 16 оригинальных PNG инфликций (4 элемента × 1–4 стаков) и 4 PNG реакций. Source Git repository + exact commit, original blob SHA-1 и SHA-256 файлов записаны в каталоге; `scripts/validate-endfield-arts.mjs` входит в `npm run validate:portraits`. Эти иконки имеют **готовое кольцо из четырёх секторов**, поэтому не нужно дорисовывать кольцо без визуального сравнения. Реакции — отдельные иконки; Status Level I–IV пока не представлены в этих PNG и будут отдельной меткой. Исключено автоматическое выведение стаков/уровней из порядка действий. На данном этапе каталог **не подключён** в карточки: не изменяй ротации ради дизайна и не объявляй целевое состояние подтверждённым.

## Arts UI-компоненты и просмотрщик Endfield (этап 02, 2026-11-04)

В `src/arts-indicators.ts` доступны `createArtsInfliction({element,stacks,size,base})` и `createArtsReaction({reaction,level,size,base})`, где `size=24|28|32`, `stacks=0|1|2|3|4|null`, `level=1|2|3|4|null`. Значения `null` означают неизвестность, **не** 0; не рисовать фальшивый 0-stack PNG. Исходные 1–4 готовые кольца и иконки реакций импортированы строго из `data/arts/arknights-endfield.json`; уровень реакции показан отдельно от PNG. Интерфейс доступен по `?arts=arknights-endfield`, проверяется мобильным Playwright и PWA offline. Детали — `docs/ENDFIELD_ARTS_INDICATORS.md`.

**Не считать UI оценкой механики:** этот этап не добавляет `artsCheckpoints` к текущим командам и не меняет их. Любые значения статусов для Maygi/Prydwen потребуют отдельно подтверждённого before/after + статуса целевое/проверено. Не смешивать элементы одного кадра с результатом уже поглощённой реакции.
