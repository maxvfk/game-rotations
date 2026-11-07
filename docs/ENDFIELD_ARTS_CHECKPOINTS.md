# Endfield — Arts checkpoints (этап 03)

**Статус: 2026-11-07, семантические данные + action-local inline UI; PR #30 добавил пооперационные изменения для Prydwen.** Ротации Maygi/Prydwen всё ещё имеют `verification: partial`; действия и их порядок, UI-компоненты и изображения не изменены (расширены только Arts-данные и проверки).

## Архитектура: смысл отдельно от иконок

В `stage.artsCheckpoints[]` хранятся только семантические статусы и источники: эффект, количество стаков/уровень, конкретное действие и момент `before`/`after`, достоверность, условия и evidence. **Никаких `iconPath`, CSS, PNG, SVG, размеров или готовых римских цифр в JSON нет.** Компонент из этапа 02 (`src/arts-indicators.ts`) остаётся самостоятельным слоем визуализации. Игровой вид уровня Arts Reaction можно будет поменять без миграции ротаций.

Каждый checkpoint содержит `id`, `anchor:{actionIndex,relative}`, `status`, `evidence`, необязательные `dependsOn`, `condition` и `subject:primary-target`. `actionIndex` отсчитывается с **нуля** в `stage.actions[]`; это *логическая привязка к действию*, не точное время попадания или появления эффекта на сервере.

Структура `status`: `kind:infliction`, `element:heat|electric|cryo|nature`, `stacks:0..4|null` **либо** `kind:reaction`, `reaction:combustion|electrification|solidification|corrosion`, `level:1..4|null`. Число `0` означает отсутствие стаков **в рамках указанного `assessment`** (например, целевой clean start при `target`), а `null` — неизвестное число. `target: 0` само по себе не доказывает, что цель в реальном бою была чистой.

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

## Размеченные контрольные точки (07.11.2026; Maygi и Prydwen)

**Всего 27 пар before→after = 54 checkpoint-записи:** Maygi — **12 пар** в трёх фазах, Prydwen — **15 пар** в трёх фазах. `actionIndex` всегда **0-based**; шаги в гайде — 1-based. Визуальные числа — условная реконструкция из исходных действий и live-kit, **не боевой лог и не опубликованные Maygi числовые измерения**.

| Вариант | Stage | Arts-changing action indices (0-based) | План при выполнении всех условий |
| --- | --- | --- | --- |
| Maygi | `maygiPrep` | **0, 2, 5, 7, 9** | Cryo 0→I→II→III→IV→Corrosion IV |
| Maygi | `maygiRebuild` | **1, 4, 6** | Cryo 0→I→II→Corrosion ? |
| Maygi | `maygiBurst` | **2, 4, 5, 7** | Cryo 0→I→II→III→Corrosion ? |
| Prydwen | `prydwenOne` | **0, 1, 9, 10, 12** | Cryo 0→I→II→III→IV→Corrosion IV |
| Prydwen | `prydwenTwo` | **2, 4, 9, 10, 12** | Cryo 0→I→II→III→IV→Corrosion IV |
| Prydwen | `prydwenBurst` | **3, 4, 5, 8, 9** | Cryo 0→I→II→III→IV→Corrosion IV |

**Maygi actions:** в первой фазе Si Skill, WILL Arcane Combo, Tangtang Skill, Xaihi Combo, Arcane Skill; во второй — Si Skill, Xaihi Combo, Arcane Skill; в третьей — Tangtang Dive Attack (Riot Bringer), WILL Arcane Combo, WILL Arcane Ultimate **первая стадия**, Arcane Skill. Другие BA/FS, Tangtang Combo (только Whirlpool), баффы и Finisher не получают придуманные изменения Arts. Cryo DMG ≠ Cryo Infliction.

**Почему Corrosion ? во второй и третьей фазах:** по этой ветке до второго Arcane Skill ожидаются два, а до третьего — три Cryo. Однако более сильный ранее действовавший Corrosion может сохранять прежнее RES reduction при refresh. Уровень текущего статуса и силу снижения сопротивления не всегда можно восстановить из стаков перед последним Skill. Поэтому реакция имеет `level:null` и `assessment:"conditional"`; цель Cryo II / Cryo III перед ней всё равно показана.

**Особый риск Maygi:** второй Si Skill только при завершившемся Artful Intent начинает новый Brushwork Realm и даёт Cryo. Иначе это 15-SP Initial Stroke/Inksoul **без нового Cryo**. В третьей фазе только досрочное завершение OLDEN STARE через Dive Attack с Riot Bringer даёт новый Waterspout; а WILL Arcane Ultimate добавляет Cryo **только на первой стадии Gloompurger Array**, если цель уже имеет Cryo.

Для `recoveryNote` Arts не выводим: повторный цикл не верифицирован. Подробная механическая атрибуция: [Games — Si rotations](https://github.com/maxvfk/Games/blob/main/guides/arknights-endfield/SI_TANGTANG_ARCANE_XAIHI_ROTATIONS.md), [Maygi original](https://www.youtube.com/watch?v=aeJeUjNLvuU&t=536s), [Prydwen action work PR #30](https://github.com/maxvfk/game-rotations/pull/30).

## Источники и границы проверки

- [Maygi — Complete Si Guide](https://www.youtube.com/watch?v=aeJeUjNLvuU), 08:56–10:50 — полная source sequence и управление Combo. Числа Cryo I–IV/II/III в новой разметке — **собственный вывод по source actions + live-kit**, не утверждение, что Maygi проговорила эти точные числа.
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
