# Prompt Claude Code: Form rendering delle view, Fase 2, Slice 1b

> **Nome del documento prompt**: 2026-08-27 12:40

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili (tutte salvo deroga esplicita nel prompt).
Corsia: completa (critical zone `editor-v2/problems/`, più di tre file).

**Branch**: `alfonso-frontend-jjtl`
**Tipo**: feat (two-phase, Fase 2). Go-ahead dato in chat il 2026-08-27 sul report
`docs/discovery/discovery_2026-08-26_form_views_slice1.md` (finding 6 e 12) e sul checkpoint
`docs/sessioni/sessione_2026-08-27_form_views_1a.md`.
**Effort**: xhigh
**Precedente**: `claude_2026-08-26_2230_prompt_form_views_slice1a_impl.md` (commit `d49143031`,
`918b0ec75`, `99e5efa85`).

Leggi `CLAUDE.md` (in particolare §3.1, §3.2, §3.12), `PROTOCOL.md`, le ultime entry di
`docs/claude-code-log.md`, il report di discovery ai finding 2, 5, 6, 8, 12 e il README
dell'handoff `docs/design/design_handoff_jjodel_form_views/README.md` (§Widgets, §Themes,
§Rail chrome, §Validation states, §State management). Questo prompt li assume letti.

Stato di partenza atteso: HEAD `b9da5f15b` o successivo sullo stesso branch. Il working tree
contiene file di altre sessioni (`StatusBar.*`, `featureSignature.ts`, prompt e discovery
untracked): non toccarli, non committarli. Staging solo per pathspec.

---

## Contesto (non rifare l'analisi)

La Slice 1a ha messo in piedi il tab `Form` del rail: `IRForm.tsx` (header, toggle
Basic/Advanced, slot riepilogo 32px, sezioni), `IRFormField.tsx` (label row, widget, slot messaggi
16px), quattro widget, `useFormWidgets.ts` (derivazione dal tipo, `FormFieldDescriptor`),
`formWrite.ts` (`setSlotValue`, `clearSlotValue`, `addSlotValue`, `setObjectName`),
`irFormStyle.scss` (`.ir-form*`, `.ir-field*`), token `--color-form-*` e dimensioni in
`styles/tokens/`. Tema `plain` soltanto. Riferimenti, multivalore e children sono righe di testo
read-only. Lo slot riepilogo dice sempre `No issues` e lo slot messaggi è sempre vuoto, perché il
registry dei problemi non porta il nome della feature (finding 6).

Tre fatti che questa slice assume e che non vanno ridiscussi:

1. **Un solo write path.** Tutto passa da `formWrite.ts` e da `LValue` (finding 2). Nessuna
   chiamata a `syncUpdateFeatureValue`, nessuna `SetFieldAction` fuori da `formWrite.ts`.
2. **Nessun secondo validatore.** Le diagnostiche per campo sono una proiezione del registry
   `editor-v2/problems/`, alimentato da `model/conformance/`. La form non valuta nulla da sé, e
   non mostra messaggi che il registry non ha (quindi niente "timeout must be positive": non
   esiste un check di range, e non lo si inventa).
3. **Zero layout shift.** Slot riepilogo 32px e slot messaggi 16px restano riservati; popover,
   chip e righe di lista non cambiano l'altezza di ciò che li circonda quando cambia lo stato.

### Il perimetro in critical zone, con il Layer Impact Report

`editor-v2/problems/` è in critical zone (`CLAUDE.md` §3.1). La modifica autorizzata è questa e
solo questa:

- `problems/registry.ts`: su `ConformanceProblemDetail` un campo opzionale
  `metamodelElementName?: string`, con lo stesso nome del campo sorgente in
  `ConformanceViolation` (`model/conformance/ConformanceTypes.ts:65`). Non `featureName`: nei due
  check di classe (`ConformanceValidator.ts:108, 122`) il valore è il nome della classe, e un campo
  che si chiama `featureName` mentirebbe in quei due casi. La distinzione la fa il consumatore.
- `problems/conformanceToProblems.ts:50-54`: la copia `metamodelElementName: v.metamodelElementName`
  nel literal pushato in `agg.violations`.

Layer Impact Report, scritto dall'architetto sul codice letto il 2026-08-27. Ricopialo in chat
prima del diff (§3.2 vuole il report in chat, non nel commit), confermandolo o correggendolo
riga per riga; se una riga non torna con quello che leggi, fermati e riporta.

```
LAYER IMPACT REPORT

Layers touched:
  [ ] D-layer (Redux raw data)
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] Problems registry (editor-v2/problems, session-local, non persistito)

Problems registry:
  - What changes: un campo opzionale in piu' su ConformanceProblemDetail; una riga di copia
    in aggregateConformanceByObject, funzione pura senza React/Redux (commento :4-6).
  - What does NOT change: NodeProblem, la chiavizzazione per nodo, la doppia registrazione
    DObject/DVertex (ConformanceProblemSync.tsx:9-15), registerProblem/clearProblem/
    markResolved, gli hook useNodeProblems/useActiveOverlayId/useIsHighlighted, le
    severita', i messaggi, l'ordine delle violazioni.
  - Cross-layer interaction: nessuna. L'origine (ConformanceValidator) popola gia'
    metamodelElementName; il registry non scrive Redux, non apre TRANSACTION, non tocca
    il sync. I consumatori esistenti leggono p.conformance?.length
    (NodeProblemIndicator.tsx:48-50) e d.message (NodeProblemOverlay): un campo in piu'
    e' invisibile a entrambi.
  - Side-effect safety vs other layers: il tipo e' additivo (proprieta' opzionale, CLAUDE.md
    regola sulle interfacce); i test esistenti in problems/__tests__/conformanceToProblems
    .test.ts confrontano oggetti che non menzionano il campo e restano verdi, salvo un
    toEqual stretto su un literal: in quel caso si aggiorna il test, non il codice.

Smoke-test scenarios potentially affected:
  - aprire un modello con violazioni -> badge sui nodi e overlay invariati (stesso conteggio,
    stessi messaggi);
  - modello conforme -> nessun badge;
  - albero: la riga dell'oggetto con violazioni mostra lo stesso indicatore di prima.

Uncertain about propagation? -> nessuna incertezza: il campo si ferma nel registry e lo
legge solo la form.
```

`model/conformance/` non si tocca (regola 1b del report: il buco è solo nell'aggregatore).

---

## COSA

Slice 1b: la form del rail diventa completa per il tema `plain` e acquista gli altri tre temi.
Copre gli artboard 2a (tutti i temi), 3a (stati di validazione), e le parti di 1b non ancora
fatte (picker, liste, chip). Fuori scope, rinviato: sotto-form inline per i children (la riga
espandibile di 1b), `Add` sui children di containment, tab Form nell'authoring (Slice 2),
documento form (3), form nel nodo (4), addendum di spec (a chiusura di questa slice, lo scrive la
chat).

Comportamento atteso a fine slice, per commit.

### D. Fixture, diagnostica, dirty

1. **Fixture StateMachine** (il dominio dei mockup), due file in
   `frontend/src/__tests__/fixtures/xmi-m1/`:
   - `StateMachine.ecore`: package `statemachine` (nsURI `http://jjodel.io/fixtures/statemachine`);
     `EEnum StateKind { initial, normal, final }`; `EClass StateMachine { name: EString;
     states: State [0..*] containment; transitions: Transition [0..*] containment }`;
     `EClass State { name: EString [1..1]; kind: StateKind [1..1]; isHistory: EBoolean;
     timeout: EInt; entryAction: EString; tags: EString [0..*]; depth: EInt derived
     changeable=false; outgoing: Transition [0..5]; substates: State [0..*] containment }`;
     `EClass Transition { name: EString [1..1]; trigger: EString; guard: EString;
     source: State [1..1]; target: State [1..1] }`.
   - `sample-StateMachine.xmi`: macchina `Heater` con stati `Idle` (initial), `Running` (normal,
     `isHistory=true`, `timeout=30`, `tags` = `hot`, `monitored`, `entryAction` = `heater.on()`,
     substates `Warmup` e `Steady`), `Off` (final), e `Broken` **senza `kind`** (una violazione
     `missing_required_attr` o `attr_multiplicity_below_min` sul campo `kind`, a seconda di quale
     check la intercetta per primo: annotalo nel log). Transizioni `start` (Idle→Running,
     trigger `power`), `stop` (Running→Off, trigger `power`, guard `temp > 60`), `fault`
     (Running→Broken). `outgoing` di ogni stato coerente con le transizioni.
   - Un test strutturale in `services/export/__tests__/ecore-io.test.ts` sul pattern dei casi
     esistenti (file leggibile, XML well-formed, dichiara i tipi attesi: un `EEnum`, un `EInt`,
     un `EBoolean`, un `upperBound="5"`, un `derived="true"`). Nessun test di import end-to-end:
     l'import lo prova la chat sul browser (V1).
2. **`metamodelElementName` nel registry**, come nel LIR. Test: un caso in
   `conformanceToProblems.test.ts` che prova la copia (una violazione con
   `metamodelElementName: 'kind'` arriva in `violations[0].metamodelElementName`).
3. **Diagnostica per campo.** `IRForm` legge `useNodeProblems(objectId)` (il registry registra già
   sotto l'id del `DObject`, finding 6), filtra `resolvedAt === undefined` e `kind === 'conformance'`,
   e distribuisce ogni `ConformanceProblemDetail` al campo con `field.name ===
   d.metamodelElementName`. `IRFormField` riceve `diagnostics` (la prop esiste già, `FieldDiagnostic`)
   e rende il primo messaggio nello slot 16px con l'icona; il bordo del controllo prende
   `--color-error` o `--color-warning` (le regole `.ir-field--error` / `--warning` esistono già in
   `irFormStyle.scss:280-286`; estendile ai controlli nuovi di E). Le diagnostiche che non trovano un
   campo (nome di classe, `orphan_object`, `check_failed`, feature nascosta da `form.features` o
   fuori da Basic) contano nel riepilogo e non si perdono.
4. **Riepilogo popolato.** Lo slot 32px mostra `N errors` (`--color-error-text`, `bi-x-circle-fill`)
   e `N warnings` (`--color-warning-text`, `bi-exclamation-triangle-fill`) come due chip cliccabili;
   il click porta al primo campo con quella severità (`scrollIntoView({ block: 'nearest' })` e
   `focus()` sul controllo). Senza problemi resta `No issues` con `bi-check-circle`. Il conteggio è
   lo stesso di `NodeProblemIndicator.tsx:48-50` (una unità per violazione), così rail e badge
   della tela non si contraddicono mai. Il problema `duplicate-name` (kind non conformance) conta
   come una unità nel riepilogo, senza campo.
5. **Stato dirty.** `IRForm` tiene `dirtyFields: Set<string>` (chiave `slotId`, oppure `'name'` per
   l'identità). Un commit che ritorna `true` da `formWrite` aggiunge la chiave. Il campo dirty ha il
   punto cyan con alone (`ir-field--dirty`: punto 6px `--color-marker-required` con
   `box-shadow: 0 0 0 2px rgba(14,165,233,0.2)` prima della label, bordo del controllo `#7dd3fc`
   via token nuovo `--color-form-dirty-border`, messaggio `Modified, not saved` in
   `--color-form-dirty-text`, nuovo, `#0284c7`). Una diagnostica vince sul dirty nello slot
   messaggi (il bordo resta quello della diagnostica). **Reset**: non esiste un evento di
   salvataggio (`SaveManager.save()` azzera `U.isProjectModified` e basta, `SaveManager.ts:34`);
   la form, a ogni render, se `U.isProjectModified === false` svuota `dirtyFields`. È eventually
   consistent al primo re-render dopo il save, e va dichiarato nel doc-comment. Cambio di soggetto:
   set nuovo. `SaveManager` non si tocca.

### E. Liste, chip, reference picker

6. **`FormSpec.features` applicato.** `describeSlot` legge `spec.features[name]`:
   `hidden` esclude la feature dai campi (in entrambe le modalità); `inline` e `list` finiscono in
   `FormFieldDescriptor.treatment` (campo nuovo, opzionale, default `'inline'` per `upperBound === 1`
   e `'list'` altrimenti; `inline` su un multivalore è degradato a `list` senza throw).
7. **Reference singolo (`reference`, `upperBound === 1`, scrivibile)**: `widgets/ReferenceWidget.tsx`.
   Controllo 28px con badge lettera dell'entità (stessi token di `entityMeta.ts`, come il badge
   dell'header), nome del target, `bi-chevron-down`; vuoto: `bi-link-45deg` e placeholder
   `Select a <Type>` in `--color-form-muted`. Il click apre un popover **portalled su
   `document.body`** (il rail ha `overflow: hidden`, `properties-with-tree-view.scss:91`), con lo
   stesso calcolo di posizione di `InlineObjectSelect.computeListStyle`
   (`editor-v2/components/InlineObjectSelect.tsx:42-53`): esporta quella funzione (export additivo,
   nessun cambio di comportamento) invece di copiarla, e dichiaralo nel log. Popover: fondo
   `--color-form-surface`, bordo `--color-form-border`, `--radius-control`, `--shadow-popover`;
   riga di ricerca 28px (`ui/Input` con `bi-search`), righe candidati 26px con badge e nome,
   evidenziata con `--color-selection-bg` e barra 2px `--color-selection-bar` a sinistra
   (`_colors-light.scss:376-377`, i token di selezione della tela). Candidati da `slot.validTargetOptions` (già usato per gli enum in
   `useFormWidgets.ts:138`), filtrati per sottostringa case-insensitive sul nome. Tastiera: frecce,
   Enter, Escape; click fuori chiude. Selezione: `setSlotValue(slot, 0, id, true)`. Per un
   `[0..1]` c'è anche la voce `(none)` che chiama `clearSlotValue(slot, 0, true)`; per un `[1..1]`
   no (stessa regola di `InlineObjectSelect.allowNone`).
8. **Liste di riferimenti e di children (`treatment === 'list'`)**: `widgets/ListWidget.tsx`.
   Righe 28px: badge, nome, testo secondario (per una `Transition`: `to <target.name>` se ha un
   `target`, altrimenti niente), `bi-x` a destra che chiama `clearSlotValue(slot, i, true)`. Sotto,
   per i **riferimenti**, il bottone `Add` tratteggiato 24px (`--color-form-border-strong`, 11px)
   che apre lo stesso popover di 7 in modalità append e chiama `appendSlotValue(slot, id, true)`.
   Per i **children** (`isComposition`) niente `Add` in questa slice: la riga è leggibile e
   rimovibile, il resto è rinviato (vedi COSA, fuori scope). Al limite superiore
   (`isAtUpperBound`) il bottone `Add` è disabilitato con `cursor: not-allowed`, colori
   `--color-form-border` / `--color-form-border-strong` e `title="Maximum <upper>"` (il tooltip
   nativo basta: un tooltip custom slate è chrome in più che il mockup disegna e la slice non
   giustifica; dichiaralo nel log).
9. **Attributi multivalore**: `widgets/ChipsWidget.tsx`. Contenitore con bordo, chip 20px
   (`--color-bg-tertiary`, bordo `--color-form-border`, `--radius-sm` 4px, 11px, `bi-x` che chiama
   `clearSlotValue(slot, i, false)`), chip `Add` tratteggiata inline che si trasforma in un input
   di 20px; Enter chiama `appendSlotValue(slot, text, false)`, Escape annulla, blur con testo
   vuoto annulla. Al limite superiore la chip `Add` è disabilitata come in 8. Per un multivalore di
   tipo `EBoolean`/`EInt`/enum il widget resta lo stesso: il testo digitato passa per
   `U.initializeValue`-coerenza a carico di `LValue` (nessuna conversione nel widget), e un valore
   non parsabile produce la diagnostica del validatore, non un errore della form.
10. **`formWrite.ts`**: un helper nuovo `appendSlotValue(slot, value, isPtr): boolean`, una sola
    `TRANSACTION` con `SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr)` (stesso pattern di
    `addSlotValue`), `U.isProjectModified = true` solo se eseguito. **Micro-discovery obbligatoria
    prima di scrivere la rimozione**: su uno slot multivalore della fixture, verifica in console
    cosa lascia `setValueAtPosition(i, undefined)` in `__raw.values` (array più corto, oppure un
    buco `undefined`). Se lascia un buco, aggiungi `removeSlotValue(slot, index, isPtr)` che chiama
    `slot.removeByIndex(index)` (`LModelElement.tsx:6893`) in `TRANSACTION` e usalo per attributi e
    riferimenti; per i children resta `clearSlotValue`, perché `setValueAtPosition` gestisce
    l'oggetto contenuto (`Info.tsx:732-739`). L'esito della prova va nel log (`Notes`) e nel
    doc-comment dell'helper scelto.
11. **`IRFormField`**: dispatch esteso. Ordine: read-only (invariato) → `treatment === 'list'` →
    multivalore attributo → `reference` singolo → gli scalari della 1a. Il campo `editable` della 1a
    si articola di conseguenza senza rinominarlo.

### F. Temi

12. **`card`**: `.ir-form--card` con fondo pannello `--color-form-panel`; ogni `ir-form__group` è
    una card `--color-form-surface`, bordo `--color-form-border`, `--radius-control`, header con
    bordo inferiore e titolo 12px/600.
13. **`compact`**: `.ir-form--compact`: label a sinistra su colonna 88px (`ir-field` in grid
    `88px 1fr`), controlli 24px (`--control-height-sm`), valori 12px, titoli di sezione 11px
    `--color-form-muted`; la molteplicità passa in `title` della label e sparisce dalla riga. Solo
    qui `labelPlacement: 'left'` è onorato; negli altri temi è ignorato senza warning (R1
    dell'handoff).
14. **`inspector`**: `.ir-form--inspector`: header di sezione full-bleed 28px `--color-form-panel`,
    chevron 10px (`bi-chevron-down` / `bi-chevron-right`), titolo uppercase 11px/600 0.08em
    `--color-form-label`, conteggio dei campi in mono a destra; sezione collassabile, stato per
    view nella stessa chiave `jjodel.formPrefs.<viewId>` (`collapsed: string[]` di chiavi di
    sezione, accanto a `mode`; il commento su `readMode` lo prevedeva). Controlli 26px
    (`--control-height-md`).
15. Il tema viene da `spec.theme ?? defaultTheme` come oggi; nessun selettore utente nel rail
    (arriva con l'authoring, Slice 2). L'altezza degli slot 32/16 non cambia con il tema; l'altezza
    dei controlli sì (28/28/24/26), ed è l'unica cosa che cambia fra i temi oltre alla cornice.

## DOVE

Elenco chiuso. Se serve un file che non è qui, fermati e chiedi.

**Da creare (6)**, sotto `frontend/src/components/editor-v2/viewpoint/ir/` salvo indicazione:

| File | Ruolo |
|---|---|
| `widgets/ReferenceWidget.tsx` | Punto 7. Popover portalled, ricerca, tastiera. |
| `widgets/ListWidget.tsx` | Punto 8. Righe con rimozione; `Add` per i riferimenti. |
| `widgets/ChipsWidget.tsx` | Punto 9. |
| `__tests__/formDiagnostics.test.ts` | La funzione pura che distribuisce i `ConformanceProblemDetail` ai campi (estraila in `formDiagnostics.ts` se `IRForm.tsx` altrimenti la terrebbe inline: a tua scelta, dichiarata nel log; se la estrai il file è il settimo). |
| `frontend/src/__tests__/fixtures/xmi-m1/StateMachine.ecore` | Punto 1. |
| `frontend/src/__tests__/fixtures/xmi-m1/sample-StateMachine.xmi` | Punto 1. |

**Da toccare (12)**:

| File | Cosa cambia |
|---|---|
| `editor-v2/problems/registry.ts` | `metamodelElementName?: string` su `ConformanceProblemDetail`, con doc-comment che dice da dove viene e perché non si chiama `featureName`. |
| `editor-v2/problems/conformanceToProblems.ts` | La riga di copia. |
| `editor-v2/problems/__tests__/conformanceToProblems.test.ts` | Un caso. |
| `ir/useFormWidgets.ts` | `treatment` su `FormFieldDescriptor`; `hidden` in `describeSlots`. |
| `ir/formWrite.ts` | `appendSlotValue`, ed eventualmente `removeSlotValue` (punto 10). |
| `ir/IRForm.tsx` | Problemi, riepilogo, dirty, `collapsed` nelle preferenze, temi. |
| `ir/IRFormField.tsx` | Dispatch esteso, `ir-field--dirty`, `onDirty` (o equivalente) verso `IRForm`. |
| `ir/irFormStyle.scss` | Riepilogo con chip, dirty, popover, liste, chip, tre temi. Prefissi invariati (`ir-form*`, `ir-field*`); per il popover `ir-picker*` (verifica con `grep -r "ir-picker"` che sia libero prima di usarlo). |
| `ir/__tests__/useFormWidgets.test.ts` | Casi per `treatment` e `hidden`. |
| `editor-v2/components/InlineObjectSelect.tsx` | Solo `export` su `computeListStyle`. Nient'altro. |
| `styles/tokens/_colors-light.scss` e `_colors-dark.scss` | `--color-form-dirty-border`, `--color-form-dirty-text`, in coppia; per il dark deriva come i vicini e riportalo. |
| `services/export/__tests__/ecore-io.test.ts` | Il `describe` della fixture. |

Non toccare: `Info.tsx`, `IRNodeContent.tsx`, `canvasToJjom.ts`, `useJjomSync.ts`,
`ConformanceProblemSync.tsx`, `NodeProblemIndicator.tsx`, `NodeProblemOverlay.tsx`,
`useNodeProblems.ts`, `model/conformance/*`, `SaveManager.ts`, `VersionFixer.tsx`, `ui/*`,
`tokens.css`, `_themes.scss`, `PropertiesWithTreeView.tsx`, `irTypes.ts` (nessun literal nuovo:
`WidgetKind` e `FeatureTreatment` bastano così), `irCompile.ts`, `irValidate.ts`.

## COME

**Ordine e commit.** Tre commit, `git add` per pathspec, ciascuno con i gate (`npm run typecheck`
alla baseline di 33 su macOS, `npx vitest run` verde sui test nuovi e senza nuove suite rosse,
`npm run build` exit 0, `npm run smoke` 12/12).

*Commit D*, `feat(rail): per-field conformance diagnostics, problem summary and dirty state on the form (form views 1b)`:
fixture (2 file) e test, i tre file di `problems/`, `IRForm.tsx`, `IRFormField.tsx`,
`irFormStyle.scss`, i due file di token, `formDiagnostics.ts` e test se estratto. Prima del diff
su `problems/`: il LIR in chat.

**Hard stop dopo D** per la verifica visiva (V1-V4). Poi, su GO della chat:

*Commit E*, `feat(rail): reference picker, editable lists and chips on the form (form views 1b)`:
`ReferenceWidget.tsx`, `ListWidget.tsx`, `ChipsWidget.tsx`, `useFormWidgets.ts` e test,
`formWrite.ts`, `IRFormField.tsx`, `irFormStyle.scss`, `InlineObjectSelect.tsx`. Prima del diff
su `formWrite.ts`: la micro-discovery del punto 10, riportata in chat.

**Hard stop dopo E** (V5-V8). Poi:

*Commit F*, `feat(rail): card, compact and inspector themes on the form (form views 1b)`:
`IRForm.tsx`, `irFormStyle.scss`.

**Hard stop dopo F** (V9-V10). L'entry di log si scrive dopo l'ultima verifica, cumulativa per
D+E+F. Se D è pulito ed E no, D resta committato e ci si ferma su E; lo stesso fra E ed F.

**Test** (oltre a quelli già elencati nei punti 1, 2):

- `formDiagnostics`: tre violazioni su `kind`, `outgoing` e nome di classe → `kind` e `outgoing`
  ricevono la loro, la terza finisce nel residuo; `resolvedAt` definito → esclusa; conteggio
  errori/warning uguale alla formula di `NodeProblemIndicator`;
- `useFormWidgets`: `features: { substates: 'hidden' }` toglie il campo; `outgoing: 'inline'` su un
  `[0..5]` degrada a `list`; default `inline` per `[1..1]`, `list` per `[0..*]`;
- `formWrite`: se aggiungi `removeSlotValue`, un test sul pattern di quelli esistenti (se
  `__tests__/formWrite.test.ts` non esiste, non crearlo: la copertura di `formWrite` è la
  verifica visiva, e va detto nel log).

**Criteri di accettazione della verifica visiva** (li esegue la chat sul Chrome di Alfonso,
`http://localhost:3000/`, PROTOCOL P8; devono essere veri):

- V1: nuovo progetto → import `StateMachine.ecore` (metamodello) → import `sample-StateMachine.xmi`
  (modello): l'albero mostra `Heater` con 4 stati e 3 transizioni; `Running.isHistory` è una
  checkbox spuntata, `timeout` un stepper a 30, `kind` una select su `normal`, `depth` read-only con
  il lucchetto. Il V3 della 1a, mai esercitato, si chiude qui.
- V2: su `Broken` il riepilogo dice `1 error`, il campo `kind` ha bordo rosso e messaggio nello
  slot; scegliere un `kind` fa sparire entrambi (dopo il flush del validatore) senza spostare
  nulla: `getBoundingClientRect` dei campi sotto invariato prima e dopo.
- V3: click sulla chip `1 error` → il campo `kind` riceve il focus.
- V4: modificare `timeout` → punto cyan, bordo `#7dd3fc`, `Modified, not saved`; salvare (Cmd+S o
  bottone) e provocare un re-render (selezionare un altro campo) → i marker spariscono.
- V5: su `start`, `target` è un picker con badge e `Running`; aprirlo, digitare `of`, Enter →
  `target = Off`, l'arco sulla tela segue (il sync reagisce alla scrittura su `LValue` esattamente
  come oggi per il pannello classico: se non segue, è un finding, non una regressione da nascondere).
- V6: su `Running`, `outgoing` è una lista di 2 righe (`stop`, `fault`) con `to Off` / `to Broken`;
  `Add` → popover → scegliere `start` → 3 righe; rimuovere una riga → 2 righe e
  `rawValues(slot).length === 2` letto da console (no buco, oppure il buco è gestito dalla
  scelta del punto 10).
- V7: `tags` di `Running` è un contenitore con due chip; `Add`, digitare `night`, Enter → tre chip;
  `bi-x` su `hot` → due chip. Su una feature `[0..5]` con 5 valori, `Add` è disabilitato con il
  tooltip `Maximum 5`.
- V8: `view.ir = { ...view.ir, form: { features: { substates: 'hidden' } } }` da console (setter
  `.ir`, come V6 della 1a) toglie la sezione `substates`, senza reload.
- V9: `form: { theme: 'card' }`, poi `'compact'`, poi `'inspector'` da console: cornice, altezze
  dei controlli (28/24/26 misurate) e label a sinistra solo in compact; slot 32 e 16 invariati.
- V10: in `inspector`, collassare una sezione e ricaricare: resta collassata (chiave
  `jjodel.formPrefs.<viewId>`, campo `collapsed`).

**Vincoli trasversali**: nessun rename di identificatori esistenti; nessun `op` stringa dentro
`FormSpec` (vale anche per i test); nessun literal nuovo in `WidgetKind` e `FeatureTreatment`
(sono irreversibili, R-B9); testi dell'interfaccia in inglese; niente em dash nei commenti, nei
doc e nei test; ogni classe CSS nuova verificata con `grep -r` prima dell'uso; nessuna scrittura
Redux fuori da `formWrite.ts`.

## Chiusura (dopo la verifica visiva, su indicazione della chat)

- Entry in `docs/claude-code-log.md` nel formato di `CLAUDE.md` §21.2, cumulativa D+E+F:
  `Layer Impact Report: produced`; in `Notes` (sotto i 500 caratteri) l'esito della
  micro-discovery del punto 10, il check che intercetta `Broken.kind`, la scelta su
  `formDiagnostics.ts`, i token dark aggiunti. `Smoke visivo`: l'attore è la chat con il Chrome
  di Alfonso.
- Salva questo prompt in `docs/prompts/` con il nome del file (lo fa la chat se il bridge è
  connesso; altrimenti tu, nel commit F).
- L'addendum `FormSpec` alla spec IR v1.2 lo scrive la chat dopo questa slice: non crearlo.

## RIFERIMENTI

- `docs/discovery/discovery_2026-08-26_form_views_slice1.md`: finding 2 (write path `LValue`), 5
  (`validTargetOptions`, `__raw.values`), 6 (registry, `metamodelElementName` scartato in
  `conformanceToProblems.ts:50-54`), 8 (kit `ui/`: manca il popover ancorato e il picker), 12
  (critical zone e perimetro).
- `docs/sessioni/sessione_2026-08-27_form_views_1a.md`: todo 1 (fixture), 3 (le due righe),
  info strutturali (registry sotto `DObject`, `transactionDepthLevel` a riposo 1: le prove da
  console dentro `TRANSACTION`).
- Handoff README: §Widgets (Reference picker, Reference list, Value list), §Themes, §Rail chrome
  (problem summary), §Validation states (tutti tranne "Invalid value", che non ha un check dietro),
  §State management.
- `editor-v2/components/InlineObjectSelect.tsx` (popover portalled, `computeListStyle`,
  `allowNone`), `InlineEnumSelect.tsx` (tastiera).
- `editor-v2/problems/NodeProblemIndicator.tsx:48-50` (formula del conteggio),
  `ConformanceProblemSync.tsx:9-15` (doppia registrazione).
- `components/editors/Info.tsx:728-739` (add e remove del pannello classico),
  `model/logicWrapper/LModelElement.tsx:6893` (`removeByIndex`).
- `components/topbar/SaveManager.ts:34` (nessun evento di save).
