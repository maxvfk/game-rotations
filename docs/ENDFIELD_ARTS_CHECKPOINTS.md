# Endfield — Arts checkpoints (этап 03)

**Статус: 2026-11-04, только данные.** Ротации Maygi/Prydwen всё ещё имеют `verification: partial`; действия, тайминги, UI и изображения не меняются.

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

## Размеченные контрольные точки

| Вариант | Stage | Action index (Arcane Battle Skill) | Перед применением | После применения |
| --- | --- | ---: | --- | --- |
| Maygi | `maygiPrep` | 9 | Cryo: ? | Corrosion: ? (условно) |
| Maygi | `maygiRebuild` | 6 | Cryo: ? | Corrosion: ? (условно) |
| Maygi | `maygiBurst` | 7 | Cryo: ? | Corrosion: ? (условно) |
| Prydwen | `prydwenOne` | 12 | Cryo: **цель 4** | Corrosion **IV при выполнении условия** |
| Prydwen | `prydwenTwo` | 12 | Cryo: ? | Corrosion: ? (условно) |
| Prydwen | `prydwenBurst` | 9 | Cryo: ? | Corrosion: ? (условно) |

Для `recoveryNote` ничего не выводим: повторный цикл не верифицирован. **Все шесть событий содержат две точки before/after, всего 12 checkpoint-записей.** Мы не вычисляем численные уровни из количества показанных на Prydwen Builder блоков.

## Источники и границы проверки

- [Maygi — Complete Si Guide](https://www.youtube.com/watch?v=aeJeUjNLvuU), 08:56–10:50 — full-cycle TC и управление Combo. Точные stacks без практического просмотра пока неизвестны.
- [Prydwen/Gacha Gamer](https://www.youtube.com/watch?v=ZR1oTH2E03Y) — целевой первый Cryo-пакет, два Corrosion setup, Stagger. Времена Builder условные.
- [Si live kit](https://akendfield.tools/codex/operator/si): Combo на consumed/absorbed Cryo/Heat.
- [Arcane live kit](https://akendfield.tools/codex/operator/arcane): Nature на Battle Skill.
- [Arts Reaction](https://endfield.wiki.gg/wiki/Arts_Reaction) и [combat tutorial](https://endfield.games/en/tutorials/battle/): Status Level реакции определяется поглощёнными Infliction, а Corrosion — Nature-triggered.
- [Канонический guide Si](https://github.com/maxvfk/Games/blob/main/guides/arknights-endfield/SI_TANGTANG_ARCANE_XAIHI_ROTATIONS.md): provenance, спорные окна SP/CD и непроверенный повтор.

## Проверки и следующий шаг

`data/rotation.schema.json` валидирует строгие типы, допустимые диапазоны, URL и **не пропускает UI-поля**. `scripts/arts-checkpoint-validation.mjs` проверяет ссылки `dependsOn`, индекс действия, unique ID и запрет заявлять `observed` без combat evidence. `scripts/test-arts-checkpoints.mjs` выполняет позитивные и отрицательные тесты из `npm run build`. **CI не подтверждает боевую выполнимость TC-последовательностей.**

Этап 04 — подключение в compact-заголовки. Публичный UI должен различать `target`, `conditional`, `unknown`, никогда не показывать before и after как одновременно действующие, а для рендера передавать в библиотеку иконок только `kind`/`element`/`stacks` либо `reaction`/`level`. Внешний вид уровня реакции (текст справа, текст поверх PNG, другой игровой asset) можно заменить независимо.
