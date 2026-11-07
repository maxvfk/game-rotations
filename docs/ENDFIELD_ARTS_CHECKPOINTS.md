# Endfield — Arts checkpoints (этап 03)

**Статус: 2026-11-07, семантические данные + action-local inline UI; PR #30 добавил пооперационные изменения для Prydwen.** Ротации Maygi/Prydwen всё ещё имеют `verification: partial`; действия и их порядок, UI-компоненты и изображения не изменены (расширены только Arts-данные и проверки).

## Архитектура: смысл отдельно от иконок

В `stage.artsCheckpoints[]` хранятся только семантические статусы и источники: эффект, количество стаков/уровень, конкретное действие и момент `before`/`after`, достоверность, условия и evidence. **Никаких `iconPath`, CSS, PNG, SVG, размеров или готовых римских цифр в JSON нет.** Компонент из этапа 02 (`src/arts-indicators.ts`) остаётся самостоятельным слоем визуализации. Игровой вид уровня Arts Reaction можно будет поменять без миграции ротаций.

Каждый checkpoint содержит `id`, `anchor:{actionIndex,relative}`, `status`, `evidence`, необязательные `dependsOn`, `condition` и `subject:primary-target`. `actionIndex` отсчитывается с **нуля** в `stage.actions[]`; это *логическая привязка к действию*, не точное время попадания или появления эффекта на сервере.

Структура `status`: `kind:infliction`, `element:heat|electric|cryo|nature`, `stacks:0..4|null` **либо** `kind:reaction`, `reaction:combustion|electrification|solidification|corrosion`, `level:1..4|null`. Нулевой стак — это подтверждённое отсутствие, `null` — неизвестность.

### Достоверность

| assessment | Значение |
| --- | --- |
| `target` | Численная **цель автора TC**, не подтверждённый результат |
| `conditional` | Реакция/уровень **только при выполнении condition**; не гарантировано исполнение |
| `unknown` | Неизвестные стаки или уровень, всегда с `null` |
| `observed` | Фактически измеренное состояние с числом, контекстом боя и `evidence.basis: combat-observation` |

Переходы связываются `dependsOn` от статуса **после** применения к статусу **до** того же действия. Это не два одновременно существующих эффекта. В частности, Cryo может быть поглощён для создания Corrosion. Уровень уже действующей более сильной Corrosion может сохраняться при обновлении, поэтому общий валидатор **не приравнивает автоматически** уровень реакции к только что поглощённым стакам.

### Пример первого Prydwen-пакета

```json
{
  "artsCheckpoints": [
    {
      "id": "cryo-corrosion-before",
      "anchor": {
        "actionIndex": 12,
        "relative": "before"
      },
      "subject": "primary-target",
      "status": {
        "kind": "infliction",
        "element": "cryo",
        "stacks": 4,
        "assessment": "target"
      },
      "evidence": {
        "basis": "tc-intent",
        "url": "https://www.youtube.com/watch?v=ZR1oTH2E03Y",
        "note": "Цель, а не наблюдение: собрать 4 стака перед Arcane Skill."
      }
    },
    {
      "id": "cryo-corrosion-after",
      "anchor": {
        "actionIndex": 12,
        "relative": "after"
      },
      "subject": "primary-target",
      "status": {
        "kind": "reaction",
        "reaction": "corrosion",
        "level": 4,
        "assessment": "conditional"
      },
      "dependsOn": "cryo-corrosion-before",
      "condition": "Только если 4 Cryo реально поглощены на той же цели и учтено прежнее состояние Corrosion.",
      "evidence": {
        "basis": "live-mechanic",
        "url": "https://endfield.games/en/tutorials/battle/",
        "note": "Nature поверх Cryo вызывает Corrosion, Status Level зависит от поглощения."
      }
    }
  ]
}
```

**Cryo ×4 → Corrosion IV здесь означает условный план, а не измеренный эффект.**

## Размеченные контрольные точки (текущий main)

**Всего 18 пар before→after = 36 checkpoint-записей:** у Maygi 3 пары (только Arcane Skill → Corrosion), у Prydwen 15 пар — по 5 на каждую фазу. Во всех случаях `anchor.actionIndex` **0-based**; номера действий в человекочитаемых гайдах **1-based**. У Prydwen числа являются **целями исполнения TC** при выполнении условий, не замерами.

| Вариант | Stage | Arts-changing action indices (0-based) | Целевые transitions |
| --- | --- | --- | --- |
| Maygi | `maygiPrep` | 9 | Cryo ? → Corrosion ? (условно) |
| Maygi | `maygiRebuild` | 6 | Cryo ? → Corrosion ? (условно) |
| Maygi | `maygiBurst` | 7 | Cryo ? → Corrosion ? (условно) |
| Prydwen | `prydwenOne` | **0, 1, 9, 10, 12** | Cryo 0→I→II→III→IV→Corrosion IV |
| Prydwen | `prydwenTwo` | **2, 4, 9, 10, 12** | Cryo 0→I→II→III→IV→Corrosion IV **при новом Si Brushwork Realm** |
| Prydwen | `prydwenBurst` | **3, 4, 5, 8, 9** | Cryo 0→I→II→III→IV→Corrosion IV **при корректных Ultimate 1 и Dive** |

**Список меняющих Arts действий Prydwen:** в первой фазе Si Skill, WILL Arcane Combo, Xaihi Combo, WILL Arcane Combo, Arcane Battle Skill; во второй Tangtang Battle Skill, Si Skill, Xaihi Combo, WILL Arcane Combo, Arcane Battle Skill; в третьей Tangtang Battle Skill, WILL Arcane Combo, Arcane Ultimate 1, Tangtang Dive Attack, Arcane Battle Skill.

Не показывать изменения стаков на обычных BA/Final Strikes, Tangtang Combo (он создаёт Whirlpool), усилениях Xaihi/Si или Finisher **без отдельного доказанного Arts-эффекта**. Не путать Cryo damage с Cryo Infliction.

**Второе применение Si Skill — существенный риск:** если Artful Intent предыдущего Brushwork Realm ещё активно, нажатие становится Initial Stroke/Inksoul, **не** новой Cryo application. Числа второго пакета тогда перестают соответствовать целевой схеме. Равным образом обнуление Cryo после Corrosion, попадание по одной цели, длительность стаков, Combo cooldown, SP/Ultimate и refresh уже действующего Corrosion влияют на переходы. Эти ограничения должны оставаться в `condition`/`evidence.note`, а не превращаться в `observed`.

Для `recoveryNote` Arts не выводим: повторный цикл не верифицирован. Источник пооперационного разбора — [Games: Si rotations](https://github.com/maxvfk/Games/blob/main/guides/arknights-endfield/SI_TANGTANG_ARCANE_XAIHI_ROTATIONS.md). Реализация и тесты — [PR #30](https://github.com/maxvfk/game-rotations/pull/30).

## Источники и границы проверки

- [Maygi — Complete Si Guide](https://www.youtube.com/watch?v=aeJeUjNLvuU), 08:56–10:50 — full-cycle TC и управление Combo. Точные stacks без практического просмотра пока неизвестны.
- [Prydwen/Gacha Gamer](https://www.youtube.com/watch?v=ZR1oTH2E03Y) — целевой первый Cryo-пакет, два Corrosion setup, Stagger. Времена Builder условные.
- [Si live kit](https://akendfield.tools/codex/operator/si): Combo на consumed/absorbed Cryo/Heat.
- [Arcane live kit](https://akendfield.tools/codex/operator/arcane): Nature на Battle Skill.
- [Arts Reaction](https://endfield.wiki.gg/wiki/Arts_Reaction) и [combat tutorial](https://endfield.games/en/tutorials/battle/): Status Level реакции определяется поглощёнными Infliction, а Corrosion — Nature-triggered.
- [Канонический guide Si](https://github.com/maxvfk/Games/blob/main/guides/arknights-endfield/SI_TANGTANG_ARCANE_XAIHI_ROTATIONS.md): provenance, спорные окна SP/CD и непроверенный повтор.

## Проверки и следующий шаг

`data/rotation.schema.json` валидирует строгие типы, допустимые диапазоны, URL и **не пропускает UI-поля**. `scripts/arts-checkpoint-validation.mjs` проверяет ссылки `dependsOn`, индекс действия, unique ID и запрет заявлять `observed` без combat evidence. `scripts/test-arts-checkpoints.mjs` выполняет позитивные и отрицательные тесты из `npm run build`. **CI не подтверждает боевую выполнимость TC-последовательностей.**

Исторический этап 04a показывал Arts в compact-заголовках; 04b привязал Arts к action chip, а 04c сделал подсказку однострочной рядом с кнопкой. Публичный UI должен различать `target`, `conditional`, `unknown`, никогда не показывать before и after как одновременно действующие, а для рендера передавать в библиотеку иконок только `kind`/`element`/`stacks` либо `reaction`/`level`. Внешний вид уровня реакции (текст справа, текст поверх PNG, другой игровой asset) можно заменить независимо.

## Текущий UI — ожидаемое изменение возле действия (2026-11-07)

После нескольких итераций (исторические 04a–04c) Arts привязаны к **самому действию** через `anchor.actionIndex`; заголовок этапа не несёт этих статусов. `src/arts-checkpoint-view.ts` создаёт `before → after` рядом с keycap внутри `.action-primary`; `src/arts-indicators.ts` отвечает за точные игровые PNG, кольца стаков и римские цифры. Модификация изображения не требует менять source data.

- **Maygi:** 3 action-local перехода Cryo (число неизвестно) → Corrosion (level неизвестен). Не показывать ложную цифру или кольцо.
- **Prydwen:** 15 action-local переходов, по пять на этап. Показывать рост Cryo I→IV и поглощение в Corrosion IV **как условный целевой маршрут**, не как гарантированный результат.
- **Достоверность:** `target` и `conditional` доступны через tooltip/`title`/ARIA и `condition`; в видимом inline UI **нет отдельной плашки** достоверности. Поэтому нельзя интерпретировать нарисованную цифру как измеренный результат. Если в дальнейшем потребуются постоянные видимые признаки неопределённости — это отдельное UX-решение, а не повод подменять assessment.
- **Full/Compact, PC/Terms и offline PWA** используют те же данные и локальные иконки. При `Arts: выкл` annotation nodes отсутствуют, сами действия и данные не изменяются. WuWa не получает Arts-checkpoints.

**Обязательные проверки после правки actions или Arts:** сверить все 0-based `actionIndex` с исполнителями и `input.kind`; у каждой пары `before` и `after` одинаковый индекс, `dependsOn` связывает ту же пару; корректно применены `target/conditional/unknown/observed`; источники, условие попадания, owner и статус цели указаны; затем `npm run test:arts-checkpoints`, `npm run test:renderer`, `npm run test:e2e`. Зелёный CI проверяет структуру и отображение, **не боевую исполнимость**.

**Будущая работа:** практическая проверка cooldown, animation timings, SP/UGE и реальных стаков/Corrosion на конкретном противнике. Не переносить `target` в `observed` без логов/видео с установленными исходными условиями.

## Переключатель Arts в Endfield (2026-11-07)

На странице Endfield рядом с контролом `Полный / Компактный` находится одна кнопка `Arts: вкл / Arts: выкл` (`#arts-visibility-toggle`, `aria-pressed`, стабильное `aria-label`). Значки **включены по умолчанию** и отключаются независимо от схемы управления и вида карточек. Выбор сохраняется на уровне команды в `localStorage` (`game-rotations:v2:<team-id>:artsVisible`, boolean) и действует для Maygi и Prydwen одновременно.

При отключении `createArtsActionEffect` не вызывается; подписи, `title` и `aria-label` Arts не добавляются в карточки. Данные `artsCheckpoints`, сами действия и источники остаются неизменными; возврат в режим «вкл» восстанавливает все значки. Не включать переключатель в WuWa и не затрагивать каталог Arts-gallery. Тесты: `test/e2e/arts-checkpoint-stage.spec.ts` (Full/Compact, Maygi/Prydwen, 320 px, reload, PWA/offline, WuWa isolation).
