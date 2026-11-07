# Чеклист приёмки добавленной ротации

Используй для PR в `maxvfk/game-rotations`. CI отвечает только за структуру и сборку; игровые свойства требуют независимого evidence.

## A. Контент / доказательства

- [ ] Пользователь явно выбрал эту команду/ротацию для своей библиотеки (новая гипотеза не выдана за его выбор).
- [ ] Указаны game/server/live version, состав/инвестиции/оружие, общий `source` и автор(ы) точных вариантов.
- [ ] Для критических действий проверены live-kit, ресурсы до/после, triggers, cooldown/ICD, buff windows, swap/field и ownership.
- [ ] Opener и loop разделены, их starting state и устойчивость учтены. Для сложных ротаций проверены practical timing/латентность.
- [ ] `verification` честно выбран: sourced+адаптировано / частично / экспериментально / воспроизводимо. `Verified` от инструмента не приравнивается к `verified` сайта.
- [ ] Сохранены нетривиальные `check` и `extra`, а не только кнопки. Не перепутаны `Intro` / `Outro` / обычный `Swap`.

## B. Данные / schema

- [ ] Скопирован актуальный `main`, PR отдельной короткой веткой.
- [ ] Новый JSON лежит в `data/rotations/<game>/<team>.json`, имя файла = team ID.
- [ ] `data/catalog.json` содержит команду, вариантные ID и правильный game.status.
- [ ] ID команды уникален в проекте; stage refs, character ids, slots и target согласованы.
- [ ] Для новой игры добавлен `data/controls/<game>.json` с правильными `keys/slotKeys/help/summary` (а не биндами другой игры).
- [ ] Новые портреты локальные, существуют в `public/portraits/`; нет внешних hotlinks.
- [ ] Исходные существующие ротации/ID/progress не изменены случайно.

## Проверка портретов

- [ ] Для WuWa имя, ID и стихия выбраны по `data/portraits/wuthering-waves.json` (и визуальному каталогу), а не по CDN basename.
- [ ] Портреты в book и catalog совпадают с реестром; Yangyang и Yangyang Xuanling не перепутаны, Rover размечен по стихии.
- [ ] `npm run validate:portraits` прошёл; локальные файлы доступны офлайн; при обновлении проверены source и лицо на изображении.

## Новые modifiers / warnings (P2)

- [ ] Для `Skill` правильно размечены `tap` / `hold`, отдельно проверено отпускание между ними; ПК/PS5/terms показывают **разные** кнопки.
- [ ] Необязательные actions имеют `optional:true`; если есть условие, задана `condition`; стадия не скрывается автоматически и ресурсы не объявляются проверенными без evidence.
- [ ] Если повторный цикл не проверен, у `variant` указан `loopCaution`, видимый при выборе «Повтор»; сохраняются старые ID и прогресс.
- [ ] DOM + Playwright проверяют реально отображаемые подписи/подсказки/предупреждения, а не только schema JSON.

## D3/D4 — приёмка нового authoring workflow

- [ ] Для новой команды использован единый spec `examples/new-team.authoring.json` → `npm run team:add -- --spec ...` без записи, затем `--write` после проверки источников и выбранного варианта.
- [ ] В spec есть атрибуция author/TC, server/live kit, ресурсы/triggers/swaps/buff, явно выбранная пользователем ротация, ограничения и раздельные code/UI/offline/combat statuses.
- [ ] `npm run catalog:check` зелёный; после правок book использован `catalog:sync` для source/version/investment/portrait/verification вместо ручного дублирования.
- [ ] `npm run test:authoring` зелёный: no-op повторный импорт, отказ перезаписи, canonical portrait lookup, отсутствие мутаций действующих команд и IDs.
- [ ] `--write` не выполнялся на незавершённом шаблоне; в repository не опубликована вымышленная игровая команда.

## Endfield portrait-library QA

- [ ] ID операторов взяты из `data/portraits/arknights-endfield.json`, без попытки угадать по `icon_chr_*.`
- [ ] Endministrator F/M не перепутаны; оригинальные PNG не перекроены и доступны офлайн.
- [ ] `npm run validate:portraits` проверил все 34 PNG и full SHA-256.
- [ ] Переиспользованы существующие Endfield Terms/PC controls (`data/controls/arknights-endfield.json`), а live-kit/TC evidence проверены для **новой** ротации.

## C. Автоматическая и пользовательская проверка

- [ ] `npm run validate:data` зелёный.
- [ ] `npm run test:onboarding` зелёный (вымышленный пример успешно подключается, преднамеренные ошибки отвергаются).
- [ ] `npm run test:renderer` зелёный: реальные подписи `action.text`, named Intro, repeat атаки, корректный свежий opener и сохранённые preferences проверены на actual renderer DOM.
- [ ] `npm run typecheck` и `npm run build` зелёные; CI PR прошёл.
- [ ] GitHub Actions `npm run test:e2e` зелёный: production-build открыт в Chromium на mobile viewport, screenshot/портреты/управление и offline PWA reload проверены; screenshot доступен в `rotation-mobile-smoke` artifact.
- [ ] На мобильном экране проверены каталог → карточка → `?team=<id>`, варианты, opener/loop, сохранение и возврат. Чекбоксы/progress относятся **только к WuWa**; Endfield не имеет progress.
- [ ] Проверена выбранная схема управления (ПК/PS5/A-H там, где она реально применяется), правильность кнопок и target.
- [ ] Проверена мобильная верстка, портреты, отсутствие ошибок JS и горизонтальной прокрутки.
- [ ] После merge проверены Pages deployment и первый/повторный **офлайн** запуск PWA.

## D. Итог в PR/ответе

- [ ] Перечислены ссылки на источники/guide, авторы и ограничения достоверности.
- [ ] Указаны commit/PR и CI, что было реально проверено, какие проверки недоступны.
- [ ] Не обещано `optimal` без расчётов и practical testing.
- [ ] Изменения project memory в `maxvfk/Games` вносятся только если меняется архитектура, canonical locator или долговечный research; не при обычном добавлении карточки.

## Отдельная приёмка Endfield

- [ ] `stage.person` — фокус, `actions[].input.actor` — корректный исполнитель; off-field Combo не выдан за Swap/Intro.
- [ ] `FS ×2` = две **полные** BA-цепочки; `combo`, `final-strike`, `ultimate`, `dive`, `finisher` имеют реальные triggers и не смешаны.
- [ ] Канонические portraits и Terms/PC используются повторно, mini либо full portrait/glyph fallback.
- [ ] **Новая** ссылка `?team=<id>` проверена в Full/Compact, Arts on/off, Terms/PC, opener/loop, 320/390px без overflow и PWA offline; WuWa не изменён.
- [ ] Для новых `artsCheckpoints` перепроверены все 0-based `actionIndex` после изменения действий, `before/after`, `dependsOn`, `null != 0` и evidence; `observed` только с combat-observation.
- [ ] Для `physicalCheckpoints`: Vulnerability snapshot и Physical event отделены друг от друга; 0-based actionIndex, одна цель, before→after и зависит только от авторских evidence, `conditional`/`observed` корректны, Shatter/forced не выдуманы. [Physical runbook](ENDFIELD_PHYSICAL_CHECKPOINTS.md). Если physical присутствует, проверен отдельный toggle, compact и 320px без overflow.
- [ ] Непроверенные SP/UGE, cooldown/ICD, ownership, Stagger/encounter и repeat не выданы за optimal/verified; `loopCaution` заполнен при необходимости.
- [ ] Зелёные smoke-тесты **существующей** Si-команды не заменяют QA новой команды.

[Единый Endfield-runbook](ENDFIELD_ROTATION_AUTHORING.md).
