# Discovery — Enablement e matching top-level della IR (metaclasses / predicate / priority / exclusive)

**Data**: 2026-07-22 (redatto 2026-07-23)
**Tipo**: discovery, sola lettura — nessuna modifica al codice
**Fase**: propedeutica a un'eventuale B2c (non ratificata)
**Autore**: Claude Code (Opus 4.8)

---

## 1. Obiettivo

Verificare o smentire, con una ricerca **sistematica su tutto `frontend/src`** (la ricerca precedente era limitata a `editor-v2/viewpoint/` e `editors/`), i 5 punti emersi dalla review di B2b-ii:

1. Nessun controllo UI in `VertexAuthoringPanel.tsx` scrive `draft.metaclasses`.
2. Nessun controllo UI in `authoring/` edita il `predicate` top-level della view.
3. Nessun controllo UI per `priority` / `exclusive` top-level.
4. Nessun punto copia `appliableToClasses` → `ir.metaclasses` all'attivazione della IR (seed sempre `defaultObjectViewIR()` con `metaclasses: '*'`).
5. La "Fase 4 inverse migration" (`migratedFrom: 'classic-default'`) è un concetto pianificato ma non costruito.

In più: localizzare la fixture "IR Test Bed" / "IR State" dei gate visivi, e valutare la riusabilità di `PredicateBuilder`/`ConditionalEditor` per il predicate top-level.

---

## 2. File letti / analizzati (path completi)

- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` — `defaultObjectViewIR()`, `isMigratedDefaultView`, `IR_DEFAULT_OBJECT_VIEW_ID`.
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` — schema `VertexViewIR`, `Predicate`, `Conditional<T>`.
- `frontend/src/components/editor-v2/viewpoint/ir/irDemoFixture.ts` — helper console `window.__jjodelInstallIRDemo`.
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` — pannello di authoring (intero).
- `frontend/src/components/editors/views/ViewData.tsx` — punto di montaggio del pannello (righe 27, 69–74).
- `frontend/src/redux/VersionFixer.tsx` — migration `2.225 -> 2.226` (righe 996–1039) e `2.224 -> 2.225`.
- `frontend/src/ai/viewpointIR/__irviewProbe.ts` — probe throwaway `window.__seedIRViewProbe`.
- `frontend/src/ai/viewpointIR/types.ts` — schema `ViewIR` parallelo (ir-1.0) dell'AI path.
- `frontend/src/ai/viewpointIR/IRView.tsx` — componente runtime consumato solo dal probe.
- `frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx` — props e comportamento.
- `frontend/src/view/viewElement/view.tsx` (rif. riga 1762) — carry-over di `.ir` in `updateDefaultView`.
- `docs/claude-code-log.md` — ultime entry (contesto Fase A/B/B2a/B2b-i/B2b-ii + probe).

**Ricerche sistematiche eseguite** (tutto `frontend/src`, `*.ts` + `*.tsx`):
`defaultObjectViewIR`, `migratedFrom`, `metaclasses:` (scrittura), `\.ir *=`, `kind: 'vertex'`, `predicate|priority|exclusive` in `authoring/`, `test bed|IR State|IRView|InstallIRDemo|seedIRViewProbe`.

---

## 3. Findings per punto

### Punto 1 — VertexAuthoringPanel non scrive `metaclasses` → **CONFERMATO**

`draft.metaclasses` compare in due sole occorrenze, entrambe **in lettura**:
- `VertexAuthoringPanel.tsx:84` — `const mcs = draft.metaclasses;` per risolvere le `PathBuilderFeatures` della metaclasse target.
- `VertexAuthoringPanel.tsx:105` — `[JSON.stringify(draft.metaclasses)]` come dep del `useMemo`.

Il pannello (letto per intero) espone solo: `label`, `shape.form`, `shape.fill`, `shape.border`, `shape.labels[]`, `fieldCompartments[]`, `shape.badges[]`. **Nessun controllo scrive `metaclasses`.** Confermato.

### Punto 2 — nessun editor UI del `predicate` top-level → **CONFERMATO**

Nessuna scrittura di `predicate` in `frontend/src/components/editor-v2/viewpoint/authoring/`. Il tab **Advanced** (righe 227–231) è **inerte**: contiene solo un `HelpText` di copy, nessun controllo. I `ConditionalEditor`/`PredicateBuilder` wireati in B2b-ii operano sui `Conditional<T>` **di campo** (shape.form/fill, label.visible, badge.icon/visible, fieldCompartment.visible), non sul `predicate` top-level della view. Confermato.

### Punto 3 — nessun editor UI di `priority` / `exclusive` top-level → **CONFERMATO**

Nessuna occorrenza di `priority`/`exclusive` in `authoring/`. Il pannello non li espone. Restano ai valori del seed (`defaultObjectViewIR()`: `priority: 0`, `exclusive: true`). Confermato.

### Punto 4 — nessuno copia `appliableToClasses` → `ir.metaclasses` → **CONFERMATO**

Tutti i punti che seedano/creano un IR usano `metaclasses` **hardcoded**, mai derivato da `appliableToClasses`:

| Punto | Come popola `metaclasses` |
|-------|---------------------------|
| `VertexAuthoringPanel.tsx:45` (seed draft) | `defaultObjectViewIR()` → `'*'` |
| `VersionFixer.tsx:1026` (migration) | `defaultObjectViewIR()` → `'*'` |
| `irDemoFixture.ts:31,58` (dev console) | `[metaclassName]` hardcoded |
| `__irviewProbe.ts:51` (dev throwaway) | `[className]` hardcoded |

Nota rilevante su `__irviewProbe.ts`: crea la view impostando **sia** i campi classici Apply-To (`appliableToClasses: ['DObject']`, `jsCondition`, `oclCondition: ''`, `isExclusiveView`, `explicitApplicationPriority`) **sia** `d.ir` con `metaclasses: [className]` — ma le due cose sono indipendenti: `ir.metaclasses` è settato direttamente al nome classe, **non** copiato da `appliableToClasses`. Nessun punto nel repo fa quella copia. Confermato.

### Punto 5 — "Fase 4 inverse migration" → **SMENTITO (è già costruita)**

La inverse migration **esiste ed è attiva** in produzione: `VersionFixer.tsx:1007` metodo `['2.225 -> 2.226']` (versione **2.226**, non 2.216/2.217 come da esempio in CLAUDE.md §3.9). Comportamento (righe 1017–1035):
- Itera tutti i `DViewElement` con `jsxString` non vuoto; skip idempotente se `e.ir !== undefined || e.irLegacyClassic`.
- Se il `jsxString` contiene `CLASSIC_OBJECT_VIEW_MARKER` o `CLASSIC_SINGLETON_VIEW_MARKER` → **`e.ir = { ...defaultObjectViewIR(), migratedFrom: 'classic-default' }`** (riga 1026).
- Se contiene `CLASSIC_VALUE_VIEW_MARKER` o non è un default noto → `e.irLegacyClassic = true` (mai droppato in silenzio).
- Carry-over: `LViewElement.updateDefaultView` preserva `ir`/`irLegacyClassic` attraverso la rigenerazione da version-bump (`view.tsx:1762`), altrimenti la stessa load che applica la migration la cancellerebbe.

**Conseguenza per il matching**: la migration NON popola una metaclasse specifica — usa sempre `'*'`. Il commento di `irDefaults.ts:15` ("Consumed by the Fase 4 inverse migration") è quindi accurato. Il concetto era descritto come "pianificato" nel prompt, ma il codice lo implementa già. La lacuna reale non è l'assenza della migration, ma che **la migration produce solo la wildcard**, coerente col Punto 4.

`isMigratedDefaultView` (`irDefaults.ts:90`) è il complemento: una view con `migratedFrom: 'classic-default'` la cui struttura (normalizzata, escluso `migratedFrom`) è byte-uguale a `defaultObjectViewIR()` viene **delegata** al render nativo di ObjectNode; se l'utente la edita, diverge dalla factory e torna all'interprete IR come view custom.

---

## 4. Punti di enablement/creazione IR trovati (mappa completa)

Ricerca su `\.ir *=` e `defaultObjectViewIR` in tutto `frontend/src`:

1. **`VertexAuthoringPanel.tsx:70`** — `(view as any).ir = draft` — **commit/edit** dell'IR esistente (non crea da zero). Seed = `(view as any).ir ?? defaultObjectViewIR()` (riga 45): se la view non ha già `.ir`, parte dalla wildcard.
2. **`VersionFixer.tsx:1026`** — migration automatica (vedi Punto 5). Unico punto di **creazione in produzione** di `.ir`, sempre wildcard.
3. **`irDemoFixture.ts:106,112`** (`window.__jjodelInstallIRDemo`) — helper **console dev-only** (importato per side-effect da `ObjectNode.tsx:37`). Crea una viewpoint "IR Demo <Metaclasse>" con 2 view: base (`metaclasses: [name]`, priority 1) + flag (`metaclasses: [name]`, `predicate: {op:'eq', left:'$<attr>.value', right:{kind:'boolean',value:true}}`, priority 10, 1 badge). **Non wireato ad alcuna UI.**
4. **`__irviewProbe.ts:92`** (`window.__seedIRViewProbe`) — probe **throwaway dev-only** (gated `import.meta.env.DEV`, ancorato in `index.tsx`). Schema IR **vecchio** (ir-1.0) da `ai/viewpointIR/types.ts`. Da rimuovere con `index.tsx`.
5. **`view/viewElement/view.tsx:1762`** — `if ((v as any).ir !== undefined) (newView as any).ir = (v as any).ir` — **carry-over**, non creazione.

**Nessun** punto di enablement in menu / context-menu / toolbar / dock / redux actions al di fuori dei precedenti. Non esiste alcun handler tipo "enable IR", "create IR view", "abilita IR", "new IR view" nella UI di produzione.

**Come si arriva al pannello (produzione)**: `ViewData.tsx:69` monta `VertexAuthoringPanel` **solo se** `(view as any).ir?.kind === 'vertex'`. Cioè il pannello di authoring **appare esclusivamente su view che hanno già un `.ir` vertex**. In produzione l'unico modo perché una view lo acquisti è la migration `2.225 -> 2.226` (wildcard). Non c'è, in produzione, un pulsante che trasformi una view classica selezionata in IR con una metaclasse specifica: **il gap del Punto 4 è la conseguenza diretta dell'assenza di questo entry-point.**

---

## 5. Fixture "IR Test Bed" / "IR State"

**Non esiste alcun file sorgente** con la stringa "IR Test Bed" o "IR State" (`grep -rni` su tutto `frontend/src` = 0 hit). La viewpoint dei gate visivi B2a/B2b-i/B2b-ii **non è una fixture di codice**: è uno **stato di progetto Redux persistito** (progetto salvato / localStorage), creato da Alfonso.

Il candidato sorgente più vicino è **`irDemoFixture.ts`** (`window.__jjodelInstallIRDemo('State','isInitial')`), che produce:
- view "IR State base" — `metaclasses: ['State']`, form rounded, priority 1;
- view "IR State isInitial" — `metaclasses: ['State']`, `predicate` sull'attributo bool, **1 badge** (isInitial), priority 10.

Ma la vista "IR State" descritta nel gate B2b-ii (log 2026-07-23) ha **2 badge (isInitial/isFinal)** con `Conditional visible` **aperti in Condizionale, predicate pre-popolato + ramo else** — struttura più ricca del demo fixture (1 badge, nessun else). Quindi la fixture dei gate è **hand-authored** (probabilmente seedata col demo fixture e poi editata via il pannello authoring, oppure costruita a mano e salvata), non riproducibile byte-per-byte da un file sorgente.

**Come sono popolati `ir.metaclasses`/`ir.predicate` di quella fixture**: `metaclasses: ['State']` hardcoded (dal demo fixture o a mano — non da `appliableToClasses`); `predicate`/`visible` dei badge scritti a mano/via authoring panel. **Non c'è un seed-of-truth citabile oltre a `irDemoFixture.ts` come meccanismo di seeding iniziale.**

> ⚠️ Sub-rule §5.1 "do not trust fixtures from memory across sessions": la struttura della vista "IR State" qui è dedotta dal log B2b-ii, non riprodotta sul progetto salvato reale. Se B2c dipende dalla sua forma esatta, va riaperto il progetto in app e ispezionato `windoww.store.getState().idlookup` per i DViewElement con `.ir`.

---

## 6. Riusabilità di PredicateBuilder / ConditionalEditor per il `predicate` top-level

**`PredicateBuilder` è direttamente riusabile**, con un solo adattamento (gestione optional). Props (`PredicateBuilder.tsx:152`):

```ts
interface PredicateBuilderProps {
    value: Predicate;                        // NON optional
    onChange: (next: Predicate) => void;
    features: PathBuilderFeatures | null;    // già risolto nel pannello (draft.metaclasses[0])
    featuresHint?: string;
    classNames: string[];                    // già calcolato nel pannello (memo classNames)
}
```

Il tipo `Predicate` consumato è **lo stesso** `irTypes.Predicate` del campo top-level `VertexViewIR.predicate` (`irTypes.ts:96`, `predicate?: Predicate`). `features`, `featuresHint` e `classNames` sono **già disponibili** nel `VertexAuthoringPanel` (sono le stesse props passate ai `ConditionalEditor` di campo). Quindi il wiring nel pannello sarebbe a costo quasi nullo.

**Unico adattamento**: `VertexViewIR.predicate` è `Predicate | undefined`, mentre `PredicateBuilder.value` è `Predicate` obbligatorio. Serve un wrapper sottile:
- un toggle "senza predicato / con predicato" (presenza/assenza = view sempre applicabile vs condizionata);
- al primo enable, seed di un `Predicate` di default — lo stesso pattern che `ConditionalEditor` già usa internamente (`{op:'literal', value:true}`, tramite `predicateDefaults`);
- alla rimozione, riscrivere `draft.predicate = undefined`.

**`ConditionalEditor<T>` NON è lo strumento giusto per il top-level**: serve a editare un `Conditional<T>` (un valore che *diventa* condizionale), non un `Predicate` nudo. Per il `predicate` top-level è `PredicateBuilder` + wrapper optional, non `ConditionalEditor`.

Nota: nel repo esistono **due** dichiarazioni di `Predicate`: la canonica `editor-v2/viewpoint/ir/irTypes.ts` (ir-1.2, quella usata dal pannello e dal resolver) e la parallela `ai/viewpointIR/types.ts` (ir-1.0, solo AI path/probe). `PredicateBuilder` importa la canonica. Nessun rischio di mismatch per il wiring nel pannello.

---

## 7. Dipendenze / rischi individuati

- **R1 — coerenza con `isMigratedDefaultView`**: se B2c aggiunge un editor di `metaclasses`/`predicate`/`priority`/`exclusive` top-level, ogni edit su una view `migratedFrom: 'classic-default'` la fa **divergere dalla factory** → smette di essere delegata al render nativo di ObjectNode e passa all'interprete IR (`irDefaults.ts:90`). Comportamento atteso e già gestito, ma va tenuto presente: cambiare `metaclasses` da `'*'` a `['State']` su una view migrata la "promuove" a custom.
- **R2 — matching e specificità**: portare `metaclasses` da `'*'` a una lista specifica cambia la specificità nel resolver (`resolveIRView`: priority > exact/inherited > ordine di dichiarazione). Un edit incauto può far vincere/perdere una view su un'istanza. Non è critical zone §3.1, ma tocca il matching osservabile.
- **R3 — `VersionFixer` è critical zone §3.1**: qualunque opzione B2c che voglia far popolare alla migration una metaclasse specifica (invece di `'*'`) tocca `VersionFixer.tsx` → richiede Layer Impact Report e go-ahead esplicito. La migration attuale NON va toccata per il solo wiring UI del pannello (che opera su `view.ir` via L-proxy, fuori critical zone).
- **R4 — persistenza fixture**: i gate B2c che dipendono dalla vista "IR State" richiedono il progetto salvato reale; non c'è fixture sorgente da versionare. Rischio di "fixtures from memory" (§5.1).
- **R5 — dev scaffolding residuo**: `__irviewProbe.ts` (+ riga in `index.tsx`) e `irDemoFixture.ts` sono dev-only; `types.ts`/`IRView.tsx` in `ai/viewpointIR/` usano lo schema vecchio ir-1.0. Non interferiscono col pannello di produzione, ma sono superficie morta/parallela da non confondere con l'IR canonico ir-1.2.

---

## 8. Sintesi (verdetto sui 5 punti del prompt)

| # | Affermazione del prompt | Esito |
|---|-------------------------|-------|
| 1 | Nessun controllo UI scrive `draft.metaclasses` | **CONFERMATO** |
| 2 | Nessun controllo UI edita il `predicate` top-level | **CONFERMATO** |
| 3 | Nessun controllo UI per `priority`/`exclusive` top-level | **CONFERMATO** |
| 4 | Nessuno copia `appliableToClasses` → `ir.metaclasses` | **CONFERMATO** |
| 5 | "Fase 4 inverse migration" pianificata ma non costruita | **SMENTITO** — è attiva (`VersionFixer 2.225 -> 2.226`), ma popola solo `'*'` |

**In una riga**: in produzione l'unico creatore di `.ir` è la migration, che emette sempre la wildcard; il pannello authoring edita tutto tranne i 4 campi di matching top-level; nessun entry-point UI trasforma una view classica in IR con una metaclasse specifica. Il gap del Punto 4 è strutturale, non un bug isolato.

---

## 9. Domande aperte per Alfonso (decisione B2c)

1. **Direzione B2c** (tra le 3 opzioni già discusse): (a) estendere Apply-To perché il tab classico piloti anche il matching IR; (b) spostare `metaclasses`/`predicate`/`priority`/`exclusive` dentro il tab IR (pannello authoring); (c) lasciare la lacuna. La discovery indica che (b) ha il costo minore per il predicate (`PredicateBuilder` + wrapper optional, props già in scope), ma non risolve *come* una view acquisisce l'IR con una metaclasse specifica (manca l'entry-point di enablement, §4).
2. **Entry-point di enablement**: serve un modo UI (context-menu view / pulsante in ViewData) per convertire una view classica selezionata in IR con la sua `appliableToClasses` come `metaclasses` di partenza? Oggi esiste solo la migration wildcard + il demo fixture dev-only.
3. **Migration wildcard**: va lasciata a `'*'` (la view migrata è un default a bassa priorità) o B2c prevede una variante che erediti la metaclasse dalla view classica? La seconda tocca `VersionFixer` (critical zone).
4. **Fixture "IR State"**: confermi che la vista dei gate è un progetto salvato hand-authored (2 badge isInitial/isFinal con else) e non riproducibile da sorgente? Se B2c ha gate su di essa, va ispezionata in app.
5. **Schema doppio**: il path `ai/viewpointIR/` (ir-1.0) + probe throwaway va ritirato prima/insieme a B2c, o resta come scaffolding? Non blocca, ma è superficie morta parallela.

---

*Nessuna modifica al codice in questo task. Solo questo report + entry standard nel log.*
