# Audit binding JjTL: perché gli attributi a volte non arrivano sul target

**Data**: 2026-07-05
**Branch**: `alfonso-frontend-jjtl` @ 68301797c + working tree
**Sintomo riportato**: binding di attributi che a volte non funzionano (attributi non copiati nel modello target).
**Scope**: pipeline completa di esecuzione trasformazione (lettura sorgente, valutazione, scrittura target). Solo lettura, nessuna modifica al codice.
**Esito**: 11 finding. Due bug P0 nel write-back di ProjectEditor spiegano da soli la maggior parte dei casi "a volte sì, a volte no". L'executor in sé (two-pass, trace, cross-type resolution) è sostanzialmente corretto.

---

## 1. La pipeline dei binding (3 stadi)

Un binding `attr := expr` attraversa tre stadi. Il valore può perdersi in ognuno dei tre, sempre in silenzio (warning in console, nessun errore utente).

### Stadio A: lettura del modello sorgente
`ProjectEditor.tsx` righe 1303-1432 (`handleExecuteTransformation`). Ogni LObject del modello sorgente viene appiattito in un plain object: `{id, name, className, [featureName]: valore, _containerId}`.

- I valori vengono letti dal D-layer raw (`feature.__raw.values`), non dai getter L (riga 1385).
- Valori `null` e stringa vuota sono filtrati; feature senza valori diventa `null` (righe 1393-1402).
- Ogni stringa che inizia con `Pointer` viene incapsulata come `{ __ref: pointerId }` (`wrapIfRef`, riga 1248). Questo vale per le reference ma anche per i literal di enum salvati come Pointer (vedi F3).

### Stadio B: valutazione (executor)
`src/jjtl/executor/executor.ts`. Two-pass: Pass 1 crea i target vuoti e popola il trace (righe 452-475, 798-998); Pass 2 valuta i binding con il trace completo (righe 1005-1030, 1230-1309). Il valore valutato passa per `applyCrossTypeResolution` (riga 2178): i `{__ref}` vengono risolti nel trace (`resolveRefById`, riga 2322) e i target risolti vengono marcati `{ __ref_result: true, targets: [...] }` (`wrapIfTargetReference`, riga 2189). Il risultato finisce su un plain object: `targetInstance[targetAttribute] = value` (riga 1279).

### Stadio C: write-back nel modello Jjodel
`ProjectEditor.tsx` righe 1519-1828.

- STEP 6 (righe 1572-1663, dentro TRANSACTION): crea i DObject; gli attributi vengono accodati in `pendingAttributeSets` solo se passano una whitelist costruita da `targetClass.attributes` (riga 1623); le reference (`__ref_result`) vanno in `pendingReferenceSets` (riga 1642).
- STEP 8 (righe 1722-1766, `setTimeout` 1000ms): trova l'oggetto per NOME via LModel proxy e scrive con `lObject['$'+attrName].value = v` (righe 1750-1752).
- STEP 8b (righe 1777-1822): scrive le reference con `setValueAtPosition(i, id, {isPtr: true})`.

---

## 2. Findings

| ID | Priorità | Stadio | Sintesi | Confidenza |
|----|----------|--------|---------|------------|
| F1 | P0 | C | Whitelist senza attributi ereditati: binding su attributi della superclasse droppati | Certa |
| F2 | P0 | C | STEP 8b annidato nel ramo `pendingAttributeSets.length > 0`: reference mai scritte se non ci sono attributi | Certa |
| F3 | P1 | A | Enum salvati come Pointer al literal diventano `{__ref}` e si risolvono a `null` | Alta |
| F4 | P1 | B | Navigazione attraverso reference (`ref.attr`) valuta su `{__ref}` opaco e produce `null` | Certa |
| F5 | P1 | C | Lookup per nome in STEP 8/8b: nomi duplicati scrivono sull'oggetto sbagliato o perdono attributi | Alta |
| F6 | P2 | C | `setTimeout(1000)` fisso: su modelli grandi il commit Redux può non essere arrivato, oggetti non trovati | Media |
| F7 | P2 | C | Attributi multi-valore scritti con `feature.value = array`: l'array finisce in `values[0]` | Alta |
| F8 | P2 | B | Array di reference con un elemento non risolto (null): l'intera reference non viene wrappata e si perde | Certa |
| F9 | P3 | A/C | Stringa vuota filtrata in lettura; `null` skippato in scrittura: impossibile copiare '' o azzerare | Certa |
| F10 | P3 | B | Attributi sorgente omonimi dei binding di contesto (`data`, `source`, `parent`, `classes`, `instances`, `self`, `it`) | Media |
| F11 | P3 | B/C | Oggetti creati da `forall`/object creation mai materializzati come DObject; propName euristico | Alta |

### F1 (P0): la whitelist esclude gli attributi ereditati

`ProjectEditor.tsx:1623`:

```ts
const domainAttrNames = new Set(
    (targetClass.attributes || []).map((a: any) => a.name).filter(Boolean)
);
```

`LClass.attributes` restituisce SOLO gli attributi propri (`get_attributes`, `LModelElement.tsx:3281`: mappa `context.data.attributes`). Gli attributi ereditati stanno in `allAttributes` (`get_allAttributes`, riga 2991: own + inherited). Un binding su un attributo definito nella superclasse viene valutato correttamente dall'executor ma scartato dalla whitelist e mai scritto.

Questo è il candidato numero uno per il sintomo "a volte funziona": stessa trasformazione, funziona per le classi che dichiarano l'attributo in proprio, fallisce per quelle che lo ereditano.

**Fix**: usare `targetClass.allAttributes`. Una riga.

### F2 (P0): reference scritte solo se esistono attributi pendenti

`ProjectEditor.tsx:1722`:

```ts
if (pendingAttributeSets.length > 0 && createdModelId) {
    setTimeout(() => {
        ... STEP 8 (attributi) ...
        if (pendingReferenceSets.length > 0) {   // riga 1777: STEP 8b DENTRO il setTimeout di STEP 8
            ...
        }
    }, 1000);
}
```

Se la trasformazione produce solo reference (o tutti i valori di attributo sono null e quindi `attrs` resta vuoto), `pendingAttributeSets` è vuoto, il `setTimeout` non parte e STEP 8b non viene mai eseguito. Le reference si perdono in silenzio.

**Fix**: condizione `(pendingAttributeSets.length > 0 || pendingReferenceSets.length > 0)`, oppure estrarre STEP 8b dal ramo.

### F3 (P1): enum letti come Pointer diventano null

I valori D-layer di un attributo enum possono essere in TRE forme: Pointer al DEnumLiteral, ordinal numerico, o nome del literal come stringa (`LValue`, gestione enum a `LModelElement.tsx:7216`: `Pointers.isPointer(r) ? fromPointer(r) : lenum["@"+r]`, e `typeof r === "number"` per gli ordinali).

- Forma Pointer: `wrapIfRef` (riga 1248) lo trasforma in `{__ref}`; l'executor lo cerca nel trace, non trova rule per i literal, e `resolveRefById` fa fail-open a `null` (executor.ts:2335). L'attributo enum sparisce.
- Forma nome stringa: funziona.
- Forma ordinal: viene copiato come numero grezzo (il get lato target può risolverlo, comportamento fragile).

Anche questo produce il pattern "a volte sì, a volte no": dipende da come lo specifico slot è stato popolato (dropdown UI, import XMI, jjscript).

**Fix**: nello stadio A, prima di `wrapIfRef`, risolvere il Pointer: se punta a un `DEnumLiteral`, emettere il nome del literal come stringa. Il write-back con stringa già funziona.

### F4 (P1): navigazione attraverso reference nelle espressioni

Lo stadio A collassa ogni reference in `{ __ref: pointerId }` senza risolvere l'oggetto puntato. JjEL non ha alcuna gestione di `__ref` (grep su `src/jjel/`: zero occorrenze). Quindi qualsiasi espressione che naviga una reference, per esempio `city := address.city`, valuta `address` come wrapper opaco e `address.city` come `null`. Nessun errore, binding silenziosamente nullo.

Il `parent` ha un percorso dedicato via `_containerId` (executor.ts:1964-1985) e funziona; ogni altra navigazione no.

**Fix**: decisione architetturale, da discutere prima di implementare. Opzioni: (a) deref lazy in JjEL sui member access quando l'oggetto è `{__ref}` (richiede accesso a idlookup dal contesto di valutazione); (b) pre-risolvere nello stadio A a snapshot profondità-N con guardia sui cicli; (c) builtin esplicito `deref(x)`. La (a) è la più trasparente per l'utente.

### F5 (P1): lookup per nome con nomi duplicati

STEP 6 usa `objectName = instanceData.name || autogenerato` (riga 1599) e `DObject.new` usa il nome esplicito così com'è, senza deduplica (`LModelElement.tsx:5734`). STEP 8 e 8b ritrovano l'oggetto con `objects.find(o => o.name === pending.objectName)` (righe 1740, 1780, 1807).

Se due istanze target hanno lo stesso nome bindato (`name := name` con nomi sorgente non unici), il `find` restituisce sempre la prima: la seconda riceve attributi e reference della prima sovrascritti, oppure niente. Inoltre `sourceIdToObjectName` (riga 1606) tiene solo l'ultima entry per sourceId quando più rule trasformano lo stesso elemento.

**Fix**: dedupe di `objectName` in STEP 6 (suffisso incrementale sul nome D-layer; l'attributo `name` di dominio resta quello bindato), e log di warning quando avviene.

### F6 (P2): race sul delay fisso di 1000ms

Il commit dello store è asincrono anche fuori transazione (vedi sessione 2026-07-05, round-trip audit). STEP 8 parte dopo 1000ms fissi; su modelli grandi o macchine lente `lModel.objects` può essere incompleto: "Object not found in model", attributi persi. Intermittente per costruzione. Il tab open a 2000ms (riga 1676) ha lo stesso carattere euristico.

**Fix**: polling con retry (es. fino a `objects.length >= instancesCreated` o timeout con alert), al posto del singolo delay.

### F7 (P2): attributi multi-valore scritti in `values[0]`

STEP 8 scrive sempre `feature.value = attrValue` (riga 1752). Se il binding produce un array per un attributo con upper bound > 1, `LValue.set_value` (LModelElement.tsx:7630) passa l'array a `setValueAtPosition(0, array)`, che lo salva come singolo elemento in `values[0]` (il check sugli oggetti non-Date è commentato, riga 7505).

**Fix**: in STEP 8, `if (Array.isArray(attrValue)) feature.values = attrValue; else feature.value = attrValue`.

### F8 (P2): array di reference parzialmente risolti si perdono interi

`resolveValue` sugli array pusha anche i `null` da fail-open (executor.ts:2252: scarta solo `undefined`). `wrapIfTargetReference` wrappa l'array solo se OGNI elemento è un target `__createdBy === 'JjTL'` (riga 2194). Un solo elemento null (reference a un tipo senza rule) impedisce il wrap dell'intero array: niente `__ref_result`, la reference non viene mai accodata e si perde. In più, non essendo nella whitelist attributi, sparisce senza nemmeno un warning.

**Fix**: filtrare i null (con warning che elenca gli elementi non risolti) prima del check `every`.

### F9 (P3): stringa vuota e null

Lettura: `v === ''` è filtrato come non significativo (riga 1394), quindi un attributo sorgente con valore stringa vuota arriva come `null`. Scrittura: `attrValue === null` viene skippato (riga 1629), quindi un binding non può azzerare un default del target. Comportamento accettabile ma da documentare; coerente col criterio "unset resta unset".

### F10 (P3): collisioni di nomi col contesto di valutazione

`createInstanceContext` (executor.ts:1931) binda `source`, `self`, `it`, più `data`, `classes`, `instances` dal contesto radice (righe 603-613), più `parent`. Un attributo sorgente con uno di questi nomi vince (proxyEntries sovrascrive), ma un binding che REFERENZIA un attributo inesistente con uno di questi nomi pesca silenziosamente il valore di contesto (es. `data` = intero modello sorgente) invece di null. Difficile da diagnosticare; basterebbe un warning quando un identificatore risolve su un binding di contesto riservato.

### F11 (P3): object creation e forall non materializzati

Gli oggetti creati da `executeObjectCreation` (executor.ts:1549) non hanno `__createdBy`, non entrano in `targetModel.instances` e quindi ProjectEditor non li crea mai come DObject: restano plain object dentro un attributo. Inoltre i risultati di un `forall` vengono attaccati a una property euristica `lowercase(targetClass) + 's'` (righe 1704-1713 e 1771-1782) che ignora il nome di attributo dichiarato nel mapping e quasi mai supera la whitelist. Funzionalità di fatto non integrata col write-back; da riprogettare, non da patchare.

---

## 3. Matrice sintomo → causa probabile

| Osservazione | Causa più probabile |
|---|---|
| L'attributo manca solo su alcune classi target | F1 (attributo ereditato) |
| Le reference mancano tutte, gli attributi non c'erano | F2 |
| Gli attributi enum mancano o hanno valori strani | F3 |
| I binding con navigazione (`x.y`) sono sempre null | F4 |
| Due oggetti con lo stesso nome, uno "vuoto" | F5 |
| Su modelli grandi mancano attributi a caso, riprovando cambia | F6 |
| Attributo multi-valore con un solo valore (array annidato) | F7 |
| Reference multi-valore sparita del tutto | F8 |

## 4. Cosa NON è rotto

Per escludere piste già verificate: il two-pass dell'executor è corretto (i target esistono tutti prima di ogni binding, l'ordine delle rule non conta); la cross-type resolution per reference a DObject con rule funziona e fallisce loud in caso di ambiguità (errore esplicito con suggerimento `resolve(expr, Type)`); il trace model registra i binding correttamente; la lettura raw D-layer (non L-getter) allo stadio A è la scelta giusta ed evita i problemi di proxy circolari.

## 5. Ordine di intervento raccomandato

1. F1 (una riga) e F2 (ristrutturazione locale del ramo): prompt pronto, vedi `docs/2026-07-05_fix_jjtl_binding_writeback_p0.md`.
2. F3, F7, F8 (fedeltà dei valori): prompt pronto, vedi `docs/2026-07-05_fix_jjtl_binding_values_p1.md`.
3. F5 (dedupe nomi): incluso nel primo prompt come commit separato.
4. F4 e F6: decisione architetturale in chat prima di implementare.
5. F9, F10, F11: documentare come limiti noti; F11 richiede un design dedicato.

## 6. Test consigliati (suite headless)

Sul modello di `ecore-roundtrip-tests/` e `coevolution-tests/`, una suite `jjtl-binding-tests/` con fixture mirate: classe target con attributo ereditato da superclasse (F1); trasformazione con sole reference (F2); attributo enum nelle tre forme di storage (F3); nomi sorgente duplicati (F5); attributo multi-valore (F7); reference multi-valore con un target senza rule (F8). Ognuna verifica lo snapshot D-layer del modello generato, non il plain object dell'executor: i bug sono quasi tutti nel write-back.
