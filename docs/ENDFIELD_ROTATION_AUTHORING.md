# Endfield — как добавить новую команду или ротацию

**Актуально для `main` (2026-11-07).** Репозиторий `maxvfk/game-rotations` — публикуемый справочник выбранных пользователем ротаций, **не симулятор**. Live-kit и подробный TC research ведутся в `maxvfk/Games` (`GAME_META_SOURCES.md`, `guides/README.md`). Сначала читай [AGENTS.md](../AGENTS.md), затем этот документ, [FORMAT_REFERENCE.md](FORMAT_REFERENCE.md), [REVIEW_CHECKLIST.md](REVIEW_CHECKLIST.md).

## Текущее состояние

Уже готовы `data/controls/arknights-endfield.json` (Terms/PC), реестр 34 портретов, mini для Si/Tangtang/Arcane/Xaihi, 20 PNG Arts, команда `si-tangtang-arcane-xaihi` с Maygi/Prydwen (`partial`). Full/Compact и `Arts: вкл / выкл` сохраняются для команды; Arts рисуются **у конкретного действия**, не в stage header. В Endfield нет progress/reset/checklist, а `По шагам` — навигация. Никаких новых controls или портретов для уже зарегистрированных персонажей не создавай.

## 1. Сначала факты и согласование

1. Убедись, что пользователь явно выбрал **именно эту** команду/вариант для публикации. Исследовательские версии оставляй в `Games`.
2. Проверь **live-kit на целевом server/patch**, generation/spend SP/UGE, Combo triggers и cooldown/ICD, absorption/stack limits, buffs/debuffs и refresh, active/off-field ownership, swap, Stagger, target count, latency/timing, starting state и возможный reset. Не интерпретируй расстояние между блоками Builder как секунды.
3. Запиши источник, автора/TC, инвестиции, условия, собственные адаптации и неопределённости. `verification:"verified"` — только при достаточном свидетельстве воспроизводимой ротации; иначе `adapted`, `partial` или `experimental`. `loopCaution` нужен при непроверенном цикле. Green CI не доказывает механику.
4. Для персональных билдов/состава сверяй «Игровые персонажи» через locator `Games/SOURCES.md`. Новое сообщение пользователя важнее таблицы.

## 2. Новая команда через authoring CLI

Учебный непубликуемый шаблон: [examples/endfield-team.authoring.json](../examples/endfield-team.authoring.json). Он содержит **TEST-фикции**, а не настоящую командную рекомендацию; `--write` намеренно заблокирован. Скопируй его **в рабочую ветку** и замени все TEST-поля реальными сведениями, включая `evidence`, `gameVersion`, `source`, `characters[].investment`, stages и variants. ID героев бери из `data/portraits/arknights-endfield.json` — `team:add` сам проставит имена и полные портреты; Endministrator F/M — разные ID. Переиспользуй текущие controls.

```bash
npm install
npm run team:add -- --spec examples/endfield-team.authoring.json  # учебный read-only dry-run
npm run team:add -- --spec path/to/filled-real-team.authoring.json # сначала проверить без записи
npm run team:add -- --spec path/to/filled-real-team.authoring.json --write # только после ревью
npm run catalog:check
```

Для **нового варианта существующей команды** `team:add` не подходит: правь `data/rotations/arknights-endfield/<id>.json` (stages, variants), затем `npm run catalog:sync -- --team <id> --write` и `npm run catalog:check`. Не меняй стабильные IDs без явной согласованной миграции.

## 3. Multi-operator stages и семантика action

В Endfield **один stage может объединять действия нескольких операторов**. `stage.person` определяет фокус/портрет этапа; `actions[].input.actor` — исполнитель конкретного Skill, Combo, Final Strike, Ultimate, Dive, Finisher и т. д. Если `actor` отсутствует, renderer использует `stage.person` как fallback — это может быть неверно для командной оси. Off-field Combo не означает Swap.

- `basic` — промежуточные BA; `count`/`repeat` применяются **только** к basic.
- `final-strike` — завершить BA-цепочку за активного оператора; `FS ×2` означает **две полные цепочки**, не два удара.
- `combo` — отдельное действие по реальному trigger; `ultimate` и `dive` — **разные действия** (не два Ultimate); `finisher` — только при соответствующем Stagger.
- `skill` — Battle Skill соответствующего `actor`; `input.press:"hold"` допускается только для Skill. `swap`/`intro`/`outro` используй только когда такой переход реально есть.
- `optional:true` с `condition`/`hint` — подсказка, не автоматический skip. `stage.check`/`extra` — требования/оговорки; цвет зависит от `input.kind`, не от желаемой расцветки.

Реальные действия смотри в `data/rotations/arknights-endfield/si-tangtang-arcane-xaihi.json` и сопоставляй с guide, но **не считай эту ротацию универсально optimal**.

## 4. Arts checkpoints (не обязательны)

`stages.<id>.artsCheckpoints` — **явные** snapshots, а не автоматический расчёт. `anchor.actionIndex` — **индекс с нуля** в окончательном `stage.actions[]`; `relative:"before"|"after"` — логическое до/после, не точные кадры. `dependsOn` связывает before→after **того же действия**, не два одновременно существующих статуса.

- `kind:"infliction"`: `element`, `stacks:0..4|null`; `kind:"reaction"`: `reaction`, `level:1..4|null`.
- `null` значит **неизвестно**, `0` — установленное отсутствие. `target` — цель TC, `conditional` — результат при явно указанном условии, `unknown` — неизвестность. `observed` требует `evidence.basis:"combat-observation"`, реально измеренных чисел и описанных encounter/starting-state.
- Источник `evidence:{basis,url,note}` обязателен. Нельзя выводить уровень Corrosion из числа видимых блоков без проверки refresh/prior status.
- UI пути, PNG, CSS, римские цифры и размеры **не хранятся в checkpoints**. Их визуализация в `src/arts-checkpoint-view.ts` / `src/arts-indicators.ts`. Переключатель `Arts: выкл` удаляет annotation nodes, **не меняя данные**.

Текущие **54 Si-checkpoints**: Maygi — 12 пар before→after на Arts-changing действиях (5/3/4 по фазам); Prydwen — 15 пар (5/5/5). Все числа Cryo получены из исходного порядка действий и live-kit, но **не являются опубликованными Maygi точными измерениями**. `assessment:"target"` обозначает ожидаемую ветку при явно указанных условиях, `observed` не используется; Corrosion во второй/третьей фазе Maygi имеет `level:null` из-за возможного сохранения более сильного RES reduction при обновлении. Второе Si Skill может быть Initial Stroke/Inksoul вместо Brushwork Realm, без нового Cryo; стадия Arcane Ultimate должна быть **WILL У1**, а Dive Tangtang — с активным OLDEN STARE. После обычных BA/Final Strike и Tangtang Combo иконка Arts не добавляется. Source-derived `actionIndex` не доказывает точный тайминг попадания.

## 5. Physical checkpoints (отдельно от Arts)

Для физической команды можно добавить `stages.<id>.physicalCheckpoints[]` с числом **Vulnerability** (0–4 или `null`) до/после конкретного действия и, отдельно, событием **Lift / Knock Down / Crush / Breach** после него. `status.kind:"effect"` означает **событие**, а не постоянно действующий debuff. **Не** вписывать Physical в `artsCheckpoints` и не назначать `observed` без combat evidence. `Shatter` связан с Solidification и не подменяется одним из четырёх физических эффектов. Перед публикацией перепроверь `trigger`, `forced` исключения, целевую единицу, CC/ICD и consumption; никаких автоматических вычислений из `input.kind`. Подробная схема, примеры и тесты: [ENDFIELD_PHYSICAL_CHECKPOINTS.md](ENDFIELD_PHYSICAL_CHECKPOINTS.md). При отсутствии физических данных отдельный Physical-переключатель в интерфейсе не появляется.

## 6. Review / CI / публикация

```bash
npm run catalog:check
npm run validate:data
npm run test:arts-checkpoints
npm run test:physical-checkpoints
npm run validate:physical
npm run validate:portraits
npm run test:authoring
npm run test:renderer
npm run build
npm run test:e2e
```

Проверь **саму новую команду**, а не только существующую Si: deep link `?team=<id>`, Terms/PC, Maygi-подобные variants и opener/loop, Full/Compact, Arts on/off, Physical on/off **если есть данные**, mini/fallback, 320 и 390 px без overflow, PWA offline, титулы и ARIA. В Endfield нет чеклистов; у WuWa должны остаться прежние. При UI-изменениях приложи скриншоты. PR содержит автора/TC, server/patch, отличия/адаптации, проверки и оставшиеся неопределённости. Feature branch → PR → зелёный CI/ревью → merge `main` → проверить Pages deploy.