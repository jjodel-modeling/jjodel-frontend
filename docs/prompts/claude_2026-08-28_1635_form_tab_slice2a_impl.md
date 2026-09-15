# Prompt Claude Code: Slice 2a, tab Form nell'authoring (Fase 2, implementazione)

Data: 2026-08-28 16:35. Branch `alfonso-frontend-jjtl`. Repo `~/jjodel`, root del repo come cwd.
Effort: xhigh. Due commit, un hard stop finale con checklist visiva per Alfonso.

Base fattuale: `docs/discovery/discovery_2026-08-28_form_tab_authoring_slice2.md` (commit
`ff80fba17`). Leggilo per intero prima di iniziare: questo prompt cita i suoi finding (D1..D10,
R1..R8) e non li ripete. Leggi `CLAUDE.md` per intero, `docs/PROTOCOL.md`, le ultime cinque entry
del log, la spec `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (§2, §5, §6, §7, §13,
§14) e `docs/design/design_handoff_jjodel_form_views/README.md`, sezione «Authoring panel
(6a/6b)». Apri `docs/design/design_handoff_jjodel_form_views/Jjodel Form Views.dc.html` e guarda
le artboard `6a` e `6b`.

## Decisioni prese sulle domande aperte del report

- **Q1, segmento `Inline` disabilitato: strada (a).** `SegmentedControlOption` riceve
  `disabled?: boolean` e `title?: string`. Un segmento assente farebbe chiedere perché il
  controllo ha due opzioni qui e tre là; un segmento disabilitato con tooltip dice la regola di
  degrado della spec §6 nel punto in cui si applica.
- **Q2, vestizione della tabella: strada (b).** Il corpo del tab vive in un componente nuovo,
  `FormAuthoringBody.tsx`, con un foglio `FormAuthoringBody.scss` accanto (modello
  `SymbolCard.tsx` + `SymbolCard.scss`). Niente stili inline nuovi salvo la costante `CHIP`.
- **Q3, perimetro: 2a senza il link cross-tab.** Il marcatore dei gruppi non reclamati è testo
  («not claimed by any compartment: rendered after the authored sections. Edit compartments in
  the Structure tab»), senza navigazione. Il link, il titolo dei compartimenti (Q4) e `basic`
  vanno nella Slice 2b. `events/registry.ts` e `ViewData.tsx` restano intatti.
- **Q4, titolo dei compartimenti: Slice 2b**, registrato nella nota finale come debito.
- **Q5, feature chiamata `op`: si misura, non si corregge.** Un test di caratterizzazione fissa
  il comportamento attuale; `irValidate.ts` non si tocca. Se il test conferma il rifiuto, la
  nota finale lo dichiara e la spec riceve una frase (vedi commit 2).

## COSA

Un tab `Form` (id `ir-form`, etichetta `Form`) nella barra dell'authoring, per il solo kind
`vertex`, tra `Symbol` e `Source`, raggiungibile in Basic. Corpo:

1. **Theme**: `Select` con placeholder «Host default» (idioma del Padding,
   `VertexAuthoringPanel.tsx:481-495`: il vocabolario chiuso non persiste mai `''`) e le quattro
   voci `plain`, `card`, `compact`, `inspector`. Sempre reso.
2. **Labels**: `SegmentedControl` Above / Left, `ariaLabel` obbligatorio. Sempre reso. Se il
   valore è `left` e il tema effettivo non è `compact`, un `HelpText` sotto dice che `left` vale
   solo per il tema compact (spec §13); nessuna riscrittura automatica.
3. In Basic, al posto delle due sezioni seguenti, un `HelpText icon={false}`: «Widgets are derived
   from feature types. Switch to Advanced to override them per feature and to set how references
   and children render.»
4. In Advanced, **le righe raggruppate per sezione nell'ordine in cui la form renderà** (R-FRM-1).
   Le sezioni vengono da `buildFormSections` con la firma generica di D6, alimentata da un
   adattatore: i `FieldCompartmentSpec` del draft mappati in `{ id, source: source.from, title }`
   e le righe derivate dalla metaclasse target (D4). Ogni sezione è una `FormSection`
   (`divider={false}`) col titolo che `buildFormSections` produce; le sezioni con chiave
   `residual-*` portano sotto il titolo il marcatore testuale di Q3. Le sezioni vuote non si
   rendono (stesso filtro di `IRForm.tsx:193`). Se la view non ha compartimenti, il risultato è
   Attributes / References / Children, cioè la mockup 6b.
   - **Riga attributo** (sezioni di gruppo `attributes`): nome in mono, `Select` con placeholder
     `Default (<etichetta del derivato>)` e le sole alternative che `overrideIsCompatible`
     accetta, **meno `link`** (nessuna resa, spec §14). Pallino ciano (5px,
     `var(--color-marker-required)`) prima del nome quando `draft.form.widgets[nome]` esiste ed
     è diverso dal derivato. Etichette: `text` Text, `textarea` Code, `select` Select, `checkbox`
     Checkbox, `number` Stepper, `color` Color, `reference` Picker, `link` Link.
   - **Riga reference o containment** (sezioni di gruppo `references` e `children`): nome in mono,
     badge testuale `child` per il containment, `SegmentedControl` Inline / List / Hidden.
     `Inline` è `disabled` con `title` «Multivalued: inline degrades to list» quando
     `upperBound !== 1`. Valore mostrato: `draft.form.features[nome]` se presente, altrimenti il
     derivato (`inline` se `upperBound === 1`, altrimenti `list`). Pallino ciano con la stessa
     regola della riga attributo. Riga con `hidden` attenuata (opacità via classe, non rimossa) e
     un `HelpText` una sola volta in fondo alla sezione: «Hidden removes the feature from the form
     in both Basic and Advanced.» Un `widgets[nome]` persistito su una reference (l'override
     `select`, non esposto in questa slice) si mostra come chip `CHIP` «widget: select
     (preserved)» e non è editabile.
   - **Override ignorati**: ogni chiave di `draft.form.widgets` che non corrisponde a nessuna
     feature della metaclasse, o il cui valore `overrideIsCompatible` rifiuta rispetto al
     derivato, si rende in una riga propria in coda alla sezione degli attributi, chip `CHIP`
     «ignored: <valore> on <tipo o "unknown feature">» con un bottone `Clear` che rimuove la
     chiave. Mai riscritta in silenzio.
5. **Scrittura**: un helper puro `withFormKey` che parte sempre da `{ ...draft.form }`, rimuove la
   chiave sul valore di default (idioma 1 di D3, mai `undefined` esplicito dentro `FormSpec`),
   rimuove la mappa `widgets` / `features` quando resta vuota e restituisce `undefined` quando
   l'intero `FormSpec` resta vuoto; il pannello fa `patch({ ...draft, form: next })` con il
   rest/spread che elimina la chiave `form` quando `next` è `undefined`. `basic` e ogni altra
   chiave non gestita round-trippano verbatim (R2).
6. **Nessun effetto**: il corpo è puramente presentazionale (R4), le righe sono calcolate in un
   `useMemo` su `[featureInfo.target, draft.fieldCompartments, draft.form]`.

Fuori scope, da non fare: `basic`, link cross-tab, titolo dei compartimenti, override
reference → select, estrazione della costante `CHIP` (quarta copia: dichiararla come debito nella
nota finale, non estrarla), qualunque modifica a `irValidate.ts`, `ViewData.tsx`, `registry.ts`,
`PathBuilderFeatures` (R1).

## DOVE

Due commit. Elenco completo dei file, come richiede la Rule 19; questo elenco vale come conferma
preventiva, non fermarti a chiederla.

**Commit 1, fondamenta additive, nessun comportamento cambia:**

- `frontend/src/components/editor-v2/hooks/useEditorMode.ts`: `isEnum?: boolean` su
  `MetaclassAttribute` con commento nello stile di `isSingleton`; `isEnum: !!attr.type?.isEnum`
  nei due popolamenti (D4, tre punti).
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts`: `export` su
  `overrideIsCompatible`. Nient'altro.
- `frontend/src/components/editor-v2/viewpoint/ir/formSections.ts`: firma generica di D6
  (`Section<F = FormFieldDescriptor>`, `buildFormSections<F extends Pick<...>>`, compartimenti a
  `Pick<CompiledFieldCompartment, 'id' | 'source' | 'title'>[]`). I test esistenti non cambiano.
- `frontend/src/components/ui/SegmentedControl/SegmentedControl.tsx`: `disabled?: boolean` e
  `title?: string` su `SegmentedControlOption`; il bottone riceve `disabled={disabled || opt.disabled}`
  e `title={opt.title}`; `select(index)` e la navigazione da tastiera saltano i segmenti
  disabilitati. I due consumatori esistenti (`ConditionalEditor.tsx:107`, `IRForm.tsx:221`) non
  passano le nuove proprietà e non cambiano.
- `frontend/src/components/editor-v2/viewpoint/ir/__tests__/useFormWidgets.test.ts`: un `describe`
  su `overrideIsCompatible` esportata, con la tabella di D5.

**Commit 2, il tab:**

- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`: `'ir-form'` nell'unione,
  `'ir-form': 'Form'` nel Record, inserito nel ramo `vertex` di `irTabsForKind` dopo
  `'ir-symbol'` e prima dell'append di `'ir-source'` (D1). Aggiorna il commento di
  `irTabsForKind` che elenca i tab.
- `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.tsx` (nuovo): il
  componente e gli helper puri esportati **prima** del componente (pattern
  `FieldCompartmentListEditor`): `deriveAuthoringWidget(attr)`, `offeredOverrides(derived)`,
  `widgetLabel(kind)`, `derivedTreatment(upperBound)`, `withFormKey(...)`, `ignoredOverrides(form,
  rows)`, `sectionsForAuthoring(compartments, rows)`. Props: `draft`, `target: MetaclassInfo | null`,
  `advanced`, `onChange: (form: FormSpec | undefined) => void`.
- `frontend/src/components/editor-v2/viewpoint/authoring/FormAuthoringBody.scss` (nuovo): righe
  30px, nome in mono 12px (`var(--font-mono)`), controllo a destra, pallino, riga attenuata,
  intestazione di sezione. Solo token esistenti di `styles/tokens/`. Prefisso classi
  `form-authoring__`: **prima** verifica con `grep -rn "form-authoring" frontend/src` che il
  prefisso sia libero (alle 16:28 del 2026-08-28 lo era); se non lo è più, fermati e segnala.
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`: il memo
  `featureInfo` restituisce anche `target: MetaclassInfo | null` (D4, con `target: null` nei due
  rami di uscita anticipata); il corpo `<div className="ir-tab-body ir-tab-body--form"
  style={body('ir-form')}>` tra Symbol e Source che monta `FormAuthoringBody` con
  `onChange={(form) => patch(form === undefined ? omitForm(draft) : { ...draft, form })}`, dove
  `omitForm` è il rest/spread locale. Nessun altro cambiamento al pannello.
- `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/formAuthoring.test.ts` (nuovo):
  i sei gruppi di D9 più il test di caratterizzazione di Q5 (un `FormSpec` con
  `widgets: { op: 'text' }` passato a `validateIR`: asserisci ciò che accade oggi, con un
  commento che rimanda a spec §2 e alla nota finale).
- `docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md`: **solo se** il test di Q5 conferma
  il rifiuto, una frase in §2 dopo il vincolo sull'`op`: le chiavi di `widgets` e `features` sono
  nomi di feature, quindi una feature chiamata `op` ricade nel vincolo; limite noto, non corretto.
  E in §14 una riga: la superficie di authoring del `FormSpec` è implementata per `theme`,
  `labelPlacement`, `widgets`, `features` (Slice 2a); `basic`, il link ai compartimenti e il
  titolo dei compartimenti sono Slice 2b.
- `docs/claude-code-log.md`: un'entry per commit, in testa.

Nessun altro file. Nessun file in critical zone (R8). Niente `git add .`.

## COME

Ordine dei passi del commit 1: 1 → 2 → 3 → 4, poi il test, poi `npm run typecheck` e i test.
Commit 2 nell'ordine `irTabs` → `FormAuthoringBody` (helper prima, componente dopo, SCSS) →
`VertexAuthoringPanel` → test → spec (condizionale) → gate.

Vincoli di codice:

- Ogni chiamata a `patch` lascia il draft committabile (R3): nessuno stato intermedio.
- Nessuna chiave `op` con valore stringa dentro ciò che scrivi in `FormSpec` (spec §2).
- Nessun `useEffect` in `FormAuthoringBody` (R4).
- Non estendere `PathBuilderFeatures` (R1).
- Non rinominare niente di esistente. Non toccare `IRForm.tsx`, `irCompile.ts`, `irValidate.ts`.
- Prima di ogni classe SCSS nuova e di ogni identificatore esportato nuovo: grep globale.
- Testo UI in inglese. Niente em dash nei testi che scrivi (codice, commenti, SCSS, log, spec).

## GATE

Ingresso: `git status --porcelain -- <tutti i file elencati in DOVE> docs/claude-code-log.md`
vuoto; il resto del tree si dichiara nella nota finale e non blocca. Misura e annota la baseline
prima di toccare qualsiasi cosa: `npm run typecheck` (conteggio errori), `npx vitest run`
(passati, e la lista dei file che falliscono all'import, già noti), `npm run check:docs` (deve
essere 3/3).

Uscita, per ciascun commit: typecheck uguale alla baseline (un rialzo che origina nei file che
stai scrivendo si corregge e si prosegue; un rialzo altrove è stop); vitest con i soli test nuovi
in più e gli stessi file noti falliti all'import; `npm run build` exit 0 dopo il commit 2;
`npm run check:docs` 3/3 dopo ogni entry di log.

Commit 1: `feat(form): groundwork for the Form authoring tab (isEnum, generic sections, segment options)`.
Commit 2: `feat(authoring): Form tab for vertex views (theme, labels, widgets, treatments)`.
`git add` con i path espliciti di ciascun commit. Non pushare.

## HARD STOP (uno, alla fine)

Nota finale con: i due hash; baseline e valori finali di typecheck, vitest, build, `check:docs`;
l'esito del test di Q5 e se la spec è stata toccata; l'elenco dei file toccati per commit contro
l'elenco di DOVE; il prefisso SCSS usato e l'esito del grep; i debiti da registrare (quarta copia
di `CHIP`, titolo dei compartimenti, link cross-tab, `basic`); lo stato del resto del working tree;
ogni deviazione con il motivo.

Checklist visiva per Alfonso, su http://localhost:3000 con hard refresh, da riportare nella nota
così com'è:

1. Rail su una view `vertex`: la barra mostra `Applies to | Structure | Symbol | Form` in Basic e
   `... | Form | Source` in Advanced. Il tab Form in Basic mostra Theme, Labels e la nota.
2. Advanced, view senza compartimenti: sezioni Attributes / References / Children, righe per ogni
   feature della metaclasse, `kind` (enum) con default `Select`, `name` con default `Text`.
3. Advanced, view con un solo compartimento `attributes`: prima la sezione autorata col suo
   titolo, poi References e Children marcate come non reclamate.
4. Override di `entryAction` a Code: pallino ciano, tab Source mostra `form.widgets.entryAction`.
   Ritorno a Default: la chiave sparisce dal Source, e se era l'unica sparisce l'intero `form`.
5. `outgoing` (multivalore): segmento Inline disabilitato, tooltip al passaggio del mouse.
   `Hidden` su una reference: nel rail di un'istanza la feature non compare né in Basic né in
   Advanced; ritorno a List: ricompare.
6. Theme `inspector` nel tab Form: il rail di un'istanza cambia pelle; Labels `Left` con tema non
   compact: compare l'avviso.
7. Modale del simbolo: nessun tab Form (D1), nessun errore in console all'apertura.
8. Di passaggio, sul rail di un'istanza (pendenze E3 e Add-al-limite della 1b): un picker di
   reference non offre i target già assegnati; una lista con `upperBound` finito, riempita fino
   al limite, mostra `Add` disabilitato con tooltip `Maximum <n>`.

Il log si compila dopo la verifica visiva: `Smoke visivo: non eseguito da qui` finché Alfonso
non conferma; l'entry si aggiorna con l'esito in un commit `docs` successivo se lui lo chiede.
