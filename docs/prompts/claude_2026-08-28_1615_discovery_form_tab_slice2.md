# Prompt Claude Code: discovery per la Slice 2, tab Form nell'authoring (Fase 1, read-only)

Data: 2026-08-28 16:15. Branch `alfonso-frontend-jjtl`. Repo `~/jjodel`, root del repo come cwd.
Effort: high. Fase 1 di un two-phase: **nessuna modifica al codice**. L'unico output è il discovery
report, più la sua entry di log.

Leggi `CLAUDE.md` per intero, `docs/PROTOCOL.md` (P4 sui discovery report, P9 sul log) e le ultime
cinque entry di `docs/claude-code-log.md`. Leggi per intero
`docs/spec/claude_spec_2026-08-28_ir_formspec_addendum.md` (§2, §5, §6, §7, §13, §14 sono la base
normativa della slice) e `docs/design/design_handoff_jjodel_form_views/README.md`, sezione
«Authoring panel (6a/6b)».

## COSA

Raccogliere i fatti di codice necessari a scrivere il prompt di Fase 2, che aggiungerà un tab
`Form` (id `ir-form`) alla barra dell'authoring per il solo kind `vertex`, con questa superficie
decisa in chat il 2026-08-28:

- `theme`: Select con «Host default» più i quattro temi; chiave rimossa sul default. Basic.
- `labelPlacement`: segmented Above / Left; chiave rimossa su Above. Basic.
- `widgets`: una riga per attributo della metaclasse target, Select con «Default (<derivato>)» più
  le sole alternative che `overrideIsCompatible` accetta; chiave rimossa su Default; override
  incompatibile già persistito reso come chip «ignored» con `Clear`, mai riscritto in silenzio.
  Advanced.
- `features`: una riga per reference e containment, segmented Inline / List / Hidden; `Inline`
  disabilitato con tooltip sulle multivalore; chiave rimossa sul valore derivato dalla molteplicità.
  Advanced.
- `basic`: fuori da questa slice (Slice 2b). Preservato verbatim.
- Le righe sono raggruppate per sezione nell'ordine in cui la form renderà, calcolato con
  `buildFormSections` (R-FRM-1): i gruppi non reclamati da nessun compartimento portano un
  marcatore e un link al tab Structure.
- Tutto scrive `draft.form` nel ciclo draft / validate / commit debounced di
  `VertexAuthoringPanel`.

Il report deve permettere di scrivere la Fase 2 senza riaprire questi file. Ogni finding cita il
path e le righe.

## DOVE (sola lettura)

- `frontend/src/components/editor-v2/viewpoint/authoring/irTabs.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/SymbolEditorModal.tsx`
- `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`
- `frontend/src/components/editors/views/ViewData.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/useFormWidgets.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/formSections.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts`
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts`
- `frontend/src/components/ui/` (indice e i componenti che le domande nominano)
- i test in `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/` e in
  `frontend/src/components/editor-v2/viewpoint/ir/__tests__/`

Non aprire altro se non per seguire un import necessario a rispondere a una domanda; se lo fai,
il report lo dichiara.

## DOMANDE (una sezione del report per ciascuna, numerate così)

**D1. Consumatori della barra.** Chi legge `irTabsForKind` e `IRTabId`: `ViewData.tsx` (dove
costruisce la barra, come sceglie il tab attivo iniziale, cosa fa se il tab attivo non è più
nell'elenco), `SymbolEditorModal.tsx` (quali corpi re-hosta, come tratta i tab che non conosce,
se un nuovo id nell'unione `IRTabId` rompe un `Record<IRTabId, ...>` esaustivo o uno switch).
Elenca ogni punto che deve cambiare per aggiungere `ir-form` al solo `vertex`, e ogni punto che
NON deve cambiare ma potrebbe catturare il tab per errore.

**D2. Navigazione fra tab dal corpo.** `activeTab` arriva a `VertexAuthoringPanel` come prop da
`ViewData`. Esiste già un modo, per un corpo, di chiedere al host di passare a un altro tab
(callback, custom DOM event, Redux)? Serve per il link «Edit compartments» verso Structure. Se non
esiste, indica il pattern del codebase per casi analoghi (CLAUDE.md sui custom DOM events) e il
punto di `ViewData` dove un listener andrebbe.

**D3. Ciclo di commit del draft.** In `VertexAuthoringPanel`: firma di `patch`, come si rimuove
una chiave opzionale dal draft (idioma rest/spread, cfr. `withChildFilter` e la rimozione del
predicate), dove `validateIR` viene invocato e cosa fa `irValidate.ts` con `form` (passthrough?
la scansione delle chiavi `op`? cosa succede a un `form: {}` vuoto). Conferma che `draft.form`
round-trippa verbatim quando il tab non lo tocca.

**D4. Feature della metaclasse target.** Il memo `featureInfo` (righe ~248-302): cosa restituisce,
da quale `MetaclassInfo` legge. Per il Form tab servono per ogni attributo `name`, `type`,
`lowerBound`, `upperBound` e **se il tipo è un enum**; per ogni reference `name`, `containment`,
`upperBound`. `MetaclassAttribute` in `useEditorMode.ts` non ha un flag enum: trova l'idioma
corretto per riconoscerlo sul tipo dell'attributo L-proxy in `getMetaclassInfo` (`attr.type`):
`className === 'DEnumerator'`? l'accessor `isEnum` di `LModelElement.tsx:1690`? Verifica quale
dei due è disponibile su quel proxy e cita la riga. Indica dove aggiungere un `isEnum?: boolean`
opzionale (interfaccia e i due punti di popolamento, `attributes` e `allAttributes`).

**D5. Riuso di `useFormWidgets.ts`.** `overrideIsCompatible` è `function` non esportata:
conferma che esportarla è un cambiamento additivo senza altri effetti. `widgetForPrimitive` è
già esportata. Verifica che il modulo sia importabile in ambiente node (il test
`useFormWidgets.test.ts` lo carica?) e che non tiri il barrel del framework: il Form tab deve
poter calcolare il widget derivato da un nome di tipo senza uno slot.

**D6. Adattatore per `buildFormSections`.** Elenca esattamente i campi che la funzione legge da
`CompiledFieldCompartment` (`id`, `source`, `title`?) e da `FormFieldDescriptor` (`name`,
`isReference`, `isComposition`?). Conferma che allargare la firma a `Pick<>` di quei campi è
compatibile con i chiamanti attuali (`IRForm.tsx`, test). Verifica che `FieldCompartmentSpec`
abbia `title` (irTypes.ts:147) e come `irCompile.ts` lo passa al compilato, così l'authoring può
costruire il compartimento «compilato» minimale con lo stesso titolo che la form userà.

**D7. Primitive UI disponibili.** In `frontend/src/components/ui/`: esiste un segmented control
(quello di Basic/Advanced, o `Toggle`)? `Select` supporta un'opzione disabilitata con tooltip?
`InfoTooltip`, `HelpText`, `ListEditor`, `FormSection`: firme. Esiste già un pattern di riga
tabellare «nome in mono + controllo a destra» (cfr. `FieldSegmentEditor`, `LabelListEditor`)?
Esiste già uno stile per il chip read-only «preserved verbatim» usato per i `source` sconosciuti
in `FieldCompartmentListEditor` (nome della classe, dove sta lo SCSS)? Il pallino ciano
«overridden default»: c'è un token o una classe già usata per un marcatore analogo (dirty dot
della form in `IRForm`)? Cita classi e token, senza proporne di nuovi.

**D8. Gating Advanced dentro un tab.** Come i tab attuali nascondono una sezione in Basic
(`allowConditional={advanced}`, o rendering condizionale). Qual è il pattern da seguire per
«Widgets» e «References and children» visibili solo in Advanced, con la nota informativa in Basic
(mockup 6a).

**D9. Test esistenti da estendere.** Cosa coprono `edgeAuthoring.test.ts` e
`rowAuthoring.test.ts` (helper puri? render?), se esiste un test su `irTabsForKind`, e come sono
testati gli helper puri di `FieldCompartmentListEditor` (esportati e testati in node). Indica il
file in cui i test della Fase 2 andranno (helper puri del Form tab: mappa etichette dei widget,
calcolo del derivato da tipo, rimozione chiave sul default, adattatore delle sezioni).

**D10. Rischi.** Ogni punto in cui la Fase 2 potrebbe toccare per sbaglio: `PathBuilderFeatures`
(tipo condiviso, non va esteso), il commit whole-object che riscrive `form` insieme al resto,
il flush all'unmount D15, il modal del simbolo, l'ordine delle chiavi nella ir persistita
(un `form` aggiunto in coda al draft cambia il `Source`?).

## REPORT

Obbligatorio, in `docs/discovery/discovery_2026-08-28_form_tab_authoring_slice2.md`. Struttura:
obiettivo; file letti con path completi; una sezione per domanda D1..D10 con findings e righe
citate; dipendenze e rischi; domande aperte per Alfonso (solo quelle che il codice non decide).
Stile: frasi brevi, niente em dash nel testo che scrivi, inglese o italiano a tua scelta ma
coerente nel file.

## GATE

Ingresso: `git status --porcelain -- docs/discovery/ docs/claude-code-log.md` vuoto (il resto del
tree si dichiara nella nota finale, non blocca). Uscita: `git diff --stat` mostra il solo report e
il log; nessun file sotto `frontend/src` modificato. Il typecheck non si lancia: non c'è codice.

## LOG E COMMIT

Entry in **testa** a `docs/claude-code-log.md` (subito sotto la riga di regola, newest-first per
giorno), path dalla root del repo, formato di `CLAUDE.md` §21.2, tipo `docs`, `Corregge —`,
`Causa —`, `Smoke visivo: non applicabile`, Notes entro 500 caratteri, `Prompt document name:
2026-08-28 16:15`.

```
git add docs/discovery/discovery_2026-08-28_form_tab_authoring_slice2.md docs/claude-code-log.md
git commit -m "docs: discovery for the Form authoring tab (slice 2, phase 1)"
```

Mai `git add .`. Non pushare.

## HARD STOP

Uno, a fine task: nota finale con hash del commit, path del report, le domande aperte per Alfonso
riportate per intero, stato del resto del working tree, deviazioni con motivo. La Fase 2 parte
dal report salvato, non da questa sessione.
