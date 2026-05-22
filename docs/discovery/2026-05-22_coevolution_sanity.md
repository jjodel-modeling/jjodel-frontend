# Discovery — Co-evolution M2→M1 Sanity Check

**Date**: 2026-05-21
**Branch**: `alfonso-frontend-jjtl`
**Editor under test**: v2 (flow / React Flow)
**Trigger**: sospetta regressione su co-evolution rilevata da Alfonso, di provenienza temporale incerta
**Scope**: spettro completo — attributi, reference, classi, enum, name sync/undo, edge cases temporali
**Outcome**: regressione localizzata + gap strutturali preesistenti mappati

---

## Sintesi esecutiva

La sanity check ha confermato **una regressione vera** (rehydrate degli attributi via OrphanStore non più funzionante) e ha rivelato **un gap strutturale preesistente** (propagazione M2→M1 mancante per le reference su tutti i tipi di modifica eccetto rename). Sono inoltre emersi gap minori (rendering multi-value nel canvas, semantica change-type, propagazione enum overzelous) e comportamenti intenzionali da documentare.

La rivendicazione di "live co-evolution" del paper SoSyM 2025 regge per il dominio degli attributi (dopo fix della regressione) ma **non per le reference**, che oggi supportano la co-evoluzione solo per rename. Questo è materiale comunicabile come limite circoscritto, ma va deciso esplicitamente prima del prossimo deliverable pubblico.

---

## Quadro consolidato — Cluster causali

### 🔴 Cluster 1 — Regressione su rehydrate OrphanStore (attributi)

**Casi**: A.4, A.9, G.1-rehydrate

**Comportamento osservato**:
- A.3 (capture al remove con valore) PASS
- A.4 (re-add stesso nome stesso tipo, atteso rehydrate) FAIL — il valore non viene ripristinato
- A.9 (rehydrate per istanze multiple) FAIL
- G.1 conferma il bug è riproducibile anche dopo import Ecore: rename/delete/re-add funzionano nel path M2→M1, ma il valore non torna

**Diagnosi**:
- Path indipendente da Ecore import (G.1)
- Path indipendente da JjScript (G.3 PASS)
- Path indipendente da supertype/inheritance (C.5 PASS)
- **Localizzazione**: logica di match in `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts`. La chiave a 3 elementi `{classId, attrName, attrType}` non matcha più tra orphan entry catturata al remove e nuovo DAttribute creato al re-add.

**Ipotesi sulla causa**:
1. **Più probabile**: il formato di `attrType` è stato modificato in un commit successivo al `23f50ab65` (es. da name string a pointer reflection o viceversa). Sospetto: B.3.2 (commit del 13/05) ha toccato `parseDAttribute` e i tipi reflection.
2. Auto-populate deps di `useOrphanFeatures` perse in un refactoring di `useJjomSync`.
3. Cleanup overzelous dell'OrphanStore (es. su re-render con `modelid` flicker).

**Scope fix stimato**: 1 prompt Phase A (discovery, ~15 min) + 1 prompt Phase B (fix, ~30-60 min). Singolo file, ~10 righe di codice.

---

### 🔴 Cluster 2 — Gap strutturale: propagazione M2→M1 per reference

**Casi**: B.2, B.3, B.4, B.8, B.9, B.12

**Comportamento osservato**:
- B.2: remove reference → in M2 `references.size === 0`, in M1 `a1.bs` continua a esistere
- B.3: remove reference con target → slot e edge restano in M1
- B.4: re-add della reference rimossa → nessun rehydrate (atteso, non esiste OrphanReferenceStore)
- B.8/B.9: cambio cardinalità in M2 non propaga a M1
- B.12: cambio type della reference (`A→B` diventa `A→C`) → l'edge in M1 resta ancorato al target originale

**Diagnosi**:
- L'equivalente delle regole 2a/2b del 23/04 (delete attribute → cleanup slot M1) **non esiste per le reference**.
- B.5 (rename) PASS conferma che la propagazione id-identity esiste (DReference.id invariato → lo slot si rinomina trasparentemente).
- Il pattern reattivo basato su **structural change** (delete, change cardinality, change type) **non è implementato**.

**Origine**: non regressione, gap preesistente. La sessione del 23/04 ha implementato le regole 2a/2b solo per gli attributi e il filone non è mai stato esteso. Tracciato implicitamente nella memoria (`useOrphanFeatures` cita attributi, nessun equivalente per reference).

**Scope fix stimato**: discovery architetturale richiesta. Possibile pattern: estensione di `useOrphanFeatures` con un secondo store `OrphanReferences` con signature `{classId, refId, refType, cardinality}`. Oppure introduzione di un handler dedicato `useReferenceCoevolution`. Decisione architetturale da prendere in sessione dedicata.

---

### 🔴 Cluster 3 — Vincoli M2 non reattivi su instantiability

**Casi**: B.6

**Comportamento osservato**:
- B.6: imposto `containment=true` su una reference `A.children : B`. La classe `B` dovrebbe perdere la sua istanziabilità autonoma (può esistere solo come child di `A`). Invece `B` continua a essere istanziabile come root.

**Diagnosi**: vincolo M2 (containment implica non-rootabilità del target) non propagato come segnale reattivo all'UI di creazione istanze.

**Note**: C.8 (toggle abstract con istanze) dimostra che il pattern **vincolo M2 → blocco UI** esiste già in altri contesti ("Standalone ha istanze" come messaggio di errore). Manca l'analogo per containment.

**Scope fix stimato**: medio. Necessario decidere se questa è una **regola reattiva** (target di containment perde istanziabilità ovunque) o una **regola contestuale** (target di containment può essere istanziato in altri contesti se non c'è ambiguità di owner). Spec decision pendente.

---

### 🟠 Cluster 4 — Rendering canvas non gestisce slot multi-valued

**Casi**: A.12

**Comportamento osservato**:
- Property panel mostra tutti i valori (D-layer OK)
- Canvas (ClassNode in v2-flow) mostra e permette di editare solo il primo valore

**Spec confermata**: first-wins è accettabile per il canvas, **con indicatore visivo** (badge `[+N]` o icona) che segnala altri valori nascosti.

**Scope fix stimato**: piccolo. Modifica di `ClassNode` (o componente equivalente) per renderizzare badge quando `DValue.values.length > 1`. ~20 righe.

---

### 🟠 Cluster 5 — Semantica change-type degli attributi

**Casi**: A.11

**Comportamento osservato**:
- Stored value resta `"hello"` dopo cambio type da EString a EInt
- Al focus, widget mostra default `0` (interpretazione del nuovo tipo sul valore vecchio)
- D/L discrepancy: D-layer non riflette quello che L-layer mostra

**Spec confermata**: **coerce best-effort**. `"123" → 123` per EInt, `"hello" → 0` (fallback al default). Stored value e widget devono essere coerenti dopo coercion.

**Scope fix stimato**: medio. Necessario hook `useAttributeTypeCoevolution` che intercetta cambio type, applica coercion a tutti i DValue esistenti, scrive il risultato in D-layer. Da decidere se il valore non-coercibile va in OrphanStore (per ripristino in caso di revert del type change) o viene perso. Indicativamente ~50 righe.

---

### 🟠 Cluster 6 — Spec aperta cardinalità multi → mono

**Casi**: A.13, B.9

**Comportamento osservato**: first-wins (i valori extra vengono droppati silenziosamente).

**Spec pendente**: decidere se serve warning all'utente al momento della modifica. Coerentemente con A.12, sarebbe sensato fornire un feedback visivo che valori esistenti verranno persi.

**Scope fix stimato**: piccolo se la spec finale è "first-wins silenzioso" (nessun fix necessario, già il comportamento attuale). Medio se serve un dialog di conferma o un warning post-modifica.

---

### 🟠 Cluster 7 — Propagazione enum overzelous

**Casi**: D.4

**Comportamento osservato**: aggiungere un literal a un enum **svuota** i valori esistenti delle istanze che usano quell'enum (anche se i valori esistenti sono ancora validi nel nuovo set).

**Diagnosi**: probabile invalidazione globale dei DValue con type uguale all'enum modificato, anziché diff incrementale del literal set.

**Scope fix stimato**: piccolo. Cambio della logica di reazione M2-enum → DValue da "invalida tutti" a "invalida solo quelli con literal rimosso".

---

### 🟡 Cluster 8 — UX gap: eOpposite editing

**Casi**: B.10, B.11

**Comportamento osservato**: feedback utente "non è chiaro come definire un eOpposite".

**Diagnosi**: il data layer supporta eOpposite (W1 BL1 committata il 17/05 lo certifica I/O), ma il path UI per definirlo via Properties panel o context menu non è scopribile.

**Scope fix stimato**: piccolo come UI work (campo dropdown in Properties panel per selezionare la reference opposite tra le candidate del classe target). Decidere se questa è priorità o gap dichiarabile.

---

### 🟡 Cluster 9 — Ctrl+Z keystroke binding

**Casi**: E.3 (riformulato), per induzione E.4

**Comportamento osservato**:
- Ctrl+Z non revoca create attribute
- Cliccando l'icona undo nell'editor, l'azione viene revocata correttamente
- L'handler di undo **funziona**; è il **listener del keystroke** che non aggancia

**Origine**: probabile regressione nel keyboard event handling, oppure conflitto di focus (il listener Ctrl+Z viene catturato da un altro componente).

**Note**: riformula il bug pre-esistente del 23/04 "Ctrl+Z su create non funziona". Lo stato non è quello che si pensava: il sistema undo è OK, manca solo il binding del tasto.

**Scope fix stimato**: molto piccolo. Da diagnosticare in `useKeyboardShortcuts` o equivalente. Possibile fix in poche righe.

---

### 🟡 Cluster 10 — Feature flags M2-only senza semantica M1

**Casi**: A.14 (`derived`), A.15 (`iD`)

**Comportamento osservato**: i flag sono scrivibili in M2 (B.3.2 li ha cablati nell'Ecore I/O) ma non hanno effetto sulle istanze.

**Diagnosi**: gap mai chiuso, **non regressione**. La semantica M1 di questi flag (`derived` → readonly e computed, `iD` → unique validation) non è implementata.

**Scope fix stimato**: medio-alto. Richiede:
- Per `derived`: implementare logica di computazione (probabilmente JjEL expression) e bloccare editing del widget
- Per `iD`: implementare validazione di unicità con feedback visivo

Decidere se dichiarare come "not yet supported" o pianificare implementazione.

---

### 🟢 Cluster 11 — Comportamenti intenzionali da documentare

**Casi**: C.3 (orphan instances al delete classe), C.8 (blocco abstract con istanze), D.5 (blocco remove literal isolato, solo remove enum supportato)

**Diagnosi**: non sono bug, sono comportamenti difensivi del tool. Vanno documentati esplicitamente nei docs per evitare che gli utenti li interpretino come malfunzionamenti.

**Spec aperte**:
- C.3: serve un indicatore visivo (warning icon) sulle istanze orphan? Spec pendente.
- D.5: l'operazione "remove literal" deve essere supportata in futuro o resta come gap? Spec pendente.

---

## Risultati completi grezzi

### Sezione A — Attributi

| # | Modifica | Esito | Note |
|---|---|---|---|
| A.1 | Add attribute | ✅ PASS | |
| A.2 | Remove attribute (slot vuoto) | ✅ PASS | |
| A.3 | Remove attribute (con valore) — capture | ✅ PASS | OrphanStore capture funziona |
| A.4 | Remove + Re-add (rehydrate) | ❌ FAIL | Il valore non viene ripristinato — **regressione** |
| A.5 | Remove + Re-add con type diverso | ✅ PASS | Type mismatch correttamente rifiutato |
| A.6 | Rename attribute | ✅ PASS | id-identity funziona |
| A.7 | Add via context menu | N/A | Path non implementato — rimosso da scope |
| A.8 | Add via ClassNode shortcut | N/A | Mai implementato |
| A.9 | Rehydrate per istanze multiple | ❌ FAIL | Stessa root cause di A.4 |
| A.10 | Ereditarietà attributi (sottoclassi) | ✅ PASS | |
| A.11 | Change attribute type | ⚠️ BUG | Stored resta vecchio, widget mostra default. Spec: coerce best-effort |
| A.12 | Cardinalità `[0..1] → [0..*]` | ⚠️ BUG | Canvas mostra solo primo valore. Spec: first-wins + badge `[+N]` |
| A.13 | Cardinalità `[0..*] → [0..1]` | ⚠️ BUG | First-wins implicito. Spec: decidere warning |
| A.14 | Toggle `derived` | ⚠️ GAP | Flag M2-only, nessuna semantica M1 |
| A.15 | Toggle `iD` | ⚠️ GAP | Flag M2-only, manca validazione unicità |

### Sezione B — Reference

| # | Modifica | Esito | Note |
|---|---|---|---|
| B.1 | Add reference | ✅ PASS | |
| B.2 | Remove reference (slot vuoto) | ❌ FAIL | M2 OK (`references.size === 0`), M1 invariato |
| B.3 | Remove reference (con target) | ❌ FAIL | Slot e edge restano in M1 |
| B.4 | Remove + Re-add | ❌ FAIL | Eredita da B.3, nessun rehydrate per reference |
| B.5 | Rename reference | ✅ PASS | id-identity funziona |
| B.6 | Toggle containment `false → true` | ❌ FAIL | Classe target resta istanziabile autonomamente |
| B.7 | Toggle containment `true → false` | ✅ PASS | |
| B.8 | Cardinalità `[0..1] → [0..*]` | ❌ FAIL | M2 OK, M1 invariato |
| B.9 | Cardinalità `[0..*] → [0..1]` | ❌ FAIL | M2 OK, M1 invariato |
| B.10 | Add eOpposite | ⚠️ UX | Non è chiaro come definirlo via UI |
| B.11 | Remove eOpposite | ⚠️ UX | Idem |
| B.12 | Change reference type | ❌ FAIL | Edge in M1 resta ancorato al target originale |

### Sezione C — Classi (ridotta)

| # | Modifica | Esito | Note |
|---|---|---|---|
| C.3 | Remove class con istanze | 🟢 INTENZIONALE | Orphan instances generate, non cancellate |
| C.4 | Rename class | ✅ PASS | |
| C.5 | Add supertype con attr ereditato | ✅ PASS | `d1` mostra `foo` ereditato e `bar` aggiunto post-hoc |
| C.8 | Toggle abstract con istanze | 🟢 INTENZIONALE | Errore difensivo: "Standalone ha istanze" |

### Sezione D — Enum (ridotta)

| # | Modifica | Esito | Note |
|---|---|---|---|
| D.4 | Add literal | ⚠️ BUG | `i1.c` viene svuotato (invalidazione overzelous) |
| D.5 | Remove literal usato | 🟢 INTENZIONALE | Operazione bloccata, supportato solo remove enum |

### Sezione E — Name sync e undo (ridotta)

| # | Caso | Esito | Note |
|---|---|---|---|
| E.1 | Rename via Info panel | ✅ PASS | |
| E.3 | Ctrl+Z su create attribute | ⚠️ BUG | Keystroke binding non aggancia; click su icona funziona |

### Sezione G — Edge cases (ridotta)

| # | Caso | Esito | Note |
|---|---|---|---|
| G.1 | Modifica M2 dopo import Ecore | ⚠️ MIXED | Rename/delete/add OK; rehydrate FAIL (conferma A.4 indipendente da Ecore path) |
| G.3 | Modifica M2 dopo JjScript | ✅ PASS | Path JjScript+UI coerente |
| G.5 | Multi-package | NON TESTATO | Saltato in tabella ridotta |

---

## Backlog di fix prioritizzato

### P0 — Da fixare prima del prossimo deliverable pubblico

1. **Rehydrate OrphanStore (Cluster 1)** — regressione vera, scope chirurgico
   - Stima: 1-2 ore (1 prompt discovery + 1 prompt fix)
   - File principale: `frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts`
   - Test di verifica: A.4, A.9, G.1-rehydrate

2. **Propagazione M2→M1 reference structural changes (Cluster 2)** — gap critico
   - Stima: 1-2 giorni (discovery architetturale + design + implementazione)
   - Decisione architetturale: OrphanReferenceStore vs handler diretto
   - Test di verifica: B.2, B.3, B.4, B.8, B.9, B.12

### P1 — Importanti ma non bloccanti

3. **Ctrl+Z keystroke binding (Cluster 9)** — fix piccolo, alto impatto UX
   - Stima: 30 min
   - Test di verifica: E.3, E.4

4. **Canvas multi-value rendering (Cluster 4)** — badge `[+N]` su slot multi-valued
   - Stima: 2 ore
   - Test di verifica: A.12

5. **Coerce on type change (Cluster 5)** — D/L coerenza dopo cambio type
   - Stima: mezza giornata
   - Test di verifica: A.11

6. **Vincolo containment → instantiability (Cluster 3)** — riusa pattern esistente da C.8
   - Stima: mezza giornata
   - Test di verifica: B.6

### P2 — Quality of life

7. **Propagazione enum non-overzelous (Cluster 7)**
   - Stima: 2 ore
   - Test di verifica: D.4

8. **eOpposite editing UI (Cluster 8)**
   - Stima: 1 giornata
   - Test di verifica: B.10, B.11

### P3 — Decisioni di scope

9. **Cardinalità multi → mono warning (Cluster 6)** — decidere se serve dialog di conferma
10. **C.3 orphan visual indicator** — decidere se serve warning visivo su istanze orphan
11. **derived/iD semantica M1 (Cluster 10)** — decidere se implementare o dichiarare come limite

---

## Spec decisions chiuse in questa sessione

- **A.11 change type**: coerce best-effort (`"123" → 123`, fallback al default)
- **A.12 multi-value canvas**: first-wins + badge `[+N]`
- **A.13 multi → mono**: first-wins, warning ancora da decidere

## Spec decisions ancora aperte

- B.6 containment toggle: regola reattiva globale vs contestuale?
- B.12 type change: target droppati o catturati in OrphanReferenceStore?
- C.3: warning visivo su orphan instances?
- D.5: literal removal supportato in futuro o gap permanente?
- Cluster 10: derived/iD da implementare o da dichiarare come limite?

---

## Implicazioni per il paper SoSyM 2025 e deliverable futuri

### Rivendicazione "live co-evolution" — stato reale

| Dominio | Stato dopo fix Cluster 1 | Note |
|---|---|---|
| Attributi: add/remove/rename | ✅ Full | |
| Attributi: rehydrate al re-add | ✅ Dopo fix | Era la regressione |
| Attributi: change type | ⚠️ Partial | Dopo fix Cluster 5 |
| Attributi: change cardinality | ⚠️ Partial | Canvas first-wins, panel full |
| Reference: rename | ✅ Full | |
| Reference: add/remove/change | ❌ Not supported | **Gap Cluster 2** |
| Class: add/rename | ✅ Full | |
| Class: supertype add/inheritance | ✅ Full | C.5 PASS |
| Class: remove con istanze | ✅ Orphan (intenzionale) | |
| Enum: literal add | ⚠️ Buggy | Cluster 7 |
| Enum: literal remove | ❌ Not supported (blocked) | Intenzionale |

### Comunicazione raccomandata

Per il MODELS 2026 demo paper e i prossimi deliverable, comunicare:
- "Co-evolution is fully supported for attributes and class structure (rename, supertype, instance management)."
- "Reference co-evolution currently supports rename; structural changes (cardinality, type, containment, removal) are planned for the next iteration."
- Evitare la formula generica "live co-evolution of metamodels and models" senza qualificare il dominio.

---

## Note metodologiche

### Cosa è andato bene in questa sanity check

- **Tabella stratificata per dimensione** (attributi → reference → classi → enum → name sync → edge cases) ha permesso di isolare i cluster causali invece di mescolare gap eterogenei.
- **Test ridotti su sezioni C/D/E/G** sono stati sufficienti per il quadro diagnostico: non era necessario coprire tutto.
- **G.1 post-import Ecore** è stato il test più informativo della sessione: ha smentito l'ipotesi che la regressione fosse legata a B.3.2.

### Cosa è emerso come metodo da riusare

- Test sull'editor v2 hanno scoperto la regressione, ma **l'editor classic non è stato testato**. Per la prossima sanity check sarebbe utile fare un sample anche sul classic per confermare/escludere divergenze.
- Tutti i test del 23/04 erano focalizzati su attributi. **Il pattern "test esteso a reference + class + enum" deve diventare standard** per ogni filone di co-evolution.

---

## Prossime azioni

1. Committare questo discovery in `docs/discovery/` come `docs(coevolution):` per tracciare il backlog.
2. Aprire chat dedicata per il fix di Cluster 1 (regressione rehydrate).
3. Aprire chat separata per design architetturale di Cluster 2 (gap reference). Non mescolare le due.
4. Chiudere le spec decisions aperte prima di pianificare P2/P3.
5. Bumpare la sessione di paper-PI sul wording della rivendicazione live co-evolution prima del prossimo deliverable.
