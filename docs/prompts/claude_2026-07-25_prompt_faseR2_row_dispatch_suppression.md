# Prompt Claude Code: Fase R2, dispatch polimorfico delle righe (`from:'children'` + IRRow) e soppressione top-level

**Data**: 2026-07-25
**Tipo**: feat (implementazione scoped; discovery e R1 già landed)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Prerequisito**: R1 committato (`feat: add IR row view kind with dedicated resolver context and authoring guard`). Verificare con `git log` che ci sia; se manca, STOP e segnalare.
**Hard stop**: dopo commit + log. Niente R3 (authoring): arriverà con un prompt separato.

## Prima di iniziare

1. Leggere `CLAUDE.md` nella root; in caso di conflitto con questo prompt, segnalare senza procedere.
2. Leggere `docs/claude-code-log.md` e il discovery report `docs/discovery/discovery_2026-07-25_row_view_dispatch.md` (i riferimenti file:riga vengono da lì; ri-ancorarsi ai nomi via grep, le righe possono essere slittate, anche per effetto di R1).
3. Leggere PER INTERO ogni file prima di editarlo.
4. **ATTENZIONE WIP ESTRANEO NEL WORKING TREE**: esistono modifiche uncommitted di un altro filone (shape/resize) su circa 7 file, tra cui `IRNodeContent.tsx` e `irTypes.ts` (hunk `ShapeForm`), che QUESTO prompt deve toccare. Per ogni file da editare: prima `git diff` del file; gli hunk pre-esistenti estranei NON vanno né revertiti né inclusi nel commit. A fine lavoro, staging per hunk filtrato (stessa tecnica già usata in R1 per `irTypes.ts`) e nel report di chiusura elencare quali file avevano WIP estraneo.
5. Verificare con grep globale che i nuovi identificatori non esistano già: `rowRenderedChildren`, `IRRow`, `useIRRowView`, `defaultRowViewIR`.

## CONTESTO (autocontenuto)

R1 ha costruito le fondamenta: kind `row` (`RowViewIR`, `CompiledRowView`), `compileRowView`, bucket dedicati `rowByMetaclass`/`rowWildcard` + `resolveRowView` nel resolver (comparatore condiviso), routing in `irValidate`, guard anti-riseed nell'authoring. Nulla è ancora renderizzato.

R2 attiva il dispatch: un `fieldCompartment` può dichiarare la sorgente `{from:'children'}`; le righe sono i containment children (filtrati) del self, e OGNI child è reso dalla row view risolta per la SUA metaclasse concreta, con fallback a cascata. Gli oggetti resi come riga spariscono dal canvas come nodi top-level (nascosti, non rimossi).

Decisioni vincolanti (dal delta di spec ratificato, addendum del 2026-07-25):
- **P1, totalità**: il compartment `children` rende come riga TUTTI i children che passano il filtro; chi non ha row view usa il default built-in. Mai stati misti metà righe metà nodi.
- **P2, read-only**: le righe non hanno selezione né editing inline. Nessun handler oltre il rendering.
- **P3, single source of truth**: il set "resi come riga" è calcolato da UNA funzione pura condivisa tra il renderer (che itera) e il pass di presentazione (che nasconde). Mai due calcoli paralleli.
- **Soppressione = `hidden:true`** nel pass di presentazione, a valle del sync; MAI rimozione dall'array nodi (edge lifting, hull sizing, persistenza posizione indicizzano per id). Il set righe entra nello stesso meccanismo hidden del collapse, così `decorateEdges` fa lift/suppress senza logica nuova.
- **Fallback runtime**: `defaultRowViewIR()` (template = intrinsic name) vive in `irDefaults.ts`, compilata al volo, MAI persistita come DViewElement.
- **Cascata di risoluzione riga**: row view esatta sul sottotipo > ereditata > wildcard row > default built-in (le prime tre le dà già `resolveRowView` di R1).
- Critical zone (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState.ts`, `VersionFixer.tsx`): NON toccare.

## COSA

### 1. `ir/irTypes.ts` — sorgente `children` (additivo)
- Estendere la union della sorgente di `FieldCompartmentSpec` con `{ from: 'children'; filter?: Predicate }`.
- Riflettere nel tipo compilato del compartment il filter compilato (stesso pattern del `childFilter` del containment).
- `rowFormat` resta com'è (required): per la sorgente `children` viene semplicemente ignorato dall'interprete (il formato della riga viene dalla row view del child). Non cambiare il contratto del campo.
- NON toccare l'hunk `ShapeForm` pre-esistente.

### 2. `ir/irCompile.ts` — compile della sorgente
- Nel compile dei fieldCompartments: per `from:'children'`, compilare `filter` col predicate compiler esistente (anchor: come il `childFilter` del containment, `:305-309` pre-R1). Le sorgenti `attributes`/`references` compilano identiche a oggi.
- Se `irValidate` oggi impone vincoli sui segments del rowFormat, allentarli SOLO per il caso `children` (segments ignorati, ammesso vuoto); nessun altro cambiamento di validazione.

### 3. `ir/irContainment.ts` — la funzione SSOT
- Nuova funzione pura esportata `rowRenderedChildren(compiledView, readCtx, selfId)`: se la compiled view non ha compartment con sorgente `children` ritorna `[]`; altrimenti ritorna gli objectId = `containmentChildren(selfId)` (`:47-63`) filtrati dal filter compilato, nell'ordine di `containmentChildren`; con più compartment `children` nella stessa view, unione senza duplicati preservando l'ordine della prima occorrenza.
- Questa funzione è consumata da ENTRAMBI i lati (punto 4 e punto 6). È la P3: nessun secondo calcolo del set da nessuna parte.

### 4. Soppressione nel pass di presentazione (`ir/useIRContainment.ts` + `ir/irContainment.ts`)
- Oggi il pass considera solo i graphVertex (hull, collapse). Estenderlo: per ogni nodo il cui oggetto risolve una view IR **vertex** con almeno un compartment `children`, calcolare `rowRenderedChildren(...)` e aggiungere quegli objectId al set dei nascosti, in unione col set collapse esistente (`computeHidden`/`decorateNodes`, `:110-155` pre-R1). Stesso meccanismo `hidden:true`; `decorateEdges` resta invariato e fa lift/suppress da solo.
- **Fast path**: il contratto pass-through (`useIRContainment.ts:6-9,118-121` pre-R1: stessi ref quando non c'è nulla da fare) va esteso a "nessun graphVertex E nessuna vertex view con compartment children"; il caso comune non deve pagare nulla.
- Verificare che le dipendenze del memo del pass includano ciò che serve perché il set si ricalcoli quando il modello cambia (es. aggiunta di un child): allinearsi a come il pass già reagisce per hull/collapse, non inventare un canale nuovo.
- Attenzione all'ordine delle decorazioni: un child può essere contemporaneamente dentro un hull collassato e riga di un altro nodo; l'unione dei set gestisce il caso, nessuna precedenza speciale.

### 5. `ir/irDefaults.ts` — fallback built-in
- `defaultRowViewIR(): RowViewIR` con template = intrinsic name (una sola `TextSource {from:'intrinsic', prop:'name'}`), `metaclasses:'*'`. Compilata una volta e cachata (riusare il pattern di cache di compile introdotto in R1 se disponibile). MAI scritta in un DViewElement.

### 6. Componente riga — nuovo file `ir/IRRow.tsx`
- Props minime: l'objectId del child (più ciò che serve dal contesto, es. viewpoint index, seguendo come `IRNodeContent` accede a index/ReadCtx).
- Risolve la row view del child: `resolveRowView` (R1); se null → `defaultRowViewIR()` compilata.
- **Subscription propria** keyed sul child: replicare il pattern di `useIRView` (`irResolve.ts:45-94` pre-R1) radicato sul child: signature delle feature del child + crossDeps per i multi-hop del template radicati sul child. La riga deve aggiornarsi quando cambia il child SENZA passare per un re-render forzato dell'host.
- Render: `<div className="ir-row">` (stessa classe delle righe esistenti, coerenza visiva; nessun nuovo stile se non strettamente necessario) con i segmenti del template valutati in sequenza.
- P2: nessun onClick, nessuna selezione, nessun editing.
- Se serve un hook separato `useIRRowView(childId)` in `irResolve.ts` per pulizia, va bene; l'importante è una subscription per-child.

### 7. `ir/IRNodeContent.tsx` — il ramo dispatch
- Nel map dei fieldCompartments: per sorgente `children`, iterare `rowRenderedChildren(...)` (LA STESSA funzione del punto 3) e rendere `<IRRow key={childId} ... />` per ciascuno; `separator`/`visible` del compartment si comportano come per le altre sorgenti.
- **Il percorso slot-mode esistente (`attributes`/`references`) NON si tocca**: niente estrazione, niente refactor del map esistente. Il dispatch è un ramo aggiuntivo. Le due semantiche di riga restano separate.
- Ricordare il WIP estraneo su questo file (punto 4 del preambolo).

### 8. Test (`ir/__tests__/`)
- `rowRenderedChildren`: view senza compartment children → []; con filter isKind su superclasse → include i sottotipi; senza filter → tutti i children; ordine stabile; due compartment children → unione senza duplicati.
- Compile: sorgente children con e senza filter; rowFormat con segments vuoto accettato per children.
- Fallback: child la cui metaclasse non matcha nessuna row view → `defaultRowViewIR` (a livello di resolve/compile puro).
- Regressione: i test esistenti (inclusi quelli R1) passano invariati.

## DOVE (riepilogo, SOLO questi file)

| File | Intervento |
|------|-----------|
| `ir/irTypes.ts` | sorgente `children` + filter compilato nel tipo |
| `ir/irCompile.ts` | compile sorgente children (+ eventuale allentamento mirato in validate, vedi punto 2) |
| `ir/irValidate.ts` | solo se serve per il punto 2, minimo |
| `ir/irContainment.ts` | `rowRenderedChildren` SSOT + integrazione set hidden |
| `ir/useIRContainment.ts` | estensione del pass ai vertex con compartment children + fast path |
| `ir/irDefaults.ts` | `defaultRowViewIR()` |
| `ir/IRRow.tsx` (nuovo) | componente riga child-bound |
| `ir/irResolve.ts` | solo se si estrae `useIRRowView` |
| `ir/IRNodeContent.tsx` | ramo dispatch nel map dei compartment |
| `ir/__tests__/*` | test nuovi + regressione |

FUORI scope: authoring (nessun RowAuthoringPanel, nessun tocco a `FieldCompartmentListEditor`/`VertexAuthoringPanel`/`ViewData`/`EnableIRPanel`), filtro per-reference, editing inline/selezione righe, reference non-containment, tutta la critical zone.

## Vincoli

- Solo i file elencati; se sembra necessario altro, STOP e segnalare.
- Zero refactoring; mai rinominare identificatori esistenti; interfacce esistenti solo con aggiunte additive.
- Nessun cambiamento di comportamento per view SENZA compartment `children` (il testbed Machine/State deve rendere identico, collapse incluso).
- Dopo le modifiche: build + suite test IR verdi, typecheck a baseline (comandi reali da `package.json`).

## Verifica visiva attesa (la esegue Alfonso, non Claude Code)

Riportata qui perché il lavoro deve renderla possibile: sul progetto class diagram (Class/Feature/Attribute, `ownedFeatures` composizione), con lo snippet console fornito a parte (viewpoint "Class Diagram IR"): il nodo `Person` mostra le righe `name : String` e `surname : String` nel compartment; i nodi `name`/`surname` NON compaiono più sul canvas; nessun edge penzolante verso di loro; modificando un Attribute da treeview/Properties la riga si aggiorna live senza toccare `Person`; aggiungendo un nuovo Attribute a `Person` compare una riga nuova (e nessun nodo nuovo); il testbed Machine/State resta identico.

## Output e chiusura

1. Build + test + typecheck verdi.
2. Entry in `docs/claude-code-log.md` (tipo `feat`), citando questo documento prompt con data e ora.
3. Staging per hunk dei soli cambi R2 (escludere il WIP estraneo, punto 4 del preambolo); `git add` puntuale per file, mai `git add .`. Commit: `feat: dispatch IR compartment rows to row views with top-level suppression`. **Nessun push** senza go-ahead.
4. HARD STOP. Nel report di chiusura: file toccati con una riga ciascuno, esito gate, file che avevano WIP estraneo, scostamenti dal prompt motivati. Il gate per R3 è la verifica visiva di Alfonso.
