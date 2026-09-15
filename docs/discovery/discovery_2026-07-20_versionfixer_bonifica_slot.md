# Discovery — Bonifica VersionFixer per slot DValue duplicati (salvataggi pre-fix XMI)

**Data**: 2026-07-20
**Branch analizzato**: `alfonso-frontend-jjtl` @ `d1de6d4` (analisi read-only). Ratifiche e prototipo: 2026-07-21 @ `0145ceb00`.
**Tipo**: design di migrazione. Fase 2 su `VersionFixer.tsx` = critical zone: richiede Layer Impact Report e go-ahead esplicito.

## Obiettivo

Progettare la migrazione VersionFixer che bonifica i progetti salvati PRIMA del fix `4811db8` (riuso slot mirage nell'import XMI M1). Residui: (a) slot DValue duplicati per feature (riga vuota + riga valorizzata), (b) pointer figli duplicati nei DValue di containment, (c) radici duplicate in `dModel.objects` (residuo pre-esistente, presente ANCHE nei salvataggi post-fix).

## Finding 1 — Firma esatta della corruzione

**Slot duplicato**: due o più `DValue` con lo stesso `father` (DObject) e lo stesso `instanceof` (meta-feature). Detection: raggruppare i DValue raggiungibili da `DObject.features` per `instanceof`; ogni gruppo con cardinalità > 1 è corrotto. Slot con `instanceof` undefined (schema-less) esclusi.

**Superstite**: lo slot non-mirage valorizzato (`isMirage === false && values.length > 0`). Genesi: il mirage (`_forceConformity` → `addValue(isMirage=true)`, `values: []`) precede lo slot import valorizzato.

**Firma aggiuntiva 1**: id valorizzato doppio in `father.features` (push diretto + azione `'+='` di Constructors.DValue).
**Firma aggiuntiva 2**: figli doppi nei containment (`pets = [c1, c2, c1, c2]`).
**Firma aggiuntiva 3**: radici doppie in `dModel.objects` (push diretto a XMIService.ts:658/679 + azione `'+='` di Constructors.DObject). NON fixata: presente anche post-fix, prodotta da ogni nuovo import.

**Caso Format B (entrambi valorizzati)**: reale, non ipotetico. Le reference non-containment in Format B (elementi nested) producono N slot valorizzati (uno per target) più il mirage. La migrazione fa MERGE dei values, non solo scelta del superstite.

## Finding 2 — Chi punta all'id di uno slot rimosso

1. `father.features` (DObject).
2. `metaFeature.instances` (DAttribute/DReference) — contiene id di DValue, non di DObject. Verificato: `Constructors.DValue` → `setExternalPtr(instanceoff, "instances", "+=")`.
3. Root array `s.values` dello DState.
4. `pointedBy` (formato source `idlookup.<id>.<campo>`).
5. `child.father` dei DObject figli (per gli slot di containment).
6. `DGraphElement.model` (legacy classic, opzionale).

Undo history (`statehistory`) è in memoria, vuota al load: nessuna interazione (la migrazione gira in `SaveManager.load` prima di `LoadAction`).

## Finding 3 — Migrazione `2.226 -> 2.227` (3 fasi, idempotente)

Trasformazione pura DState → DState, prima di `LoadAction`; niente azioni Redux, niente L-proxy (pattern delle migrazioni esistenti).

- **FASE A** — dedup slot per (DObject, meta-feature): dedup `features` per id (Firma 1); raggruppa per instanceof; superstite = Opzione A (slot valorizzato non-mirage); merge dei values dei loser (Format B, dedup pointer); rimozione loser; riordino di `features` secondo l'ordine della metaclasse SOLO sugli oggetti bonificati (cosmetico, zero rischio referenziale).
- **FASE B** — dedup pointer duplicati: `DModel.objects` (radici, Firma 3, anche su salvataggi post-fix); `DValue.values` pointer array (figli containment, Firma 2). Dedup solo se tutti i values risolvono a DObject (mai sui multivalue primitivi).
- **FASE C** — pulizia riferimenti pendenti agli id rimossi (una passata): `s.values`, `metaFeature.instances`, `DGraphElement.model`, `pointedBy` (per secondo segmento del source), reparent di `child.father` loser→survivor.

**Idempotenza**: al secondo run i gruppi hanno cardinalità 1, dedup no-op, `removed` vuoto. Su progetti puliti FASE A è no-op; FASE B deduplica comunque le radici.

## Finding 4 — Rischi

1. `metaFeature.instances` (id di DValue): il riferimento pendente meno ovvio. Coperto da FASE C.
2. `pointedBy`: filtro per secondo segmento, passata singola.
3. Format B multi-slot: senza merge si perderebbero target di reference. Coperto da FASE A.
4. Containment: con Opzione A il superstite è già il padre dei figli via `father`: nessun reparent nel caso tipico (guardia difensiva presente).
5. **Radici duplicate: la migration da sola non basta.** Il push diretto a XMIService.ts:658/679 è ancora nel codice: ogni nuovo import rigenera radici doppie. La Fase 2 include la rimozione dei due push (speculare al fix figli a ~riga 1013). **[FATTO 2026-07-21: rimossi, ecore-io 36/36 verde.]**
6. Progetti misti (salvati a cavallo del fix): detection strutturale, non basata sulla provenienza. No-op sui puliti.

## Finding 5 — Strategia di test

**Fixture fabbricata a mano** (scelta): idlookup minimale con le tre firme + Format B + pointedBy stale + instanceof undefined. **[FATTO 2026-07-21: `frontend/src/redux/__tests__/versionfixer_2227_migration.test.ts`, 12/12 verde.]**

Test a funzione pura: (a) un solo slot per (objectId, featureId); (b) `JSON.stringify(s).includes(removedId)` false (infallibile); (c) merge Format B = unione dei values; (d) doppio run deep-equal (idempotenza); (e) fixture pulita deep-equal (no-op); (f) reorder; (g) dedup radici/figli; (h) instanceof undefined ignorato.

**Smoke in app (Alfonso, localhost, hard refresh)**: (1) progetto sporco pre-fix → una riga per feature; (2) conteggio edge M1 invariato; (3) edit in place aggiorna la riga visibile; (4) save/reopen no-op al secondo load; (5) export XMI identico; (6) progetto pulito log a zero; (7) undo dopo load non riporta i duplicati; (8) import XMI fresco (post fix radici) → `dModel.objects` con ogni radice UNA volta.

## Finding 6 — Perimetro Fase 2

- `frontend/src/redux/VersionFixer.tsx` (metodo `2.226 -> 2.227`, ~80 righe) — CRITICAL ZONE (§3.1): LIR + go-ahead.
- `frontend/src/services/export/XMIService.ts` (rimozione 2 push radici) — NON critical zone. **[FATTO 2026-07-21.]**
- `docs/claude-code-log.md`.

## Ratifiche di Alfonso (raccomandazioni accettate, 2026-07-21)

1. **Superstite**: Opzione A + riordino di `features` secondo la metaclasse (solo sugli oggetti bonificati).
2. **Fix push radici in XMIService** nello stesso giro: sì (fatto in cloud, ecore-io verde).
3. **Fixture**: fabbricata a mano (fatto).
4. **Merge Format B**: dedup dei target pointer sì (EMF garantisce unicità).
5. **Versione**: `2.226 -> 2.227`.

## Nota diagnostica — 6 Transition nel test bed

Il test bed mostra 6 Transition. Se sono due terne con **id di famiglie diverse**, è un **double import** (modello importato due volte → oggetti distinti), NON una duplicazione di radici same-id: la migration di questo report bonifica le radici same-id (Firma 3) ma NON fonde due import distinti. Va verificato in app se i 6 id sono duplicati (stesso id → coperto) o distinti (doppio import → issue separata, probabilmente doppia invocazione dell'import lato UI). Da chiarire prima di attribuire il sintomo alla bonifica.
