# Как добавить ротацию: инструкция для другого чата / агента

**Сначала** прочитай `AGENTS.md`. Эта инструкция намеренно самодостаточна: если задача ограничена публикацией уже выбранной пользователем команды, достаточно её, [FORMAT_REFERENCE](FORMAT_REFERENCE.md), файлов `examples/` и исходного research guide.

## 0. Раздели исследование и публикацию

- Пользователь **выбрал** ротацию для памятки? Если нет, не добавляй её на сайт. В `maxvfk/Games` можно вести research/guide, а сайт содержит только practical selection.
- Убедись в live-kit/version, ресурсе, триггерах, условиях Intro/Outro/Swap, cooldown/ICD, duration, starting state. Сверяйся с `Games/GAME_META_SOURCES.md`. Доказательства TC/calculation, практическая проверка и собственная адаптация — разные вещи.
- Для персонального выбора при необходимости сверяй «Игровые персонажи» (`Games/SOURCES.md`, `S-001`); новые сведения пользователя важнее.
- Зафиксируй источник(и) и автора; в `book.source` укажи **реальный** долговечный URL (предпочтительно guide в `Games`). Несколько источников/авторов и дополнительные детали сохрани в guide/PR, а не выдавай недокументированную адаптацию за `verified`.

## 1. Подготовь файлы в отдельной ветке

Репозиторий: `maxvfk/game-rotations`, основная ветка: `main`.

| Ситуация | Что создаётся/обновляется |
| --- | --- |
| **Новый вариант существующей команды** | `data/rotations/<game>/<team>.json` → `variants[]` + `stages`; синхронизировать `data/catalog.json` → `variants[]` |
| **Новая команда существующей игры** | Новый `data/rotations/<game>/<team>.json`, новая `teams[]` в `data/catalog.json`, портреты |
| **Первая команда новой игры** | Всё выше + `data/controls/<game>.json`; у игры в каталоге `status: "available"` |

**Не создавать отдельную HTML-страницу.** Сайт подключает JSON автоматически через `import.meta.glob`. Для новой игры `game` в book должен совпадать с `games[].id` каталога, а `controls` — с файлом схемы управления и `controls.game`.

Пример полностью отдельного **вымышленного** набора: [examples/rotation-template.json](../examples/rotation-template.json), [examples/controls-template.json](../examples/controls-template.json), [examples/catalog-team.json](../examples/catalog-team.json). Сначала скопируй шаблоны и замени **все** placeholder-персонажи, source, версии, пути и actions реальными проверенными сведениями. Для настоящего WuWa-примера см. `data/rotations/wuthering-waves/yyxl-suisui-chisa.json`.

### Именование

- Game slug: `lowercase-kebab`, например `honkai-star-rail` (должен существовать в каталоге).
- Team ID: уникальный во **всём** каталоге стабильный `lowercase-kebab` (используется в `?team=<id>`, избранном и localStorage).
- Stage ID: ASCII `camelCase` или буквы/цифры, например `supportOpener`, `mainLoop` (не kebab-case для v1 stage ID). Ссылки в `variants[].opener/loop` должны совпадать с ключами `stages`.
- Character ID: уникальный внутри команды `lowercase-kebab`; `defaultSlots` покрывает всех персонажей и не содержит повторяющихся слотов.

## 2. Опиши ротации и переходы

Один `stage` — последовательность **одного активного персонажа**; если персонаж ушёл через обычный Swap и вернулся, это **новый stage**, а не продолжение прежней карточки.

- `stages.<stageId>.person`: character id.
- `title`: короткая цель этапа; `sub`: контекст/индикация.
- `actions[]` — **в точном порядке**: `text` (подпись), `tone` (визуальная важность), `input` (семантика кнопки).
- `input.kind`: один из `intro`, `outro`, `swap`, `basic`, `heavy`, `skill`, `ultimate`, `echo`, `dodge`, `auto`. `input.count` только для `basic` (2–20), `repeat` только для `basic`. `target` — character id для `outro` и `swap`.
- `check`: **достижимое условие**, например ресурс 100 до Skill, отметка buff window; не выдавай собственное предположение за установленную механику.
- `extra`: оговорки, условия сбоя, перехода в следующий цикл.
- `variants[].opener` и `variants[].loop` **обязательны**. Когда они различаются, опиши реальные starting resources и state. Если повторяемость пока не проверена, явно пометь `partial`/`experimental` и предупреди в тексте; не копируй opener вслепую.

Пример действия:
```json
{"text":"BA ×3","tone":"normal","input":{"kind":"basic","count":3}}
```

Пример передачи следующему персонажу:
```json
{"text":"Outro → alpha","tone":"swap","input":{"kind":"outro","target":"alpha"}}
```

**Важно:** `outro` означает реальный trigger Outro/Intro, `swap` — обычную смену персонажа. Не меняй их ради удобной кнопки. `text` не управляет клавишей; кнопка определяется `input.kind` и выбранной схемой.

## 3. Игровая схема кнопок

- При добавлении команды в **уже подключённую игру** переиспользуй её `data/controls/<game>.json`.
- При новой игре скопируй `examples/controls-template.json`. Сохрани `schemaVersion:1`, `game`, `schemes`, `keys`, `slotKeys`, `help`, `slotExplain`, `summary`. Пропиши реальные бинды. Допустимы 1+ схем; `terms` — встроенный идентификатор универсальных обозначений с убранной панелью слотов.
- **Текущие ограничения v1:** все схемы содержат `keys` для 8 базовых категорий (`basic/heavy/skill/ultimate/echo/dodge/auto/repeat`), даже когда отдельное действие в игре отсутствует. Для отсутствующего действия ставь нейтральное `"—"` и не включай его в actions. Не изображай чужую механику как Echo/Skill только ради соответствия.
- `slotKeys` должен иметь ключ для каждого значения `defaultSlots` (например `"1"`, `"2"`, `"3"`); для `terms` значения могут быть пустыми. ПК/PS5 схемы и бинды — **не универсальны** для всех игр.
- Если нужен новый тип события (карта, QTE, charge, directional input, ally assist, engine-specific interaction), которого нет в `input.kind`, остановись и спроектируй extension v2 с тестами и обратной совместимостью. **Не подменяй** его `basic` или `auto` без подтверждённого смысла.

## 4. Подключи каталог и картинки

**Для WuWa** миниатюры уже собраны и проверены. Открой [PORTRAITS.md](PORTRAITS.md) и выбери персонажа в `data/portraits/wuthering-waves.json`. Вставляй `portrait` без изменений: `portraits/wuthering-waves/<id>.webp`. Не ищи картинки повторно и не пытайся угадать по исходному имени WebP. Выполняй `npm run validate:portraits`.


- Добавь запись `team` по образцу `examples/catalog-team.json` в `data/catalog.json → games[id=<game>].teams[]`.
- `team.id`, `team.variants[].id`, `team.characters[].id`, `gameVersion`, `source` должны соответствовать book. Автоматическая проверка контролирует связность и уникальность ID.
- `game.status` = `available`, если опубликована хотя бы одна команда. Не меняй прочие игры.
- Картинки размещай **локально** в `public/portraits/`. Book и catalog должны ссылаться на существующие файлы `portraits/<filename>.webp|png|jpg`. Никаких hotlink/изображений по внешним URL (офлайн). Проверь права на использование, размеры и загрузку в мобильном браузере.

## 5. Проверки до PR / merge

```bash
npm install
npm run validate:data
npm run test:onboarding
npm run typecheck
npm run build
```

- `validate:data`: JSON Schema + связанные данные, team IDs, targets, stage refs, assets/controls.
- `test:onboarding`: временно собирает **вымышленную** вторую игру, проверяет положительный пример и несколько намеренно ошибочных файлов. Не публикует fixture.
- `build`: повторяет проверки и собирает PWA для GitHub Pages.
- Вручную открой `http://localhost:5173/game-rotations/?team=<id>` через dev-сервер (для разработки Vite; фактический base см. `vite.config.ts`), затем production `https://maxvfk.github.io/game-rotations/?team=<id>`.
- Проверь mobile layout, выбор вариантов, первый заход/loop, PC/PS5/A-H (что реально поддерживает игра), Intro vs Swap, stage progress, ссылки на research, изображения, офлайн-повторное открытие и сохранение данных. Не меняй существующие `id`, если не предусмотрена миграция localStorage.

## 6. Передаваемый результат

PR должен содержать: игру/команду и версии S/R, какие variants пользователь выбрал, источники + авторов, kit/rotation assumptions, статус достоверности, что проверено вручную и в CI, что осталось непроверенным, точные файлы и PR URL. Не писать «optimal» без источника/проверки. Мержить после review + CI; проверить main/deployment.

**Чеклист приёмки:** [docs/REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md).
