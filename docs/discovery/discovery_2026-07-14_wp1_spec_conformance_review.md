# Review — WP1 Livello 0: spec-conformance del diff esistente di ConformanceValidator

**Data**: 2026-07-14
**Tipo**: review read-only di spec-conformance sul diff WP1 già presente nel working tree, + completamento fail-visible (`check_failed`) autorizzato in chat.
**Branch**: `alfonso-frontend-jjtl`
**Scope**: `ConformanceValidator.ts`, `ConformanceTypes.ts`, il test, i due report discovery WP1. Nessun altro file. `ConformanceGuard.ts`, `useConformance.ts`, `ConformanceIndicator.tsx`, il registry `problems/`, i file JjTL untracked: **non toccati**.

> Contesto: WP1 (5 nuovi check) risultava **già implementato** nel working tree (uncommitted, run precedente ~17:41–17:46). Su richiesta (Opzione A) questa è una review read-only del diff esistente contro la checklist, più — poiché testabile in modo pulito — il completamento del contratto fail-visible con una violazione sintetica `check_failed`.

---

## Obiettivo

Verificare che il diff WP1 esistente rispetti la spec, punto per punto della checklist concordata; individuare gap; completare il fail-visible se piccolo e testabile (altrimenti registrarlo come gap WP3). Emettere un verdetto.

---

## File letti / analizzati (path completi)

- `frontend/src/model/conformance/ConformanceValidator.ts` (letto integrale, 1–405 pre-edit)
- `frontend/src/model/conformance/ConformanceTypes.ts` (letto integrale)
- `frontend/src/model/conformance/__tests__/ConformanceValidator.test.ts` (letto integrale, 22 test pre-edit)
- `frontend/src/model/logicWrapper/LModelElement.tsx` (verifica semantica: `extendsChain :2730/:3658`, `get_superclasses`, `inheritedAttributes :2977`, `allAttributes :2991`, `isEnum :1655/:1690`, `literals :4606`)
- `docs/discovery/discovery_2026-07-14_wp1_conformance_gaps_sanity.md` (report di Fase 0 della run precedente: "Gate verdict: PROCEED")
- `docs/discovery/discovery_2026-07-13_validation_infrastructure.md` (discovery di riferimento, Q1/Q7/Q8)
- `git diff HEAD` sui due file conformance (delta pulito: `+172 / -2`)

---

## Esito per punto della checklist

### 1. CHECK 11 — violazioni emesse per-istanza ✅
Post-pass `ConformanceValidator.ts:358-378` (pre-edit): per ogni gruppo di duplicati (`carriers.length >= 2`) itera `for (const c of carriers)` ed emette **una `ConformanceViolation` per istanza**, con `objectId: c.objId` e messaggio che elenca tutte le istanze coinvolte. Test `:207-217` conferma `toHaveLength(2)` con `objectId` `['o1','o2']`. Corretto per i futuri badge per-nodo.

### 2. Chiusura kind-of su `extendsChain` con dedup sui diamanti ✅
CHECK 8 `:324-327`: `isKindOf = targetMeta.id === declaredType.id || (Array.isArray(targetMeta.extendsChain) && targetMeta.extendsChain.some(sc => sc?.id === declaredType.id))`.
- **Transitività**: `extendsChain` è documentato (`LModelElement.tsx:2730`, "list of all super classes (father, father of father, ...)") e implementato come `get_superclasses` (`:3658`) → è la **chiusura transitiva** degli antenati, non i soli genitori diretti. Il multi-livello funziona.
- **Self**: `extendsChain` **non** include la classe stessa → per questo il self è gestito a parte (`targetMeta.id === declaredType.id`). Corretto.
- **Diamanti**: l'uso di `.some()` è un test di esistenza → eventuali duplicati dell'antenato nella catena (diamante) sono innocui; nessuna doppia emissione (una violazione al massimo per `refId`). La "dedup per identità" è quindi soddisfatta by-construction dal confronto per `.id`. ✅
- Test `:87-91` (sottoclasse accettata) e `:93-98` (tipo estraneo flaggato) passano.

### 3. Literal enum letti dal metamodello, non da cache ✅
CHECK 10 `:225-245`: legge `attr.type.isEnum` e `attr.type.literals` **direttamente dall'attributo del metamodello** ad ogni valutazione; nessuna cache. `LClassifier.isEnum`/`LEnumerator.literals` (`LModelElement.tsx:1690/:4606`) sono gli accessor live. Test `:185-192` (literal rimosso → stale) conferma. ✅

### 4. Risoluzione ID-first ✅
- CHECK 1 (preesistente) `:71`: `mmClassById.get(metaClass.id) || mmClassByName.get(metaClass.name)` — ID-first.
- CHECK 8: target risolto per **id** (`objectById.get(refId)`), confronto kind-of interamente per `.id` (`targetMeta.id === declaredType.id`, `sc?.id === declaredType.id`). Nessun confronto per nome. ✅
- CHECK 11: raggruppamento per `attr.id` (identità), non per nome. ✅

### 5. Qualità dei messaggi ✅
Messaggi human-readable in inglese, stile coerente con i preesistenti (`Object "${objName || objId}": ...`). CHECK 11 nomina attributo, valore duplicato e tutte le istanze; CHECK 8 nomina reference, target, tipo del target, tipo atteso. ✅

### 6. CHECK 9b esclude `valueCount === 0` ✅
`:213-214`: `alb > 0 && valueCount > 0 && valueCount < alb`. Il conteggio `valueCount` somma solo valori non-vuoti (`v !== null/undefined/''`), quindi vale 0 esattamente quando scatta CHECK 2 → nessun doppio-report. Test `:151-159` verifica esplicitamente che a 0 valori scatta `missing_required_attr` e **non** `attr_multiplicity_below_min`. ✅

### 7. I 6 check preesistenti sono byte-identici ✅ (con una precisazione onesta)
I sei blocchi che emettono violazioni — CHECK 1 (`:58-82`), CHECK 2 (`:117-139`), CHECK 3 (`:141-173`), CHECK 4&5 (`:262-313`), CHECK 6 (`:342-354`) — sono **byte-identici** all'originale (verificato dal `git diff HEAD`: compaiono solo come righe di contesto, i nuovi check sono inseriti *tra* i blocchi, non dentro).
**Precisazione**: l'unica riga preesistente modificata è il loop di setup `objectIds` (`:41-43`): `if (obj?.id) objectIds.add(obj.id);` → `if (obj?.id) { objectIds.add(obj.id); objectById.set(obj.id, obj); }`. È additiva (aggiunge la mappa `objectById` per CHECK 8) e **preserva** il comportamento di `objectIds`, da cui dipende CHECK 6. Non è uno dei 6 check, è codice di preparazione. Nessun `violationType`/messaggio preesistente è cambiato (l'incoerenza nota CHECK 3 commento `wrong_attr_type` vs valore `type_mismatch` resta com'è, come da spec).

---

## Semantica verificata contro le proxy reali (non solo le fixture)

Le fixture dei test sono plain-object duck-typed (`as any`), quindi la correttezza contro le proxy reali va verificata a parte:
- `allAttributes = ownAttributes ++ inheritedAttributes` (`LModelElement.tsx:2991`); `inheritedAttributes` fa `extendsChain.flatMap(sc => sc.ownAttributes)` (`:2977`) → gli attributi ereditati sono **gli stessi oggetti** (stesso `.id`) della superclasse, non copie. Perciò lo **scope di unicità di CHECK 11** (raggruppa per `attr.id`) copre correttamente classe dichiarante + sottoclassi anche su proxy reali. Idem CHECK 9/9b/10 sono inheritance-aware by construction.
- `extendsChain` transitivo con cycle detection: la catena è iterata anche da `isSubClassOf`/`get_superclasses` in produzione senza loop → la terminazione (cycle-safety) è coerente con l'uso esistente.

---

## Gap trovati

### GAP-1 (noto, candidato WP3) — CHECK 8 non copre il kind-of via `implements` (interfacce)
`isKindOf` considera solo `extendsChain` (superclassi via `extends`). In Jjodel le interfacce sono modellate con `implements`/`implementedBy`, **separati** da `extendsChain`. Conseguenza: una reference il cui tipo dichiarato è un'**interfaccia**, con target che la *implementa* (ma non la estende), verrebbe **falsamente** segnalata `reference_target_type_mismatch` (falso positivo, severity `error`).
- Impatto: falso positivo su modelli validi con reference tipizzate a interfacce; non è una violazione mancata, è una violazione spuria.
- La spec di WP1 scopa CHECK 8 a "né di una sua sottoclasse (kind-of)" → l'implementazione di interfaccia è arguibilmente fuori dal wording "sottoclasse", quindi è una **decisione di scoping** più che un bug. Registrato come gap da chiudere in WP3 (estendere `isKindOf` alla chiusura `implements`/interfaccia + test), oppure da confermare come limite accettato.

### Osservazione (non un gap) — `referencedIds` solo per valori-oggetto con `.id`
CHECK 8 e CHECK 6 raccolgono `referencedIds` solo dai valori-reference che sono oggetti con `.id` (`:276,:282`). Se una reference memorizzasse il target come id-stringa grezza, entrambi lo salterebbero. È **comportamento preesistente condiviso con CHECK 6**, non una regressione WP1. Nessuna azione.

---

## Completamento fail-visible — `check_failed` (implementato, testabile)

Decisione: il catch-path **è** testabile in modo pulito (una fixture plain-object con un getter che lancia trippa deterministicamente un catch per-check) → per istruzione, **implementato** (non registrato come gap).

Modifiche (additive, minimali):
- `ConformanceTypes.ts`: aggiunto `| 'check_failed'` alla union (additivo; nessun rename dei valori esistenti).
- `ConformanceValidator.ts`: in ciascuno dei **4 catch per-check** (CHECK 7 `:96`, CHECK 9/9b/10/11-accumulate `:259`, CHECK 8 `:340`, CHECK 11 post-pass `:378`), mantenuto il `console.warn` (come da tua indicazione: resta) e aggiunta l'emissione di una `ConformanceViolation` `check_failed`, severity `warning`, messaggio che nomina il check e l'errore, `objectId` = l'oggetto in esame (per il post-pass CHECK 11, dove nessun oggetto è in scope, `objectId` = `modelId`).
- Effetto sul roll-up: `check_failed` è `warning` → lo status non può risultare `conformant` quando un check non è stato valutato. Contratto fail-visible completato.
- Test aggiunto (`__tests__/ConformanceValidator.test.ts`, describe "fail-visible (check_failed)"): una classe con getter `abstract` che lancia trippa il catch di CHECK 7 → assert `check_failed` emesso (1), severity `warning`, `objectId` corretto, status ≠ `conformant`.

Nota: il `console.warn` nei catch **non** è strumentazione da strippare (confermato in chat): resta.

---

## Gate: build & test

- **Test**: `npx vitest run src/model/conformance/__tests__/ConformanceValidator.test.ts` → **23/23 passati** (22 preesistenti + 1 nuovo check_failed), 143ms.
- **Typecheck**: `npx tsc --noEmit` → **33 errori = baseline invariata** (stesso conteggio noto; l'unico esempio in coda è `pages/components/Dashboard.tsx:569`, preesistente e non correlato). **Zero errori** nei file conformance toccati.

---

## Verdetto

**PASS.** Il diff WP1 esistente è spec-conforme su tutti e 7 i punti della checklist, corretto anche contro le proxy reali (extendsChain transitivo, allAttributes con id preservati, enum live). I 6 check preesistenti sono byte-identici (unica modifica preesistente: il loop di setup `objectIds`, additivo e behavior-preserving). Il contratto fail-visible è stato completato con `check_failed` (testabile → implementato). Un solo gap sostanziale: **GAP-1** (kind-of via interfacce non coperto in CHECK 8) — registrato per WP3, non bloccante.

**Prossimo passo**: hard stop per la verifica visiva di Alfonso su http://localhost:3001/ (modello con violazioni indotte → dot del tab + tooltip riportano i check nuovi). Commit solo dopo conferma in chat, con staging dei soli file WP1 (`ConformanceValidator.ts`, `ConformanceTypes.ts`, il test, i due report discovery WP1) + entry di log col pattern §6.1. Mai `git add .` (nel working tree ci sono anche il generatore AGENTS.md e il fix trasformazioni, con i loro commit separati).
