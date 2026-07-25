# Discovery — aggiunta shape `circle` e `diamond` al sistema IR

> **Fase 1 / read-only.** Nessun edit al codice di feature. Questo report mappa i
> punti d'innesto reali per l'implementazione di due nuovi form di shape vertex:
> `circle` (= ellipse con aspect ratio bloccato 1:1) e `diamond` (rombo reso con
> layer SVG dietro il contenuto). L'implementazione la decide Alfonso dopo aver
> letto questi findings.

**Data**: 2026-07-24 · **Branch**: `alfonso-frontend-jjtl`

---

## Obiettivo della discovery

Localizzare con `file:riga` tutti i punti che oggi definiscono, propagano, emettono
e dipingono i tre form esistenti (`rect | rounded | ellipse`), così da poter poi:

1. estendere l'union con `circle` e `diamond`;
2. aggiungere le due `<option>` nella select Shape del pannello authoring;
3. emettere le classi `ir-shape--circle` / `ir-shape--diamond`;
4. per `diamond`, disegnare un layer SVG che attinge agli **stessi valori risolti**
   di border/fill oggi dipinti inline, **sopprimendo** il box rettangolare di
   `.ir-node-content`;
5. per `circle`, agganciare `keepAspectRatio` 1:1 sul resizer.

---

## File letti (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (intero)
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (sez. default)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (sez. compile form/fill/border)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (intero)
- `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (ramo IR, righe 360-438)
- `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (intero)
- `frontend/src/components/editor-v2/nodes/ClassNode.tsx` / `EnumNode.tsx` (grep resize/IR)
- `frontend/src/joiner/components.tsx` (registry cname shape classiche)
- `frontend/src/common/sharedTypes.tsx` (dichiarazione `sides?`)
- `frontend/src/common/Geom.ts` (grep helper poligonali)
- grep globali su `ShapeForm`, letterali `'ellipse'/'rounded'/'rect'`, `ir-shape--`,
  `keepAspectRatio`, `makePolygon/makeClipPath/clipPath/sides`.

---

## Finding 1 — Union dei form

**Dichiarazione (unica, verbatim)** — `irTypes.ts:38`:

```ts
export type ShapeForm = 'rect' | 'rounded' | 'ellipse';
```

Non è nello schema `.ir` esterno: è un tipo TypeScript locale del sottosistema IR di
`editor-v2` (`viewpoint/ir/irTypes.ts`). È il **single source of truth** del tipo.

**Punti che referenziano `ShapeForm`** (grep globale):

| file:riga | uso |
|---|---|
| `irTypes.ts:85` | `ShapeSpec.form: Conditional<ShapeForm>` |
| `irTypes.ts:129` | `GraphVertexViewIR...collapsed.form?: Conditional<ShapeForm>` |
| `irTypes.ts:248` | `CompiledView.form: CompiledConditional<ShapeForm>` |
| `irTypes.ts:288` | `CompiledContainment.collapsedForm: CompiledConditional<ShapeForm> \| null` |
| `authoring/VertexAuthoringPanel.tsx:7` | `import type { ... ShapeForm }` |
| `authoring/VertexAuthoringPanel.tsx:220` | `<ConditionalEditor<ShapeForm>` |
| `authoring/VertexAuthoringPanel.tsx:223` | cast `onCh(e.target.value as ShapeForm)` |

**Letterali dei form nel codice non-test** (grep `'ellipse'/'rounded'/'rect'`):

- `irCompile.ts:260` — default del compile: `compileConditional(ir.shape.form, 'rect' as const, deps)`
- `irCompile.ts:311` — default collapsedForm: `'rounded' as const`
- `irDefaults.ts:34` — `form: 'rect'` (default object view)
- `irDemoFixture.ts:36, :64` — fixture demo, `form: 'rounded'`
- `authoring/VertexAuthoringPanel.tsx:17-21` — `FORM_OPTIONS` (vedi Finding 2)
- `authoring/VertexAuthoringPanel.tsx:224` — `defaultValue={'rect'}` sul ConditionalEditor
- `ObjectNode.tsx:374` — `const hasGeometricShape = shapeForm === 'ellipse';` (vedi Finding 6)
- `irStyle.ts:45, :57, :58` — regole CSS `.ir-shape--rounded` / `.ir-shape--ellipse` (Finding 5)
- test: `ir.test.ts:141,142,148,149` (fixture, fuori scope produzione)

> Nota: `jscss.js:2892/2914` matcha `'ellipse'` ma è il parser CSS gradient di una
> libreria di terze parti — **non correlato**, ignorare.

**Impatto per l'estensione**: aggiungere `| 'circle' | 'diamond'` in `irTypes.ts:38`
è il cambiamento di tipo unico. TypeScript non impone `switch` esaustivi qui (nessun
`switch (form)` con `never`-check trovato), quindi la propagazione ai punti sopra è
**additiva**: i default (`'rect'`, `'rounded'`) restano validi; nessun sito rompe la
compilazione. Va comunque toccato `ObjectNode.tsx:374` (Finding 6) e i CSS (Finding 5),
altrimenti i nuovi form compilano ma non rendono/resize correttamente.

---

## Finding 2 — Select Shape nel pannello + hard stop feature-picker

**Elenco option Shape** — `VertexAuthoringPanel.tsx:17-21`:

```ts
const FORM_OPTIONS = [
    { value: 'rect', label: 'Rectangle' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'ellipse', label: 'Ellipse' },
];
```

Rese dal `<Select options={FORM_OPTIONS} ...>` dentro `<ConditionalEditor<ShapeForm>>`
a **`:220-228`** (renderValue alla riga `:223`). Aggiungere due option =
due righe in `FORM_OPTIONS` (`:17-21`). Nient'altro nel pannello va toccato per la select.

**Hard stop feature-picker (memo di risoluzione metaclasse by-id)**: è il memo
`featureInfo` alle **righe `:93-151`** (il fix del bug feature-picker stale, discovery
2026-07-23: risolve la metaclasse per **identità/pointer** e non per nome, con warning
`metamodelsWithClass > 1` a `:203-207`). 

**Verdetto sulla distanza**: l'aggiunta delle option è a `:17-21` (costante top-level,
fuori dal componente). Il memo critico è a `:93-151`, **~75 righe più in basso e in un
altro scope**. Sono **fisicamente lontani e indipendenti**: aggiungere una `<option>`
non tocca il memo. Nessun rischio di collisione con l'hard stop. **Non modificare il
memo** (regola del prompt rispettata).

---

## Finding 3 — Emissione della classe `ir-shape--<form>`

Path reattivo che funziona (**non toccare, solo localizzato**) — `IRNodeContent.tsx:108`:

```tsx
className={`ir-node-content ir-shape--${form}`}
```

dove `form = compiled.form(readCtx, objectId)` a `IRNodeContent.tsx:35`. La classe è
interpolata direttamente dal valore risolto del conditional → con `circle`/`diamond`
nell'union emetterà automaticamente `ir-shape--circle` / `ir-shape--diamond` senza
modifiche a questa riga. Basta che esistano le regole CSS corrispondenti (Finding 5).

> **Secondo sito che risolve `form`**: `ObjectNode.tsx:373` (`shapeForm = irResolution
> .compiled.form(...)`) — usato per il resizer, non per la classe. Due valutazioni
> indipendenti dello stesso conditional (Finding 6). Il valore emesso è lo stesso.

---

## Finding 4 — Painting attuale di border e fill (path faseB) — **punto chiave**

**Dove risiede**: `IRNodeContent.tsx`. **Valori risolti disponibili**:

- **fill** — `IRNodeContent.tsx:36`:
  ```ts
  const fill = compiled.fill ? compiled.fill(readCtx, objectId) : '';
  ```
  `compiled.fill` è `CompiledConditional<string> | null` (`irTypes.ts:249`), valutato
  per-istanza → stringa colore (o `''`).

- **border** — `compiled.border` è **statico**, non conditional. Compile a
  `irCompile.ts:262`: `const border = ir.shape.border ?? null;` → forma
  `{ color: string; width: number; style: 'solid'|'dashed'|'dotted' } | null`
  (`irTypes.ts:250` / `ShapeSpec.border` `irTypes.ts:87`).

**Punto esatto in cui diventano stile inline** — `IRNodeContent.tsx:98-104`:

```ts
const inlineStyle: React.CSSProperties = {};
if (fill) inlineStyle.background = fill;
const b = compiled.border;
if (b) inlineStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${b.color ?? 'var(--border-default)'}`;
```

applicati a `IRNodeContent.tsx:109` (`style={inlineStyle}` sul `<div className="ir-node-content ...">`).

**Come è strutturato il box oggi (contesto ri-stratificazione faseB)**:
- `.ir-node-content` (CSS base, `irStyle.ts:44`) porta **sempre**: `background: var(--node-bg)`,
  `border: 1px solid var(--border-default)`, `border-radius: 4px`, `box-shadow: ...`,
  `overflow: hidden`.
- Gli inline di `:99/:104` **sovrascrivono** `background` e `border` quando fill/border
  authored esistono; **non** sovrascrivono `box-shadow` né `border-radius` né `overflow`.
- Il wrapper `.mm-node` è neutralizzato per i soli nodi IR via `:has(> .ir-node-content)`
  (`irStyle.ts:41-43`): background/border/box-shadow trasparenti. Quindi **il box lo
  dipinge un solo elemento: `.ir-node-content`**.

**Implicazione per `diamond` (il layer SVG)**:
- Il layer SVG deve leggere gli **stessi** `fill` (riga 36) e `compiled.border`
  (`{color,width,style}`) e mapparli su `fill` / `stroke` + `stroke-width` +
  `stroke-dasharray` (dashed/dotted derivabili da `style`). Fallback fill quando vuoto:
  oggi il box usa `var(--node-bg)` — replicarlo.
- Per il **solo** form `diamond`, `.ir-node-content` deve **sopprimere** il proprio
  box rettangolare: `background: transparent`, `border-color: transparent`,
  `box-shadow: none` (altrimenti si vede un quadrato dietro il rombo). Attenzione:
  gli inline di `:99/:104` verrebbero applicati anche a diamond → o si condiziona in
  `IRNodeContent` (non settare `inlineStyle.background`/`.border` quando
  `form === 'diamond'`) **oppure** si neutralizza via CSS `.ir-shape--diamond` con
  precedenza sufficiente (l'inline vince sul CSS senza `!important`, quindi la via
  pulita è **non emettere gli inline per diamond**).
- `overflow: hidden` su `.ir-node-content` (`irStyle.ts:44`) clippa il contenuto: i
  vertici del rombo toccano i bordi del box, e metà `stroke-width` può essere tagliata
  agli apici. Da valutare (viewBox con padding pari a `width/2`, o `overflow: visible`
  sul solo layer SVG).

Vedi **Rischi** in fondo.

---

## Finding 5 — CSS delle shape

Regole esistenti in `irStyle.ts` (`BASE_CSS`, iniettato una volta):

- `irStyle.ts:44` — base `.ir-node-content` (box completo, vedi Finding 4).
- `irStyle.ts:45` — `.ir-node-content.ir-shape--rounded { border-radius: 10px; }`
- `irStyle.ts:57` — `.ir-node-content.ir-shape--ellipse { border-radius: 50%; justify-content: center; min-width: 0; min-height: 0; }`
- `irStyle.ts:58` — `.mm-node:has(> .ir-node-content.ir-shape--ellipse) { min-width: 0; min-height: 0; width: 100%; height: 100%; }`

**Conferma radius su `.ir-node-content` (non `.mm-node`)**: ✅ confermato. Post
ri-stratificazione faseB il `border-radius` (base `:44`, rounded `:45`, ellipse `:57`)
vive tutto su `.ir-node-content`; `.mm-node` è **neutralizzato** per i nodi IR
(`:41-43`, `:58`). Nessun radius sull'antenato `.mm-node`.

**Token/variabili di radius**: le regole IR usano valori **hardcoded** (`4px`, `10px`,
`50%`) — nessuna variabile `--radius-*` (coerente con l'eliminazione del legacy
`--radius`, CLAUDE.md §7.2). fill/border base usano token colore
(`var(--node-bg)`, `var(--border-default)`, `var(--node-shadow*)`).

**Per l'estensione**:
- `circle`: serve `.ir-node-content.ir-shape--circle { border-radius: 50%; ... }`
  (identica a ellipse) + il gemello `.mm-node:has(> .ir-node-content.ir-shape--circle) {...}`
  del `:58` per abilitare lo shrink. Il lock 1:1 è sul resizer (Finding 6), non in CSS.
- `diamond`: regola di **soppressione box** (Finding 4) + gemello `.mm-node:has(...)`
  per lo shrink. Il rombo lo disegna l'SVG, non il CSS.

---

## Finding 6 — Resize / aspect ratio

Config `NodeResizer` per i nodi shape IR — `ObjectNode.tsx` ramo IR (`:366-425`):

- `ObjectNode.tsx:373` — `const shapeForm = irResolution.compiled.form(irResolution.readCtx, irResolution.objectId);`
- `ObjectNode.tsx:374` — `const hasGeometricShape = shapeForm === 'ellipse';`
- `ObjectNode.tsx:380-388` — resizer montato solo se `isNodeResizable('objectNode', hasGeometricShape)`:
  ```tsx
  {isNodeResizable('objectNode', hasGeometricShape) && (
      <NodeResizer
          isVisible={selected}
          minWidth={SHAPE_MIN_SIZE}   // 24
          minHeight={SHAPE_MIN_SIZE}  // 24
          lineClassName="node-resize-line"
          handleClassName="node-resize-handle"
      />
  )}
  ```

Logica di `isNodeResizable` — `nodeSizing.ts:22-27`: se `hasGeometricShape===true`
ritorna `true` incondizionatamente; `SHAPE_MIN_SIZE = 24` (`nodeSizing.ts:16`).

**`keepAspectRatio` oggi**: **assente ovunque** (grep globale → 0 occorrenze). Il
resizer IR è a proporzioni libere (decisione faseB: OFF per ellipse, confermata). Il
`NodeResizer` di `@xyflow/react` supporta la prop `keepAspectRatio?: boolean` (import a
`ObjectNode.tsx`; stessa lib di ClassNode/EnumNode).

**Dove agganciare il lock 1:1 per il solo `circle`**:
- `ObjectNode.tsx:374` — estendere `hasGeometricShape` a `ellipse | circle | diamond`
  (tutte geometriche → resizer montato + shrink a `SHAPE_MIN_SIZE`).
- `ObjectNode.tsx:380-388` — aggiungere `keepAspectRatio={shapeForm === 'circle'}` sul
  `<NodeResizer>`. `ellipse` e `diamond` restano liberi; solo `circle` blocca 1:1.

> Altri nodi: `ClassNode.tsx:427,483` e `EnumNode.tsx:159` montano `NodeResizer` con
> `isNodeResizable('classNode'|'enumNode')` (senza flag geometrico) → **fuori scope**,
> non hanno ramo IR shape. La decisione shape/resize IR vive solo in `ObjectNode`.

---

## Finding 7 — Scaffolding poligonale riusabile

**Verdetto: NON esiste scaffolding poligonale attivo riutilizzabile per il diamond SVG
su questo branch.** Dettaglio della ricerca:

- `makePolygon` / `makeClipPath` → **0 occorrenze** in `frontend/src/` (grep). La
  formula `makeClipPath(makePolygon(...))` citata da CLAUDE.md (vocabolario del classico)
  **non è presente** in questo branch.
- `clip-path` / `clipPath` CSS-generativo per shape → solo `BottomBar.tsx:129-130`
  (badge SVG statico del footer, non riusabile) e riferimenti nei marker edge.
- `sharedTypes.tsx:190` — dichiara `sides?: number // for <Polygon />, <Star /> e <Cross />`:
  è solo la **prop di tipo**, senza implementazione di rendering nel tree corrente.
- `joiner/components.tsx:66-77` — registry di **cname** shape classiche (`N-Polygon`,
  `Polygon/Triangle`, `Polygon/Pentagon`, `Ellipse`, `Rectangle`, star variants, `Cross`):
  sono **etichette/nomi di classe**, non generatori di path/clip.
- `common/Geom.ts` — geometria **segmenti/linee** (intersezioni, `pointFromAngle` a
  `:1274` con `Math.cos/sin`); **nessun** export di helper poligonali (`polygon`,
  `regularPoly`, `ngon`, clip). Non riusabile as-is per un rombo.
- `diamond`/`rombo` altrove nel tree = **marker edge** (`filledDiamond`/`hollowDiamond`,
  `irTypes.ts:142-143`; `markerPresets.ts` "Diamonds") e **icone badge**
  (`bi-diamond-fill`, singleton) — semantica diversa, non geometria di nodo.

**Conclusione pratica**: il diamond SVG va scritto da zero. È banale e non richiede
libreria: 4 punti su un box `W×H` → `points="W/2,0 W,H/2 W/2,H 0,H/2"` (o `<path>`
equivalente), con `preserveAspectRatio="none"` sul `viewBox` così il rombo segue
qualsiasi aspect ratio senza distorcere lo stroke (proprio il motivo per cui è stato
scelto SVG e non clip-path/rotate). Nessun helper esistente da riusare; nessuna formula
da estrarre. Segnalato esplicitamente come richiesto dal prompt.

---

## Dipendenze e rischi

**Rischio 1 (alto) — soppressione box per diamond (Finding 4).** Il rischio principale.
Gli stili inline `background`/`border` di `IRNodeContent.tsx:99,104` vincono su qualsiasi
CSS senza `!important`. Per `diamond` il box rettangolare va soppresso **alla fonte**:
condizionare l'emissione degli inline (`if (form !== 'diamond')`) + regola CSS che azzera
`box-shadow`/`border-radius`/`background`/`border-color` su `.ir-shape--diamond`. Se si
tenta la sola via CSS senza toccare gli inline, il quadrato di sfondo/bordo resta visibile
dietro il rombo. Va progettata la soppressione condizionale **senza** rompere rect/rounded/
ellipse/circle (che continuano a dipingere il box).

**Rischio 2 (medio) — clipping dello stroke agli apici (Finding 4/5).** `overflow: hidden`
su `.ir-node-content` (`irStyle.ts:44`) + apici del rombo sui bordi del box → metà
`stroke-width` tagliata. Mitigazione: viewBox con padding, o `overflow: visible` sul solo
layer SVG (non sull'intero `.ir-node-content`, che deve continuare a clippare le label).

**Rischio 3 (basso) — doppia valutazione di `form`.** `form` è risolto due volte
(`IRNodeContent.tsx:35` per la classe, `ObjectNode.tsx:373` per il resizer). Coerenti oggi;
mantenere entrambi i siti allineati quando si estende l'union (specialmente `:374`).

**Rischio 4 (basso) — z-order badge/label vs SVG.** Il layer SVG del diamond va **dietro**
il contenuto: badge (`ir-badge`, `z-index:2`, `irStyle.ts:24`) e collapse-chip
(`z-index:3`, `ObjectNode.tsx:409`) devono restare sopra. Progettare l'SVG come primo
figlio con `z-index:0`/`position:absolute` sotto il flusso del contenuto.

**Nessun tocco alla critical zone**: nessuno dei punti d'innesto è in `useJjomSync.ts`,
`portDistribution.ts`, `canvasToJjom.ts` o nel memo feature-picker
(`VertexAuthoringPanel.tsx:93-151`). Nessuna migrazione VersionFixer richiesta: l'IR è
persistito come oggetto `ir` per-view; nuovi form sono valori dato, non cambiano lo schema
persistito dei default view (`defaultObjectViewIR` resta `form: 'rect'`).

**`validateIR` NON whitelista i form** (verificato): `irValidate.ts:16-24` si limita a
invocare `compileView`; `compileView` compila `form` via
`compileConditional(ir.shape.form, 'rect', deps)` (`irCompile.ts:260`) senza validare il
valore-foglia contro un set di form ammessi. Quindi `circle`/`diamond` passano la
validazione senza alcuna modifica a `irValidate.ts`/`irCompile.ts`.

---

## Domande aperte per Alfonso

1. **`circle` — comportamento pre-resize.** Prima di qualsiasi resize il nodo è
   content-hug; con `keepAspectRatio` attivo il lock 1:1 scatta solo quando l'utente
   trascina il resizer (come ellipse per lo shrink). Confermi che è accettabile che il
   circle "nasca" non-quadrato (dimensione iniziale del box) e diventi 1:1 solo al primo
   drag? Oppure serve un default size quadrato all'ingresso nel form circle?
2. **`diamond` — resize libero o vincolato?** Ho assunto diamond geometrico e
   **liberamente** ridimensionabile (aspect ratio qualsiasi, coerente con la motivazione
   SVG). Confermi che diamond NON deve avere keepAspectRatio (solo circle lo ha)?
3. **`diamond` — fallback fill.** Quando `compiled.fill` è vuoto, replico `var(--node-bg)`
   come fa il box oggi. Confermi che è il fallback voluto anche per il fill dell'SVG?

---

## HARD STOP

Report scritto. Nessun edit al codice di feature, nessun commit del codice. In attesa
del prompt di implementazione.
