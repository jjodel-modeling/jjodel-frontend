# Fase 2 — Affordance di resize per-tipo (editor-v2): content-hug per object/class/enum

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente. Base del task: il tuo report di discovery (`docs/discovery/discovery_2026-07-23_classic_node_resize_sizing.md`, §12 decisioni ratificate). Se un punto di questo prompt contraddice `CLAUDE.md`, segnala il conflitto invece di eseguirlo.

Questa è la Fase 2 (implementazione), autorizzata dopo go-ahead. **HARD STOP dopo la build, nessun commit prima della conferma visiva di Alfonso.**

## Decisioni ratificate (non rimetterle in discussione)

- **Editor**: editor-v2 (React Flow). Il classico è fuori scope.
- **Semantica per-asse, sorgente non-runtime**: il comportamento di ogni asse deriva da due booleani `adaptWidth`/`adaptHeight`, ma la sorgente NON è `view.adaptWidth/adaptHeight` letto a runtime (niente plumbing R6, decisione D4). È una **costante per tipo di nodo** che replica i valori che quelle view hanno oggi in `redux/defaults/views.ts`.
- **Wiring minimale (all-or-nothing)**: object/class/enum sono tutti a `true/true`, quindi l'unico ramo reale è "nessuna maniglia". Monta **condizionalmente** il `NodeResizer` (0 o 8 maniglie). NON introdurre `NodeResizeControl` + `resizeDirection` (macchina per-asse): sarebbe codice non esercitato. La costante resta comunque per-asse, così l'estensione futura è pura implementazione.
- **Perimetro**: solo il layer di interazione. Nessun cambio al data model, ai flag, a `views.ts`, nessun campo nuovo in `ObjectNodeData`, nessun CSS, nessun VersionFixer.
- **Tipi in scope**: `objectNode`, `classNode`, `enumNode`, su **entrambi** i rami (nativo e IR). `packageNode` fuori scope, invariato.
- **Feedback di selezione**: resta (`.mm-node.selected`/`.mm-object.selected`, indipendenti dal resizer). Non toccarlo.

## Ambito file (4 in scrittura, 1 in lettura; nessun altro)
- NUOVO: `frontend/src/components/editor-v2/nodes/nodeSizing.ts`
- EDIT: `frontend/src/components/editor-v2/nodes/ObjectNode.tsx`, `ClassNode.tsx`, `EnumNode.tsx`
- READ-ONLY: `frontend/src/components/editor-v2/sync/jjomTransformers.ts` (solo punto 3)
- `docs/claude-code-log.md` (entry finale)

Fuori perimetro, non toccare: `packageNode`, `views.ts`, qualsiasi flag/data model, qualsiasi CSS, `useJjomSync.ts`, `portDistribution.ts`.

## COSA

### 1. Nuova costante (unico punto di verità)

Prima di creare i nomi, **grep globale** che `NODE_SIZING_DEFAULTS`, `NodeSizing`, `isNodeResizable` non siano già in uso.

Crea `frontend/src/components/editor-v2/nodes/nodeSizing.ts` (se esiste già un file di costanti condiviso tra i nodi, mettilo lì; verifica prima):

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

// Un nodo e' ridimensionabile a mano solo su un asse NON content-adaptive.
// Wiring minimale (decisione B): all-or-nothing. Entrambi true => niente resizer.
// Tipo non mappato (es. packageNode) => comportamento invariato: resizer montato.
export function isNodeResizable(type: string | undefined): boolean {
    const s = type ? NODE_SIZING_DEFAULTS[type] : undefined;
    if (!s) return true;
    return !s.adaptWidth || !s.adaptHeight;
}
```

### 2. Gate del NodeResizer ai siti in perimetro

Ai siti sotto (verifica i numeri di riga sul file reale, possono essere shiftati), avvolgi il **mount esistente** del `NodeResizer` con `isNodeResizable(<type>)`, **preservando tutte le altre condizioni/props gia' presenti** (es. `selected`). Non cambiare nient'altro del resizer.

- `ObjectNode.tsx:374` (nativo) e `:422` (ramo IR) → gate con `isNodeResizable('objectNode')`
- `ClassNode.tsx:426` e `:480` → `isNodeResizable('classNode')`
- `EnumNode.tsx:158` → `isNodeResizable('enumNode')`

Se il `type` e' gia' disponibile dalle props del nodo (React Flow passa `type`), usalo purche' risolva a `objectNode`/`classNode`/`enumNode`; altrimenti la stringa letterale per-componente va bene. Entrambi i rami di ObjectNode/ClassNode usano lo stesso tipo: comportamento identico nativo e IR (decisione A, no divergenza).

Esito atteso: object/class/enum non montano il resizer (nessuna maniglia); package e ogni altro tipo restano identici a oggi.

### 3. Conferma read-only sul transformer (NIENTE modifica)

Il report (R2) dice che togliere il resizer basta perche' i transformer di object/class/enum non emettono `style` e `node.width/height` li scriveva solo il NodeResizer. **Confermalo leggendo** `jjomTransformers.ts`: i nodi object/class/enum ricevono `width`/`height`/`style` dal transformer, si' o no? Scrivi la risposta nel log e nella risposta finale. **Non modificare il transformer.** Se emette dimensioni esplicite per questi tipi (rischio "nodo gia' ridimensionato che resta intrappolato, grande e senza maniglia"), fermati e segnalalo come follow-up obbligatorio: e' adiacente alla critical-zone del sync e richiede go-ahead + Layer Impact Report separati.

## COME
- Leggi per intero ogni sito prima di editarlo; capisci a cosa e' gia' condizionato il mount del resizer e preserva quelle condizioni.
- Edit puntuali (str_replace), non riscritture. Nessun rinomino di identificatori esistenti. Nessun refactoring opportunistico.
- `npm run build` deve passare pulito.
- **HARD STOP dopo la build.** Niente commit. Aggiorna `docs/claude-code-log.md` (data, tipo `fix`, prompt in una riga, file toccati, esito, la risposta del punto 3).
- `git add` solo dei file dichiarati (mai `git add .`). Commit SOLO dopo conferma visiva di Alfonso.
- Commit message previsto (dopo l'OK), una riga inglese: `fix: content-hug object/class/enum nodes by gating NodeResizer on per-type sizing`

## Verifica manuale (Alfonso, http://localhost:3001, hard-refresh tra i passi)
1. Object/Class/Enum **nuovi**: nessuna maniglia; selezione con bordo accent + shadow presente; la card abbraccia il contenuto; niente frame fantasma.
2. **Package**: maniglie invariate, resize funziona come prima.
3. **Nodo gia' ridimensionato a mano prima del fix** (progetto salvato con un Object/Class ingrandito): ricarica → deve fare content-hug, NON restare grande e senza maniglia. Se resta intrappolato → e' il follow-up transformer del punto 3, non un difetto di questo prompt.
4. **Ramo IR**: un Object che risolve una view IR si comporta come il nativo (nessuna maniglia), nessuna divergenza.
5. Build pulita, nessun errore console legato ai nodi.

## RIFERIMENTI
- Report discovery §12: semantica per-asse (D2) + sorgente costante non-runtime (D4); wiring minimale (B); IR branch allineato al nativo (A); R2 (persisted geometry).
- Siti: `ObjectNode.tsx:374`/`:422`, `ClassNode.tsx:426`/`:480`, `EnumNode.tsx:158`.
- Destinazione futura annotata: il sizing passa nell'IR; `NODE_SIZING_DEFAULTS` e' il punto unico di sostituzione.
