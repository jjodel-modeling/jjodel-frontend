# Prompt Claude Code: E-ref — EdgeAuthoringPanel (reference-as-edge) + entry-point

**Data**: 2026-07-27 (ripresa del prompt E-ref del 2026-07-26; **design invariato**, R-1..R-8 e D5/D8 confermati. Aggiornata solo l'inquadratura di stato: HEAD e working tree dopo i commit fix-coevoluzione + resizable + propagazione).
**Tipo**: feat (implementazione scoped; Fase 2 del two-phase, discovery già fatta)
**Repo/branch**: jjodel-frontend / `alfonso-frontend-jjtl`
**Prerequisito**: HEAD = cima corrente di `alfonso-frontend-jjtl` (E0 `420657f98` + fix co-evoluzione firma + resizable + propagazione size, tutti landed). Non serve un HEAD specifico: E-ref non dipende da quei commit, ne consuma solo il rendering a valle (E0).
**Working tree (può essere sporco di WIP estraneo)**: al momento della stesura il tree può contenere un **refactor edge/anchor in `EditorV2.tsx`**, eventuale **WIP TS1** (LabelEntryEditor / TextStyleField / TextStyleEditor) e/o il **WIP lane-separation** (EditorV2.tsx + laneSeparation.ts). **Nessuno di questi file è in scope E-ref.** Regola: fai `git status` come primissima cosa (Passo 0), procedi solo se i 4 file in scope esistenti risultano PULITI; se uno di essi è già modificato nel tree, **STOP e segnala** prima di toccarlo. Lo stage finale include SOLO i file E-ref elencati sotto.
**Mappa di riferimento (NON rifare discovery)**: `docs/discovery/discovery_2026-07-26_edge_authoring_panel.md` — ogni sito citato qui è lì con `file:riga`.
**Hard stop**: dopo implementazione + gate verdi, PRIMA del commit. Commit solo dopo conferma visiva di Alfonso su `http://localhost:3001/`.

## Perché questo task

E0 ha reso vivo il rendering IR degli edge; ora si chiude il secondo buco: l'authoring. Questo task consegna il percorso end-to-end per la natura **reference-as-edge**: dal tab IR di una view si semina un `EdgeViewIR`, lo si autora dal panel (matching + stile linea + terminazioni + label center), e il canvas riflette live via il ramo gated E0.

Decisioni che vincolano il task: addendum `spec_2026-07-26_ir_edge_authoring_addendum.md` (D5/D8) + ratifiche `ratifiche_2026-07-26_eref_authoring.md` (R-1..R-8), riassunte inline dove servono. In caso di conflitto con CLAUDE.md, segnalare senza procedere.

## Prima di iniziare
0. **`git status` (Passo 0, read-only).** Verifica quali file sono già modificati nel working tree. I 4 file esistenti in scope (`irDefaults.ts`, `EnableIRPanel.tsx`, `ViewData.tsx`, e i file solo-lettura citati come pattern) NON devono risultare sporchi. Se uno lo è, STOP e segnala: non implementare sopra un WIP altrui. Il WIP estraneo su `EditorV2.tsx` / TS1 / lane-separation è atteso e non blocca (non sono in scope), ma NON stagearlo mai.
1. Leggere `CLAUDE.md` e `docs/claude-code-log.md`.
2. Rileggere per intero, prima di modificarli: `authoring/RowAuthoringPanel.tsx` (è il template), `authoring/EnableIRPanel.tsx`, `editors/views/ViewData.tsx`, `ir/irDefaults.ts`. Percorsi sotto `frontend/src/components/` (editor-v2/viewpoint per i primi due e irDefaults; editors/views per ViewData). **Nota shift righe**: i `file:riga` sotto vengono dalla discovery del 26; dopo il churn del 27 su `VertexAuthoringPanel.tsx` (checkbox resizable + bottone propaga) e `EditorV2.tsx` (listener size) possono essere shiftati. I riferimenti a quei due file sono SOLO pattern da imitare, non da modificare: conferma leggendo il file, non fidarti del numero di riga.
3. Grep anti-collisione per i nuovi identificatori: `EdgeAuthoringPanel`, `defaultEdgeViewIR` (censimento discovery = 0 occorrenze; riverificare).

## Vincoli di scope (rigidi)
- **File toccati, SOLO questi**:
  1. NUOVO `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`
  2. `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (aggiunta `defaultEdgeViewIR`)
  3. `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (kind `edge` + seed)
  4. `frontend/src/components/editors/views/ViewData.tsx` (showIRTab + routing)
  5. NUOVO `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts`
- NON toccare: `UnifiedEdge.tsx`, `irEdgeViews.ts`, `irResolveCore.ts`, `irCompile.ts`, `irValidate.ts`, `MatchingSection.tsx`, `EditorV2.tsx` (WIP edge/anchor pendente), la critical zone. Se sembra necessario, STOP e segnala.
- Zero refactoring opportunistico; mai rinominare identificatori esistenti; edit puntuali.

## COSA / COME

### 1. `EdgeAuthoringPanel.tsx` (nuovo, natura reference only)
Struttura copiata da `RowAuthoringPanel.tsx`: props `{ view: LViewElement }`; seed `clone(view.ir ?? defaultEdgeViewIR())`; draft in `useState<EdgeViewIR>`; `dirtyRef`; reset su `useEffect([view.id])`; validate eager con `ErrorText`; commit debounced 300ms whole-object `view.ir = draft`; `patch(next)` che setta dirty (tutti i siti: `RowAuthoringPanel.tsx:27,31,52-82`).

Sezioni del form:
- **Matching (inline, NON MatchingSection — R-6)**: metaclasse sorgente (stesso blocco wildcard/lista/Select del row, `:160-254`); **reference**: `Select` popolato dalle `references` della metaclasse sorgente risolte dal `featureInfo` (pattern identity-pinning del row `:89-140`), con opzione "qualsiasi reference" = campo `reference` ASSENTE dal draft (drop della key, pattern predicate del row `:171-182`); predicate (checkbox "Applica solo se" identico al row; il predicate radica sul SORGENTE, R-1: nessuna UI speciale per il target); priorità (`NumberInput`). **NIENTE `exclusive`** (R-5).
- **Stile linea**: `edge.line.color` / `width` / `style` autorati come scalari wrappati in `ConditionalEditor`, stesso pattern del fill del Vertex (`VertexAuthoringPanel.tsx:222-245`); widget: `ColorPicker`, `NumberInput`, `Select` con le stesse option solid/dashed/dotted (`VertexAuthoringPanel.tsx:24-28`).
- **Terminazioni (R-4)**: due `Select` (sourceEnd / targetEnd) sulle 6 voci di `EdgeTermination` (`irTypes.ts:145-151`). Chiave assente = default di compile (none/openArrow).
- **Label center**: checkbox "Label" che attiva/disattiva `edge.labels.center`; quando off, drop della key (byte-identico a una view senza label); quando on, **un singolo `TextSourceEditor`** (`source={draft.edge.labels?.center}`), non una lista.
- Rispettare Basic/Advanced solo se il row lo fa; altrimenti pannello piatto come il row.

### 2. `irDefaults.ts` — `defaultEdgeViewIR()` (R-8)
```typescript
export function defaultEdgeViewIR(): EdgeViewIR {
  return { irVersion: 'ir-1.2', kind: 'edge', metaclasses: [], edge: {} };
}
```
Accanto a `defaultRowViewIR` (`:62-69`). I default sourceEnd/targetEnd/labelPlacement restano al compile (`irCompile.ts:415-420`): non duplicarli nel seed.

### 3. `EnableIRPanel.tsx` — kind `edge` (R-3: NIENTE toggle di natura)
- `KIND_OPTIONS` (`:8-11`): aggiungere `edge` (label es. "Edge (reference)").
- Stato `kind` (`:59`): estendere il tipo a `'vertex' | 'row' | 'edge'`.
- `enable()` (`:77-98`): ramo seed edge = `defaultEdgeViewIR()` con `metaclasses` risolte via `resolveMetaclassNames` da `appliableToClasses` (come il vertex seed), fallback `[]`; campo `reference` assente. Validare con `validateIR` prima di scrivere (già accetta `edge`, `irValidate.ts:18` — R-2; se il check fallisse, STOP e segnala invece di toccare irValidate).
- Il guard anti-reseed esistente (`:61-73`) copre già il caso `ir` presente: non modificarlo.

### 4. `ViewData.tsx` — showIRTab + routing
- `showIRTab` (`:58`): aggiungere `(ir?.kind === 'edge')` alla disgiunzione. **NON toccare** la clausola `view.isEdge !== true`: `view.isEdge` è il marker delle edge-view classiche jsxString, NON c'entra con `ir.kind === 'edge'` (nota critica della discovery, Area 2).
- Routing (`:81-100`): ramo `ir?.kind === 'edge' → <EdgeAuthoringPanel view={view} />` PRIMA del placeholder read-only (`:90-96`), che oggi cattura anche edge.

### 5. Test (`edgeAuthoring.test.ts`, nuovo)
Sul modello di `rowAuthoring.test.ts` (R3): seed default valido per `validateIR`; drop della key `reference` quando "qualsiasi reference"; drop della key `labels.center` quando label off; round-trip draft→ir senza corruzione dei campi non toccati; ramo routing kind edge (unit sul predicato showIRTab se testabile). Nessun test rosso pre-esistente deve cambiare.

## Verifica
1. `npm run build` verde; typecheck baseline; vitest verde (nuovi test inclusi).
2. **Verifica visiva (Alfonso, su CD v3/v4)**: (a) su una view senza ir, tab IR → kind Edge → seed: nessun errore, panel appare; (b) impostare metaclasse sorgente + una reference reale + colore/tratteggio/terminazione + label: il canvas riflette live entro il debounce (ramo E0); (c) riaprire/chiudere il tab: nessun re-seed, draft coerente (guard); (d) view row/vertex esistenti: invariate.
   - **Nota rischio (WIP edge/anchor pendente)**: se il refactor edge/anchor non committato in `EditorV2.tsx` è presente nel tree durante la verifica, il rendering live degli edge (punto b) potrebbe comportarsi in modo diverso dal ramo E0 stabile. Se il canvas edge mostra anomalie non spiegabili da E-ref, **segnalarlo**: potrebbe essere il WIP, non il panel. In dubbio, verificare E-ref su un tree senza quel WIP (stash temporaneo del solo `EditorV2.tsx`).
3. Fornire ad Alfonso 2 righe di istruzioni operative per la (b) coi nomi del suo progetto, se durante l'implementazione emergono vincoli (es. dove creare la nuova view).
4. **HARD STOP**: non committare. Consegnare diff + esito gate + istruzioni verifica.

## Commit (solo dopo GO)
- Messaggio: `feat(editor-v2): edge view authoring panel (reference-as-edge)`
- `git add` dei SOLI 5 file elencati (mai `git add .`; il WIP edge/anchor + TS1 + lane-separation resta fuori).
- Entry in `docs/claude-code-log.md`: data, feat, prompt in una riga, file, esito, nota su R-3 (toggle natura rinviato a E-obj) e R-5 (exclusive omesso).

## RIFERIMENTI
- Discovery panel: `docs/discovery/discovery_2026-07-26_edge_authoring_panel.md` (tutti i `file:riga`).
- Ratifiche: `ratifiche_2026-07-26_eref_authoring.md` (KB) — R-1..R-8.
- Addendum: `spec_2026-07-26_ir_edge_authoring_addendum.md` (KB) — D5/D8.
- Template: `RowAuthoringPanel.tsx` (R3, `d1e6f9992`); rendering a valle: E0 `420657f98`.
