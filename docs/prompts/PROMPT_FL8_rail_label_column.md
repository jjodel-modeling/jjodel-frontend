# PROMPT — FL8: colonna etichetta fissa vs celle del packer (fix, PARALLELO)

Reperto STYLE1 (`discovery_2026-09-01_style1_tema_form.md` §7): nei preset a etichetta laterale (Compact, Dense) il rail a 400px produce 4 controlli sotto i 40px e 2 che sbordano dalla cella, il più stretto a **7.8px** — il select di `tint` esce vuoto, `visible` si legge «isible», gli stepper perdono il campo numerico. Comfortable/Sectioned (etichetta sopra): 0 e 0.

## Causa misurata

`irFormStyle.scss:1030`: colonna etichetta **fissa a 72px** su ogni `.ir-field`; il packer FL1 produce celle da 87.8px → al controllo restano 15.8px meno i gap.

## Cosa fare

Due leve, misura prima di scegliere (e dichiara la scelta nel referto):

- **(a)** colonna etichetta flessibile: floor ragionevole (es. `minmax(48px, 72px)` o `fit-content` con cap), etichetta con ellipsis + `title`; il controllo ha priorità sullo spazio.
- **(b)** fallback di placement: sotto una soglia di larghezza cella, il campo passa a etichetta sopra anche nei preset `left` (è un cambio di comportamento del tema — se la scegli, la soglia va derivata dalla width_map FL1, non inventata).

Preferenza dichiarata: (a) se da sola porta il minimo controllo sopra i 40px a rail 400px; (b) solo se (a) non basta, e allora (a)+(b).

## Accettazione

- Rail 400px, soggetto `allNine_valued` (14 campi / 3 gruppi / 7 righe): nei 4 preset, zero controlli < 40px e zero overflow dalla cella (riusa il criterio della sonda STYLE1, caselle di spunta escluse — errore di strumento già noto).
- Comfortable/Sectioned: DOM identico al before (la leva non deve toccare i preset a etichetta sopra).
- Geometria invariata: il tema continua a non muovere un campo.

## Fuori scope

Il picker del tema (STYLE2, seriale dopo questa), `layout.ts`/`themes.ts`/width_map, il manager.

## Coordinamento

Parallelo alla chiusura 10j: perimetro `irFormStyle.scss` (+ test). Nota da DS3: `&__draft-label` vive in `instanceManagerTab.scss`, NON qui — non toccarlo. Pathspec, entry di log in commit separato. Sonda before/after con screenshot dei 4 preset nel referto.
