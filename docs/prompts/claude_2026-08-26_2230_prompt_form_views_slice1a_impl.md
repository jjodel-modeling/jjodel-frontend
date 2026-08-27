# Prompt Claude Code: Form rendering delle view, Fase 2, Slice 1a

**Data**: 2026-08-26 22:30
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: feat (two-phase, Fase 2). Go-ahead dato in chat sul report
`docs/discovery/discovery_2026-08-26_form_views_slice1.md` (commit `eac523572`).
**Effort**: xhigh
**Precedente**: `claude_2026-08-26_2017_prompt_form_views_fase1_discovery.md`

Leggi `CLAUDE.md`, `PROTOCOL.md`, le ultime entry di `docs/claude-code-log.md` e **il report di
discovery per intero**: questo prompt lo assume letto e ne cita i finding per numero.

---

## Risposte alle domande aperte del report (§7)

**A1, token: (a) `styles/tokens/` semantico, con una regola in più.** I 15 nomi sovrapposti fra
`tokens.css` e `tokens/*.scss` (finding 7, tabella delle divergenze) **non vanno usati** nello SCSS
della form, nessuno dei 15: sono caricati entrambi (`App.scss:6` e `App.tsx:8`) e il valore che
vince dipende dall'ordine di cascata, quindi `--color-bg-primary` non ha un significato affidabile.
Per quei ruoli si aggiungono token semantici **con prefisso `form`**, non ambigui e definiti in
entrambe le palette (light e dark, regola 28 e §7.2):

```
--color-form-surface        #ffffff   (fondo input, card)
--color-form-panel          #f8fafc   (fondo pannello card, header sotto-form)
--color-form-border         #e2e8f0   (bordo input; e' $slate-200, non $slate-250)
--color-form-border-strong  #cbd5e1   (checkbox, dashed Add)
--color-form-summary        #fcfdfe   (slot riepilogo)
--color-form-label          #475569   (label 11px; e' $slate-600, vedi finding 7)
--color-form-muted          #94a3b8   (molteplicita', eyebrow, placeholder)
--color-form-section        #64748b   (titoli di sezione plain)
--color-marker-required     #0ea5e9
--color-error-text          #b91c1c
--color-warning-text        #b45309
--shadow-popover            0 4px 12px rgba(0,0,0,0.08)
--focus-ring                0 0 0 3px rgba(51,65,85,0.15)
--control-height-sm/md/lg   24px / 26px / 28px
--radius-xs                 3px
--radius-control            6px
--text-2xs / --text-md / --text-title   10px / 12px / 16px
```

I nomi non sovrapposti di (A) che il report ha mappato con ✅ (`--color-text-primary`,
`--color-accent`, `--color-error`, `--color-warning`, `--color-bg-tertiary`, `--space-*`,
`--transition-fast`) si usano direttamente. I componenti `ui/` restano nel loro namespace (B),
non si toccano. Per i valori dark, usa la stessa logica di derivazione dei token vicini in
`_colors-dark.scss`; se un ruolo non ha un vicino ovvio, scegli il grado slate speculare e
segnalalo nel log.

**A2, Basic/Advanced: (b).** Il toggle della form è indipendente, stato locale di `IRForm`,
inizializzato da `getInterfaceMode()` (`hooks/useInterfaceMode.ts:23`) e poi persistito per view in
`localStorage['jjodel.formPrefs.<viewId>']` come `{"mode":"basic"|"advanced"}` (finding 9). Non
tocca `state.advanced` né `jjodel.interfaceMode`.

**A3, badge entità: restano i token esistenti.** Il badge "S" dell'oggetto usa
`--color-entity-object-bg/fg` e la scala di `entityMeta.ts` (R-RAIL-30), non l'ambra dell'handoff.
La coerenza con l'albero a 300px di distanza vale più della fedeltà al mockup su questo punto. Il
README va lasciato com'è; la decisione va nel log.

**A4, textarea JjEL: (a) override d'autore** in `form.widgets`. La default form di uno Statechart
mostra `entryAction` come testo finché la view non dichiara `widgets: { entryAction: 'textarea' }`.
Accettato e dichiarato. Un flag sul metamodello è un fronte futuro, non di questa slice.

**A5, visibilità del tab Form: più larga della tua ipotesi.** Il tab compare per **ogni soggetto
che è un `DObject`** (M1), anche quando `useIRFormView` non risolve una view: in quel caso la form è
la default derivata dal metamodello (spec IR v1.2 §10, fallback esplicito), con le sezioni
`Attributes` / `References` / `Children`. Ragione: la slice deve essere verificabile su qualunque
modello senza autorare prima una `form`. Su `DClass` e sugli altri elementi M2 il tab non compare.

**A6, taglio: 1a/1b accettato, con una aggiunta.** La 1a include anche `SelectWidget` per gli enum:
`ui/Select` esiste, `kind` del dominio di esempio è un enum, e la normalizzazione `''` → default
(R5) va esercitata subito, non nella 1b. Quindi quattro widget: text, number, checkbox, select.

**A7, sezioni: dai compartimenti, con un titolo opzionale.** Si aggiunge `title?: string` a
`FieldCompartmentSpec` (additivo, opzionale, nessun bump, stesso precedente di `rowFormat.style`).
Una sezione per compartimento nell'ordine dei `fieldCompartments`; il titolo è `title` se presente,
altrimenti l'`id` con la prima lettera maiuscola. Un compartimento `children` produce una sezione
il cui contenuto nella 1a è read-only (nomi dei figli). Il raggruppamento arbitrario di feature in
sezioni (Identity/Behavior del mockup, che i compartimenti non sanno esprimere perché la `source`
è per tipo) **è rinviato**: quando servirà, sarà `FormSpec.sections`, non un cambio dei
compartimenti. Il mockup in 1a si legge quindi con una sezione `Attributes` che contiene tutti gli
attributi.

Le decisioni 1-7 del prompt di Fase 1 restano in vigore. La 5 (un solo write path) si legge ora
con il finding 2: il contratto è `LValue.setValueAtPosition` dentro `TRANSACTION`, con
`U.isProjectModified = true` condizionato al cambio reale come `IRNodeContent.tsx:189`, e **non**
`syncUpdateFeatureValue`.

---

## COSA

Slice 1a: il tab `Form` nel rail Properties, tema `plain`, per un `DObject` selezionato. Copre gli
artboard 1a/1b e la parte `plain` di 2a. Fuori scope (1b): gli altri tre temi, reference picker,
liste con add/remove, chip, diagnostica per campo e riepilogo popolato, stato dirty, i due file di
`problems/`.

Comportamento atteso a fine slice:

1. Selezionando un `DObject` (albero o tela) il rail mostra due tab, `Properties` e `Form`. Il
   soggetto è quello effettivo del pannello (`effectivePin?.modelElement ?? selectedElementId`,
   finding 1), non la selezione nuda.
2. Il tab `Form` rende: header (badge lettera dell'entità, nome 13px/600, metaclasse 11px muted,
   segmented Basic/Advanced), slot riepilogo 32px **vuoto ma riservato** (`No issues` con
   `bi-check-circle`, muted), poi le sezioni.
3. Ogni campo: label row (label 11px, punto required 4px cyan se `lowerBound >= 1`, molteplicità
   `lower..upper` mono 10px a destra, `*` per upper -1), widget, slot messaggi 16px **sempre
   riservato e vuoto**.
4. Widget per tipo (finding 5, mappa `Info.tsx:710-719`): `EString` e default → text; interi e
   float → number stepper (`ui/NumberInput`, che ha già i segmenti `-`/`+`); `EBoolean` →
   checkbox con label a destra; enum → select (`ui/Select`) con opzioni da `slot.validTargetOptions`.
   Override da `form.widgets` per `text | textarea | number | checkbox | select`; `textarea` usa
   `ui/Textarea` con `--font-mono` 12px e hint "JjEL" in mono 10px accanto alla label **solo** se
   dichiarato dall'autore.
5. Feature multivalore (`upperBound !== 1`), riferimenti e children: nella 1a **read-only**, resi
   come righe di testo (nome dell'oggetto puntato risolto come in `IRNodeContent.tsx:144`), con la
   label row completa, così la molteplicità e il required si vedono già.
6. Feature con `slot.derived === true` o `slot.changeable === false`: widget read-only con fill
   `--color-bg-tertiary`, testo mono `--color-form-section`, `bi-lock-fill` 9px accanto alla label e
   `derived` al posto della molteplicità (artboard 3a, stato "Read-only derived").
7. Basic mostra le feature in `form.basic` se dichiarato, altrimenti quelle con `lowerBound >= 1`;
   Advanced mostra tutto. Se in Basic una sezione resta vuota, la sezione non si rende.
8. Commit del valore su blur e su Enter (text, number, textarea); su change (checkbox, select).
   Escape ripristina il valore corrente dello slot. Nessun debounce.
9. Focus: bordo `--color-accent` più `--focus-ring`. Hover e focus con `--transition-fast`.

## DOVE

Elenco dei file, confermato in chat (regola 19 soddisfatta da questo prompt; se durante il lavoro
serve toccarne uno che non è qui, fermati e chiedi).

**Da creare (11)**, tutti sotto `frontend/src/components/editor-v2/viewpoint/ir/` salvo dove
indicato:

| File | Ruolo |
|---|---|
| `IRForm.tsx` | Interprete: `objectId` + `CompiledView \| null` → header, toggle, slot riepilogo, sezioni. Applica `basic`, `features`, `title`. Tema `plain` cablato in questa slice, ma la prop `theme` esiste già con default dell'host. |
| `IRFormField.tsx` | Un campo: label row, widget, slot 16px. Nome `IRFormField`, non `IRField` (finding 10). Non usa `ui/Field` (R4: il suo messaggio è condizionale). |
| `useFormWidgets.ts` | Derivazione pura: slot + feature → `{ widget, lower, upper, isEnum, isReference, isComposition, isDerived, isReadOnly, options }`. Porta la mappa tipo→field e la classificazione di `Info.tsx:770-790` (**copiata**, non estratta: `Info.tsx` non si tocca). Legge `__raw.lowerBound` / `__raw.upperBound`. Conta i valori con `__raw.values` filtrato (R6). Applica `form.widgets`. |
| `useIRFormView.ts` | `useIRRowView` (`irResolve.ts:160`) chiavizzato sull'`objectId`, con `resolveIRView` al posto di `resolveRowView`. Ritorna `CompiledView \| null`. |
| `formWrite.ts` | `setSlotValue(slot, index, value, isPtr)`, `clearSlotValue(slot, index, isPtr)`, `addSlotValue(slot, type)`: ciascuna in `TRANSACTION`, `U.isProjectModified = true` solo se il valore cambia. `addSlotValue` è scritta ora ma usata solo dalla 1b. |
| `widgets/TextWidget.tsx`, `widgets/NumberWidget.tsx`, `widgets/CheckboxWidget.tsx`, `widgets/SelectWidget.tsx` | Involucri sottili su `ui/Input`, `ui/NumberInput`, `ui/Checkbox`, `ui/Select`. `SelectWidget` mappa `''` sul valore corrente dello slot e non lo scrive mai (R5, `Select.tsx:113`). `TextWidget` copre anche `textarea` via prop, oppure un quinto file se più pulito: a tua scelta, dichiarala nel log. |
| `irFormStyle.scss` | Label row, slot 16px, slot 32px, header, sezioni `plain`, stati focus e read-only. Classi con prefisso `ir-form` / `ir-form__` / `ir-form--` e `ir-field` / `ir-field__` / `ir-field--` (tutte libere, finding 10). Per le sezioni la classe è `ir-form__group`, non `ir-form__section` (`FormSection` di `ui/` esiste). SCSS statico importato da `IRForm.tsx`, non iniezione runtime. |
| `__tests__/useFormWidgets.test.ts` | Vedi sotto. |

**Da toccare (7)**:

| File | Cosa cambia |
|---|---|
| `ir/irTypes.ts` | `FormTheme`, `WidgetKind`, `FeatureTreatment`, `FormSpec` esattamente come in §4 del report (doc-comment incluso, con il vincolo su `op`); `form?: FormSpec` su `VertexViewIR`, `GraphVertexViewIR`, `EdgeViewIR`; `form: FormSpec \| null` su `CompiledView`; `title?: string` su `FieldCompartmentSpec` con doc-comment "Additive optional field: no irVersion bump, no migration". |
| `ir/irCompile.ts` | `const form = ir.form ?? null;` in `compileView` e il campo nel literal di ritorno. Passthrough, nessun accessor. `title` del compartimento copiato in `CompiledFieldCompartment` (campo opzionale). |
| `ir/irValidate.ts` | **Nessuna modifica di codice.** Solo un test (sotto) che prova che una view con `form` popolata passa. Se la prova fallisce, fermati e riporta. |
| `editors/PropertiesWithTreeView.tsx` | Barra tab (`Properties` \| `Form`) sopra il punto di mount di `Info` (`:940`), stato locale del tab, `IRForm` nel secondo ramo. Il tab `Form` esiste solo se il soggetto effettivo è un `DObject`; se il soggetto cambia tipo mentre `Form` è attivo, torna a `Properties`. Riusa `ui/SegmentedControl` per la barra se la resa è accettabile, altrimenti due bottoni con la classe attiva `inset 0 -2px 0 var(--color-accent)` come nel mockup 6a. |
| `styles/tokens/_colors-light.scss` e `_colors-dark.scss` | I token colore di A1, in coppia. |
| `styles/tokens/_spacing.scss`, `_radius.scss`, `_typography.scss`, `_shadows.scss` | Le dimensioni di A1, ciascuna nel file del suo asse. Se uno di questi file segue una convenzione di naming diversa da quella proposta, adatta il nome e riportalo nel log. |

Non toccare: `Info.tsx`, `IRNodeContent.tsx`, `IRRow.tsx`, `canvasToJjom.ts`, `useJjomSync.ts`,
`problems/*`, `VersionFixer.tsx`, `ui/*`, `tokens.css`, `_themes.scss`.

## COME

**Ordine e commit.** Due commit, con `git add` per pathspec.

*Commit A*, `feat(ir): FormSpec on view IR, widget derivation and slot write helpers (form views 1a)`:
`irTypes.ts`, `irCompile.ts`, `useFormWidgets.ts`, `useIRFormView.ts`, `formWrite.ts`, i test, i
sei file di token, più `docs/design/design_handoff_jjodel_form_views/` (oggi untracked: entra nel
repo con questo commit, è il riferimento citato dai report). Gate: `tsc` alla baseline, vitest
verde sui test nuovi, `build` exit 0.

*Commit B*, `feat(rail): Form tab renders the selected object as a plain-theme form (form views 1a)`:
`IRForm.tsx`, `IRFormField.tsx`, `widgets/*`, `irFormStyle.scss`, `PropertiesWithTreeView.tsx`.
Stessi gate.

**Hard stop dopo il commit B** per la verifica visiva, che fa la chat pilotando il Chrome di
Alfonso su `http://localhost:3000/` (PROTOCOL P8). L'entry di log si scrive dopo la verifica, non
prima. Se A è pulito e B non lo è, lascia A committato e fermati su B.

**Test** (`__tests__/useFormWidgets.test.ts`, più un caso in `irValidate.test.ts` e uno in
`ir.test.ts` se il pattern dei test esistenti lo richiede):

- derivazione per i dieci tipi primitivi della mappa di `Info.tsx:710-719`;
- enum → `select` con le opzioni; `DReference` → `reference` read-only; `composition: true` →
  `isComposition` e non `isReference` (finding 4);
- molteplicità: `[1..1]` vuoto conta 0 con `__raw.values` imbottito di `undefined` (R6);
  `[0..5]` con 5 valori è al limite; `[0..*]` non ha limite;
- override: `widgets: { entryAction: 'textarea' }` vince sulla derivazione; un override con un
  `WidgetKind` incompatibile col tipo (es. `checkbox` su `EString`) è ignorato con la derivazione
  che resta, senza throw;
- `basic` dichiarato vince sull'euristica `lowerBound >= 1`;
- `validateIR` accetta una `VertexViewIR` con `form` popolata in ogni campo e `fieldCompartments`
  con `title` (R10); `compileView` la restituisce in `form` invariata; `irHash` cambia al cambiare
  di `form.theme` (cache non stantia, finding 3);
- `SelectWidget`: un `onChange` con `''` non chiama `setSlotValue`.

**Criteri di accettazione della verifica visiva** (li esegue la chat; devono essere veri):

- V1: albero → oggetto M1 → il rail ha i tab `Properties` e `Form`; su una `DClass` solo `Properties`.
- V2: nel tab `Form`, modificare `name` e uscire dal campo: il nome cambia nell'albero e sul nodo
  della tela, e `windoww.U.isProjectModified === true`.
- V3: checkbox, select enum, number stepper scrivono il valore e la rilettura da
  `LPointerTargetable.fromPointer(objectId)` lo conferma.
- V4: altezza di un campo misurata con `getBoundingClientRect` = label row + widget + 16px, e il
  riepilogo è alto 32px: gli slot sono riservati anche vuoti.
- V5: Basic mostra solo le feature con `lowerBound >= 1` (o `form.basic`); il toggle persiste al
  reload sulla chiave `jjodel.formPrefs.<viewId>`.
- V6: impostare da console `view.ir = { ...view.ir, form: { widgets: { entryAction: 'textarea' } } }`
  (setter `.ir`, stesso write path del pannello) rende `entryAction` come textarea mono con
  l'hint JjEL, senza reload.
- V7: un riferimento e una feature multivalore compaiono read-only con label row completa.

**Vincoli trasversali**: nessun rename di identificatori esistenti; nessun refactoring di `Info.tsx`
anche se la copia della mappa dei tipi lo invita; nessuna chiave `op` in `FormSpec`; testi
dell'interfaccia in inglese; niente em dash nei commenti e nei doc.

## Chiusura (dopo la verifica visiva, su indicazione della chat)

- Entry in `docs/claude-code-log.md` nel formato di CLAUDE.md, cumulativa per A+B, con: le
  decisioni A1-A7 in una riga ciascuna, i nomi dei token aggiunti, la scelta sul file di `textarea`,
  la scelta della barra tab, l'esito dei gate. `Notes` sotto i 500 caratteri.
- Sezione nuova in `docs/spec/`: non in questa slice. La spec `FormSpec` (addendum alla v1.2) si
  scrive alla chiusura della 1b, quando `WidgetKind` e `FeatureTreatment` sono esercitati per
  intero.

## RIFERIMENTI

- `docs/discovery/discovery_2026-08-26_form_views_slice1.md`: finding 1 (soggetto effettivo e pin),
  2 (contratto `LValue`), 3 (`useIRRowView` come modello, `irHash`), 4 (classificazione di
  `Info.value`), 5 (mappa dei tipi, `__raw`), 7 (token), 8 (kit `ui/`, `Select.tsx:113`), 9
  (chiave localStorage), 10 (nomi), 11 (`op`, nessun bump), §4 (`FormSpec`), §6 (R1-R11).
- Handoff: `docs/design/design_handoff_jjodel_form_views/README.md`, §Anatomy of a field, §Widgets,
  §Themes (plain), §Rail chrome, §Validation states (solo "Read-only derived" e "Focus" in 1a).
- Precedenti additivi sull'IR: `marker` (`irTypes.ts:166-172`), `ShapeSpec.padding` (`:180-183`),
  `rowFormat.style` (`:146`).
- `IRNodeContent.tsx:183-192` per il pattern di commit con `isProjectModified` condizionato.
