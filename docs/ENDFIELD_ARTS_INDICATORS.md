# Endfield Arts-индикаторы — актуальные UI-компоненты

> Исторический этап 02 ограничивался галереей. Сейчас Arts используется action-local у Si (Maygi/Prydwen). Компонент всё ещё **не симулирует** механику; источники и семантика — [ENDFIELD_ARTS_CHECKPOINTS.md](ENDFIELD_ARTS_CHECKPOINTS.md).

## Где смотреть

[Game Rotations · Arts-проверка](https://maxvfk.github.io/game-rotations/?arts=arknights-endfield) — внутренний маршрут \`?arts=arknights-endfield\`; ссылка также в каталоге рядом с портретами.

В просмотрщике доступны:

- размеры отображения **24 / 28 / 32 CSS px**; исходные Infliction 125×125 RGBA PNG и Reaction 72×72, кроме Electrification 73×72;
- четыре игровых элемента **Heat, Electric, Cryo, Nature** и все варианты **1–4 стакa** с оригинальным четырёхсекторным кольцом;
- четыре реакции **Combustion, Electrification, Solidification, Corrosion**, с Roman Level **I–IV** в нижнем правом углу исходных PNG (CSS overlay, без таймера);
- явное **неизвестное** количество стаков и уровень реакции \`?\`; **0** отображается прочерком, потому что подтверждённого \`0-stack\`-спрайта нет;
- реальные PNG размещены локально, кэшируются PWA и доступны офлайн.

## API и точность

\`src/arts-indicators.ts\` экспортирует два независимых DOM-компонента:

\`\`\`ts
createArtsInfliction({
  element: 'cryo',
  stacks: 4,    // 0|1|2|3|4|null; null -> unknown
  size: 28,     // 24|28|32 CSS px, default 28
  base: '/game-rotations/',
});

createArtsReaction({
  reaction: 'corrosion',
  level: 4,     // 1|2|3|4|null; null -> unknown
  size: 28,
  base: '/game-rotations/',
});
\`\`\`

Каждый компонент возвращает \`HTMLSpanElement\` с доступным текстом \`role=img\` / \`aria-label\`. Внутренние \`img\` — декоративные (\`alt=""\`); при неудачной загрузке вместо битой картинки отображается \`?\`. Сначала проверяется допустимость значений, а URI берётся **только из импортированного канонического JSON** \`data/arts/arknights-endfield.json\`, без конкатенации непроверенных имён или внешних URL.

**Принципиально:** компонент не рассчитывает нарастающие стаки и не выводит статус из действий. Это **UI-only rendering** явного состояния, переданного вызывающей стороной. Переход **Cryo ×4 → Corrosion IV** нельзя изображать как два одновременно наложенных статуса без указания момента времени. В будущем \`artsCheckpoints\` должен содержать явный контрольный момент, предпосылки и \`verification\` / целевую или подтверждённую природу записи.

## Файлы

- \`src/arts-indicators.ts\` — общее API выбора оригинальной иконки и отдельной реакции;
- \`src/arts-indicators.css\` — размеры и оформление, scoped preview styles;
- \`src/arts-gallery.ts\` — интерактивная витрина с переключателями;
- \`src/main.ts\` — отдельный маршрут \`?arts=arknights-endfield\`, ссылка из каталога;
- \`test/arts-indicators.test.ts\` — проверки всех 16 Infliction и 16 представлений Reaction×Level, валидация границ и fallback;
- \`test/e2e/arts-indicators.spec.ts\` — мобильные 390px/320px, загрузка оригиналов, PWA/offline, независимость остальных страниц.

### Источники и ограничения

Изображения получены **из ранее импортированных исходников** каталога [ENDFIELD_ARTS_ICONS.md](ENDFIELD_ARTS_ICONS.md) / [JSON manifest](../data/arts/arknights-endfield.json), с pinned source commit и SHA-256. Ни один PNG не редактируется.

Не добавлять имитацию реакции для неподтверждённой последовательности и не изменять \`verification: partial\` у текущей Si-команды.

## Проверки

\`\`\`bash
npm run build
npm run test:e2e
\`\`\`

Этап 03 и action-local UI уже реализованы: checkpoints отображаются рядом с точным действием по `actionIndex`, **не** в заголовках. Новые значения требуют live-kit/evidence. Доступны Full/Compact и `Arts: вкл/выкл`.

## Уровни поверх иконок всех Arts Reaction (2026-11-04)

Вариант с Corrosion из PR #26 согласован, после чего тот же способ отображения распространён на Combustion, Electrification и Solidification. Для всех **известных** уровней I–IV римская цифра находится в **правом нижнем углу** оригинального игрового PNG (CSS `.arts-reaction-level-overlay`). Увеличенный полужирный serif и мягкая тёмная тень сохраняются **без дополнительной рамки, плашки и игрового таймера длительности**.

Цвет уровня точно соответствует доминирующему непрозрачному цвету соответствующего исходного PNG:
- Combustion — `#ff623d`
- Electrification — `#fdcf1d`
- Solidification — `#21c6d0`
- Corrosion — `#c3e354`

Оригинальные PNG, их SHA, JSON-каталог и игровые данные не изменяются. Размер уровня масштабируется вместе с 24/28/32 CSS px. Для `level:null` CSS-наложение не включается: gallery продолжает обозначать неизвестное как `?`, а action chip скрывает числовой маркер, не заменяя его выдуманным I. Полные названия и уровни остаются в `title` и `aria-label`. Новый стиль проверяется мобильными Playwright screenshots и PWA/offline тестами.
