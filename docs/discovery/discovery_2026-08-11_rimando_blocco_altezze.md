# Discovery — passo 4 dell'arco 1: rimando al blocco delle tre altezze

**Data**: 2026-08-11 · **Fase**: A del passo 4 (restyle del tree pane) · **HEAD**: `abe5fdc8b`

## 0. Obiettivo

Localizzare il foglio del rail e la riga esatta del blocco di commento che documenta le tre
altezze letterali (R-RAIL-9), per scrivere il rimando di una riga accanto al `height: 26px`
di `.tree-row` in `tree-view-sidebar.scss`. In più: verificare le quattro ancore di §2 del
prompt e risolvere la condizione `height` / `min-height`.

## 1. File letti

- `frontend/src/components/editors/properties-with-tree-view.scss` (1448 righe) — foglio del rail
- `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (2053 righe) — unico file da modificare
- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — sola lettura, `:629`
- `frontend/src/styles/tokens/index.scss` `:60` · `_typography.scss` `:16`, `:125` · `style.scss` `:320`
- `frontend/index.html` `:8-11`
- `docs/decisions.md` (R-RAIL-6, R-RAIL-7) · `docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md` §8

## 2. Findings

### 2.1 Foglio del rail e blocco delle tre altezze

`frontend/src/components/editors/properties-with-tree-view.scss`, unico `.scss` elencato sia
da `git show --stat bcc68da8f` sia da `git show --stat 9808a812d`.

Blocco di commento in testa al foglio, **righe 4-36**, titolato `LITERAL px IN THE RAIL'S NEW
CODE (arc 1, 2026-08-10)`. La clausola (a), quella di R-RAIL-9, comincia a `:9`. Candidato
unico: nessun altro blocco del foglio enumera le tre altezze.

| Riga | Valore | Destinazione |
|---|---|---|
| `:14` | 44px | rail header, dichiarata nello stesso foglio a `:1388` |
| `:15` | 26px | tree row — assegnata da questo arco a `tree-view-sidebar.scss` (R-RAIL-7) |
| `:17` | 28px | multiplicity segmented control, non usata nell'arco 1 |

Riga scelta per il rimando: **`:15`**, quella del 26px. Forma modellata sul precedente già
nel foglio a `:1388` (`height: 44px;   // literal by R-RAIL-9 — see the block at the top of this file`).

### 2.2 Le quattro ancore di §2 — confermate tutte

| # | Selettore | Riga | Stato a HEAD |
|---|---|---|---|
| 1 | `.tree-feature__type` | `:1907` | `font-size: 11px`, `color: var(--color-text-tertiary)`, nessun `font-family` |
| 2 | `.tree-row` | `:1699` | nessuna altezza, `padding-top/bottom: 4px` |
| 3 | `.tree-row__name` | `:1765` | `font-size: 11px`, peso non dichiarato |
| 4 | stato selezionato | `:1740` | solo `&--selected::before` con `var(--color-selection-bg)` |

Divergenza di forma sul 4: non esiste un blocco `.tree-row--selected { }`. Il peso va scritto
come discendente — `&--selected .tree-row__name`, specificità `(0,2,0)`, che batte lo `(0,1,0)`
di `.tree-row__name` senza `!important`. Dentro `&--selected` non si può scrivere `&__name`
(compilerebbe `.tree-row--selected__name`).

### 2.3 `height`, non `min-height`

`.tree-row__name` `:1768-1770` dichiara `white-space: nowrap`, `overflow: hidden`,
`text-overflow: ellipsis`: il nome **non manda a capo**. Regola quindi `height: 26px`.
`tokens/index.scss:60` dichiara `* { box-sizing: border-box }`, quindi i 26px includono gli
8px di padding verticale (content box 18px): il padding non va toccato e il caso di §6.4 del
prompt non si presenta.

## 3. Dipendenze e rischi

- **`--font-mono` risolve in fallback.** Vale `'IBM Plex Mono', 'Monaco', …` (`_typography.scss:16`),
  ma IBM Plex Mono non è caricato: nessun `@font-face`, nessuna dipendenza, e l'unico webfont
  di `index.html:11` è JetBrains Mono per Monaco editor. Su macOS il computed cadrà su Monaco.
  Monospace lo è, ma la DoD C5.3 di R-RAIL-5 («non un fallback di sistema») resta soddisfatta
  solo in parte. Punti di confronto per la verifica visiva: `.text-mono` (`_typography.scss:125`)
  e i blocchi `pre/code` di `style.scss:320`, che renderanno identici.
- **R-RAIL-15 pulita a baseline**: il foglio del rail non contiene alcun selettore `tree-row`
  o `tree-feature`. Nessun override di specificità da smontare.
- `color: var(--color-text-tertiary)` a `:1909` è in lista nera R-RAIL-6 ma preesistente:
  si riferisce, non si corregge (R-RAIL-19).

## 4. Domande aperte per Alfonso

- **Sciolta**: le quattro grep di R-RAIL-19 non sono recuperabili da `docs/decisions.md` (la
  voce non c'è: presenti 1-13, 16, 18, 22-26) né dal log (i passi 2 e 3 non hanno entry, per la
  deroga che rimanda la scrittura al passo 5). La ratifica dell'11 agosto ne fissa **cinque**,
  sul diff staged. Resta da iscrivere R-RAIL-19 in `docs/decisions.md`, fuori dallo scope del passo 4.
- La DoD §7 sul font va letta come soddisfatta in fallback, salvo decidere di caricare IBM Plex
  Mono — fuori scope qui.
