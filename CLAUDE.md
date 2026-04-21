# CLAUDE.md — Jjodel Project Reference

> Riferimento operativo per Claude Code. Contiene ciò che non si deduce leggendo il codice: convenzioni, pattern critici, boundaries tra linguaggi, gotchas. Tutto il resto vive in `docs/` o nel sorgente.

---

## Contesto

**Jjodel** è un metamodeling tool open-source per ricerca ed educazione. Consente di creare metamodelli e modelli, definire ed eseguire trasformazioni model-to-model (JjTL), manipolare metamodelli via scripting (JjScript), valutare espressioni sui modelli (JjEL).

**Users:** ricercatori, educatori, studenti (beginner → expert).
**Focus attuale:** UI redesign (~60% completato), ridurre cognitive load mantenendo full functionality.

---

## Tech Stack

React 18 · TypeScript (strict) · Vite · Redux · Monaco Editor · Bootstrap Icons · SCSS.

**Librerie interne chiave:**
- `LPointerTargetable` — sistema di riferimenti tra oggetti
- `DModel`, `DObject`, `DGraph` — Data layer (D = Data, puri, serializzabili)
- `LModel`, `LObject`, `LClass` — Logic layer (L = Logic wrapper, con computed properties)
- `SetFieldAction`, `SetRootFieldAction` — Redux actions

---

## Comandi di sviluppo

```bash
npm run dev          # dev server Vite
npm run test         # test suite (211 tests attuali)
npm run test:watch
npm run typecheck    # tsc --noEmit
npm run build
npm run lint
```

---

## Struttura Progetto

```
frontend/src/
├── components/
│   ├── abstract/tabs/      # ModelTab, MetamodelTab
│   ├── editor-v2/          # React Flow-based editor (hooks, sync, panels)
│   ├── project/            # ProjectEditor, Dashboard
│   └── shared/
├── jjtl/                   # Transformation Language (lexer, parser, executor, editor, views, types, __tests__)
├── jjscript/               # Scripting Language (parser, executor, commands)
├── jjel/                   # Expression Language (lexer, parser, evaluator + builtins, types, __tests__)
├── joiner/                 # Core utilities, Redux, data layer
└── pages/
```

---

## Convenzioni Codice

**Naming:** Componenti PascalCase · Funzioni camelCase · Costanti UPPER_SNAKE_CASE · File SCSS kebab-case.

**TypeScript:** Props interfaces esportate dal file del componente. Functional components con hooks. Strict mode.

**Import order:** React → librerie esterne → componenti interni → types → styles.

**Actions pattern:**
```typescript
SetFieldAction.new(objectId, 'fieldName', value, '+=', true);
SetRootFieldAction.new('graphs', graphId, '+=', true);
TRANSACTION('Description', () => { /* multiple actions */ });
```

**Progressive Disclosure:** modalità Basic (default) vs Advanced. Nascondere complessità finché non serve.

**State:** Redux per stato globale, `useState` per UI locale, `useRef` per valori che non devono triggerare re-render.

---

## Design System

**Full spec:** `docs/DESIGN-SYSTEM.md` — single source of truth per colori, catalogo componenti, layout patterns, interaction behaviors.

**Essenziale da ricordare:**

- **Icone:** SOLO Bootstrap Icons (`bi bi-*`). Mai altre librerie.
- **Font code:** `'IBM Plex Mono', Monaco, Consolas, monospace`.
- **Grid base:** 8px. Padding standard: 8 / 12 / 16 / 24.
- **Cyan (#0ea5e9):** MAI come background di bottoni. Solo focus states, active indicators, link.
- **Primary buttons:** slate gradient `linear-gradient(135deg, #334155, #1e293b)`. Icone bianche.
- **Toggle switch orizzontali** (ovunque tranne debug toolbar): 36×20px, active `#334155` (slate, NOT cyan), inactive `#cbd5e1`. Label sempre a sinistra, mai dentro. Implementazione: `jjodel-switch.scss`.
- **Toggle verticali:** solo per debug/advanced mode nella navbar.
- **Multi-select:** tag chips slate-100 (`#f1f5f9`), border slate-200, label slate-700. Selected option cyan sottile `rgba(14,165,233,0.08)`. Implementazione: `inputselect.scss`, `viewapplyto.scss`.

### Token System (aggiornato 2026-04-06)

**Single source of truth:** `styles/tokens/_colors-light.scss` + `_colors-dark.scss` (entrambi, sempre). Entry point: `styles/tokens/index.scss`. Variabili attive in `styles/variables.scss`.

**Token legacy ELIMINATI — non reintrodurre:**
`--accent` (usare `--color-accent`) · `--bg-1..5` · `--secondary` · `--terziary` (sic — anche il typo è eliminato) · `--radius` · `--color` (ambiguo — usare `--color-text-primary` o `--color-accent`).

**Regole nuovi token:**
- `grep -r` prima di aggiungere, per evitare collisioni
- Aggiungere SEMPRE in entrambi i file (light + dark)
- MAI variabili CSS dentro file di componente — tutto in `tokens/`
- Le collisioni di nomi CSS non danno errori di compilazione: si manifestano come bug visivi silenziosi

---

## JjEL — Expression Language

Motore di valutazione delle espressioni, usato sia da JjTL che da JjScript. Linguaggio standalone con lexer/parser/evaluator/type system propri.

**Spec completa:** `frontend/src/jjel/SPEC.md`

### Core Constructs

| Costrutto | Sintassi | Esempio |
|-----------|----------|---------|
| Member access | `obj.prop` | `source.name` |
| Null-safe | `obj?.prop` | `source?.owner` |
| Method call | `obj.method()` | `name.toUpper()` |
| Null coalesce | `a ?? b` | `name ?? "default"` |
| Conditional | `if c then a else b` | |
| Type check | `x is Type` | `value is String` |
| Implication | `a implies b` | |
| Lambda | `x => expr` | `x => x.name` |
| ForAll (set comp.) | `forall x in S [such that \| P] [: proj]` | `forall a in attrs \| a.isPublic : a.name` |
| Exists | `exists x in S (such that \|) pred` | |
| With...do | `with expr do body` | `with parent do name.camelCase()` |
| Array literal / index | `[a,b,c]` / `arr[i]` | |
| Line comment | `-- comment` | |

### Operator precedence (low → high)

1. `if/then/else`, `forall`, `exists`, `with...do`
2. `??`
3. `implies` (right-associative)
4. `or`
5. `and`
6. `==`, `!=`
7. `<`, `>`, `<=`, `>=`
8. `is`
9. `+`, `-` (`+` anche string concat)
10. `*`, `/`, `%`
11. `not`, `-` unary
12. `.`, `?.`, `()`, `[index]`

### Design decisions

- `forall` in JjEL ha **semantica set-theoretic** (ritorna un set, non boolean)
- `do` keyword esiste SOLO in `with...do`
- Lambda usa `=>` (non `:`) per evitare conflitto con forall projection
- Implicit context: Console usa nodo selezionato; JjTL usa matched source element
- Truthiness: `null`, `false`, `0`, `""`, `[]` sono falsy

### Built-ins

100+ metodi built-in, suddivisi in 4 moduli (`builtins/`): strings (35+), collections (30+), numbers (35+), dates (35+). Per l'elenco completo vedi la spec.

### EvaluationContext

Scoped binding con parent-child:
```typescript
const child = parentCtx.child({ myVar: someValue });
// child eredita i binding del parent + aggiunge myVar
```
Usato da JjTL executor per passare variabili forall nei nested scopes.

---

## JjTL — Transformation Language

**Spec completa:** `frontend/src/jjtl/SPEC.md`
**Design document:** `___JjTL__1_.pdf` (rationale + comparative analysis con ATL, ETL, QVT-R, QVT-O)
**Roadmap:** `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md` (8 fasi + invertibility analysis)

### Sintassi essenziale

```jjtl
transformation NomeTransformazione
from SourceMetamodel
to   TargetMetamodel

SourceClass -> TargetClass {
    sourceAttr -> targetAttr                          -- copia diretta
    sourceAttr -> targetAttr : true=1, false=0        -- value mapping
    sourceAttr -> targetAttr : sourceAttr + "_suffix" -- espressione JjEL
    -> Arc { place -> source.map() }                  -- object creation inline

    forall a in attributes such that not a.multiValued -> Column {
        -> name : a.name.snakeCase()
        -> type : a.type
    }
}
```

### AST Bridge — architettura critica

JjTL **non ha** un suo expression evaluator. Tutte le espressioni vengono delegate a JjEL via `astBridge.ts`:

```
JjTL Parser → JjTL AST → astBridge.toJjelAst() → JjEL AST → JjelEvaluator.evaluate()
```

Mapping chiave in `astBridge.ts`:
- `FunctionCall` → `MethodCall` (se callee è MemberAccess) altrimenti `Identifier`
- `BinaryExpression` → `Binary` con normalizzazione operatori: `=`→`==`, `<>`→`!=`
- `ConditionalExpression` → `IfThenElse`
- `JjelExpression` wrapper → unwrap dell'inner expression

### Execution flow (`JjtlExecutor`)

1. Parse JjTL code → AST
2. **Deep-copy** del source model (prevents mutation)
3. Estrae source instances (supporta sia flat array sia `{classes, instances}`)
4. Per ogni class mapping: filtra istanze, crea target, applica attribute mappings, esegue ForAll
5. Output: `ExecutionResult` con `targetModel.instances: Map<string, any[]>`

**ForAll execution:** valuta collection → itera → applica filtro `such that` via JjEL → crea child context con variabile forall → esegue object creation per elemento → stora sotto nome pluralizzato (`Column` → `columns`).

**Integrazione con framework Jjodel:** l'executor produce dati puri senza dipendenze. `ProjectEditor` prende `ExecutionResult` e crea `DModel` + `DGraph` via API framework, usando il deferred attribute pattern (sotto).

### ⚠️ Pattern Critici per Object Persistence

**Non dedurre mai questi comportamenti: sono counter-intuitivi e hanno già causato giorni di debug.**

**1. `DObject.new()` ritorna ID temporanei.** Non corrispondono all'ID reale nel framework. Gli oggetti NON sono accessibili via `store.getState()[dObject.id]`.

```typescript
// ❌ SBAGLIATO — ID temporaneo, lookup fallisce
const dObject = DObject.new(classId, modelId, DModel, name, true);
store.getState()[dObject.id]; // undefined

// ❌ SBAGLIATO — SetFieldAction non scrive valori leggibili dal proxy
SetFieldAction.new(featurePointer, 'values', [value], '', true);

// ✅ CORRETTO — trova per NOME via proxy LModel
const lModel = LPointerTargetable.fromD(modelId) as LModel;
const lObject = lModel.objects.find(o => o.name === objectName);

// ✅ CORRETTO — scrivi valori via proxy
(lObject as any)['$' + attrName].value = attrValue;
```

**2. Deferred attribute setting.** Dopo una TRANSACTION che crea oggetti, i proxy non sono immediatamente disponibili. Usa `setTimeout` per attendere la propagazione Redux:

```typescript
// Dentro TRANSACTION: accumula per NOME (non ID!)
const pending: Array<{ objectName: string; attributes: Record<string, any> }> = [];

TRANSACTION('Create Objects', () => {
    const dObject = DObject.new(classId, modelId, DModel, name, true);
    pending.push({ objectName: name, attributes: { label: 'value' } });
});

// Dopo TRANSACTION: delay + proxy
setTimeout(() => {
    const lModel = LPointerTargetable.fromD(modelId) as LModel;
    for (const { objectName, attributes } of pending) {
        const lObj = lModel.objects.find(o => o.name === objectName);
        if (!lObj) continue;
        for (const [attr, val] of Object.entries(attributes)) {
            (lObj as any)['$' + attr].value = val;
        }
    }
}, 1000);
```

**3. `evaluatePropertyPath` — 4 strategie fallback.** L'executor risolve nomi proprietà in ordine:
(a) direct access `source[path]` per proprietà istanza
(b) context lookup `ctx.get(path)` per variabili
(c) JjEL eval `jjelEval(path, record)` per espressioni complesse
(d) manual traversal (split per `.`) per path come `source.owner.name`

**CRITICO:** `contextToRecord()` deve includere TUTTE le proprietà dell'istanza source, non solo le variabili hardcoded.

### Language Boundaries — JjEL / JjTL / JjScript

| Aspetto | JjEL | JjTL | JjScript |
|---------|------|------|----------|
| Purpose | Expression evaluation | Model-to-model transformation | Metamodel scripting |
| Nature | Pure (no side effects) | Declarative + side effects | Imperative |
| Own evaluator? | Yes (`JjelEvaluator`) | No — delega a JjEL via AST bridge | Yes (command executor) |
| `forall` semantica | Boolean quantifier: `coll.forAll(x: pred)` | Mapping constructor: `forall x in coll -> Type {...}` | N/A |

**Ownership dei simboli:**
- `do` — SOLO in JjEL `with...do`. Non altrove.
- `->` — SOLO in JjTL (mapping arrow). Non in JjEL.
- `:` — JjEL forall projection + JjTL conversion/value mapping (distinti dal contesto).
- `=>` — Lambda in entrambi JjEL e JjTL.
- `--` — Commenti in entrambi JjEL e JjTL.

### Checklist OBBLIGATORIA quando modifichi sintassi JjTL

Aggiornare SEMPRE tutti e 5 i file — non aggiornare mai solo il parser:

1. `frontend/src/jjtl/types/tokens.ts` — token types + `JJTL_KEYWORDS` map
2. `frontend/src/jjtl/lexer/lexer.ts` — tokenizzazione (usa `JJTL_KEYWORDS`)
3. `frontend/src/jjtl/parser/parser.ts` — regole di parsing
4. `frontend/src/jjtl/diagrams/types.ts` — EBNF in `GRAMMAR_RULES`
5. `frontend/src/jjtl/diagrams/GrammarDiagram.tsx` — rendering railroad visuale

I railroad diagrams sono documentazione visiva user-facing e NON si aggiornano automaticamente.

### Stato JjTL (2026-03-10)

**Funzionante:** class mapping · attribute mapping (diretto + value mapping + JjEL conversion) · forall mapping · guard conditions (`when`) · helper functions (registrati come JjEL builtins) · JjEL expressions via AST bridge · 211 tests passing.

**Aperti (da completare):**
- Reference mapping (oggetti collegati tra modelli)
- Multiplicity constraints — parsed ma non enforced (executor crea sempre 1)
- Interactive statements (`alert`, `notify`, `prompt`, `input`) — parsed ma non wired a UIBridge
- Multiple source types: `[Class, Interface] -> Table {}`
- Undo/redo per trasformazioni
- Cleanup log di debug (executor ha verbose `console.log`)

### Known Limitations

- **Source attribute in forall:** `a.name -> targetAttr` non parsa (dotted source attrs). Workaround: conversion syntax `-> targetAttr : a.name`.
- **Source format:** flat array `[{className, ...}]` è più affidabile di `{classes, instances}` (il secondo ha un duplicate extraction bug).
- **Pluralization heuristic:** `targetClass.charAt(0).toLowerCase() + targetClass.slice(1) + 's'` — naive, da sostituire con strategy proper.

---

## Custom Events (stato 2026-04-06)

~38 eventi custom sono ancora stringhe hardcoded nei file principali (ProjectEditor, Toolbar, Navbar, TreeViewContent, EditorV2).

**Prossimo step:** centralizzare in `frontend/src/events/registry.ts` come costanti tipizzate. Prompt già pronto in `docs/claude-code-log.md`.

**Regole:**
- `grep -r` prima di aggiungere un nuovo evento
- I nomi degli eventi sono API interne — un rename richiede ricerca globale
- Non reintrodurre gli eventi di Editor V3 (vedi Componenti Rimossi)

---

## Componenti Rimossi (non reintrodurre)

### Editor V3 — rimosso 2026-04-06

23 file rimossi da `panels/viewpoint-editor/`, 5 file esterni aggiornati. Sostituito dall'approccio ViewpointWorkbench (editor classic). Flusso attuale:

```
DockManager.openViewpoint() → TabDataMaker → ViewpointWorkbench
```

**Eventi eliminati (non reintrodurre senza discussione):** `jjodel:viewCreated` + 3 eventi interni V3 (vedi git log 2026-04-06).

**3 TODO lasciati come bookmark** per futura sidebar approach — cercare `// TODO: sidebar`.

---

## Bug Aperti

| Bug | Stato | Note |
|-----|-------|------|
| Doppia esecuzione executor | ⚠️ APERTO | React double rendering (StrictMode) |
| "Error in View: Fallback" su target | ⚠️ APERTO | Rendering modello creato |
| ForAll pluralization naive | ⚠️ APERTO | `TargetClass + 's'` — serve strategy proper |

Bug risolti con root cause documentata: vedi `docs/bug-history.md`.

---

## Known Gotchas

**Monaco Editor intercetta F1 e altri shortcut.** Monaco registra listener `keydown` in bubble phase sul suo DOM e chiama `stopPropagation()`. Gli eventi non raggiungono `window`.
**Fix:** usare capture phase per shortcut globali:
```typescript
window.addEventListener('keydown', handler, true) // true = capture
```
Shortcut noti intercettati: F1 (command palette), F12 (go to definition).

**ContextMenu clippato da `overflow:hidden` del tab container.** `MetamodelTab` e `ModelTab` renderizzano `<ContextMenu>` dentro un `<div style={{overflow:'hidden'}}>`. Voci in fondo possono andare off-screen.
**Fix:** posizionare le voci importanti nei primi 5-6 slot.

**F1 su macOS richiede Fn+F1.** Senza Fn, F1 controlla la luminosità schermo e non raggiunge il browser. Il listener HelpDrawer usa capture phase correttamente — shortcut effettivo: Fn+F1.

---

## AI Provider System

Sistema unificato per AI providers (OpenAI, Anthropic, DeepSeek, Mistral, Gemini, Groq, Kimi, Ollama, Local).

**Dettagli architetturali completi:** `docs/ai-providers.md`.

**Pattern d'uso:**
```typescript
// Hook per preferenza per-feature
const provider = useAIProviderPreference('documentation');

// Dropdown riutilizzabile (supporta local options non-AI)
<ProviderSelector feature="chat" compact />

// Aprire Settings alla sezione Providers
settingsModal?.openSettings('providers');
```

**Feature IDs:** `'documentation'` · `'chat'` · `'scriptblock'` · `'mappings'`.

**Provider resolution order:** feature override → global default → first configured.

---

## Workflow & anti-pattern

**Al termine di ogni task che introduce nuovi pattern o convenzioni, proponi un aggiornamento a questo file.**

### Da NON fare

- ❌ Emoji nel codice (ok nelle risposte in chat)
- ❌ Librerie esterne senza discussione
- ❌ Modifiche al core senza approvazione
- ❌ Over-engineering per feature semplici
- ❌ `createM1()` per creare modelli target — genera nomi automatici
- ❌ `require()` nel frontend — restituisce `{}` (usare ES module imports)
- ❌ `model.addChild()` in `canvasToJjom` — causa nested TRANSACTION (usare `.new()` direttamente)
- ❌ Reintrodurre token CSS legacy (`--accent`, `--bg-1..5`, `--secondary`, `--terziary`, `--radius`, `--color`)
- ❌ Variabili CSS nei file di componente — sempre in `styles/tokens/`

### Best practices

- ✅ Accessibility (WCAG)
- ✅ Dark mode support
- ✅ Lazy loading dove appropriato
- ✅ Memoization per performance
- ✅ `console.log` con prefissi `[Component]` per debug
- ✅ JSDoc per componenti pubblici
- ✅ Commenti per logica non ovvia

---

## File importanti

| File | Descrizione |
|------|-------------|
| `ProjectEditor.tsx` | Dashboard principale, gestione progetto |
| `DockManager.ts` | Gestione tabs e pannelli |
| `jjtl/executor/executor.ts` | `JjtlExecutor` — esecuzione trasformazioni |
| `jjtl/executor/astBridge.ts` | `toJjelAst()` — JjTL → JjEL expressions |
| `jjel/evaluator/evaluator.ts` | `JjelEvaluator` — valutazione espressioni |
| `jjel/evaluator/context.ts` | `EvaluationContext` — scope e bindings |
| `MappingLinesOverlay.tsx` | Frecce di mapping |
| `DualMetamodelPanel.tsx` | Vista side-by-side metamodelli |
| `ExecuteTransformationDialog.tsx` | Dialog esecuzione trasformazioni |
| `Navbar.tsx` + `navbar.scss` | App bar (riga 1 header) |
| `Toolbar.tsx` | Toolbar (riga 2 header) |
| `Info.tsx` + `info.scss` | Properties panel |
| `styles/tokens/_colors-light.scss` | Token colori light mode |
| `styles/tokens/_colors-dark.scss` | Token colori dark mode |
| `styles/variables.scss` | Variabili CSS attive |

---

## Prossimi Step

1. Event registry centralizzato (`frontend/src/events/registry.ts`) — prompt pronto
2. Rimozione dipendenze inutilizzate (react-itertools, nearley-unparse, ecc.) — prompt pronto
3. Reference mapping (cross-model object links) in JjTL
4. Multiplicity enforcement in executor
5. Interactive statements — wire to UIBridge
6. JjScript test suite (0 test su 60 file, 19 comandi)
7. Inline styles → SCSS (~600 occorrenze)
8. Completare UI redesign

---

**Ultimo aggiornamento:** Aprile 2026 (audit 2026-04-06)
**Test:** 211 passing (JjTL: 4 file, JjEL: 2 file)
**Design System:** token migration completata — zero legacy, single source of truth