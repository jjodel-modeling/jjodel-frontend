# Prompt Claude Code: R-VP slice 1, sezione `manager` nella view per classe e override della form del manager

**Data**: 2026-09-03 22:24 (rev. 22:45 dopo verifica sul working tree locale)
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`, HEAD `d32349614`
**Modello / effort**: Claude Opus 4.8, `/effort xhigh`
**Tipo**: feat (two-phase: Fase 1 discovery read-only con hard stop, Fase 2 solo dopo GO)
**Critical zone**: non toccata. Se la discovery scopre che il manager passa da `useJjomSync.ts` o `portDistribution.ts`, fermarsi e segnalarlo: serve Layer Impact Report.

Leggi `CLAUDE.md`, `docs/decisions.md` e `docs/claude-code-log.md` prima di iniziare. Se questo prompt contraddice `CLAUDE.md`, segnala il conflitto e non eseguire.

---

## 0. Contesto e decisioni che vincolano questo task

Le decisioni sotto sono state ratificate in chat il 2026-09-03 e potrebbero **non essere ancora** in `docs/decisions.md` (il memo `docs/ratifiche/claude_2026-09-03_1441_memo_ratifica_viewpoint_vs_annotazioni.md` è in corso di salvataggio). Valgono comunque per questo task; se in `decisions.md` trovi qualcosa che le contraddice, fermati e segnalalo.

- **R-VP-1** Nel metamodello va ciò che cambia significato o validità dei dati; nel viewpoint ciò che cambia solo come i dati vengono mostrati o editati.
- **R-VP-3** Il Data Manager (instance manager, tab `mgr_${model.id}`, `MANAGER_TAB_PREFIX` in `instanceManagerModel.ts`) **non ha un viewpoint proprio**. I suoi aspetti visuali sono una **sezione della stessa view per classe**, additiva su ir-1.3 nello stile del `FormSpec`.
- **R-VP-4** Il viewpoint è override, mai prerequisito: il manager deve funzionare col default derivato dal tipo anche quando la sezione non c'è. La regola di risoluzione va dichiarata (§1c).
- **R-VP-6** Encoding annotazione congelato: **nessuna nuova chiave `jjodel/*`** nelle annotazioni. Se ti sembra necessaria, fermati.
- **R-VP-7** Nessun bump di `DState.version.n`: tutto additivo, opzionale, senza migrazione. Il saved IR non ha VersionFixer (R-B9): ogni literal che introduci è definitivo.
- **R-VP-8** Perimetro della customizzazione della form del manager: *scegliere quali campi, in che ordine, in quali sezioni, con quale renderer e quale label; non disegnare la griglia*. Resta intatta la regola FL: il metamodello decide il layout, **nessuna larghezza per campo, mai**.
- **R-FRM-1** (28/8, in `decisions.md`) I `fieldCompartments` ordinano e intitolano ma **non filtrano**: i gruppi non reclamati vanno in coda con i titoli standard (`formSections.ts`, coda su `residual-<gruppo>`).
- **Vincolo `FormSpec`** (commento in `irTypes.ts:232-245`): **nessuna chiave `op` con valore stringa** a qualunque profondità, o `irValidate.findUnknownPredicateOp` respinge l'intera view.
- **R-FORM-4** `frontend/src/jjform/` ha l'invariante zero import dal resto del codebase.

**Scelta architetturale già presa in chat** (non riaprirla): la customizzazione della form del manager è un **override per superficie dentro lo stesso `FormSpec`**, non un `FormSpec` nominato e plurale. Uno spec base, una sezione di override per la superficie `manager`, fallback campo per campo allo spec base. I `FormSpec` nominati sono una slice futura.

**Conciliazione R-VP-8 / R-FRM-1** (decisa in chat, da confermare nel referto): «scegliere quali campi» non passa per l'omissione (che per R-FRM-1 significa «in coda», non «nascosto») ma per una **lista esplicita** `hidden` per nome di feature. Un campo non elencato in `order` va in coda come oggi; un campo in `hidden` non viene reso. Nota: `FormSpec.features` ha già il valore `'hidden'` per reference e containment (`FeatureTreatment`); `hidden` estende la stessa semantica agli attributi, e il referto deve dire se i due meccanismi convergono nello stesso filtro (`IRForm.tsx:309`, `visible`).

---

## 1. COSA

Tre cose, in due commit:

**1a. Sezione `manager` della view per classe** (commit 1). Una chiave opzionale `manager?: ManagerSpec` su `VertexViewIR`, accanto a `form?: FormSpec` (`irTypes.ts:351`) e `structure?: StructureSpec` (`:344`), che dichiara per il Data Manager le **colonne iniziali** (lista ordinata di nomi di feature) e l'**ordinamento iniziale** (feature e direzione). Niente renderer qui: il renderer di colonna arriva già dalla ladder attraverso `FormSpec.widgets` → `rendererForWidget` (`widgetRenderer.ts`), quindi si customizza con l'override della form (1c), non con una seconda mappa.

**1b. Estensione additiva di `FormSpec`** (commit 2). Tre chiavi opzionali nuove nel base spec, per nome di feature: `order?: string[]` (ordine dei campi; i non citati in coda, R-FRM-1), `labels?: Record<string, string>` (label per campo), `hidden?: string[]` (esclusione esplicita). Le chiavi esistenti (`theme`, `labelPlacement`, `widgets`, `features`, `basic`) non cambiano.

**1c. Override per superficie** (commit 2, stesso commit di 1b). `FormSpec.surfaces?: { manager?: FormSurfaceOverride }` con `FormSurfaceOverride = Partial<Omit<FormSpec, 'surfaces'>>`. Risoluzione campo per campo: override `manager` → base `FormSpec` → default derivato dal tipo. Le superfici `rail` e `nodeForm` non sono ammesse in questa slice: le esclude il tipo, non una convenzione.

**Regola di risoluzione del tab `mgr_${model.id}`**, da scrivere come commento nel punto di applicazione:
- Colonne: scelta dell'utente in sessione (`ColumnOverrides`, `columnChoice` in `InstanceManagerTab.tsx`, resta com'è) → `ManagerSpec.columns` se presente → `tableColumns(cls)` di oggi con `autoHiddenColumnKeys`. La scelta in sessione non entra nell'IR (R-VP-8).
- Ordinamento: scelta dell'utente in sessione (se esiste già uno stato di sort, il referto lo dice) → `ManagerSpec.sort` → default di oggi.
- Form: `surfaces.manager` → base → tipo. Nessun gradino annotazione (R-VP-5).

Fuori scope: authoring UI (tab nell'authoring), `FormSpec` nominati, persistenza della scelta in sessione, tipi scalari raffinati (slice 2), rimozione del gradino annotazione dalla ladder (slice 3).

---

## 2. FASE 1: Discovery read-only (OBBLIGATORIA, con hard stop)

Nessuna modifica al codice in questa fase. I path sotto sono stati verificati sul working tree locale il 3/9 sera; le ipotesi sono sul comportamento, non sull'esistenza dei file.

### 2.1 Ipotesi da falsificare

- H1: `FormSpec` (`irTypes.ts:246-269`) è consumato per la form da `describeSlot(slot, spec, offer)` in `useFormWidgets.ts:274` e da `IRForm.tsx` (filtro `visible` a `:309`, sezioni a `:382` con `buildFormSections(visible, compiled.fieldCompartments)`). Il manager usa lo stesso `IRForm` (`InstanceManagerTab.tsx:54`). Quindi un parametro di superficie passato a `IRForm` (o a chi risolve lo spec prima di `IRForm`) copre le tre superfici con un punto solo.
- H2: le colonne del manager nascono da `tableColumns(cls)` in `instanceTable.ts:98` (puro, sopra `MetamodelShape`), filtrate da `visibleColumns` / `isColumnVisible(key, hiddenKeys, overrides)` (`:416-464`), con `ColumnOverrides` di sessione in `InstanceManagerTab.tsx:1382`. Il viewpoint non entra da nessuna parte oggi.
- H3: il renderer di colonna arriva da `rendererForWidget` (`ObjectNode.tsx:658`, `widgetRenderer.ts:87-100`), cioè da `FormSpec.widgets`: un override di `widgets` per la superficie `manager` cambia il renderer di colonna senza toccare la ladder.
- H4: `IRForm.tsx:309` filtra i campi per `basic`/`advanced` e `features: 'hidden'` è applicato a monte o a valle di quel punto (dire dove): `hidden` può entrare nello stesso filtro.
- H5: non esiste oggi uno stato di ordinamento della tabella nel manager (se esiste, indicare dove e come si combina con `ManagerSpec.sort`).

### 2.2 File da leggere (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (blocco `FormSpec` :232-269, `VertexViewIR` :340-360, gli altri due `form?: FormSpec` a :379 e :469: dire cosa sono e se `manager` deve stare anche lì)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (la scansione `op`; se esiste una whitelist di chiavi, va aggiornata)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (`:361` `fieldCompartments`; capire se `form` passa in passthrough e se `manager` deve fare lo stesso)
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts` (`describeSlot` :274, `overrideIsCompatible` :163)
- `frontend/src/components/editor-v2/viewpoint/ir/IRForm.tsx` (:300-390)
- `frontend/src/components/editor-v2/viewpoint/ir/formSections.ts` e `formAutoLayout.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/widgetRenderer.ts`
- `frontend/src/components/abstract/tabs/instanceTable.ts` (:98-160, :416-520)
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (import :54-55, stato colonne :1375-1400, il punto in cui `IRForm` viene montato)
- `frontend/src/components/abstract/tabs/instanceManagerModel.ts`
- `frontend/src/jjform/shape.ts` (`tableFeatures` :231, `ClassShape` :121)
- `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx` (solo per sapere se l'authoring serializza `FormSpec` per intero: se sì, un `FormSpec` con `surfaces` deve sopravvivere a un round trip in authoring senza essere perso)
- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`
- `docs/design/design_handoff_instance_node/form-engine-contract.md`
- `docs/decisions.md`: serie R-FORM, R-FRM, R-STR, R-B9, R-VP se presente

### 2.3 Domande a cui il referto deve rispondere

1. Il punto (uno o più) in cui lo spec arriva a `IRForm` nelle tre superfici, con `file:riga`. Dove si inserisce la risoluzione `surfaces.manager` → base senza toccare le altre due superfici.
2. Come `IRForm` conosce la superficie in cui è montato oggi (prop, contesto, niente). Se niente: proporre la prop minima.
3. `features: 'hidden'` dove viene applicato; se `hidden` (lista) può entrare nello stesso filtro.
4. Come `order` si combina con `buildFormSections` e `fieldCompartments` senza violare R-FRM-1: proposta concreta (ordine dentro la sezione? ordine globale prima del raggruppamento?). Una frase, con la conseguenza sui campi non citati.
5. Colonne: dove `ManagerSpec.columns` entra tra `tableColumns` e `ColumnOverrides`. `NAME_COLUMN_KEY` (`instanceTable.ts:443`) resta sempre visibile.
6. Round trip in authoring: `FormAuthoringBody.tsx` perde chiavi che non conosce? Se sì, `surfaces`, `order`, `labels`, `hidden` vanno preservate esplicitamente (il pattern «authoring preserve» di R3 del row dispatch).
7. Collisioni: `command grep -rn` su `frontend/src` per `ManagerSpec`, `FormSurfaceOverride` (oggi 0 occorrenze entrambi), `surfaces` come identificatore (oggi solo in commenti), `order`, `labels`, `hidden` come chiavi di `FormSpec` (oggi assenti in `irTypes.ts`). Riportare i conteggi.
8. Test a rischio: `irValidate.test.ts`, `useFormWidgets.test.ts`, `formSections.test.ts`, `instanceTable.test.ts`, la serie `instanceManager10*.test.ts`. Dire quali confrontano `FormSpec` per uguaglianza strutturale.
9. Domande aperte per Alfonso.

### 2.4 Referto

Salvare in `docs/discovery/discovery_<YYYY-MM-DD>_rvp_slice1_manager_section.md` (data di esecuzione; suffisso `_N` se il nome esiste). Contenuto minimo: H1..H5 con esito, file letti con path completi, findings con `file:riga` e citazione verbatim, dipendenze e rischi, domande aperte. Se al path esiste già un referto, non riscriverlo: leggerlo per intero e aggiungere un addendum in coda con le sole cose non coperte.

**HARD STOP.** La Fase 1 è chiusa solo quando il referto è scritto. L'analisi si fa in chat sul referto; la Fase 2 parte solo dopo un GO esplicito, eventualmente emendato.

---

## 3. FASE 2: Implementazione (solo dopo GO)

Forma attesa; il GO potrà emendarla sulla base del referto.

### 3.1 Commit 1: `ManagerSpec` su `VertexViewIR` e risoluzione delle colonne

- **DOVE**: `irTypes.ts` (tipo e chiave `manager?: ManagerSpec` accanto a `form?`); `irValidate.ts` solo se esiste una whitelist di chiavi; `irCompile.ts` solo se `form` è copiato esplicitamente e `manager` deve seguirlo; `instanceTable.ts` (una funzione pura nuova che applica `ManagerSpec.columns` all'output di `tableColumns`); `InstanceManagerTab.tsx` (chiamata della funzione, lettura di `manager` dalla view risolta per la classe).
- **COME**:
  ```ts
  /** ManagerSpec (2026-09-03, R-VP-3): initial columns and sort of the instance manager
   *  for this class. Optional and additive, no irVersion bump (same precedent as
   *  FormSpec and StructureSpec). No key named `op` with a string value, at any depth. */
  export interface ManagerSpec {
      /** Feature names, in column order. Absent = tableColumns(cls) as today.
       *  Unknown names are ignored with a one-time console.warn, never a throw. */
      columns?: string[];
      /** Absent = today's default. */
      sort?: { feature: string; dir: 'asc' | 'desc' };
  }
  ```
  La funzione pura in `instanceTable.ts` prende `(columns: TableColumn[], spec?: ManagerSpec)` e restituisce le colonne riordinate e marcate visibili secondo `spec.columns`; senza spec restituisce l'input invariato. `ColumnOverrides` di sessione si applica dopo, come oggi. `NAME_COLUMN_KEY` non è governata dallo spec.
- **Vincoli**: nessun bump, nessuna migrazione, nessun `op`, nessuna annotazione; `instanceTable.ts` resta puro.
- **Test**: vitest in `instanceTable.test.ts` (spec assente → identico; `columns` parziale → citate prime nell'ordine dato, le altre dopo nell'ordine di oggi e nascoste o visibili? **decidere nel referto, domanda 5, e fissare nel GO**; feature inesistente → warn e ignora).
- **Build e test**: `npm run build` exit 0, vitest verde con conteggio prima/dopo.
- **Commit**: `feat: add optional ManagerSpec to class view for instance manager columns (R-VP-3)`, `git add` dei soli file toccati.

**HARD STOP** per verifica visiva di Alfonso su http://localhost:3001/ (hard refresh): un progetto senza `manager` nella view si comporta come prima; con `manager.columns` scritto a mano nell'IR, il manager apre con quelle colonne.

### 3.2 Commit 2: `order`, `labels`, `hidden` nel `FormSpec` e override `surfaces.manager`

- **DOVE**: `irTypes.ts` (tre chiavi nuove + `surfaces`); il punto di risoluzione individuato dal referto (domanda 1), con una funzione pura `resolveFormSpec(spec, surface)` collocata dove il referto indica (candidato: `useFormWidgets.ts` o un file nuovo accanto a `formSections.ts`, dopo grep del nome); `IRForm.tsx` per `hidden`, `order`, `labels`; `InstanceManagerTab.tsx` per passare la superficie; `FormAuthoringBody.tsx` **solo** se il referto conferma la perdita di chiavi al round trip (preserve, non UI).
- **COME**:
  ```ts
  export interface FormSpec {
      // ... chiavi esistenti invariate ...
      /** Feature names in display order; names not listed keep today's order after
       *  the listed ones (R-FRM-1: ordering never filters). */
      order?: string[];
      /** Label override per feature name. Absent = today's label. */
      labels?: Record<string, string>;
      /** Feature names not rendered in this form. Explicit: omission never hides. */
      hidden?: string[];
      /** Per-surface override, resolved field by field over the base spec. Only
       *  'manager' in this slice: the type excludes the others on purpose. */
      surfaces?: { manager?: FormSurfaceOverride };
  }
  export type FormSurfaceOverride = Partial<Omit<FormSpec, 'surfaces'>>;
  ```
  `resolveFormSpec(spec, 'manager')` restituisce `{ ...base, ...override }` con merge per chiave: per `widgets`, `features`, `labels` merge di record (override vince per feature); per `order`, `hidden`, `basic` l'override sostituisce la lista intera se presente. Documentare la regola nel commento della funzione. Per `surface !== 'manager'` o override assente restituisce lo spec base senza `surfaces`.
- **Vincoli**: nessuna larghezza, posizione, griglia; nessun `op`; chiavi di sezione di `formSections.ts` invariate; nessuna modifica alle chiavi esistenti di `FormSpec`; `rail` e `nodeForm` non ammesse dal tipo.
- **Test**: vitest sulla risoluzione (override assente → identico al base; `hidden` toglie; `labels` cambia solo la label; `order` parziale → resto in coda; `widgets` in override vince per feature, non azzera le altre) e un test di `irValidate` che uno spec con `surfaces` passa.
- **Commit**: `feat: add order, labels, hidden and per-surface manager override to FormSpec (R-VP-8)`.

**HARD STOP** per verifica visiva: rail e nodo-form invariati; manager con override scritto a mano nell'IR applicato.

### 3.3 Chiusura

- Entry in `docs/claude-code-log.md` **dopo** la conferma visiva di Alfonso, non prima.
- Deviazioni dal prompt: nella entry e in chat, non solo nel commit.
- Non aggiornare l'addendum FormSpec né `form-engine-contract.md`: allineamento documentale separato.

---

## 4. Cosa NON fare

- Nessun viewpoint separato per il manager, nessun tipo di tab nuovo (R-VP-3).
- Nessuna chiave `jjodel/*` (R-VP-6).
- Non toccare il gradino annotazione della ladder (slice 3) né i tipi scalari (slice 2).
- Non rinominare identificatori esistenti, classi SCSS incluse.
- Nessun refactoring opportunistico in `jjform/`, `instanceTable.ts`, `IRForm.tsx`.
- Non toccare `useJjomSync.ts`, `portDistribution.ts`, `VersionFixer.tsx`.
- Niente `git add .`; mai commit senza build verde.

---

## 5. RIFERIMENTI

- `CLAUDE.md` (root del repo), `docs/PROTOCOL.md`
- `docs/decisions.md`: R-FORM-1..15, R-FRM-1..3, R-STR-6/7, R-B9, R-VP-1..8 (se già presenti)
- `docs/ratifiche/claude_2026-09-03_1441_memo_ratifica_viewpoint_vs_annotazioni.md` (se già salvato)
- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`
- `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` (modello di chiave additiva su ir-1.3)
- `docs/design/design_handoff_instance_node/form-engine-contract.md`
- `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`
- Referto: `docs/discovery/discovery_<YYYY-MM-DD>_rvp_slice1_manager_section.md`
