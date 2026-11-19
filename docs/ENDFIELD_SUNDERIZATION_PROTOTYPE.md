# Sunderization — пробный индикатор (Endfield)

**19 ноября 2026:** один action-local индикатор в `argent-flow-arcane-gilberta-liino` → `coldBuildup` → Bolt Rush, actionIndex **5** (zero-based). **Остальные действия и команды не менялись.**

## Источник оригинальной иконки

Game buff `buff_chr_0037_minghe_thundertrigger`, `hasIcon:true`, `iconConfig._spritePath:"icon_battle_buff_minghe_thundertrigger"`, `showInHeadBarCommon:true`. [Ресурс клиента / EndfieldData](https://github.com/rmxlinux/EndfieldData/blob/main/Json/BuffData/buff_chr_0037_minghe_thundertrigger.json); [Endaxis generated buff presentation](https://github.com/Lieyuan621/Endaxis/blob/main/src/data/operators/minghe.generated.ts) сопоставляет его с `effects.name.sunderization`.

Источник точных байтов WebP: [Endaxis public/icons](https://github.com/Lieyuan621/Endaxis/blob/main/public/icons/icon_battle_buff_minghe_thundertrigger.webp), source Git blob `efbb65ba047976046ca0fcd11297a713198eccb6`. Копия без перерисовки: `public/effects/arknights-endfield/sunderization.webp` (VitePWA precache `*.webp`).

## Модель

`action.sunderization?: {gain,assessment,condition,source}` задаёт **прирост** от данного действия (1–4), сейчас только `assessment:"conditional"`. Пример: два Electric Infliction → Argent Flow Bolt Rush → Electrification III → возможные **+3 Sunderization**. Внешняя иконка 24×24 с подписью `+3` рядом с Arts-индикатором, с полными условиями в tooltip/ARIA. Это не подсчёт общего числа 0–12; не измерение, не подтверждение фактического попадания и не гарантия выполнения триггеров.

Индикатор независим от Arts toggle (Sunderization — отдельный дебафф). Проверки: 320 px, Full/Compact, отсутствие горизонтального overflow, доступность изображения и PWA offline, сохранность остальных ротаций.

Перед полным внедрением потребуется семантическая модель суммы стаков на конкретной цели, lifetime, reset при Crush, delayed Liino Electrification и зависимостей в боевой ротации.
