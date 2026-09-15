# Fase 2 — Flag `resizable` sulle vertex view IR + resize di rect/rounded

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.
Se un punto di questo prompt contraddice `CLAUDE.md`, segnala il conflitto invece di eseguirlo.

Branch di lavoro: `alfonso-frontend-jjtl`.

Base del task: il discovery report `docs/discovery/discovery_2026-07-27_resizable_flag.md`
(Fase 1, gia' eseguita). I `file:riga` sotto vengono dal report; possono essere shiftati di
poche righe: **conferma leggendo il file** prima di ogni edit.

Alfonso autorizza esecuzione **single-phase**. Resta obbligatorio: (a) il passo 0 di orientamento
read-only qui sotto, (b) **HARD STOP dopo la build, nessun commit prima della conferma visiva**.

## Contesto (RCA gia' fatta, NON reimplementare la diagnosi)

Due obiettivi: (1) i nodi shape `rect` e `rounded` non hanno maniglie di resize mentre
ellipse/circle/diamond si'; (2) un flag `resizable` per bloccare/abilitare il resize per view.

Root cause (confermata dal report): in `ObjectNode.tsx` ramo IR, `hasGeometricShape` enumera solo
ellipse/circle/diamond, quindi rect/rounded non montano il `NodeResizer`. `shape.form` default a
`'rect'` per ogni vertex view (inclusi i box a compartimenti), quindi non si puo' aggiungere
rect/rounded alla lista in modo secco: serve un flag esplicito.

## Decisioni ratificate da Alfonso (NON rimetterle in discussione)

- **Schema**: nuovo campo **opzionale** `resizable?: boolean` su `VertexViewIR`. Boolean semplice,
  NON `Conditional`. Solo su `VertexViewIR`; **non** su `GraphVertexViewIR` (fuori scope: i
  graphVertex ricadono sul comportamento odierno).
- **Read path (Opzione A)**: leggere il flag da `irResolution.compiled.ir` (che conserva la view
  grezza intatta), con cast a `VertexViewIR`. **NON** toccare `irCompile.ts` ne' `irValidate.ts`
  (il report ha verificato: `compiled.ir === ir`, e validate non ha whitelist che rigetta campi
  nuovi).
- **Gate**: `canResize = resolvedResizable ?? hasGeometricShape`. Il flag esplicito vince; se
  assente, comportamento di oggi identico (backward-compatible). `resizable:false` rimuove le
  maniglie da qualsiasi shape (blocco), perche' `false` non e' nullish e vince sul `??`.
- **Floor rect/rounded fino a 24**: un rect/rounded marcato resizable deve poter scendere a
  `SHAPE_MIN_SIZE = 24` come le shape geometriche. Serve un neutralizer CSS **scopato** alla sola
  condizione resizable (classe marker `ir-resizable` emessa quando `canResize`), cosi' i box a
  compartimenti NON resizable restano invariati.
- **keepAspectRatio invariato**: resta `shapeForm === 'circle'`. rect/rounded ad aspect libero.
- **UI**: checkbox "Resizable" nel `VertexAuthoringPanel` (tab Basic), lontano dal memo
  feature-picker.
- **Helper condiviso**: la lista delle "forme geometriche resizable di default" va definita **una
  sola volta** (evitare drift) ed essere riusata da ObjectNode e dal pannello.

## Passo 0 — Orientamento read-only (OBBLIGATORIO, prima di ogni edit)

Da fare leggendo i file reali. Non produce un discovery report nuovo (la Fase 1 c'e' gia'); e' una
conferma dei punti d'innesto. Verifica e annota nella risposta finale:

1. In `ObjectNode.tsx`: le righe reali del ramo IR (`shapeForm`, `hasGeometricShape`, gate
   `isNodeResizable`, `<NodeResizer>`) e **quale elemento wrapper ObjectNode controlla
   direttamente** (`.mm-node`? un div root?). Serve a decidere dove emettere il marker `ir-resizable`
   (vedi COSA punto 4). Verifica se `VertexViewIR` e' gia' importato nel file.
2. In `VertexAuthoringPanel.tsx`: **come il pannello legge il valore corrente di `shape.form`** per
   passarlo al `ConditionalEditor` (Q6/Q2 del report: `form` e' `Conditional<ShapeForm>`). Serve per
   calcolare lo stato di default del checkbox. E conferma la riga del memo feature-picker
   (`~:95-153`) da cui stare lontano.
3. Se un componente `Checkbox`/`Switch` esiste in `components/ui` (o equivalente design-system):
   nome e path. Se non esiste, si usa `<input type="checkbox">` con le classi del design system.

Se uno di questi tre punti risulta diverso da quanto assunto qui (es. ObjectNode non controlla
`.mm-node`, o il form corrente non e' leggibile come stringa piana), **fermati e segnalalo** prima
di implementare: adatto il piano.

## Ambito file (6 in scrittura; nessun altro)

Poiche' i file toccati sono piu' di 3, la lista con cosa cambia in ciascuno e' qui sotto; procedi
solo dopo il passo 0. Se servisse un file in piu', fermati e chiedi.

- EDIT: `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (campo schema)
- EDIT: `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (helper condiviso)
- EDIT: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (gate + marker)
- EDIT: `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (checkbox)
- EDIT: `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` (neutralizer scopato)
- EDIT: `docs/claude-code-log.md` (entry finale)

Fuori perimetro, non toccare: `irCompile.ts`, `irValidate.ts`, `useJjomSync.ts`,
`portDistribution.ts` (critical zone), l'editor classico, il memo feature-picker in
`VertexAuthoringPanel.tsx`, `GraphVertexViewIR`. Se possibile **non** toccare il path reattivo
`IRNodeContent` (vedi punto 4: preferisci il wrapper controllato da ObjectNode).

## COSA

### 1. Schema — `irTypes.ts`

Aggiungi il campo opzionale a `VertexViewIR` (dopo `label?`, ~:107-108):

```ts
    label?: string;
    resizable?: boolean;   // v1: override esplicito del gate resize (undefined = default per forma)
    shape: ShapeSpec;
```

Solo `VertexViewIR`. Non toccare `GraphVertexViewIR` ne' altri view type. Verifica con grep che
`resizable` non sia gia' un identificatore usato nel modulo.

### 2. Helper condiviso — `nodeSizing.ts`

Prima di creare il nome, **grep globale** che `defaultResizableForForm` non sia gia' in uso.
Aggiungi (non rinominare nulla di esistente; `isNodeResizable` e `NODE_SIZING_DEFAULTS` restano
invariati):

```ts
import type { ShapeForm } from '../viewpoint/ir/irTypes';   // conferma il path relativo reale

// Forme geometriche ridimensionabili di default (unico punto di verita', usato da ObjectNode e
// dal VertexAuthoringPanel). rect/rounded NON sono qui: diventano resizable solo col flag.
export function defaultResizableForForm(form: ShapeForm | undefined): boolean {
    return form === 'ellipse' || form === 'circle' || form === 'diamond';
}
```

Se importare `ShapeForm` in `nodeSizing.ts` crea un ciclo di import, definisci l'helper altrove
(es. accanto a `ShapeForm` in `irTypes.ts`) e importalo nei due consumer: l'importante e' **una sola
definizione**. Segnala quale sede hai scelto.

### 3. Gate — `ObjectNode.tsx` (ramo IR)

Se non presente, importa `VertexViewIR` (e usa `defaultResizableForForm`). Ai `file:riga` reali
(~:373-380 dal report):

```ts
const shapeForm = irResolution.compiled.form(irResolution.readCtx, irResolution.objectId);
const hasGeometricShape = defaultResizableForForm(shapeForm);
const resolvedResizable = (irResolution.compiled.ir as VertexViewIR).resizable;
const canResize = resolvedResizable ?? hasGeometricShape;
```

Gate del resizer (~:380): sostituisci `hasGeometricShape` con `canResize`:

```tsx
{isNodeResizable('objectNode', canResize) && (
    <NodeResizer
        isVisible={selected}
        minWidth={SHAPE_MIN_SIZE}
        minHeight={SHAPE_MIN_SIZE}
        keepAspectRatio={shapeForm === 'circle'}
        lineClassName="node-resize-line"
        handleClassName="node-resize-handle"
    />
)}
```

`keepAspectRatio`, `minWidth/minHeight`, le classi: **invariati**. Non toccare il ramo nativo
(`isNodeResizable('objectNode')` senza secondo argomento).

### 4. Marker `ir-resizable` per il neutralizer scopato

Emetti la classe `ir-resizable` **solo quando `canResize` e' true**, sull'elemento che il
neutralizer CSS del punto 5 puo' targettare. **Grep globale** che `ir-resizable` non sia gia' una
classe esistente (collisione CSS = bug visivo silenzioso).

- **Preferito** (nessun tocco al path reattivo `IRNodeContent`): se ObjectNode rende direttamente il
  wrapper `.mm-node` del ramo IR, aggiungi `ir-resizable` alla sua `className` in modo additivo
  (`clsx`/template, preservando le classi esistenti). Il CSS del punto 5 usa `.mm-node.ir-resizable`.
- **Fallback** (solo se ObjectNode non controlla `.mm-node`): aggiungi `ir-resizable` a
  `.ir-node-content` accanto a `ir-shape--${form}`, additivo, senza alterare l'emissione esistente
  della classe shape; il CSS del punto 5 usa `.mm-node:has(> .ir-node-content.ir-resizable)`.

Dichiara nel report finale quale delle due strade hai usato e su quale elemento.

### 5. Neutralizer CSS scopato — `irStyle.ts`

Specchio della regola ellipse esistente (~:57-58), ma keyed sul marker resizable (copre rect/rounded;
la sovrapposizione con le shape geometriche, che hanno gia' i loro neutralizer, e' innocua). Usa il
selettore coerente con la strada scelta al punto 4. Esempio (variante wrapper-class):

```css
.mm-node.ir-resizable {
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
}
```

oppure (variante `:has`, se hai messo il marker su `.ir-node-content`):

```css
.mm-node:has(> .ir-node-content.ir-resizable) {
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
}
```

Non toccare le regole `rect`/`rounded`/`ellipse`/`circle`/`diamond` esistenti. Non modificare regole
condivise con l'editor classico (grep dove ogni classe e' usata prima di toccarla).

### 6. Checkbox "Resizable" — `VertexAuthoringPanel.tsx`

Nel tab Basic, come nuovo campo top-level accanto a Label o Border (blocco ~:214-253), **lontano
dai due `useMemo`** (feature-picker ~:95-153 e classNames). Il campo e' top-level, quindi si patcha
come `label`, NON come `shape.form`:

```tsx
onChange={(checked) => patch({ ...draft, resizable: checked })}
```

Stato mostrato dal checkbox (rispecchia il gate a runtime): `draft.resizable ?? defaultResizableForForm(<form corrente>)`, dove `<form corrente>` e' il valore piano di `shape.form` letto come nel passo 0
punto 2. Se `shape.form` e' un Conditional non riducibile a stringa piana, usa `false` come default
(caso raro di authoring; segnalalo). Usa il componente `Checkbox` del design system se esiste (passo
0 punto 3), altrimenti `<input type="checkbox">` con le classi del design system (slate `#334155`).
Una `HelpText` breve: "Forza le maniglie di resize. Deseleziona per bloccarlo. Non impostato: segue
la forma."

**VINCOLO**: non toccare il memo `featureInfo` (~:95-153) ne' i suoi deps. Il campo `resizable` non
entra in `draft.metaclasses` ne' `appliableToClasses`, quindi non deve comparire in nessun array di
dipendenze dei memo.

## COME

- Passo 0 prima di tutto. Leggi per intero ogni file prima di editarlo.
- Edit puntuali (str_replace), non riscritture. **Zero refactoring opportunistico.** L'unica
  astrazione nuova consentita e' `defaultResizableForForm` (punto 2), esplicitamente autorizzata;
  non rinominare `hasGeometricShape` altrove, non riordinare import.
- Grep di collisione **prima** di introdurre `resizable` (campo), `defaultResizableForForm`
  (funzione), `ir-resizable` (classe CSS).
- Non modificare le interfacce TS esistenti oltre all'aggiunta del campo opzionale.
- `npm run build` deve passare pulito.
- **HARD STOP dopo la build.** Niente commit, niente `git add`. Aggiorna `docs/claude-code-log.md`
  (data 2026-07-27 + ora, tipo `feat`, prompt in una riga, file toccati, esito, e: strada scelta al
  punto 4, sede dell'helper al punto 2, componente checkbox usato).
- Commit SOLO dopo conferma visiva di Alfonso. `git add` dei **soli** file dichiarati (mai
  `git add .`, mai `git commit -a`). Messaggio previsto, una riga inglese:
  `feat: add resizable flag to IR vertex views and enable rect/rounded resize`

## Verifica manuale (Alfonso, http://localhost:3001, hard-refresh tra i passi)

1. **rect/rounded resizable**: su una vertex view IR rounded (es. la "Transition"), imposta
   `resizable` (checkbox) e verifica che compaiano le maniglie; il nodo si rimpicciolisce fino a
   ~24px come il circle; la label va in ellipsis e poi sparisce, il box resta pulito. Idem `rect`.
2. **Default invariato**: una vertex view senza flag si comporta come oggi: ellipse/circle/diamond
   con maniglie, rect/rounded senza. Nessun box a compartimenti ha maniglie nuove.
3. **Blocco**: metti `resizable:false` (checkbox deselezionato) su un circle/ellipse: le maniglie
   spariscono.
4. **Checkbox coerente**: aprendo il pannello di un circle mai toccato, il checkbox appare gia'
   spuntato (default per forma); di un rect mai toccato, non spuntato.
5. **Persistenza**: uno shape reso resizable e rimpicciolito mantiene size e flag dopo save +
   refresh. (Nota attesa, non un difetto: mettere `resizable` su una view *migrated-default* la fa
   passare al rendering IR, come qualunque altro edit di default view.)
6. **Nessuna regressione**: box a compartimenti (class diagram) invariati; package invariato; build
   pulita, nessun errore console sui nodi.

## RIFERIMENTI

- Discovery report: `docs/discovery/discovery_2026-07-27_resizable_flag.md` (Q1..Q7, verdetto Q5,
  proposta file).
- Gate e sizing: `nodes/ObjectNode.tsx` (ramo IR ~:373-389), `nodes/nodeSizing.ts`
  (`isNodeResizable`, `SHAPE_MIN_SIZE = 24`).
- Schema: `viewpoint/ir/irTypes.ts` (`VertexViewIR` ~:100-111, `ShapeForm` ~:38,
  `CompiledView.ir` ~:281).
- Stile shape e neutralizer ellipse da specchiare: `viewpoint/ir/irStyle.ts` (~:57-58).
- Pannello: `viewpoint/authoring/VertexAuthoringPanel.tsx` (write pattern `label` ~:216, memo
  feature-picker ~:95-153, blocco campi Basic ~:214-253).
- Precedenti: `2026-07-24_prompt_fase2_shape_free_resize_content_hug.md`,
  `2026-07-24_prompt_fase2_shape_circle.md` (KB progetto).
