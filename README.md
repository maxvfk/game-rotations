# Game Rotations

Персональная библиотека выбранных игровых ротаций, рассчитанная на телефон и офлайн-использование.

**Сайт:** https://maxvfk.github.io/game-rotations/ · **исследования:** https://github.com/maxvfk/Games/tree/main/guides

## Новый authoring workflow (D3/D4)

Для новой команды **не синхронизируй вручную два JSON**. Используй [один минимальный authoring spec](examples/new-team.authoring.json) и [инструкцию CLI](docs/AUTHORING_CLI.md):

```bash
npm run team:add -- --spec path/to/my-team.authoring.json         # dry-run, без записи
npm run team:add -- --spec path/to/my-team.authoring.json --write # создать book + catalog
npm run catalog:check                                           # сверить производные поля
npm run catalog:sync -- --team my-team --write                   # обновить каталог из book после правки
```

`book` остаётся единственным источником для `source`, `gameVersion`, `investment/portrait` и variant `verification`; редакционные тексты каталога сохраняются отдельно. Генератор автоматически берёт WuWa-портреты из canonical manifest, защищает существующие команды от перезаписи и отказывается публиковать `TEST/TODO` placeholders. Полный [авторский workflow и статус проверки](docs/AUTHORING_CLI.md).

## Добавление ротаций — с чего начать

**Новый чат/агент:** открой [AGENTS.md](AGENTS.md) → [ADDING_ROTATIONS.md](docs/ADDING_ROTATIONS.md) → [FORMAT_REFERENCE.md](docs/FORMAT_REFERENCE.md). **Для Endfield:** обязательно [ENDFIELD_ROTATION_AUTHORING.md](docs/ENDFIELD_ROTATION_AUTHORING.md) и [учебный dry-run spec](examples/endfield-team.authoring.json). Для ревью: [REVIEW_CHECKLIST.md](docs/REVIEW_CHECKLIST.md).

- **Вымышленный, целиком согласованный пример:** [examples/](examples/) — rotation JSON + controls JSON + запись каталога; не публикуется на сайте.
- **Рабочие команды:** `data/rotations/wuthering-waves/yyxl-suisui-chisa.json` и `data/rotations/wuthering-waves/hsin-suoming-shorekeeper.json`; общий `data/controls/wuthering-waves.json` и каталог `data/catalog.json`.
- **Верификация без второй настоящей игры:** `npm run test:onboarding` добавляет пример в временный каталог, затем проверяет, что ошибочные targets, stage IDs, kind и схемы отвергаются.
- Сначала проверяется актуальная механика в `maxvfk/Games`, затем выбор пользователя; только после этого новая ротация публикуется здесь. Не считай `Verified` на сайте калькулятора подтверждением исполнения в бою.

## Каталог портретов Arknights: Endfield

**34 оригинальных компактных PNG** из сохранённой англоязычной страницы EndfieldTools.DEV — без ручного кадрирования или перерисовки. [Открыть просмотрщик](https://maxvfk.github.io/game-rotations/?portraits=arknights-endfield) · [JSON-реестр](data/portraits/arknights-endfield.json) · [инструкция и provenance](docs/ENDFIELD_PORTRAITS.md). Отдельные портреты Endministrator F/M, без автоматического выбора пола.

`npm run validate:portraits` проверяет все 34 PNG по полному SHA-256 и соответствие IDs; импортированное изображение хранится локально и кешируется PWA. **Endfield Si уже опубликован:** обе TC-адаптации Maygi/Prydwen, контролы Terms/PC; для следующей команды всё равно требуется собственный live-kit/TC review.

## Миниатюры действий Endfield — стартовый набор

В отдельном [реестре миниатюр](data/portraits/arknights-endfield-mini.json) закреплены **4 PNG по 48×48 px** (Si, Arcane, Tangtang, Xaihi), подготовленные из исходных 34 портретов. В карточках Endfield уже используются миниатюры **24×24 CSS px**, без изменения канонических полных портретов.

[Посмотреть настоящие миниатюры и параметры crop](docs/ENDFIELD_MINI_PORTRAITS.md). Проверка `npm run validate:portraits` включает побайтовую регенерацию этих PNG по pinned original SHA-256. Миниатюры **подключены к действиям Endfield по `input.actor`** с fallback на полный портрет и далее на glyph. В обоих вариантах Si показываются 24×24 px рядом с кнопкой действия; **Compact mode** уже реализован, вместе с Full доступен для Si.

## Каталог миниатюр WuWa

**61 проверенная связка «персонаж → миниатюра»** из сохранённой страницы Prydwen. Открой [документацию портретов](docs/PORTRAITS.md), [JSON-базу](data/portraits/wuthering-waves.json) или визуальный каталог по адресу https://maxvfk.github.io/game-rotations/?portraits=wuthering-waves. Ссылка есть и на главной странице. Не загружай портреты заново при добавлении WuWa-ротаций.

`npm run validate:portraits` проверяет локальные WebP и соответствие персонажей карточкам; автоматически запускается при сборке.

## v0.2 — data-driven rotations

- Каталог игр/команд, поиск, избранное и локально сохраняемые предпочтения.
- **Общий экран ротации** (Vite + TypeScript) — больше нет отдельного HTML-приложения для каждой команды.
- Три существующие ротации WuWa YYXL / Suisui / Chisa **без изменения последовательности действий**: `1F1A`, `2F`, `2F Quickswap`; первый заход и loop, 11 этапов, 83 действия.
- PC / PS5 / A-H — конфигурация игры, а не захардкоженные подписи на карточках. Слоты, отметки выполнения, пошаговый просмотр и progress работают как прежде; для первой команды сохранён старый ключ `wuwa-r-v1:` в localStorage.
- PWA / офлайн: VitePWA кеширует JS, JSON, портреты и страницы каталога; глубокая ссылка на команду — `/?team=yyxl-suisui-chisa`.

## Где что лежит

| Путь | Что редактировать |
| --- | --- |
| `data/catalog.json` | Карточки игр и команд; ссылки/инвестиции/метки |
| `data/rotations/<game>/<team>.json` | Единственный источник **последовательностей действий** |
| `data/controls/<game>.json` | Привязка семантических действий к клавишам PC / PS5 / универсальным терминам |
| `data/rotation.schema.json` | Контракт версии 1 для ротаций |
| `data/controls.schema.json` | Контракт версии 1 для per-game схем управления |
| `scripts/validate-rotations.mjs` | Схема + перекрёстные проверки команд/этапов/персонажей/портретов |
| `src/rotation.ts` | Общий renderer; автоматически подхватывает JSON через `import.meta.glob` |
| `src/rotation.css` | Сохранённое мобильное оформление WuWa v1.3 |
| `public/portraits/` | Картинки, локально доступные офлайн |

### Как добавлять команду

**Новая команда:** [AUTHORING_CLI.md](docs/AUTHORING_CLI.md) → `team:add -- --spec ...` (dry-run) → review → `--write` → `catalog:check`. Скрипт обновляет book/catalog согласованно. **Новый вариант существующей команды:** обнови book, затем `catalog:sync -- --team <id> --write`. Для multi-operator stages, Arts и UI Endfield см. [ENDFIELD_ROTATION_AUTHORING.md](docs/ENDFIELD_ROTATION_AUTHORING.md).

Полная проверка: `npm run build && npm run test:e2e`, реальные скриншоты новой команды, PR/review и Pages deployment. Green CI **не** равен подтверждению боевой ротации.

## Разработка

```bash
npm install
npm run validate:data
npm run test:onboarding
npm run typecheck
npm run build
npm run dev
```

CI проверяет JSON, связность каталога и учебный путь добавления новой игры перед сборкой и публикует `dist/` из `main` с GitHub Actions → GitHub Pages. Vite base: `/game-rotations/`.

## Источники и степень проверки

`maxvfk/Games` остаётся канонической базой механик, рекомендаций и исследований. В этом репозитории — **только отобранные пользователем практические варианты**. Разделять опубликованные TC-ротации, адаптации и экспериментальные реконструкции.

- **WuWa Hsin / Suoming / Shorekeeper:** простая ротация Prydwen/iWinToLose (`adapted`) и advanced Prydwen c E Swap Cancel (`partial`); Hsin S3R1 / Suoming S0R0 / Shorekeeper S0R1, repeat-loop и quickswap-opener требуют практической проверки. [Гайд](https://github.com/maxvfk/Games/blob/main/guides/wuthering-waves/HSIN_SUOMING_SHOREKEEPER_ROTATIONS.md) · [механики](https://github.com/maxvfk/Games/blob/main/guides/wuthering-waves/HSIN_SUOMING_SHOREKEEPER_KIT_MECHANICS.md) · [открыть в приложении](https://maxvfk.github.io/game-rotations/?team=hsin-suoming-shorekeeper).
- **WuWa 1F1A:** Prydwen-derived, account-specific адаптация.
- **WuWa 2F:** эксперимент с Double Feather; граница повторяющегося цикла требует live-проверки.
- **WuWa 2F QS:** собственная реконструкция, не подтверждённый TC optimal.
- Не приравнивать `Verified` на WuWaLAB к независимо воспроизведённой оптимальности.

Исходный гайд: https://github.com/maxvfk/Games/blob/main/guides/wuthering-waves/YANGYANG_XUANLING_SUISUI_CHISA_ROTATIONS.md

Портреты первой WuWa-команды получены из сохранённых пользователем страниц Prydwen; новые небольшие портреты Hsin/Suoming/Shorekeeper вырезаны из предоставленного пользователем скриншота памятки iWinToLose и пока являются временными. Оригинальные изображения и персонажи принадлежат Kuro Games. Неаффилированный некоммерческий проект.


## Arknights: Endfield — Si (первое добавление, PR)

Выбранная пользователем команда **Si / Tangtang / WILL Arcane / Xaihi** представлена как **две независимые, пока частично проверенные** source-derived последовательности: `Maygi` (управление Combo/SP в продолжительном бою; допускает сокращение под обычные встречи) и `Prydwen / Gacha Gamer` (специализированный boss/Stagger route). Ссылка на исходные механики и исследования: [канонический guide](https://github.com/maxvfk/Games/blob/main/guides/arknights-endfield/SI_TANGTANG_ARCANE_XAIHI_ROTATIONS.md).

Новые форматы Combo Skill, Final Strike, Finisher, Dive Attack и `input.actor` **не автоматизируют боевые действия**: они лишь показывают оператора и тип ввода. Переход от `First` к `Repeat` пока не проверен; вместо выдуманного loop есть восстановление SP/UGE. Изначально доступны `terms` и стандартные ПК-клавиши; PS5 остаётся отдельно на проверке. Используются существующие оригинальные PNG из Endfield portrait registry.

**Уточнение по Prydwen (2026-11-03):** пользователь сверил поясняющее видео Gacha Gamer и подтвердил, что два зелёных блока в схеме означают **Tangtang Ultimate → Dive Attack**, а не два Ultimate. В UI показаны два разных действия. Полный реальный таймлайн, SP/CD и оптимальность ротаций всё ещё не установлены.


**Правило BA/FS для Endfield (03.11.2026):** В UI `FS` означает «выполнить полную последовательность BA до Final Strike», а `BA` — только промежуточные атаки, когда не обязательно завершать цепочку. `FS ×2` под Xaihi Battle Skill — две полноценные цепочки, не два удара. Правило едино для Maygi и Prydwen; никакой новой механики или изменения последовательности TC не вводится.


**Визуальная палитра Endfield:** отдельный цвет для каждого типа действия, по мотивам Prydwen — голубой Battle Skill, фиолетовый Combo, красный FS, зелёный Ultimate, оранжевый Finisher, бирюзовый Dive, серо-голубой BA и жёлтый Dodge. Цвет определяется `input.kind`, не произвольным `tone`, и **не влияет на оформление WuWa**. Текстовые подписи сохраняются.


**Compact mode Endfield:** в команде Si / Tangtang / WILL Arcane / Xaihi можно переключить **«Полный / Компактный»** рядом с выбором «Термины / ПК». Компактный вид показывает миниатюру 24×24 и краткую кнопку с `×2` / `Hold` / `Stagger` там, где это существенно, без длинных описаний в каждой карточке. Условия и подсказки действий доступны по title/aria-label; два длинных текстовых блока этапа (`check` и `extra`) в компактном режиме скрыты и возвращаются в полном. Предупреждение о непроверенном повторе (`loop-warning`) остаётся видимым. Настройка сохраняется для команды при перезагрузке и смене Maygi/Prydwen. WuWa пока остаётся в исходном полном режиме, а tap-to-expand — отдельное улучшение.


**Endfield без чеклистов (2026-11-03):** в Endfield удалены круглые отметки выполнения, прогресс-бар и «Сброс» в полном и компактном режимах. Повторяемые боевые ротации используются как справочник, а не список задач. «По шагам» остаётся режимом навигации, без выставления done-флагов. В компактном виде заголовок этапа — **одна строка «02 / 03 · Второй пакет»**, без большого портрета и описания этапа; полный вид по-прежнему показывает подробный заголовок, большой портрет и пояснение. Старые сохранённые Endfield done-флаги не удаляются, но больше не читаются и не обновляются. WuWa сохраняет весь текущий progress UI без изменений.


## Физические статусы Endfield — оригинальные значки

Vulnerability (1–4 игровых кольца) и четыре Physical Status glyphs: **Lift, Knock Down, Crush, Breach**. [Каталог, механики и provenance](docs/ENDFIELD_PHYSICAL_ICONS.md) · [галерея Physical](https://maxvfk.github.io/game-rotations/?physical=arknights-endfield) · `npm run validate:physical`. Дополнительно реализован [формат Physical checkpoints](docs/ENDFIELD_PHYSICAL_CHECKPOINTS.md): состояния Vulnerability до/после конкретного действия и отдельные игровые события Lift/Knock Down/Crush/Breach. Renderer и переключатель Physical включаются только для книг с соответствующими данными; в существующих Si-ротациях их пока нет.

## Игровые Arts-иконки Endfield (этап 01)

Подготовлен [каталог Arts Infliction / Arts Reaction](data/arts/arknights-endfield.json): 4 Infliction × 4 оригинальных варианта стаков и 4 реакции (**20 PNG**; реакция Electrification имеет оригинальную ширину 73 px). Исходные 1–4 стаковые спрайты **уже содержат игровое четырёхсекторное кольцо** — его не требуется рисовать с нуля. Визуальная таблица и источники: [ENDFIELD_ARTS_ICONS.md](docs/ENDFIELD_ARTS_ICONS.md). `npm run validate:portraits` проверяет SHA-256 файлов, размеры и Git blob hash оригиналов.

Каталог уже используется компонентами `src/arts-indicators.ts` и action-local `artsCheckpoints` в Si. Римский уровень I–IV размещён поверх оригинального PNG реакции. Числа не выводятся из последовательности кнопок.


**Этап 02 Arts UI Endfield:** доступен [интерактивный просмотрщик](https://maxvfk.github.io/game-rotations/?arts=arknights-endfield) с оригинальными четырёхсекторными кольцами (стак 1–4), уровнями реакций I–IV, размерами 24/28/32 px и проверкой на телефоне/PWA offline. Компоненты `src/arts-indicators.ts` берут иконки из каталога с SHA-256 и не выводят игровые состояния из действий. [API и критерии](docs/ENDFIELD_ARTS_INDICATORS.md). Maygi/Prydwen уже отображают Arts на соответствующих Arcane Skill, с сохранением неизвестности и условности в данных.

## Arts checkpoints Endfield — этап 03

Для Maygi и Prydwen добавлены [семантические контрольные точки](docs/ENDFIELD_ARTS_CHECKPOINTS.md) на шести действиях Arcane Battle Skill: **до** применения — Cryo, **после** — условная Corrosion. Только первый пакет Prydwen имеет числовую **цель 4 → IV** (не фактически измеренную); остальные точные значения пока `null` / unknown. Данные по-прежнему отделены от UI: никакой icon path, CSS, размера или Roman Level в book нет; renderer визуализирует checkpoints у нужного action. В дальнейшем иконки и оформление уровней можно изменить независимо от игровых данных. CI проверяет структуру, provenance и отсутствие выдуманного `observed`.

## Arts после конкретных действий Endfield — новый вариант

В Endfield **значки Arts отображаются внутри того действия, с которым они связаны**, а не в заголовке этапа. Например, у Arcane Battle Skill показан ожидаемый результат применения Nature к Cryo. Для пяти непроверенных пакетов это компактная строка **`Skill Cryo → [Corrosion icon]`** без вымышленных стаков и уровней. Для первого Prydwen-пакета — **`Skill [Cryo-4 icon] → [Corrosion icon] IV`**. Значения `target` / `conditional`, источники и условия сохранены в title/aria-label, а не в видимых бейджах.

Индикатор появляется и в **полном**, и в **компактном** режиме в той же строке, что портрет оператора и кнопка действия (без отдельного второго ряда). Никаких изменений последовательностей, статусов `partial` и WuWa. Эти данные пока не показывают приращение Cryo на каждой промежуточной атаке — оно потребует отдельных проверенных trigger/stack checkpoints. Источники и модель — [ENDFIELD_ARTS_CHECKPOINTS.md](docs/ENDFIELD_ARTS_CHECKPOINTS.md).

Положение уровня реакции и PNG остаются функцией `src/arts-indicators.ts`; их можно менять без переписывания `artsCheckpoints`.

**Endfield Arts toggle (2026-11-07):** `Arts: вкл / выкл` независимо от `Полный / Компактный`; настройка сохраняется для команды и не изменяет `artsCheckpoints`. Инструкция: [Endfield authoring](docs/ENDFIELD_ROTATION_AUTHORING.md).
