# Prompt Claude Code: view designer (symbol), font di default, cascata tipografica del nodo, padding a tre livelli

**Data**: 2026-08-25 13:20
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: feat (additivo, nessun bump di `irVersion`, nessuna migrazione)
**Effort**: high
**Critical-zone**: no (nessun file di §3.1 di CLAUDE.md; nessuna scrittura D/L nuova)

Leggi `CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare. Se qualcosa qui contraddice `CLAUDE.md`, fermati e segnala il conflitto.

---

## 0. Contesto e diagnosi (fatta in chat, da confermare in Fase 1)

Quattro lacune del view designer per i simboli (vertex view), tutte nel renderer IR e nel suo authoring:

1. **Il testo dei simboli è piccolo.** `irStyle.ts` BASE_CSS fissa `font-size: 11px` su `.ir-label`, su `.ir-compartment .ir-row` e sugli input inline (`.ir-label__input`, `.ir-row__input`). Non esiste un token: il valore è ripetuto in quattro regole.
2. **L'intestazione non ha padding, i compartimenti sì.** `.ir-label--top` e `.ir-label--bottom` non hanno padding; `.ir-label--inside` ha `0 8px`; `.ir-compartment` ha `4px 8px`. È il motivo per cui il padding "sembra applicarsi solo ai compartimenti": l'intestazione è attaccata al bordo.
3. **Il padding non è autorabile.** Nessun asse IR, nessun controllo nel pannello.
4. **Non esiste uno stile tipografico del nodo.** `TextStyle` (spec ir-1.3, TS1) è agganciato solo a `LabelSpec.style`: si può stilizzare l'intestazione (la label a indice 0) ma non c'è un punto da cui il font si propaga a tutti i testi del simbolo. La cascata CSS non aiuta perché le regole base fissano `font-size: 11px` in assoluto, bloccando l'ereditarietà.

Il punto 4 NON sostituisce TS2 della spec (stile per riga su `rowFormat.style` e `RowViewIR.style`): aggiunge la radice della cascata, sopra. Ordine di precedenza una volta fatto tutto: default CSS < stile del nodo (`shape.text`) < stile della singola label (`LabelSpec.style`, già esistente) e, quando TS2 arriverà, stile della riga.

Precedente da seguire per tutto: l'asse `marker` (2026-08-15), additivo su `ShapeSpec`, senza bump di versione né VersionFixer.

---

## 1. COSA

Due assi nuovi su `ShapeSpec` (quindi disponibili sia a `VertexViewIR` che a `GraphVertexViewIR`), più il rifacimento delle regole base in token:

```typescript
// irTypes.ts
/** Spacing preset of the symbol (header, compartments, inside label). Absent = 'normal'. */
export type PaddingToken = 'small' | 'normal' | 'large';

export interface ShapeSpec {
    // ...esistenti...
    /**
     * Spacing preset applied to every padded surface of the symbol (top/bottom
     * label, inside label, compartments). Scalar like `border`, never Conditional.
     * Absent = 'normal'. Additive optional field: no irVersion bump, no migration
     * (same precedent as `marker`).
     */
    padding?: PaddingToken;
    /**
     * Typographic style of the whole symbol (ir-1.3, node-level cascade root).
     * Applied inline on `.ir-node-content` and inherited by every text surface
     * (labels, compartment rows, inline editors). A label's own `style` wins over
     * it (inline on the span). Absent = CSS defaults of irStyle.ts. Additive.
     */
    text?: TextStyle;
}
```

Compiled:

```typescript
export interface CompiledView {
    // ...esistenti...
    /** shape.padding ?? 'normal' */
    padding: PaddingToken;
    /** Compiled node-level text style; undefined when the view declares none. */
    text?: CompiledTextStyle;
}
```

Rendering (`IRNodeContent.tsx`):
- classe `ir-pad--small` / `ir-pad--large` su `.ir-node-content` (per `normal` nessuna classe);
- `resolveTextStyle(compiled.text, readCtx, objectId)` fuso nell'`inlineStyle` del div radice (insieme a background e border già emessi). La funzione esiste già nel file, si riusa così com'è.

CSS (`irStyle.ts` BASE_CSS): token `--ir-pad-x`, `--ir-pad-y` sul nodo, `font-size` di default portato a **13px** sul nodo e `inherit` sulle superfici di testo, padding dell'intestazione allineato a quello dei compartimenti. Dettaglio in §3.

Authoring (`VertexAuthoringPanel.tsx`):
- tab **Appearance**, nuova `FormSection` "Padding" con una `Select` a tre voci, **visibile solo in Advanced** (`advanced` è già letto dal panel via `useSelector`); "Normal" rimuove la chiave dall'IR, come "None" fa per il marker;
- tab **Text**, nuova `FormSection` "Symbol text" sopra "Labels", con un `TextStyleField` (già esistente, riusato tal quale) legato a `shape.text`, visibile anche in Basic: è la via principale per ingrandire il testo senza passare dalle singole label. Un `HelpText` di una riga: "Applies to every text of the symbol. A label's own style overrides it."

Validazione (`irValidate.ts`): `shape.padding`, se presente, deve appartenere a `PaddingToken`, con lo stesso pattern e lo stesso tono di errore di `edge.routing` (`VALID_ROUTING_VALUES`).

---

## 2. DOVE

File da toccare, e solo questi (più `docs/`):

| File | Cosa cambia |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | `PaddingToken`, `ShapeSpec.padding`, `ShapeSpec.text`, `CompiledView.padding`, `CompiledView.text` |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | in `compileView`: `padding: ir.shape.padding ?? 'normal'`, `text: compileTextStyle(ir.shape.text, deps)` (helper già presente, riga ~272) |
| `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` | `VALID_PADDING_VALUES` e la regola su `shape.padding` per i kind `vertex` e `graphVertex` |
| `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts` | BASE_CSS: token, default 13px, `inherit`, padding dell'intestazione, classi `ir-pad--*` (§3) |
| `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` | classe `ir-pad--*` sul div radice; `resolveTextStyle(compiled.text, ...)` fuso in `inlineStyle` |
| `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | sezione "Padding" (Advanced) in Appearance; sezione "Symbol text" in Text |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/ir.test.ts` | compile dei due assi |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irValidate.test.ts` | rifiuto di un `padding` fuori vocabolario, accettazione dell'assenza |
| `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md` | nuova sezione finale "§11 Addendum 2026-08-25: radice della cascata e padding" (§6 di questo prompt) |
| `docs/claude-code-log.md` | entry a fine task |
| `docs/prompts/claude_2026-08-25_1320_prompt_symbol_text_cascade_padding.md` | questo file, da committare col task |

**Non toccare**: `SymbolBoxPreview.tsx`, `SymbolPreview.tsx`, `SymbolCatalogPicker.tsx`, `notationCatalog.ts`, `symbolRecognition.ts` (il riconoscimento del preset legge form/fill/border/marker e deve ignorare i due assi nuovi: verificalo in Fase 1, ma non modificarlo), `IRRow.tsx`, `irDefaults.ts` (il default view non dichiara né padding né text: eredita i default CSS), `nodeSizing.ts`, `useContentSize.ts`, `LabelEntryEditor.tsx`, `TextStyleField.tsx`, `TextStyleEditor.tsx`, `EditorV2.scss`, `SymbolEditorModal.*`. Se in Fase 1 scopri che uno di questi va toccato per forza, hard stop e motiva.

---

## 3. COME

### 3.1 Fase 1: discovery breve (read-only, con report obbligatorio)

Verifica, leggendo i file e con grep globale su `frontend/src`:

- che `ir-pad--`, `PaddingToken`, `VALID_PADDING_VALUES` e una proprietà `text` su `shape` non siano già in uso da nessuna parte (`grep -rn "ir-pad\|PaddingToken\|shape\.text\b\|shape?.text" frontend/src`);
- l'elenco completo delle regole di BASE_CSS che fissano `font-size` in px dentro `.ir-node-content` (attese: `.ir-label`, `.ir-compartment .ir-row`, `.ir-label__input, .ir-row__input`; restano in px `.ir-badge` 12px, `.ir-collapse-chip` 10px, `.ir-hull__*` 11px);
- come `useContentDrivenSize` (`useContentSize.ts`) misura il contenuto: se misura il DOM (ResizeObserver o `getBoundingClientRect`), un font più grande fa crescere il nodo senza altro lavoro; se usa una costante di font, fermati e riporta (la spec ir-1.3 §4 lo prevede come punto da correggere, ma è fuori da questo prompt);
- che `recognizeSymbol` e `notationCatalog` non enumerino le chiavi di `ShapeSpec` in modo da rompersi con due chiavi in più;
- che `irHash` (JSON.stringify dell'IR) e la cache di compile invalidino correttamente al cambio dei due assi (dovrebbero, per costruzione);
- come `LabelEntryEditor` scrive `style: undefined` quando `TextStyleField` collassa lo stile (riga ~107): replica lo stesso comportamento per `shape.text`, oppure rimuovi la chiave; in entrambi i casi l'IR salvato non deve contenere `"text": undefined` né `{}`.

**Salva il report** in `docs/discovery/discovery_2026-08-25_symbol_text_cascade_padding.md` (obiettivo, file letti con path completi, findings, rischi, domande aperte). La Fase 1 non è completa finché il report non è su disco. Se non emergono sorprese (tutte le verifiche sopra confermate), **prosegui direttamente con la Fase 2 senza hard stop**; se una verifica fallisce, hard stop e attendi.

### 3.2 Fase 2, commit A: token, default 13px, padding (punti 1, 2/5, 4)

**`irStyle.ts`**, BASE_CSS. Modifica solo le regole elencate, lasciando intatti i commenti e le altre regole:

```css
/* Tipografia e spaziatura del simbolo, in token (2026-08-25). font-size sul nodo
   ed `inherit` sulle superfici: la radice della cascata è .ir-node-content, dove
   IRNodeContent emette inline lo stile di shape.text; il default cresce da 11 a
   13px. --ir-pad-* alimenta intestazione, label inside e compartimenti con gli
   stessi valori, che prima l'intestazione non aveva. */
.ir-node-content { position: relative; display: flex; flex-direction: column; min-width: 0; width: 100%; height: 100%; font-size: 13px; --ir-pad-x: 8px; --ir-pad-y: 4px; }
.ir-node-content.ir-pad--small { --ir-pad-x: 4px; --ir-pad-y: 2px; }
.ir-node-content.ir-pad--large { --ir-pad-x: 16px; --ir-pad-y: 8px; }
.ir-node-content .ir-label { font-size: inherit; line-height: 1.3; box-sizing: border-box; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.ir-node-content .ir-label--top { order: 0; text-align: center; font-weight: 600; padding: var(--ir-pad-y) var(--ir-pad-x); }
.ir-node-content .ir-label--center { order: 1; text-align: center; margin: auto 0; font-weight: 600; padding: 0 var(--ir-pad-x); }
.ir-node-content .ir-label--inside { order: 2; text-align: left; padding: 0 var(--ir-pad-x); }
.ir-node-content .ir-label--bottom { order: 4; text-align: center; margin-top: auto; padding: var(--ir-pad-y) var(--ir-pad-x); }
.ir-node-content .ir-compartment { order: 3; border-top: 1px solid rgba(51,65,85,0.15); padding: var(--ir-pad-y) var(--ir-pad-x); }
.ir-node-content .ir-compartment .ir-row { font-size: inherit; line-height: 1.4; display: flex; gap: 4px; min-width: 0; }
.ir-node-content .ir-label__input, .ir-node-content .ir-row__input { font-size: inherit; border: 1px solid #334155; border-radius: 3px; padding: 0 4px; min-width: 40px; width: 90%; outline: none; }
```

Note vincolanti:
- `box-sizing: border-box` su `.ir-label` è necessario: con `max-width: 100%` e un padding orizzontale, in content-box la label sforerebbe il box e l'ellissi (misurata a suo tempo sul rombo, vedi il commento già presente in BASE_CSS) tornerebbe a non scattare.
- Le regole `.ir-badge`, `.ir-collapse-chip`, `.ir-hull__*` restano in px: non sono testo del simbolo.
- Non toccare le regole di forma (`ir-shape--*`), né i neutralizzatori `.mm-node:has(...)`.
- I valori dei tre preset sono sulla griglia 8px (2/4, 4/8, 8/16). Sono costanti da tarare a schermo: se Alfonso chiede altri valori, cambiano solo queste due righe.

**`irTypes.ts`**: `PaddingToken`, `ShapeSpec.padding`, `CompiledView.padding` come in §1 (lo `text` arriva nel commit B).

**`irCompile.ts`**, `compileView`: `padding: ir.shape.padding ?? 'normal'` nell'oggetto restituito, accanto a `marker`.

**`irValidate.ts`**: `const VALID_PADDING_VALUES = ['small', 'normal', 'large'] as const;` e, per `ir.kind === 'vertex' || ir.kind === 'graphVertex'`, la stessa lettura `unknown` e lo stesso messaggio di `routing`: `[ir] shape.padding must be one of small | normal | large, or absent for the normal default, read ...`. Attenzione: il messaggio esistente di `routing` contiene un trattino lungo; nel nuovo messaggio usa la virgola, non il trattino lungo.

**`IRNodeContent.tsx`**: 

```tsx
const padClass = compiled.padding === 'normal' ? '' : ` ir-pad--${compiled.padding}`;
// ...
className={`ir-node-content ir-shape--${form}${padClass}`}
```

**`VertexAuthoringPanel.tsx`**, tab Appearance, dopo la `FormSection` "Border" e prima di "Marker":

```tsx
const PADDING_OPTIONS = [
    { value: 'small', label: 'Small' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
];
// ...
{/* Padding (Advanced only): spacing preset for header, inside label and
    compartments. Normal removes the key from the IR, like None for the marker. */}
{advanced && (
    <FormSection title="Padding" divider={false}>
        <div className="jj-field">
            <Select
                options={PADDING_OPTIONS}
                value={shape.padding ?? 'normal'}
                onChange={(e) => {
                    const v = e.target.value as PaddingToken;
                    patchShape({ padding: v === 'normal' ? undefined : v });
                }}
            />
        </div>
    </FormSection>
)}
```

Verifica che `patchShape({ padding: undefined })` non lasci `"padding": undefined` nell'IR persistito: `clone` è JSON, quindi la chiave sparisce al prossimo seed, ma il commit `view.ir = draft` scrive il draft vivo. Se il marker segue la stessa strada (`marker: undefined`, riga ~482) il comportamento è già accettato; altrimenti rimuovi la chiave esplicitamente.

**Test** (`ir.test.ts`): un IR senza `padding` compila con `padding === 'normal'`; con `padding: 'large'` compila `'large'`. (`irValidate.test.ts`): `padding: 'huge'` è rifiutato con `ok: false`; `padding` assente è accettato.

**Build, typecheck, vitest** (baseline nel log: typecheck 33 preesistenti, 9 suite rosse preesistenti). Commit A per pathspec:

```
feat(editor-v2): symbol text 13px by default, padded header, padding preset on the view
```

**HARD STOP** per la verifica visiva di Alfonso (§4, prove A1-A5). Riprendi solo al suo GO.

### 3.3 Fase 2, commit B: cascata tipografica del nodo (punto 3)

**`irTypes.ts`**: `ShapeSpec.text?: TextStyle` e `CompiledView.text?: CompiledTextStyle` con i commenti di §1.

**`irCompile.ts`**, `compileView`: `text: compileTextStyle(ir.shape.text, deps)`. `compileTextStyle` restituisce già `undefined` per input assente ed estende `deps` con i predicati degli assi condizionali: niente altro da fare per il dependency set.

**`IRNodeContent.tsx`**: dopo il blocco che costruisce `inlineStyle` (background, border), aggiungi:

```tsx
// Node-level text style (ir-1.3 cascade root): inline on the root so every
// text surface inherits it (irStyle.ts uses `inherit` on labels, rows and
// inline editors). A label's own style, inline on its span, still wins.
Object.assign(inlineStyle, resolveTextStyle(compiled.text, readCtx, objectId));
```

`resolveTextStyle` ritorna `undefined` quando non c'è niente da emettere: `Object.assign` con `undefined` è un no-op, non serve guardia. Attenzione a `fontWeight`: sull'intestazione non si propaga perché `.ir-label--top/center` hanno `font-weight: 600` in regola di classe, che batte l'ereditarietà; è voluto (l'intestazione mantiene il suo peso, si cambia dalla sua label). Sulle righe dei compartimenti si propaga. Scrivilo nel commento.

**`VertexAuthoringPanel.tsx`**, tab Text, nuova `FormSection` "Symbol text" tra "General" e "Labels":

```tsx
<FormSection title="Symbol text" divider={false}>
    <TextStyleField
        value={shape.text}
        onChange={(next) => patchShape({ text: next })}
        features={features}
        featuresHint={FEATURES_HINT}
        classNames={classNames}
    />
    <HelpText icon={false}>Applies to every text of the symbol. A label's own style overrides it.</HelpText>
</FormSection>
```

Import `TextStyleField` da `./TextStyleField` e `PaddingToken` da `../ir/irTypes` (quest'ultimo già dal commit A). Per `text: undefined` vale la stessa verifica sulla chiave fatta per `padding`.

**Test** (`ir.test.ts`): un IR con `shape.text: { fontSize: 16, fontFamily: 'mono' }` compila `text.fontSize(ctx, id) === 16` e `text.fontFamily(ctx, id) === 'mono'`; un IR senza `text` compila `text === undefined`; un asse condizionale su un path (`{ when: { op: 'exists', path: '$note.value' }, then: 18 }`) porta `note` nel `dependencySet`.

**Build, typecheck, vitest.** Commit B per pathspec:

```
feat(editor-v2): node-level text style on the symbol, inherited by labels and rows
```

**HARD STOP** per la verifica visiva (§4, prove B1-B4). Solo dopo il GO di Alfonso: addendum alla spec (§6), entry di log, commit `docs:` separato.

---

## 4. Verifica visiva (Alfonso, http://localhost:3001/, hard refresh tra i commit)

Dopo il commit A:
- **A1** Un progetto esistente con view IR (es. classe con compartimento attributi): il testo è visibilmente più grande, l'intestazione ha aria sopra e ai lati come i compartimenti, nessun taglio.
- **A2** Forme geometriche (ellisse, rombo, esagono): la label centrale resta centrata e dentro il contorno; un nome lungo mostra l'ellissi e non sfora (regressione da controllare, per via del `box-sizing`).
- **A3** In Basic, tab Appearance: nessuna sezione "Padding". In Advanced: c'è, con Normal preselezionato; Small e Large cambiano a vista intestazione e compartimenti insieme; tornare a Normal rimuove la chiave (tab Source: `padding` assente).
- **A4** Editing inline (doppio clic su nome e su un valore): l'input ha lo stesso corpo del testo che sostituisce.
- **A5** Un nodo con taglia esplicita (ridimensionato a mano) non si sposta né cambia taglia; un nodo content-hug cresce.

Dopo il commit B:
- **B1** Tab Text, sezione "Symbol text" (anche in Basic): Size 16 ingrandisce intestazione e righe insieme; Mono cambia il font di tutto; Color colora tutto.
- **B2** Con lo stile del nodo attivo, la label a indice 0 con un suo Size 20 vince sull'intestazione, le righe restano a 16.
- **B3** Asse condizionale (Advanced): Size 18 `when exists $x`: le istanze con `x` valorizzato cambiano, le altre no; modificando `x` il nodo si aggiorna.
- **B4** Reload: tutto persiste; tab Source mostra `shape.text` e nessuna chiave `undefined` o `{}`.

---

## 5. Vincoli

- Nessun rename di identificatori esistenti; nessun refactoring adiacente; nessun file fuori dalla tabella di §2.
- `git add` per pathspec, mai `git add .`; nel working tree ci sono modifiche estranee (`StatusBar.*`, `featureSignature.ts`) da lasciare intatte.
- Commenti nel codice in inglese; niente trattini lunghi nei testi nuovi (codice, commenti, docs).
- Se il typecheck sale sopra la baseline di 33 o vitest perde una suite verde, non committare: riporta.
- Layer Impact Report: non richiesto (nessun file di §3.1).

---

## 6. Addendum alla spec (da appendere dopo il GO finale)

In `docs/spec/claude_spec_2026-07-27_ir_textstyle_addendum.md`, sezione finale:

```markdown
## 11. Addendum 2026-08-25: radice della cascata e preset di spaziatura

Ratificato in chat il 2026-08-25 su richiesta di Alfonso; implementato in <commit A> e <commit B>.

- **`ShapeSpec.text?: TextStyle`**: stile tipografico del nodo, quinto aggancio di sez. 3 e radice della cascata. Reso inline su `.ir-node-content`; le superfici di testo (`.ir-label`, `.ir-row`, gli input inline) ereditano (`font-size: inherit` in `irStyle.ts`). Precedenza: default CSS < `shape.text` < `LabelSpec.style` (TS1) e, quando arriverà, `rowFormat.style` / `RowViewIR.style` (TS2). `fontWeight` non raggiunge le label top/center, che tengono il 600 di classe: si cambia dalla label.
- **Default CSS**: 13px (era 11px) su tutte le superfici di testo del simbolo; `.ir-badge`, `.ir-collapse-chip`, `.ir-hull__*` invariati.
- **`ShapeSpec.padding?: 'small' | 'normal' | 'large'`**: preset di spaziatura, scalare come `border`, su intestazione (top/bottom), label inside e compartimenti, tramite `--ir-pad-x` / `--ir-pad-y` (4/2, 8/4, 16/8 px). Prima l'intestazione non aveva padding. Authoring solo in Advanced; `normal` non viene persistito.
- Entrambi additivi: nessun bump di `irVersion`, nessuna migrazione (precedente: `marker`, 2026-08-15).
```

Sostituisci `<commit A>` e `<commit B>` con gli hash reali.

---

## 7. Log

Entry in `docs/claude-code-log.md` nel formato in uso (con i campi Corregge, Causa, Regressions, Out-of-scope changes, Layer Impact Report, Smoke visivo), dopo la conferma visiva di Alfonso. Nome del documento prompt: `2026-08-25 13:20`.
