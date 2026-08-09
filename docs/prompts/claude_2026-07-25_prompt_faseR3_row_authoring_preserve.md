# Prompt Claude Code: Fase R3, authoring delle row view + preserve-verbatim nel compartment editor

**Data**: 2026-07-25
**Tipo**: feat (implementazione scoped; R1 e R2 landed e verificati visivamente PASS)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito**: verificare con `git log` la presenza di `8a650833b` (R1) e `d12a54aa0` (R2). Se mancano, STOP.
**Hard stop**: dopo commit + log.

## Prima di iniziare

1. Leggere `CLAUDE.md`; in caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/claude-code-log.md` (entry R1 e R2) e, per contesto, il discovery report `docs/discovery/discovery_2026-07-25_row_view_dispatch.md`.
3. Leggere PER INTERO ogni file prima di editarlo. Righe citate = anchor indicativi, ri-ancorarsi ai nomi via grep.
4. **WIP estraneo nel working tree** (filone shape/resize, ~7 file tra cui `VertexAuthoringPanel.tsx`): per ogni file da editare, `git diff` prima; gli hunk estranei NON vanno revertiti ne' committati; staging filtrato per hunk come in R1/R2; elencare nel report di chiusura i file con WIP.
5. Grep preventivo sui nuovi identificatori: `RowAuthoringPanel`, e ogni classe CSS nuova che si volesse introdurre (preferire il riuso di quelle esistenti del pannello authoring).

## CONTESTO (autocontenuto)

R1+R2 hanno reso operativo il dispatch polimorfico: `FieldCompartmentSpec.source` ammette `{ from: 'children'; filter?: Predicate }`; le righe sono rese dalla row view (`kind: 'row'`) risolta per la metaclasse concreta di ogni child, fallback `defaultRowViewIR()`; gli oggetti resi come riga sono soppressi dal canvas. Tutto verificato a runtime.

Il **dogfooding ha pero' scoperto un bug di authoring**: il `FieldCompartmentListEditor` (B2a) conosce solo `attributes | references`; aprendo/toccando un compartment con sorgente `children`, la sorgente e' stata riscritta in `attributes` (id azzerato), corrompendo la view. Il progetto ha gia' la regola per questi casi (B2a, usata per i Conditional): **valore non rappresentabile in Basic = badge read-only + preserva verbatim, mai riscrivere**. R3 porta questa regola sulle sorgenti E completa l'authoring: opzione `children` nel compartment editor, pannello dedicato alle row view, seed di row view dall'entry point.

Forma dati di riferimento (da `irTypes.ts` post R1/R2, verificare i nomi reali):

```typescript
interface RowViewIR {
  irVersion: string; kind: 'row';
  metaclasses: string[] | '*';
  predicate?: Predicate; priority?: number; label?: string;
  template: TextSource[];               // NB: niente exclusive, niente shape
  visible?: Conditional<boolean>;
}
// FieldCompartmentSpec.source:
//   {from:'attributes'} | {from:'references'} | {from:'children'; filter?: Predicate}
```

Decisioni vincolanti:
- **Preserve-verbatim e' il requisito numero uno** di questa fase: nessuna interazione col pannello deve MAI riscrivere una sorgente (o un filter) che il pannello non rappresenta. Round-trip garantito.
- Il pannello row e' NUOVO e snello; `VertexAuthoringPanel` e `MatchingSection` esistenti NON si modificano (la MatchingSection e' tipizzata `VertexViewIR` e include `exclusive`, che su `RowViewIR` non esiste).
- La guard R1 resta: `EnableIRPanel` non sovrascrive mai un `ir` esistente.

## COSA

### 1. `authoring/FieldCompartmentListEditor.tsx` — sorgente `children` + preserve-verbatim
- **Select della source a tre opzioni**: `attributes | references | children`.
- Con source `children`:
  - Editor del filtro, caso Basic: `Checkbox` "filtra per metaclasse (isKind)" + `Select` della classe. Checked quando `filter` e' esattamente `{op:'isKind', class:<nome>}`; al check, seed `{op:'isKind', class:<prima classe disponibile>}`; all'uncheck, rimozione della CHIAVE `filter` (pattern rest/spread gia' usato per predicate in B2c-i). Se `filter` e' un Predicate di altra forma: badge read-only "predicate avanzato" + preserva verbatim.
  - La lista dei nomi di classe: se il componente non riceve gia' `classNames`, aggiungere una prop opzionale e passarla dal padre (`VertexAuthoringPanel`, che la possiede gia' per la MatchingSection). Modifica al padre limitata a QUESTO passaggio di prop (attenzione WIP, staging filtrato).
  - **Nascondere la sezione Row segments** (per `children` e' ignorata) sostituendola con `HelpText`: le righe sono rese dalla row view di ogni child (dispatch); il formato si definisce nelle view di kind `row`. NON cancellare `rowFormat` dal draft: preservarlo verbatim.
- **Preserve-verbatim generale**: se `source.from` non e' tra i tre valori noti, il Select mostra un badge read-only "sorgente non supportata: <from> (preservata)" e NESSUN handler riscrive la source. Vale anche per ogni futura estensione dello schema.
- Cambio di source da parte dell'utente (azione esplicita sul Select): consentito e legittimo; il preserve-verbatim protegge dalle riscritture IMPLICITE (mount, normalizzazione, re-render), non dalle scelte dell'utente.

### 2. `authoring/RowAuthoringPanel.tsx` — NUOVO pannello per kind `row`
Pannello snello, stessa convenzione visiva del VertexAuthoringPanel (token, `jj-field-label`, componenti `ui`), con:
- **Matching (inline, non riusare MatchingSection)**: metaclasses (stesso pattern UI della MatchingSection: wildcard checkbox, lista con rimozione, Select "Aggiungi metaclasse"), predicate opzionale (`PredicateBuilder`, seed/rimozione chiave come in B2c-i), priority (`NumberInput`). NIENTE exclusive.
- **Template**: `ListEditor` di `TextSourceEditor` (riuso diretto di entrambi): ogni entry e' una `TextSource` (path | literal | intrinsic); le features per il PathBuilder si risolvono dalla PRIMA metaclasse della row view (stesso memo/pattern del pannello vertex: `getMetaclassInfo`, dep su `JSON.stringify(draft.metaclasses)`); se metaclasse assente o wildcard, `features: null` + hint "imposta una metaclasse per abilitare i path".
- **Visible**: se assente, nessun controllo; se presente, riusare `ConditionalEditor<boolean>` SOLO se le props combaciano senza modifiche a ConditionalEditor; altrimenti badge read-only + preserva verbatim.
- **Label** della view: `Input`.
- Scrittura: stesso canale di persistenza del draft usato dal pannello vertex (stesso hook/flusso di patch della view; leggere come fa VertexAuthoringPanel e replicare, senza fattorizzazioni).

### 3. `editors/views/ViewData.tsx` — routing
- Kind `row`: montare `RowAuthoringPanel` al posto del placeholder read-only introdotto in R1. Il routing esplicito per kind resta; nessun cambiamento per vertex/edge/graphVertex/assente.

### 4. `authoring/EnableIRPanel.tsx` — seed di row view
- Aggiungere la scelta del kind al momento dell'enable: `Select` con `vertex` (default, comportamento identico a oggi) e `row`. Con `row`, seed minimale: `{ irVersion: 'ir-1.0', kind: 'row', metaclasses: [], template: [ { from: 'intrinsic', prop: 'name' } ] }`.
- La guard R1 (mai sovrascrivere `ir` esistente) resta INVARIATA.

### 5. Test
- Preserve-verbatim: round-trip a livello di logica di patch: un draft con source `children` + filter avanzato (non-isKind) o con source sconosciuta attraversa i handler del pannello senza mutazioni (se la struttura dei componenti non consente un unit test pulito, testare le funzioni di patch estratte o documentare nel report perche' no).
- Seed row da EnableIRPanel: shape del seed corretta.
- Regressione: suite esistente verde.

## DOVE (riepilogo, SOLO questi file)

| File | Intervento |
|------|-----------|
| `authoring/FieldCompartmentListEditor.tsx` | opzione children, filtro isKind Basic, preserve-verbatim, HelpText |
| `authoring/VertexAuthoringPanel.tsx` | SOLO passaggio prop `classNames` al compartment editor se manca (WIP: staging filtrato) |
| `authoring/RowAuthoringPanel.tsx` (nuovo) | pannello row: matching inline, template, visible, label |
| `editors/views/ViewData.tsx` | kind row -> RowAuthoringPanel |
| `authoring/EnableIRPanel.tsx` | scelta kind al seed (vertex default, row) |
| test | preserve-verbatim, seed, regressione |

FUORI scope: `MatchingSection` (non toccarla), `ConditionalEditor`/`PredicateBuilder`/`TextSourceEditor`/`ListEditor` (riuso senza modifiche), tutto il runtime IR (`irTypes`/`irCompile`/`irResolveCore`/`irContainment`/`IRNodeContent`/`IRRow`), critical zone, filtro per-reference, editing inline delle righe.

## Vincoli

- Solo i file elencati; per necessita' ulteriori, STOP e segnalare.
- Zero refactoring; mai rinominare identificatori esistenti; nessuna classe CSS nuova se ne esiste una adatta (verificare collisioni con grep prima di crearne).
- Build + suite test IR + typecheck a baseline.

## Verifica visiva attesa (la esegue Alfonso)

1. Aprire il tab IR della view "IR Class v2" (ora si puo'): il Compartment mostra source `children` col filtro `isKind Feature` e l'HelpText al posto dei segments; chiudere e riaprire: canvas INVARIATO (round-trip senza corruzione: il bug del dogfooding non si ripresenta).
2. Aprire il tab IR della view "IR Attribute Row v2": pannello row con metaclasses [Attribute], template a tre segmenti; modificare il literal ' : ' in ' = ' e vedere le righe cambiare sul canvas.
3. Creare da UI una row view nuova (EnableIRPanel, kind row) su una view vuota, impostare metaclasse e template col PathBuilder, verificarne l'effetto.

## Output e chiusura

1. Gate verdi.
2. Entry in `docs/claude-code-log.md` (tipo `feat`), citando questo documento prompt con data e ora.
3. Staging filtrato attorno al WIP; `git add` puntuale per file. Commit: `feat: add row view authoring panel and children source with preserve-verbatim`. **Nessun push** senza go-ahead.
4. HARD STOP. Report di chiusura: file toccati, esito gate, file con WIP estraneo, scostamenti motivati.
