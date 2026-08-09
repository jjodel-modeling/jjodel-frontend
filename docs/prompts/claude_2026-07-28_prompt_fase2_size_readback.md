# Fase 2 — Read-back della size degli object node IR (persistenza resize al reload)

> **Nome del documento prompt**: 2026-07-28 21:07
> Esecuzione **single-phase autorizzata** con **Passo 0 read-only minimo + HARD STOP se diverso**, e
> **HARD STOP dopo la build (nessun commit prima della conferma visiva di Alfonso)**.

Leggi `CLAUDE.md`. Se un punto contraddice `CLAUDE.md`, segnala il conflitto. Leggi
`docs/claude-code-log.md`. Branch: `alfonso-frontend-jjtl`.

Base: `docs/discovery/discovery_2026-07-28_size_readback.md` (Fase 1 già eseguita). I `file:riga`
possono essere shiftati: **conferma leggendo il file**.

Prerequisito d'ordine: questa è la **terza commit tematica**, dopo Commit 1 (edge-gap) e Commit 2
(`ir-sized`) del filone size↔geometria. Deve stare **sopra** di essi nel working tree (compone con
`ir-sized`).

## Contesto e verdetto della discovery (NON reimplementare la diagnosi)

Ridimensioni un object node → `syncSizeToJjom` scrive `DVertex.w/h` (persistite nel modello) → ma
`objectVertexToRFNode` (`utils/jjomTransformers.ts`) legge **solo x/y** e non emette width/height,
quindi al reload la size non torna. La discovery ha stabilito:

- Emettere `width`/`height` **top-level** (come `NodeResizer`/propagazione, NON `style`) fa comporre
  il read-back con `ir-sized` (al load `nodeLookup.width/height` → `hasExplicitSize` → il box rende
  alla size salvata) e **NON** risveglia il gate `sizeChanged` di `useJjomSync` (che confronta
  `style.width/height`, mai toccato per gli object node). → **fuori critical zone, niente LIR.**
- Emettere **solo** quando `raw.w/raw.h` sono `number` (mai il fallback 400/300 di
  `packageVertexToRFNode`): assente → niente emissione → content-hug preservato.
- **Nessun gate** sul flag `resizable` (opzione i ratificata): una view content-hug/`undefined` non ha
  mai `raw.w/h`, quindi non emette comunque; il caso "size stantia su view `resizable:false`" è
  deferred al size-default-lock.

## Decisioni ratificate (NON rimetterle in discussione)

- Emissione **top-level** `width`/`height` (mai `style`).
- Condizione: **solo** `typeof raw.w === 'number' && typeof raw.h === 'number'`.
- **Nessun** gate `resizable`, **nessuno** schema nuovo, **nessun** tocco a `useJjomSync`/critical zone.
- Scope: **il solo `objectVertexToRFNode`** (+ entry di log).

## Passo 0 — Orientamento read-only (OBBLIGATORIO, HARD STOP se diverso)

Leggi `utils/jjomTransformers.ts` e conferma:
1. Il punto in `objectVertexToRFNode` dove legge `raw` e `raw.x/raw.y` (~:243, ~:324-326) e la **forma
   esatta dell'oggetto nodo RF ritornato** (~:328-338): è un oggetto letterale con `position`, `data`,
   `type`, ecc.? Serve a sapere **dove** aggiungere `width`/`height` **top-level** (fratelli di
   `position`, NON dentro `style`, NON dentro `data`).
2. Che `raw.w`/`raw.h` siano accessibili lì come i `raw.x/raw.y` (stesso `raw = vertex.__raw ?? vertex`).
3. Il pattern di `packageVertexToRFNode` (~:221-232) **solo come riferimento** del punto di emissione:
   **NON** replicare il suo fallback `400/300`.

Se la forma del nodo ritornato è materialmente diversa (es. non è un letterale, o la size andrebbe
per forza in `style`), **FERMATI e segnala** prima di editare.

## Ambito file (nessun altro)

- EDIT: `frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`objectVertexToRFNode` soltanto)
- EDIT: `docs/claude-code-log.md` (entry finale)

**Fuori perimetro, NON toccare**: `hooks/useJjomSync.ts` e `utils/portDistribution.ts` (critical
zone), `sync/canvasToJjom.ts`, `nodes/ObjectNode.tsx` / `viewpoint/ir/irStyle.ts` (Commit 1/2 già
fatti, compongono), `viewpoint/ir/irTypes.ts` (niente schema), `packageVertexToRFNode` e gli altri
transformer.

## COSA

In `objectVertexToRFNode`, dopo la lettura di `raw.x/raw.y`, leggi `raw.w`/`raw.h` ed **emetti
`width`/`height` top-level solo se entrambe sono `number`**. Edit puntuale, esempio (adatta ai nomi/forma reali del return):

```ts
// dentro objectVertexToRFNode, sul return dell'oggetto nodo RF:
const w = (raw as any).w;
const h = (raw as any).h;
const hasPersistedSize = typeof w === 'number' && typeof h === 'number';
return {
    // ...campi esistenti invariati (id, type, position, data, ...)
    ...(hasPersistedSize ? { width: w, height: h } : {}),
};
```

Vincoli:
- `width`/`height` **top-level** (fratelli di `position`), **non** in `style`, **non** in `data`.
- **Nessun** fallback numerico: se `w`/`h` non sono `number`, non aggiungere nulla (spread vuoto).
- **Non** toccare la lettura x/y, il `type`, il `data`, né altri rami del transformer.
- **Nessun** gate `resizable`.

## COME

- Passo 0 prima dell'edit; leggi l'intera funzione prima di editarla.
- Edit puntuale (`str_replace`), zero refactoring opportunistico, nessun rinomino.
- `npm run build` pulito. **HARD STOP dopo la build.** Niente commit/`git add` prima della conferma
  visiva. Aggiorna `docs/claude-code-log.md` (data 2026-07-28 + ora, tipo `fix`, file toccati, esito).
- Dopo l'OK visivo: `git add` del **solo** `jjomTransformers.ts` (+ log), messaggio una riga inglese:
  `fix: read back persisted object node size on load so resize survives reload`

## Verifica manuale (Alfonso, http://localhost:3001, hard-refresh)

1. **Il caso che hai riportato**: ridimensiona un box (resizable on), salva, reload → **la size
   persiste** (il box torna alla dimensione salvata, non al content-hug).
2. **Content-hug intatto**: un box mai ridimensionato (State, class diagram a compartimenti, package)
   dopo reload resta content-hug; nessun box cresce a una size esplicita spuria.
3. **Sotto il floor**: un box ridimensionato sotto i 40px, salva + reload → rende alla size salvata
   (`ir-sized` azzera il floor Commit-1). 
4. **Edge**: dopo il reload di un box ridimensionato, gli edge toccano il bordo (size esplicita →
   `.mm-node` == bordo visibile).
5. **Shape**: ellipse/circle/diamond ridimensionati e ricaricati mantengono la size; nessun collasso.
6. **Atteso, non un difetto**: una view portata a `resizable:false` dopo essere stata ridimensionata
   può rendere alla size persistita dopo reload (lo stato `false` sarà definito dal size-default-lock).
7. Nessun errore console; build pulita.

## RIFERIMENTI (hint, numeri da confermare)

- `utils/jjomTransformers.ts`: `objectVertexToRFNode` (~:243, x/y ~:324-326, return ~:328-338);
  `packageVertexToRFNode` (~:221-232, riferimento del punto di emissione, **non** del fallback).
- Composizione già landata: `nodes/ObjectNode.tsx` (`useStore` su `nodeLookup.get(id).width/height`,
  `ir-sized`), `viewpoint/ir/irStyle.ts` (`.mm-node.ir-sized`, floor `.ir-node-content`).
- D-layer size: `DVertex.w/h` (persistite, `GraphDataElements.tsx:96-97,:1680-1681`); write
  `sync/canvasToJjom.ts` (`syncSizeToJjom` ~:72-78).
- Fuori scope (critical zone): `hooks/useJjomSync.ts` (gate `sizeChanged` ~:1364-1370 su `style`).
