# Sunderization — action-local индикаторы Endfield

**19.11.2026:** первоначальный [PR #40](https://github.com/maxvfk/game-rotations/pull/40) проверил единственный оригинальный game-native индикатор. Теперь он расширен на **все известные точки применения Sunderization в опубликованных ротациях Argent Flow**.

## Asset и источник

Game buff `buff_chr_0037_minghe_thundertrigger`: [BuffData](https://github.com/rmxlinux/EndfieldData/blob/main/Json/BuffData/buff_chr_0037_minghe_thundertrigger.json), `hasIcon:true`, sprite `icon_battle_buff_minghe_thundertrigger`; [Endaxis generated](https://github.com/Lieyuan621/Endaxis/blob/main/src/data/operators/minghe.generated.ts) `effects.name.sunderization`. Точные исходные WebP-байты из [Endaxis](https://github.com/Lieyuan621/Endaxis/blob/main/public/icons/icon_battle_buff_minghe_thundertrigger.webp), blob `efbb65ba047976046ca0fcd11297a713198eccb6`, локальная копия `public/effects/arknights-endfield/sunderization.webp`.

## Семантика

`action.sunderization` — discriminated union:
- `{gain:1..4,assessment:"conditional",condition,source}` — **условный прирост**, не total.
- `{event:"detonation",assessment:"conditional",condition,source}` — **событие Crush / Detonation**, не фиктивное число списанных стаков.

Gilberta/Liino: `coldBuildup[5] +3`, `buildupRepeat[5] +3`, `preparedBurst[3] +3` (опциональный пакет), `preparedBurst[5] Detonation`, `cakeHot[4] +3`, `cakeHot[7] Detonation`.

Antal/Liino: `hyperElectric[11] +4`, `hyperCorrosion[11] +1` (**слабый статус может не обновить сильный, не проверено**), `hyperAmp[7] +2`, `hyperNature[5] Detonation`. Это интерпретация существующей экспериментальной ротации, **не наблюдение в combat log**.

Индикатор — оригинальная иконка 24×24, подпись `+N` или `Detonation`, tooltip/ARIA с точным условием; независим от Arts toggle и виден в Full/Compact/offline. **Не моделируется** total 0–12, время жизни 60 s, reset/refresh, перенос между целями, фактическое срабатывание в игре. Отсутствие иконки у другого действия не означает отсутствия Sunderization на цели.
