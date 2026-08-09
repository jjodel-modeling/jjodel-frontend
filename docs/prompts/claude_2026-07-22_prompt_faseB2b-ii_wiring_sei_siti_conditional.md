# Prompt Claude Code — Fase B2b-ii: cablaggio ConditionalEditor/PredicateBuilder nei 6 siti + verifica visiva

**Tipo**: feat. **Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. **LIR**: not-required. **Fase visiva — HARD STOP finale prima del commit.**

## Prerequisito consigliato (non bloccante, ma leggilo prima di iniziare la verifica visiva)

Il fix del guard `computeIRSignature` (`irResolveCore.ts:65`, `parts.length > 1 ? ... : ''`) è ancora pendente — prompt già pronto (`claude/2026-07-22_prompt_fix_computeIRSignature_guard.md`), mai eseguito. Con **una sola vista IR nel progetto la firma resta `''` e la live preview non si aggiorna**. Se il progetto di test ha una sola vista IR attiva, la verifica visiva di questo prompt rischia un falso negativo (sembra che il Conditional non si applichi live, mentre è un bug preesistente e noto). Se possibile, applica quel fix prima di iniziare Step 6 sotto; se non è possibile ora, verifica comunque e segnala esplicitamente se la preview non si aggiorna, senza dare per scontato che sia un bug di questo prompt.

## Contesto (non ridiscutere le premesse)

Fase B2b-i (committata: `9db592a15` log, `891648b13` codice) ha consegnato `ConditionalEditor<T>` e `PredicateBuilder` in `components/ui/`, generici, unit-testati, **senza alcun wiring nel pannello**. Interfacce reali (verificate leggendo il codice committato, non il design doc):

```typescript
// components/ui/ConditionalEditor
export interface ConditionalEditorProps<T> {
    value: Conditional<T> | undefined;
    onChange: (next: Conditional<T> | undefined) => void;
    renderValue: (value: T, onChange: (v: T) => void) => React.ReactNode;
    defaultValue: T;
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    classNames: string[];
}
export function ConditionalEditor<T>(props: ConditionalEditorProps<T>): React.ReactElement;
export function isConditionalValue(x: unknown): boolean; // sostituisce le 4 copie locali di isConditional

// components/ui/PredicateBuilder
export interface PredicateBuilderProps {
    value: Predicate; onChange: (next: Predicate) => void;
    features: PathBuilderFeatures | null; featuresHint?: string; classNames: string[];
}
export const PredicateBuilder: React.FC<PredicateBuilderProps>;
```

`ConditionalEditor` gestisce internamente TUTTO il ciclo: discrimina fisso/`{when,then,else}`/`{rules,...}` (quest'ultima resa come chip read-only "conditional (regole multiple, non ancora editabile)", preservata verbatim, non toccarla), mostra il toggle Fisso/Condizionale, monta `PredicateBuilder` per `when`, `renderValue` per `then`, checkbox "Includi ramo else" per `else` opzionale (senza chiave placeholder se assente). **Ai call site non serve più nessun controllo `isConditional` manuale**: si passa il valore grezzo del campo e basta.

Questo prompt fa SOLO il cablaggio nei 6 siti già identificati in B2a come placeholder read-only, più l'attivazione reale del tab Advanced. Nessun nuovo componente da scrivere.

## Decisione che sto prendendo sul tab Advanced (flag esplicito, non richiede ratifica ma puoi respingerla)

Con `ConditionalEditor` che porta il toggle Fisso/Condizionale **inline dentro Basic** (dove ogni campo già vive), non c'è più nulla di significativo da mettere in "Advanced" per questa fetta: tutti e sei i siti si editano in Basic. Non rimuovo il tab shell (sarebbe un cambio UI più grande, da ridiscutere a parte se lo vuoi), ma aggiorno il testo placeholder per non promettere più qualcosa che è già stato consegnato. Nuovo testo Advanced: *"Le regole multiple (rules, più branch when/then in sequenza con default) e altre funzionalità avanzate non ancora supportate arriveranno qui in futuro. I campi condizionali singoli (when/then/else) si editano ora direttamente in Basic, accanto a ciascun campo."*

## COSA

### 1. `VertexAuthoringPanel.tsx`

- Aggiungi un secondo `useMemo` per `classNames: string[]` (nomi di TUTTE le classi di TUTTI i metamodelli del progetto, deduplicati — non solo quelle della metaclasse target come fa `features`). Stessa fonte dati di `features` (`LProject.getProject()?.metamodels`, `getMetaclassInfo((mm as any).id, (mm as any).id)`), proiezione diversa: `info.allClasses.map(c => c.name)` unionati in un `Set`. Deps: `[]` (il set di classi del progetto non cambia durante una sessione di editing del pannello).
- Sostituisci il blocco Shape/`form`: rimuovi `isConditional(form) ? conditionalPlaceholder : <Select.../>`, sostituisci con `<ConditionalEditor value={form} onChange={(next) => patchShape({ form: next })} renderValue={(v, onCh) => <Select options={FORM_OPTIONS} value={v} onChange={(e) => onCh(e.target.value as ShapeForm)} />} defaultValue={'rect'} features={features} featuresHint={FEATURES_HINT} classNames={classNames} />`.
- Sostituisci il blocco Fill: stesso pattern, `renderValue={(v, onCh) => <ColorPicker value={v} onChange={onCh} />}`, `defaultValue={''}` (fallback reale usato dal compilatore per `fill`, verificato in `irCompile.ts`: `compileConditional(ir.shape.fill, '', deps)` — non usare `'#334155'` o altri default "belli", usa lo stesso fallback che userebbe il compilatore se `else` è assente).
- Rimuovi `conditionalPlaceholder` e la funzione locale `isConditional` (diventano dead code: nessun altro call site le usa in questo file dopo la sostituzione — verificalo con una ricerca nel file prima di rimuoverle, non per assunzione).
- Aggiorna il testo del tab Advanced con la copia riportata sopra.
- Passa `classNames` in aggiunta a `features`/`featuresHint` (già passati) a `LabelListEditor`; aggiungi `features`, `featuresHint`, `classNames` alle chiamate di `BadgeListEditor` e `FieldCompartmentListEditor` (oggi non li ricevono affatto).
- Import: aggiungi `ConditionalEditor` da `../../../ui` (barrel, già esportato da B2b-i).

### 2. `LabelListEditor.tsx`

- Aggiungi prop `classNames: string[]` (in aggiunta a `features`/`featuresHint` già presenti), passala a `LabelEntryEditor`.

### 3. `LabelEntryEditor.tsx`

- Aggiungi prop `classNames: string[]`.
- Sostituisci il blocco `visible` (oggi: solo `visibleChip` in sola lettura, **nessun editing nemmeno per il caso booleano fisso** — B2a lo lasciava così deliberatamente) con `<ConditionalEditor value={label.visible} onChange={(next) => onChange({ ...label, visible: next })} renderValue={(v, onCh) => <Checkbox checked={v} onChange={onCh} label="visibile" />} defaultValue={true} features={features} featuresHint={featuresHint} classNames={classNames} />`.
- Rimuovi `isConditional` e `describeVisible` locali (dead code dopo la sostituzione — verifica nel file, non per assunzione; `describeVisible` era usata solo per `visibleChip`).
- **Non toccare** il blocco `editable` (widget booleano vs `{widget}`) — non è un `Conditional<T>`, resta fuori scope, la costante CHIP resta perché ancora usata lì.

### 4. `BadgeListEditor.tsx`

- Aggiungi prop `features: PathBuilderFeatures | null`, `featuresHint?: string`, `classNames: string[]` all'interfaccia e alla firma del componente.
- Sostituisci il blocco `icon` (oggi CHIP read-only se Conditional, altrimenti `Input`+`HelpText`) con `<ConditionalEditor value={badge.icon} onChange={(next) => replace(index, { ...badge, icon: next })} renderValue={(v, onCh) => <><Input value={v} onChange={(e) => onCh(e.target.value)} /><HelpText>Bootstrap Icons class, e.g. bi-star-fill</HelpText></>} defaultValue={''} features={features} featuresHint={featuresHint} classNames={classNames} />` (`defaultValue` = fallback reale del compilatore per `icon`, `compileConditional(b.icon, '', deps)`).
- Sostituisci il blocco `visible` (oggi CHIP-only, **nessun editing anche fisso**) con `<ConditionalEditor value={badge.visible} onChange={(next) => replace(index, { ...badge, visible: next })} renderValue={(v, onCh) => <Checkbox checked={v} onChange={onCh} label="visibile" />} defaultValue={true} features={features} featuresHint={featuresHint} classNames={classNames} />`.
- Rimuovi `isConditional`, `describeVisible`, la costante `CHIP` (tutte dead code dopo la sostituzione in questo file — verifica, non assumere: in questo file CHIP era usata solo per `icon` e `visible`).

### 5. `FieldCompartmentListEditor.tsx`

- Aggiungi prop `features: PathBuilderFeatures | null`, `featuresHint?: string`, `classNames: string[]` all'interfaccia e alla firma del componente. **Non propagarle a `FieldSegmentEditor`** (il suo `editable` non è un `Conditional<T>`, resta fuori scope).
- Sostituisci il blocco `visible` del compartimento (oggi CHIP-only) con `<ConditionalEditor value={comp.visible} onChange={(next) => replace(index, { ...comp, visible: next })} renderValue={(v, onCh) => <Checkbox checked={v} onChange={onCh} label="visibile" />} defaultValue={true} features={features} featuresHint={featuresHint} classNames={classNames} />`.
- Rimuovi `isConditional`, `describeVisible`, la costante `CHIP` (dead code dopo la sostituzione — verifica nel file).

### 6. Verifica visiva (HARD STOP prima del commit)

Testbed: viewpoint "IR Test Bed", vista "IR State" (`Pointer_TB_View_State`) — ha già due badge con `visible` Conditional `{when,then,else}` su `isInitial`/`isFinal`: è il fixture pronto per (4) sotto senza doverne creare uno nuovo.

1. **shape.form**: passa a Condizionale, costruisci un predicate (es. confronto `eq` su un attributo, o `isKind`), imposta `then`/`else` a due forme diverse, verifica che il nodo cambi forma dal vivo in canvas al variare del predicate.
2. **shape.fill**: stesso giro con `ColorPicker` in `then`/`else`.
3. **label.visible**: rendi Condizionale la visibilità di una label con un predicate, verifica show/hide dal vivo.
4. **badge.visible / badge.icon sui fixture esistenti**: apri i due badge già Conditional del test bed. Devono apparire subito in modalità Condizionale con il predicate esistente popolato correttamente e "Includi ramo else" spuntato (hanno già un `else`). **Round-trip**: se non li tocchi e risalvi, l'oggetto deve restare byte-identico (stesso criterio di accettazione 4 di B2a). Poi editane uno (es. cambia `then`) e verifica che il badge cambi dal vivo.
5. **fieldCompartment.visible**: rendi Condizionale la visibilità di un compartimento, verifica show/hide dal vivo.
6. **Composizione predicate**: su almeno uno dei sei siti, costruisci un predicate composto (`AND`/`OR` con 2+ condizioni, oppure `NOT` che wrappa un gruppo) e verifica che valuti correttamente dal vivo.
7. **Nessuna regressione sui campi non-Conditional**: le modifiche già esistenti (shape form/fill fissi, label list, fieldCompartments, badge non toccati da questo prompt) continuano a funzionare come in B2a/B2b.
8. **Tab Advanced**: mostra il nuovo testo, nessun controllo funzionante, nessun errore console.
9. **Reload**: riapri il progetto, tutto l'IR autorato in questa fase persiste e rende identico.

Se la preview non si aggiorna dal vivo su NESSUNO dei sei siti mentre tutto il resto (validazione, nessun errore console, commit del draft) sembra corretto: verifica prima se è il bug noto di `computeIRSignature` con una sola vista IR attiva (vedi Prerequisito sopra) prima di ipotizzare un bug nel cablaggio.

## COME (vincoli)

- Nessun nuovo componente, nessuna nuova dipendenza. Solo wiring dei 4 file elencati.
- Rimuovi il codice reso morto dalla sostituzione (isConditional/describeVisible/CHIP/conditionalPlaceholder locali) **solo dove verifichi che non ha altri call site nel file** — non per assunzione.
- Non toccare `FieldSegmentEditor.tsx`, `TextSourceEditor.tsx`, `ConditionalEditor.tsx`, `PredicateBuilder.tsx`, `predicateDefaults.ts`, `conditional.ts`, `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irDefaults.ts`.
- `defaultValue` di ogni `ConditionalEditor` deve combaciare col fallback reale usato da `compileConditional` in `irCompile.ts` per quel campo (verificalo lì, non indovinarlo): `'rect'` per `form`, `''` per `fill` e `icon`, `true` per ogni `visible`.
- Nessuna modifica al ciclo edit/validate/commit (draft locale, `validateIR` eager, commit debounced, write immutabile `view.ir = draft`) — i nuovi `ConditionalEditor` producono solo patch immutabili del draft come i controlli esistenti.
- Round-trip: un `Conditional` in forma `rules` letto e non toccato resta byte-identico (gestito internamente da `ConditionalEditor`, verifica solo che nessun call site lo forzi in `when/then/else`).
- Gate: `npm run typecheck` (baseline fresca — chiediamo il numero attuale, non assumere 33 senza riverificare dato che nel frattempo sono entrati altri commit), `npm test`/vitest (suite esistente invariata), `npm run build` verde. Poi HARD STOP visivo (punto 6 sopra) prima di qualunque commit.
- Commit unico dopo l'OK visivo di Alfonso: `git add` solo i 5 file della tabella DOVE sotto (i 4 componenti wired + `LabelListEditor.tsx`) + `docs/claude-code-log.md` (nuova entry, stesso commit — nessun debito da lasciare indietro questa volta). Messaggio: `feat: authoring IR — wire ConditionalEditor/PredicateBuilder into all 6 sites (phase B2b-ii)`.
- NIENTE push.

## DOVE

| File | Modifica |
|------|----------|
| `editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | `classNames` useMemo, shape.form/fill → ConditionalEditor, copy Advanced, props a valle |
| `editor-v2/viewpoint/authoring/LabelListEditor.tsx` | prop `classNames`, passthrough |
| `editor-v2/viewpoint/authoring/LabelEntryEditor.tsx` | prop `classNames`, `visible` → ConditionalEditor, rimozione dead code |
| `editor-v2/viewpoint/authoring/BadgeListEditor.tsx` | props `features`/`featuresHint`/`classNames`, `icon`+`visible` → ConditionalEditor, rimozione dead code |
| `editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` | props `features`/`featuresHint`/`classNames`, `visible` → ConditionalEditor, rimozione dead code |
| `docs/claude-code-log.md` | entry di commit (stesso commit del codice, questa volta — nessun debito da lasciare indietro) |

## RIFERIMENTI

- `claude/2026-07-22_prompt_faseB2b-i_conditional_predicate_enabling_layer.md` (schema, semantica compilatore)
- `claude/ratifiche_2026-07-22_authoring_B2b_conditional_predicate.md` (decisioni a/b/c ratificate)
- Codice B2b-i reale: `components/ui/ConditionalEditor/`, `components/ui/PredicateBuilder/` (leggili per intero prima di cablare — le interfacce sopra sono già verificate ma i dettagli di stile/CSS classes possono servire per l'integrazione visiva)
- `irCompile.ts` per i fallback esatti di `compileConditional` per campo
