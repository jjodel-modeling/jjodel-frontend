# Prompt Claude Code: Fase R1, kind `row` nello schema IR + contesto resolver dedicato + guard anti-riseed

**Data**: 2026-07-25
**Tipo**: feat (implementazione scoped, Fase 2 del two-phase; la discovery è già stata fatta)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Hard stop**: dopo commit + log. Nessuna Fase R2 (renderer/dispatch/soppressione): arriverà con un prompt separato dopo la verifica di Alfonso.

## Prima di iniziare

1. Leggere `CLAUDE.md` nella root: fonte di verità. Se questo prompt lo contraddice, segnalare il conflitto invece di procedere.
2. Leggere `docs/claude-code-log.md` per il contesto recente.
3. Leggere il discovery report di riferimento: `docs/discovery/discovery_2026-07-25_row_view_dispatch.md`. Questo prompt ne implementa il capitolo (a) più la guard authoring; i riferimenti file:riga qui sotto vengono da lì e possono essere slittati: ri-ancorarsi sempre ai nomi via grep, mai fidarsi della riga.
4. Leggere PER INTERO ogni file prima di editarlo.
5. Prima di introdurre i nuovi identificatori, verificare con grep globale che non esistano già: `RowViewIR`, `CompiledRowView`, `compileRowView`, `resolveRowView`, `rowByMetaclass`, `rowWildcard`.

## CONTESTO (autocontenuto)

Decisione architetturale ratificata: i `fieldCompartments` delle view IR avranno (in R2) un dispatch polimorfico stile DefaultNode: il compartment itera i containment children e ogni child viene reso dalla **row view** risolta per la SUA metaclasse concreta, con lo stesso matching dei vertici ma in un contesto di risoluzione separato. R1 costruisce le fondamenta: il kind `row` nello schema, la sua compilazione, il contesto di risoluzione dedicato nel resolver, la validazione, e una guard che impedisce all'authoring attuale di corrompere una row view. **R1 non tocca il renderer, il containment, né la soppressione top-level**: nessun cambiamento visivo atteso.

Schema del nuovo kind (dal delta di spec ratificato):

```typescript
interface RowViewIR {
  irVersion: string;                 // 'ir-1.0', nessun bump
  kind: 'row';
  metaclasses: string[] | '*';
  predicate?: Predicate;
  priority?: number;
  label?: string;
  template: TextSource[];            // segmenti radicati sull'oggetto della riga
  visible?: Conditional<boolean>;
}
```

Decisioni vincolanti per R1:
- **Bucket dedicati** nel resolver (`rowByMetaclass`/`rowWildcard`): una vertex view non deve mai essere candidata come riga e viceversa.
- **`CompiledRowView` separato** (come `CompiledEdgeView`), NON allargare `CompiledView.kind`.
- **Comparatore di ordinamento estratto e condiviso**: richiesta esplicita di questo prompt, non refactoring opportunistico.
- `NodeViewIR` resta INVARIATA (row non è una node view). `AnyViewIR` (o la union complessiva usata dal routing) si allarga.
- Il campo `template` si compila riusando l'infrastruttura esistente dei TextSource; `visible` col conditional compiler esistente.
- `FieldCompartmentSpec.source` NON si tocca in R1: `from:'children'` entra in R2 insieme al renderer che la interpreta.

## COSA

### 1. `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts`
- Aggiungere `RowViewIR` (forma sopra; allineare `TextSource`/`Predicate`/`Conditional` ai tipi reali del file).
- Aggiungere `CompiledRowView` con `kind: 'row'`, il template compilato e `visible` compilata, speculare per struttura ai compiled esistenti (leggere come sono fatti `CompiledView` e `CompiledEdgeView` a `:236-237` e dintorni e replicare le convenzioni di firma degli accessor).
- Allargare la union complessiva delle view IR (anchor: `:185`, `AnyViewIR` / equivalente) con `RowViewIR`. NON toccare `NodeViewIR` e NON toccare `CompiledView.kind`.

### 2. `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`
- Nuova `compileRowView(ir: RowViewIR): CompiledRowView` (anchor dei pattern: `compileView` a `:251`, `compileEdgeView`): compila `template` con la stessa utility usata per i TextSource delle label e `visible` col conditional/predicate compiler esistente. Nessuna logica nuova di path: solo riuso.

### 3. `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts`
- **Estrarre il comparatore di ordinamento** (priority > specificità > declaration order), oggi duplicato inline in `resolveIRView` (`:188-192`), `resolveEdgeView` (`:239-243`), `resolveObjectAsEdgeView` (`:273-277`), in un helper condiviso del modulo; adottarlo nei tre siti esistenti SENZA cambiarne il comportamento (stessa semantica, stessi tie-break).
- Aggiungere i bucket `rowByMetaclass` / `rowWildcard` a `IRViewpointIndex`.
- **Aggiornare il gate dei kind** (`:120`, oggi `if (ir.kind !== 'vertex' && ir.kind !== 'graphVertex') continue;` nel ramo node): instradare `kind === 'row'` nei bucket row (esatta per metaclasse + wildcard, come i vertex a `:120-139`); ogni altro kind sconosciuto continua a essere scartato in silenzio come oggi. Questo gate è il punto più critico di R1.
- Nuova `resolveRowView(...)` speculare a `resolveIRView` (`:165-202`): candidate = esatta + ancestry (`classAncestryNames`) + wildcard, ordinamento con l'helper condiviso, valutazione predicate in ordine, prima che passa vince.

### 4. `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts`
- Routing (`:18`): `kind === 'row'` → `compileRowView`; `edge` → `compileEdgeView` come oggi; il resto invariato. Una row view scritta via console deve risultare validabile già in R1 (serve al testbed di R2).

### 5. Guard anti-riseed (anti-corruzione)
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (seed a `:55-59`): guardia esplicita: se la view ha GIÀ un `ir` (di qualunque kind), il pannello NON deve mai sovrascriverlo con il seed vertex; early return con un messaggio informativo minimale (testo breve, componenti ui esistenti, nessun nuovo stile).
- `frontend/src/components/editors/views/ViewData.tsx` (`:53` `showIRTab`, `:81-83` ternario): rendere il routing esplicito sul kind: `vertex` → `VertexAuthoringPanel` (come oggi); `ir` presente con kind diverso da `vertex` (incluso `row`) → placeholder read-only ("view IR di kind X: authoring non ancora disponibile"), che NON monta `EnableIRPanel` e non scrive mai; `ir` assente → `EnableIRPanel` (come oggi). Estendere `showIRTab` quanto basta perché una view con `ir` di kind `row` mostri il tab col placeholder invece di nasconderlo. Nessun altro cambiamento di comportamento per vertex/edge/graphVertex.

### 6. Test (`frontend/src/components/editor-v2/viewpoint/ir/__tests__/`)
Estendere la suite esistente (anchor: `ir.test.ts`, `irValidate.test.ts`; seguirne le convenzioni) con almeno:
- **Gate**: un `ir` con kind sconosciuto (es. `'banana'`) viene ignorato dall'index senza throw; un kind `row` finisce nei bucket row e NON compare mai nei bucket vertex/edge (e viceversa: una vertex view non compare nei bucket row).
- **Risoluzione row**: cascata esatta > ereditata > wildcard (metamodello di test con superclasse e sottotipo); `priority` vince sulla specificità; a parità totale vince il declaration order; `predicate` false salta alla candidata successiva.
- **Regressione comparatore**: i casi esistenti di risoluzione vertex/edge passano invariati dopo l'estrazione dell'helper.
- **Validate**: una `RowViewIR` ben formata passa; template vuoto o malformato produce l'errore secondo le convenzioni di `irValidate` (guardare come trattano i casi limite le validazioni esistenti e allinearsi, non inventare una policy nuova).

## DOVE (riepilogo file, SOLO questi)

| File | Intervento |
|------|-----------|
| `ir/irTypes.ts` | RowViewIR, CompiledRowView, union allargata |
| `ir/irCompile.ts` | compileRowView |
| `ir/irResolveCore.ts` | helper comparatore + adozione 3 siti, bucket row, gate, resolveRowView |
| `ir/irValidate.ts` | routing row |
| `authoring/EnableIRPanel.tsx` | guardia no-overwrite se `ir` presente |
| `editors/views/ViewData.tsx` | routing esplicito per kind + placeholder read-only |
| `ir/__tests__/*` | test nuovi + regressione |

Esplicitamente FUORI scope R1: `IRNodeContent.tsx`, `irContainment.ts`, `useIRContainment.ts`, `irDefaults.ts`, `irResolve.ts` (hook), `FieldCompartmentListEditor.tsx`, `VertexAuthoringPanel.tsx` (nessun RowAuthoringPanel in R1), tutta la critical zone (`useJjomSync.ts`, `portDistribution.ts`, `canvasToJjom.ts`, `syncState.ts`, `VersionFixer.tsx`).

## Vincoli

- Toccare SOLO i file elencati. Se durante il lavoro sembra necessaria una modifica altrove, STOP e segnalare, non improvvisare.
- Zero refactoring oltre l'estrazione del comparatore richiesta al punto 3. Mai rinominare identificatori esistenti.
- Interfacce esistenti: solo aggiunte additive; nessun campo esistente cambiato o rimosso.
- Dopo le modifiche: build del progetto e run della suite di test IR; entrambe devono passare senza errori né nuovi warning TypeScript (comandi reali da `package.json`).

## Output e chiusura

1. Build + test verdi.
2. Entry in `docs/claude-code-log.md` col formato standard (tipo `feat`), citando questo documento prompt con data e ora.
3. Commit puntuale dei soli file toccati (elencarli uno a uno nel `git add`, mai `git add .`): messaggio `feat: add IR row view kind with dedicated resolver context and authoring guard`. **Nessun push** senza go-ahead esplicito.
4. HARD STOP. Riportare in chiusura: elenco file toccati con una riga di sintesi ciascuno, esito build/test, eventuali scostamenti dal prompt (che vanno motivati, non taciuti). La verifica di Alfonso (build + smoke visivo su una view IR esistente: nessuna regressione attesa) è il gate per il prompt R2.
