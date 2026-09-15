# Prompt Claude Code — Layout per viewpoint, slice 1a, Fase 2 (implementazione)

**Corsia completa (RC-3), effort xhigh. Go-ahead di Alfonso ricevuto il 2026-08-24 dopo
l'analisi della Fase 1.** Leggere a inizio sessione: `CLAUDE.md`, `docs/decisions.md`
(R-LAY-14..17 **con le note di emendamento del 2026-08-24**, che prevalgono sul testo originario
delle righe), e il report `docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md`,
che è la base di questa fase: le citazioni `file:riga` qui sotto vengono da lì. Se questo prompt
contraddice CLAUDE.md o il registro, segnalare e fermarsi.

## COSA

Un solo commit: il campo opzionale `layoutByViewpoint` su `DVertex`, il modulo puro
`vertexLayout.ts` con i due resolver, e i suoi test senza DOM. **Nessun call site cambia, zero
effetto a schermo.** L'adapter impuro (`activeExclusiveVpId`) NON si scrive: è della slice 1b.

## DOVE — elenco esaustivo dei file

1. `frontend/src/model/dataStructure/GraphDataElements.tsx` — una sola dichiarazione nuova.
2. `frontend/src/components/editor-v2/viewpoint/layout/vertexLayout.ts` — nuovo (cartella nuova).
3. `frontend/src/components/editor-v2/viewpoint/layout/__tests__/vertexLayout.test.ts` — nuovo.
4. `docs/claude-code-log.md` — entry a fine task.

Nient'altro. In particolare: **niente `joiner/classes.ts`** (gli opzionali non hanno default,
discovery §3.2), **niente `VersionFixer.tsx`** (nessun bump, nemmeno no-op: R-LAY-15 emendata;
un bump rigenera le default view non toccate, `VersionFixer.tsx:133-143`), niente adapter,
niente `canvasToJjom.ts` / `jjomTransformers.ts`.

## COME

### 1. Il campo su `DVertex`

In `GraphDataElements.tsx`, nella famiglia degli opzionali a `:1679-1692` (dopo `irCollapsed`),
dichiarazione nuda con literal strutturale inline, come `ghostOffsets` a `:1681` — **non**
importare il tipo dal modulo, per non aprire l'arco `model/` → `editor-v2/` (R-LAY-14 emendata):

```ts
/** Per-viewpoint layout, keyed by the id of the exclusive viewpoint active when the gesture
 *  happened (R-LAY-14). Absent key = fall back to the scalars x/y/w/h/isResized (R-LAY-15).
 *  Born undefined: a '+=' SetFieldAction auto-creates it (reducer.ts:186-188). Structurally
 *  identical to VertexLayout in editor-v2/viewpoint/layout/vertexLayout.ts — kept inline on
 *  purpose, like ghostOffsets and irEdgeLayout above. */
layoutByViewpoint?: { [viewpointId: string]: { x: number; y: number; w: number; h: number; isResized: boolean } };
```

### 2. Il modulo puro `vertexLayout.ts`

Zero import (né di valore né `import type`: R-LAY-13/14 emendate; `GraphSize` è nominale e non
utilizzabile, TS2740, discovery §2.3). Header doc che cita R-LAY-14..17 e la provenienza della
forma (`GraphSize`, `common/Geom.ts:677`). API:

```ts
export interface VertexLayout { x: number; y: number; w: number; h: number; isResized: boolean; }

export interface VertexLayoutSource extends VertexLayout {
    layoutByViewpoint?: { [viewpointId: string]: VertexLayout };
}

/** activeExclusiveVpId: id of the active EXCLUSIVE viewpoint, or null. The impure adapter
 *  (slice 1b) maps "no viewpoint" and "non-exclusive viewpoint" to null BEFORE this module:
 *  here null means "the abstract-syntax record", i.e. the scalars (R-LAY-16). */
export function readVertexLayout(src: VertexLayoutSource, activeExclusiveVpId: string | null): VertexLayout;

export type VertexLayoutWrite =
    | { target: 'scalars'; patch: Partial<VertexLayout> }
    | { target: 'dictionary'; vpId: string; record: VertexLayout };

export function resolveVertexLayoutWrite(
    src: VertexLayoutSource,
    patch: Partial<VertexLayout>,
    activeExclusiveVpId: string | null
): VertexLayoutWrite;
```

Semantica, dalle righe ratificate:

- `readVertexLayout`: se `activeExclusiveVpId` è `null` → gli scalari di `src`; altrimenti
  `src.layoutByViewpoint?.[vpId]` se presente, se assente gli scalari (read-through, R-LAY-15).
  Le chiavi orfane non vengono mai consultate per costruzione (R-LAY-17).
- `resolveVertexLayoutWrite`: con `null` → `{ target: 'scalars', patch }` (il chiamante scrive
  gli scalari come oggi). Con `vpId` → `{ target: 'dictionary', vpId, record }` dove
  `record = { ...readVertexLayout(src, vpId), ...patch }`: **materializzazione del record
  completo dai valori efficaci, poi patch — un solo record, mai parziale** (R-LAY-15 emendata).
- Il modulo **descrive** la scrittura, non la esegue: nessun import di redux, nessuna
  `SetFieldAction`. Nel doc del modulo, la nota per i call site della 1b: la scrittura
  `dictionary` si traduce in UNA action,
  `SetFieldAction.new(vId, 'layoutByViewpoint', {[vpId]: record}, '+=', false)` — `'+='` su
  oggetto è merge superficiale per chiave e preserva gli altri viewpoint (`reducer.ts:240-252`),
  su campo assente agisce come `'='` (`reducer.ts:186-188`), nessun seeding. Citare le righe:
  è una proprietà del reducer non documentata altrove (rischio 3 del report).

### 3. I test (senza DOM)

Modello di forma: `viewpoint/ir/__tests__/irCreationSeed.test.ts` (header che dichiara «modulo
puro, senza store e senza mock»). Casi minimi:

- read: dizionario assente → scalari; dizionario presente senza la chiave → scalari; chiave
  presente → il record; `null` → scalari anche con dizionario popolato; chiave orfana presente
  ma vp attivo diverso → non consultata.
- write: `null` → `{target:'scalars'}` con la patch intatta; primo gesto sotto `vp` (chiave
  assente) → record completo = scalari efficaci + patch (provare con patch di solo `{x,y}`:
  `w/h/isResized` devono venire dagli scalari — è l'emendamento di R-LAY-15); gesto successivo
  (chiave presente) → record completo = record esistente + patch; il risultato riguarda solo
  `vpId`, mai gli altri record.
- purezza: `src` non viene mutato da nessuna chiamata (confronto per identità e per contenuto).

### 4. Verifiche prima del commit

- Grep di collisione sui nomi NON già coperti dal D7 della Fase 1: `resolveVertexLayoutWrite`,
  `VertexLayoutWrite`, `VertexLayoutSource` — attesi 0 in `frontend/src`, con controllo positivo
  (`ghostOffsets`, atteso 18) e glob quotati (la trappola zsh del §7 del report).
- Gate pieni: `npx tsc --noEmit` con conteggio sull'output completo, **33 errori, lista
  byte-identica alla baseline**; `npx vitest run` (baseline 1323 passed, 9 suite rosse note,
  nessuna sotto `editor-v2/`) più la suite nuova verde; `npm run build` exit 0;
  `npm run check:docs` (il rosso del Check C sulle due entry pre-esistenti alle righe 78 e 144 è
  fuori scope e si dichiara, non si corregge).

### 5. Commit e log

Un solo commit: `feat(layout): DVertex.layoutByViewpoint and pure vertex layout resolver (slice 1a)`.
`git add` dei soli quattro file elencati, mai `git add .`. Entry in `docs/claude-code-log.md`
(formato standard, `Notes` ≤ 500 caratteri: il ragionamento lungo sta già nel report di Fase 1,
citarlo per nome).

## HARD STOP

Dopo il commit: fermarsi. Niente slice 1b, niente adapter, niente call site. La verifica visiva
non è applicabile (zero effetto a schermo) e si dichiara tale nella entry di log.

## RIFERIMENTI

- `docs/decisions.md`: R-LAY-14..17 **come emendate il 2026-08-24**; R-LAY-6, R-LAY-8, R-LAY-13
  (emendata); RC-3.
- `docs/discovery/discovery_2026-08-24_layout_slice1a_sede_resolver.md` (la base: §2 tipo, §3
  dichiarazione, §4 scrittura e reducer, §5 sorgente/predicato, §6 precedente di test, §7 grep).
- `docs/ratifiche/claude_2026-08-24_memo_ratifica_layout_slice1.md`, §7 (addendum con le
  decisioni post-Fase 1).
