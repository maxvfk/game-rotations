# Формат ротаций v1 — контракт, значения и ограничения

Это **технический справочник** для `data/rotation.schema.json`, `src/rotation-types.ts`, `src/rotation.ts`, `scripts/validate-rotations.mjs`. При расхождении схемы и этого документа — **проверяй живой код**; исправляй документацию/валидатор совместно, не молча обходи ограничения.

## Концепция

`data/catalog.json` показывает карточку; `data/rotations/<game>/<team>.json` хранит действия, варианты и состояние; `data/controls/<game>.json` сопоставляет semantic `input.kind` с устройством. Сборка Vite `import.meta.glob` импортирует JSON, `?team=<team-id>` открывает общий экран, Service Worker кеширует итоговые ассеты. Не нужно создавать HTML для команд.

## Book v1 (обязательные поля)

| Поле | Тип | Назначение |
| --- | --- | --- |
| `schemaVersion` | `1` | Версия контракта, не игры |
| `id`, `game` | kebab-case | Уникальный ID команды, game ID из каталога |
| `title`, `gameVersion` | string | Читаемое имя, точный server/live patch при необходимости |
| `source` | URL | Основной долговечный research guide/источник |
| `verificationNote` | string | Разделение sourced/own adaptation/unknown, видно пользователю |
| `controls` | game-id | Имя `data/controls/<game>.json`, совпадает с `controls.game` |
| `characters[]` | 2–5 | `id, name, glyph, color #RRGGBB, portrait, investment` |
| `defaultSlots` | map | `{character-id: slot-id}`, полное уникальное соответствие |
| `variants[]` | 1+ | `id, label, sub, type, intro, verification, opener[], loop[]` |
| `stages` | map | `{stageId: {person,title,sub,actions,check,extra}}` |

`stageId` — ASCII буквы/цифры с начальной буквой (допустим camelCase); game/team/character/variant ID — lowercase-kebab (несовместим с camelCase). `variants.opener[]` и `loop[]` — упорядоченные **ссылки** на `stages`, не вложенные actions.

**Прогресс:** сайт хранит `mode`, `done:mode-opener|loop`, `at:mode-opener|loop` в localStorage. Варианты и ID команд стабильны: изменяя ID, можно потерять выбранную вкладку/прогресс/избранное. Для текущей WuWa-команды сохранён старый `wuwa-r-v1:` namespace.

## Action и визуальная подсказка

```json
{"text":"Skill · усиленный выпад","tone":"vital","input":{"kind":"skill"}}
```

- `text`: человеческое описание конкретного действия/анимации (не физическая клавиша).
- `tone` `normal|key|vital|swap|flow|sensitive`: оформление карточки; **не** утверждение о верификации.
- `input.kind`: `intro`, `outro`, `swap`, `basic`, `heavy`, `skill`, `ultimate`, `echo`, `dodge`, `auto`.
- `count`: только `basic`, 2–20 последовательных нажатий; `repeat`: только `basic`, неопределённая серия, альтернативный бейдж кнопки.
- `target`: **обязателен для `outro` и `swap`**, значение одного из `characters[].id`. Для других действий запрещён; `intro` нажатие определяется `stage.person`.
- `auto`: автоматическое действие после выполнения триггера; не маскируй им неизвестную механику.
- Смысл `outro` — game-specific особая передача, `swap` — обычная смена. Не смешивать.
- `check` — ресурс, окно, условие; `extra` — объяснение/неуверенность. Их надо составлять на основе live mechanics и источников.

**Долг текущего renderer v1:** подписи `R · ...`, `E · ...`, `Death Snip`, `Bloom`, `Feather Fall` имеют точечные WuWa-специфичные сокращения в `src/rotation.ts`. Для новых игр `text` будет отображаться как есть, но семантический бейдж кнопки определяется по `input.kind`. Если требуется новый тип действия/составное нажатие, это отдельное расширение движка — нельзя утверждать, что JSON уже универсален для любых игровых механик.

## Variant и verification

- `id`: стабильное значение, совпадающее с `data/catalog.json` (`variants[].id`).
- `label/sub/type`: заголовок, подзаголовок и категория UI.
- `intro`: объяснение практической цели, ограничения, сложности.
- `opener`, `loop`: реальные списки этапов. Их различие основано на стартовых ресурсах/баффах; непротестированные loop явно помечать.
- `verification`:
  - `adapted` — основано на sourced route, но адаптировано под аккаунт/практику.
  - `partial` — какая-то граница/условие пока не подтверждена.
  - `experimental` — собственная гипотеза / нереплицированная связка.
  - `verified` — **резервировать только** для конкретной версии и условий с проверенным live-kit, расчётной/TC атрибуцией и фактическим воспроизводимым route (не просто бейдж сайта или один clear). Обязательно изложить evidence в source/guide.
  
Наличие зелёного CI доказывает корректный JSON/сборку, не игровую оптимальность. Метка сайта калькулятора (WuWaLAB или аналог) не переносится автоматически.

## Controls v1

`data/controls/<game>.json`:
```json
{
  "schemaVersion": 1,
  "game": "example-game",
  "schemes": [{
    "id": "terms",
    "label": "A / H",
    "help": [["A", "Basic"], ["Skill", "навык"]],
    "keys": {
      "basic": "A", "heavy": "H", "skill": "Skill",
      "ultimate": "Ult", "echo": "Echo", "dodge": "Dash",
      "auto": "Auto", "repeat": "A · серия"
    },
    "slotKeys": {"1": "", "2": ""},
    "slotExplain": "Универсальные обозначения",
    "summary": "Описание схемы для пользователя"
  }]
}
```

- `schemes[]`: 1+, ID каждой схемы уникален. `pc`/`ps5` — имена по соглашению, не обязательны, но можно добавить при известных биндах.
- `id: "terms"` — специальный режим универсальных терминов, он скрывает слоты и показывает `Intro/Outro/Swap` текстом.
- Остальные схемы используют `slotKeys` и отображают кнопки переключения. Обязательно покрыть значения `defaultSlots`.
- `keys` v1 **обязаны** содержать восемь строк `basic/heavy/skill/ultimate/echo/dodge/auto/repeat` даже если игра не использует один из типов. Неиспользуемые значения можно задать нейтральным `—`, но **не** создавать фиктивные actions.
- `help` — парные элементы `[кнопка, значение]`, `summary` и `slotExplain` — объясняют управление в UI.
- Важно: схема не моделирует сложные комбинации, удержание+условие, статус-комбо/карты как отдельные action kinds без изменения движка.

## Именованные библиотеки изображений

Для WuWa больше не подбирай арт вручную. Каноническая база — `data/portraits/wuthering-waves.json` (61 entry) и локальные файлы `public/portraits/wuthering-waves/<character-id>.webp`. Подробно: [PORTRAITS.md](PORTRAITS.md).

`characters[].portrait` в book и `teams[].characters[].portrait` в каталоге должен совпадать с `portrait` выбранного ID (например, `yyxl → yangyang-xuanling`). Валидатор `npm run validate:portraits` не пропустит несовпадение. Для других игр без готовой библиотеки возможны старые пути `portraits/name.webp`, но предпочтительна именованная папка игры.

## Catalog

В `games[]`: `id`, `name`, `shortName`, `mark`, `accent`, `status` (`available` при наличии команды), `subtitle`, `teams[]`.

`teams[]`: `id`, `name`, `subtitle`, `characters[]`, `status`, `statusDescription`, `gameVersion`, `source`, `variants[]` (каждый `id/name/verification`). Поля source/gameVersion, персонажи и варианты должны совпадать с book. Путь HTML / `path` больше не используется.

## Важные ограничения и правила обновления

- Первую версию schema нельзя расширять несовместимо с текущими данными или ломать сохранённые URI. При необходимости новых kind/controls — обновляй типы, JSON Schemas, валидатор, шаблоны, renderer, UI-тесты и инструкцию **одним PR**.
- Карточка ориентирована на линейную цепочку stages одного активного персонажа. Для ветвления, условных блоков, stack-based decision tree и пошагового card draw v1 недостаточна.
- Для 2–5 персонажей renderer может показать stage, но корректность игровых slot bindings и ресурса в другом жанре нужно проверить в действующей игре.
- Offline/PWA: картинки **локальные**, новый bundle/service worker после merge обновляется браузером. Проверь установленную PWA и deep links отдельно.
