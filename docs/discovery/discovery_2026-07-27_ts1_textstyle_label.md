# Discovery (read-only) — TS1: TextStyle su label del vertice (authoring trigger+popover)

**Data**: 2026-07-27
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery Fase 1 (read-only). Nessun edit al codice di feature.
**Nome documento prompt**: 2026-07-27 16:56

---

## ⚠️ Framing critico (leggere prima di tutto)

**TS1 è già stato implementato e committato in questa stessa sessione** — commit
`e2368cad7` *"feat: TextStyle authoring on vertex label (TS1)"* (in `HEAD`). Sono già
presenti nel branch:

- la primitiva `TextStyle` + `CompiledTextStyle` (`irTypes.ts`);
- il compile per-asse `compileTextStyle` che riusa `compileConditional` (`irCompile.ts`);
- il render inline `resolveTextStyle` sulla `.ir-label` (`IRNodeContent.tsx`);
- l'aggancio `LabelSpec.style?` + `CompiledLabel.style?`;
- un componente authoring **`TextStyleEditor`** già montato in `LabelEntryEditor`;
- il token `--font-mono` (già esistente da prima, non introdotto).

**Ma l'authoring realizzato è INLINE** (sezione "Stile" con 5 righe checkbox +
`ConditionalEditor`), **non** il pattern **trigger compatto + popover overlay + summary
live** ratificato in `ratifiche_2026-07-27_typography_ux.md` (che vieta esplicitamente
l'accordion inline). Quindi il vero lavoro residuo di TS1 **non è greenfield**: è un
**refactor della superficie di authoring** (inline → `TextStyleField` compatto che apre
`TextStyleEditor` in popover), riusando primitiva/compile/render già shippati.

Conseguenze dirette per la Fase 2:
- Gli identificatori `TextStyle`, `CompiledTextStyle`, `TextStyleEditor`,
  `compileTextStyle`, `resolveTextStyle` **NON sono più liberi** (vedi Q8). Solo
  `TextStyleField` è libero.
- Il fix del misuratore `nodeSizing.ts` che il prompt anticipava **non serve**: il
  content-hug è CSS/DOM-driven, non c'è un misuratore a font fisso (vedi Q4 — verdetto).
- Il token `--font-mono` **esiste già** (vedi Q5): niente da introdurre.

Le risposte Q1..Q8 sotto riportano lo **stato corrente reale** (post-`e2368cad7`), non
uno stato greenfield.

---

## Obiettivo

Mappare i punti di aggancio reali (tipi, compile, render, sizing, authoring) e le
primitive UI riusabili per portare l'authoring di `TextStyle` sulla label del vertice al
pattern ratificato **trigger + popover**, sul codice attuale del branch.

## File letti / analizzati (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts`
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (blocco render IR 365-449)
- `frontend/src/styles/tokens/_typography.scss`
- `frontend/src/components/ui/index.ts` (+ `ConditionalEditor/ConditionalEditor.tsx`)
- `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx`
- `frontend/src/components/editor-v2/problems/NodeProblemOverlay.tsx` (pattern portal)
- `frontend/src/components/editor-v2/components/EdgeTypePopup.tsx`,
  `M1ReferencePopup.tsx`, `InlineEnumSelect.tsx` (pattern popup)
- `docs/discovery/discovery_2026-07-27_ir_text_typography_state.md` (ground truth)

---

## Findings Q1..Q8

### Q1 — `irTypes.ts`: `TextStyle`/`CompiledTextStyle` e i vicini

`Conditional<T>` (`irTypes.ts:33-36`):
```typescript
export type Conditional<T> =
    | T
    | { when: Predicate; then: T; else?: T }
    | { rules: { when: Predicate; then: T }[]; default?: T };
```

`fill` e `border.color` sono `Conditional<string>` / `string` — **non** un alias
`ColorToken** (che vive solo nella spec). `ShapeSpec` (`irTypes.ts:117-118`):
```typescript
    fill?: Conditional<string>;
    border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' };
```
Non esiste un tipo `BorderSpec` nel codice: il bordo è un oggetto inline (spec-vs-code:
la spec lo chiama `BorderSpec`). `color` di `TextStyle` è già allineato a `Conditional<string>`.

**Incognita chiave — RISOLTA**: `LabelSpec` esiste e **dichiara già `style?`** (aggiunto
da `e2368cad7`). `irTypes.ts:76-84`:
```typescript
export interface LabelSpec {
    position: LabelPosition;
    source: TextSource;
    visible?: Conditional<boolean>;
    editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' };
    /** spec ir-1.3 addendum sez. 3.1 — typographic style (TS1). Absent = CSS default. */
    style?: TextStyle;
}
```
`TextStyle` (`irTypes.ts:68-74`) e `CompiledTextStyle` (`irTypes.ts:337-343`) sono già
definiti con esattamente i 5 assi ratificati:
```typescript
export interface TextStyle {
    fontFamily?: Conditional<FontFamilyToken>;   // FontFamilyToken = 'sans' | 'mono'
    fontSize?: Conditional<number>;              // px
    fontWeight?: Conditional<FontWeightToken>;   // 'normal'|'medium'|'semibold'|'bold'
    fontStyle?: Conditional<'normal' | 'italic'>;
    color?: Conditional<string>;
}
```
**Per la Fase 2 (UX refactor) NON serve toccare `irTypes.ts`**: i tipi sono a posto.

### Q2 — Compile di `Conditional<T>` (riuso puro, nessun nuovo write path)

Helper esistente `compileConditional<T>` (`irCompile.ts:225`):
```typescript
function compileConditional<T>(c: Conditional<T> | undefined, fallback: T, deps: Set<string>): CompiledConditional<T>
```
Usato per `fill`/`line.color`. Il compile per-asse di `TextStyle` **esiste già** —
`compileTextStyle` (`irCompile.ts:253`), che chiama `compileConditional` per ogni asse.
La funzione che compila la view è `compileView` (`irCompile.ts:275`); il compiled della
label si materializza a `irCompile.ts:311`:
```typescript
        return { position: l.position, text, visible: compileConditional(l.visible, true, deps), editsName, style: compileTextStyle(l.style, deps) };
```
**Confermato**: nessun nuovo motore di valutazione condizionale né write path — riuso
puro. Le predicate dentro gli assi condizionali estendono `deps` automaticamente
(via `compileConditional`). **Fase 2 non tocca il compile.**

### Q3 — Render della label del vertice

`resolveTextStyle` (`IRNodeContent.tsx:33`) mappa il `CompiledTextStyle` a
`React.CSSProperties`. È applicato inline sulla `<span>` della label
(`IRNodeContent.tsx:213-214`):
```tsx
                        className={`ir-label ir-label--${l.position}`}
                        style={resolveTextStyle(l.style, readCtx, objectId)}
```
Classi CSS in gioco e `font-weight` hard-coded (`irStyle.ts:20-21`):
```
.ir-node-content .ir-label--top    { order: 0; text-align: center; font-weight: 600; }
.ir-node-content .ir-label--center { order: 1; text-align: center; margin: auto 0; font-weight: 600; }
```
`font-weight: 600` è a livello di **classe**; un `style` inline (`fontWeight`) sul nodo
testo **vince per specificità** (inline > classe), quindi l'override funziona senza
toccare il CSS. **Confermato e già in produzione**: `resolveTextStyle` emette un asse
solo quando risolto a valore non vuoto, così l'asse assente eredita il default di classe.
**Fase 2 non tocca il render.**

### Q4 — `nodeSizing.ts` / misura del testo (SENSIBILE) → **VERDETTO: nessun misuratore da correggere**

`nodeSizing.ts` **non è un misuratore di testo**: è una mappa statica di affordance di
resize (`NODE_SIZING_DEFAULTS` adaptWidth/adaptHeight), `SHAPE_MIN_SIZE = 24`,
`isNodeResizable`, `defaultResizableForForm`. Nessun `font`, nessun `measureText`,
nessun calcolo di larghezza dal testo.

Il render IR del nodo (`ObjectNode.tsx:367-433`) **non misura il testo**: il wrapper
`<div className="mm-node mm-object …">` ottiene la larghezza dal **content-hug CSS**
(flex + label `white-space:nowrap`, larghezza naturale). Il `NodeResizer`
(`ObjectNode.tsx:387-395`) imposta solo `minWidth/minHeight = SHAPE_MIN_SIZE` e gli
handle di resize manuale — **non** misura testo:
```tsx
                {isNodeResizable('objectNode', canResize) && (
                    <NodeResizer isVisible={selected} minWidth={SHAPE_MIN_SIZE} minHeight={SHAPE_MIN_SIZE} … />
                )}
```
Grep di conferma su editor-v2: nessun `measureText` / char-width / `ctx.font=`; i
`getBoundingClientRect` sono tutti per posizionamento (handle/overlay/popup), non per la
larghezza del nodo. ReactFlow misura i nodi via ResizeObserver sul DOM **stilizzato**
(`node.measured.width`), quindi riflette già il `fontSize` reso.

**Verdetto**: un `fontSize` autorato maggiore **allarga già** i nodi content-hug via
layout del browser (comportamento verificato a schermo su `e2368cad7` — Alfonso: "la
gestione font funziona"). Non esiste un misuratore a font fisso da correggere. **Il
"fix" del misuratore anticipato dal prompt NON è necessario**, **non** esce dal
perimetro label, **non** tocca `useJjomSync`/`portDistribution`. **Nessun Layer Impact
Report richiesto in Fase 2 su questo asse.**

Nota di completezza (non un bug): per un nodo con larghezza **esplicita persistita**
(dopo resize manuale con `NodeResizer`), la dimensione manuale vince sul content-hug e
un `fontSize` grande produce ellissi anziché allargare — comportamento atteso ("la
dimensione manuale vince"), non da correggere.

### Q5 — Design token `--font-mono` / `--font-sans` → **entrambi esistono**

`frontend/src/styles/tokens/_typography.scss`:
```scss
13:  --font-sans: 'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
16:  --font-mono: 'IBM Plex Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
```
`--font-mono` **è già definito** (mappa a IBM Plex Mono, come ipotizzava la spec, qui
confermato dal valore reale). Il render usa `var(--font-mono)`/`var(--font-sans)`
(mapping in `IRNodeContent.tsx` `FONT_FAMILY_VAR`). **Fase 2 non introduce token.**

### Q6 — Primitive UI da riusare (incognita chiave)

**Popover/overlay**: **NON esiste** una primitiva `Popover`/`Overlay` in
`components/ui/*`, né `@floating-ui`/`FloatingPortal` (nessuna nuova dipendenza
disponibile). Pattern esistenti da **imitare** (no nuove dipendenze):
- **Portal a `document.body`**: `NodeProblemOverlay.tsx:173,240` — `createPortal(…, document.body)`.
- **Popup assoluto posizionato**: `EdgeTypePopup.tsx` (`position:'absolute'`,
  `zIndex:1000` a `:96-99`, posizionamento via `getBoundingClientRect` a `:78`) e
  `M1ReferencePopup.tsx` (`:86-89`, `:67`). Entrambi condividono la classe
  `.edge-type-popup` (NON riusare quel nome per typography: namespacing dedicato).
- **Dropdown inline con chiusura on-blur/esc**: `InlineEnumSelect.tsx` (containerRef +
  useEffect di outside-click), utile come riferimento per l'interazione open/close.

**ConditionalEditor** (già riusato oggi dal `TextStyleEditor` inline): esportato da
`components/ui/index.ts:55` (`export { ConditionalEditor, isConditionalValue }`), generico
`ConditionalEditor<T>` con `props: { value: Conditional<T> | undefined; onChange:
(next: Conditional<T> | undefined) => void; renderValue: (v, onCh) => ReactNode;
defaultValue: T; features; featuresHint?; classNames: string[] }`. Porta **internamente**
il toggle Fisso/Condizionale → è la primitiva giusta da incastonare per-asse nel popover.

**Controlli semplici** (tutti in `components/ui`, già usati da `EdgeAuthoringPanel` e dal
`TextStyleEditor` attuale):
- `Select` (`index.ts:13`) — family/weight/style.
- `NumberInput` (`index.ts:37`, supporta `min`/`max`) — size px.
- `ColorPicker` (`index.ts:43`) — color; **è lo stesso** ColorPicker usato per `fill` in
  `EdgeAuthoringPanel` (via `ConditionalEditor` + `renderValue`).
- `Checkbox` (`index.ts:40`) — presenza/toggle asse.

**Trigger/summary chip**: non esiste un pattern "riga compatta che apre popover" già
pronto in `ui/`; il più vicino è la coppia trigger→`EdgeTypePopup`/`M1ReferencePopup`
(un elemento cliccabile che apre un popup posizionato). `TextStyleField` andrà costruito
imitando quel pattern, con classi namespaced.

### Q7 — `LabelEntryEditor`: struttura e read/write dell'IR

Path reale: `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`
(convenzione presentazionale confermata: prop dati piatti, `jj-field`/`jj-field-label`,
nessun import di runtime editor-v2). Legge/riscrive lo spec della label con **clone
immutabile whole-object** (`{ ...label, <campo>: next }`), es. `:60`, `:70`, `:80`, `:89`.
La sezione "Stile" **è già montata** (`e2368cad7`) a `LabelEntryEditor.tsx:99-102`:
```tsx
                <label className="jj-field-label">Stile</label>
                <TextStyleEditor
                    value={label.style}
                    onChange={(style: TextStyle | undefined) => onChange({ ...label, style })}
```
**Per la Fase 2**: il punto di mount è già questo. Il refactor consiste nel **sostituire**
il montaggio dell'attuale `TextStyleEditor` inline con `TextStyleField` (riga compatta +
summary), che al click apre il popover contenente l'editor per-asse. `TextStyleField`
riceve `value={label.style}` ed emette `onChange` identico (whole-object clone). Il ciclo
edit/validate/commit del pannello padre resta invariato.

### Q8 — Collision check (stato corrente, post-`e2368cad7`)

| Identificatore | Esito | Dove |
|---|---|---|
| `TextStyle` | **OCCUPATO** | irTypes/irCompile/IRNodeContent/LabelEntryEditor/TextStyleEditor |
| `CompiledTextStyle` | **OCCUPATO** | irTypes/irCompile/IRNodeContent |
| `TextStyleEditor` | **OCCUPATO** | authoring/TextStyleEditor.tsx (+ import in LabelEntryEditor) |
| `compileTextStyle` | **OCCUPATO** | irCompile.ts:253 |
| `resolveTextStyle` | **OCCUPATO** | IRNodeContent.tsx:33 |
| `TextStyleField` | **LIBERO** | — (nome del nuovo componente trigger) |
| `--font-mono` | **ESISTE GIÀ** | _typography.scss:16 (non introdurre) |

Classi CSS: l'unico match `typography`-like è `.typography-samples` in
`src/pages/tokenPreview.scss:134` (pagina token preview, **estranea** a editor-v2 — nessun
rischio). Non esistono classi `text-style`/`textstyle`. **Raccomandazione**: le nuove
classi del trigger/popover vanno namespaced (es. `jj-textstyle-field`,
`jj-textstyle-popover`, `jj-textstyle-summary`) e verificate con grep prima di
introdurle (§4.3 CLAUDE.md). Il `.edge-type-popup` esistente **non** va riusato.

---

## Verdetto sul misuratore (sintesi)

**Resta nel perimetro / non è sensibile: NON c'è un misuratore da correggere.** Il
content-hug è CSS/DOM-driven; il `fontSize` inline già allarga i nodi content-hug (testato
su `e2368cad7`). Fase 2 **non** tocca `nodeSizing.ts`/`ObjectNode.tsx` per il sizing, **non**
interseca `useJjomSync`/`portDistribution`, **non** richiede Layer Impact Report.

## Primitive UI da riusare (per Fase 2)

- `ConditionalEditor<T>` (`ui/index.ts:55`) — per-asse, porta il toggle Fisso/Condizionale.
- `Select` / `NumberInput` / `ColorPicker` / `Checkbox` (`ui/index.ts:13/37/43/40`).
- Pattern popover: imitare `NodeProblemOverlay` (portal→body) o
  `EdgeTypePopup`/`M1ReferencePopup` (absolute + zIndex + getBoundingClientRect). Nessuna
  nuova dipendenza.

## File che la Fase 2 (UX refactor) dovrà toccare — proposta

1. **`authoring/TextStyleField.tsx`** (NUOVO) — riga compatta con summary live; apre il
   popover. Nome libero (Q8).
2. **`authoring/TextStyleEditor.tsx`** (MODIFICA) — riorganizzare per rendere dentro il
   popover (già riusa ConditionalEditor + controlli); il core per-asse è riutilizzabile.
3. **`authoring/LabelEntryEditor.tsx`** (MODIFICA) — sostituire il mount inline con
   `TextStyleField` (stesso `value`/`onChange`).
4. **SCSS** — un nuovo file/scope per le classi namespaced del field/popover (es.
   accanto agli altri stili authoring; verificare dove vivono gli SCSS dei pannelli
   authoring prima di scegliere il file — non assumere).
5. **`docs/claude-code-log.md`** — entry.

**Non** in scope Fase 2 (già shippato in `e2368cad7`): `irTypes.ts`, `irCompile.ts`,
`IRNodeContent.tsx`, token `--font-mono`, `nodeSizing.ts`.

## Rischi

- **Rischio "doppia implementazione"**: il prompt è scritto come greenfield ma TS1 è già
  in `HEAD`. Se la Fase 2 reintroducesse `TextStyle`/`compileTextStyle` ecc. creerebbe
  duplicati/conflitti. La Fase 2 deve essere inquadrata come **refactor UX** sopra il
  già-fatto (chiarito qui).
- **Popover in un pannello scrollabile**: il popover overlay deve evitare il clipping da
  `overflow` del pannello properties (cfr. §15.2 CLAUDE.md, ContextMenu clippato da
  `overflow:hidden`). Portal→`document.body` (pattern `NodeProblemOverlay`) è la scelta
  più sicura contro il clipping; l'absolute di `EdgeTypePopup` va bene solo se il
  contenitore non ha `overflow:hidden`.
- **Namespacing CSS** (§4.3): collisioni CSS silenziose. Grep obbligatoria prima di ogni
  nuova classe; non riusare `.edge-type-popup`.
- **Interazione ConditionalEditor dentro popover**: il `ConditionalEditor` in modalità
  Condizionale monta un `PredicateBuilder` (può essere alto); dentro un popover assoluto
  serve gestione di dimensione/scroll del popover per non uscire dal viewport.
- **Round-trip byte-identico**: il `TextStyleEditor` attuale collassa `style` a
  `undefined` quando nessun asse è autorato (key-drop). Il refactor deve preservare
  questa proprietà (nessuna regressione di persistenza).

## Domande aperte per Alfonso

1. **Reframe confermato?** La Fase 2 è un refactor UX (inline → trigger+popover) sopra
   TS1 già committato (`e2368cad7`), non una reimplementazione. Confermi?
2. **Destino dell'attuale `TextStyleEditor` inline**: lo trasformiamo nel contenuto del
   popover (riuso del core per-asse) o lo teniamo come fallback? Preferenza: riuso.
3. **Portal vs absolute** per il popover: preferisci il portal→body (robusto contro
   overflow-clipping del pannello) o l'absolute in-place stile `EdgeTypePopup`?
4. **Summary del trigger**: cosa mostrare esattamente quando 0 assi autorati
   ("Default/ereditato") e con N assi ("Aa · 14px · italic …")? Serve una regola di
   compressione per non sforare la riga.
5. **Posizione**: il trigger "Stile" resta come ultima sezione di `LabelEntryEditor` o va
   spostato/accorpato con Source?

---

## Hard stop

Report scritto. **STOP.** Nessun edit al codice di feature, nessun commit, nessun
`git add`. La sintesi Q1..Q8, il verdetto sul misuratore, il collision check e la lista
file per la Fase 2 sono anche in chat.
