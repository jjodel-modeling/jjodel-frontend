# Fase 2 (implementazione): TS1 UX refactor - authoring tipografia label da inline a trigger+popover

> Fase 2 di un two-phase, con go-ahead di Alfonso. **Scope: refactor UX.** Basata sul discovery
> `docs/discovery/discovery_2026-07-27_ts1_textstyle_label.md`.

## Framing critico (leggere prima di tutto)

**TS1 e' GIA' implementato e committato** (`e2368cad7` "feat: TextStyle authoring on vertex label
(TS1)", in `HEAD`). Primitiva `TextStyle`/`CompiledTextStyle`, compile per-asse (`compileTextStyle`),
render inline (`resolveTextStyle`), aggancio `LabelSpec.style?`, token `--font-mono`: **tutto gia'
presente e verificato a schermo**. Questo task **NON reimplementa nulla di tutto cio'**.

L'unico residuo di TS1 e' che l'authoring e' **inline** (blocco "Stile" con checkbox + ConditionalEditor
dentro `LabelEntryEditor:99-102`), mentre la ratifica UX
(`ratifiche_2026-07-27_typography_ux.md`) richiede **trigger compatto + popover overlay + summary
live**, vietando esplicitamente l'accordion inline. Questo task porta l'authoring al pattern
ratificato, **riusando** primitiva/compile/render gia' shippati.

Leggi `CLAUDE.md` (in particolare §4.3 collision check nomi, §15.2 clipping da overflow) e
`docs/claude-code-log.md` per il contesto recente. Branch: `alfonso-frontend-jjtl`.

## Obiettivo

Sostituire, per la label del vertice, l'authoring inline di `TextStyle` con:
- un nuovo componente **`TextStyleField`** (riga compatta: label "Stile" + summary live dello stile)
  che al click apre un **popover overlay**;
- il popover contiene il **`TextStyleEditor` esistente** (body a 5 assi, sostanzialmente invariato).

## Decisioni ratificate da Alfonso (NON rimetterle in discussione)

1. **Refactor, non reimplementazione.** NON reintrodurre ne' modificare `TextStyle`,
   `CompiledTextStyle`, `compileTextStyle`, `resolveTextStyle`, `LabelSpec.style`, il token
   `--font-mono`, ne' `nodeSizing.ts`. Sono gia' corretti in `HEAD`. Se ti accorgi che servirebbe
   toccarli, e' un segnale di scope creep: **HARD STOP e chiedi** (vedi sezione Hard stop).
2. **`TextStyleEditor` = corpo del popover, core per-asse INVARIATO.** Non riscrivere la sua logica
   per-asse ne' il suo `onChange`. In particolare **preserva il collasso a `undefined` quando nessun
   asse e' autorato** (key-drop): e' il round-trip di persistenza gia' funzionante. `TextStyleField`
   e' un wrapper che gli passa `value`/`onChange` identici.
3. **Popover via portal a `document.body`** (pattern `NodeProblemOverlay`), NON absolute in-place:
   robustezza contro il clipping da `overflow` del pannello (§15.2). Posizionamento via
   `getBoundingClientRect` del trigger (pattern `EdgeTypePopup`).
4. **Summary rule** come specificato in COME.4.
5. **Posizione invariata**: il trigger resta l'ultima sezione di `LabelEntryEditor` (dov'e' oggi il
   blocco inline), NON accorpato con Source.

## COSA / DOVE / COME

### COME.1 - NUOVO `TextStyleField.tsx`
**DOVE**: `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx` (stessa cartella
di `TextStyleEditor`/`LabelEntryEditor`; convenzione presentazionale: prop dati piatti, token
`var(--...)`, nessun import di runtime editor-v2).

**API** (generica, cosi' e' riusabile in TS2/TS3 senza modifiche):
```typescript
interface TextStyleFieldProps {
    value: TextStyle | undefined;
    onChange: (next: TextStyle | undefined) => void;
    label?: string;   // default "Stile"
}
```

**Struttura**:
- Un `jj-field` con `jj-field-label` = `label` (default "Stile") e, come controllo, una **riga
  trigger** cliccabile (`.jj-textstyle-field__trigger`) che mostra il summary (COME.4).
- Click sul trigger: apre/chiude il popover. Stato `open` locale (`useState`).
- **Popover** (COME.3): renderizzato in portal su `document.body`; contiene un header
  (`.jj-textstyle-popover__header`) con titolo "Tipografia" e un pulsante reset opzionale (icona
  Bootstrap, es. `bi-arrow-counterclockwise`) che chiama `onChange(undefined)`; sotto, il body:
  `<TextStyleEditor value={value} onChange={onChange} />`.
- Chiusura: outside-click (containerRef + listener), tasto `Esc`, e scroll del pannello contenitore
  (chiudere allo scroll evita il popover "staccato"; e' l'approccio piu' semplice e sicuro).

### COME.2 - `TextStyleEditor.tsx` (MODIFICA MINIMA, solo se necessario)
**DOVE**: `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx`.
**COSA**: il componente deve funzionare come body del popover. Se oggi rende un'intestazione/wrapper
che presupponeva il contesto inline (es. un titolo "Stile" proprio), rimuovilo **solo** se crea
doppione con l'header del popover. **Non toccare** la logica per-asse, il riuso di `ConditionalEditor`,
i controlli (`Select`/`NumberInput`/`ColorPicker`/`Checkbox`), ne' il collasso a `undefined`. Se il
componente e' gia' un semplice stack di assi senza header proprio, **non modificarlo affatto**.

### COME.3 - Popover overlay (dentro `TextStyleField`)
- **Portal**: `createPortal(<popover/>, document.body)` (come `NodeProblemOverlay.tsx:173,240`).
- **Posizione**: calcola da `triggerRef.getBoundingClientRect()` (pattern `EdgeTypePopup.tsx:78`):
  ancora sotto il trigger; se lo spazio sotto (`window.innerHeight - rect.bottom`) e' insufficiente,
  apri sopra (flip). Larghezza fissa ragionevole (es. 260-300px, coerente col pannello).
- **z-index**: allineato agli altri overlay in portal (verifica il valore di `NodeProblemOverlay` e
  usa lo stesso ordine di grandezza; NON un valore arbitrario).
- **Altezza**: `max-height` clampata allo spazio disponibile nel viewport, con `overflow-y: auto`,
  cosi' un asse in modalita' Condizionale (PredicateBuilder alto) scrolla dentro il popover invece di
  uscire dal viewport.
- **Classi**: tutte namespaced `jj-textstyle-*` (COME.5). **NON riusare `.edge-type-popup`.**

### COME.4 - Summary del trigger (helper puro `summarizeTextStyle`)
Definisci un helper puro (nel file del componente o accanto) che da `TextStyle | undefined` produce i
segmenti da mostrare. Usa `isConditionalValue` (esportato da `components/ui`) per riconoscere un asse
condizionale.

Regola:
- `style` assente **o** tutti gli assi assenti -> testo **"Default"** in muted (`var(--text-muted)`
  o equivalente), nessuno swatch.
- altrimenti, mostra **solo gli assi autorati**, in ordine fisso, joinati da " · ":
  1. `fontFamily`: "Sans" / "Mono"
  2. `fontSize`: "{n}px"
  3. `fontWeight`: "Normal" / "Medium" / "Semibold" / "Bold"
  4. `fontStyle`: "Italic" (ometti quando `normal`)
  - `color`: **non** testo, ma uno **swatch** (`.jj-textstyle-swatch`) in coda, pinnato a destra.
- **Asse condizionale**: al posto del literal, un glifo condizione (icona Bootstrap, es.
  `bi-lightning-charge`) + il nome corto dell'asse (es. icona + "Size").
- Riga singola: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` sui segmenti
  testuali; lo swatch resta visibile (flex, non troncato).

### COME.5 - SCSS (nuove classi namespaced)
**DOVE**: individua **prima** dove vivono gli stili dei pannelli authoring (grep di `jj-field` /
`.jj-field-label` per trovare il file SCSS giusto: NON assumere il path). Aggiungi le nuove classi
li' o in un file adiacente coerente.
**COSA** (verifica ciascun nome con `grep -r` prima di introdurlo, §4.3):
`.jj-textstyle-field`, `.jj-textstyle-field__trigger`, `.jj-textstyle-summary`,
`.jj-textstyle-swatch`, `.jj-textstyle-popover`, `.jj-textstyle-popover__header`.
Stile coerente col design system (slate/cyan, 11px per label secondarie, 8px grid). Il trigger deve
avere l'aspetto di un controllo (bordo, hover) come gli altri campi del pannello.

### COME.6 - `LabelEntryEditor.tsx` (swap del mount)
**DOVE**: `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx:99-102`.
**COSA**: sostituisci il blocco inline attuale
```tsx
<label className="jj-field-label">Stile</label>
<TextStyleEditor
    value={label.style}
    onChange={(style: TextStyle | undefined) => onChange({ ...label, style })}
```
con il mount del nuovo campo (che porta la propria label "Stile"):
```tsx
<TextStyleField
    value={label.style}
    onChange={(style) => onChange({ ...label, style })}
/>
```
Aggiorna l'import (`TextStyleEditor` -> `TextStyleField`; `TextStyleEditor` resta importato solo se
non piu' usato direttamente qui va rimosso dall'import). **Non toccare** il resto del pannello (Source,
visible, editable): scope stretto.

## Scope file (stretto)

Solo questi file. `git add` mirato sui file specifici, **mai** `git add .`:
1. `viewpoint/authoring/TextStyleField.tsx` (NUOVO)
2. `viewpoint/authoring/TextStyleEditor.tsx` (MODIFICA minima o nessuna)
3. `viewpoint/authoring/LabelEntryEditor.tsx` (swap mount + import)
4. SCSS dei pannelli authoring (classi `jj-textstyle-*`)
5. `docs/claude-code-log.md` (entry)

**Fuori scope (NON toccare)**: `irTypes.ts`, `irCompile.ts`, `IRNodeContent.tsx`, `irStyle.ts`,
`nodeSizing.ts`, `ObjectNode.tsx`, token `_typography.scss`.

## Verifica (build + visiva su http://localhost:3001/, hard-refresh)

Non committare prima della conferma visiva di Alfonso. Punti da verificare:
1. Label senza stile: trigger mostra "Default"; nessuna regressione visiva del nodo.
2. `fontWeight = bold`: summary "Bold"; la label a schermo diventa bold; nodo content-hug si allarga.
3. `fontFamily = mono`, `fontSize = 20`, italic, color: summary "Mono · 20px · Italic" + swatch; la
   label riflette tutto.
4. Un asse in modalita' Condizionale: summary mostra il glifo condizione per quell'asse; il
   PredicateBuilder scrolla **dentro** il popover senza uscire dal viewport.
5. **Clipping**: il popover e' visibile per intero anche con il pannello scrollato/con overflow
   (portal); chiude su outside-click, Esc e scroll del pannello.
6. Reset (se implementato): `style` torna `undefined`, summary "Default", label al default.
7. **Round-trip**: riseleziona/ricarica la view: gli assi autorati riappaiono identici; una label con
   0 assi ha `style === undefined` (key-drop preservato, nessuna regressione di persistenza).
8. `npm run build` verde.

## Log e commit

- Aggiorna `docs/claude-code-log.md`: tipo `refactor`, prompt in una riga, file toccati, esito,
  **Nome del documento prompt**: `2026-07-27 17:14`.
- Commit (dopo conferma visiva), scope mirato:
  `refactor(editor-v2): typography label authoring inline -> trigger+popover (TextStyleField)`

## Hard stop

**FERMATI e chiedi in chat** (non procedere) se:
- il refactor sembra richiedere di toccare un file "fuori scope" (tipi/compile/render/sizing gia'
  shippati): e' scope creep, segnalalo;
- un nome nuovo (`TextStyleField` o una classe `jj-textstyle-*`) risulta gia' in uso alla grep;
- il collasso a `undefined` del `TextStyleEditor` si romperebbe con la modifica proposta;
- `.edge-type-popup` risultasse l'unico modo per posizionare il popover (non lo e': usa portal).

## RIFERIMENTI

- Discovery Fase 1: `docs/discovery/discovery_2026-07-27_ts1_textstyle_label.md` (Q1..Q8, verdetto
  misuratore, collision check, primitive UI).
- Ratifiche UX: `ratifiche_2026-07-27_typography_ux.md` (KB) - trigger+popover, 5 assi, chip "Default".
- Spec: `spec_2026-07-27_ir_textstyle_addendum.md` (KB) - §6 authoring, §9 decisioni fini.
- Primitive da riusare: `ConditionalEditor`/`isConditionalValue` (`components/ui/index.ts:55`),
  `Select` (:13), `NumberInput` (:37), `ColorPicker` (:43), `Checkbox` (:40).
- Pattern portal/popover da imitare: `problems/NodeProblemOverlay.tsx` (portal->body),
  `components/EdgeTypePopup.tsx` / `M1ReferencePopup.tsx` (absolute + getBoundingClientRect),
  `components/InlineEnumSelect.tsx` (outside-click/esc).
- Commit di riferimento (TS1 gia' fatto): `e2368cad7`.

---
**Nome del documento prompt**: 2026-07-27 17:14
