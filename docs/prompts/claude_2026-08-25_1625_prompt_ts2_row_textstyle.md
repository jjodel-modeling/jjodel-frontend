# Prompt Claude Code: TS2, stile tipografico delle righe (sopra la cascata del nodo)

**Data**: 2026-08-25 16:25
**Branch**: `alfonso-frontend-jjtl`, HEAD `6571826a3`
**Tipo**: feat (additivo, nessun bump di `irVersion`, nessuna migrazione)
**Effort**: high
**Critical-zone**: no
**Spec**: `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md`, sez. 3 punti 2 e 3, sez. 8 fase TS2, sez. 11 (cascata del nodo, oggi in `6571826a3`)

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Se qualcosa qui contraddice `CLAUDE.md`, fermati e segnala.

---

## 0. Contesto

Con `97c5a65e0` esiste la radice della cascata: `ShapeSpec.text` è reso inline su `.ir-node-content` e le righe lo ereditano. Manca l'anello sopra, già ratificato dalla spec come **TS2**: uno stile per riga che vince su quello del nodo. Due percorsi di rendering, due agganci, come da sez. 3:

- righe **slot-mode** (compartimenti `attributes` / `references`, rese da `IRNodeContent`): `FieldCompartmentSpec.rowFormat.style?: TextStyle`;
- righe **dispatch** (compartimenti `children`, rese da `IRRow` con la row view del figlio): `RowViewIR.style?: TextStyle`.

Precedenza finale, dal basso: default CSS < `shape.text` (nodo) < `rowFormat.style` (compartimento) < `RowViewIR.style` (row view del figlio). Per la label resta: default < `shape.text` < `LabelSpec.style`.

**Una precisazione rispetto alla spec, da applicare**: `rowFormat.style` viene reso inline sul div `.ir-compartment`, non riga per riga. Per le righe slot-mode il risultato è identico (ereditarietà); per un compartimento `children` la spec dice che `rowFormat` è ignorato, ma renderlo sul contenitore dà al compartimento un livello di cascata che la row view del figlio può ancora sovrascrivere, senza codice in più. Se ti sembra che contraddica sez. 3 al punto da doverlo fermare, hard stop; altrimenti procedi e dichiaralo nel log come scostamento.

Precedente da seguire: commit B (`97c5a65e0`), stesso helper `compileTextStyle`, stesso `resolveTextStyle`.

---

## 1. COSA

```typescript
// irTypes.ts
export interface FieldCompartmentSpec {
    // ...
    /** ir-1.3 TS2: text style of the compartment rows, rendered inline on the
     *  compartment and inherited by its rows; wins over ShapeSpec.text. */
    rowFormat: { segments: FieldSegment[]; style?: TextStyle };
}
export interface RowViewIR {
    // ...
    /** ir-1.3 TS2: text style of the dispatched row, inline on .ir-row; wins over
     *  the host compartment and node styles. */
    style?: TextStyle;
}
export interface CompiledFieldCompartment {
    // ...
    rowStyle?: CompiledTextStyle;
}
export interface CompiledRowView {
    // ...
    style?: CompiledTextStyle;
}
```

Compile: `rowStyle: compileTextStyle(fc.rowFormat.style, deps)` in `compileView`; `style: compileTextStyle(ir.style, deps)` in `compileRowView`. Entrambi con `deps`: i predicati degli assi condizionali entrano nel dependency set del rispettivo compilato (per la row view è il suo `dependencySet`, quello che `useIRRowView` osserva).

Render:
- `IRNodeContent.tsx`, i due `<div className="ir-compartment...">` (ramo `children` e ramo slot-mode): `style={resolveTextStyle(fc.rowStyle, readCtx, objectId)}`.
- `IRRow.tsx`: `style={resolveTextStyle(compiled.style, readCtx, objectId)}` sul `<div className="ir-row">`. `resolveTextStyle` oggi è una funzione locale di `IRNodeContent.tsx`: **esportala** da lì (named export, nessun file nuovo) e importala in `IRRow.tsx`. Non spostarla.

Authoring:
- `FieldCompartmentListEditor.tsx`: per ogni compartimento, dopo "Row segments" e prima di `separator`, un `TextStyleField` con `label="Row style"` legato a `comp.rowFormat.style`, `features`/`featuresHint`/`classNames` già disponibili nelle props. Scrittura: `replace(index, { ...comp, rowFormat: { ...comp.rowFormat, style } })`, con la chiave rimossa quando `style` è `undefined` (stesso criterio di `LabelEntryEditor` e di `shape.text`: niente `"style": undefined` né `{}` nell'IR).
- `RowAuthoringPanel.tsx`, tab Text, nuova `FormSection` "Row style" dopo "Template": `TextStyleField` su `draft.style`, scrittura `patch({ ...draft, style })` con la stessa rimozione della chiave.

Validazione: nessuna regola nuova (`TextStyle` non ha vocabolario chiuso da validare oltre a quanto già fa TS1).

---

## 2. DOVE

| File | Cosa cambia |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | i quattro agganci di §1 |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | `rowStyle` in `compileView`, `style` in `compileRowView` |
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | `export` di `resolveTextStyle`; `style` sui due div `.ir-compartment` |
| `frontend/src/components/editor-v2/viewpoint/ir/IRRow.tsx` | import e `style` sul div `.ir-row` |
| `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx` | `TextStyleField` "Row style" per compartimento |
| `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` | sezione "Row style" nel tab Text |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` | test di §3.2 |
| `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` | sez. 12 "TS2 implementata", §5 |
| `docs/claude-code-log.md` | entry |
| `docs/prompts/claude_2026-08-25_1625_prompt_ts2_row_textstyle.md` | questo file |

**Non toccare**: `irStyle.ts` (nessuna regola CSS nuova: le righe ereditano già), `irValidate.ts`, `irDefaults.ts`, `TextStyleField.tsx`, `TextStyleEditor.tsx`, `irResolve.ts` / `useIRRowView` (la firma che osserva la riga dipende dal `dependencySet` compilato, che si estende da solo), `SymbolBoxPreview.tsx`, `irRowSizing` o qualunque misuratore. Se in Fase 1 uno di questi risulta necessario, hard stop e motiva.

---

## 3. COME

### 3.1 Fase 1: discovery breve, report obbligatorio

Verifica con lettura e grep su `frontend/src`:

- che `rowStyle`, `rowFormat.style`, `RowViewIR.style` non siano già in uso (`grep -rn "rowStyle\|rowFormat\.style\|rowFormat?\.style" frontend/src`), e che nessun costruttore di `CompiledFieldCompartment` o `CompiledRowView` esista fuori da `irCompile.ts` (i campi nuovi sono opzionali, ma va saputo);
- come `useIRRowView` costruisce la firma di ri-render della riga (`irResolve.ts`) e se legge `compiled.dependencySet`: se sì, un asse condizionale di `RowViewIR.style` su una feature del figlio re-renderizza la riga senza altro lavoro; se no, riporta e fermati (fuori perimetro);
- come `computeRowHiddenChildren` / `rowRenderedChildren` (`irContainment.ts`) usano `CompiledFieldCompartment`: i campi nuovi non devono cambiare l'insieme dei figli resi;
- che il `newCompartment()` di `FieldCompartmentListEditor.tsx:76` e il seed di `defaultObjectViewIR` non vadano toccati (nessun `style` di default);
- che `irHash` copra i due nuovi campi (JSON.stringify: sì per costruzione).

**Report** in `docs/discovery/discovery_2026-08-25_ts2_row_textstyle.md` (obiettivo, file letti con path, findings, rischi, domande). Se tutte le verifiche passano, prosegui con la Fase 2 senza hard stop; se una fallisce, hard stop.

### 3.2 Fase 2: un solo commit

Implementa §1 nei file di §2. Test in `ir.test.ts`, accanto ai test della cascata del nodo (`shape.text`):

- `compileView` con `rowFormat.style: { fontSize: 11, fontStyle: 'italic' }` su un compartimento `attributes`: `fieldCompartments[0].rowStyle.fontSize(ctx, id) === 11`, `fontStyle === 'italic'`; senza `style`, `rowStyle === undefined`.
- `compileView` con asse condizionale in `rowFormat.style.color` su `exists $note.value`: `note` nel `dependencySet` della view.
- `compileRowView` con `style: { fontWeight: 'bold' }`: `style.fontWeight(ctx, id) === 'bold'`; senza, `undefined`; con asse condizionale su `$isInitial.value`, `isInitial` nel `dependencySet`.
- Round-trip: un IR con `rowFormat.style` e uno senza producono `irHash` diversi (invalidazione della cache).

Build, typecheck (baseline 33), vitest (baseline 1381 passed, 9 suite rosse in raccolta). Commit per pathspec, subject sotto i 72 caratteri:

```
feat(editor-v2): row text style on compartments and row views (TS2)
```

**HARD STOP** per la verifica visiva.

---

## 4. Verifica visiva (chat via Chrome o Alfonso, porta 3000, hard refresh)

Fixture: «State Machine v1», Class Diagram, view «Class» (ha `shape.text = {fontFamily: mono}` e `padding: large` salvati; righe `attributes`).

- **R1** Symbol editor, tab Structure, compartimento attributi, "Row style": Size 11 e Italic. Le righe vanno a 11px corsivo, l'intestazione resta com'è, il nodo content-hug si restringe.
- **R2** Con `shape.text.fontSize = 16` (tab Text, "Symbol text") e `rowFormat.style.fontSize = 11`: righe a 11 (il compartimento vince sul nodo); rimosso lo stile di riga (Default su ogni asse), righe a 16.
- **R3** Row view di dispatch: un progetto con compartimento `children` (State Machine, se ha una row view; altrimenti crearne una sulla metaclasse figlia). "Row style" della row view: Bold. Le righe dispatch escono in grassetto; uno stile sul compartimento host con Color rosso colora le righe dispatch **salvo** dove la row view dichiara un suo Color.
- **R4** Asse condizionale (Advanced) sul colore di riga con `exists` su una feature: cambia solo dove la feature è valorizzata; modificando lo slot dal pannello la riga segue.
- **R5** File > Save Project, reload: tutto persiste, tab Source senza `undefined` o `{}`.
- **R6** Doppio clic su un valore di riga editabile (progetto con segmenti `value`): l'input tiene il padding piatto (`0 4px`, `d59cb06c9`) e la riga non cambia altezza.

---

## 5. Chiusura (dopo il GO)

Sez. 12 alla spec: «TS2 implementata in <hash>: `rowFormat.style` reso sul `.ir-compartment` (scostamento dichiarato da sez. 3.2: vale anche come livello di cascata per i compartimenti `children`), `RowViewIR.style` reso sul `.ir-row`; precedenza default < nodo < compartimento < row view». Entry di log; commit `docs:` separato. Nessun push.

## 6. Vincoli

Nessun rename, nessun refactoring adiacente, solo i file di §2. `git add` per pathspec; nel working tree ci sono modifiche estranee (`StatusBar.*`, `featureSignature.ts`, `Info.tsx`, `PropertiesWithTreeView.tsx`, il prompt `_2330_`) da lasciare intatte. Commenti in inglese, niente trattini lunghi. Layer Impact Report non richiesto.
