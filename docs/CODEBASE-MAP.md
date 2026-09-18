# Codebase map

An index of the codebase, not a norm. Moved verbatim out of the root `CLAUDE.md` (§18 and §19, with
19.1 to 19.5) on 2026-09-19 (P-2026-09-18-2110) to bring the root under the 40,000-character limit.
The section numbers are kept so that an old reference to "CLAUDE.md §19.1" still finds its table here.

---

## 18. Project structure (top level) — mappa parziale

> This map lists the normated modules, not the complete tree. The repo
> contains additional directories; when in doubt, explore.

```
frontend/src/
├── components/
│   ├── abstract/           # Tabs, DockManager
│   ├── editor-v2/          # React Flow editor (hooks, sync, panels, problems)
│   ├── import/             # Importers + ImportSummaryModal
│   ├── project/            # ProjectEditor, Dashboard
│   ├── Jodie/              # Jodie assistant UI
│   └── shared/             # JsonViewer (vestigial)
├── common/                 # DV.tsx (default view runtime)
├── events/                 # registry.ts
├── jjel/                   # Expression Language
├── jjscript/               # Scripting Language
├── jjtl/                   # Transformation Language
├── joiner/                 # Core utilities, Redux, data layer
├── model/                  # LModelElement, logic wrappers
├── redux/                  # VersionFixer, store, actions
├── services/export/        # Ecore + XMI I/O
├── styles/                 # tokens/, variables.scss
├── utils/                  # defaultViewTemplate, lastViewpoint
└── pages/
```

---

## 19. Key files reference

### 19.1 Sync / D-L layer (critical)

| File | Role |
|------|------|
| `components/editor-v2/hooks/useJjomSync.ts` | Main sync hook. TRANSACTION rules in §3.3. |
| `components/editor-v2/hooks/useM1ReferenceEdges.ts` | Supplements Step 4 for M1 refs post-mount (§3.5). |
| `components/editor-v2/sync/syncState.ts` | `hasCanvasEdgePair`, `markCanvasEdgePair` (§3.4). |
| `components/editor-v2/sync/canvasToJjom.ts` | Canvas → JjOM write-back. |
| `components/editor-v2/utils/portDistribution.ts` | Role-aware bucket keys (§3.10). |
| `redux/VersionFixer.tsx` | jsxString migrations (§3.9). |
| `utils/defaultViewTemplate.ts` | `DEFAULT_VIEW_JSX_STRING` + markers. |
| `common/DV.tsx` | Default view runtime. |
| `components/import/buildImportSummary.ts` | Backward-link counters (§3.6). |
| `components/import/ImportSummaryModal.tsx` | Reference CustomEvent+useState pattern (§8.7). |

### 19.2 Editors

| File | Role |
|------|------|
| `components/editor-v2/EditorV2.tsx` | Main v2-flow editor (3000+ lines). |
| `components/project/ProjectEditor.tsx` | Project dashboard. |
| `components/abstract/DockManager.tsx` | Tabs and panels. |

### 19.3 Language engines

| File | Role |
|------|------|
| `jjtl/executor/executor.ts` | `JjtlExecutor` — transformation execution. |
| `jjtl/executor/astBridge.ts` | `toJjelAst()` — JjTL → JjEL expressions. |
| `jjel/evaluator/evaluator.ts` | `JjelEvaluator` — expression evaluation. |
| `jjel/evaluator/context.ts` | `EvaluationContext` — scope and bindings. |

### 19.4 Services

| File | Role |
|------|------|
| `services/export/EcoreService.ts` | Ecore I/O. |
| `services/export/XMIService.ts` | XMI I/O. |
| `events/registry.ts` | Custom events typed constants (§8.6). |

### 19.5 UI shell

| File | Role |
|------|------|
| `Navbar.tsx` + `navbar.scss` | App bar (header row 1). |
| `Toolbar.tsx` | Toolbar (header row 2). |
| `Info.tsx` + `info.scss` | Properties panel. |
