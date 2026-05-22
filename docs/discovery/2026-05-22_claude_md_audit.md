# CLAUDE.md Audit Report — 2026-05-22

> Read-only discovery report. Nessuna modifica al codice. Tutto path è verificato sul working tree corrente (branch `alfonso-frontend-jjtl`, working tree pulito, 20 commit ahead di origin).

---

## 1. CLAUDE.md attuale (committed vs working tree)

- **Path:** `/Users/alfonso/jjodel/CLAUDE.md`
- **Working tree diff:** nessuno (`git diff HEAD -- CLAUDE.md` vuoto).
- **Ultimo commit:** `073098b8d` del **2026-04-21 09:52:48**.
- **Dichiarazione finale del file:** `Ultimo aggiornamento: Aprile 2026 (audit 2026-04-06)` · `Test: 211 passing (JjTL: 4 file, JjEL: 2 file)`.
- **Dimensione:** 471 righe.
- **Sezioni di primo livello (`grep -n "^## "`):**
  - 7  `## Contesto`
  - 16 `## Tech Stack`
  - 28 `## Comandi di sviluppo`
  - 41 `## Struttura Progetto`
  - 59 `## Convenzioni Codice`
  - 80 `## Design System`
  - 110 `## JjEL — Expression Language`
  - 172 `## JjTL — Transformation Language`
  - 326 `## Custom Events (stato 2026-04-06)`
  - 339 `## Componenti Rimossi (non reintrodurre)`
  - 355 `## Bug Aperti`
  - 367 `## Known Gotchas`
  - 383 `## AI Provider System`
  - 407 `## Workflow & anti-pattern`
  - 435 `## File importanti`
  - 457 `## Prossimi Step`

**Status:** ✅ allineato con la copia vista dalla chat di progetto (no modifiche locali, stessa data dichiarata, sezioni invariate).

---

## 2. Sync layer

### File trovati

| Path | Righe | Ultimo commit |
|------|------:|--------------|
| `frontend/src/components/editor-v2/hooks/useJjomSync.ts` | 1205 | 2026-05-21 16:20 `82d590376` — chore: remove all residual [diagN] instrumentation |
| `frontend/src/components/editor-v2/sync/syncState.ts` | 172 | (più vecchio) |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | 1547 | recente |
| `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` | 133 | 2026-05-09 19:06 `91a0e89c8` — fix(editor-v2): render M1 reference edges for post-mount slot population |
| `frontend/src/components/editor-v2/problems/UniquenessProblemSync.tsx` | — | — |

### 2.1 TRANSACTION prohibition site

User memory cita lines **496-498** di `useJjomSync.ts`. **⚠️ DIVERGENZA POSIZIONE:** il commento esiste ma è ora a **lines 527-530**. Snippet:

```
527:        // ── Create missing elements ─────────────────────────────────────
528:        // Each DVertex.new / DVoidEdge.new2 has its own internal TRANSACTION,
529:        // so they must NOT be wrapped in an outer TRANSACTION (nesting
530:        // causes x/y coordinates to be lost).
```

Altro commento correlato a line 427: `// (e.g. due to TRANSACTION nesting timing).`

**Status:** ✅ confermato (contenuto e semantica intatti); le righe sono shiftate perché il file è cresciuto.

### 2.2 `hasCanvasEdgePair` / `markCanvasEdgePair`

Definizioni in `frontend/src/components/editor-v2/sync/syncState.ts:131-137`:

```typescript
129: const canvasEdgePairs = new Set<string>();
130:
131: export function markCanvasEdgePair(src: string, tgt: string): void {
132:     canvasEdgePairs.add(`${src}→${tgt}`);
133: }
134:
135: export function hasCanvasEdgePair(key: string): boolean {
136:     return canvasEdgePairs.has(key);
137: }
139: export function clearCanvasEdgePairs(): void { canvasEdgePairs.clear(); }
```

Key format: **`${src}→${tgt}`** (carattere `→` U+2192, **direzionale**).

Call site:
- `useJjomSync.ts:462, 630, 640, 656, 667, 724`
- `useM1ReferenceEdges.ts:106, 130`
- `sync/canvasToJjom.ts:127, 230` (mark dopo creazione)

**Status:** ✅ confermato — format direzionale, semantica preservata.

### 2.3 Step 4 dependencies (useEffect)

Linea **738** di `useJjomSync.ts`:

```typescript
}, [modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]);
```

**Status:** ✅ confermato verbatim — array di 6 dipendenze, esatto match con user memory.

### 2.4 `useM1ReferenceEdges` hook

Esiste a `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts:30` (`export function useM1ReferenceEdges`), 133 righe totali.

Commento di testa: *"useM1ReferenceEdges — supplements useJjomSync's Step 4 for M1 reference values"*.
Last commit `2026-05-09 91a0e89c8`.

**Status:** ✅ confermato — è esattamente il workaround di Step 4.

### 2.5 `DVoidEdge.new2` call sites

8 siti totali nel codice di produzione:
- `useJjomSync.ts:631, 661, 718` (Step 3 inheritance, Step 3 references, Step 4 M1 refs)
- `useM1ReferenceEdges.ts:121`
- `sync/canvasToJjom.ts:129, 232, 1190, 1301, 1371`

Tutti i sites in `useJjomSync.ts` e `useM1ReferenceEdges.ts` controllano `hasCanvasEdgePair` prima della creazione, e chiamano `markCanvasEdgePair` dopo. I siti in `canvasToJjom.ts` solo marcano (sono loro stessi i creatori canvas-side). Sul ramo references (Step 3), pair-based guard è esplicitamente saltato — il commento a `useJjomSync.ts:472-473` lo spiega: *"Composite key allows sibling references; pair-based hasCanvasEdgePair would block them, so it's omitted here."*

Composite key dedup per references: **`${refId}:${srcVertex}→${tgtVertex}`** (`useJjomSync.ts:474, 505, 716`; verificato verbatim).

**Status:** ✅ confermato — guard presente dove serve, composite key intatto.

### 2.6 `computePortDistribution` e bucket key

Path: `frontend/src/components/editor-v2/utils/portDistribution.ts` (297 righe).
Last commit: **2026-05-21 17:00 `cdcef4456`** — *fix(editor-v2): union node handles across source/target buckets in STEP 4*.

Bucket key in STEP 1 (lines 78 e 111):
```typescript
78:  const sourceKey = `${edge.source}:${sourceSide}:source`;
111: const targetKey = `${edge.target}:${targetSide}:target`;
```

STEP 4 (lines 208-223) ora *union* dei due bucket per stesso `(nodeId, side)` con dedup per handleId; STEP 5 (lines 229-234) ricalcola posizioni uniformi sul total post-merge.

**Status:** ✅ confermato — fix `:source` / `:target` committed; STEP 4 union committed (commit `cdcef4456` del 2026-05-21).

---

## 3. D-L proxy & D-layer write patterns

### 3.1 `entity.father` backward link

`grep -rn '\.father\b'` su `src/`: **241 occorrenze** (filtro coarse). Pattern centrale in `buildImportSummary.ts:13-65` come strategia controcorrente al forward link laggy.

Snippet `buildImportSummary.ts:54-65`:
```typescript
54: * Count entries in idlookup whose `className` matches and whose `father` is in the given set.
55: * Robust to forward-link lag because `father` (backward link) IS eagerly set by the parser.
59: function countDescendantsByFather(
60:     idlookup: GObject,
61:     className: string,
62:     fatherIds: Set<string>
63: ): number {
64:     let count = 0;
65:     for (const id in idlookup) {
66:         if (e?.className === className && fatherIds.has(e.father)) count++;
```

**Status:** ✅ confermato — pattern attivo, scelta esplicita documentata in commenti.

### 3.2 `pkg.__raw.uri` vs `pkg.uri`

Coesistenza dei due pattern:
- `pkg.uri` (forma L-getter): `jjscript/executor/commands/eval.ts:352`, `jjscript/executor/commands/show.ts:404`, `model/logicWrapper/LModelElement.tsx:6160`, `services/export/XMIService.ts:135`.
- `pkg.__raw.uri` (D-layer escape hatch): `services/export/EcoreService.ts:104, 117, 502`.

`__raw` è usato in 23 file (`grep -rln '__raw\.'`), per esempio anche in `joiner/proxy.ts`, `classes.ts`, `LModelElement.tsx`, `Info.tsx`.

**Status:** ✅ confermato — entrambi i pattern coesistono; user memory ha cause valida (escape al D-layer per byte-identità export Ecore).

### 3.3 `buildImportSummary.ts`

- **Path:** `frontend/src/components/import/buildImportSummary.ts` (224 righe).
- Import sites: `ProjectEditor.tsx:51`.
- Funzioni esportate (visibili nei commenti): `buildEcoreImportSummary`, `buildXmiImportSummary`, `buildErrorImportSummary`.
- Pattern backward-link: 6 usi di `.father` interni, tutti in `countDescendantsByFather` / `collectDescendantsByFather` (lines 54-81, 143-158).

**Status:** ✅ confermato — backward-link counter strategy ufficiale.

### 3.4 `composition` vs `containment`

In `joiner/classes.ts`:
- Riga 749: `thiss.composition = false;` (canonical write).
- Riga 1712: solo commento (`// might cause endless loop if there are subarrays in a containment loop.`).

Nessun uso attivo di `containment` come field. `composition` resta il termine canonico nel D-layer.

**Status:** ✅ confermato.

### 3.5 `window.store.getState().idlookup` runtime pattern

**⚠️ DIVERGENZA NOMINALE:** il pattern esatto cercato (`window.store.getState()`) **non esiste**. Il pattern attivo è:

| Forma | Usi | Note |
|-------|----:|------|
| `store.getState()` | 173 | il pattern canonico, import diretto |
| `windoww.store.getState()` | 5+ | typo storico con doppia `w` — `joiner/classes.ts:247, 2393`, `debugtools/debug.tsx:30`, `redux/action/action.ts:333` |
| `windoww.store = store` | 1 | esposizione globale, `redux/createStore.ts:7` |
| `window.store…` | 0 | non esiste |

`windoww` (con `w` doppia) è una globale presumibilmente esposta per evitare conflitti con `window.store` reale di React/Redux DevTools. User memory citava la versione "pulita" ma il nome reale nel codebase ha il typo.

**Status:** ⚠️ pattern presente, ma nominalmente diverso (`windoww`, non `window`).

---

## 4. v2-flow editor critical files

- Path canonico: `frontend/src/components/editor-v2/` (la dir `v2-flow` non esiste — il prompt iniziale era ambiguo, il codice usa solo `editor-v2`).

### 4.1 Top-level files

```
frontend/src/components/editor-v2/
├── _color-schemes.scss
├── _notations.scss
├── _themes.scss
├── ActiveEditorContext.tsx
├── AlignmentToolbar.tsx
├── components/
├── ContextMenu.tsx
├── contexts/
├── edges/
├── EditorV2.scss
├── EditorV2.tsx       (3168 righe — main)
├── hooks/
├── nodes/
├── panels/
├── problems/
├── repro/
├── sync/
├── Toolbar.tsx
├── types.ts
├── utils/
└── viewpoint/
```

### 4.2 `EditorV2.tsx`

- 3168 righe.
- Ultimo commit: **2026-05-21 15:56 `6701983b6`** — *chore(editor-v2): remove diag14 instrumentation from EditorV2.tsx*.
- `grep '\[diag' EditorV2.tsx` → **0 hit**. Cleanup completo.
- `grep '\[diag' frontend/src` → **0 hit** in tutto il source (eccetto doc-comment storico in `buildImportSummary.ts:10` esplicitamente preservato).

### 4.3 `[cache]` log

- `grep '\[cache\]' frontend/src/jjscript/executor/utils.ts` → **0 hit**.
- Last commit relevant: **2026-05-21 `b6aab7551`** — *chore(jjscript): clean up [cache] logging in executor utils*.

**Status:** ✅ confermato — entrambi i cleanup committed.

---

## 5. VersionFixer & jsxString persistence

- **Path:** `frontend/src/redux/VersionFixer.tsx` (868 righe).
- **Last commit:** 2026-05-09 `43886994a`.
- **Pattern:** classe `VersionFixer` con metodi privati nominati `private ['vecchia -> nuova'](s: DState): DState`. `highestVersion` calcolata automaticamente dai nomi dei metodi (`buildVersionSignature`).

### 5.1 Tutte le migrazioni recenti (ultime 10)

| Da | A | Descrizione |
|----|---|-------------|
| 2.207 | 2.208 | (linea 543) |
| 2.208 | 2.209 | (569) |
| 2.209 | 2.210 | (593) |
| 2.210 | 2.211 | M1 node rendering aligned to flow editor (606) |
| 2.211 | 2.212 | redesign default class view "minimal clean" — riscrive `jsxString` con `DEFAULT_VIEW_JSX_STRING` (616-635) |
| 2.212 | 2.213 | L2 edge overlay schema su DViewElement (645-660) |
| 2.213 | 2.214 | replace v2.2 default view jsxString → v2.3 (L2 isEdge) (669-685) |
| 2.214 | 2.215 | L2 edgeRouting default 'manhattan-rounded' (695-707) |
| 2.215 | 2.216 | DProject.expandedTreeNodes seeding (715-761) |
| **2.216** | **2.217** | DProject layout fields (5 fields) — **migrazione corrente** (769-795) |

### 5.2 `jsxString`

- 98 occorrenze totali in `.ts`/`.tsx` su src/.
- Usata da: `view/viewElement/view.tsx:309`, `redux/VersionFixer.tsx:625, 679` (riassegnazioni in migrate), `utils/lastViewpoint.ts:192`, `utils/defaultViewTemplate.ts:93` (export `DEFAULT_VIEW_JSX_STRING`).
- I file "default-view source" sono persistiti come `jsxString` su `DViewElement` — quando si modifica `defaultViewTemplate.ts` serve bump VersionFixer + nuova migration che riscrive `e.jsxString = DEFAULT_VIEW_JSX_STRING` per le view che matchano un marker (es. `V2_2_TO_V2_3_DETECT_MARKER`).

**Status:** ✅ confermato — versionFixer pattern attivo, marker pattern come dichiarato.

---

## 6. Default views (DV.tsx etc)

### File trovati

| File | Righe | Scopo |
|------|------:|-------|
| `frontend/src/common/DV.tsx` | 1816 | Definitions del runtime delle Default View — costruisce DViewElement programmatiche via `LPointerTargetable` (last commit 2026-05-04 `46c31d484` — feat L2 edge overlay rendering with Manhattan routing). |
| `frontend/src/utils/defaultViewTemplate.ts` | 155 | Esporta `DEFAULT_VIEW_JSX_STRING` (line 93), `LEGACY_PLACEHOLDER_MARKER` (143), `V2_2_TO_V2_3_DETECT_MARKER` (155). Marker stringa: "To add information here," (legacy) e "Customize this view" (v2.3). |

Importi `DEFAULT_VIEW_JSX_STRING`:
- `view/viewElement/view.tsx:49, 309`
- `utils/lastViewpoint.ts:10, 192`
- `redux/VersionFixer.tsx:17, 625, 679`

**Status:** ✅ confermato — qualsiasi modifica a `defaultViewTemplate.ts` richiede bump VersionFixer per riscrivere views esistenti.

---

## 7. Custom events registry

**⚠️ DIVERGENZA MAGGIORE — CLAUDE.md è obsoleta su questo punto.**

CLAUDE.md (linee 326 e 461) dichiara: *"Custom Events (stato 2026-04-06): ~38 eventi custom sono ancora stringhe hardcoded… Prossimo step: centralizzare in `frontend/src/events/registry.ts` come costanti tipizzate. Prompt già pronto."*

**Stato reale:** il file `frontend/src/events/registry.ts` **già esiste** ed è in uso:
- 116 righe.
- Last commit: **2026-05-20 10:32 `16e415d4a`** — *feat(import): import summary modal for .ecore and .xmi*.
- 7 gruppi tipizzati: `JjodelEvents` (~38 nomi), `JjScriptEvents` (7), `AIEvents` (3), `JjodieEvents` (2), `EnvGenEvents` (2), `AvatarEvents` (1), `SystemEvents` (3).
- 56 file importano da `events/registry`.

Distribuzione residual hardcoded (`grep 'jjodel:'`): 53 occorrenze totali, di cui molte sono valori dentro `registry.ts` stesso o test/string match. Top 10 nomi più frequenti (incluse occorrenze di registry):
```
9:jjodel:active
64:jjodel:import
62:jjodel:activity
60:jjodel:jjtl
58:jjodel:jodie
57:jjodel:notifications
56:jjodel:guard
55:jjodel:history
54:jjodel:toast
53:jjodel:toast
```

**Status:** ⚠️ La sezione "Custom Events (stato 2026-04-06)" + il punto 1 dei "Prossimi Step" di CLAUDE.md sono **datati**. Il registry è committed da 2026-05-20.

---

## 8. Token system & design system

### 8.1 Struttura `styles/tokens/`

```
frontend/src/styles/tokens/
├── _colors-light.scss
├── _colors-dark.scss
├── _gradients.scss
├── _radius.scss
├── _shadows.scss
├── _spacing.scss
├── _transitions.scss
├── _typography.scss
├── _z-index.scss
├── index.scss      (entry point con BEM checkbox style + base resets)
└── README.md
```

Match con CLAUDE.md: ✅ struttura confermata (file in più rispetto al testo della doc, ma single source of truth è quella).

### 8.2 Legacy tokens

CLAUDE.md (80-108) afferma: *"Token legacy ELIMINATI — non reintrodurre: --accent, --bg-1..5, --secondary, --terziary, --radius, --color"*.

**⚠️ DIVERGENZA MINORE:** 1 uso attivo + 2 commenti residui:

```
ATTIVO:
frontend/src/components/editor-v2/EditorV2.scss:857:            color: var(--accent);

COMMENTATO (innocuo):
frontend/src/common/error.scss:2:    //     border-radius: var(--radius);
frontend/src/common/error.scss:39:    //         border-radius: var(--radius);
```

Inoltre, `styles/tokens/index.scss:131, 144, 155` usa **`var(--color-accent, #475569)`** con fallback hex — questo è OK (sintassi di fallback all'interno del system, non legacy).

Le note di migrazione in `index.scss:184-210` ammettono esplicitamente la presenza residuale legacy:
> *"TODO: Search and replace these in component files, then remove legacy mappings"*

**Status:** ⚠️ "zero legacy" è leggermente impreciso — 1 sito ancora da bonificare.

---

## 9. JjTL / JjEL / JjScript structure

### 9.1 Struttura directory

**JjTL** `frontend/src/jjtl/`:
```
├── analyzer/
├── components/
├── editor/
├── executor/
├── hooks/
├── lexer/
├── parser/
├── services/
├── styles/
├── types/
├── utils/
├── views/
├── __tests__/
├── index.ts
├── README.md
└── SPEC.md          ✓ presente
```
CLAUDE.md dichiara: `lexer · parser · executor · editor · views · types · __tests__`. **⚠️ DIVERGENZA**: aggiunti `analyzer`, `components`, `hooks`, `services`, `styles`, `utils` (non documentate); `README.md` non menzionato.

**JjEL** `frontend/src/jjel/`:
```
├── autocomplete/         (con util/ + providers/)
├── evaluator/            (con builtins/)
├── lexer/
├── metadata/
├── parser/
├── types/
├── util/
├── __tests__/
├── index.ts
└── SPEC.md          ✓ presente
```
CLAUDE.md dichiara struttura `lexer · parser · evaluator · builtins · types · __tests__`. **⚠️ DIVERGENZA**: `builtins` non è top-level — è `evaluator/builtins/` (4 file: `collections.ts`, `dates.ts`, `numbers.ts`, `strings.ts` + `index.ts`). In più: `autocomplete`, `metadata`, `util` non documentate.

**JjScript** `frontend/src/jjscript/`:
```
├── autocomplete/
├── components/
├── executor/             (con commands/ — 21 file)
├── normalizer/
├── parser/
├── recovery/
├── services/
├── __tests__/            (5 file di test)
├── index.ts
└── types.ts
```
CLAUDE.md dichiara: `parser · executor · commands`. **⚠️ DIVERGENZA**: oltre `commands/` è una *subdir* di `executor/`, non top-level. Mancano alle docs: `autocomplete`, `components`, `normalizer`, `recovery`, `services`, `__tests__`.

### 9.2 Test count per linguaggio

| Linguaggio | File `.test.ts*` | CLAUDE.md dichiara |
|------------|-----------------:|-------------------:|
| jjtl/__tests__ | **11** | "4 file" |
| jjel/__tests__ | **2** | "2 file" |
| jjscript/__tests__ | **5** | "0 test su 60 file" (sezione Prossimi Step) |
| Totale src/ | 22 | 211 *tests* (numero != file count) |

Dettaglio jjtl test files:
- `let-prompt-bug.test.ts`, `abstract-target.test.ts`, `jjel-delegation.test.ts`, `parser-fixes.test.ts`, `astBridge.test.ts`, `ai-prompt-sanitization.test.ts`, `forall-mapping.test.ts`, `executor-bridge.test.ts`, `source-alias.test.ts`, `executor-llayer.test.ts`, `circular-refs.test.ts`.

Dettaglio jjscript test files (NEW vs CLAUDE.md):
- `lexer.test.ts`, `parser.test.ts`, `commands.test.ts`, `grammar.test.ts`, `context-binding.test.ts`.

**⚠️ DIVERGENZA SIGNIFICATIVA:** CLAUDE.md "Prossimi Step" #6 dice *"JjScript test suite (0 test su 60 file, 19 comandi)"*. Reale: 5 file di test, 21 comandi. Il "JjScript test suite" non è più una task aperta — è in progress/done.

### 9.3 AST Bridge

`frontend/src/jjtl/executor/astBridge.ts` (298 righe). Header verbatim (lines 15-25):

```typescript
15: *   JjTL 'FunctionCall'           → JjEL 'MethodCall' (when callee is MemberAccess)
17: *   JjTL 'NullSafeFunctionCall'   → JjEL 'NullSafeMethodCall'
18: *   JjTL 'BinaryExpression'       → JjEL 'Binary'
20: *   JjTL 'ConditionalExpression'  → JjEL 'IfThenElse'
25: *   JjTL 'JjelExpression'         → unwrap to inner JjelExpression
```

Implementazione visibile a line 94-126 (case 'FunctionCall', 'NullSafeFunctionCall', 'BinaryExpression', 'UnaryExpression', 'ConditionalExpression', …).

**Status:** ✅ confermato — mappings esattamente come dichiarato in CLAUDE.md.

---

## 10. Pattern duri citati in user memory — verifica

| Pattern | Source location reale | Status |
|---------|----------------------|--------|
| `useJjomSync.ts:496-498` TRANSACTION prohibition comment | Comment ora a **`:527-530`** (file cresciuto) | ⚠️ presente, righe shiftate |
| `hasCanvasEdgePair` direzionale `${src}→${tgt}` | `syncState.ts:131-137` | ✅ verificato e attuale |
| `markCanvasEdgePair` | `syncState.ts:131-133` | ✅ verificato e attuale |
| Step 4 deps `[modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]` | `useJjomSync.ts:738` verbatim | ✅ verificato e attuale |
| `useM1ReferenceEdges` hook | `hooks/useM1ReferenceEdges.ts:30` | ✅ verificato e attuale |
| `DVoidEdge.new2` dedup key composito `${refId}:${srcVertex}→${tgtVertex}` | `useJjomSync.ts:474, 505, 716` | ✅ verificato e attuale |
| `entity.father` backward-link pattern | `buildImportSummary.ts:13-65, 143-158` (241 occorrenze totali) | ✅ verificato e attuale |
| `pkg.__raw.uri` vs `pkg.uri` | Coesistono (EcoreService.ts vs XMIService.ts/jjscript) | ✅ verificato — entrambi attivi per design |
| `composition` (non `containment`) D-layer field | `joiner/classes.ts:749`; `containment` solo in commenti | ✅ verificato e attuale |
| `VersionFixer.tsx` migration bump pattern | `redux/VersionFixer.tsx` (868 righe) — ultima migrazione `2.216 -> 2.217` | ✅ verificato e attuale |
| `window.store.getState().idlookup` runtime access | Pattern reale è `windoww.store` (typo doppia w) o `store.getState()` direttamente | ⚠️ nominalmente diverso |
| Classic editor `.panning-handle` z-index 100 | **0 hit**: nessuna regola CSS abbina `.panning-handle` con `z-index: 100`. Il selettore esiste in `Measurable.scss` e `diagram.scss`, ma senza z-index | ❌ non trovato |
| `computePortDistribution` bucket key fix `:source/:target` | `portDistribution.ts:78, 111` | ✅ verificato e attuale |
| `buildImportSummary.ts` counter via backward-link | `buildImportSummary.ts:54-81` | ✅ verificato e attuale |

**Sintesi:** 11 ✅ · 2 ⚠️ · 1 ❌.

> Nota sul ❌: il pattern z-index 100 sul `.panning-handle` potrebbe essere stato rimosso, oppure user memory si riferiva ad un selettore vicino (`.dock-drop-edge` ha z-index 100 in `style_ap.scss:723`, `.dock-drop-square` ha z-index 300 a `:742`). Nessun blocco CSS attivo applica z-index al panning-handle.

---

## 11. claude-code-log.md — pattern recenti emersi

`docs/claude-code-log.md` ha 6053 righe e 395 entries `## …`. Ultime 25 entries vanno dal 2026-04 al 2026-05-21. Pattern e regole emerse non ancora codificate in CLAUDE.md:

### 11.1 Filone "edge rendering v2-flow Families.ecore" (chiuso 2026-05-21)

Sequenza ordinata di 4+ fix per il rendering 8-edge tra `Family ↔ Member`:
1. `portDistribution.ts` role-aware bucketing (`${node}:${side}:${role}`) — commit `89e67dc65`.
2. `portDistribution.ts` STEP 4 union dei bucket source+target (cdcef4456).
3. `DynamicHandles.tsx` role-aware physical positioning (index-based, source metà sx/sopra, target metà dx/sotto).
4. `UnifiedEdge.tsx` directional spread + label split per mirrored edges (formula `directionSign * (sourceIndex + targetIndex + 1)`).

**Convenzione emergente:** quando una coppia di nodi può avere fan-in + fan-out simultanei, il bucket key deve sempre includere il ruolo (`:source`/`:target`); altrimenti i due insiemi sovrascrivono lo stesso slot.

### 11.2 Pattern `[diagN]` instrumentation lifecycle

Convenzione emersa dai 6 entry consecutivi del 2026-05-21:
- Sintassi: `[diagN]` (con `N` intero), oppure `[cache]` per logging persistente.
- Lifecycle: introdotti durante diagnosi → committati in fixup commits → rimossi in unico cleanup commit a chiusura del filone (es. `82d590376` + `6701983b6`).
- **Doc-comment storico preservato in `buildImportSummary.ts:10`** è eccezione esplicita (documenta una scoperta).

### 11.3 Pattern "counter via idlookup filter on (className + father)"

Da `2026-05-19 fix(import): Counter via idlookup filter on (className + father)`:
- Forward link (`pkg.classes`) può essere vuoto quando SetFieldAction non è ancora applicato dal reducer.
- Workaround: iterare `state.idlookup` e filtrare per `(className, father)` (backward link è eagerly set).
- Stesso pattern adottato per attributes/references/enums/datatypes.

### 11.4 Pattern Import Summary modal (CustomEvent-driven, non Redux)

Da `2026-05-19 feat(import): Import summary modal`:
- Per modal/feedback cross-cutting si usa `CustomEvent` globale + `useState` locale (pattern Toast).
- File nuovi `frontend/src/components/import/` (4 file: tipi, builder, dispatcher, componente + scss).
- Evento centralizzato in `JjodelEvents.IMPORT_SUMMARY_SHOW`.

### 11.5 Pattern Ecore/XMI I/O (ecore-io.test.ts, 32 tests)

Da entries 2026-05-13 → 2026-05-19:
- Importer/exporter Ecore + XMI con feature flags graduali (B.1, B.2, B.3, W1, W2).
- Test suite dedicata: `frontend/src/services/export/__tests__/ecore-io.test.ts` (32 test).
- File services: `frontend/src/services/export/EcoreService.ts`, `XMIService.ts`.
- Fixture path: `frontend/src/__tests__/fixtures/xmi-m1/`.
- **Convenzione emergente:** `Pointer_<UPPER>` per primitive type IDs (es. `Pointer_ESTRING`) distingue canonical da user-defined types.

### 11.6 Pattern "no `--no-verify`, no skip-hooks"

Citato esplicitamente come "Hard rule rispettate" in 2026-05-18 W2 + 2026-05-19 Import Summary. Già implicito nelle istruzioni di sistema, ma emerge come regola operativa interna.

---

## 12. Divergenze, sorprese, raccomandazioni per CLAUDE.md

### Sezioni di CLAUDE.md che risultano datate

1. **"Custom Events (stato 2026-04-06)" (linee 326-337)**: dichiara registry come "prossimo step". **Realtà:** committed da 2026-05-20 (`16e415d4a`), 116 righe, 56 import sites. Sostituire con riferimento al registry e nuova regola: "Non aggiungere stringhe `jjodel:*` hardcoded — usare `JjodelEvents.*` da `events/registry.ts`".

2. **"Prossimi Step" #1, #6 (linee 459-462)**: #1 "Event registry" è done. #6 "JjScript test suite (0 test su 60 file)" è falso — esistono 5 file in `jjscript/__tests__/`.

3. **Struttura JjTL/JjEL/JjScript (linee 49-55)**: incompleta. Aggiungere subdir mancanti (autocomplete, metadata, normalizer, recovery, services, components, hooks, analyzer). Correggere "JjEL builtins" → percorso reale `jjel/evaluator/builtins/`.

4. **Footer (linee 469-471)**: "Test: 211 passing (JjTL: 4 file, JjEL: 2 file)" — JjTL ora 11 file di test, JjScript 5 file. Numero `211` non verificabile senza run; consigliato sostituire con "test files: JjTL N · JjEL N · JjScript N" + nota "run `npm run test` per il count attuale".

5. **"Design System / Token legacy ELIMINATI" (linee 96-99)**: il claim "zero legacy" è impreciso — `EditorV2.scss:857` usa ancora `var(--accent)`. Suggerito wording: "1 sito residuale in `EditorV2.scss:857`; tutti gli altri eliminati."

### Pattern recenti da aggiungere

6. **Role-aware bucket key per port distribution** — convenzione emersa dal filone Families.ecore. Una nuova riga in "Convenzioni Codice" o "Known Gotchas": *"In `portDistribution.ts`, le chiavi bucket devono includere il role (`:source`/`:target`); altrimenti fan-in/fan-out simultanei collidono. Vedi STEP 1 e STEP 4."*

7. **Backward-link counter strategy** — pattern critico per chi tocca import/counters: *"Quando il forward link (`pkg.classes`) può essere stale per timing dei reducer, contare via `idlookup` filter su (className, father). Vedi `buildImportSummary.ts:54-81`."*

8. **CustomEvent + useState pattern per modal cross-cutting** — emerso da Toast e Import Summary. Vale la pena come riga in "Workflow & anti-pattern".

9. **`useM1ReferenceEdges` come supplemento di Step 4** — il fatto che esista un secondo hook per la stessa cosa è informazione importante per chi tocca il sync layer. Una riga in "File importanti" con descrizione "supplementa Step 4 di useJjomSync per ref-edges post-mount".

10. **`windoww.store` (con doppia w) come globale di debug** — vale come nota in "Known Gotchas" per evitare confusione: il nome ha un typo storico ed è il modo standard di accedere allo store dalla console DevTools.

### File importanti da aggiungere a "File importanti"

Mancano dalla tabella (linee 437-455):
- `frontend/src/components/editor-v2/hooks/useJjomSync.ts` — *the* file critico per il sync (1205 righe).
- `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts` — supplemento Step 4.
- `frontend/src/components/editor-v2/sync/syncState.ts` — singleton state per dedup edge.
- `frontend/src/components/editor-v2/sync/canvasToJjom.ts` — write-back canvas → JjOM.
- `frontend/src/components/editor-v2/utils/portDistribution.ts` — handle/port placement, role-aware.
- `frontend/src/redux/VersionFixer.tsx` — schema migration.
- `frontend/src/utils/defaultViewTemplate.ts` — `DEFAULT_VIEW_JSX_STRING` + marker.
- `frontend/src/common/DV.tsx` — Default View runtime (1816 righe).
- `frontend/src/events/registry.ts` — registry custom events.
- `frontend/src/services/export/EcoreService.ts` + `XMIService.ts` — Ecore/XMI I/O.
- `frontend/src/components/import/buildImportSummary.ts` — counter via backward-link.
- `frontend/src/components/import/ImportSummaryModal.tsx` — pattern CustomEvent modal.

### Bug Aperti (linee 357-363) — sospetto outdated

CLAUDE.md elenca 3 bug datati 2026-03-10:
- *Doppia esecuzione executor* (StrictMode React) — non verificato in questo audit.
- *Error in View: Fallback su target* — non verificato.
- *ForAll pluralization naive* — non verificato.

Consiglio: chiedere conferma alla chat di progetto se ancora aperti, o cercare nei commit recenti per chiusure.

---

**Fine report.**
