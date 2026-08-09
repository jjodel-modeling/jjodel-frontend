# Prompt Claude Code: discovery read-only, dispatch polimorfico delle righe nei compartment IR (kind `row`)

**Data**: 2026-07-25
**Tipo**: discovery (read-only sul codice sorgente)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Hard stop**: a fine discovery. Nessuna Fase 2, nessuna modifica al sorgente.

## Prima di iniziare

1. Leggere `CLAUDE.md` nella root: fonte di verità sulle convenzioni. Se questo prompt lo contraddice, segnalare il conflitto invece di procedere.
2. Leggere `docs/claude-code-log.md` per il contesto sulle modifiche recenti.
3. Questo prompt non autorizza alcuna modifica al codice sorgente. Qualsiasi fix che sembri ovvio va riportato nel report, non applicato.

## CONTESTO

L'arco authoring IR è completo a livello vertex: le view IR (`irVersion: 'ir-1.0'`) vivono nel campo opzionale `ir` dei `DViewElement`, sono risolte da un resolver dedicato (matching su `metaclasses` + `predicate` + `priority`, specificità esatta > ereditata > wildcard, `exclusive`) e rese da un interprete innestato in `ObjectNode`. I `fieldCompartments` attuali iterano gli slot del self con un vocabolario di segmenti fisso:

```typescript
// stato attuale (post B2a), semplificato
interface FieldCompartmentSpec {
  id: string;
  source: { from: 'attributes' } | { from: 'references' };
  rowFormat: { segments: FieldSegment[] };
  visible?: Conditional<boolean>;
  separator?: boolean;
}
type FieldSegment =
  | { kind: 'name' } | { kind: 'type' }
  | { kind: 'value'; editable?: boolean | { widget: 'text'|'textarea'|'select'|'checkbox'|'color' } }
  | { kind: 'literal'; text: string };
```

Questo modello copre i metamodelli dove gli attributi sono slot del self (es. `State.isFinal`). Non copre i metamodelli che reificano le feature come oggetti. Caso di validazione concettuale (solo per ragionare, niente da implementare): un class diagram con `Class --ownedFeatures (composizione, 0..*)--> Feature` (astratta), `Attribute` sottotipo concreto di `Feature` con slot `type`; le classi ereditano `name` da `namedElement`. Gli "attributi di Person" sono istanze di `Attribute` raggiunte per composizione, non slot di `Person`: `from:'attributes'` mostra solo il `name` della Class; `from:'references'` produce una riga per l'intero slot reference, senza poter scegliere quale reference né formattare le feature dell'oggetto target.

### Proposta architetturale da istruire (decisione di Alfonso a valle, NON da implementare qui)

Dispatch polimorfico stile `DefaultNode`: il compartment dichiara solo su quali children iterare (filtro di kind); ogni child viene reso dalla view risolta per la SUA metaclasse concreta, con lo stesso matching dei vertici, ma in un contesto di rendering nuovo: un kind `row` (view inline testuale, niente shape/badge/resize). Fallback a cascata: row view esatta sul sottotipo > row view ereditata da una superclasse (la specificità ereditata esiste già nel matching) > riga di default built-in (intrinsic name), come fa `DefaultNode` nel classic quando nessuna view matcha.

Bozza concettuale, solo per orientare la ricerca (la forma finale si decide dopo questa discovery):

```typescript
// BOZZA, non schema definitivo
interface RowViewIR {
  irVersion: string;
  kind: 'row';
  metaclasses: string[] | '*';
  predicate?: Predicate;
  priority?: number;
  template: TextSource[];       // segmenti radicati sull'oggetto della riga
  visible?: Conditional<boolean>;
}
// nel compartment, una sorgente nuova accanto a attributes/references:
// { from: 'children'; filter?: Predicate }  -> righe = children matchati, resi dalla loro row view
```

Due contesti di rendering, stesso principio di dispatch: containment > vertex view (mini-nodi, esiste già: graphVertex + `childFilter`, verificato col testbed Machine/State); compartment > row view (righe di testo). Kind distinti: una row view non si rende mai sul canvas, una vertex view mai come riga.

Perimetro già deciso: solo containment children (il caso `ownedFeatures` è composizione); navigazione di reference arbitrarie non-containment e parametri di `Operation` (join annidato) sono fuori scope, slice future.

La discovery serve a mappare il terreno PRIMA della spec e della decisione finale: substrato classic, substrato IR, punti di innesto, rischi critical-zone.

## COSA indagare

### 1. Ricorsione DefaultNode nel classic
Anchor noto: `common/DV.tsx`, pattern `data.children.map(c => <DefaultNode .../>)`. Documentare: come viene risolta la view applicabile a ogni child (quale funzione, dove, con quale ordinamento tra view candidate); qual è il fallback quando nessuna view matcha; se ogni child è un'istanza di componente separata con subscription/binding proprio ai suoi dati (reattività per-componente).

### 2. Substrato IR per i children del graphVertex
Il caso Machine (graphVertex + `childFilter: isKind State`) funziona ed è stato verificato visivamente. Documentare il percorso: i child dentro l'hull sono nodi ReactFlow di prima classe (con soppressione della loro resa top-level altrove) oppure rendering ricorsivo interno al componente del padre? Dove si applica `childFilter`? Chi risolve la view del child e con quale componente viene reso?

### 3. Resolver IR e parametrizzabilità per contesto
Dove vive il matching (pista: `irResolve.ts`): come si enumerano le view candidate del viewpoint attivo, dove si applicano priorità/specificità/exclusive. Valutare (senza implementare) se un filtro per kind/contesto di rendering (oggi di fatto vertex-only) è fattorizzabile senza duplicare la logica di priorità.

### 4. Renderer dei fieldCompartments oggi
Come vengono rese le righe: un map monolitico dentro il componente interprete o un componente per riga? Da dove leggono i valori (slot del self via L-proxy?). Esiste già un punto naturale dove una riga potrebbe diventare un componente legato a un ALTRO oggetto (il child) con subscription propria?

### 5. Reattività cross-object
Stato reale del fix cross-object render del 2026-07-21: leggere `docs/discovery/discovery_2026-07-21_crossobject_render_lproxy.md` e verificare nel log/git se il fix relativo è stato applicato e in quale commit. Documentare il meccanismo di subscription che un componente-riga userebbe per re-renderizzarsi quando cambia l'oggetto child (non il nodo host).

### 6. Chi decide i nodi top-level (ATTENZIONE: critical zone)
Dove si decide quali oggetti M1 diventano nodi sul canvas, e dove è implementato l'assorbimento degli State dentro Machine (non resi top-level). Se la risposta passa per `useJjomSync.ts` o `portDistribution.ts` (critical zone dichiarata): SOLO lettura e mappatura, nessuna ipotesi di modifica disinvolta; riportare il punto di innesto minimo per "sopprimere il nodo top-level degli oggetti resi come row" e il rischio associato.

### 7. Censimento dei siti kind-aware
Elencare con file:riga tutti i punti che discriminano `ir.kind` o assumono i kind esistenti (`vertex`, `graphVertex`, `edge`): `validateIR`/`compileView`, `computeIRSignature`, `ViewData.tsx` (tab IR), `EnableIRPanel.tsx` (seed), `Info.tsx` (montaggio `VertexAuthoringPanel`), resolver, interprete. Output: la lista dei siti che un kind `row` dovrebbe toccare o quantomeno conoscere.

### 8. Semantica dei children M1 e tracce riesumabili
Per una composizione come `ownedFeatures`: i target compaiono in `data.children`? Con quale ordinamento (l'ordine dello slot reference è preservato)? `isKind` risolve l'ereditarietà (Attribute isKind Feature)? Se un oggetto ha più reference di composizione, `children` le fonde: esiste già un modo per distinguere da quale reference proviene un child (utile per il futuro filtro per-reference, non per ora)? Infine: verificare se in `irTypes.ts`/resolver restano tracce del vocabolario tagliato in B2a (`from:'query'`, `from:'features'` con filter, `value.path`, `multiplicity`) o di `row`/`inline`, e riportare cosa c'è davvero.

## DOVE guardare (piste da verificare con grep, non assumere che i path siano esatti)

- Interprete e schema IR: `grep -rn "IRNodeContent\|irResolve\|fieldCompartments\|childFilter" frontend/src` per trovare i file reali; attesi in `components/editor-v2/` e `.../viewpoint/ir/`.
- Innesto nodo: `components/editor-v2/nodes/ObjectNode.tsx`.
- Classic: `common/DV.tsx` e `grep -rn "DefaultNode" frontend/src` per la catena di risoluzione view del classic.
- Authoring: `components/editor-v2/viewpoint/authoring/` (`VertexAuthoringPanel.tsx`, `FieldCompartmentListEditor.tsx`, `FieldSegmentEditor.tsx`), `components/editors/Info.tsx` (montaggio pannello, ~:1185 e ~:1401-1405), `ViewData.tsx`, `EnableIRPanel.tsx`.
- Critical zone dichiarata: `useJjomSync.ts`, `portDistribution.ts` (solo lettura).
- Prior art nel repo: `docs/discovery/discovery_2026-07-21_crossobject_render_lproxy.md`, `docs/discovery/discovery_2026-07-24_shapes_circle_diamond.md` (info strutturali sul sottosistema IR shape).

## Domande a cui il report DEVE rispondere

1. Nel classic, come `DefaultNode` risolve la view di ogni child, qual è il fallback quando nessuna matcha, e ogni child ha subscription propria?
2. Nel substrato IR, i children di un graphVertex sono nodi ReactFlow veri (assorbiti dal top-level altrove) o rendering ricorsivo dentro il padre? Dove avviene l'assorbimento?
3. Il matching di `irResolve` è fattorizzabile per contesto (vertex vs row) senza duplicare la logica di priorità/specificità? Dove si enumerano le candidate?
4. Le righe dei compartment oggi sono un componente per riga o un map monolitico? Cosa manca perché una riga sia un componente legato a un altro oggetto con reattività corretta, e il fix cross-object del 21/07 è landed (commit)?
5. La soppressione top-level per oggetti resi come row passa per la critical zone? Qual è il punto di innesto minimo e il rischio?
6. Lista completa file:riga dei siti kind-aware che un kind `row` toccherebbe.
7. I target di una composizione sono in `data.children` con ordine stabile? `isKind` risolve l'ereditarietà? La provenienza per-reference di un child è distinguibile con meccanismi esistenti?
8. Perimetro di un'implementazione ipotizzabile (SENZA implementarla): elenco file per (a) kind `row` in schema + resolver con contesto, (b) dispatch nel renderer dei compartment con sorgente `children`, (c) soppressione top-level, (d) authoring panel per le row view; per ciascuno rischio stimato, segnalando esplicitamente ogni punto in critical zone. Più le domande aperte per Alfonso.

## Vincoli e output

- **Read-only sul sorgente**: nessuna modifica a file di codice, nessun refactoring, nessun commit di codice.
- **Discovery report OBBLIGATORIO**: salvarlo in `docs/discovery/discovery_2026-07-25_row_view_dispatch.md` (creare la cartella se manca). Contenuto minimo: obiettivo della discovery, file letti/analizzati con path completi, findings con riferimenti file:riga, dipendenze e rischi individuati, domande aperte per Alfonso. L'hard stop non è completo finché il report non è scritto: l'analisi in chat riparte dal report salvato, non dalla memoria della sessione.
- **Log**: aggiungere l'entry a `docs/claude-code-log.md` col formato standard del progetto (tipo `docs`), includendo il nome di questo documento prompt con data e ora.
- **Commit consentito SOLO dei due file docs**: `git add docs/discovery/discovery_2026-07-25_row_view_dispatch.md docs/claude-code-log.md` (mai `git add .`), messaggio `docs: add discovery report for IR row view dispatch`. Nessun push senza go-ahead esplicito.
- **Hard stop** dopo il commit: nessuna proposta implementata, nessuna Fase 2.
