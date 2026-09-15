# Codebase analysis — size, quality signals, and extension history

**Date**: 2026-06-08
**Type**: docs / analysis (read-only)
**Branch**: `alfonso-frontend-jjtl`
**Scope**: `frontend/src` of the jjodel-frontend repo. `node_modules`, `dist`, and binary assets excluded from code counts. The `jjodel-docs` / `jjodel-backend` / `jjodel-collaborative` repos are out of scope.

> Measurement task. Every figure below is backed by a `git`/`wc`/`grep` command, a file path, or a git fact. Each metric is tagged **[measured]** or **[not measured]**. Tools `cloc`, `tokei`, `ts-prune`, `jscpd`, `eslint`, `scc` are **absent** (neither global nor in `node_modules/.bin`) — their metrics are "not measured (tool unavailable)", not worked around. No source file was modified.

---

## Summary (headline totals)

`frontend/src` holds **1,157 tracked files**. Hand-written code is **~208,400 lines of TypeScript** (432 `.ts` + 397 `.tsx` = 829 files) plus **~94,500 lines of styles** (190 `.scss` + 25 `.css`). The largest source file is `model/logicWrapper/LModelElement.tsx` at **7,773 lines**; **27 files exceed 1,500 lines**. `tsconfig` is **`strict: true`**, yet the tree carries **2,349 `as any`**, **1,640 `: any`**, **225 `@ts-ignore`**, and **1,013 `console.log`** in `src`; `tsc --noEmit` emits **87 errors** (74 of which are Vite-handled asset imports + filename casing, 13 genuine type errors). There is **no runnable test/lint/typecheck/coverage npm script** (25 vitest test files exist but cannot be invoked via `package.json`). The repo has **2,060 commits**; the current branch `alfonso-frontend-jjtl` has diverged from `origin/master` since **2025-10-24** across **786 commits / 808 files added**, and is effectively the active development line — the three languages (`jjel`/`jjtl`/`jjscript`), the AI assistant (`jjodie`), and `services` are all net-new on it.

---

## 1. Size and shape

### 1.1 Files and lines by extension — [measured]

`git ls-files 'frontend/src/*.<ext>' | xargs wc -l`

| Extension | Files | Lines |
|---|--:|--:|
| `.tsx` | 397 | 109,883 |
| `.ts`  | 432 | 98,513 |
| `.scss`| 190 | 86,091 |
| `.css` | 25 | 8,420 |
| `.js`  | 7 | 6,524 |
| `.md`  | 6 | 2,355 |
| `.json`| 1 | 14 |
| **TS+TSX (code)** | **829** | **208,396** |
| **SCSS+CSS (style)** | **215** | **94,511** |

Non-code tracked files under `src` (excluded from line totals): `png` 45, `svg` 16, `jpg` 10, `webp` 6; test fixtures `xmi` 7, `ecore` 5, `xml` 2. (`.d.ts` is 2 files / 18 lines, inside the `.ts` count.)

### 1.2 Lines by top-level area under `src/` — [measured]

`ts+tsx+scss+css+js` per area:

| Area | Files | Lines |
|---|--:|--:|
| components | 537 | 144,812 |
| jjtl | 85 | 26,603 |
| jjscript | 72 | 23,231 |
| pages | 68 | 22,510 |
| common | 23 | 18,501 |
| model | 20 | 12,598 |
| services | 23 | 10,375 |
| jjel | 27 | 7,285 |
| styles | 20 | 6,303 |
| joiner | 7 | 5,872 |
| redux | 7 | 5,543 |
| utils | 21 | 3,596 |
| graph | 11 | 3,167 |
| jjodie | 7 | 3,129 |
| view | 2 | 1,832 |
| jjodie-integration | 6 | 1,640 |
| types | 4 | 1,462 |
| DSL | 6 | 1,362 |
| constants | 5 | 946 |
| examples | 20 | 824 |
| contexts | 5 | 717 |
| ai | 3 | 422 |

`components/` is ~46% of code+style. `ai/` (3 files, 422 lines) is only the just-landed `viewpointIR` work (see §3) — the broader AI assistant code lives in `jjodie/`, `jjodie-integration/`, `components/Jodie/`, `components/JjodieWidget/`, and `jjtl/services/`.

### 1.3 Top 20 files by line count — [measured]

Files **> 1,500 lines flagged ⚑** (27 total: 16 `.ts/.tsx`, 10 `.scss/.css`, 1 vendored `.js`).

| Lines | Path |
|--:|---|
| 7,773 ⚑ | `model/logicWrapper/LModelElement.tsx` |
| 5,495 ⚑ | `common/libraries/jscss.js` *(vendored)* |
| 4,196 ⚑ | `joiner/classes.ts` |
| 3,692 ⚑ | `components/editor-v2/EditorV2.scss` |
| 3,678 ⚑ | `common/U.tsx` |
| 3,641 ⚑ | `components/editors/views/nestedView.scss` |
| 3,448 ⚑ | `components/editor-v2/EditorV2.tsx` |
| 2,964 ⚑ | `jjtl/executor/executor.ts` |
| 2,784 ⚑ | `components/Jodie/JodieWindow.css` |
| 2,772 ⚑ | `model/dataStructure/GraphDataElements.tsx` |
| 2,751 ⚑ | `components/project/ProjectEditor.tsx` |
| 2,517 ⚑ | `jjtl/styles/jjtl.scss` |
| 2,283 ⚑ | `pages/components/navbar.scss` |
| 2,050 ⚑ | `pages/components/Navbar.tsx` |
| 2,047 ⚑ | `common/libraries/jqui-types.ts` *(vendored)* |
| 1,901 ⚑ | `components/TreeViewSidebar/tree-view-sidebar.scss` |
| 1,898 ⚑ | `components/editors/Console/console-tab.scss` |
| 1,888 ⚑ | `components/TreeViewSidebar/TreeViewContent.tsx` |
| 1,835 ⚑ | `components/editors/views/data/palette-data.scss` |
| 1,826 ⚑ | `components/abstract/tabs/DocumentationTab.scss` |

Below the top 20 but still ⚑: `common/DV.tsx` (1,816), `view/viewElement/view.tsx` (1,771), `components/editors/info-improvements.scss` (1,692), `components/editor-v2/utils/edgeUtils.ts` (1,623), `redux/reducer/reducer.ts` (1,578), `graph/graphElement/graphElement.tsx` (1,550), `components/editor-v2/sync/canvasToJjom.ts` (1,547).

Two of the ⚑ files are **vendored libraries** (`common/libraries/jscss.js`, `common/libraries/jqui-types.ts`), not hand-authored app code.

### 1.4 Dependencies — [measured]

`package.json`: **66 runtime dependencies**, **17 devDependencies**. Note the split is non-standard — `typescript`, `sass`, `serve`, `@vitejs/plugin-react`, and the `@types/*` packages are listed under **`dependencies`**, not `devDependencies`.

Heavyweight / notable runtime deps (explain the build profile in §1.5):

| Dependency | Version | Role |
|---|---|---|
| `monaco-editor` + `@monaco-editor/react` | 0.52.2 / 4.7.0 | code editor → emits the 6 MB `ts.worker` + language chunks |
| `@xyflow/react` | 12.10.0 | flow-v2 editor (React Flow) |
| `@stekoe/ocl.js` | 1.4.5 | OCL engine (view `oclCondition`) |
| `nearley` / `ohm-js` | 2.20.1 / – | grammar parsers (DSL / languages) |
| `handlebars` | 4.7.8 | M2T templating |
| `jquery` + `jqueryui` | 3.7.1 | legacy DOM/interaction layer |
| `elkjs` + `@dagrejs/dagre` | – | graph auto-layout |
| `rc-dock` | – | docking tab/panel manager |
| `redux` + `react-redux` | – | global D-layer state |
| `react-syntax-highlighter`, `react-markdown`, `sweetalert2`, `react-select` | – | UI |

### 1.5 Build output — [measured] (`vite build`, run this session, 56.9 s)

`dist` total **86 MB**. `chunkSizeWarningLimit` is **not configured** in `vite.config.ts` → Vite default **500 kB**. No `manualChunks` is set, so the app is one monolithic entry chunk.

| Chunk | Size (raw) | gzip |
|---|--:|--:|
| `assets/index-*.js` | 15.6 MB | 3.85 MB |
| `assets/ts.worker-*.js` | 6.0 MB | – |
| `assets/css.worker-*.js` | 1.04 MB | – |
| `assets/html.worker-*.js` | 705 kB | – |
| `assets/json.worker-*.js` | 395 kB | – |
| `assets/editor.worker-*.js` | 264 kB | – |

Chunks exceeding the 500 kB threshold: the main `index` chunk, plus the Monaco `ts`/`css`/`html` workers (and the many small Monaco language chunks, e.g. `jsonMode` 41 kB … `htmlMode` 33 kB, which are individually under the limit). The build prints the standard "Some chunks are larger than 500 kB" warning for the `index` chunk and exits 0.

---

## 2. Quality signals

Each is a count, not a verdict.

### 2.1 TypeScript posture — [measured]

`tsconfig.json`: **`strict: true`** (line 18), **`noImplicitAny: true`** (13), `skipLibCheck: true` (14), `target: ES2020`, `module: esnext`, `noEmit: true`.

Counts across the 829 `.ts/.tsx` files in `src` (`grep` occurrence count / file count):

| Marker | Occurrences | Files |
|---|--:|--:|
| `as any` | 2,349 | 230 |
| `: any` (annotation) | 1,640 | 189 |
| `@ts-ignore` | 225 | 85 |
| `@ts-expect-error` | 0 | 0 |
| `@ts-nocheck` | 0 | 0 |
| `eslint-disable` (any form) | 39 | 23 |
| non-null assertion `!.` *(proxy)* | 205 | – |
| non-null assertion `!)` *(proxy)* | 51 | – |

Non-null counts are an **approximate proxy** (`!.` / `!)`); they exclude the very common definite-assignment declarations (`field!: T`) ubiquitous in the D/L layer, which are not risky assertions.

Top offenders:
- `as any`: `LModelElement.tsx` (202), `joiner/classes.ts` (166), `common/U.tsx` (109), `GraphDataElements.tsx` (84), `editor-v2/hooks/useJjomSync.ts` (60), `redux/reducer/reducer.ts` (56).
- `: any`: `common/libraries/jqui-types.ts` (160, **vendored**), `common/U.tsx` (76), `editor-v2/sync/canvasToJjom.ts` (75), `joiner/classes.ts` (63), `jjtl/executor/executor.ts` (63), `LModelElement.tsx` (59).
- `@ts-ignore`: `joiner/classes.ts` (24), `joiner/ExecuteOnRead.ts` (17), `LModelElement.tsx` (10), `forEndUser/Selector.tsx` (10), `common/U.tsx` (8).

Signal: `strict` is on, but the D/L proxy core (`LModelElement.tsx`, `classes.ts`, `U.tsx`) concentrates most of the `any`/`@ts-ignore` escapes — i.e. strictness is locally suppressed where the metaprogramming lives.

### 2.2 `tsc --noEmit` — [measured]

**87 errors total** (confirms the known baseline). Categorised by code:

| Code | Count | Category |
|---|--:|---|
| TS2307 | 55 | Cannot find module — **54 asset imports** (`.svg/.png/.webp/.jpg/.css`, resolved by Vite, not tsc) + 1 `vite/dist/...` internal (`common/Dummy.ts`) |
| TS1261 + TS1149 | 19 | Filename **casing** (`components/Settings` vs `components/settings`) |
| TS7053 | 4 | implicit-any index |
| TS2339 | 2 | property does not exist |
| TS2322 | 2 | type not assignable |
| TS2304 | 2 | cannot find name `DDataType` (`api/data.ts`) |
| TS2769 | 1 | overload mismatch — `components/project/ProjectEditor.tsx:177` (the known one) |
| TS2552 | 1 | cannot find name `jquievent` |
| TS2345 | 1 | argument type |

So **74/87** are non-blocking environmental (asset resolution + casing) and **13** are genuine type errors. The app **builds and runs despite all 87** because Vite/esbuild transpiles without type-checking and handles asset modules.

### 2.3 ESLint — [not measured]

An `eslintConfig` block exists in `package.json:122` (preset `react-app`/`react-app/jest`, with `@typescript-eslint/no-unused-vars: 0`), but the `eslint` binary is **not installed** (`node_modules/.bin/eslint` absent) and there is **no `lint` script**. Cannot be run without installing → not measured.

### 2.4 Tests — [partially measured]

- **25 test files** under `src` (`*.test.ts(x)`, `__tests__/`). `git ls-files` count.
- Framework: **vitest 4.1.1** (devDependency) alongside `@types/jest`.
- **No `test`, `coverage`, `typecheck`, or `lint` npm script exists** in `package.json` (only `build`, `start`, `serve`, `dev`, and assorted legacy/`tsc_*` scripts). The suite therefore cannot be invoked through `package.json`, and coverage is **not measured** (no coverage script; not run).
- ⚠ **Conflict with `CLAUDE.md` §17**, which lists `npm run test`, `npm run typecheck`, `npm run test:watch`, and `npm run lint` as available — none of these scripts exist in `package.json`. Only `npm run build` (`vite build`) is real. Flagged per the prompt's instruction to surface `CLAUDE.md` discrepancies.

### 2.5 Hygiene — [measured]

In `src` `.ts/.tsx`:

| Marker | Count |
|---|--:|
| `console.log` | 1,013 |
| `console.warn` | 241 |
| `console.error` | 198 |
| `console.debug` | 10 |
| `TODO` | 50 |
| `XXX` | 1 |
| `FIXME` / `HACK` | 0 |

Top files by `TODO/FIXME/HACK/XXX`: `components/project/ProjectEditor.tsx` (8), `ai/viewpointIR/IRView.tsx` (5, the `// TODO 2b:` markers added this session), `pages/components/Dashboard.tsx` (3), `LModelElement.tsx` (3), `common/Geom.ts` (3). Signal: `console.log` density is high (CLAUDE.md §2/§20 require these be removed before commit; 1,013 remain in tracked code).

### 2.6 Size as a complexity proxy — [measured] (file-size only)

| Threshold | Code files (`.ts/.tsx`) | Style files (`.scss/.css`) |
|---|--:|--:|
| > 800 lines | 44 | 33 |
| > 1,500 lines | 16 | 10 |
| > 3,000 lines | 4 | 2 |

Code files > 3,000 lines: `LModelElement.tsx` (7,773), `classes.ts` (4,196), `U.tsx` (3,678), `EditorV2.tsx` (3,448). Per-function cyclomatic complexity: **not measured** (no complexity tool/lint rule available).

### 2.7 Dead exports / duplication — [not measured]

`ts-prune` and `jscpd` are absent. Unused-export and copy-paste metrics not measured. (Caveat for any future run: components re-exported through the `joiner` barrel are placed on the global scope — see §3A — so a dead-export tool would report many false positives.)

---

## 3. Architecture and extension

### 3A. Extension mechanisms (static) — [measured: paths verified to exist]

Two-level `src/` shape (selected): `ai/viewpointIR`, `api/{DTO,memorec,persistance}`, `common/{libraries}`, `components/{abstract,editor-v2,editors,Jodie,JjodieWidget,megamodel,envgen,modelling,import,export,contextMenu,edgeOverlay,…}`, `model/{logicWrapper,dataStructure}`, `view/viewElement`, `graph/{graphElement,vertex,defaultNode,damedges}`, `joiner`, `redux/{reducer,action,selectors}`, `jjel`, `jjtl/{lexer,parser,executor,analyzer,services,diagrams}`, `jjscript/{lexer,parser,executor,normalizer}`, `jjodie/{rag}`, `jjodie-integration`, `services/export`, `DSL`, `ocl`, `events`.

Extension points, with anchors that exist on disk:

- **D / L / M layer model.** D-layer (Redux raw) entities `DObject`, `DModel`, `DViewElement`, `DGraphElement` are declared/constructed in `joiner/classes.ts` (4,196 lines; `Constructors.*`). The L-layer computed proxy is `model/logicWrapper/LModelElement.tsx` (7,773 lines; `class LModel` at line 4,774, `get_instanceof` etc.). Graph data structures in `model/dataStructure/GraphDataElements.tsx` (2,772). M2 (metamodel) identity is via `data.instanceof` → `LClass`.
- **`joiner` components barrel → global scope.** `joiner/components.tsx` re-exports every renderable component; `joiner/ExecuteOnRead.ts:114-121` assigns each to `windoww[k]` (global), making it referenceable inside `jsxString` templates with no separate allowlist. This is the registration path used by the new `IRView`.
- **Classic view system (`jsxString`).** Templates are compiled at runtime via `redux/reducer/reducer.ts` (`new Function`, line ~995) and `common/UX.tsx` (`JSXT.fromString`); default views live in `common/DV.tsx` (1,816) and `utils/defaultViewTemplate.ts` (`DEFAULT_VIEW_JSX_STRING`). View selection (`appliableToClasses`, `oclCondition`, `jsCondition`, `isExclusiveView`) in `redux/selectors/selectors.ts`. View entity schema in `view/viewElement/view.tsx` (1,771).
- **New runtime IR interpreter.** `ai/viewpointIR/{types.ts, IRView.tsx, __irviewProbe.ts}` (422 lines, **uncommitted working tree**, this session) — a single registered component that renders a node from a typed IR read off `view.__raw.ir`, with JS-predicate (`jsCondition`) selection. Reached from a one-line `jsxString` stub. See `docs/discovery/discovery_2026-06-08_ir_runtime_interpreter_feasibility.md`.
- **Flow-v2 editor.** `components/editor-v2/EditorV2.tsx` (3,448) + `editor-v2/sync/{useJjomSync.ts, canvasToJjom.ts (1,547)}` + `editor-v2/utils/{edgeUtils.ts (1,623), portDistribution.ts}` + `edges/routing/classic/`. Coexists with the classic editor (`components/abstract/tabs/{ModelTab,MetamodelTab}.tsx`).
- **Viewpoint system.** `view/viewElement/view.tsx`, `utils/lastViewpoint.ts` (`createViewInWorkbench`, `resolveParentViewpoint`), ViewpointWorkbench under `components/`.
- **Languages.** `jjel/` (7,285; expression engine, own lexer/parser/evaluator), `jjtl/` (26,603; model-to-model transformation; `jjtl/executor/executor.ts` 2,964, `jjtl/executor/astBridge.ts` delegates expressions to JjEL), `jjscript/` (23,231; imperative metamodel scripting). Each has `lexer/parser/executor`.
- **Custom DOM events.** Typed registry in `events/registry.ts` (`JjodelEvents`, `JjScriptEvents`, `AIEvents`, etc.); cross-cutting UI uses CustomEvent + local `useState`.
- **AI assistants.** `jjodie/` (3,129; includes `jjodie/rag/chunker.ts`) and `jjodie-integration/` (1,255; `JjodieAPIImpl.ts`, `jjscriptGenerationPrompt.ts`, `useMetamodelGeneration.ts`); UI in `components/Jodie/` + `components/JjodieWidget/` (24 component files). The JjTL **AIMatcher** is `jjtl/services/AIMatcher.ts` (+ `SimpleMatcher.ts`, `MappingSuggestionService.ts`). The viewpoint generator is `ai/viewpointIR/` (above).

### 3B. Evolution (git) — [measured]

**Commits.** Total **2,060** (`git rev-list --count HEAD`). Last 12 months:

| Month | Commits | Month | Commits |
|---|--:|---|--:|
| 2025-06 | 41 | 2025-12 | 26 |
| 2025-07 | 65 | 2026-01 | 99 |
| 2025-08 | 72 | 2026-02 | 71 |
| 2025-09 | 100 | 2026-03 | 121 |
| 2025-10 | 26 | 2026-04 | 71 |
| 2025-11 | 26 | 2026-05 | **155** |
| | | 2026-06 | 20 *(partial, to the 8th)* |

**Churn by area, last 6 months** (`git log --since='6 months ago' --numstat`, added/removed):

| Area | Added | Removed | Net |
|---|--:|--:|--:|
| components | 189,182 | 71,565 | +117,617 |
| jjtl | 30,616 | 2,936 | +27,680 |
| jjscript | 24,191 | 964 | +23,227 |
| pages | 22,344 | 7,991 | +14,353 |
| services | 12,025 | 1,648 | +10,377 |
| jjel | 8,024 | 95 | +7,929 |
| styles | 6,560 | 875 | +5,685 |
| utils | 3,609 | 136 | +3,473 |
| jjodie | 3,138 | 9 | +3,129 |
| model | 2,989 | 1,081 | +1,908 |

**Current-branch footprint** (`alfonso-frontend-jjtl` vs `origin/master`, fetched fresh). `origin/main` does **not exist**; the repo's main branch is `master` (the prompt says `origin/main` — discrepancy noted). `merge-base = 18f1c29b` dated **2025-10-24**; **786 commits** since; **808 files added, 193 modified** under `src`. Net lines by area on the branch:

| Area | Added | Removed |
|---|--:|--:|
| components | 127,661 | 5,773 |
| jjtl | 27,679 | 0 |
| jjscript | 23,231 | 0 |
| pages | 17,563 | 2,883 |
| services | 10,377 | 0 |
| jjel | 7,929 | 0 |
| common | 4,210 | 546 |
| model | 3,326 | 1,066 |
| jjodie | 3,129 | 0 |
| jjodie-integration | 1,640 | 0 |

`jjtl`, `jjscript`, `jjel`, `services`, `jjodie`, `jjodie-integration` have **0 deletions** → entirely net-new on this branch. Because the branch carries 786 commits over ~7.5 months, it is the active development line rather than a small topic branch.

**First appearance of `src` folders** (`git log --diff-filter=A --reverse`):

| Date | Folder(s) |
|---|---|
| 2024-11-21 | `model`, `common`, `components` (earliest tracked) |
| 2024-11-24 | `joiner`, `view`, `graph`, `redux`, `pages`, `hooks`, `DSL`, `ocl` |
| 2026-01-19 | `services` |
| 2026-01-21 | `contexts` |
| 2026-01-30 | `jjodie`, `jjscript` |
| 2026-02-01 | `jjtl`, `jjodie-integration` |
| 2026-02-06 | `jjel` |
| 2026-05-04 | `edges` |
| (uncommitted) | `ai` (`viewpointIR`, this session — no commit yet) |

Order of major extensions: a platform core in **Nov 2024** (D/L/M, classic view, redux), then a concentrated **late-Jan/early-Feb 2026 burst** that added the AI assistant (`jjodie`), the three languages (`jjscript`, `jjtl`, `jjel`), and `services`; the `edges` routing module in **May 2026**; and the IR viewpoint generator (`ai/`) now, **uncommitted**.

---

## Observations (only what the numbers support)

1. ~302,900 lines of code+style; `components/` is ~46% of it, and the **6 largest code files** (`LModelElement.tsx` 7,773, `classes.ts` 4,196, `U.tsx` 3,678, `EditorV2.tsx` 3,448, `executor.ts` 2,964, `GraphDataElements.tsx` 2,772) are the D/L/M core, the flow-v2 editor, and JjTL — i.e. mass is concentrated in the platform core and the editors.
2. `strict: true` coexists with **2,349 `as any` + 1,640 `: any` + 225 `@ts-ignore`**, concentrated in the metaprogramming core (`LModelElement.tsx`, `classes.ts`, `U.tsx`) — strictness is locally suppressed exactly where the proxy machinery is.
3. The **87 `tsc` errors are 85% environmental** (54 Vite-resolved asset imports + 19 filename-casing) and 13 genuine type errors; the build does not type-check (esbuild), so these do not block it.
4. There is **no runnable test/lint/typecheck/coverage npm script** despite 25 vitest files and an `eslintConfig` — and `CLAUDE.md §17` claims four such scripts that do not exist. Verification tooling is not wired up through `package.json`.
5. **1,013 `console.log`** remain in tracked `src`, against the CLAUDE.md rule to strip them before commit.
6. The app ships as one **15.6 MB `index` chunk** (no `manualChunks`, default 500 kB warning threshold) plus Monaco workers (`ts.worker` 6 MB) → an 86 MB `dist`.
7. Git history shows a deliberate platform→languages→AI build-out: a Nov-2024 core, a Jan–Feb-2026 burst (languages + Jjodie + services, all net-new on the current branch), `edges` in May-2026, and the IR generator landing now.

## Limitations

- **Tools unavailable** (not installed, not run): `cloc`/`tokei` (used `git ls-files`+`wc -l` instead), `ts-prune` (dead exports — not measured), `jscpd` (duplication — not measured), `eslint` (lint — not measured), and any cyclomatic-complexity tool (used file-size as a coarse proxy only).
- **Tests not executed** and **coverage not measured** (no npm script; not run, per "do not install / do not work around").
- **Line counts** include vendored files (`common/libraries/jscss.js` 5,495, `jqui-types.ts` 2,047) and a few test fixtures; these are flagged inline but not subtracted from totals. Binary assets are excluded from line counts.
- **Non-null assertion** figures are a regex proxy (`!.`, `!)`), not an AST count.
- **Branch footprint** is measured against a fresh-fetched `origin/master` (repo has no `origin/main`); the 2025-10-24 merge-base means it reflects ~7.5 months of divergence, not an isolated feature.
- `dist` sizes are from a `vite build` run during this session, not a CI artifact.

---

*Read-only analysis. No source file modified. Generated 2026-06-08 on branch `alfonso-frontend-jjtl`.*
