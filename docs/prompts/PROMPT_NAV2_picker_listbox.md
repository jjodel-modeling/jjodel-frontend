# PROMPT — NAV2: picker delle sintassi come listbox custom (SERIALE dopo NAV1, stesso perimetro)

Decisione (01-09, mock su board Manager Admin Form Bottom.dc.html + screenshot): il `<select>` nativo di Toolbar.tsx:620 diventa un dropdown custom con icone e voce selezionata evidenziata. Il mock è normativo: trigger bianco bordo cyan con occhio + label + chevron; pannello radius 8, ombra `--shadow-desk-card` (o il ruolo dropdown se il DS ne dichiara uno); voci con icona a sinistra (bi-diagram-3 Abstract syntax, icona viewpoint per le sintassi concrete, bi-table Data manager); selezionata = fondo #ecfeff, testo #0e7490, barra inset 3px #0891b2, check bi-check-lg a destra — la grammatica di selezione cyan già ratificata.

Vincoli:
- La LOGICA di NAV1 non si tocca: stesso vocabolario (sentinella `@data-manager` fuori da `state.viewpoint`), stesso `handleViewpointChange`, stessa convergenza sul tab. Solo la superficie cambia.
- Accessibilità: il select nativo dava keyboard/screen-reader gratis — il custom deve pareggiare: role listbox/option, aria-selected, frecce+Enter+Esc, focus ring 3px del DS. Se nel repo esiste già un dropdown custom (grep prima: il pannello Columns di 10i è il precedente più vicino), riusane il pattern, non inventarne un terzo.
- Clip: il pannello non deve farsi tosare dalla toolbar (la trappola del pannello Columns, stesso giro) — portale o fixed se serve.
- Separatore: nel custom puoi avere un vero separatore visivo (hairline) al posto della `<option disabled>` di NAV1 — rimuovila.

Verifica: sonda con pannello aperto (elementFromPoint sull'ultima voce — trappola rc-dock nota), tastiera end-to-end, non-regressione delle 17 asserzioni NAV1 (rimappate sul controllo nuovo, dichiarando quali cambiano di selettore), screenshot vs mock nel referto.

Coordinamento: Toolbar.tsx + foglio suo; NON i file del manager (contesi da 10k-chiusura/7b). Pathspec; log per pathspec esplicito.

---

**Referto**: `docs/discovery/discovery_2026-09-01_nav2_picker_listbox.md`.
