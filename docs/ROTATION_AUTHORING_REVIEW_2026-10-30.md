# План исправлений после добавления Hsin / Suoming / Shorekeeper

**Дата ревью:** 2026-10-30.  
**Статус:** proposed, **documentation / read-only findings**, никакие исправления кода в этом PR не реализованы.  
**Репозиторий:** `maxvfk/game-rotations`, проверен актуальный `main` после PR #5.  
**Повод:** ретроспектива добавления новой WuWa-команды в [PR #4](https://github.com/maxvfk/game-rotations/pull/4) и устранения проблемы с портретами в [PR #5](https://github.com/maxvfk/game-rotations/pull/5).  
**Цель:** обеспечить безопасное повторяемое добавление ротаций **без** полной перестройки приложения, не потеряв уже зафиксированный опыт.

## Краткий вывод

Действующая архитектура `data/rotations/<game>/<team>.json` + `data/catalog.json` + общие controls/renderer + независимые guides в `maxvfk/Games` **подходит для дальнейшего использования**. Новая команда добавлена без модификации движка; схема и CI пропустили корректные данные, но **не гарантировали корректность того, что видит пользователь**.

**Самая важная оставшаяся проблема:** общий renderer всё ещё содержит YYXL-specific подмены подписей. Вторая — при самом первом открытии команды по умолчанию выбран **loop**. Третья — тесты не проверяют фактические подписи и первый экран.

Реестр из 61 канонического портрета **уже реализован** в PR #5; повторно искать или заменять картинки нельзя без новой конкретной причины.

## 0. Evidence: что подтверждено, а что только предложено

**Подтверждено чтением текущего исходного кода (без browser execution):**
- `src/rotation.ts`, `binding()`: при любом `input.kind="basic"` + `input.repeat=true` заменяет `action.text` на `Death Snip FULL · добить удары`, даже для Suoming или Hsin. В Hsin rotation JSON это применяется к `BA · до 800 Delusion` и `Pillars BA · до 0 Heart`.
- При `input.kind="intro"` renderer возвращает фиксированное `Intro · смена персонажа`, игнорируя `action.text`. Теряется `Intro · Discernment` и другие именованные Intro.
- `opener=Boolean(get('opener',false))`: на новом устройстве / для ранее не открывавшейся команды default — **«Повтор»**; пользовательскую сохранённую настройку в существующих командах менять нельзя.
- Дополнительные подмены в `binding()`: `auto` всегда получает `после попадания HA`, а `Swallow’s Cut` / `Bloom 1–3` обрабатываются именованными исключениями. Они подходят не всем героям и нарушают инвариант независимости renderer.
- В схеме v1 **нет** формализованных модификаторов `hold/tap` и условного пропуска действия: выражено только в `text`/`check`/`extra`.
- `scripts/test-onboarding.mjs` проверяет валидатор на вымышленной игре, но **не** результат `binding()` и не mobile render.
- Реестр и валидация канонических портретов **уже есть**: `data/portraits/wuthering-waves.json`, `docs/PORTRAITS.md`, `scripts/validate-portraits.mjs` и `npm run validate:portraits` в build.

**Не установлено этим read-only ревью:** реальный screenshot bug на всех клиентах, DPS-эффективность rotation, устойчивость repeat-loop, сохранение BA chain Shorekeeper при quickswap. Не считать CI игровым тестом.

## A. P1 — маленький исправляющий PR: generic renderer и корректный cold start

### A1. [ ] Убрать перенос терминов YYXL на других персонажей

**Проблема:** `binding()` при `basic.repeat` всегда пишет `Death Snip FULL`, независимо от исходного `text`. Дополнительно хардкод `auto`, `Swallow’s Cut`, `Bloom 1–3` создаёт скрытые межкомандные зависимости.

**Решение:** базовая подпись действия — **`action.text`** (допускается лишь общая нормализация `R/E`, не уничтожающая смысл). `input.kind/count/repeat` определяет **клавишу/бейдж**, а не название атаки. При исправлении перенести нужные YYXL-специфические человекочитаемые подписи в её JSON (если без этого изменится существующий UI); не ломать 1F1A/2F/2F QS.

**Acceptance:**
- `Suoming BA · до 800 Delusion` и `Hsin Pillars BA · до 0 Heart` сохраняют эти подписи в PC, PS5 и terms.
- Произвольный `basic.repeat=true` **не** вставляет `Death Snip`; `auto` не получает автоматически `после попадания HA` у чужого персонажа.
- Все три исходных варианта YYXL сохраняют реальную последовательность действий и понятные подписи.
- `data/rotations/**`, `catalog`, stage/variant IDs, progress/storage не теряются.

### A2. [ ] Сохранять конкретные названия Intro

**Проблема:** `input.kind="intro"` всегда показывает `Intro · смена персонажа`, скрывая, например, `Intro · Discernment` Shorekeeper и `Intro · Whirling Thunder (Unison)` Suoming.

**Решение:** брать подпись из `action.text`; кнопку Intro по-прежнему выводить из текущей схемы и `defaultSlots`. Не менять семантику input kind.

**Acceptance:**
- `Shorekeeper Intro · Discernment` различим от обычного Intro;
- Suoming `Whirling Thunder (Unison)` и Hsin `Manifold Unison` видны в подписи;
- PC/PS5 отображают слот входящего персонажа, terms — `Intro`.

### A3. [ ] Первый просмотр новой команды должен начинаться с opener

**Проблема:** default `get('opener',false)` выбирает «Повтор» при пустом storage, включая неготовую стартовую `Shorekeeper Discernment`.

**Решение:** при **отсутствующем сохранённом выборе** установить `opener=true`; если пользователь ранее явно выбрал repeat — сохранить `false`. Не сбрасывать сохранённый прогресс/слоты старой YYXL-команды.

**Acceptance:**
- Чистое состояние / новое team ID → «Первый заход», первая карточка `Shorekeeper · первый заход`.
- Сохранённое `opener=false` → «Повтор» после reload.
- Переключение opener/loop оставляет `done`/`at` каждого режима согласованными; нет reset namespace legacy `wuwa-r-v1:`.

**Границы:** это UI-default fix; **не** заявляет, что Hsin steady-loop проверен в бою.

## B. P1 — приёмка реального отображения, а не только JSON schema

### B1. [ ] Автоматический display/renderer smoke-test

**Минимальный рекомендуемый объём:** проверять фактические DOM-подписи после `mountRotation`, а не заново интерпретировать JSON своим тестовым рендерером. Можно использовать лёгкий DOM/browser harness; выбирать наименьшее изменение без нового большого UI-фреймворка.

**Обязательная матрица:**
1. `?team=hsin-suoming-shorekeeper` при пустом storage: opener/`Shorekeeper BA×4`; затем явно выбрать repeat и увидеть `Intro · Discernment`.
2. `simple` и `prydwen`, PC / PS5 / A-H; имена действий на карточках соответствуют данным: `Suoming Delusion`, `Hsin Pillars`, оба `Unison Outro`, целевой слот.
3. `repeat=true` у независимых персонажей **не даёт** `Death Snip`.
4. Отдельные Suoming `tap E` и `Hold E` в обоих вариантах; технически `hold` пока текстовое указание (см. C1).
5. Existing `yyxl-suisui-chisa` с 1F1A / 2F / 2F Quickswap продолжает отображаться без регрессий.
6. Source link, portraits, правильный `Intro` vs `Outro` vs обычный `Swap`, переключение вариантов/этапов и сохранение прогресса.

**Acceptance:** падающий test при возвращении hardcoded YYXL-лейбла / потере имени Intro / выборе loop на чистом storage; `npm run build` включает этот test перед production build.

### B2. [ ] Минимальная visual/mobile/offline-приёмка

- Воспроизводимый screenshot/браузерный просмотр **реальной** новой команды при мобильной ширине; проверить обрезку имён, перенос длинной последовательности, слоты, portraits, variants, progress, back.
- Чистый заход (без cache) + обновление установленной PWA и повторное открытие **офлайн**; не путать успешную загрузку GitHub Pages с offline smoke.
- В PR хранить краткое evidence: URL/скриншот, что проверено в браузере, а что только в CI. При отсутствии браузерного инструмента **не** писать «manual checked» и **не** сливать без оговорённого reviewer gate.

**Acceptance:** в отчёте нет формулировки «всё проверено» только на основании `validate:data` + `vite build`.

## C. P2 — небольшое расширение схемы v1 после P1 (не реализовывать одновременно с A без необходимости)

### C1. [ ] Различать tap / hold без подмены kind

**Сегодня:** Suoming `E (Unforsaken Mind)` → **отпустить** → `HOLD E (Engraved Heart)` хранится как две одинаковые `input.kind="skill"`, а нужный способ нажатия спрятан в `text`.

**Рекомендация:** добавить **необязательное** `input.press?: "tap"|"hold"` или эквивалентную неразрушающую схему, только если это действительно улучшит UX. Бейдж PC: `E` / `удерж. E`, terms: `Skill` / `Hold Skill`, PS5: `△` / `удерж. △`. Сохранить старые JSON и привычные значения по умолчанию.

**Acceptance:** Suoming показывает два различных действия и необходимость release между ними. Не вводить новый `input.kind` только ради hold.

### C2. [ ] Отобразить condition / optional action

**Сегодня:** Hsin S2 позволяет опустить `BA3–4` **только при фактически заполненной Answering Heart**; две дополнительные E Swap Cancel Hsin тоже optional. JSON хранит указания в тексте и `check/extra`, но всегда показывает действие как одинаково обязательное.

**Рекомендация:** минимальный optional `condition` / `optional` badge (без построения полноценного графа ветвлений). Пример: `BA3–4 [только если Answering Heart <100]`; `E Swap Cancel [optional, если успеваешь]`.

**Acceptance:** пользователь понимает, что можно пропустить, без чтения большого `extra`. Не менять gameplay resource logic и не заявлять оптимальность.

### C3. [ ] Чётче маркировать неоттестированный loop

**Сегодня:** `variants[].loop` обязателен в schema, даже если стабильный повтор не верифицирован в бою. Для команды Hsin есть `skLoop` после Discernment, но его реально устойчивый запуск/ресурсы ещё не подтверждены пользователем.

**Рекомендация:** при `verification="partial"` и/или не подтверждённом loop показывать явное предупреждение при выборе повтора, а не только текст в общем описании / footer. Можно начать с предупреждения на основе текущих metadata; добавлять новый field только при необходимости.

**Acceptance:** app не приписывает repeat-loop статус «проверено», пользователь видит ограничение рядом с переключателем.

## D. P2/P3 — улучшения авторского workflow без усложнения архитектуры

### D1. [ ] Обязательный checkpoint проверки пользовательского интерфейса до merge

Ранее PR #4 прошёл CI, но **визуального** подтверждения перед merge не было. Добавить в `docs/ADDING_ROTATIONS.md` и `docs/REVIEW_CHECKLIST.md`:
- [ ] сверены реальные rendered labels с `action.text`, включая Intro и repeat;
- [ ] корректный default opener и сохранение пользовательского выбора;
- [ ] показаны PC/PS5/A-H, variants, переходы, портреты и source;
- [ ] mobile screenshot/render-test и offline/PWA smoke, с честным статусом если недоступны;
- [ ] ручная/TC проверка live механик и фактического DPS **отделена** от статического UI теста.

**Acceptance:** новый агент **сначала** прочитал `AGENTS.md` → `docs/ADDING_ROTATIONS.md` → `docs/FORMAT_REFERENCE.md` → `docs/PORTRAITS.md`; PR показывает выполненные и невыполненные пункты, а не одну формальную отметку сборки.

### D2. [x] Канонический каталог портретов вместо повторного извлечения — уже закрыто PR #5

**Проблема PR #4:** портреты Hsin и Shorekeeper перепутались, потому что изображения были вручную вырезаны из скриншота iWinToLose (72×72), а файл / связь `name → portrait` не проходили identity-check. Стандартный валидатор проверял **наличие файла**, не изображённого персонажа.

**Что уже исправлено:** в PR #5 создан manifest из 61 подтверждённого ID с привязкой к source page и checksum, локальные 160×160 WebP, визуальный каталог и `npm run validate:portraits`. Путь в book и catalog уже соответствует canonical record.

**Не делать:** ещё раз скачивать изображения, просто менять Hsin ↔ Shorekeeper местами, внедрять вторую competing базу. В дальнейшем использовать записи в `data/portraits/wuthering-waves.json` и проверять неизменность лиц/путей в визуальном каталоге.

### D3. [ ] (Отложить) уменьшить дублирование `catalog` ↔ `book`

`characters[].portrait`, investment, source, gameVersion сейчас дублируются в `data/catalog.json` и отдельном JSON команды. Есть **cross-validation**, но ручное редактирование всё ещё требует синхронизации двух мест.

**Решение не срочное:** при увеличении числа команд рассмотреть небольшой генератор `add-team` / template-script, который создаёт обе записи и подставляет `portrait` из существующего manifest. Не вводить новую динамическую БД/API; сохранение текущего статического PWA — приоритет.

**Acceptance (если брать в работу):** генератор работает идемпотентно в test fixture, не портит существующую команду, не меняет slug/stage IDs, производит schema-valid файлы, использует canonical portraits.

### D4. [ ] Упрощённый авторский шаблон + источник/версия/ограничения

Проблема PR #4: создание девяти stages и двух variants почти вручную было трудоёмко и повышало риск пропусков. Поддержать минимальный шаблон для team existing game: `team/characters/investment + stages/variants + opener/loop + источник/версия + evidence/status`.

**Обязательные поля в PR:**
- кто автор guide/TC и что именно адаптировано, версия/сервер, live/beta отдельно;
- source-of-truth для китов/ротаций — `maxvfk/Games`; приложение не создаёт вторую canonical mechanics base;
- где проверены resources, triggers, cooldown/ICD, swaps, buff windows; где остаётся `TEST`;
- какая ротация **выбрана пользователем**; не публиковать экспериментальный новый вариант под видом оптимума;
- что протестировано в коде, в UI, офлайн и в бою (эти уровни независимы).

Достаточно небольшого улучшения инструкции/шаблона; **не** создавать большой framework генерации.

## Рекомендуемый порядок и scope

| Волна | Приоритет | Объём | Merge criteria |
|---|---|---|---|
| **Fix 1** | P1 | A1–A3: убрать hardcoded labels и default loop | Набор renderer regression tests, сохранение старой YYXL, зелёный build и mobile smoke |
| **Fix 2** | P1 | B1–B2: автоматизированный display smoke + evidence в PR | Тест ловит повторное возникновение каждого дефекта; runtime screenshot и offline оговорки |
| **UX 1** | P2 | C1–C3: hold/optional/loop warning (минимально) | Backward-compatible schema/types/renderer/validator/docs, реальная Suoming без ложных кнопок |
| **Workflow 1** | P2/P3 | D1, D3, D4: инструкция и по необходимости generator | Новому агенту достаточно `AGENTS` + documented flow; статический каталог не сломан |
| **Portraits** | **done** | D2: PR #5 | Никаких повторных правок без нового evidence |

Если Fix 1 и Fix 2 удобнее технически объединить в **один небольшой PR**, это допустимо; не смешивать их с архитектурными расширениями C/D.

## Контрольная матрица для приёмки Fix 1 / Fix 2

| Кейс | Должно быть |
|---|---|
| Fresh app `?team=hsin-suoming-shorekeeper` | выбран **«Первый заход»**, Shorekeeper `BA×4 → Illation` ×2 |
| Stored `opener=false` | **«Повтор»** сохраняется, `Discernment` присутствует |
| `suomingSecondSimple`, `basic.repeat` | **`BA · до 800 Delusion`**, не `Death Snip` |
| `hsinFinalSimple`, `basic.repeat` | **`Pillars BA · до 0 Heart`**, не `Death Snip` |
| `skLoop`, `input.kind=intro` | **`Intro · Discernment`**, не только `Intro · смена персонажа` |
| `suomingSecondAdv` | **две E** с отдельными `tap/release/hold` подсказками (минимально текстом до C1) |
| `hsinFirstAdv` / `hsinFinalAdv` | дополнительные E именно **optional** по смыслу, targets Suoming/Shorekeeper корректны |
| Old YYXL and new Hsin team | неизменные IDs и сохранённый прогресс, верные изображения из registry, PC/PS5/terms |
| Build CI / mobile UI / offline PWA / actual combat | **четыре разные категории проверки**, с отдельными статусами |

## На что план НЕ даёт разрешения

- Не реализовывать **непроверенный quickswap opener Shorekeeper** (`BA3 → swap → Hsin Echo → back`), пока не установлено сохранение BA-chain, Empirical Data, Concerto и реальный выигрыш времени в сравнительном тесте.
- Не смешивать preliminary team-DPR в ChemX и реальный DPS/длительность цикла.
- Не менять rotation IDs / user storage / авторство source и skill mechanics `maxvfk/Games` без отдельного rationale и тестов.
- Не сливать данный **плановый** PR как будто он уже исправил ошибки. Его merge (если будет) лишь зафиксирует roadmap; кодовые изменения — в отдельных PR с доказательством.

## Ссылки

- [PR #4 — Hsin / Suoming / Shorekeeper](https://github.com/maxvfk/game-rotations/pull/4)
- [PR #5 — портреты](https://github.com/maxvfk/game-rotations/pull/5)
- [Authoring rules](../AGENTS.md), [Adding Rotations](ADDING_ROTATIONS.md), [Format](FORMAT_REFERENCE.md), [Review checklist](REVIEW_CHECKLIST.md), [Portrait catalog](PORTRAITS.md).
- [Исследовательская ротация в Games](https://github.com/maxvfk/Games/blob/main/guides/wuthering-waves/HSIN_SUOMING_SHOREKEEPER_ROTATIONS.md), [live-kit mechanics](https://github.com/maxvfk/Games/blob/main/guides/wuthering-waves/HSIN_SUOMING_SHOREKEEPER_KIT_MECHANICS.md).
