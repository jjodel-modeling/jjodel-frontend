# Memo di ratifica: mappatura JjOM ↔ LionWeb (serie R-LW)

**Data**: 2026-09-05 13:40
**Autore**: Claude (chat di progetto), su richiesta di Alfonso
**Stato**: proposta. Nessuna delle regole qui sotto è ratificata; la ratifica avviene in chat dopo il discovery report (`docs/discovery/discovery_2026-09-05_lionweb_mapping.md`), che misura quanti costrutti del JjOM reale cadono nei casi di frizione.
**Riferimenti esterni**: spec LionWeb 2023.1 / 2024.1 / 2026.1 (https://lionweb.io/specification/, roadmap in https://github.com/LionWeb-io/specification/blob/main/roadmap/roadmap.adoc); implementazioni `lionweb-jvm` (2023.1 e 2024.1, modulo `emf`) e `lionweb-typescript` (2023.1, delta in beta).
**Riferimenti interni**: `frontend/src/model/logicWrapper/LModelElement.tsx` (DModel, DPackage, DClass, DAttribute, DReference, DEnumerator, DEnumLiteral, DDataType, DAnnotation, DObject, DValue), `frontend/src/services/export/EcoreService.ts` (811 righe, export/import `.ecore`), `XMIService.ts`, `JsonModelService.ts`.

## 1. Perché

LionWeb definisce un meta-metamodello (LionCore), un formato JSON piatto per linguaggi e modelli, e due API di repository (bulk, delta). Jjodel raggiunge già l'ecosistema via `.ecore` e il bridge `emf` di `lionweb-jvm`, ma quel percorso perde i modelli M1 e le annotazioni `jjodel/<chiave>=<valore>`. Un export diretto ha due valori misurabili: M1 e annotazioni nello stesso file. Diventare client bulk/delta (Jjodel come canvas per modelli scritti in MPS o Freon) è un progetto separato e non è oggetto di questo memo.

Versione di riferimento proposta: **2024.1**. È la più recente pubblicata sul sito, è supportata da `lionweb-jvm`, e la 2026.1 aggiunge solo la delta API, che qui non serve. `lionweb-typescript` supporta solo 2023.1: non lo useremmo come dipendenza (regola "no nuove dipendenze senza discussione"), solo come riferimento e come validatore dei JSON prodotti.

## 2. Corrispondenze dirette (nessuna decisione richiesta)

| JjOM | LionCore 2024.1 | Nota |
|---|---|---|
| `DModel` (M2) | `Language` (`name`, `key`, `version`) | una Language per metamodello |
| `DClass` | `Concept` (`abstract`, `partition`, `extends`, `implements`) | vedi R-LW-2 per l'ereditarietà |
| `DClass.interface` | `Interface` (`extends: Interface[]`) | solo se senza attributi obbligatori? da misurare |
| `DAttribute` | `Property` (`type`, `optional`) | vedi R-LW-1 per la multiplicità |
| `DReference` con contenimento | `Containment` (`optional`, `multiple`) | ordine dei figli preservato |
| `DReference` senza contenimento | `Reference` (`optional`, `multiple`) | target serializzato come `{reference: id, resolveInfo: name}` |
| `DEnumerator` / `DEnumLiteral` | `Enumeration` / `EnumerationLiteral` | |
| `DObject` (M1) | nodo `{id, classifier, properties, containments, references, annotations, parent}` | figli citati per id, non annidati |
| `DValue` di attributo | entry di `properties` | valore serializzato come stringa |
| `DValue` di riferimento | entry di `references` o `containments` | |

## 3. Regole proposte

### R-LW-1: attributi multi-valore
LionWeb non ha Property multi-valued. Un `DAttribute` con `upperBound !== 1` si mappa a un `Containment` multiplo verso un Concept sintetico `<Nome>Value` con una sola Property `value`, dichiarato in una Language ausiliaria `jjodel-builtins`. L'alternativa (`StructuredDataType`, 2024.1) non regge perché una Property resta comunque single-valued. Se il discovery misura zero attributi multi-valore nei progetti di esempio, la regola resta ma si implementa dopo.

### R-LW-2: ereditarietà multipla
`Concept.extends` è singolo. Regola: il primo supertipo nell'ordine di `DClass.extends` diventa `extends`; ogni supertipo successivo diventa `implements` se e solo se è `abstract` o `interface` e non possiede attributi obbligatori; altrimenti l'export fallisce con errore esplicito che nomina la classe, senza produrre un file parziale. Nessun appiattimento silenzioso delle feature ereditate.

### R-LW-3: tipi primitivi
I built-in LionCore sono `Boolean`, `Integer`, `String`. I primitivi JjOM senza corrispettivo (double/float, date, long, char, byte, e gli altri che il discovery elencherà) diventano `PrimitiveType` della Language `jjodel-builtins`, con nome uguale a quello EMF senza prefisso `E`. Stessa scelta di `emf-builtins` in `lionweb-jvm`, così i due percorsi (diretto e via `.ecore`) producono lo stesso tipo.

### R-LW-4: opposti, derived, transient, operazioni
Non hanno corrispettivo. Si codificano come annotazioni LionWeb (R-LW-5) sul nodo di feature: `jjodel.Opposite` con reference alla feature opposta, `jjodel.Derived`, `jjodel.Transient`. `DOperation` e `DParameter` non si esportano nella prima versione; l'export lo dichiara nel report di esito, non in silenzio.

### R-LW-5: annotazioni
`DAnnotation.source = "jjodel/<chiave>=<valore>"` (chiavi oggi note: `renderer`, `unit`, `min`, `max`, `multiline`) si mappa a un'`Annotation` LionWeb di una Language `jjodel` (una Annotation per chiave, con `annotates` sul classifier giusto e una Property `value`). Le annotazioni con `source` diverso da `jjodel/...` si mappano a un'Annotation generica `jjodel.EAnnotation` con Property `source` e un Containment di coppie `key`/`value`. È l'unica parte in cui l'export diretto è più fedele del round trip `.ecore`.

### R-LW-6: chiavi e id
`key` di ogni elemento di Language è l'`id` JjOM dell'elemento, non il nome: sopravvive ai rename e non richiede unicità dei nomi tra package. Gli `id` dei nodi M1 sono gli `id` dei `DObject`. Vincolo della spec: gli id ammettono solo `[A-Za-z0-9_-]`; il discovery deve confermare che gli id JjOM (forma `Pointer_...`) rispettano l'alfabeto e che nessun id viene riscritto tra `DObject.new()` e la persistenza. Se un id può cambiare, l'export si esegue solo dopo `COMMIT` e lo dichiara nel contratto.

### R-LW-7: package e radici
LionWeb non ha package: `DPackage` si appiattisce, e il nome del package finisce nel `name` del Concept solo in caso di omonimia (`pkg.Nome`), altrimenti si perde. I nodi M1 di primo livello (`model.objects`) devono avere `parent: null` e un classifier con `partition: true`: l'export marca `partition: true` su ogni Concept che compare come radice in almeno un modello, e lo dichiara nel report di esito perché è un'informazione che il metamodello Jjodel non contiene.

### R-LW-8: perimetro del modulo
Nuovo modulo puro `frontend/src/services/export/lionweb/` (nome da verificare con grep prima di crearlo), stesso stile a zero import di `jjform/`: prende il D-graph in ingresso e restituisce il JSON della serialization chunk 2024.1 (`serializationFormatVersion: "2024.1"`, `languages`, `nodes`). Nessun tocco a `LModelElement.tsx`, a `useJjomSync.ts` o alla critical-zone. L'import è fuori perimetro finché l'export non è verificato con l'oracolo (§4). Il menu `ExportImportMenu.tsx` si tocca solo in una slice successiva e separata.

## 4. Oracolo di verifica

Il modulo `emf` di `lionweb-jvm` converte `.ecore` in Language LionWeb. Test di accettazione proposto: per ogni metamodello di esempio, export `.ecore` da `EcoreService` → conversione con `lionweb-jvm` → confronto strutturale (per `key`, non per id) con l'export diretto. Ogni differenza è o un bug o una regola di questo memo da rivedere. Il confronto vive in uno script esterno al frontend (JVM), non in vitest.

## 5. Domande aperte per Alfonso

1. Versione bersaglio 2024.1 o già 2026.1 (solo se si intende arrivare alla delta API)?
2. R-LW-2: fallire sull'ereditarietà multipla concreta, o accettare l'appiattimento con perdita dichiarata?
3. R-LW-6: `key = id` (stabile, illeggibile) o `key = name` (leggibile, fragile)? La proposta è `id`.
4. Le annotazioni `jjodel/*` sono considerate parte del contratto pubblico di Jjodel? Se sì, la Language `jjodel` va versionata e pubblicata in `docs/`.
