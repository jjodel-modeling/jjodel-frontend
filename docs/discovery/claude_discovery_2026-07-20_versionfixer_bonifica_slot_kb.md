# Discovery — Bonifica VersionFixer per slot DValue duplicati (salvataggi pre-fix XMI)

**Data**: 2026-07-20
**Branch analizzato**: `alfonso-frontend-jjtl` @ `d1de6d4` (analisi read-only, nessuna modifica al codice)
**Tipo**: design di migrazione, NON implementazione. Fase 2 su `VersionFixer.tsx` = critical zone: richiede Layer Impact Report e go-ahead esplicito di Alfonso.

---

## Obiettivo

Progettare la migrazione VersionFixer che bonifica i progetti salvati PRIMA del fix `4811db8` (riuso slot mirage nell'import XMI M1, `getConformitySlot`). Residui noti nei salvataggi: (a) slot DValue duplicati per feature (riga vuota + riga valorizzata), (b) pointer figli duplicati nei DValue di containment, (c) radici duplicate in `dModel.objects` (residuo pre-esistente, presente ANCHE nei salvataggi post-fix).

## File letti

- `/home/claude/jjodel-frontend/CLAUDE.md` (§3.1, §3.2, §3.6, §3.9, §9)
- `/home/claude/jjodel-frontend/docs/discovery/discovery_2026-07-19_dvalue_duplicati_import_xmi.md`
- `/home/claude/jjodel-frontend/frontend/src/services/export/XMIService.ts` (righe 535-720, 740-1030, 1160-1210: helper `getConformitySlot` a 755-775 e i 3 siti di riuso a 875/979/1189; push radici a 658/679)
- `/home/claude/jjodel-frontend/frontend/src/redux/VersionFixer.tsx` (intero: pattern migrazioni, `setup()`/`highestVersion`, `autocorrect`, `removeNullPtrs`; ultima migrazione `2.225 -> 2.226` a riga 1007)
- `/home/claude/jjodel-frontend/frontend/src/model/logicWrapper/LModelElement.tsx` (righe 6230-6430: `_forceConformity` 6314-6333, `_removeConformity` 6334-6340, classe `DValue` 6375-6428)
- `/home/claude/jjodel-frontend/frontend/src/joiner/classes.ts` (righe 550-830: `Constructors`, `Constructors.DValue` 786-803, `Constructors.DObject` 772-784; `PointedBy` 1834-1896)
- `/home/claude/jjodel-frontend/frontend/src/redux/reducer/reducer.ts` (righe 440-550: `CreateElementAction` e push nelle collezioni root; righe 1118-1145: undo/redo)
- `/home/claude/jjodel-frontend/frontend/src/redux/store.tsx` (righe 76-83 `statehistory`; 148-149 root arrays `s.objects`, `s.values`)
- `/home/claude/jjodel-frontend/frontend/src/components/topbar/SaveManager.ts` (righe 41-58: `load()` chiama `VersionFixer.update` prima di `LoadAction`)
- `/home/claude/jjodel-frontend/frontend/src/model/dataStructure/GraphDataElements.tsx` (righe 78-133: `DGraphElement.model` opzionale)
- Knowledge base progetto: `claude/report_2026-07-20_fix_xmi_duplicati.md` (evidenze dinamiche pre/post fix)

---

## Finding 1 — Firma esatta della corruzione nei salvataggi

**Slot duplicato**: due (o piu) `DValue` in `idlookup` con lo stesso `father` (id del `DObject`) e lo stesso `instanceof` (id della meta-feature `DAttribute`/`DReference`). Chiave di riconoscimento: raggruppare i DValue raggiungibili da `DObject.features` per `instanceof`; ogni gruppo con cardinalita > 1 e corrotto. Gli slot con `instanceof` undefined (modelli schema-less) vanno esclusi dal raggruppamento.

**Chi e il "vero"**: lo slot non-mirage valorizzato. Genesi:

1. Slot mirage: creato da `_forceConformity` (`LModelElement.tsx:6330` → `addValue(..., isMirage=true)`) al persist del `DObject`. Ha `isMirage: true`, `values: []`. In `features` compare PRIMA (creato al persist, prima del walk dell'import).
2. Slot import: creato dopo da `processAttribute`/`processContainment`/`populateReferenceValue` (pre-fix). Ha `isMirage: false`, `values` popolati. Appeso in coda a `features`.

L'ordine in `features` (mirage prima, valorizzato dopo) e un fatto osservato ma NON va usato come discriminante: il criterio robusto e `isMirage === false && values.length > 0`.

**Firma aggiuntiva 1 — id valorizzato doppio in `features`**: pre-fix il codice faceva anche un push diretto sull'oggetto D pendente (`dObject.features.push(dValue.id)`); il `CreateElementAction` serializza l'oggetto BY REFERENCE al commit (END della TRANSACTION in microtask), quindi il push diretto finiva nello stato E l'azione `'+='` di `Constructors.DValue` (classes.ts:802) lo riappendeva. Lo slot valorizzato puo comparire due volte in `father.features`. Verificato dinamicamente nel report del fix.

**Firma aggiuntiva 2 — figli doppi nei containment**: stesso meccanismo sui `values` del DValue di containment: `pets = [c1, c2, c1, c2]` (verificato pre-fix, commento in `XMIService.ts:1015-1020`).

**Firma aggiuntiva 3 — radici doppie in `dModel.objects`**: push diretto a `XMIService.ts:658/679` + azione `'+='` di `Constructors.DObject` (classes.ts:776). Questo residuo NON e stato fixato: e presente identico anche nei salvataggi post-fix e continuera a essere prodotto da ogni nuovo import finche il push diretto resta nel codice.

**Casi ambigui (entrambi valorizzati): esistono ed e un caso reale**, non ipotetico, per le reference non-containment in "Format B" (elementi nested): pre-fix `resolveReferences` chiamava `populateReferenceValue` una volta PER pendingRef entry (una per elemento nested), e ogni chiamata creava un `DValue.new` nuovo. Una reference multi-target Format B produce quindi N slot valorizzati (uno per target) piu il mirage vuoto, tutti con lo stesso `instanceof`. La migrazione deve fare MERGE dei values, non solo scegliere un superstite. Attributi e containment invece producono al massimo un solo slot valorizzato per feature (una chiamata per chiave XML).

**Feature assenti dal file XMI**: un solo slot mirage vuoto. Stato legittimo, identico agli oggetti creati da palette: la migrazione NON deve toccarlo.

## Finding 2 — Chi puo puntare all'id di uno slot rimosso

Dal wiring di `Constructors.DValue` (classes.ts:786-803) e del reducer (`CreateElementAction`, reducer.ts:447-470), un DValue con id X e referenziato da:

1. `father.features` (array sul DObject padre) — via azione `'+='` (classes.ts:802).
2. `metaFeature.instances` (array su DAttribute/DReference) — via `setExternalPtr(instanceoff, "instances", "+=")` (classes.ts:800). **Contiene id di DValue, non di DObject.**
3. Root array `s.values` dello DState (store.tsx:149) — il reducer pusha ogni elemento creato in `s.<classname>s` (reducer.ts:466-468).
4. `pointedBy` sugli oggetti PUNTATI da X (formato source: `"idlookup.<X>.<campo>"`, PointedBy.fromID classes.ts:1862-1864): sul padre (`idlookup.X.father`), sulla meta-feature (`idlookup.X.instanceof`), su ogni target nei `values` (`idlookup.X.values`, solo slot valorizzati).
5. `child.father` dei DObject figli, quando X e uno slot di containment (fatherType=DValue, wiring EcoreParser).
6. `DGraphElement.model` (GraphDataElements.tsx:87, opzionale): salvataggi legacy dell'editor classic possono avere graph element con `model` puntato a un DValue. Il classic e stato rimosso (de-entanglement stadi 4-5) ma i D-object nei salvataggi restano.
7. Edge: `DVoidEdge.start/end` puntano a graph element, mai a DValue direttamente; `DValue.edges` vive sullo slot stesso e muore con lui. Nessuna azione necessaria lato edge, salvo il punto 6.

Undo history (`statehistory`, store.tsx:76) e una variabile di modulo in memoria, NON serializzata nel salvataggio: al momento in cui `VersionFixer.update` gira (in `SaveManager.load:56`, prima di `LoadAction`) la history e vuota. Nessuna interazione.

Nota: `VersionFixer.autocorrect` (che ha gia `removeNullPtrs` con dedup) gira SOLO con hash param `?repair=1` (VersionFixer.tsx:115). La migrazione non puo appoggiarsi ad autocorrect: deve pulire da sola.

## Finding 3 — Schema di migrazione proposto: `2.226 -> 2.227`

L'ultima migrazione esistente e `2.225 -> 2.226` (VersionFixer.tsx:1007); `highestVersion` si aggiorna da solo dal nome del metodo. La migrazione e una trasformazione pura DState → DState eseguita prima di `LoadAction`: niente azioni Redux, niente TRANSACTION, niente L-proxy (pattern delle migrazioni esistenti, es. `2.217 -> 2.218`).

**Scelta del superstite (raccomandazione: Opzione A)**: tenere lo slot valorizzato non-mirage ed eliminare il mirage vuoto. Alternativa (Opzione B): copiare i values NEL mirage e cancellare il valorizzato, replicando lo stato canonico che il fix runtime produce (ordine `features` allineato alla metaclasse). B costa riscritture in piu (pointedBy dei target, father dei figli per i containment) su un beneficio solo cosmetico (ordine righe nel renderer IR; il nativo raggruppa comunque per feature). Raccomando A; decisione finale ad Alfonso (domanda aperta 1).

```typescript
// 2.226 -> 2.227: bonifica slot DValue duplicati da import XMI pre-fix 4811db8
// + dedup pointer figli nei containment values + dedup radici in DModel.objects.
private ['2.226 -> 2.227'](s: DState): DState {
    const removed = new Set<Pointer>();

    // FASE A — dedup slot per (DObject, meta-feature)
    for (ogni e in s.idlookup con className === 'DObject') {
        // A1: dedup di e.features per id (l'id valorizzato puo comparire 2 volte)
        e.features = dedupByIdKeepFirst(e.features);

        // A2: raggruppa gli slot risolvibili per instanceof (skip instanceof undefined)
        gruppi = groupBy(e.features.map(f => s.idlookup[f]).filter(v => v?.className==='DValue' && v.instanceof), 'instanceof');
        for (ogni gruppo con length > 1) {
            // superstite: primo slot non-mirage con values non vuoti;
            // fallback: primo non-mirage; fallback: primo del gruppo
            survivor = pick(gruppo);
            for (ogni loser !== survivor) {
                // merge values (caso reale: reference Format B multi-slot).
                // Dedup SOLO se i values sono pointer (reference); i primitivi
                // possono legittimamente ripetersi e qui sono comunque assenti
                // (i loser mirage hanno values [] e i multi-slot sono reference).
                for (v of loser.values) if (!survivor.values.includes(v)) survivor.values.push(v);
                // containment: se qualche DObject ha father === loser.id, re-parent
                // (non dovrebbe accadere con Opzione A: il loser tipico e il mirage vuoto;
                //  guardia difensiva comunque presente)
                reparentChildren(s, loser.id, survivor.id);
                removed.add(loser.id);
                delete s.idlookup[loser.id];
            }
            if (survivor.isMirage && survivor.values.length > 0) survivor.isMirage = false;
        }
        e.features = e.features.filter(f => !removed.has(f));
    }

    // FASE B — dedup pointer duplicati
    for (ogni e in s.idlookup) {
        if (e.className === 'DModel') e.objects = dedupByIdKeepFirst(e.objects);          // radici doppie
        if (e.className === 'DValue' && isPointerArray(e.values))
            e.values = dedupByIdKeepFirst(e.values);                                      // figli doppi nei containment
    }

    // FASE C — pulizia riferimenti pendenti agli id rimossi (una sola passata)
    if (removed.size > 0) {
        s.values = (s.values || []).filter(id => !removed.has(id));                       // root array DState
        for (ogni e in s.idlookup) {
            if (Array.isArray(e.instances)) e.instances = e.instances.filter(id => !removed.has(id));  // meta-feature.instances
            if (e.model && removed.has(e.model)) e.model = undefined;                     // DGraphElement.model legacy
            if (Array.isArray(e.pointedBy))
                e.pointedBy = e.pointedBy.filter(p => !removed.has(secondSegment(p.source))); // "idlookup.<id>.<campo>"
        }
    }
    console.log(`[VersionFixer 2.226 -> 2.227] ...conteggi...`);
    return s;
}
```

**Idempotenza**: al secondo run ogni gruppo ha cardinalita 1, i dedup non trovano doppioni, `removed` resta vuoto: no-op. Su progetti puliti (Ecore-only, creati da palette, import post-fix) la Fase A e no-op; la Fase B deduplica le radici anche nei salvataggi post-fix (residuo tuttora prodotto).

## Finding 4 — Rischi

1. **`instances` sulle meta-feature**: e il riferimento pendente meno ovvio (contiene id di DValue). Dimenticarlo lascia pointer invalidi che il framework tollera male (pattern gia visto con i dangling refs). Coperto dalla Fase C.
2. **pointedBy**: formato source `idlookup.<id>.<campo>`; il filtro per secondo segmento e sicuro e a passata singola. Non pulirli lascia entry stale su padre e meta-feature; il rischio concreto e nei merge di `PointedBy.merge` e nelle delete future.
3. **Caso Format B multi-slot**: se la migrazione scegliesse solo un superstite senza merge, si perderebbero target di reference (dati utente). Il merge in Fase A lo copre; e il punto da testare con piu cura.
4. **Containment**: con Opzione A il superstite e lo slot valorizzato a cui i figli gia puntano via `father`: nessun re-parent necessario nel caso tipico. La guardia `reparentChildren` resta per il caso degenere (superstite scelto per fallback). Con Opzione B il re-parent sarebbe sistematico: altro motivo per preferire A.
5. **Radici duplicate: la migration da sola non basta.** Il push diretto a `XMIService.ts:658/679` e ancora nel codice: ogni NUOVO import post-2.227 rigenera radici doppie in salvataggi che hanno gia versione 2.227 e non verranno mai piu migrati. La Fase 2 deve includere anche la rimozione dei due push diretti in `XMIService.ts` (speculare al fix gia fatto per i figli a riga 1015), altrimenti la Fase B della migration e una bonifica one-shot che si ri-sporca. In alternativa, task separato ma da spedire INSIEME alla migration.
6. **Progetti misti (salvati a cavallo del fix)**: il fix non e retroattivo, quindi un progetto importato pre-fix e risalvato post-fix conserva i duplicati con un numero di versione recente. Non e un problema: il gate di VersionFixer e `version < 2.227` e la detection e strutturale (due slot stesso father+instanceof), non basata sulla provenienza. Sui salvataggi puliti la migrazione e no-op.
7. **Undo/redo**: nessuna interazione (history in memoria, vuota al load; la migrazione avviene prima di `LoadAction`, quindi non e annullabile dall'utente, che e il comportamento voluto).
8. **Ordine righe nel renderer IR (solo Opzione A)**: gli slot valorizzati restano in coda a `features`, quindi l'IR (ordine raw) mostra prima le feature vuote. Il nativo raggruppa per feature e non cambia. Cosmetico; se Alfonso lo ritiene inaccettabile si passa a Opzione B o si aggiunge un riordino di `features` secondo l'ordine della metaclasse (costo minimo, zero rischi referenziali: riordinare non invalida pointer).
9. **Radici duplicate e viste/sync**: `useJjomSync` Step 2bis itera `model.objects`; oggi il doppione risulta mascherato (stesso id, dedup a valle), ma la Fase B va comunque smoke-testata sul conteggio vertici dopo load.

## Finding 5 — Strategia di test

**Costruzione fixture corrotta.** Due vie, entrambe praticabili:

1. **Fixture reale da build pre-fix (preferita)**: il commit pre-fix esiste in history: parent di `4811db8` = `3c57449`. Checkout in un worktree, `npm run dev`, import di `mini.ecore` + `mini.xmi` (fixture della sessione fix, rigenerabili in 5 minuti), salvataggio progetto: il file salvato e una fixture corrotta autentica, con tutte e tre le firme (slot doppi, figli doppi, radici doppie).
2. **Fabbricazione a mano**: script Node che prende un salvataggio pulito post-fix e inietta la corruzione: per ogni slot valorizzato clona un DValue gemello (id nuovo, `values: []`, `isMirage: true`), lo inserisce in testa a `father.features`, in `meta.instances`, in `s.values`, e aggiunge i pointedBy su padre e meta; duplica gli id radice in `dModel.objects` e i figli nei containment values; imposta `s.version.n = 2.226`. Utile per i casi limite non riproducibili dalla UI (Format B multi-slot, entry pointedBy stale).

**Test a funzione pura**: la migrazione e un metodo `(s: DState) => DState` invocabile su JSON parsato senza browser: test Node che carica la fixture, esegue, e asserisce: (a) un solo slot per (objectId, featureId); (b) zero id rimossi ancora presenti in QUALSIASI punto dello stato (scan stringa del JSON serializzato: `JSON.stringify(s).includes(removedId)` deve essere false: verifica infallibile e a costo zero); (c) values del superstite = unione dei values pre-migrazione; (d) doppio run → deep-equal (idempotenza); (e) fixture pulita → deep-equal con input (no-op).

**Smoke in app (Alfonso, localhost:3001, hard refresh)**:
1. Aprire progetto sporco pre-fix → una sola riga per feature nel nativo e nell'IR; feature assenti dall'XMI restano una riga vuota singola.
2. Conteggio edge M1 invariato rispetto a prima della migrazione.
3. Edit in place di un attributo importato → cambia la riga visibile (post-bonifica `$feature` risolve l'unico slot: sparisce il collaterale "edit aggiorna la riga vuota").
4. Save → reopen → nessuna ulteriore modifica (versione 2.227, log migrazione assente al secondo load).
5. Export XMI del modello bonificato → contenuto identico all'export pre-bonifica (i duplicati non finivano nell'export: verificare non-regressione).
6. Progetto pulito (Ecore-only o creato da palette) → log migrazione a zero, nessun cambiamento visivo.
7. Undo subito dopo il load → non deve riportare i duplicati.

## Finding 6 — Stima di complessita e perimetro Fase 2

- **Perimetro atteso**: `frontend/src/redux/VersionFixer.tsx` (metodo `2.226 -> 2.227`, ~80-120 righe con helper locali) + **raccomandato nello stesso giro** `frontend/src/services/export/XMIService.ts` (rimozione dei 2 push diretti alle righe 658 e 679, ~2 righe, speculare al fix dei figli gia in essere a riga 1015). Piu `docs/claude-code-log.md`.
- **Critical zone**: `VersionFixer.tsx` e in §3.1; la Fase 2 richiede Layer Impact Report in chat prima del diff e go-ahead esplicito di Alfonso. Layer toccati: D-layer (raw state) e Persistence; L-layer, JjOM, canvas e sync NON toccati (la migrazione gira prima di LoadAction).
- **Complessita**: media. Il core (dedup + merge) e semplice; il 20% fragile e la pulizia di `instances`/`pointedBy` e il merge Format B. Con la fixture fabbricata e il test a funzione pura la verifica e meccanica. Stima: una sessione Claude Code, un commit per la migration + uno per il fix push radici (o un commit unico se Alfonso preferisce).

## Domande aperte per Alfonso

1. **Opzione A o B per il superstite?** Raccomando A (elimina il mirage vuoto, tiene lo slot valorizzato): meno riscritture, nessun re-parent. Costo: ordine righe non canonico nel solo renderer IR. Se l'ordine conta, dire se preferisci B oppure A + riordino finale di `features` secondo la metaclasse.
2. **Fix dei push radici in XMIService.ts nello stesso giro della migration?** Raccomando si: senza, la bonifica delle radici e one-shot e i nuovi import la vanificano.
3. **Hai salvataggi reali pre-fix da usare come fixture di accettazione?** In alternativa procedo con worktree su `3c57449` + fixture fabbricata.
4. **Merge Format B**: dedup dei target pointer nel merge ok? (EMF di default ha reference a unicita garantita; se esistono casi con bag ordinati non-unici, il dedup perderebbe ripetizioni volute.)
5. **Numero versione**: `2.226 -> 2.227` e corretto rispetto all'ultima migrazione esistente (`2.225 -> 2.226`); confermare che non ci siano altre migrazioni in volo su altri branch che occuperebbero 2.227.
