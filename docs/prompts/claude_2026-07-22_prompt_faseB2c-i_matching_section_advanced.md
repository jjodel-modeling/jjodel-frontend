# Prompt Claude Code — Fase B2c-i: Matching section (metaclasses / predicate / priority / exclusive) nel tab Advanced

**Data**: 2026-07-22
**Tipo**: feat (implementazione, discovery già fatta)
**Base**: `docs/discovery/discovery_2026-07-22_ir_view_enablement_entrypoint.md` + ratifiche B2c (chat di progetto)

## COSA

Dare una superficie di editing ai 4 campi di matching top-level di `VertexViewIR` che oggi nessuna UI scrive (discovery, punti 1-3 confermati): `metaclasses`, `predicate`, `priority`, `exclusive`. La casa ratificata è il tab **Advanced** di `VertexAuthoringPanel`, oggi inerte (solo `HelpText`, riga ~227). Basic resta "come appare la view", Advanced diventa "quando si applica".

Decisioni ratificate rilevanti:
- Apply-To resta puramente classico: NON toccarlo, NON renderlo IR-aware.
- La migration `VersionFixer 2.225 -> 2.226` resta wildcard: NON toccarla (critical zone).
- L'entry-point di enablement (view classica → IR) è B2c-ii, prompt separato: fuori scope qui.
- `exclusive` viene esposto con hint onesto sul limite corrente (le view decorative non sono ancora renderizzate dal resolver: `getIRIndex` salta `ir.exclusive === false`).

## DOVE

| File | Azione |
|------|--------|
| `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` | **NUOVO** componente sezione |
| `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` | mount nel blocco Advanced + import |
| `docs/claude-code-log.md` | entry standard, STESSO commit del codice |

**NON toccare**: `ViewData.tsx`, `InfoData.tsx`, `irTypes.ts`, `irCompile.ts`, `irResolveCore.ts`, `irResolve.ts`, `irDefaults.ts`, `VersionFixer.tsx` (critical zone), gli internals di `PredicateBuilder`/`ConditionalEditor`/`PathBuilder`, gli altri editor di `authoring/`. Il barrel `frontend/src/components/ui/index.ts` va toccato SOLO se `Checkbox` o `PredicateBuilder` non risultassero già esportati (verificare con grep prima; se serve l'aggiunta, è un import fix minimale da documentare nel log).

Prima di editare: leggere per intero i due file di codice. Verificare con `grep -r "MatchingSection" frontend/src` che il nome sia libero (verificato in chat il 2026-07-22, riconfermare).

## COME

### 1. `MatchingSection.tsx` (nuovo)

Componente presentazionale, stesso stile immutabile del pannello (nessuno stato proprio sul draft: riceve e ripatcha).

```ts
import type { VertexViewIR, Predicate } from '../ir/irTypes';
import type { PathBuilderFeatures } from '../../../ui';

export interface MatchingSectionProps {
    draft: VertexViewIR;
    patch: (next: VertexViewIR) => void;
    features: PathBuilderFeatures | null;
    featuresHint: string;
    classNames: string[];
}
```

Contenuto, nell'ordine:

**a. Intestazione.** `jj-field-label` "Matching" + `HelpText`: questi campi decidono quando la view si applica; per le view IR sostituiscono il tab Apply-to, che su di esse non ha effetto.

**b. Metaclasses.** `Checkbox` "Tutte le metaclassi (*)", checked quando `draft.metaclasses === '*'`.
- Al check: `patch({ ...draft, metaclasses: '*' })`.
- All'uncheck: `patch({ ...draft, metaclasses: [] })` e, finché la lista è vuota, `HelpText` di avviso: con la lista vuota la view non si applica a nulla.
- Quando `metaclasses` è un array: ogni nome renderizzato come riga con `Button` ghost di rimozione (icona `bi-x`); sotto, un `Select` "Aggiungi metaclasse…" con options = `classNames` meno i già selezionati, che all'onChange appende il nome e si resetta.
- `HelpText` breve: cambiare metaclasse non invalida i path già scritti nei predicate/Conditional; i path non risolvibili sulla nuova metaclasse falliscono silenziosamente a runtime (predicate = no match). Limite noto, nessuna validazione da aggiungere qui.
- Nota comportamento esistente da NON cambiare: le `features` del PathBuilder si risolvono dalla prima metaclasse della lista (`mcs[0]`, memo del pannello con dep `JSON.stringify(draft.metaclasses)`); con più metaclassi le altre non contribuiscono features. Lasciare così.

**c. Predicate (top-level).** `Checkbox` "Applica solo se (predicate)", checked quando `draft.predicate !== undefined`.
- Al check: seed `patch({ ...draft, predicate: forPredicateKind('literal') })` (import da `'../../../ui'`; stesso default già usato da `ConditionalEditor`).
- All'uncheck: rimozione della CHIAVE, non assegnazione di undefined: `const { predicate, ...rest } = draft; patch(rest as VertexViewIR);` (stesso pattern della rimozione del ramo else in `ConditionalEditor`).
- Quando presente: `<PredicateBuilder value={draft.predicate} onChange={(next) => patch({ ...draft, predicate: next })} features={features} featuresHint={featuresHint} classNames={classNames} />`. Le props combaciano già (`PredicateBuilderProps`: `value: Predicate` required, `onChange`, `features`, `featuresHint?`, `classNames`); il wrapper optional è esattamente il checkbox sopra.
- `HelpText`: senza predicate la view si applica a ogni istanza delle metaclassi selezionate.

**d. Priority.** `NumberInput`, value `draft.priority ?? 0`, onChange `patch({ ...draft, priority: n })`. `HelpText`: vince la priority più alta; a parità, specificità (esatta > ereditata > wildcard), poi ordine di dichiarazione.

**e. Exclusive.** `Checkbox` "exclusive", checked `draft.exclusive ?? true`, onChange `patch({ ...draft, exclusive: checked })`. `HelpText` onesto: le view decorative (exclusive disattivato) non sono ancora supportate dal resolver IR; disattivandolo la view sparisce dal canvas (limite corrente).

### 2. `VertexAuthoringPanel.tsx` (edit puntuale)

- Import: `MatchingSection` (locale), `PredicateBuilder` NON serve qui (lo importa MatchingSection); aggiungere `Checkbox` solo se servisse nel pannello stesso (non dovrebbe).
- Nel blocco `{tab === 'advanced' && (...)}` (riga ~227): montare `<MatchingSection draft={draft} patch={patch} features={features} featuresHint={FEATURES_HINT} classNames={classNames} />` PRIMA dell'`HelpText` esistente, che va conservato sotto (aggiornandone la prima frase se ora risulta incoerente, senza riscriverlo).
- Nessun altro cambiamento: il ciclo edit (patch → eager `validateIR` → debounce 300ms → `view.ir = draft`) copre già i nuovi campi senza plumbing aggiuntivo (`compileView` compila anche `predicate` via `compilePredicate`: gli errori emergono nell'`ErrorText` esistente).

### 3. Note di comportamento attese (non sono bug, non "fixarle")

- Editare il matching su una view migrata (`migratedFrom: 'classic-default'`) la fa divergere dalla factory: `isMigratedDefaultView` smette di delegarla al render nativo e passa all'interprete IR. Comportamento voluto (discovery, R1).
- Cambiare `metaclasses` o `priority` cambia l'esito di `resolveIRView` sul canvas in live (discovery, R2): è l'effetto desiderato, verificato nei gate visivi.

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-22_ir_view_enablement_entrypoint.md` — mappa enablement, riusabilità PredicateBuilder (§6), rischi R1-R3.
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts:96-99` — `metaclasses: string[] | '*'`, `predicate?: Predicate`, `priority?: number`, `exclusive?: boolean`.
- `frontend/src/components/ui/PredicateBuilder/predicateDefaults.ts:43` — `forPredicateKind(kind, classNames = []): Predicate`.
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx:111` — memo `classNames`; riga ~227 blocco Advanced.
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` — `getIRIndex` (salta `exclusive === false`), `resolveIRView` (priority > specificità > dichiarazione).
- `frontend/src/components/ui/Checkbox/Checkbox.tsx` — `{ checked, onChange(checked: boolean), label?, disabled?, id? }`.

## Gate automatici (tutti, prima dell'hard stop)

1. `tsc`: stesso set di errori della baseline (33, diff vuoto).
2. `vitest`: tutti verdi (inclusi i 13 dell'area PredicateBuilder).
3. `npm run build`: exit 0 (solo chunk-warning preesistente).
4. Nessun identificatore nuovo in collisione (grep su `MatchingSection`).

## HARD STOP — verifica visiva di Alfonso (progetto "IR Test Bed", vista "IR State")

Consiglio operativo: fare i passi distruttivi (5-6) per ultimi e ripristinare i valori a mano prima del reload, oppure lavorare su una copia della viewpoint.

1. View IR selezionata → tab IR → Advanced: sezione Matching visibile con i valori correnti reali (es. metaclasses `['State']`, predicate della view isInitial popolato dentro PredicateBuilder, priority 10, exclusive attivo).
2. Round-trip: aprire Advanced e richiudere senza toccare nulla → nessun commit, `view.ir` byte-identico.
3. Priority live: portare la priority della view isInitial da 10 a 0 → sul canvas vince la base (priority 1) anche dove prima si applicava isInitial; ripristinare 10 → torna come prima.
4. Predicate live: modificare un valore nel predicate (es. il right dell'eq) → il matching cambia live sul canvas; ripristinare.
5. Toggle predicate: disattivare il checkbox → la view si applica incondizionatamente (live); riattivare → seed `literal true`, poi ripristinare il predicate originale col builder.
6. Exclusive: disattivare → la view sparisce dal canvas (limite dichiarato nell'hint); riattivare → ricompare.
7. Reload (hard refresh): i valori committati persistono; nessun errore console in tutta la sessione di prova.
8. Wildcard: su una view migrata wildcard (se presente nel progetto), uncheck di "Tutte le metaclassi" → lista vuota + avviso; aggiunta di una metaclasse dal Select → la view si restringe live; ripristinare `'*'`.

## Commit (solo dopo conferma visiva di Alfonso)

Un solo commit, scope stretto:

```
git add frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx docs/claude-code-log.md
git commit -m "feat: authoring IR — matching section (metaclasses/predicate/priority/exclusive) in Advanced tab (phase B2c-i)"
```

Mai `git add .` / `git add -A`. Nessun push. Entry di log nel formato standard, stesso commit del codice (come B2b-ii).
