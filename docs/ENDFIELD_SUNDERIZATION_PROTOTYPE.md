# Sunderization — Endfield: action-local приросты

**Обновлено 19.11.2026:** после [первого пробного индикатора, PR #40](https://github.com/maxvfk/game-rotations/pull/40) одобренного пользователем, оригинальная игровая иконка применена к **каждому потенциально Argent-owned Sunderization gain** в двух выбранных командах: `argent-flow-arcane-gilberta-liino` и `argent-flow-arcane-antal-liino`. Все числовые значения — **conditional scenario, не observed**.

## Оригинальный asset

Game buff `buff_chr_0037_minghe_thundertrigger`: `hasIcon:true`, `iconConfig._spritePath:"icon_battle_buff_minghe_thundertrigger"`, `showInHeadBarCommon:true`. [EndfieldData исходный BuffData](https://github.com/rmxlinux/EndfieldData/blob/main/Json/BuffData/buff_chr_0037_minghe_thundertrigger.json); [Endaxis presentation](https://github.com/Lieyuan621/Endaxis/blob/main/src/data/operators/minghe.generated.ts) связывает значок с `effects.name.sunderization`. Source original WebP [Endaxis public/icons](https://github.com/Lieyuan621/Endaxis/blob/main/public/icons/icon_battle_buff_minghe_thundertrigger.webp), SHA blob `efbb65ba047976046ca0fcd11297a713198eccb6`; local unchanged `public/effects/arknights-endfield/sunderization.webp`.

## Смысл `action.sunderization`

`{gain:1..4|null,assessment:"conditional",condition:string,source:https-url}`. Иконка 24×24 с `+N` если прогноз локального уровня Electrification определён механикой, `+?` если точно не известен. Это **только прирост на конкретной цели от Electrification, применённой самим Argent Flow**, а не текущая сумма 0–12. Для unknown gain в обязательном `condition` указывают, что именно не позволяет назвать уровень.

По live kit [Argent Flow](https://endfield.wiki.gg/wiki/Argent_Flow) / [Icy Veins](https://www.icy-veins.com/arknights-endfield/argent-flow-profile-skills): Talent `Zenith of Voltmancy` кладёт **N Sunderization** только когда **Argent Flow сам применяет Electrification Lv N** (максимум 12 на одном противнике, 60 s). Bolt Rush использует Electric Infliction и принудительно накладывает Electrification. Другие операторы, включая Liino, не создают Sunderization через свою Electrification, если Argent не является владельцем эффекта. Ultimate Argent применяет **Electric Infliction**, но не гарантирует Electrification; **только когда его Electric вызывает Electrification на предварительно имевшейся Nature**, возможен дополнительный прирост прямо перед финальным Crush. После этого Crush **детонирует и расходует** Sunderization. Точный момент попадания и предварительный статус в длинной ротации не измерены.

### Указанные действия (0-based `stage.actions`)

| Team | Stage | Index | Source action | Expected gain |
| --- | --- | ---: | --- | --- |
| Gilberta | `coldBuildup` | 5 | первый Bolt Rush | `+3` |
| Gilberta | `buildupRepeat` | 5 | очередной Bolt Rush | `+3`, только при Electric II |
| Gilberta | `preparedBurst` | 3 | optional-пакет Bolt Rush | `+3`, если пакет выбран |
| Gilberta | `preparedBurst` | 5 | Argent Ultimate при Nature | `+?`, затем Crush/reset |
| Gilberta | `cakeHot` | 4 | Bolt Rush с неизвестным hot pre-state | `+?` |
| Gilberta | `cakeHot` | 7 | Argent Ultimate при Nature | `+?`, затем Crush/reset |
| Antal | `hyperElectric` | 11 | Bolt Rush #1 | `+4` |
| Antal | `hyperCorrosion` | 11 | Bolt Rush #2 после Corrosion | `+1` (с оговоркой о refresh/stronger effect) |
| Antal | `hyperAmp` | 7 | Bolt Rush #3 | `+2` |
| Antal | `hyperNature` | 5 | Argent Ultimate при Nature IV | `+4` **до** Crush, затем reset |

**Не отмечать:** обычный Darkness Cowed, Stars Shifted (только Electric Infliction), чужую Electrification от Liino, Gilberta Ultimate, Arts от Arcane, FS и recoveryNote (неверифицированный цикл). Отсутствие иконки на других действиях не означает, что на враге нет прежней Sunderization.

**UI:** отдельный sprite + `+N`/ `+?`, самостоятельный от Arts и Physical toggles; Full/Compact оба отображают, source и точное условие доступны через title/ARIA. Для E2E покрыты counts по stage, 320 px, offline PWA WebP и разделение команд. **Это не трекер суммарных стаков.** Для total 0–12 нужна модель lifetime, изменения/смерти цели, отсутствия или присутствия Sunderization перед боем, лимита 12, Liino delayed Electrification, chain detonation и Crush reset. Numeric `+N` не гарантирует, что столько реально войдёт в текущий capped total.
