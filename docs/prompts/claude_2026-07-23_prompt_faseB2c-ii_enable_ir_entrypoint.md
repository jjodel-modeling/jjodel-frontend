# Prompt Claude Code — Fase B2c-ii: entry-point di enablement IR (view classica → IR con metaclassi risolte)

**Data**: 2026-07-23
**Tipo**: feat (implementazione; discovery `discovery_2026-07-22_ir_view_enablement_entrypoint.md` già committata, `4612a3241`)
**Prerequisito**: B2c-i committata (`d1e9d1025`)

## COSA

Chiudere il gap strutturale documentato dalla discovery (§4): in produzione nessuna azione UI trasforma una view classica in IR; l'unico creatore di `.ir` è la migration wildcard. B2c-ii aggiunge l'entry-point: il tab **IR** diventa sempre visibile per le view vertex, e quando la view non ha ancora `.ir` mostra un pannello di abilitazione che, al click, seeda `view.ir` con le metaclassi risolte da `appliableToClasses`.

**Decisione UX (del co-designer, flaggata, rivedibile)**: l'entry-point vive DENTRO il tab IR (pannello di enable al posto dell'authoring panel finché `.ir` non esiste), non come bottone in header o context-menu. Motivo: zero chrome nuovo, l'azione sta dove sta il risultato, e dopo l'enable lo stesso tab ospita direttamente l'authoring.

**Punto delicato scoperto in fase di grounding**: `appliableToClasses` NON contiene solo puntatori a classi M2. Le opzioni del multi-select (`InfoData.tsx:87`, `classesOptions`) mescolano: (a) nomi di tipi meta-livello da `objectTypes` (es. `DObject`; stringa vuota = "anything"), (b) id di classi del metamodello (`c.id`). La risoluzione deve quindi FILTRARE: solo gli id risolvibili a una classe M2 diventano nomi in `ir.metaclasses`; i tipi D-level e "anything" si scartano (il resolver IR matcha per nome di metaclasse M2 via `classAncestryNames`, non conosce i tipi meta). Se dopo il filtro non resta nulla: seed `'*'`.

## DOVE

| File | Azione |
|------|--------|
| `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` | **NUOVO** pannello di abilitazione |
| `frontend/src/components/editors/views/ViewData.tsx` | condizione di inclusione del tab IR + render panel-or-enable |
| `docs/claude-code-log.md` | entry standard, STESSO commit del codice |

**NON toccare**: `InfoData.tsx`, `VertexAuthoringPanel.tsx`, `MatchingSection.tsx`, `irDefaults.ts`, `irTypes.ts`, `irCompile.ts`, `irValidate.ts`, `irResolveCore.ts`, `irResolve.ts`, `VersionFixer.tsx` (critical zone), tutto il resto.

**Attenzione sessione concorrente**: nel working tree ci sono modifiche uncommitted di un'altra sessione (TreeViewContent.tsx, tree-view-sidebar.scss, PropertiesWithTreeView.tsx, events/registry.ts, più la sua entry in coda a claude-code-log.md e il suo discovery report untracked). NON toccarle, NON committarle. Per il log, stessa danza di B2c-i: accantonare il blocco treeview, committare solo la propria entry, ri-appenderlo, verificare col backup.

Prima di editare: leggere per intero `ViewData.tsx` e verificare con grep che `EnableIRPanel` sia libero (verificato in chat il 2026-07-23, riconfermare).

## COME

### 1. `EnableIRPanel.tsx` (nuovo)

```ts
export interface EnableIRPanelProps {
    view: LViewElement;
}
```

Comportamento:

**a. Risoluzione metaclassi (helper interno, es. `resolveMetaclassNames(view): string[]`).**
Per ogni entry di `view.appliableToClasses ?? []`:
- entry vuota o che coincide con un nome di tipo D-level (i valori di `objectTypes` usati da InfoData): scarta;
- altrimenti tenta la risoluzione come puntatore: `LPointerTargetable.fromPointer(entry)` (o accesso via idlookup, usare l'API canonica del progetto: verificare come fa `ViewData.mapStateToProps`); se risolve a una classe (className === `DClass.cname`) con `name` non vuoto, prendi `name`; altrimenti scarta.
- Dedup preservando l'ordine. Avvolgere la risoluzione in try/catch: un'entry malformata si scarta, mai un crash.

**b. UI.** Sezione `properties-tab properties-panel` coerente con gli altri pannelli:
- `jj-field-label` "IR authoring" + `HelpText`: questa view usa ancora il template classico (jsxString); abilitando l'IR la view viene descritta da una rappresentazione strutturata e il rendering delle istanze che matcha passa subito all'interprete IR.
- Anteprima di cosa verrà seedato: se la risoluzione produce nomi, elencarli ("La view partirà applicata a: X, Y"); se produce lista vuota, dire esplicitamente che partirà wildcard ("tutte le metaclassi, `*`") e che si può restringere subito dopo dal tab Advanced.
- `Button` primario "Abilita authoring IR".

**c. Azione al click.**
```ts
const names = resolveMetaclassNames(view);
const seed: VertexViewIR = {
    ...defaultObjectViewIR(),
    metaclasses: names.length > 0 ? names : '*',
    ...(view.name ? { label: view.name } : {}),
};
const v = validateIR(view.id, seed);
if (!v.ok) { /* ErrorText inline, nessuna scrittura */ return; }
(view as any).ir = seed;
```
- NESSUN `migratedFrom` (non è una migration: la view nasce già custom).
- La scrittura è lo stesso meccanismo L-proxy del pannello (`VertexAuthoringPanel.tsx:70-71`): whole-object replace → dispatch → il tab si ri-renderizza e mostra l'authoring panel automaticamente (il redux update rigenera `view` in `ViewData.mapStateToProps`).
- Il fallimento di `validateIR` col seed factory non dovrebbe mai accadere: se accade è un bug da riportare, non da aggirare.

### 2. `ViewData.tsx` (edit puntuale)

Condizione di inclusione del tab IR (oggi riga ~69: `(view as any).ir?.kind === 'vertex'`). Nuova condizione:

```ts
const ir = (view as any).ir;
const showIRTab = (ir?.kind === 'vertex') || (isV && !ir && view.isEdge !== true);
```

- View con `ir.kind === 'vertex'`: comportamento invariato (authoring panel).
- View SENZA `.ir`, non edge: tab IR presente, render `<Try><EnableIRPanel view={view} /></Try>`.
- View edge (`isEdge === true`) o con `ir.kind === 'edge'`: tab assente come oggi (nessun authoring edge esistente; l'enable vertex sarebbe sbagliato).
- Viewpoint (isVP) senza ir: tab assente (l'enable è per le view; il caso viewpoint si valuta in una fase futura).

Import di `EnableIRPanel` accanto a quello di `VertexAuthoringPanel`. Nessun altro cambiamento a ViewData.

### 3. Note di comportamento attese (non bug)

- Abilitare l'IR cambia SUBITO il rendering delle istanze che matchano: con seed a metaclassi specifiche passano all'IR default (notazione UML name+attributi); con seed wildcard la view compete a priority 0 con le altre view IR del viewpoint. È la coesistenza by-design (l'IR vince dove matcha); il pannello lo dichiara nell'HelpText.
- La view abilitata NON è delegata al render nativo (`isMigratedDefaultView` è false: manca `migratedFrom`): passa dall'interprete IR. Voluto.
- Il template classico (jsxString) resta intatto sulla view: per le istanze coperte dall'IR è semplicemente inerte. Nessuna rimozione in questa fase (la tab map complessiva è una decisione separata di Alfonso).

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-22_ir_view_enablement_entrypoint.md` §4 (mappa enablement, gap strutturale) e §7 (rischi R1/R2).
- `frontend/src/components/editors/views/data/InfoData.tsx:87` — `classesOptions`: valori misti (objectTypes D-level + `c.id` di classi M2).
- `frontend/src/view/viewElement/view.tsx:222` — `appliableToClasses!: string[]` (commento "class names: DModel, DPackage..." riferito ai tipi D-level; le classi M2 entrano come id, cfr. `InfoData.tsx:144` `[classifier.id]`).
- `frontend/src/components/editors/views/ViewData.tsx:69` — inclusione attuale del tab IR.
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts:25` — `defaultObjectViewIR()`.
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` — `validateIR(viewId, ir)`.
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx:45,70` — seed e scrittura L-proxy di riferimento.
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts` — `classAncestryNames` (il resolver matcha per NOME di metaclasse M2).

## Gate automatici

1. `tsc`: stesso set di errori della baseline (33, diff vuoto).
2. `vitest`: tutti verdi.
3. `npm run build`: exit 0 (solo chunk-warning preesistente).
4. Grep di collisione su `EnableIRPanel`.

## HARD STOP — verifica visiva di Alfonso

1. View classica esistente (senza `.ir`, non edge) selezionata → il tab IR ora appare → contiene il pannello di enable con l'anteprima corretta: se Apply-to ha una classe M2 selezionata, il suo nome è elencato; se Apply-to è vuoto o contiene solo tipi D-level/"anything", l'anteprima dice wildcard.
2. Click su "Abilita authoring IR" → il tab passa immediatamente all'authoring panel; nel tab Advanced la Matching section mostra le metaclassi seedate (o wildcard).
3. Canvas: le istanze della metaclasse seedata passano subito al rendering IR default.
4. Round-trip con B2c-i: restringere/estendere le metaclassi dal tab Advanced funziona sulla view appena abilitata.
5. View edge (`isEdge` attivo): il tab IR NON appare.
6. Viewpoint selezionato: il tab IR NON appare (se privo di ir, come oggi).
7. Reload: `.ir` seedato persiste; la view resta in authoring, nessun errore console.
8. Una view classica NON abilitata continua a renderizzare via template classico, invariata.

## Commit (solo dopo conferma visiva di Alfonso)

Un solo commit feat, con la danza del log per non toccare l'entry treeview della sessione concorrente (stessa procedura di B2c-i: backup, accantona blocco finale, appendi entry B2c-ii, add mirato, commit, ri-appendi, verifica diff):

```
git add frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx frontend/src/components/editors/views/ViewData.tsx docs/claude-code-log.md
git commit -m "feat: authoring IR — Enable IR entry-point in the IR tab (classic view → IR, resolved metaclasses) (phase B2c-ii)"
```

Mai `git add .` / `git add -A`. Nessun push.
