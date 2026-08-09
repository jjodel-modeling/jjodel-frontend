# Prompt Claude Code — Authoring IR slice 1, Fase B (VertexAuthoringPanel, fetta verticale centrale)

**Tipo**: feat. **Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. **LIR**: not-required. **No** VersionFixer migration (`ir` già persistito).

## Contesto (ratificato, non ridiscutere)

La Fase A ha consegnato il layer abilitante (committato): `MetaclassInfo.allAttributes` (**opzionale**, popolato da `resolveM1Info`), le primitive `components/ui/{Checkbox,ColorPicker,PathBuilder}`, e `irValidate.ts`. Questa **Fase B** costruisce il pannello di authoring per una vertex view già selezionata, come **fetta verticale centrale**: shell + ciclo di edit + shape + una label, così l'intero impianto (write immutabile → validate → preview live → round-trip) è provato end-to-end. La breadth (lista label completa, compartimenti, badge, Advanced) è la **Fase B2**, prompt separato: qui NON si fa.

Riferimenti (nel tuo albero): design doc slice-1, `claude/ratifiche_2026-07-21_authoring_slice1.md`, `claude/discovery_2026-07-21_authoring_surface.md`. Contratti chiave inline sotto: procedi self-contained.

## COSA

### 1. Il componente `VertexAuthoringPanel`
File: `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (+ sotto-componente `TextSourceEditor.tsx` nella stessa cartella + eventuale hook `useDebouncedCommit.ts`).

Prop: `{ view: LViewElement }` (la view selezionata, già risolta a monte).

**Ciclo di edit (D3/D4/D5 + rifinitura ratificata)**:
```
draft ← structuredClone(view.ir ?? defaultObjectViewIR())          // seed se assente (Q6)
control onChange → setDraft(immutable patch del draft)             // MAI mutare view.ir in-place
  ├─ EAGER: const v = validateIR(view.id, next); setError(v.ok ? null : v.error)   // errore inline immediato
  └─ DEBOUNCED (~300ms): if (v.ok) view.ir = next                  // set_ir → SetFieldAction → refToken → recompile → preview live
on error → mostra <ErrorText>, NON scrivere view.ir
```
- **Immutabilità load-bearing**: ogni commit deve sostituire l'oggetto top-level `ir` (replace, non mutazione), altrimenti il `refToken` WeakMap non cambia e la preview non si aggiorna. `draft` è un clone profondo; il commit assegna il nuovo oggetto intero.
- **Reset del draft** quando cambia `view.id` (useEffect).
- **Round-trip (Q3/§5, obbligatorio)**: il draft è il clone dell'INTERO `ir`; si editano solo i campi di questa fase (sotto); tutto il resto (label aggiuntive, `fieldCompartments`, `badges`, e qualunque `Conditional<T>`) viene riscritto **verbatim**. Un campo che nel `ir` letto è un `Conditional` (oggetto con `when`/`rules`) NON si edita: mostra un placeholder read-only "conditional (Advanced, prossima fetta)" e preservalo.

**Campi editati in questa fase (solo scalari)**:
- `label` (nome della view) → `Input` (`components/ui`).
- `shape.form` → `Select` rect/rounded/ellipse. Se il valore corrente è un `Conditional`, read-only placeholder (round-trip).
- `shape.fill` → `ColorPicker`. Idem conditional.
- `shape.border` → `{ color: ColorPicker, width: NumberInput, style: Select(solid/dashed/dotted) }` (border è sempre scalare nello schema).
- **Label primaria** = `shape.labels[0]` (se assente, crea una entry): `position` → `Select(top/center/inside/bottom)`; `source` → **`TextSourceEditor`** (sotto). Le eventuali label successive (`labels[1..]`) si preservano verbatim, non si toccano in questa fase.

### 2. `TextSourceEditor` — il punto in cui entra il PathBuilder
Un `TextSource` è `{from:'path',expr}` | `{from:'literal',text}` | `{from:'intrinsic',prop}`. Editor:
- `Select` del "from" = path | literal | intrinsic.
- `intrinsic` → `Select` di `prop` in `{name, metaclassName, qualifiedName}`.
- `literal` → `Input` (testo).
- `path` → **`PathBuilder`** (Fase A). Feature dalla metaclasse target della view (vedi §3): passare `{ attributes: allAttributes ?? [], references }` mappati alla prop `features` del PathBuilder (ricorda: `allAttributes` è **opzionale**, usa `?? []`). Se la metaclasse target non è risolvibile o è wildcard (A1), passare `features: null` + `disabledHint: "imposta una metaclasse per abilitare i path sulle feature"`.

### 3. Risoluzione della metaclasse target (per il PathBuilder)
Il PathBuilder enumera le feature di UNA metaclasse concreta. Ricavarla dalla view:
- se `draft.metaclasses` è un array con un nome di classe concreta → quella;
- altrimenti wildcard (`'*'`) o non risolvibile → `features: null` (PathBuilder disabilitato + hint).
Per una metaclasse concreta, ottenere `MetaclassInfo` via `getMetaclassInfo(modelId, metamodelId?)` (esportata in Fase A). **Serve il modelId del modello M1 attivo**: risolverlo dalla stessa fonte che usa `useEditorMode`/il canvas (contesto editor-v2 / redux dell'active viewpoint-model). Se il modelId non è raggiungibile dal pannello con un'occhiata mirata agli anchor noti, **STOP e report** con un mini discovery (in `docs/discovery/`, naming standard) invece di improvvisare.

### 4. Montaggio nella Properties region (Q5)
Il pannello compare come **sezione nella Properties region** quando una vertex IR view è selezionata. Punto di innesto: `components/editors/Info.tsx` risolve la view selezionata (`state._lastSelected.view` → `LViewElement.fromPointer`, ~:1401-1405; `const selectedView = props.view`, ~:1185). Aggiungere **solo** una sezione additiva che renderizza `<VertexAuthoringPanel view={selectedView} />` quando `selectedView` esiste ed è una view con `ir?.kind === 'vertex'` (o `ir` assente → seedabile a vertex). **Non** modificare il corpo riflettivo di Info.tsx: solo il mount della sezione + l'import. Se il punto di innesto pulito non è ovvio agli anchor sopra, STOP e report.

## DOVE (perimetro, `git add` solo questi)

| File | Modifica |
|------|----------|
| `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | NUOVO — il pannello + ciclo edit |
| `components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx` | NUOVO — editor TextSource (usa PathBuilder) |
| `components/editor-v2/viewpoint/authoring/useDebouncedCommit.ts` | NUOVO (opzionale) — hook debounce ~300ms |
| `components/editors/Info.tsx` | MODIFICA **additiva minima** — mount della sezione + import, nient'altro |

Se serve toccare altro (es. una fonte per il modelId non prevista): STOP e report, non allargare.

## COME (vincoli)

- Riusare le primitive `components/ui/*` (Input, Select, NumberInput, Field, Checkbox, ColorPicker, PathBuilder, ErrorText). Nessuna dipendenza nuova; il debounce con un util esistente se c'è, altrimenti un piccolo `useEffect`+`setTimeout` custom.
- Write SOLO via L-proxy `view.ir = <obj>` (replace immutabile). Mai `SetFieldAction` a mano su sotto-campi, mai mutazione in-place.
- Validare con `validateIR(view.id, draft)` (Fase A) prima di ogni commit; su errore non scrivere.
- `Info.tsx`: additivo, nessuna rinomina, nessun tocco al corpo riflettivo esistente.
- Grep preventivo dei nomi nuovi (`VertexAuthoringPanel`, `TextSourceEditor`, `useDebouncedCommit`) prima di crearli.

## Gate (verdi, poi HARD STOP visivo)

- Typecheck: baseline locale invariata, Δ0 nei file toccati.
- Vitest: suite esistente invariata (il pannello è UI, la logica pura è già testata in Fase A; se estrai un helper puro nuovo, testalo).
- `npm run build` verde (se OOM: `NODE_OPTIONS=--max-old-space-size=4096`).

Questa fase **è visiva**: a gate verdi, HARD STOP per la verifica di Alfonso. Criteri di accettazione (design doc §10 + A2), da validare in-app sul test bed:

1. Selezioni una vertex view con `ir` → il pannello popola forma, fill, bordo, la label primaria (position + source) da `view.ir`.
2. Cambi `shape.form` rect → ellipse → il nodo sul canvas si ridisegna come ellisse entro un tick, **senza reload** (prova il path del `refToken` replace).
3. Costruisci una label `$name.value` col PathBuilder **senza digitare** → la label rende il valore dell'attributo; editando quell'attributo la label si aggiorna (reattività self).
4. Porti il pannello verso un IR malformato → è impossibile per costruzione (PathBuilder) o bloccato da `validateIR` con `ErrorText` inline, e `view.ir` **non** viene scritto (verifica: `windoww.store.getState().idlookup[viewId].ir` invariato).
5. Riapri il progetto → l'IR autorato persiste e rende identico.
6. Una view con un `Conditional` in un campo non editato, ri-salvata dal pannello, mantiene quel conditional **byte-identico** (round-trip §5).
7. **(A2) Scope del re-render**: autorare una view non deve far ri-renderizzare l'intero canvas a ogni commit. Verificare che il churn resti circoscritto (o annotarlo esplicitamente come limite noto se la firma globale lo impone, con misura del costo).

Solo dopo l'OK visivo: commit `feat: authoring slice-1 VertexAuthoringPanel (shape + primary label, immutable write, live preview, round-trip)` + entry in `docs/claude-code-log.md` (feat, LIR not-required, nota su A2). Poi STOP: la Fase B2 (lista label, compartimenti, badge, Advanced) è un prompt separato.

## RIFERIMENTI

- Design doc slice-1: §3 (write-back contract), §5 (field→control map + round-trip rule), §7 (data flow), §10 (acceptance).
- Fase A: `MetaclassInfo.allAttributes` (opzionale), `getMetaclassInfo`, `components/ui/{Checkbox,ColorPicker,PathBuilder}`, `irValidate`.
- Anchor: `view/viewElement/view.tsx:483-484` (`set_ir`), `irResolveCore.ts:40-66` (refToken/signature), `components/editors/Info.tsx:1185,1401-1405` (selezione view), `ir/irDefaults.ts` (`defaultObjectViewIR`).
