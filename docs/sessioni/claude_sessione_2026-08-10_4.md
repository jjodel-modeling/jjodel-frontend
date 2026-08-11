# Sessione 2026-08-10 (quarta) — Arco 1 del rail: passi 0, 1, 2, 2-bis, 3

> Questo file sostituisce `sessione_CORRENTE.md` nel Project Knowledge.
> È scritto per essere autosufficiente: da qui si scrive il prompt del passo 4 senza
> rileggere altro. La coda della sessione ha sconfinato nella notation `2026-08-11` nei nomi
> dei prompt; il lavoro è tutto della stessa sessione.

---

## Stato a fine sessione

**Branch**: `alfonso-frontend-jjtl`. **Nulla pushato**: la branch è avanti su origin di tutti i
commit di Fase 0 e dell'arco.

**Arco 1 riperimetrato.** Consegna **guscio + slot + restyle del tree**. Il renderer
dell'elemento di metamodello è passato all'arco 2 (R-RAIL-26, che emenda R-RAIL-1).

**Commit della sessione**, in ordine:

| SHA | Contenuto |
|---|---|
| `4d215ff0e` | C9.1, otto token entity (sessione precedente, antenato) |
| `10dc25879` | rotazione del log, HEAD a inizio arco |
| `e4cef2b24` | `docs:` report di ancoraggio del passo 0 |
| `1eb008937` | `docs:` registro R-RAIL-1..22 + nota U-2 |
| `bcc68da8f` | guscio (passo 2). **Contiene la postura Browse/Focus poi ritirata**: è da qui che l'arco 2 la recupera |
| *(sha non riportato)* | `docs:` R-RAIL-23 |
| `77e2bb6a6` | `refactor:` ritiro della postura (passo 2-bis) |
| `9808a812d` | `feat:` sezione NODE come disclosure (passo 3, commit 2) |
| *(sha non riportato)* | `fix:` NODE chiusa di default + `docs:` R-RAIL-24..26 |

**Gate**: build exit 0, typecheck **33** (baseline, Δ0), `check:docs` 2/2, working tree pulito.
Le quattro grep di R-RAIL-19 sul diff: zero.

**Verifica visiva di Alfonso**: passata su tutti i punti dopo il passo 2-bis e dopo il passo 3.

**Non fatto**: passo 4 (restyle del tree), passo 5 (conformità, entry di log, rotazione),
push della branch.

---

## Le ventisei ratifiche

Registrate in `docs/decisions.md`. Forma condensata, una riga ciascuna.

| # | Contenuto |
|---|---|
| R-RAIL-1 | Il rail è un guscio, l'inspector è uno slot polimorfo. C1.1 authoring intoccabili; C1.2 identity block calcolabile anche per una view, altrimenti opzionale. **Emendata da R-RAIL-26** |
| R-RAIL-2 | U-2 superato solo nella parte **posizionale** del breadcrumb; il breadcrumb «Applies to» è semantica di view e sopravvive |
| R-RAIL-3 | Solo preset `2a`. C3.1 niente gear/popover/chiave di storage; C3.2 parametrico senza rami morti (`RailPreset` + `PRESET_2A`); C3.3 il segmented Basic/Advanced resta in top bar |
| R-RAIL-4 | Cyan di selezione dai token, mai letterali; nessuna unificazione col sky, i tre cyan restano distinti |
| R-RAIL-5 | `var(--font-sans)` / `var(--font-mono)`, mai nomi di famiglia. C5.2 **annullato** (font già caricati, `_typography.scss:81,84`). C5.3 DoD col font che rende davvero |
| R-RAIL-6 | Lista nera di 13 nomi divergenti fra i due sistemi di token |
| R-RAIL-7 | Il tree riusa `TreeViewContent`; solo quattro valori di restyle. Rinviati: badge lettera, filtro appiattente, conteggio totale, indent. C7.1 `TreeViewSidebar.tsx` morto, a backlog |
| R-RAIL-8 | Niente barra di selezione: pill esistente + peso 600. `#0891B2` triplo ruolo resta inerte |
| R-RAIL-9 | Tre altezze letterali in blocco di commento; quattro coppie entity → token (C9.1, `4d215ff0e`) |
| R-RAIL-10 | I 14 `snap` vanno al gradino vicino, **si emenda il design**. Eccezioni: `letter-spacing: 0.08em` letterale; quattro ombre composte a mano, mai `var(--shadow-*)` |
| R-RAIL-11 | Sopravvivono `jjodel_property_panel_visible` e `jjodel_property_overlay_width` (min 360). Intoccabili `jjodel_treeview_visible` e `TreeViewPanelContext`. Spariscono `cardMaximized`, i due `toggleMaximize*`, splitter, i due `CollapsedPanelToggle`. `--jj-canvas-right-inset` resta il contratto |
| R-RAIL-12 | NODE resta nel guscio, gated `advanced`, restilata come disclosure. **Principio generale: l'arco 1 non cambia *quando* le cose compaiono** |
| R-RAIL-13 | Il rail legge solo Redux `state.advanced`; nessun consumatore nuovo di `useInterfaceMode` |
| R-RAIL-14 | Postura Browse/Focus **fuori dall'arco 1** (per R-RAIL-12). `PRESET_2A` codifica solo geometria. Tree 392px quando entrambi i pane sono montati; altezza intera al pane superstite; nessuna altezza trascinabile |
| R-RAIL-15 | Il restyle del tree si scrive in `tree-view-sidebar.scss` (ampliamento di scope dichiarato). Vietati gli override di specificità dal foglio del rail |
| R-RAIL-16 | Identity block = `PropertiesHeader`, restilato in loco nel ramo model element; niente blocco nel guscio; **niente chip di firma**. **Superata per l'arco 1 da R-RAIL-26** |
| R-RAIL-17 | Default larghezza **400** (già a codice); `MIN_OVERLAY_WIDTH` da 320 a **360** |
| R-RAIL-18 | Header unico: si riusa quello della card PROPERTIES; l'header del tree diventa label di sezione senza azioni; pin e HelpButton restano dove sono; **footer fuori arco** |
| R-RAIL-19 | Le grep di conformità girano sul **diff staged**; le occorrenze preesistenti si riferiscono, non si correggono |
| R-RAIL-20 | Il report di discovery si committa a sé, prima del passo di registro |
| R-RAIL-21 | `jjodel_property_tree_height`: sparisce il codice, **resta il dato** nei `localStorage`; nessun cleanup, annotazione in log |
| R-RAIL-22 | L'espressione di `overlayShown` non si tocca; il guscio si monta sulla condizione di oggi; i due pane si rendono ciascuno sulla propria visibilità |
| R-RAIL-23 | Il controllo di collasso chiude **solo l'inspector**; il rail non scrive mai `jjodel_treeview_visible`; con entrambi i pane nascosti subentra la pill esistente |
| R-RAIL-24 | La disclosure NODE resta **chiusa di default**: oggi `nodeOpen` parte a `false` |
| R-RAIL-25 | La palette del badge **non si migra**; `_form-system.scss` resta intoccabile; i token C9.1 restano a zero consumatori nel pannello |
| R-RAIL-26 | Il restyle dell'identity block va **all'arco 2**; emenda R-RAIL-1 |

---

## Prossimi passi

### 1. Passo 4 — restyle del tree (tutto ciò che serve è qui sotto)

**File unico**: `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (2053 righe).
Ampliamento di scope dichiarato da R-RAIL-15, da riportare nell'entry di log.

**Consumatore vivo unico**: `PropertiesWithTreeView.tsx:11` importa il foglio.
`TreeViewSidebar.tsx` è morto (unica menzione fuori dalla sua directory: un **commento** in
`Dock.tsx:281`). `TreeViewContent.tsx` **non importa alcun foglio**.

**I quattro valori di R-RAIL-7:**

| Valore | Selettore | Ancora | Stato oggi |
|---|---|---|---|
| suffisso di tipo in `var(--font-mono)` | `.tree-feature__type` | `:1907-1915` | `font-size: 11px`, **nessun `font-family`** |
| riga 26px | `.tree-row` | `:1699-1710` | nessuna altezza, `padding` verticale 4px |
| nome 13px, peso 500 | `.tree-row__name` | `:1765-1775` | `font-size: 11px`, peso non dichiarato |
| peso 600 sul selezionato | `.tree-row--selected` | `:1740-1750` | solo la pill `::before` con `var(--color-selection-bg)` |

**Vincoli:**

- nessuna rinomina di classe; le variabili `$` locali a `:5-41` non si toccano e non si migrano
  a token (ne risulta una convivenza dei due stili nel file: è il prezzo del riuso);
- `color: var(--color-text-tertiary)` a `:1909` è **in lista nera ma preesistente**: resta
  com'è, il passo 4 aggiunge `font-family` allo stesso blocco (R-RAIL-19);
- il blocco di commento delle tre altezze resta punto unico nel foglio del rail; accanto al
  26px va **una riga** di rimando;
- altezza: `height: 26px` **solo se** il nome non manda a capo oggi; altrimenti
  `min-height: 26px`. Non cambiare il troncamento esistente;
- niente barra di selezione (R-RAIL-8), niente badge lettera, niente glifi;
- grep di R-RAIL-19 sul diff staged.

**Dove rendono i valori** (per la verifica visiva): suffisso di feature a
`TreeViewContent.tsx:765`, suffisso di istanza a `:720`, nome a `:654` (e `:1470`, `:1479` per
rule e helper JjTL).

Commit: `feat: restyle tree pane rows in properties rail`. Hard stop, verifica visiva.

### 2. Passo 5 — conformità e chiusura

Grep di R-RAIL-19 sul diff. Gate: build 0, typecheck 33 Δ0, `check:docs` 2/2.

**Entry in `docs/claude-code-log.md`**, che deve riportare:

- l'ampliamento di scope su `tree-view-sidebar.scss`;
- i **92 letterali esadecimali** preesistenti nel foglio del rail e l'unica occorrenza di lista
  nera a `:735` (dentro un commento);
- `jjodel_property_tree_height` fra le chiavi rese inerti e **non rimosse**;
- `attentionPulse` rimosso perché privo di superficie dopo il ritiro dei `CollapsedPanelToggle`;
- la postura costruita in `bcc68da8f` e ritirata al passo 2-bis, fuori scopo per R-RAIL-14;
- il commit 1 del passo 3 **non eseguito**, con le due condizioni di stop;
- il meccanismo reale di colorazione del badge (vedi «Info strutturali»);
- `--color-slate-400` sul caret: palette grezza, non segue il tema, debito per il dark mode.

Il log è a 20 entry: l'aggiunta ne richiede la rotazione di una nello stesso commit.

### 3. Push della branch

### 4. Arco 2 — perimetro già noto

Identity block nel guscio; decisione sulla palette entity; chip di firma; padding
`4px 14px 18px` del form body sotto modificatore (non applicabile oggi perché
`.properties-panel-body` ospita anche il ramo view); postura Browse/Focus, Focus bar, stepper
fratelli, breadcrumb posizionale.

**Vincolo che sopravvive per gli stepper**: l'ordine dei fratelli è quello **reso** da
`TreeViewContent`; ricostruirlo altrove duplica il modello contro R-RAIL-7.

---

## Bug nuovi e voci di backlog aperte in questa sessione

| Voce | Priorità |
|---|---|
| **Unificazione delle palette entity pannello/tree.** Il pannello colora i badge da `_form-system.scss:1251-1259`, il tree da `common/entityMeta.ts` (tokenizzato in C9.1). In light nessuno dei quattro kind coincide e **attribute ed enum sono invertiti**. Decisione di design con raggio d'azione sull'app, non migrazione di sorgente | media |
| `--color-slate-400` sul caret della disclosure NODE: palette grezza, non segue il tema. Da riprendere col dark mode (Q-A2) | bassa |
| `jjodel_property_tree_height` inerte nei `localStorage` degli utenti, non purgata per scelta (R-RAIL-21) | bassa |

Restano aperte dalle sessioni precedenti: `TreeViewSidebar.tsx` (249 righe morte); i rami
`mode === 'tab'` irraggiungibili più due chiavi inerti (`jjodel_property_tree_view_width`,
`jjodel_property_panel_width`); colocation di `InfoTooltip`; audit di `decisions.md`;
migrazione di `contesto_progetto.md` in `docs/`.

---

## Info strutturali scoperte

**Path.** Tutto il rail sta in `frontend/src/components/editors/`. `components/panels/` **non
esiste** (era un errore dei primi prompt).

**`Info.tsx`** (1415 righe, non toccato dall'arco: le ancore reggono).

- `:847-874` `getElementTypeInfo` — restituisce **solo un nome di classe** (`badgeClass`), non
  colori;
- `:877-903` `PropertiesHeader` — badge + nome + kind, reso a `:1284`. **Nessun chip di firma**;
- `:1172-1235` dispatch; gate sulla view a `:1174`; **`return` anticipato a `:1186-1205`**:
  header, breadcrumb e overview del ramo model element **non sono mai resi per una view**;
- `:1211-1235` `switch (ddata?.className)`, dodici casi + `default: <Empty/>`.

**Colori del badge.** `_form-system.scss:1251-1259`, nove modificatori `.jj-type-badge--*` con
esadecimali inline. Il foglio è importato globalmente da `styles/style.scss:2` ed è **già stato
dichiarato intoccabile** da un task precedente (`nestedView.scss:3658`). Consumatore vivo oltre
a `Info`: `ViewData.tsx:221`.

| kind | badge pannello (light) | token C9.1 |
|---|---|---|
| attribute | `#fef3c7 / #92400e` ambra | `#D1FAE5 / #059669` smeraldo |
| reference | `#fce7f3 / #9d174d` rosa | `#CFFAFE / #0891B2` ciano |
| operation | `#ede9fe / #6d28d9` viola | `#E0E7FF / #4F46E5` indaco |
| enum | `#d1fae5 / #065f46` smeraldo | `#FEF3C7 / #D97706` ambra |

Attribute ed enum sono **invertiti**: l'ambra che nel pannello significa «attributo» è il token
di `enum`, e viceversa.

**`props-header`.** `.props-header`, `__icon`, `__name` stanno in
`editors/info-improvements.scss:865-901` e sono **condivise col ramo view**, che monta
`props-header props-header--view` ereditando la base (`nestedView.scss:3655`, `:3688`).

**Token.**

- entity di C9.1: `_colors-light.scss:342-349`, `_colors-dark.scss:249-256` (dark: alpha 0.15 e
  shade-400, divergenza deliberata). **Zero consumatori**;
- selezione: `--color-selection-bg` `_colors-light.scss:360` / `_colors-dark.scss:264`, due
  consumatori (`tree-view-sidebar.scss:1741`, `:1749`); `--color-selection-bar` `:361` / `:265`,
  **zero consumatori**;
- `--shadow-*` sono **18 nomi**, non 4; `tokens.css:194-199` ne ridefinisce quattro con la scala
  Tailwind;
- colori per comporre le ombre a mano: `--color-accent-subtle` `rgba(51,65,85,0.06)`
  (`_colors-light.scss:124`), `--color-node-shadow` `rgba(15,23,42,0.06)` (`:218`);
- `--input-height-sm` vale **32px** in entrambi i sistemi e non è ridefinito in
  `variables.scss`. `--input-height` invece **sì**: `variables.scss` è dichiarato su `body` e per
  ereditarietà batte i `:root`, quindi vale 36px e non i 40px di `_spacing.scss`. **Misurare il
  computed, non leggere il nome.**

**`--jj-canvas-right-inset`.** Scrittore unico in `PropertiesWithTreeView.tsx` (ancora di riga
stale dopo il passo 2), valore `overlayWidth + 8` su `document.body.style` quando
`(activeEditorType === 'model' || 'metamodel') && (showPropertiesPanel || showTreePanel)`,
`0px` altrimenti. Il `+8` è il gutter. Lettori: `viewportInset.ts:14` e `:29-34`,
`EditorV2.tsx:3853`.

**Altro.** `state._lastSelected {node, view, modelElement}` è sorgente unica; **non esiste** un
concetto di «elemento a fuoco» distinto da «selezionato». `irTypes.ts:143` `kind`, `:145`
`metaclasses` (Row/Edge a `:168`, `:210`, `:252`). `.properties-tree-overlay` è a `z-index: 900`,
sopra il pavimento di 200 dell'invariante dell'editor classico.

**Ancore stale**: tutte quelle su `PropertiesWithTreeView.tsx` rilevate prima del passo 2. Il
file è stato riscritto: rilocalizzare per simbolo.

---

## Prompt generati per Claude Code

| Prompt | Esito |
|---|---|
| `2026-08-10 21:30` implementazione arco 1 | ✅ eseguito, con due emendamenti |
| `2026-08-10 22:30` emendamento 1 rev 1 | ❌ **ritirato**, mai consegnato: due ratifiche sbagliate |
| `2026-08-10 23:30` emendamento 1 rev 2 | ✅ in vigore |
| `2026-08-10 23:45` passo 2-bis, ritiro postura | ✅ eseguito |
| `2026-08-10 23:59` passo 3 | ⚠️ parziale: commit 2 eseguito, commit 1 fermato su due stop corretti |
| `2026-08-11 00:20` passo 3, chiusura | ✅ eseguito |

Da scrivere: passo 4, passo 5, push.

---

## Regole di protocollo emerse (da portare in `PROTOCOL.md`)

1. **Nessuna ratifica su un report letto a metà.** Se il testo arriva mutilo o troncato, la
   risposta giusta è chiederlo, non ricostruirlo. Un report ricostruito a memoria è la stessa
   famiglia di errore del context drift: uno stato che sembra verificato e non lo è. In questa
   sessione ha prodotto due ratifiche sbagliate (rev 1 dell'emendamento).
2. **L'esclusione viaggia con la fonte.** Quando un passo prescrive la lettura di un documento
   di design, l'elenco delle feature ratificate **fuori** va inline nel punto della lettura, non
   solo nella sezione delle ratifiche. Al passo 2 il divieto era scritto ma stava lontano dalla
   lettura che lo contraddiceva, e la postura è entrata nel diff. Al passo 3, con l'elenco
   inline, non è successo.
3. **Un passo la cui specifica dipende da una decisione non presa va dichiarato come domanda in
   Fase 0, non come lavoro nel build order.** Il renderer dell'elemento di metamodello è stato
   descritto come lavoro; le tre decisioni che gli mancavano (dove vive il blocco, quale palette
   vince, cosa fa il chip di firma) sono emerse al passo 3 invece che al passo 0.

---

## Cronologia

Ripresa dell'arco 1 del rail con le tredici ratifiche già prese. Prompt di implementazione in
cinque passi, con passo 0 read-only aggiunto perché le ancore erano state rilevate prima
dell'atterraggio di Slice C.

Il passo 0 ha trovato un errore di directory nei prompt, tre ancore spostate, e ha stabilito che
il restyle del tree cade fuori dal «foglio del rail». Ne sono nate sette ratifiche nuove, due
delle quali sbagliate perché scritte su un incollato troncato del report: corrette nella
revisione 2 dopo la lettura del documento intero. L'errore di merito era credere che
`PropertiesHeader` rendesse anche per le view.

Il passo 2 ha consegnato il guscio, ma con dentro la postura Browse/Focus, che R-RAIL-14 aveva
messo fuori e che Claude Code stesso aveva proposto di escludere al passo 0. Ritirata con un
commit additivo, così resta recuperabile da `bcc68da8f`. Nella stessa occasione il controllo di
collasso è stato riportato a chiudere il solo inspector, perché come implementato faceva perdere
la preferenza del tree al reload.

Il passo 3 si è fermato su due condizioni di stop previste dal prompt, entrambe corrette: il
foglio dei badge è globale e intoccabile, e le due palette entity non divergono, sono invertite
su attribute ed enum. Ne è seguito il riperimetro dell'arco: il renderer va all'arco 2 insieme
alla decisione sulla palette. È rimasta la sezione NODE come disclosure, con il default riportato
a chiuso dopo che una premessa sbagliata era stata segnalata invece che eseguita in silenzio.
