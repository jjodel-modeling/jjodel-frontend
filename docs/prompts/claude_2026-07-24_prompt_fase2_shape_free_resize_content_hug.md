# Fase 2 — Resize dei nodi in editor-v2: shape nodes liberi sotto la label, text cards content-hug

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente. Se un punto di questo prompt contraddice `CLAUDE.md`, segnala il conflitto invece di eseguirlo.

**Questo prompt SOSTITUISCE integralmente** `2026-07-23_prompt_fase2_resize_affordance_content_hug.md` (mai eseguito). Motivo: la decisione "all-or-nothing, niente resizer su objectNode" è stata invalidata da un controesempio sul ramo IR. Un Object che risolve una view IR con shape geometrica (es. ellipse, la "pallina" delle state machine) DEVE poter essere ridimensionato liberamente, anche sotto la dimensione della label; oggi invece esiste un minimo non riducibile. Le due cose si implementano insieme perché toccano gli stessi siti.

Alfonso ha autorizzato l'esecuzione **single-phase** (niente Fase 1 separata con hard stop intermedio). Resta obbligatorio: (a) il passo 0 di orientamento read-only con report sintetico salvato, (b) **HARD STOP dopo la build, nessun commit prima della conferma visiva di Alfonso**.

## Decisioni ratificate e emendamento (non rimetterle in discussione)

Confermate dal report `docs/discovery/discovery_2026-07-23_classic_node_resize_sizing.md` §12:

- **Editor**: editor-v2 (React Flow). Il classico è fuori scope.
- **Sorgente non-runtime**: costante per tipo di nodo, nessun plumbing dei flag `adaptWidth`/`adaptHeight` da `views.ts` (decisione D4).
- **Perimetro**: solo layer di interazione + CSS strettamente necessario al punto 3. Nessun cambio al data model, ai flag, a `views.ts`, nessun campo nuovo in `ObjectNodeData`, nessun VersionFixer.
- **Feedback di selezione**: resta (`.mm-node.selected`/`.mm-object.selected`). Non toccarlo.
- **packageNode**: fuori scope, invariato.

**EMENDAMENTO (deciso 2026-07-24)**: il discriminante del resize non è solo il tipo di nodo, è la shape. Regola finale:

- Text cards (object/class/enum senza shape geometrica): content-hug su entrambi gli assi, **nessuna maniglia** (come nel prompt superato).
- Shape nodes (Object su ramo IR la cui view risolta dichiara una shape geometrica, es. `ellipse`): **resizer montato, resize libero su entrambi gli assi, floor minimo `SHAPE_MIN_SIZE = 24`**. La label NON impone il minimo.
- Politica label quando la shape è più piccola del testo (**decisione A**, ratificata): la label resta dentro la shape, centrata, con `text-overflow: ellipsis` e clip; a dimensioni molto piccole di fatto sparisce. La variante B (label esterna sotto la shape) è uno slice futuro, **fuori scope**: non implementarla, non predisporla.
- Aspect ratio libero (una ellipse può essere non circolare). NON attivare `keepAspectRatio` del NodeResizer.

## Passo 0 — Orientamento read-only (OBBLIGATORIO, prima di ogni edit)

Obiettivo: individuare dove nasce il minimo dimensionale della shape e confermare il perimetro. Da fare leggendo i file reali (le righe citate sotto possono essere shiftate).

1. In `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, ramo IR: dove la shape della view IR risolta (es. `ellipse`) diventa rendering (classe CSS, `border-radius`, style inline). Il lavoro pregresso sulla shape CSS è del filone faseB IR (vedi log); parti da lì e da un grep su `ellipse` / `border-radius: 50%` in `frontend/src/components/editor-v2/` e negli SCSS collegati.
2. Censisci TUTTE le sorgenti del minimo dimensionale del nodo shape, con file:riga: (a) props `minWidth`/`minHeight` del `NodeResizer` esistente; (b) `min-width`/`min-height`/`padding` nelle classi CSS/SCSS del nodo e della shape; (c) contenuto interno (label) che forza la min-size intrinseca via flex/grid; (d) eventuali `width`/`height`/`style` emessi dal transformer (`sync/jjomTransformers.ts`, SOLO lettura, vedi punto 4).
3. **Guardia di perimetro**: se scopri che la shape ellipse NON passa dal ramo IR di `ObjectNode` in editor-v2 (es. il caso della pallina vive solo nell'editor classico), FERMATI: scrivi il report del passo 0 con questa conclusione, nessuna modifica al codice, e segnala. Il classico è fuori scope e richiede un prompt diverso.
4. Salva il report sintetico in `docs/discovery/discovery_2026-07-24_shape_node_min_resize.md` (creare la cartella se manca). Contenuto minimo: obiettivo, file letti con path completi, sorgenti del minimo con file:riga, file SCSS che verrà toccato al punto 3 del COSA, rischi, domande aperte. Nessun hard stop dopo il report: prosegui con l'implementazione nello stesso run, salvo scatti la guardia del punto 3.

## Ambito file

In scrittura (conferma la lista nel report prima di editare; se servisse un file in più, fermati e chiedi):

- NUOVO: `frontend/src/components/editor-v2/nodes/nodeSizing.ts`
- EDIT: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `ClassNode.tsx`, `EnumNode.tsx`
- EDIT: UN solo file SCSS, quello individuato al passo 0 come sede delle regole della shape (dichiararlo nel report)
- NUOVO: `docs/discovery/discovery_2026-07-24_shape_node_min_resize.md`
- `docs/claude-code-log.md` (entry finale)

READ-ONLY: `frontend/src/components/editor-v2/sync/jjomTransformers.ts`.

Fuori perimetro, non toccare: `packageNode`, `views.ts`, data model e flag, `useJjomSync.ts`, `portDistribution.ts` (critical zone), l'editor classico, `VertexAuthoringPanel.tsx` (ha un hard stop suo per il bug feature-picker, non c'entra con questo task).

Poiché i file toccati sono più di 3: prima di procedere elenca tutti i file e cosa cambierà in ciascuno (può stare nel report del passo 0), poi implementa.

## COSA

### 1. Costante di sizing (unico punto di verità)

Prima di creare i nomi, **grep globale** che `NODE_SIZING_DEFAULTS`, `NodeSizing`, `isNodeResizable`, `SHAPE_MIN_SIZE` non siano già in uso.

Crea `frontend/src/components/editor-v2/nodes/nodeSizing.ts`:

```ts
// Affordance di resize per tipo di nodo in editor-v2.
// Specchio TEMPORANEO dei flag adaptWidth/adaptHeight dichiarati per view in
// redux/defaults/views.ts: quei flag NON sono cablati fino a editor-v2 (niente
// plumbing R6, decisione D4). Quando il sizing passera' nell'IR, QUESTA mappa e'
// il punto unico da sostituire.
export interface NodeSizing { adaptWidth: boolean; adaptHeight: boolean; }

export const NODE_SIZING_DEFAULTS: Record<string, NodeSizing> = {
    objectNode: { adaptWidth: true, adaptHeight: true },
    classNode:  { adaptWidth: true, adaptHeight: true },
    enumNode:   { adaptWidth: true, adaptHeight: true },
    // packageNode: intenzionalmente assente (container libero, fuori scope).
};

// Floor del resize per i nodi shape (view IR con shape geometrica).
export const SHAPE_MIN_SIZE = 24;

// Un nodo e' ridimensionabile a mano solo se: (a) ha una shape geometrica
// (emendamento 2026-07-24: la geometria vince sul content-hug), oppure
// (b) almeno un asse NON e' content-adaptive.
// Tipo non mappato (es. packageNode) => comportamento invariato: resizer montato.
export function isNodeResizable(type: string | undefined, hasGeometricShape = false): boolean {
    if (hasGeometricShape) return true;
    const s = type ? NODE_SIZING_DEFAULTS[type] : undefined;
    if (!s) return true;
    return !s.adaptWidth || !s.adaptHeight;
}
```

### 2. Gate del NodeResizer

Ai siti sotto (verifica i numeri di riga sul file reale), avvolgi il **mount esistente** del `NodeResizer` con `isNodeResizable(...)`, **preservando tutte le condizioni/props già presenti** (es. `selected`).

- `ClassNode.tsx:426` e `:480` → `isNodeResizable('classNode')` (mai shape: sempre niente resizer)
- `EnumNode.tsx:158` → `isNodeResizable('enumNode')` (idem)
- `ObjectNode.tsx:374` (ramo nativo) → `isNodeResizable('objectNode')` (le view native non hanno shape: niente resizer)
- `ObjectNode.tsx:422` (ramo IR) → `isNodeResizable('objectNode', hasGeometricShape)`, dove `hasGeometricShape` è derivato dalla view IR risolta **già disponibile nel componente** (il ramo IR la risolve per renderizzare): `shape` definita e diversa dal box rettangolare di default. Verifica al passo 0 i valori reali dell'enum shape nel codice; non inventare valori.

Quando il resizer È montato (shape node), passa esplicitamente `minWidth={SHAPE_MIN_SIZE}` e `minHeight={SHAPE_MIN_SIZE}`, sostituendo eventuali minimi più alti già presenti sulle props. Non aggiungere `keepAspectRatio`.

### 3. Neutralizzare il minimo lato CSS/contenuto (solo shape nodes)

Nel file SCSS individuato al passo 0, e SOLO per l'elemento shape del ramo IR (usa un selettore già esistente della shape oppure, se serve una classe nuova, grep di collisione prima di crearla):

- l'elemento che porta la shape deve obbedire alle dimensioni del nodo: `min-width: 0; min-height: 0;` e rimozione/riduzione di padding che impedisca di raggiungere il floor di 24px;
- la label dentro la shape: centrata, `max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` così il testo non forza mai la min-size intrinseca (se il contenitore è flex, servirà `min-width: 0` anche sul figlio che contiene il testo);
- `overflow: hidden` sull'elemento shape per il clip pulito ai bordi della curva.

Non toccare le regole delle text cards, del selected, né classi usate anche dall'editor classico (verifica con grep dove ogni classe è usata prima di modificarla; se una regola è condivisa col classico, introduci un selettore più specifico per il ramo IR invece di modificare la regola condivisa).

### 4. Conferma read-only sul transformer (NIENTE modifica)

Leggi `sync/jjomTransformers.ts`: i nodi object/class/enum ricevono `width`/`height`/`style` dal transformer, sì o no? Scrivi la risposta nel report e nel log. **Non modificare il transformer.** Se emette dimensioni esplicite per questi tipi, due rischi da segnalare come follow-up (adiacente alla critical-zone del sync, richiede go-ahead separato): text card già ridimensionata che resta intrappolata grande e senza maniglia; shape node che al reload perde la size impostata a mano.

## COME

- Leggi per intero ogni file prima di editarlo; capisci a cosa è già condizionato il mount del resizer e preserva quelle condizioni.
- Edit puntuali (str_replace), non riscritture. Nessun rinomino di identificatori esistenti. Nessun refactoring opportunistico.
- `npm run build` deve passare pulito.
- **HARD STOP dopo la build.** Niente commit. Aggiorna `docs/claude-code-log.md` (data, tipo `fix`, prompt in una riga, file toccati, esito, risposta del punto 4).
- `git add` solo dei file dichiarati (mai `git add .`, mai `git commit -a`). Commit SOLO dopo conferma visiva di Alfonso.
- Commit message previsto (dopo l'OK), una riga inglese: `fix: free-resize shape nodes below label size and content-hug text nodes in editor-v2`

## Verifica manuale (Alfonso, http://localhost:3001, hard-refresh tra i passi)

1. **Pallina ellipse (ramo IR)**: maniglie presenti; si rimpicciolisce ben sotto la larghezza della label, fino a ~24px; durante la riduzione la label va in ellipsis e poi sparisce, la shape resta pulita (niente testo che sborda). Si allarga liberamente, anche non circolare.
2. **Object/Class/Enum text card**: nessuna maniglia; selezione con bordo accent presente; la card abbraccia il contenuto; niente frame fantasma.
3. **Package**: maniglie e resize invariati.
4. **Reload**: uno shape node rimpicciolito mantiene la size dopo save + refresh. Se torna grande, è il follow-up transformer del punto 4, non un difetto di questo prompt: segnalarlo e basta.
5. Build pulita, nessun errore console legato ai nodi.

## RIFERIMENTI

- Prompt superato: `2026-07-23_prompt_fase2_resize_affordance_content_hug.md` (knowledge base progetto). Le parti text-card sono riprese identiche; cambia il ramo IR con shape.
- Report discovery classico: `docs/discovery/discovery_2026-07-23_classic_node_resize_sizing.md` §12 (D4, decisione B ora emendata, R2 persisted geometry).
- Filone shape CSS IR: entry di log faseB (2026-07-22, fix shape css e ristratificazione box).
- Caso motivante: nodo Object "pallina2" con shape ellipse, non riducibile sotto un minimo molto più grande della label.
