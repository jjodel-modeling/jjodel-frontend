# Task 1.3 (v2): Pin di identità della metaclasse come campo additivo nell'IR

> Fase 2, decisioni già ratificate. **Non c'è fase di discovery**: le domande sono chiuse in
> `claude/ratifiche_2026-08-04_tab_partizione.md` R-1 e in
> `claude/ratifiche_2026-08-05_3_canonicalize_e_risalita_parent.md` R-F. Quello che serve è
> lettura preventiva dei file, non esplorazione.
>
> **Sequenza obbligata**: questa slice atterra **prima** della rimozione di `Applicable to`
> (task 1.4), e in un commit **separato** da essa. È l'unico punto della partizione con un costo
> funzionale se sbagliato.
>
> **Questo file è l'unica versione valida del prompt 1.3.** La v1 è stata rimossa dal knowledge
> base il 2026-08-05: ometteva la trappola di `isMigratedDefaultView`, che era stata ratificata
> il 2026-08-04 proprio come "trappola da mettere nel prompt di implementazione". Qui c'è, alla
> sezione COSA punto 5, con la decisione R-F già presa. Se hai già eseguito la v1, leggi il
> punto 5 e verifica se la tua implementazione ha introdotto la regressione che descrive.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto

`ir.metaclasses` è una lista di **nomi**; `view.appliableToClasses` è una lista di **pointer**.
Quando due metamodelli dello stesso progetto dichiarano una classe omonima, il pointer è l'unica
cosa che impedisce all'authoring di leggere le feature della classe sbagliata. Oggi il memo
`featureInfo` dei tre pannelli rilegge `appliableToClasses` a ogni render proprio per questo, e
il fallback per nome è etichettato legacy nel codice.

La partizione rimuove `Applicable to` come controllo (1.4). Se lo si rimuovesse senza prima dare
al pin una casa dentro l'IR, l'authoring perderebbe la disambiguazione e tornerebbe al match per
nome, in silenzio.

**Ratificato**: `metaclasses` resta una lista di nomi e la semantica del resolver **non si
tocca**. Accanto nasce un campo **opzionale e additivo** che porta i pointer risolti, scritto
dal pannello quando l'autore sceglie una metaclasse e letto **solo** dal livello di authoring.

## Il rischio da non correre

La ratifica lo nomina: il campo non deve diventare il prossimo `edge.routing`, cioè dichiarato
nel tipo e mai cablato. La contromisura è che questa slice **scrive e legge** il campo, e la
lettura è quella vera: il pin del `PathBuilder` smette di venire da `appliableToClasses` e viene
dal campo nuovo.

## COSA

### 1. Il campo

Additivo e opzionale, allo stesso livello di `metaclasses`, su **tutti e tre** i kind
(`vertex`, `row`, `edge`). Se in `irTypes.ts` esiste già un'interfaccia base condivisa fra i
tre, il campo va lì; se non esiste, **non crearla**: dichiaralo tre volte e segnalalo nel report
di chiusura.

**Forma: una mappa da nome a pointer**, non un array parallelo a `metaclasses`.

Motivo, da non reinterpretare: un array parallelo diverge in silenzio al primo riordino di
`metaclasses`, e la divergenza silenziosa fra le due liste è esattamente ciò che questa slice
esiste per chiudere. La cardinalità corretta è una: `metaclasses` è una lista di nomi, e per
ogni nome serve sapere **quale** classe omonima si intende.

**Nome del campo**: sceglilo tu, ma prima esegui la ricerca globale prescritta dalla regola di
verifica dei nomi e riporta l'esito nel report di chiusura. Deve dichiarare nel nome di essere
metadato di **authoring**, non semantica del modello.

**Vincoli sullo schema**: nessun bump di `irVersion`, nessuna migration, nessuna modifica al
resolver. Un IR privo del campo resta valido e si comporta esattamente come oggi.

### 2. La scrittura

Il campo si scrive **nello stesso `patch` che scrive `metaclasses`**, sempre. Mai uno senza
l'altro.

Se i due finiscono in due scritture distinte, le due liste tornano libere di divergere, che è la
condizione che la ratifica scarta esplicitamente quando rifiuta l'ipotesi di tenere il controllo
classico. Se il sito di scrittura di `metaclasses` non consente una scrittura congiunta senza
riorganizzarlo, **fermati e segnala** invece di scrivere due volte.

### 3. La lettura, con catena di fallback a tre gradini

Il memo `featureInfo` dei tre pannelli risolve la metaclasse in quest'ordine:

1. **il campo nuovo**, se presente per quel nome;
2. **`view.appliableToClasses`**, se il campo nuovo è assente;
3. **match per nome**, il fallback legacy già esistente.

Il secondo gradino non è opzionale ed è il punto più importante di tutta la slice. Le view già
autorate non hanno il campo nuovo: senza quel gradino perderebbero la disambiguazione appena
1.4 rimuove il controllo, cioè **questa slice introdurrebbe la regressione che esiste per
prevenire**, su tutte le view esistenti e in silenzio.

Nessuna migration e nessun backfill: il gradino 2 è una lettura, non una scrittura.

### 4. Un helper puro, non tre copie

La catena del punto 3 è identica nei tre pannelli. Estraila in un **modulo puro** sotto
`viewpoint/ir/`, senza React, senza Redux, senza import di runtime da `editor-v2`, sul modello
di `ir/pathExpr.ts`.

Non è refactoring opportunistico: è il modo minimo di implementare lo stesso comportamento
nuovo in tre punti senza triplicarlo. Il progetto ha già pagato tre volte per la stessa scelta
sbagliata (`parsePathExpr` in tre copie, `isUsableEndpointExpr` più il suo mirror,
`nextEdgeForEndpoints`), e il modulo puro è anche l'unico modo di testare la catena: i pannelli
non sono importabili in vitest (`joiner → monaco → window`).

### 5. La trappola di `isMigratedDefaultView`, e la decisione già presa

**Questo punto è nuovo rispetto alla v1 del prompt. Leggilo prima di scrivere il campo.**

`isMigratedDefaultView` (`irDefaults.ts:128-145`, riancorare per nome) decide se una view delega
al rendering nativo confrontando `irHash(canonicalize(ir meno migratedFrom))` con l'hash di
`defaultObjectViewIR()`. Scrivere il pin su una view migrata **ne cambierebbe l'hash**: la view
smetterebbe di delegare e passerebbe all'interprete IR. Su un progetto migrato questo riguarda
quasi tutto il parco view, e si manifesterebbe come un cambio di resa diffuso e senza causa
apparente.

**Ratificato (R-F, 2026-08-05)**: `canonicalize` **esclude il campo del pin** dal confronto,
esattamente come già fa con `migratedFrom`. Il pin è metadato di authoring e il resolver non lo
legge: farlo entrare nell'identità semantica di un IR è un errore di categoria, non una scelta
di taratura.

Da fare, in questa slice:

- una riga in `canonicalize`, nello stesso punto e con lo stesso pattern con cui esclude
  `migratedFrom`. Se il pattern esistente non è una lista di chiavi escluse ma una costruzione
  esplicita dell'oggetto canonico, **adeguati alla forma locale** invece di introdurre un
  meccanismo nuovo;
- **guardia obbligatoria prima di procedere** (costa una `grep`, non è discovery): censisci i
  consumatori di `irHash` e di `canonicalize`. La conseguenza dell'esclusione è che due IR che
  differiscono solo per il pin hanno lo stesso hash. È voluto per `isMigratedDefaultView`, ma
  significa che **nessuna memoizzazione di livello authoring può essere keyata su `irHash`**. Se
  ne trovi una, **fermati e segnala** prima di scrivere;
- la scrittura congiunta del punto 2 **resta valida e non è sostituita** da questa esclusione.
  Le due cose proteggono da problemi diversi: la scrittura congiunta impedisce alle due liste di
  divergere, l'esclusione impedisce al pin di cambiare l'identità semantica dell'IR.

## DOVE

Sono **sette o otto file**, quindi sopra la soglia della regola 19 di `CLAUDE.md`. Elenco
dichiarato qui; **prima di scrivere una riga, verifica che corrisponda alla realtà del codice e
segnala ogni scostamento**.

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` | il campo, sui tre kind |
| `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` | esclusione del pin in `canonicalize` (punto 5) |
| `frontend/src/components/editor-v2/viewpoint/ir/<nuovo>.ts` | l'helper puro di risoluzione |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/<nuovo>.test.ts` | i test dell'helper |
| `.../viewpoint/ir/__tests__/` (file esistente di `irDefaults`, se c'è) | i due test dell'esclusione |
| `.../viewpoint/authoring/VertexAuthoringPanel.tsx` | memo `featureInfo` sull'helper |
| `.../viewpoint/authoring/RowAuthoringPanel.tsx` | idem |
| `.../viewpoint/authoring/EdgeAuthoringPanel.tsx` | idem |
| il sito di scrittura di `metaclasses` | scrittura congiunta (punto 2) |

L'ultima riga è deliberatamente non risolta: verifica **dove** `metaclasses` viene scritto per
ciascuno dei tre kind. Se è un sito solo condiviso, tanto meglio; se sono tre, dillo e procedi
su tutti e tre. Se è un file non elencato qui, **fermati e segnala prima di toccarlo**.

Qualsiasi altro file: STOP. In particolare **non toccare** `irCompile.ts`, `irResolveCore.ts`,
`irValidate.ts`, `view.tsx`, né alcun file sotto `ui/`. Il resolver non si tocca: è vincolo di
ratifica, non preferenza. `irDefaults.ts` entra nel perimetro **solo** per la riga di
esclusione in `canonicalize`, niente altro.

## Test

Sull'helper puro, che è testabile senza i pannelli:

1. campo presente per il nome → ritorna il pointer del campo;
2. campo assente, `appliableToClasses` presente → ritorna il pointer legacy (**il gradino che
   protegge le view esistenti**);
3. campo assente e `appliableToClasses` assente → ricade sul match per nome;
4. campo presente ma per un nome diverso da quello richiesto → ricade sul gradino 2, non
   ritorna il pointer sbagliato;
5. due metamodelli con classe omonima, campo presente → ritorna quello pinnato, non il primo per
   nome. È il caso che giustifica l'intera slice;
6. IR privo del campo → nessun errore, comportamento identico a oggi.

Sull'esclusione in `canonicalize`:

7. due IR identici salvo il pin → **stesso** `irHash`;
8. un IR uguale a `defaultObjectViewIR()` più il solo pin → `isMigratedDefaultView` continua a
   ritornare vero. È il test che dimostra che la trappola è chiusa.

I test esistenti devono restare verdi senza modifiche. Se uno diventa rosso, **fermati e
segnala** invece di aggiustarlo.

## Gate automatici

1. `npx tsc --noEmit`: stesso set di errori della baseline. La baseline registrata è **33**
   (entry del 2026-07-31 e del 2026-08-01), zero nei file toccati.
2. `npx vitest run`: verdi, salvo i 9 file che falliscono in import per `window is not defined`
   (baseline nota, fuori perimetro).
3. `npm run build`: exit 0.
4. `npm run check:docs`: è rosso da prima per due entry del 2026-08-03. Verifica solo che la tua
   entry passi e che non si aggiungano fallimenti nuovi.

## Verifica visiva (la esegue Alfonso, hard stop prima del commit)

1. **Progetto con due metamodelli che dichiarano una classe omonima.** Autoro una view IR,
   scelgo la metaclasse dal metamodello B, e il `PathBuilder` offre le feature di **quella**,
   non della omonima in A. Salvo, hard refresh, riapro: continua a offrire le feature giuste.
2. **View già esistente, autorata prima di questa slice** (nessun campo nuovo). Il `PathBuilder`
   continua a offrire le feature corrette, cioè il gradino 2 sta funzionando. È il controllo che
   dimostra l'assenza di regressione, e senza di esso la slice non è verificata.
3. **Progetto migrato, controllo della trappola.** Apro un progetto che ha subito la migration,
   scrivo il pin su una view di default migrata, e la resa dei nodi **non cambia**: la view
   continua a delegare al rendering nativo. Hard refresh e ricontrollo. Senza questo passo
   l'esclusione in `canonicalize` non è verificata a video.
4. **View su un progetto con un solo metamodello**: nessuna differenza rispetto a prima.
5. Un IR autorato a mano da console, senza il campo nuovo: nessun errore, nessun warning in
   console, authoring funzionante.

## Attenzione al working tree

Alla scrittura della v1 di questo prompt il tree conteneva WIP di un'altra sessione su
`editors/languages/Jsx.tsx`, `editors/views/ViewData.tsx`,
`editors/views/data/TemplateData.tsx`, più il WIP sui capi in `EdgeAuthoringPanel.tsx` e
`edgeAuthoring.test.ts`. **Non toccarlo e non committarlo.** `git add` per path espliciti, mai
`git add .`. Se il WIP sui capi è nel frattempo landato insieme alla micro-slice 2.1, verifica
lo stato di `EdgeAuthoringPanel.tsx` prima di toccarne il memo `featureInfo`.

## Chiusura

Un solo commit dopo la conferma visiva: `feat: pin the authoring metaclass by identity in the
IR`. Entry in `docs/claude-code-log.md` con tipo `feat`, `Corregge` e `Causa` nella forma
prescritta da §21.3 (il gate le controlla; se questa slice non rimedia a un task precedente,
sono `—` entrambi, e va detto invece di riempirli con prosa).

Riporta nel report di chiusura: il nome scelto per il campo con l'esito della ricerca di
collisione, se in `irTypes.ts` esisteva un'interfaccia base condivisa, dove si è rivelato il
sito di scrittura di `metaclasses`, e **l'esito del censimento dei consumatori di `irHash` e
`canonicalize`** (punto 5).

**Il prompt log è a 26 entry**, sopra la soglia di 20: la rotazione è dovuta, ma **non farla in
questo commit**. È housekeeping separato, e mescolarla a una slice funzionale rende la diff
illeggibile.

Nessun push senza go-ahead.

## Vincoli

- Zero refactoring opportunistico. Mai rinominare identificatori esistenti, incluse le classi
  SCSS.
- Non rimuovere `appliableToClasses` né il controllo `Applicable to`: è il task 1.4, e la
  ratifica impone che sia un commit separato **dopo** questo.
- Non cambiare la semantica di `metaclasses` né il resolver.
- Nessun bump di `irVersion`, nessuna migration.
- In `irDefaults.ts` si tocca **solo** `canonicalize`, e solo per l'esclusione del pin.
- Ricerca globale di collisione per ogni nome nuovo, prima di introdurlo.
- Critical zone (`useJjomSync.ts`, `portDistribution.ts`): non entrarci. Qui non c'è, la regola
  resta.

## RIFERIMENTI

**Di seconda mano, dal report della tab map del 2026-08-04: riancorare per nome, non per
numero di riga** (il file si è mosso di recente).

- `VertexAuthoringPanel.tsx:118-123` — rilettura di `appliableToClasses` nel memo `featureInfo`
  per il pin di identità; `:61` — lettura di Redux `state.advanced`.
- I memo `featureInfo` dei tre pannelli: `VertexAuthoringPanel.tsx:103-161`,
  `RowAuthoringPanel.tsx:89-140`, `EdgeAuthoringPanel.tsx:209-260`. Il campo `features` è `null`
  quando `metaclasses` è `'*'`, non è un array, o è vuoto.
- `isMigratedDefaultView` e `canonicalize`: `irDefaults.ts:128-145`.
- **Non toccare** il memo `featureInfo` oltre alla sostituzione della risoluzione del pin: il
  resto della sua logica è fuori scope.

**Decisioni che vincolano e non si rimettono in discussione:**

- `claude/ratifiche_2026-08-04_tab_partizione.md` R-1: campo additivo, resolver invariato,
  `metaclasses` resta lista di nomi, sequenza pin prima della rimozione del controllo.
- `claude/ratifiche_2026-08-05_3_canonicalize_e_risalita_parent.md` R-F: esclusione del pin da
  `canonicalize`, guardia sui consumatori di `irHash`.
- Il bug che motiva il pin è la mitigazione registrata nella discovery del 2026-07-23 §9.
- `ir/pathExpr.ts` (`fc0af70d2`) è il modello per il modulo puro: nessun React, nessun Redux,
  nessun import di runtime da `editor-v2`, testabile in isolamento.

---
**Nome del documento prompt**: 2026-08-05 14:40 prompt_1_3_pin_identita_metaclasse_v2
