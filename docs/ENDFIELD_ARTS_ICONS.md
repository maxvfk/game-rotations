# Endfield — игровой каталог Arts Infliction и Arts Reaction

> Этап 01 (2026-11-04): **подготовка иконок и их источников**. Ротации Maygi/Prydwen и их отображение пока не меняются.

## Визуальная таблица Arts Infliction (оригинальные кольца)

Все четыре сектора уже входят в **исходные игровые PNG**, поэтому отдельный SVG для рисования этих конкретных 1–4 стаков пока не нужен. Это открытие уточняет предыдущий план. На следующем этапе стоит сравнить использование готовых игровых PNG с универсальным SVG на мобильном экране.

| Элемент | 1 стек | 2 стака | 3 стака | 4 стака |
| --- | :---: | :---: | :---: | :---: |
| **Heat** | <img src="../public/arts/arknights-endfield/inflictions/heat-1.png" width="60" height="60" alt="Heat 1 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/heat-2.png" width="60" height="60" alt="Heat 2 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/heat-3.png" width="60" height="60" alt="Heat 3 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/heat-4.png" width="60" height="60" alt="Heat 4 stack(s)"> |
| **Electric** | <img src="../public/arts/arknights-endfield/inflictions/electric-1.png" width="60" height="60" alt="Electric 1 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/electric-2.png" width="60" height="60" alt="Electric 2 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/electric-3.png" width="60" height="60" alt="Electric 3 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/electric-4.png" width="60" height="60" alt="Electric 4 stack(s)"> |
| **Cryo** | <img src="../public/arts/arknights-endfield/inflictions/cryo-1.png" width="60" height="60" alt="Cryo 1 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/cryo-2.png" width="60" height="60" alt="Cryo 2 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/cryo-3.png" width="60" height="60" alt="Cryo 3 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/cryo-4.png" width="60" height="60" alt="Cryo 4 stack(s)"> |
| **Nature** | <img src="../public/arts/arknights-endfield/inflictions/nature-1.png" width="60" height="60" alt="Nature 1 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/nature-2.png" width="60" height="60" alt="Nature 2 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/nature-3.png" width="60" height="60" alt="Nature 3 stack(s)"> | <img src="../public/arts/arknights-endfield/inflictions/nature-4.png" width="60" height="60" alt="Nature 4 stack(s)"> |

**Важно:** это варианты отображения *количества стаков* Arts Infliction. Они не показывают результат реакции после поглощения. Нулевой и неизвестный стек не имеют отдельных PNG — UI должен показывать отсутствие значка либо неизвестность, а не подменять их картинкой с одним сектором.

## Arts Reaction — отдельные игровые значки

| Реакция | Значок |
| --- | :---: |
| **Combustion** | <img src="../public/arts/arknights-endfield/reactions/combustion.png" width="54" height="54" alt="Combustion"> |
| **Electrification** | <img src="../public/arts/arknights-endfield/reactions/electrification.png" width="54" height="54" alt="Electrification"> |
| **Solidification** | <img src="../public/arts/arknights-endfield/reactions/solidification.png" width="54" height="54" alt="Solidification"> |
| **Corrosion** | <img src="../public/arts/arknights-endfield/reactions/corrosion.png" width="54" height="54" alt="Corrosion"> |

Уровни реакций **I–IV** не нарисованы внутри PNG; их правильнее добавлять отдельной текстовой меткой на следующем этапе. Не следует смешивать уровень реакции и количество стаков Infliction.

## Структура каталога

- `data/arts/arknights-endfield.json` — восемь типизированных записей, 20 изображений, происхождение и полные SHA-256.
- `public/arts/arknights-endfield/inflictions/{heat,electric,cryo,nature}-{1,2,3,4}.png` — 16 оригинальных 125×125 RGBA PNG.
- `public/arts/arknights-endfield/reactions/{combustion,electrification,solidification,corrosion}.png` — 4 оригинальных RGBA PNG (три 72×72 и Electrification 73×72).
- `scripts/validate-endfield-arts.mjs` — проверка точных имён, типов, числа стаков, размеров, SHA-256 и Git blob SHA-1 исходных файлов.

## Provenance / rights

Сохранены **без изменения байтов** оригинальные игровые спрайты из открытого зеркала [SlowMoSlothy/Arknights-Endfield-Rotation-Tool](https://github.com/SlowMoSlothy/Arknights-Endfield-Rotation-Tool/tree/2eb9b304cdd2dc9e639d38861eaa7987f762db62/endfield/assets/ui/debuffs) (pin `2eb9b304cdd2dc9e639d38861eaa7987f762db62`). Зеркало документирует извлечение оригинальных PNG из Endfield assets по адресу `https://endfield-assets.fffdan.com/vfs/Bundle/file/assets/beyond/dynamicassets/gameplay/ui/sprites/bufficon/` на 2026-11-03; см. [effect-icons.md](https://github.com/SlowMoSlothy/Arknights-Endfield-Rotation-Tool/blob/2eb9b304cdd2dc9e639d38861eaa7987f762db62/docs/effect-icons.md).

В [JSON-реестре](../data/arts/arknights-endfield.json) для каждого файла записаны `sourcePath`, исходный Git blob SHA-1 и SHA-256 локального PNG. Все изображения принадлежат правообладателям Arknights: Endfield; лицензия кода стороннего репозитория **не распространяется автоматически на игровой арт**. Размещены только небольшие изображения для неофициального визуального справочника, без перепаковки остальной игровой графики.

Справочные определения типов и статусов сверены с [Endfield Talos Wiki — Arts Infliction](https://endfield.wiki.gg/wiki/Arts_Infliction) и [Arts Reaction](https://endfield.wiki.gg/wiki/Arts_Reaction). Эти ссылки подтверждают *названия и типы*, а не оптимальность какой-либо боевой ротации.

## Проверка

```bash
node scripts/validate-endfield-arts.mjs
npm run validate:portraits
npm run build
```

**Следующий шаг:** визуальный компонент, выбирающий 1–4 игровой PNG по типу Infliction, и отдельная реакция с уровнем I–IV. Только затем — stage metadata `artsCheckpoints` с явной степенью достоверности (цель/подтверждено/неизвестно). Никаких предполагаемых стаков или уровней автоматически по порядку кнопок.


## Этап 02: интерактивный просмотрщик

Готова [отдельная страница Arts-индикаторов](https://maxvfk.github.io/game-rotations/?arts=arknights-endfield). Она позволяет в реальном UI выбрать размер 24/28/32 px, Infliction 1–4 стаков и Reaction с уровнем I–IV, проверить неизвестные состояния и PWA offline. [API и критерии](ENDFIELD_ARTS_INDICATORS.md). Игровые исходники 20 PNG не менялись, ротации ещё не аннотированы.
