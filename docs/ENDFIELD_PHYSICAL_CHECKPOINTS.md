# Endfield — Physical checkpoints: привязка к действию

**Актуально для `main` после PR #34.** Поддержка опциональна. Existing Si (Maygi/Prydwen) **не содержит** физической разметки — без отдельного источника и боевой проверки её нельзя автоматически заполнять. Примеры ниже — **TEST-only**, не утверждение о применении физического эффекта данным оператором.

## Две разные сущности

- **`kind:"vulnerability"`** — состояние конкретной цели в момент `before` или `after`; `stacks:0..4|null`. `0` значит доказанное отсутствие, `null` — неизвестность. Не считать ноль или `unknown` одним стеком.
- **`kind:"effect"`** — **событие после действия**: `lift`, `knock-down`, `crush`, `breach`. Значок — source-native game event glyph, а не persistent status icon; не рисуй к нему выдуманную «длительность» или I–IV. Если физическое событие не гарантировано, обязательны `assessment:"conditional"` и явный `condition`. `observed` только по боевым данным.
- **Shatter** от Physical × Solidification — отдельное взаимодействие Arts/Physical, а **не** один из четырёх `kind:"effect"`. Не подставляй `breach` вместо Shatter; schema намеренно не принимает `effect:"shatter"`.
- **Physical Susceptibility** — отдельный дебафф, не `vulnerability`; пока не представлен в этой схеме.

Модель live-kit: Vulnerability (до четырёх стаков) создаётся первым обычным Physical Status; Lift/Knock Down при наличии добавляют стак, Crush/Breach расходуют все. Встречаются **forced**-исключения и враги, невосприимчивые к CC. Никогда не выводи физическое событие и количество стаков лишь из `input.kind`, имени персонажа или ожидаемой ротации. [Официальная DEV Comm//02](https://endfield.gryphline.com/en-us/news/1340), [Prydwen Effects Dictionary](https://www.prydwen.gg/arknights-endfield/guides/effects-dictionary), [Talos Physical Status](https://endfield.wiki.gg/wiki/Physical_Status), [игровой tutorial](https://endfield.games/en/tutorials/battle/).

## Контракт JSON

Новый необязательный `stage.physicalCheckpoints[]` — **отдельный** от `stage.artsCheckpoints[]`. Параметры показа `PNG`, `css`, `levelIcon` запрещены. `subject:"primary-target"` обязателен: переход относится к **одной** цели.

```json
{
  "physicalCheckpoints": [
    {
      "id": "test-before",
      "anchor": { "actionIndex": 0, "relative": "before" },
      "subject": "primary-target",
      "status": { "kind": "vulnerability", "stacks": 3, "assessment": "target" },
      "evidence": {
        "basis": "tc-intent",
        "url": "https://endfield.wiki.gg/wiki/Physical_Status",
        "note": "TEST: гипотетические стаки в учебном примере, не измерение"
      }
    },
    {
      "id": "test-after",
      "anchor": { "actionIndex": 0, "relative": "after" },
      "subject": "primary-target",
      "status": { "kind": "vulnerability", "stacks": 0, "assessment": "conditional" },
      "dependsOn": "test-before",
      "condition": "TEST: лишь если Crush действительно сработал по той же цели",
      "evidence": {
        "basis": "live-mechanic",
        "url": "https://endfield.wiki.gg/wiki/Physical_Status",
        "note": "TEST: условное последующее состояние, не наблюдение"
      }
    },
    {
      "id": "test-effect",
      "anchor": { "actionIndex": 0, "relative": "after" },
      "subject": "primary-target",
      "status": { "kind": "effect", "effect": "crush", "assessment": "conditional" },
      "condition": "TEST: лишь если Crush сработал при наличии Vulnerability",
      "evidence": {
        "basis": "live-mechanic",
        "url": "https://endfield.wiki.gg/wiki/Physical_Status",
        "note": "TEST: событие; не постоянный debuff и не проверенная ротация"
      }
    }
  ]
}
```

**Это учебный пример**: нельзя вставлять его в опубликованную Si-ротацию. В кодовых тестах используется аналогичный изолированный объект, не файл `data/rotations/`.

### Проверяемые ограничения

1. `anchor.actionIndex` — индекс **с нуля** в финальном `stage.actions[]`; `before` и `after` не обозначают точные кадры попадания. После перестановки действий перепроверь индексы.
2. `before→after` одного Vulnerability прикрепляются к **одному действию** через `dependsOn`. На одном action может быть не больше одного before, одного after и одного event. Event не имеет `dependsOn` и допустим только **после** действия.
3. `target` — цель TC, **не наблюдение**; `conditional` требует подробного `condition`; `unknown` требует `stacks:null`; `observed` требует числовое значение (для Vulnerability), `basis:"combat-observation"` и `condition` с encounter/starting state. `combat-observation` нельзя назначать неподтверждённому результату.
4. Валидатор проверяет форму, последовательность и evidence, но **не вычисляет** автоматическую арифметику стаков, перезагрузку, forced lift, Shatter, ICD/trigger или право собственности. Источник с одним точным рисунком — ещё не доказательство реального hit timing.
5. Четыре source-pinned Vulnerability PNG и Physical event glyphs определяются **реестром** [data/physical/arknights-endfield.json](../data/physical/arknights-endfield.json). Не менять исходные байты для нового checkpoint.

## Renderer и настройки

- `src/physical-checkpoint-view.ts` отображает небольшую строку `Vulnerability before → Vulnerability after · event glyph` **у соответствующего action**, а не в header этапа.
- Видимые PNG не показывают уровень доверия: `target`, `conditional`, `observed`, условия и provenance остаются в `title` и `aria-label`.
- Кнопка `Physical: вкл/выкл` появляется **только в Endfield-книгах, где реально есть physicalCheckpoints**. Выбор сохраняется как `game-rotations:v2:<team-id>:physicalVisible` (default `true`) для всех вариантов команды и не влияет на отдельный Arts toggle.
- Отключение удаляет Physical annotation nodes и их доступные подписи, не изменяя JSON; нет глобального переключателя для других игр.
- [Галерея Physical](https://maxvfk.github.io/game-rotations/?physical=arknights-endfield) содержит два явно подписанных **TEST** примера 2→3 + Lift и 3→0 + Breach. Это проверка компоновки и PNG, не playable rotation.

## Проверки

```bash
npm run test:physical-checkpoints
npm run validate:data
npm run validate:physical
npm run test:renderer
npm run build
npm run test:e2e
```

Задачи: positive/negative schema/domain tests, исходная Si без физической разметки, WuWa/progress unchanged, 320/390px, Full/Compact, PWA offline, отсутствие выдуманных уровней на effect glyphs. В существующем Si нельзя проверить реальный per-book toggle до появления **подтверждённой** Physical-разметки в новой команде; это отдельный acceptance пункт для первого боевого применения.

**Следующий содержательный шаг:** выбрать физическую команду и source-backed ротацию; исследовать exact trigger/resource/CC/target/buff conditions, затем заполнить checkpoints по каждому действию. Не публиковать ни одно `observed` без воспроизводимых боевых данных.
