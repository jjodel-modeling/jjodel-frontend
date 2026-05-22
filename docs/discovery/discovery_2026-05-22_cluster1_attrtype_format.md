# Discovery — Cluster 1 Phase A: rehydrate OrphanStore (attrType format vs name timing)

**Date**: 2026-05-22
**Branch**: `alfonso-frontend-jjtl` (base: `23f50ab65`)
**Scope**: localizzare root cause della regressione A.4 / A.9 / G.1-rehydrate descritta in `docs/discovery/2026-05-22_coevolution_sanity.md`
**Mode**: read-only + `[diag1]` instrumentation (uncommitted, da rimuovere in Phase B)

---

## TL;DR

L'ipotesi #1 della sanity check ("`attrType` cambiato di formato da un commit successivo a 23f50ab65") **non regge alla bisezione del codice**. Sia il capture (`useOrphanFeatures.ts:101`) sia il rehydrate (`useOrphanFeatures.ts:257`) leggono `dAttr.type` con la stessa espressione (`typeof dAttr.type === 'string' ? dAttr.type : ''`). Il file `useOrphanFeatures.ts` è **diff-zero rispetto al base commit 23f50ab65**. Nessun commit tra base e HEAD tocca `DAttribute.new()`, `DTypedElement()`, `Selectors.getFirstPrimitiveTypes()` o `defaultname()`.

L'ipotesi che ora ha più peso analitico è **#1bis (riformulata) / #4 (nuova)**: il bug non è un mismatch di **format** dell'`attrType`, ma un mismatch di **timing** sull'`attrName`. La signature usata da `useOrphanFeatures` per rilevare i cambi è **id-based** (`${classId}:${attrId}:${attrType}`), volutamente per essere rename-transparent (per evitare il bug storico "undo/attr_0"). Ma la **chiave dell'OrphanStore** è **name-based** (`${classId}::${attrName}::${attrType}`). Conseguenza: il rehydrate scatta una sola volta al momento della creazione del nuovo DAttribute (quando il name è ancora il default `attr_N`), e **non riscatta sul rename successivo** del nuovo attributo verso il nome originale.

L'evidenza empirica richiesta per chiudere la diagnosi (via `[diag1]`) è da raccogliere in due scenari distinti — uno con default-name preservato, l'altro con rename — per discriminare tra:
- **Caso A** (default-name preservato): A.4 PASS atteso → conferma che il bug è il name-timing.
- **Caso B** (con rename): A.4 FAIL atteso → conferma il name-timing come root cause unico.
- **Caso C** (entrambi FAIL): root cause più complessa, da approfondire (regressione vera in qualche sotto-percorso).

---

## 1. Struttura OrphanStore

File: `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts` — **diff-zero da `23f50ab65` a HEAD** (verificato con `git diff 23f50ab65 HEAD --`).

### Entry shape (riga 49-57)
```typescript
interface OrphanAttributeEntry {
    kind: 'attribute';
    classId: string;
    className: string;
    attrName: string;
    attrType: string;
    valuesByObjectId: Map<string, unknown[]>;
    removedAt: number;
}
```

### Storage (riga 60-64)
```typescript
const orphanStore = new Map<string, OrphanAttributeEntry>();

function makeKey(classId: string, attrName: string, attrType: string): string {
    return `${classId}::${attrName}::${attrType}`;
}
```

### Signature usata per detection (riga 184-194)
```typescript
for (const classId of classIds) {
    const dClass = lookup[classId];
    if (!dClass) continue;
    const attrs = dClass.attributes;
    if (!Array.isArray(attrs)) continue;
    for (const attrId of attrs) {
        if (typeof attrId !== 'string') continue;
        const dAttr = lookup[attrId];
        if (!dAttr || dAttr.className !== 'DAttribute') continue;
        const attrType = typeof dAttr.type === 'string' ? dAttr.type : '';
        tuples.push(`${classId}${SIG_FIELD_SEP}${attrId}${SIG_FIELD_SEP}${attrType}`);
    }
}
```

Signature è **id-based** (`classId:attrId:attrType`, no name) — rename-transparent by design.

### Diff key (riga 223-226)
```typescript
function diffAddedTuples(prev: SigTuple[], curr: SigTuple[]): SigTuple[] {
    const prevKeys = new Set(prev.map(t => `${t.classId}${SIG_FIELD_SEP}${t.attrId}`));
    return curr.filter(t => !prevKeys.has(`${t.classId}${SIG_FIELD_SEP}${t.attrId}`));
}
```

Diff considera solo `(classId, attrId)`. **`attrType` non è parte della chiave di diff**: se un attrId appare prima con type vuoto e poi con type set, il secondo cambio NON viene rilevato come "added". Si veda §4.5 per le implicazioni.

---

## 2. Call site di capture

File: `frontend/src/components/editor-v2/sync/canvasToJjom.ts` riga 472-492.

```typescript
export function syncRemoveAttribute(attrId: string, _vertexId: string): void {
    try {
        const lAttr: any = LPointerTargetable.fromPointer(attrId);
        if (!lAttr) return;

        captureAttributeOrphanValues(attrId);  // ← capture PRIMA del delete
        lAttr.delete();                        // ← cascade Dummy.get_delete
    } catch (err) {
        console.warn('[canvasToJjom] Failed to remove attribute:', err);
    }
}
```

L'espressione che produce il valore di `attrType` (dentro `captureAttributeOrphanValues`, riga 101):
```typescript
const attrType: string = typeof dAttr.type === 'string' ? dAttr.type : '';
```
dove `dAttr = lookup[attrId]` (riga 92). `attrType` è quindi una lettura diretta del campo D-layer raw.

---

## 3. Call site di rehydrate (match logic)

File: `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts`.

### Trigger esterno: useEffect a riga 308-331 (interno alla hook)
```typescript
useEffect(() => {
    if (currentSig === lastSigRef.current) return;
    const prev = parseSignature(lastSigRef.current);
    const curr = parseSignature(currentSig);
    const removedClasses = diffRemovedClasses(prev, curr);
    const addedTuples = diffAddedTuples(prev, curr);
    lastSigRef.current = currentSig;
    if (removedClasses.length === 0 && addedTuples.length === 0) return;
    const lookup = store.getState()?.idlookup as any;
    TRANSACTION('editor-v2 attribute co-evolution', () => {
        for (const classId of removedClasses) purgeEntriesForClass(classId);
        if (lookup) {
            for (const { classId, attrId } of addedTuples) {
                tryRehydrate(lookup, classId, attrId);
            }
        }
    });
}, [currentSig]);
```

### Match logic: tryRehydrate (riga 248-286)
```typescript
const attrName: string = dAttr.name ?? '';
const attrType: string = typeof dAttr.type === 'string' ? dAttr.type : '';
if (!attrName || !attrType) return;

const key = makeKey(classId, attrName, attrType);
const entry = orphanStore.get(key);
if (!entry) return;
```

**Espressione di `attrType` identica a quella di capture** (`typeof dAttr.type === 'string' ? dAttr.type : ''`). Quindi una differenza di formato è strutturalmente impossibile, a meno che `lookup[attrId].type` non sia diverso tra il momento del remove e il momento del re-add **per lo stesso attributo concettuale** (cosa che non può accadere perché sono due DAttribute distinti).

Più sottile: il **nuovo** DAttribute ha sempre `type = Pointer_ESTRING` (path UI) o il valore parsato (path Ecore), in entrambi i casi una stringa Pointer_E* o ecore-URI. Stessa cosa per il **vecchio** al momento della capture.

---

## 4. Bisezione git history (dal base 23f50ab65 a HEAD)

### 4.1 useOrphanFeatures.ts — diff zero

```bash
$ git log --oneline 23f50ab65..HEAD -- frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts
(vuoto)

$ git diff 23f50ab65 HEAD -- frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts | wc -l
0
```

**Il file della hook non è cambiato dal commit di nascita** (23f50ab65 del 2026-04-23).

### 4.2 canvasToJjom.ts — `syncAddAttribute` / `syncRemoveAttribute` invariati

`git diff 23f50ab65 HEAD -- frontend/src/components/editor-v2/sync/canvasToJjom.ts` filtrato sulle due funzioni: **nessun cambio**. Le due funzioni sono identiche al base.

### 4.3 api/data.ts — `parseDAttribute` ha tre cambi rilevanti

Sequenza cronologica dei commit che hanno toccato `parseDAttribute` dopo 23f50ab65:

| Commit | Data | Subject | Effetto su `parseDAttribute` |
|---|---|---|---|
| `ad24c4af0` | 2026-05-13 18:53 | fix(ecore-importer): align prefix constants | nessun cambio diretto su parseDAttribute (solo prefix `@` → `-`) |
| **`62fdaf54b`** | **2026-05-14 09:33** | **feat: improve Ecore import diagnostics** | **DECOMMENTA `dObject.type = this.read(json, ECoreAttribute.eType, AttribETypes.EString)`** ← era commentata |
| `86a4e65c3` | 2026-05-14 14:30 | fix: cross-document EDataType alias resolution | non tocca parseDAttribute |
| `f4d59f0dc` | 2026-05-15 00:10 | feat(ecore-exporter): XMI feature flags + nsURI suffix | aggiunge 7 boolean flag (ordered/unique/changeable/derived/transient/volatile/unsettable) come field-write post-costruzione |
| `3fc381ad2` | 2026-05-18 10:23 | feat(ecore-io): W1 quick wins | tocca parseDReference, parseDOperation, parseDParameter; non parseDAttribute |
| `815cbec73` | 2026-05-19 11:30 | feat(ecore-io): W2 EDataType end-to-end | aggiunge parseDDataType helper; non tocca parseDAttribute |

**Il commit puntuale del fix Bug C è `62fdaf54b`** (14/05, non 13/05 come citato nella discovery — drift di data minimo). Tuttavia questo cambio agisce **solo sul path Ecore import**, non sul path UI. E il discovery stesso annota che G.1 (post-import) conferma il bug presente anche **senza** Ecore import, suggerendo che il path UI è quello critico.

### 4.4 classes.ts / LModelElement.tsx — nessun cambio rilevante su `DAttribute.new` / `DTypedElement`

Verificato:
- `DTypedElement()` (classes.ts:847-905) — invariato dal base
- `DAttribute.new()` (LModelElement.tsx:4135-4140) — invariato dal base
- `Selectors.getFirstPrimitiveTypes()` (selectors.ts:157-159) — invariato (zero commit)
- `defaultname()` (classes.ts:1424-1443) — invariato (zero commit)

I commit su `classes.ts` e `LModelElement.tsx` dopo base toccano: `LProject.metamodels/models` getter (`616e94fcd`), `LValue.values` filter (`914fbf4fe`), `DDataType()` constructor (`815cbec73`), un fix vertice/sibling (`f952b60c9`), ecc. **Nessuno modifica la pipeline di creazione DAttribute.**

### 4.5 Implicazione del fix Bug C su useOrphanFeatures (path Ecore)

Il fix Bug C aggiunge un field-write `dObject.type = ...` **post** `DAttribute.new(name, undefined, parent.id)`. Tuttavia tutto avviene durante `Constructors.paused = true` (data.ts:178), quindi le mutazioni sono in-memory e poi dispatchate in batch via `Constructors.persist(parsedElements)` (data.ts:187). Dal punto di vista di `useSelector`, è un **singolo state-change** con type già impostato — **non due fasi separate**. Quindi anche nel path Ecore il diffAddedTuples vede correttamente l'attributo e tryRehydrate scatta una sola volta con type finale.

Conclusione: l'ipotesi #1 originaria ("Bug C ha cambiato il formato di `attrType` post-fix") **non spiega** la FAIL su path UI. L'ipotesi rimane plausibile solo se il path UI ha la stessa lifecycle a due fasi — e l'analisi su `DAttribute.new()` e `DTypedElement(type)` mostra che **non ce l'ha**: la chain `new Constructors(...).DPointerTargetable()...DStructuralFeature().DAttribute().end()` è atomica all'interno di un singolo TRANSACTION wrapped da `Constructors.persist`.

---

## 5. Runtime evidence `[diag1]` — da raccogliere

Diagnostic instrumentation **temporaneamente** inserita in `useOrphanFeatures.ts` (uncommitted). Tre punti:

1. **Capture** (dopo riga 116, prima di `orphanStore.set(...)`): logga `{ classId, className, attrName, attrType, attrTypeType, attrTypeRaw, valuesByObjectIdSize, key }`.
2. **Rehydrate attempt** (dopo riga 257, prima del bail su `!attrName || !attrType`): logga `{ classId, newAttrId, attrName, attrType, attrTypeType, attrTypeRaw, guardBail, lookupKey, storeKeys }`.
3. **Rehydrate match** (dopo `orphanStore.get(key)`): logga `{ key, matched, entryValuesCount }`.

### Scenario di test (da eseguire dall'utente)

**Scenario S1 — default-name preservato** (atteso PASS se hypothesis 1bis è corretta):
1. Project nuovo. Aggiungi classe `A`. **NON rinominare** l'attributo automatico (resta `attr_0`).
2. Crea istanza `a1` di `A`. Imposta `a1.attr_0 = "hello"` via property panel.
3. Rimuovi `attr_0` dalla classe `A`. → osserva `[diag1] capture` con `attrName='attr_0'`.
4. Ri-aggiungi attributo (auto-named `attr_0` again, perché il precedente è stato rimosso). → osserva `[diag1] rehydrate attempt` con `attrName='attr_0'` e `[diag1] rehydrate match` con `matched=true` (atteso).
5. Verifica visiva: il valore "hello" torna in `a1.attr_0`?

**Scenario S2 — con rename** (atteso FAIL se hypothesis 1bis è corretta):
1. Project nuovo. Aggiungi classe `A`. **Rinomina** l'attributo da `attr_0` a `foo` via property panel.
2. Crea istanza `a1`. Imposta `a1.foo = "hello"`.
3. Rimuovi `foo`. → osserva `[diag1] capture` con `attrName='foo'`.
4. Ri-aggiungi attributo (auto-named `attr_0`). → osserva `[diag1] rehydrate attempt` con `attrName='attr_0'` e `[diag1] rehydrate match` con `matched=false`.
5. (Opzionale) Rinomina manualmente il nuovo `attr_0` a `foo`. → **nessun log `[diag1] rehydrate`** atteso (signature id-based non cambia su rename).
6. Verifica visiva: il valore "hello" NON torna (confermato fail).

### Confronto attrType atteso

Sia S1 sia S2 dovrebbero mostrare `attrType` identico tra capture e rehydrate (es. `'Pointer_ESTRING'`). Se invece si osserva un mismatch sull'`attrType`, allora l'ipotesi #1 originale ritorna in gioco e va approfondita.

---

## 6. Diagnosi

### Conclusione di Phase A (pre-runtime)

L'analisi statica del codice elimina con elevata confidenza le ipotesi originali:
- **#1 (format mismatch su `attrType`)**: rigettata. Espressioni di capture e rehydrate identiche, file diff-zero, nessun commit modifica il path di costruzione del nuovo attributo nel path UI.
- **#2 (deps di useOrphanFeatures perse)**: rigettata. Hook diff-zero, deps `[currentSig]` invariate.
- **#3 (cleanup overzelous)**: rigettata. L'unico cleanup è su `modelid` change (linea 332-334), non scatta su remove/re-add di un singolo attributo.

Ipotesi più probabile post-analisi statica, **da confermare runtime con [diag1]**:

**#1bis / #4 — Name-timing mismatch (design limitation, non regressione recente)**

La signature di change-detection è **id-based** (per essere rename-transparent, evitando il bug storico undo/attr_0). La chiave OrphanStore è **name-based**. Quando l'utente:
1. Aggiunge attr `attr_0` (default name)
2. Lo rinomina a `foo`
3. Setta valore su istanza
4. Rimuove `foo` → capture key = `${classId}::foo::Pointer_ESTRING`
5. Ri-aggiunge → nuovo `attr_0` (default again) → tryRehydrate scatta con `attrName='attr_0'` → key `${classId}::attr_0::Pointer_ESTRING` ≠ stored key per `foo` → MISS
6. Se l'utente rinomina manualmente il nuovo `attr_0` a `foo`, la signature id-based **non cambia** → tryRehydrate non riscatta → orphan entry persa per sempre

Questo spiegherebbe perché A.4 / A.9 / G.1-rehydrate falliscono indipendentemente da Ecore import (G.1). Lo scenario S1 (no rename) dovrebbe PASSARE per coerenza.

**Implicazione importante**: questa è una **limitazione di design preesistente dal 23/04**, non una regressione introdotta in un commit successivo. Il "regressione" framing del sanity check è probabilmente errato — A.4 non è mai stato verificato esplicitamente in scenari realistici con rename. Il test del 23/04 era diagnostico (prima dell'implementazione), e la stessa giornata ha visto sia l'analisi sia l'implementazione (`23f50ab65`), senza un test report PASS/FAIL successivo.

### Validazione richiesta

Prima di procedere alla Phase B, è critico che l'utente esegua S1 e S2 e raccolga i log `[diag1]`. Tre possibili esiti:

- **Esito atteso (S1 PASS, S2 FAIL)**: name-timing confermato come root cause unico. Phase B procede con uno dei pattern in §7.
- **Esito sorprendente (S1 FAIL, S2 FAIL)**: c'è un secondo problema oltre al name-timing. La diagnosi va estesa — `[diag1]` darà visibilità su quale guard fallisce (es. attrType mismatch, storeKeys non contiene la chiave attesa, ecc.).
- **Esito sorprendente (S1 PASS, S2 PASS)**: improbabile dato il codice analizzato. Significherebbe che esiste un secondo meccanismo che retry-a il rehydrate al rename — da identificare.

---

## 7. Strategia di fix proposta per Phase B

**Tutte le opzioni assumono S1 PASS / S2 FAIL come esito di validazione (name-timing confermato).**

### Opzione A — Estendere la signature includendo `attrName` (sconsigliata)

Cambia la signature da `${classId}:${attrId}:${attrType}` a `${classId}:${attrId}:${attrName}:${attrType}`. Su rename, signature cambia, hook scatta, tryRehydrate viene riprovato. Risolve S2.

**Rischio**: re-introduce il bug storico undo/attr_0 (citato in `useOrphanFeatures.ts:23-27`). La signature id-based era stata scelta esplicitamente per evitare quel bug. Cambiare richiede rivisitare la genesi del bug e validare che oggi non si ri-manifesti.

### Opzione B — Hook separato che ascolta rename e riprova match (raccomandata)

Pattern analogo a `useM1ReferenceEdges` (citato in CLAUDE.md §3.5): un secondo `useEffect` con deps su una signature **name-only**, che riprova `tryRehydrate` su rename. Mantiene la signature id-based esistente per il path principale.

**Files da toccare**: solo `useOrphanFeatures.ts`. Stima ~30-40 righe aggiunte. Diff chirurgico.

**Pseudo-implementazione**:
```typescript
const renameSig = useSelector((state: any) => {
    // signature based on attrId → attrName mapping for orphans-pending classIds
    const pendingClassIds = new Set([...orphanStore.values()].map(e => e.classId));
    const tuples: string[] = [];
    for (const id in state.idlookup) {
        const elem = state.idlookup[id];
        if (elem?.className !== 'DAttribute') continue;
        if (!pendingClassIds.has(elem.father)) continue;
        tuples.push(`${elem.father}:${id}:${elem.name}`);
    }
    return tuples.sort().join('|');
});

useEffect(() => {
    if (orphanStore.size === 0) return;
    const lookup = store.getState()?.idlookup;
    TRANSACTION('editor-v2 orphan retry on rename', () => {
        // per ogni attributo della classe pendente, riprova tryRehydrate
        for (const classId of new Set([...orphanStore.values()].map(e => e.classId))) {
            const dClass = lookup[classId];
            if (!Array.isArray(dClass?.attributes)) continue;
            for (const attrId of dClass.attributes) tryRehydrate(lookup, classId, attrId);
        }
    });
}, [renameSig]);
```

### Opzione C — Lookup OrphanStore "fuzzy" sul tipo soltanto (sconsigliata)

Su tryRehydrate, se name-based lookup fallisce, fallback a class+type lookup. Risolve la UX ma è imprevedibile quando ci sono più orphan con lo stesso type sotto la stessa classe.

### Opzione D — Persist OrphanStore key per `attrId` invece che `attrName` (sconsigliata)

Catturare la entry sotto la chiave `${classId}::${oldAttrId}::${attrType}` e fare lookup al re-add per **qualunque** entry orphan compatibile per type sotto quella classe. Equivalente a Opzione C, stessi problemi.

**Raccomandazione**: Opzione B (hook separato rename-watcher). Diff chirurgico, isolato, riusa il pattern già esistente nel codice (`useM1ReferenceEdges`). Non re-introduce rischio undo/attr_0. Da committare insieme a un test di regressione esplicito su S2.

---

## 8. Riepilogo file toccati in Phase A

| File | Tipo modifica | Commit-able? |
|------|---------------|--------------|
| `docs/discovery/discovery_2026-05-22_cluster1_attrtype_format.md` | nuovo | Sì (Phase B insieme al fix) |
| `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts` | `[diag1]` temporanei (3 punti) | **NO** — uncommitted, rimuovere in Phase B |
| `docs/claude-code-log.md` | Append entry | Sì (Phase B insieme al fix) |

Nessun altro file toccato.

---

## 9. Phase B — Implementazione (2026-05-22)

### 9.1 Decisioni implementative

**Pattern reattivo scelto**: **B (useEffect con deps array su signature name-based)**.

Motivazione:
- Il file usa già il pattern `useSelector + useEffect` con signature sorted-and-joined (riga 304-365). Pattern B riusa lo stesso approccio.
- L'audit `2026-05-22_claude_md_audit.md` e CLAUDE.md §3.5 citano `useM1ReferenceEdges` come pattern canonico per "supplementary hook downstream del sync principale". Pattern B è coerente con quel template.
- Pattern A (subscribe SetFieldAction su `DAttribute.name`) richiederebbe un middleware Redux non presente nel file — introdurrebbe un pattern reattivo eterogeneo. Rigettato.
- Pattern C (hybrid A+B) — complessità inutile. Rigettato.
- Mantiene la signature pubblica della hook invariata (un solo `useOrphanFeatures(modelid, _nodes)`). I due useEffect sono interni.

**Implementazione**: aggiunto un secondo `useSelector` che calcola una signature **name-based** (`${classId}:${attrId}:${attrName}:${attrType}`) **filtrata sulle sole classi con orphan entry pendente** (`orphanStore.size === 0 → return ''`, scope ridotto per default-case). Aggiunto un secondo `useEffect` con deps `[renameSig]` che, ad ogni cambio del signature, itera le classi pendenti e richiama `tryRehydrate` per ogni attributo. `tryRehydrate` è idempotente: miss → no-op (lazy match, entry persiste), match → consume + restore.

**Lazy match (decisione di scope #1)**: già garantita dal `tryRehydrate` esistente — `if (!entry) return;` (riga 269 post-cleanup) bail-out senza side-effect. Nessuna modifica logica al `tryRehydrate` necessaria.

**Consume on match-success (decisione di scope #3)**: già garantita dal `tryRehydrate` esistente — `orphanStore.delete(key)` a fine match (riga 293 post-cleanup). Niente double-rehydrate.

**Re-armable (decisione di scope #2)**: garantita dal fatto che il rename-watcher fa fire ad **ogni** cambio del renameSig. Sequenza `attr_0 → bar → foo` produce due fire del watcher, il secondo trova match.

**Scope rename-watcher (decisione di scope #5)**: filtrato per `classId` via il set `pendingClassIds` costruito da `orphanStore.values()`. Rename su classi senza orphan pendente non triggera il watcher (renameSig resta '').

**TRANSACTION wrapping**: nessun nuovo TRANSACTION introdotto (vincolo prompt). Il nuovo useEffect chiama `tryRehydrate` direttamente, le SetFieldAction al match sono dispatchate sequenzialmente. Asimmetria conscia con l'effetto sigChange esistente (che batcha in TRANSACTION); documentata in un commento inline. Performance acceptable per metamodelli realistici.

**Pattern di policy CLAUDE.md applicate**: nessuna policy specifica su `useOrphanFeatures` o pattern reattivi nell'audit `2026-05-22_claude_md_audit.md` (verificato Step 0). Riusato il pattern di `useM1ReferenceEdges` come modello implicito.

### 9.2 Build status

✅ `npm run build` verde in 37.95s. Zero errori TypeScript sul file modificato. Warning pre-esistenti su chunk-size (non introdotti dal fix, vedi prompt §4.2 do-not list).

✅ `npx tsc --noEmit` — zero errori su `useOrphanFeatures.ts`. Errori residui sono pre-esistenti (import di static asset `.png`/`.svg` senza dichiarazioni di tipo, non correlati al fix).

### 9.3 Test surface (PASS/FAIL da compilare runtime da Alfonso)

| # | Scenario | Atteso | PASS/FAIL |
|---|----------|--------|-----------|
| A.4 | remove `foo` (con valore) → re-add `foo` stesso tipo | PASS, valore tornato immediato | _da compilare_ |
| A.9 | A.4 con istanze multiple | PASS, valori tornati su tutte le istanze | _da compilare_ |
| A.5 | remove `foo:EString` → re-add `foo:EInt` | PASS, type mismatch rifiuta rehydrate (immutato) | _da compilare_ |
| G.1-rehydrate | Ecore import → remove → re-add | PASS, path identico ad A.4 | _da compilare_ |
| **A.4b** | remove `foo` → re-add `attr_0` → rename a `foo` | PASS, watcher implicito scatta | _da compilare_ |
| **A.4c** | remove `foo` → re-add `attr_0` → rename `bar` (miss) → rename `foo` (match) | PASS, re-armable | _da compilare_ |
| **A.4d** | remove `foo` → re-add `attr_0` → MAI rename | Entry resta orfana fino a class removal. Comportamento accettato, non bug. | _da compilare_ |
| **A.4e** | remove `foo` → re-add `attr_0` → rename `foo` (match, consume) → re-add altro attr → rename a `foo` | NO double-rehydrate. Entry già consumata al primo match. | _da compilare_ |

### 9.4 File modificati

- `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts` (+65 -5):
  - Aggiornato top-comment (lines 23-34) per riflettere la nuova policy rename-watcher
  - Rimossi 3 blocchi `[diag1]` (capture + rehydrate-attempt + rehydrate-match)
  - Aggiunto `useSelector renameSig` (~17 righe)
  - Aggiunto secondo `useEffect` con deps `[renameSig]` (~17 righe)
- `docs/discovery/discovery_2026-05-22_cluster1_attrtype_format.md` (sezione 9 appended)
- `docs/claude-code-log.md` (entry Phase B appended)

### 9.5 Note residue

- **A.4d**: entry orfana persiste finché la classe esiste o l'utente non rimuove l'attr e re-aggiunge con il nome giusto. Comportamento by-design (decisione di scope #1, lazy match). Documentazione utente non in scope di questa Phase B.
- **Asimmetria TRANSACTION**: il primo useEffect wrappa `tryRehydrate` in `TRANSACTION('editor-v2 attribute co-evolution', ...)`; il secondo no, per vincolo "nessun nuovo TRANSACTION introdotto". Conseguenza pratica: al rename-match, le SetFieldAction si dispatchano sequenzialmente invece che batched. Per N istanze rehydrate-by-rename, sono N dispatch invece di 1. Per metamodelli realistici (<100 istanze per attr) la differenza è impercettibile. Da rivalutare se in futuro emerge un caso con migliaia di istanze co-evoluzionate da un singolo rename.
- **Performance del renameSig selector**: itera l'intero `idlookup` ad ogni dispatch Redux. Mitigazione: short-circuit immediato se `orphanStore.size === 0` (il caso comune). Quando ci sono orphan pendenti, costo O(N_lookup) ad ogni dispatch — accettabile dato che `computeSignature` (primary) fa già un'iterazione comparabile.
- **Edge case race watcher vs sigChange**: quando un nuovo DAttribute viene aggiunto in una pending class, **entrambi** i useEffect fire-ano (currentSig E renameSig cambiano). Il primo (sigChange) chiama `tryRehydrate` via `addedTuples`; il secondo (renameSig) chiama anch'esso `tryRehydrate` per tutti gli attr della classe. `tryRehydrate` è idempotente: la seconda chiamata trova `entry` già consumato e fa no-op. Nessun double-fire pratico.
