# Game Rotations

Персональная библиотека выбранных игровых ротаций, рассчитанная на телефон и офлайн-использование.

**Сайт:** https://maxvfk.github.io/game-rotations/ · **исследования:** https://github.com/maxvfk/Games/tree/main/guides

## Добавление ротаций — с чего начать

**Новый чат/агент:** открой [AGENTS.md](AGENTS.md) → [пошаговую инструкцию](docs/ADDING_ROTATIONS.md) → [справочник JSON](docs/FORMAT_REFERENCE.md). Для ревью используй [чеклист приёмки](docs/REVIEW_CHECKLIST.md).

- **Вымышленный, целиком согласованный пример:** [examples/](examples/) — rotation JSON + controls JSON + запись каталога; не публикуется на сайте.
- **Рабочая команда:** `data/rotations/wuthering-waves/yyxl-suisui-chisa.json` + `data/controls/wuthering-waves.json` + `data/catalog.json`.
- **Верификация без второй настоящей игры:** `npm run test:onboarding` добавляет пример в временный каталог, затем проверяет, что ошибочные targets, stage IDs, kind и схемы отвергаются.
- Сначала проверяется актуальная механика в `maxvfk/Games`, затем выбор пользователя; только после этого новая ротация публикуется здесь. Не считай `Verified` на сайте калькулятора подтверждением исполнения в бою.

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

1. Добавить запись `teams[]` в нужную игру `data/catalog.json`.
2. Создать файл `data/rotations/<game>/<team>.json` с `id`, `game`, `characters`, `stages`, `variants` и источниками. Каждый stage хранит персонажа, действия, условие проверки и пояснения; каждый variant ссылается на stage IDs отдельно для `opener` и `loop`.
3. У действия есть `text`, `tone` и `input: {kind,count?,repeat?,target?}`. `kind` — семантическое действие: `intro/outro/swap/basic/heavy/skill/ultimate/echo/dodge/auto`. `target` обязательно проверяется для передач хода.
4. Для новой игры создать один `data/controls/<game>.json`: доступные схемы кнопок, словарь `keys`, отображение слотов, пояснения. Копировать HTML или менять `src/rotation.ts` **не требуется**.
5. Положить портреты в `public/portraits/`, проверить `npm run validate:data` и собрать сайт.

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

- **WuWa 1F1A:** Prydwen-derived, account-specific адаптация.
- **WuWa 2F:** эксперимент с Double Feather; граница повторяющегося цикла требует live-проверки.
- **WuWa 2F QS:** собственная реконструкция, не подтверждённый TC optimal.
- Не приравнивать `Verified` на WuWaLAB к независимо воспроизведённой оптимальности.

Исходный гайд: https://github.com/maxvfk/Games/blob/main/guides/wuthering-waves/YANGYANG_XUANLING_SUISUI_CHISA_ROTATIONS.md

Портреты получены из сохранённых пользователем страниц Prydwen; оригинальные изображения и персонажи принадлежат Kuro Games. Неаффилированный некоммерческий проект.
