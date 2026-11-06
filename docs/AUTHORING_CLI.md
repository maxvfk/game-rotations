# Автоматизированное добавление команды (D3/D4)

Это небольшие **authoring-time** скрипты в `maxvfk/game-rotations`: сайт остаётся статическим, без API, сервера, базы данных и нового runtime JSON. Предыдущие `data/rotations/` и `data/catalog.json` продолжают работать без миграции.

## Быстрое начало — для нового чата/агента

1. Начни с `AGENTS.md` → `docs/ADDING_ROTATIONS.md`. **Live-kit first** и исходный guide в `maxvfk/Games`; убедись, что пользователь действительно выбрал эту ротацию.
2. Скопируй **вымышленный** пример `examples/new-team.authoring.json` в рабочий файл (например `drafts/my-team.authoring.json` в feature-ветке или вне репозитория). Замени ВСЁ с префиксом `TEST`, заполни `evidence` и реальные actions. Не коммить незавершённый файл как готовую ротацию.
3. Проверь, что нужная игра уже есть в `data/catalog.json`, а схема кнопок — в `data/controls/<game>.json`. Для WuWa и Endfield используй соответствующий canonical `data/portraits/<game>.json`; не ищи изображения повторно. Для Endfield следуй [ENDFIELD_ROTATION_AUTHORING.md](ENDFIELD_ROTATION_AUTHORING.md).
4. Запусти **сначала без записи**:

```bash
npm install
npm run team:add -- --spec drafts/my-team.authoring.json
```

5. После проверки источника/содержимого и review создавай оба файла **одним вызовом**:

```bash
npm run team:add -- --spec drafts/my-team.authoring.json --write
npm run catalog:check
npm run build
npm run test:e2e
```

В GitHub Actions browser smoke запускается автоматически; отдельно проверь боевое исполнение (если оно ещё не проверено — выставь `partial`/`experimental` и честные `loopCaution`/limitations).

### Что вводить в spec

| Поле | Назначение |
| --- | --- |
| `schemaVersion:1`, `game`, `id` | стабильные game/team IDs, в lowercase-kebab; ID команды **глобально** уникален |
| `title`, `subtitle`, `status`, `statusDescription` | заголовок книги и редакционные подписи каталога |
| `gameVersion`, `source`, `verificationNote` | live/server/version, URL canonical guide и подробная атрибуция/ограничения |
| `evidence` | 12 обязательных текстовых разделов: `author`, `liveKit`, `resources`, `triggers`, `swaps`, `buffWindows`, `userSelection`, `limitations`, `codeTesting`, `uiTesting`, `offlineTesting`, `combatTesting` |
| `characters[]` | `id`, `investment`, `slot`; опционально `portraitId`, `glyph`, `color`. Для игры с registry имя/портрет определяется реестром, для других игр нужны явные `name`/`portrait` |
| `variants[]` | текущий v1 contract: `id`, `label`, `sub`, `type`, `intro`, `verification`, `opener`, `loop`, опционально `loopCaution` |
| `stages` | карта `stageId → {person,title,sub,actions,check,extra}`. Actions сохраняют тот же формат, что и `data/rotation.schema.json`; **никаких новых gameplay shortcuts** |

**Никакой магии над ротациями:** скрипт не вычисляет ресурсы, не улучшает порядок, не создаёт несуществующих действий и не заменяет TC. Он только переносит уже проверенные данные между файлами.

### Подключённый каталог Endfield

Каталог Endfield уже подготовлен: `data/portraits/arknights-endfield.json`, 34 PNG `public/portraits/arknights-endfield/`, просмотр `?portraits=arknights-endfield`. `team:add` автоматически найдёт операторов по точному slug (Arcane = `arcane`, Zhuang Fangyi = `zhuang-fangyi`); Endministrator `endministrator-f` и `endministrator-m` обязательно выбирать раздельно. **Endfield controls уже реализованы** (`data/controls/arknights-endfield.json`, Terms/PC), а Si-команда опубликована. Для каждой новой ротации всё ещё необходима собственная проверка live-kit и TC-evidence. Инструкция: [ENDFIELD_PORTRAITS.md](ENDFIELD_PORTRAITS.md).

### Портреты и контроль identity

Для WuWa `characters[].id = "shorekeeper"` разрешается через alias в `the-shorekeeper.webp`; `yyxl` разрешается в `yangyang-xuanling.webp`. Поля `name` и `portrait` для персонажа с записью в registry лучше опускать: скрипт добавит проверенные значения и отклонит конфликтующие override. `slot` должен быть уникальной цифрой для каждого персонажа, а `investment` указывается явно. Для новой игры без registry обязательны `name` и локальный `portrait` с корректным путём; если нет controls, сначала реализуй их.

### Что не разрешается делать

- `--write` отвергает незаполненные `TEST/TODO/TBD/PLACEHOLDER/FICTIONAL` в spec, ненастоящие example.org source, неизвестные game/controls/character IDs и невалидные ссылки на этапы.
- Если `team-id` уже существует с отличающимся book/catalog, `team:add --write` **откажется менять** файлы. Тот же самый spec можно передать повторно: получится безопасный no-op, без дубликатов или перезаписи.
- `evidence` — контроль *полноты записи*, а не автоматическая проверка правдивости или meta. Автор/ревьюер отвечает за факты, источники, live-kit и степень достоверности.
- Не создавай вымышленную команду в настоящем каталоге: шаблон и тестовый generator работают во временном каталоге.

## После первоначального добавления: синхронизация catalog ↔ book

**Канонические** `source`, `gameVersion`, `characters[].investment/portrait`, `variants[].verification` находятся в файле **book**: `data/rotations/<game>/<team>.json`. При их правке не нужно вручную исправлять копии в каталоге.

```bash
npm run catalog:sync -- --team my-team
npm run catalog:sync -- --team my-team --write
npm run catalog:check
```

- `catalog:sync` без `--write` — **dry run**, ничего не записывает.
- `catalog:sync -- --write` — синхронизировать все команды по book, с предварительной валидацией всего каталога.
- `catalog:check` — обязательный CI guard, завершится ошибкой при drift.
- Авторские подписи `subtitle`, `status`, `statusDescription`, а также короткие отображаемые имена персонажей и вариантов в каталоге **не перезаписываются**; они не являются дубликатами строгих book-полей.
- Синхронизация **не** изменяет `book`, порядок и ID этапов, `opener/loop`, `controls` или localStorage.
- Для сложных обновлений существующих команд делай обычный небольшой PR; генератор `add` на них не применяется.

## Приёмка, включая тест безопасности

`npm run test:authoring` на временной копии данных проверяет: dry-run без записи, отказ незавершённому spec, валидный первый импорт, корректный canonical portrait ID, безусловный отказ при конфликте, идемпотентность повторного запуска, `catalog:sync` и `catalog:check`, неизменность существующих book/stage IDs.

`npm run build` включает `catalog:check`, `validate:data`, `validate:portraits`, `test:onboarding`, `test:authoring`, `test:renderer`, TypeScript, Vite. GitHub Actions затем отдельно запускает мобильный Playwright + offline PWA тесты. Эти проверки **не** устанавливают фактический DPS или надёжность ротации в бою.

Это закрывает пункты D3/D4 ревью [PR #6](https://github.com/maxvfk/game-rotations/pull/6), не требуя новой backend-архитектуры.

### Учебный Endfield dry-run

[examples/endfield-team.authoring.json](../examples/endfield-team.authoring.json) — **непубликуемый TEST-пример** с четырьмя реальными operator IDs, многооператорным stage, FS/Combo/Skill/Ultimate/Dive, условным before/after Arts и непроверенным loop. Он демонстрирует **формат**, не реальную боевую последовательность. Проверка:

```bash
npm run team:add -- --spec examples/endfield-team.authoring.json
```

В `npm run test:authoring` пример проверяется в изолированном temporary checkout: dry-run должен пройти без модификации данных, `--write` должен отказать из-за оставшихся `TEST`, оригинальная Si-книга должна остаться неизменной. Для реальной команды скопируй spec в отдельный файл и замени все данные фактическими, а не удаляй слово TEST механически.
