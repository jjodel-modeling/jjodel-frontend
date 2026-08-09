# Prompt Claude Code — Authoring IR slice 1, Fase A (layer abilitante)

**Tipo**: feat. **Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. **LIR**: not-required (dichiararlo nel log). **No** VersionFixer migration (`ir` già persistito).

## Contesto (non ridiscutere: ratificato)

Costruiamo l'authoring degli IR viewpoint. Questa è la **Fase A**: il layer abilitante, sei pezzi additivi/nuovi e indipendenti, tutti unit-testabili, **senza UI di pannello** (quella è la Fase B). Riferimenti: il design doc slice-1 (Fase 1.5, nel tuo repo/docs) e `claude/discovery_2026-07-21_authoring_surface.md`. Tutto quello che serve è qui sotto: procedi self-contained.

Vincolo di scope: **tocca solo i file elencati**. Se ne servisse un altro, STOP e report. `git add` dei soli file dichiarati, mai `git add .`.

## COSA — sei pezzi

### F1 — Accessor non-hook per MetaclassInfo (additivo)
File: `frontend/src/components/editor-v2/hooks/useEditorMode.ts`.
Esporre la computazione pura `resolveM1Info` (oggi module-private) senza React: aggiungere `export function getMetaclassInfo(modelId: string, knownMetamodelId?: string): EditorModeInfo` che delega a `resolveM1Info`, oppure marcare `export` `resolveM1Info` direttamente. NON cambiare la firma né il comportamento di `useEditorMode` o di `resolveM1Info`. Solo un export aggiuntivo.

### F2 — `allAttributes` (own + ereditati) su MetaclassInfo (additivo)
File: stesso.
Aggiungere alla interface `MetaclassInfo` un **campo nuovo** `allAttributes: MetaclassAttribute[]`. NON toccare `attributes` (resta own-only, byte-identico per ogni consumer esistente). Popolarlo in `resolveM1Info`: union degli attributi own risalendo la catena `extends`, con override child-su-parent **per nome** (l'attributo della sottoclasse vince sull'omonimo della superclasse). Riusare la struttura di ereditarietà già costruita (`extendsMap` a ~:335). Attenzione (§4.3): grep preventivo di `allAttributes` per confermare che il nome non è già in uso (il discovery dice che non esiste).
Test (vitest): fixture con una gerarchia `Sub extends Base` dove Base ha attr `name`, Sub ha attr `extra` e ridefinisce `name` → `allAttributes` di Sub = `[name(da Sub), extra]` (2 elementi, name override), `attributes` di Sub invariato. Metaclasse senza padre → `allAttributes === attributes` per contenuto.

### F3 — Primitiva `Checkbox` (nuova)
File: `frontend/src/components/ui/Checkbox/Checkbox.tsx` (+ `Checkbox.module.css` + riga barrel in `components/ui/index.ts`).
Seguire ESATTAMENTE il pattern delle primitive esistenti in `components/ui/` (es. `Toggle`, `Input`): presentazionale, token `var(--...)`, props `{ checked, onChange, label?, disabled?, id? }`, nessuna dipendenza redux né editor-v2. Barrel: `export { Checkbox } from './Checkbox'; export type { CheckboxProps } from './Checkbox';`. Disciplina design system: slate `#334155` base, cyan `#0ea5e9` solo come accent (mai come default di riempimento).

### F4 — Primitiva `ColorPicker` (nuova)
File: `frontend/src/components/ui/ColorPicker/ColorPicker.tsx` (+ module.css + barrel).
Presentazionale, token-based, props `{ value: string, onChange: (hex:string)=>void, label?, disabled?, id? }`. Input colore nativo + campo testo esadecimale sincronizzato (così l'utente può incollare un hex). Nessuna libreria nuova. Stesso pattern di `components/ui/`.

### F5 — Controllo `PathBuilder` (nuovo) + emit puro
File: `frontend/src/components/ui/PathBuilder/pathExpr.ts` (puro) + `PathBuilder.tsx` (+ module.css + barrel).
**Layering (importante)**: PathBuilder vive nel design system e prende i descrittori di feature come **prop dati piatti**, NON importa `useEditorMode`/editor-v2 (sarà il pannello, Fase B, a mappare `MetaclassInfo` → prop).
- `pathExpr.ts` — funzione pura `pathExprFromSelection(sel: { feature: string; take: 'value'|'values'|'valuesAt'; index?: number }): string`. Emette `'$' + feature` seguito da: `take==='value'` → `.value`; `take==='values'` → `.values`; `take==='valuesAt'` → `.values[' + index + ']'`. Deve produrre stringhe che passano `parsePathExpr` (grammatica: `$feature` poi `.value` | `.values` | `.values[N]`). Unit test: i tre casi + che l'output rispetti `STEP_RE`.
- `PathBuilder.tsx` — props:
  ```ts
  interface PathBuilderProps {
    features: { attributes: { name: string; type: string; upperBound: number }[];
                references: { name: string; targetClassName: string; upperBound: number }[] } | null;
    value: string;                 // PathExpr corrente (read/display)
    onChange: (expr: string) => void;
    disabled?: boolean;
    disabledHint?: string;
  }
  ```
  UI single-hop: (1) Select della feature (attributi + reference, etichettati con type/target); (2) Select del `take` = `value` (default) | `values` | `values[N]`, con `values`/`values[N]` abilitati solo se `upperBound !== 1`, e `NumberInput` per N quando `valuesAt`; (3) preview read-only del PathExpr emesso; onChange emette `pathExprFromSelection`. **Wildcard/nessuna metaclasse** (A1): se `features === null` il controllo è **disabilitato** e mostra `disabledHint` (il pannello lo passerà come "imposta una metaclasse per abilitare i path sulle feature"). Slice 1: **single-hop soltanto**; se la feature scelta è una reference NON si ricorsivizza nel target — lasciare un commento `// TODO multi-hop seam (slice successiva)` nel punto dove si aggancerebbe la navigazione.

### F6 — `validateIR` (nuovo)
File: `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts`.
`export function validateIR(viewId: string, ir: AnyViewIR): { ok: true } | { ok: false; error: string }`. Implementazione: chiama `compileView`/`compileEdgeView` (il compile giusto per `ir.kind`) dentro try/catch; ok se non lancia, `{ok:false, error: e.message}` se lancia. Colocato con `compileView`. Nota: `compileView` cacha per `(viewId, irHash)`, quindi validare pre-warma la cache e la compile successiva a render-time è un hit.
Test: un `ir` valido (es. `defaultObjectViewIR()`) → `{ok:true}`; un `ir` con un PathExpr proibito (es. label `source:{from:'path', expr:'$a?.b'}`) → `{ok:false}` con messaggio non vuoto.

## DOVE (perimetro esatto, `git add` solo questi)

| File | Modifica |
|------|----------|
| `components/editor-v2/hooks/useEditorMode.ts` | F1 export + F2 `allAttributes` (additivi, non toccare `attributes` né firme esistenti) |
| `components/ui/Checkbox/` (+ `components/ui/index.ts`) | F3 nuovo |
| `components/ui/ColorPicker/` (+ barrel) | F4 nuovo |
| `components/ui/PathBuilder/` (+ barrel) | F5 nuovo (pathExpr.ts puro + PathBuilder.tsx) |
| `components/editor-v2/viewpoint/ir/irValidate.ts` | F6 nuovo |
| `__tests__` (dove vivono i test IR e/o un test nuovo colocato) | test di F2, F5-emit, F6 |

## COME (vincoli)

- `useEditorMode.ts`: **solo additivo**. `MetaclassInfo.attributes` invariato; `MetaclassInfo` guadagna `allAttributes`; nuovo export F1. Nessuna rinomina.
- Primitive `components/ui/`: seguire il pattern esistente (guardare `Toggle`/`Input`/`Field`) per struttura file, module.css con token, e barrel. Niente dipendenze nuove, niente redux, niente import da editor-v2 dentro `components/ui/`.
- PathBuilder decoupled: prop dati piatti, non `MetaclassInfo` diretto.
- Nessuna nuova dipendenza esterna. Diff minimale, edit puntuali.
- Verificare con grep globale i nomi nuovi prima di crearli (`getMetaclassInfo`, `allAttributes`, `Checkbox`, `ColorPicker`, `PathBuilder`, `pathExprFromSelection`, `validateIR`): CLAUDE.md §4.3.

## Discovery report

Non serve nuova discovery: la superficie è già mappata (design doc slice-1 + `claude/discovery_2026-07-21_authoring_surface.md`). Aggiorna solo `docs/claude-code-log.md` a fine task.

## Gate (tutti verdi, poi STOP)

- Typecheck: baseline locale invariata, Δ0 nei file toccati.
- Vitest: nuovi test (F2, F5-emit, F6) verdi; suite IR esistente invariata.
- `npm run build` verde (se OOM: `NODE_OPTIONS=--max-old-space-size=4096`).

Questa fase è **non visiva** (primitive + funzioni pure): il gate è test + typecheck + build, non serve verifica a schermo. A gate verdi, commit `feat: authoring slice-1 enabling layer (MetaclassInfo.allAttributes, ui Checkbox/ColorPicker/PathBuilder, validateIR)` e aggiorna `docs/claude-code-log.md` (tipo feat, file toccati, esito, LIR not-required). Poi STOP: la Fase B (VertexAuthoringPanel) è un prompt separato.

## RIFERIMENTI

- Design doc slice-1 (Fase 1.5) — §1 (surface verificata), §4 (contratto PathBuilder), §6 (enabling fixes F1-F6), §1.9 (correzione `allAttributes` non esiste).
- `claude/discovery_2026-07-21_authoring_surface.md`, `claude/ratifiche_2026-07-21_authoring_slice1.md`.
- Grammatica PathExpr: `irCompile.ts` `parsePathExpr` (:41), `STEP_RE` (:33), `FORBIDDEN_PATH` (:31). Seed: `ir/irDefaults.ts` `defaultObjectViewIR()`. Primitive esempio: `components/ui/Toggle`, `Input`, `Field`.
