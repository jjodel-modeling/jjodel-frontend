# 2026-08-28 21:55 — `--color-border-focus` deve essere slate in tutti i temi

Corsia veloce (RC-3): tre file del layer dei token piu' uno di componente, nessuno nella
critical zone. Nasce dalla ricaduta dichiarata al §2 del seguito di
`claude_2026-08-28_2010_prompt_resize_divider_grip_pill.md`.

## Richiesta (verbatim)

> `--color-border-focus` deve risolvere a slate in tutti i temi (slate-600 #475569 su chiaro,
> slate-400 #94a3b8 su scuro), mai a ciano — il ciano resta riservato a selezione canvas/drag.
> Correggi il token alla radice e verifica i sei fogli che lo usano per l'anello di focus; nessun
> cambio nei fogli se il token e' corretto.

## Lo stato di partenza, misurato

Il nome era dichiarato due volte, in disaccordo, e mai nel tema scuro:

| file | selettore | valore |
|---|---|---|
| `styles/tokens.css:122` | `:root` | `#06b6d4` (cyan-500) |
| `styles/tokens/_colors-light.scss:93` | `:root, :root[data-theme="light"]` | `$slate-500` `#64748b` |
| `styles/tokens/_colors-dark.scss` | — | **assente** |

Il ramo `:root[data-theme="light"]` vale (0,2,0) e batte `tokens.css`; il ramo `:root` nudo vale
(0,1,0) e pareggia, quindi perde per ordine nel bundle. Da cui, misurato sull'app in esecuzione:

```
data-theme come lo mette l'app: ASSENTE
(assente)  border-focus=#06b6d4   <-- CIANO
light      border-focus=#64748b
dark       border-focus=#06b6d4   <-- CIANO
```

La riga che conta e' la prima: **l'app non scrive `data-theme` al caricamento**, quindi lo stato
predefinito del prodotto e' uno dei due in cui vinceva il ciano. Non era un difetto del solo tema
scuro: era il difetto di default.

## La correzione, alla radice

1. `tokens.css` — dichiarazione ritirata. E' esattamente il ritiro per archi di D-UI-13, qui fuori
   turno e con una ragione in piu': le due dichiarazioni non erano ridondanti ma **in disaccordo**.
   Annotato nel commento di testata del file, dove gli archi sono gia' registrati.
2. `_colors-light.scss` — `$slate-500` → `$slate-600` (`#475569`), il grado chiesto. Cambia anche il
   chiaro, non solo lo scuro: l'anello era un grado piu' pallido di quanto deciso.
3. `_colors-dark.scss` — il nome viene aggiunto nella sezione BORDERS a `#94a3b8` (slate-400). La
   sua assenza era la causa vera per cui il ciano sopravviveva li'.

Dopo:

```
(assente)  border-focus=#475569
light      border-focus=#475569
dark       border-focus=#94a3b8
```

## I fogli consumatori: nessuno toccato

Nove regole in sei fogli leggono il token, e nessuna aveva bisogno di cambiare. Verificate tutte,
nei tre stati, con `scripts/smoke/_tmp_focusring.ts`: la sonda percorre il CSSOM del bundle vero,
trova le regole per `cssText` e rigioca ogni dichiarazione su un elemento sonda, leggendo il colore
che quella dichiarazione dipinge.

| foglio | regole |
|---|---|
| `Toast/toast.scss` | `.jj-toast__close`, `.jj-toast__action` |
| `viewParenting/viewParenting.scss` | `.jj-move-vp__open`, `.jj-move-vp__select` (`border-color`) |
| `editors/properties-with-tree-view.scss` | `.rail-structurebar` |
| `TreeViewSidebar/tree-view-sidebar.scss` | `.tree-scope-bar__action` |
| `import/ImportSummaryModal.scss` | `.import-summary-modal__close-btn`, `.import-summary-modal__btn` |
| `ResizeHandle/resize-handle.scss` | `.resize-handle` |

Esito: `rgb(71, 85, 105)` nei due stati chiari e `rgb(148, 163, 184)` in scuro, per tutte e nove,
zero ciano. Controllo positivo della sonda: 18015 regole percorse, 24 che nominano
`--color-panel-border` — una spazzata che non arrivasse a niente restituirebbe lo stesso silenzio.

## L'unico foglio toccato, e perche'

`ResizeHandle/resize-handle.scss` aveva il valore a mano — `var(--color-slate-600)` piu' un override
a slate-400 nella meta' scura — proprio perche' il token era ciano: e' la deroga dichiarata ieri
sera, con tanto di commento che spiegava di non usare il token. Con la radice sistemata la deroga non
ha piu' ragione, e un commento che dice il falso e' peggio di nessun commento: la regola torna su
`var(--color-border-focus)` e l'override scuro sparisce, perche' ora e' il token a salire di grado.
La sonda del divider rimisura le stesse due asserzioni di prima e le trova identiche — che e' la
prova che la sostituzione non cambia un pixel.

## Una trappola di metodo, per il prossimo

La prima versione della sonda cercava il token iterando le dichiarazioni della regola
(`for (const prop of style)`) e ha restituito **zero regole in tutti e tre i temi**. Non era un
risultato: `outline: 2px solid var(--color-border-focus)` e' una shorthand con sostituzione pendente
e non si enumera fra le longhand. La versione buona legge `cssText` e stampa il numero di regole
percorse. Senza il controllo positivo, quello zero sarebbe passato per «nessun consumatore ha
problemi».
