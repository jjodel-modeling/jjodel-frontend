# Fase 2A · Card container (Properties + Tree come pannelli a card)

**Tipo:** refactor (UI, CSS + minimo TSX per gutter/handle)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Basato su:** `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md` (Parte A). **Leggilo prima**, in particolare A2.bis (rischi width-lock) e A3 (classi locali vs condivise).

> Rendere Properties e Tree come **card indipendenti** (angoli arrotondati, elevazione, inset) senza rompere resize/split/collapse. È il pezzo delicato per via del **width-lock**: 1 commit isolato con hard stop pesante. Restyle-only, nessun rename.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md`. Se qualcosa qui lo contraddice, **segnala e fermati**.
- **Tocca SOLO:** `frontend/src/components/editors/properties-with-tree-view.scss` e, **solo se** il gutter/handle richiedono JS, `frontend/src/components/editors/PropertiesWithTreeView.tsx`. Nessun altro file. Conferma il path dello SCSS leggendo la cartella.
- **NON toccare le classi globali rc-dock** (`.dock-panel`, `.dock-hbox`, `.dock-content`, `.dock-divider`, `.dock-tabpane`, ecc.): sono chrome di OGNI pannello dell'app. **NON rinominare** le classi locali (`.properties-with-tree-view`, `.properties-panel-container`, `.tree-view-panel-container`, `.properties-panel-resize-handle`, `.tree-view-panel-resize-handle`, `.collapsed-panel-toggle`).
- **Critical-zone:** la discovery (A5) conferma nessun import `useJjomSync`/`portDistribution` nella catena dock → **niente Layer Impact Report**.
- `git add <file specifici>`, mai `git add .` (WIP altrui nel tree). Commit convenzionale, EN, una riga. `npm run build` verde. Poi **HARD STOP**. Niente em dash.

## 0-bis. Vincoli ARCHITETTURALI (dalla discovery A2.bis, romperli = layout rotto)

- **Width-lock:** `--properties-tree-tab-width` (scritta su `document.body`, `PropertiesWithTreeView.tsx:257-280`) è la **somma esatta** delle width dei pannelli (+28 se uno collassato), e forza `.dock-hbox > .dock-panel:last-child` a quella larghezza (`style.scss:1119-1128`). **NON aggiungere margin/gap ESTERNO** attorno o fra i pannelli: allarga la larghezza reale oltre il lock e, con `overflow:hidden` su `.properties-with-tree-view` (`:34`), l'eccedenza viene **clippata**. La card si ottiene con **gutter/padding INTERNO**, ricavato dentro la larghezza esistente, non aggiungendo larghezza.
- **Ombre:** `overflow:hidden` (wrapper + i due container) **taglia le box-shadow ampie**. Usa un'ombra **soft e contenuta** (o `inset`), non un drop-shadow largo. Precedente da imitare: `.properties-tree-floating-cluster` (`:874-916`) è già `border-radius:8px; box-shadow:0 2px 8px`.
- **Collapse:** collassando, il container viene **smontato** e sostituito da `.collapsed-panel-toggle` (24x24). La costante `COLLAPSED_PANEL_TOGGLE_WIDTH = 28` (`:42-46`) è la margin-box del toggle e deve restare in sync con i margini SCSS (`:262-269`): se tocchi quei margini, aggiorna la costante o la width-math si desincronizza.

## 1. Obiettivo

I due pannelli (Properties a sinistra, Tree a destra, dentro `.properties-with-tree-view`) si leggono come **card bianche arrotondate su sfondo tenue**, con un piccolo gutter tra loro, senza rompere i due livelli di resize (esterno rc-dock e interno custom), il collapse singolo, e il caso entrambi collassati.

## 2. COME

- **Sfondo dietro le card:** su `.properties-with-tree-view` (`~:30`, locale) metti un background slate-100 tenue (es. `#eef1f5` o token neutro equivalente) e un **padding interno** (il gutter) che faccia da cornice attorno alle due card. Questo padding va **compensato** riducendo di altrettanto lo spazio contenuto, NON allargando la tab (vedi width-lock).
- **Le due card:** su `.properties-panel-container` (`~:47`) e `.tree-view-panel-container` (`~:327`): `background:#fff`, `border-radius` (~12px), hairline `border` (1px `#e2e8f0`), ombra **soft contenuta** (stile `.properties-tree-floating-cluster`). Il **gap fra le due card** si ottiene dentro la larghezza esistente (es. il gutter del wrapper + un piccolo margin interno che rientra nel budget di larghezza), mai aggiungendo width.
- **Resize handle:** riposiziona `.tree-view-panel-resize-handle` (`~:372`, `left:-3px`) e `.properties-panel-resize-handle` (`~:95`, `left:0`) così che restino **allineati alla giunzione/gutter** fra le due card e centrati nello spazio del gutter, non sospesi nel vuoto. Mantieni lo z-index relativo (handle Properties sopra il divider rc-dock, commento `:93-99`).
- **Header e overflow:** verifica che gli header dei pannelli e lo scroll interno restino coerenti col border-radius (angoli superiori arrotondati che non tagliano il contenuto).
- **Non toccare** i colori/stili delle righe del tree (`.tree-node__*`, `.tree-row*`), già fatti; qui solo il **container**.

## 3. Verifica visiva (HARD STOP, checklist pesante)

1. I due pannelli sono card bianche arrotondate su sfondo tenue; l'ombra c'è e **non è clippata** ai bordi.
2. **Resize interno** Properties↔Tree funziona, e gli handle sono allineati al gutter (non fluttuanti).
3. **Resize esterno** canvas↔tab funziona.
4. **Collapse Properties**, **collapse Tree**, **entrambi collassati** (cluster flottante di riapertura): tutti funzionano, nessun salto/disallineamento di larghezza.
5. Nessun overflow/clip del contenuto; la larghezza della tab non "salta" all'apertura/chiusura; hard-refresh pulito.
6. **Nessun altro pannello dell'app** (canvas, console, metadata) cambia aspetto: le classi rc-dock globali non sono state toccate.

## 4. Chiusura

- Dopo l'OK visivo: `git add` dei soli file toccati + commit `refactor(panels): render properties and tree as inset cards`. Aggiorna `docs/claude-code-log.md` con una entry. Riga finale `Nome del documento prompt: 2026-07-28 Fase 2A card container`.
- **Se per fare la card servisse toccare una classe rc-dock globale o cambiare la width-math:** fermati e segnala, non forzare. È il punto in cui la discovery diceva "gutter interno, non margin".

## 5. Riferimenti

- Discovery: `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md` (A1-A5, rischi #1-#6).
- Precedente card interno: `.properties-tree-floating-cluster` (`properties-with-tree-view.scss:874-916`).
- Tokens: slate `#334155`, sfondo tenue slate-100, cyan solo accent, no layout shift.
