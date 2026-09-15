# Slice di recupero: 2.1 allargata + condizioni C-1..C-4 sul WIP dei capi già landato

> Fase 2, decisioni già ratificate. **Non c'è fase di discovery**: le domande sono chiuse in
> chat il 2026-08-05. Serve lettura preventiva dei file, non esplorazione.
>
> **Perché questa slice esiste.** Il commit `49c32c134` ha landato la semantica nuova dei capi
> (divergenza dichiarata invece di scrittura distruttiva) **senza** le due cose che ne erano il
> prezzo ratificato: la micro-slice 2.1 (estrazione degli helper in modulo puro) e le quattro
> condizioni C-1..C-4. Risultato attuale: il comportamento nuovo è in main con copertura zero
> sulla parte cambiata, e tre messaggi all'autore sono assenti o scorretti.
>
> I documenti di ratifica vivono nel knowledge base della chat di progetto, **non nel repo**:
> per questo il testo delle condizioni è riportato integralmente qui sotto. Questo prompt è
> autosufficiente; non cercare file `claude/ratifiche_*` nel filesystem.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.
Verifica lo stato del working tree prima di toccare qualsiasi cosa: alla scrittura di questo
prompt conteneva WIP di un'altra sessione su `editors/languages/Jsx.tsx`,
`editors/views/ViewData.tsx`, `editors/views/data/TemplateData.tsx`, più
`docs/claude-code-log.md` modificato. **Non toccarlo e non committarlo.** `git add` per path
espliciti, mai `git add .`.

## Fotografia di apertura (aggiunta 2026-08-05, sessione 5)

Prima di ogni altra cosa, riporta in chat l'output di `git log --oneline -15` e di
`git status --short`, senza commentarli oltre il necessario. Serve a stabilire quali commit
del 4-5 agosto sono effettivamente in main e cosa c'è di sporco nel working tree. Se lo stato
reale differisce da quello descritto sopra (per esempio: `49c32c134` assente, oppure file
sporchi diversi da quelli elencati), **fermati e segnala prima di procedere**.

## Struttura: due commit consecutivi, nell'ordine

**Commit A** — l'estrazione (2.1 allargata). **Commit B** — le condizioni C-1..C-4 più
l'aggiornamento del warning di ambiguità. L'ordine non si inverte: B si testa con il modulo
che A crea. Se la diff complessiva resta piccola e leggibile è ammesso un commit unico, ma il
default sono due.

---

## Commit A — Estrazione degli helper dei capi in modulo puro (2.1 allargata)

### COSA

Un **modulo puro** sotto `viewpoint/ir/` (nome tuo, previa ricerca globale di collisione; sul
modello di `ir/pathExpr.ts`: nessun React, nessun Redux, nessun import di runtime da
`editor-v2`). Dentro:

1. **`isUsableEndpointExpr`** — oggi function modulo-locale in `EdgeAuthoringPanel.tsx:79`,
   con quattro call-site nello stesso file (`:215, :252, :565, :577`) e un **mirror letterale**
   in `edgeAuthoring.test.ts:130`. Sposta la definizione nel modulo, aggiorna i call-site
   all'import, elimina il mirror dal test sostituendolo con l'import.
2. **`nextEdgeForEndpoints`** e **`dropEndpoints`** — oggi esistono **solo come mirror nel
   test** (`edgeAuthoring.test.ts:200` e seguenti): la logica vera è inline in
   `applyEndpoints`/`changeNature` nel pannello. Estrai la logica reale nel modulo, falla
   usare dal pannello, elimina i mirror dal test.
3. **La metà di stato locale**: la logica decisionale che oggi vive nei setter e nella guardia
   del pannello (`setSourceExpr`/`setTargetExpr` prima della guardia, la condizione di
   `endpointsDiverge`, e la nuova condizione del caso B che il Commit B introduce) va resa
   calcolabile da **funzioni pure** che il pannello chiama. Forma libera (funzione di
   transizione sul draft, o predicati separati), ma il criterio è uno: **ogni ramo del
   comportamento nuovo dei capi deve essere importabile e testabile in vitest senza montare il
   componente** (i pannelli non sono importabili: `joiner → monaco → window`).

Il pannello dopo l'estrazione contiene solo wiring: stato React, chiamate alle funzioni pure,
rendering. Zero logica decisionale inline sui capi.

### Vincoli del Commit A

- Nessun cambio di comportamento. È un'estrazione: la semantica osservabile resta identica al
  commit `49c32c134`. Se per estrarre devi cambiare un comportamento, fermati e segnala.
- Mai rinominare identificatori esistenti esportati o classi SCSS. I nomi nuovi (modulo,
  funzioni della metà di stato) passano dalla ricerca globale di collisione.

---

## Commit B — Le quattro condizioni, più la stringa del warning di ambiguità

Testo integrale delle condizioni, dalla ratifica del 2026-08-05 (emendamento a R-1 di E-obj).
Contesto: `applyEndpoints` resta l'unico scrittore e scrive entrambe le chiavi o nessuna;
uscire da object-as-edge è solo `changeNature('reference')`; la divergenza fra draft e IR è
dichiarata, non silenziosa.

### C-1 — Il caso A non deve restare silenzioso

Coppia committata più un capo svuotato: alla riapertura il seed ripristina la coppia e l'edit
dell'autore viene scartato senza traccia. Il messaggio di divergenza deve dichiarare **la
conseguenza**, non solo lo stato: che finché i capi non sono di nuovo entrambi validi l'IR
conserva la coppia precedente, e che uscendo dal pannello la modifica incompleta viene
scartata. È una stringa. Verifica quella attuale e adeguala se non dice entrambe le cose.

### C-2 — Il caso B deve avere un avviso proprio

Nessuna coppia committata e un solo capo digitato: `endpointsDiverge` è falso perché manca
`hasCommittedPair`, quindi non compare nulla, e uscendo il testo digitato è perso. Non è una
divergenza (non c'è niente con cui divergere), è **lavoro non salvato**, e va detto come tale:
una condizione in più (nome tuo, previa ricerca di collisione; la condizione vive nel modulo
puro del Commit A) e una stringa che avverte che con un capo solo non viene salvato niente.
Lo scaffold completo dei due capi resta F2: questa è la sua parte minima.

### C-3 — Il messaggio non deve promettere una persistenza non avvenuta

`hasCommittedPair` legge il **draft**, non l'IR persistito, e il testo attuale dice "i capi
salvati": nella finestra dei 300 ms di debounce è falso. Riformulare senza rivendicare il
salvataggio (es. "i capi correnti" / "la coppia precedente resta attiva", non "salvati").

### C-4 — Il commento del test descrive un ramo cancellato

`edgeAuthoring.test.ts:166-176` (riancorare per contenuto: "Mirrors applyEndpoints' incomplete
branch: drop of the keys"): il ramo incompleto non droppa più. Rietichettare il commento; la
stessa asserzione è già fatta correttamente a `:271-278`, quindi **deduplica**: uno dei due
test si elimina o si fonde, e quello che resta descrive la semantica attuale.

### B-5 — La stringa del warning di ambiguità è pre-1.3

Il warning mostrato quando una metaclasse è dichiarata in più metamodelli dice: "il picker usa
quella a cui è applicata questa view". Descriveva la risoluzione via `appliableToClasses`;
dopo la slice 1.3 il primo gradino è il pin di identità nell'IR, `appliableToClasses` è il
fallback e il match per nome l'ultimo gradino. Trova la stringa con una grep sul testo
("dichiarata in", o frammento equivalente), verifica in quale componente vive (probabile
`MatchingSection` o i pannelli di authoring) e aggiornala perché descriva la risoluzione
reale: la view usa la metaclasse **fissata quando è stata scelta** (il pin); il suggerimento
di verificare i metamodelli duplicati può restare. Stringa in italiano come le circostanti:
la traduzione è una pass separata (R-4).

### Vincoli del Commit B

- Le stringhe di stato **non** passano da `validateIR`, che resta muto sullo stato divergente:
  la divergenza è una condizione di UI, non dell'IR. Canali separati, come da ratifica.
- Nessun cambio alla scrittura atomica: entrambe le chiavi o nessuna, sempre.

---

## DOVE

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/<nuovo>.ts` | modulo puro (Commit A) |
| `.../viewpoint/ir/__tests__/<nuovo>.test.ts` | test del modulo (A e B) |
| `.../viewpoint/authoring/EdgeAuthoringPanel.tsx` | import del modulo, wiring, stringhe C-1/C-2/C-3 |
| `.../viewpoint/authoring/__tests__/edgeAuthoring.test.ts` | mirror eliminati, C-4, import dal modulo |
| il file della stringa del warning di ambiguità (da grep) | B-5 |
| `docs/claude-code-log.md` | entry a fine task |

**Attenzione**: `EdgeAuthoringPanel.tsx` contiene anche il memo `featureInfo` toccato dalla
slice 1.3. Non toccarlo. Qualsiasi altro file: STOP e segnala. Critical zone
(`useJjomSync.ts`, `portDistribution.ts`): non entrarci.

## Test (nel modulo puro, la ragione per cui il Commit A esiste)

1. `isUsableEndpointExpr`: gli stessi casi del vecchio mirror, ora sull'implementazione vera.
2. `nextEdgeForEndpoints` / `dropEndpoints`: i casi già asseriti dai mirror, più il ramo che i
   mirror omettevano: **input incompleto → l'IR resta intatto** (niente drop).
3. La metà di stato: con coppia committata e un capo svuotato → condizione di divergenza vera
   (caso A); senza coppia committata e un capo digitato → condizione caso B vera e divergenza
   falsa; entrambi validi → nessuna delle due; `changeNature('reference')` → uscita pulita.
4. C-3 come proprietà: la condizione di divergenza è calcolata sul draft; il test documenta
   che non implica persistenza (asserzione sul nome/semantica, non sulla stringa esatta).

I test esistenti restano verdi salvo quelli **deliberatamente** modificati (mirror sostituiti
da import, C-4). Ogni altra rottura: fermati e segnala.

## Gate automatici

1. `npx tsc --noEmit`: baseline 33 errori, zero nei file toccati.
2. `npx vitest run`: verdi, salvo i 9 file `window is not defined` (baseline nota).
3. `npm run build`: exit 0.
4. `npm run check:docs`: rosso preesistente per due entry del 2026-08-03; la tua entry deve
   passare, nessun fallimento nuovo.

## Verifica visiva (la esegue Alfonso, hard stop prima di ogni commit)

Su una edge view IR con natura object:

1. **Caso A**: coppia valida committata, poi svuota un capo. La linea sul canvas resta; il
   messaggio dichiara che la coppia precedente resta attiva finché entrambi i capi non sono
   validi e che uscendo la modifica incompleta si perde.
2. **Caso B**: edge view fresca, natura object, digita un capo solo. Compare l'avviso di
   lavoro non salvato; esci e rientra: il testo è perso (comportamento noto) ma **era stato
   avvisato**.
3. Entrambi i capi validi → la coppia committa, ogni avviso sparisce.
4. Il messaggio non contiene più la parola "salvati" riferita al draft.
5. Su `View for Event` (progetto "Class Diagram"): il warning di ambiguità mostra il testo
   nuovo.

## Chiusura

Due commit dopo la conferma visiva:

- `refactor: extract edge endpoint helpers into a pure module`
- `fix: declare unsaved single-endpoint state and correct divergence messaging`

Entry in `docs/claude-code-log.md` per ciascuno, forma §21.3 (`Corregge`: il secondo commit
corregge i residui di `49c32c134`, e va detto lì). **La rotazione del log (26+ entry) resta
housekeeping separato: non farla in questi commit.** Nessun push senza go-ahead.

Riporta nel report di chiusura: nome del modulo e delle funzioni nuove con esito della ricerca
di collisione; dove viveva la stringa del warning (B-5); quali test mirror sono stati eliminati
e da cosa sono stati sostituiti.

## Vincoli generali

- Zero refactoring opportunistico fuori dal perimetro dichiarato.
- Mai rinominare identificatori esistenti, incluse le classi SCSS.
- Stringhe nuove in italiano, coerenti con le esistenti dei pannelli (traduzione: pass separata).
- Ricerca globale di collisione per ogni nome nuovo, prima di introdurlo.

## RIFERIMENTI

- Commit di partenza: `49c32c134` (WIP sui capi: `applyEndpoints` non droppa più,
  `endpointsDiverge` reso; solo `EdgeAuthoringPanel.tsx`, `edgeAuthoring.test.ts`, log).
- Ancoraggi noti, da riverificare per contenuto e non per riga: `isUsableEndpointExpr`
  definita a `EdgeAuthoringPanel.tsx:79`, call-site `:215, :252, :565, :577`; mirror in
  `edgeAuthoring.test.ts:130`, `:200+`; commento obsoleto `:166-176`; asserzione corretta
  `:271-278`.
- `ir/pathExpr.ts` (`fc0af70d2`) è il modello del modulo puro.
- Decisioni che vincolano: scrittura atomica dei capi (entrambe le chiavi o nessuna);
  `validateIR` muto sullo stato divergente; un solo draft e un solo debounce (300 ms) a
  livello di pannello.

---
**Nome del documento prompt**: 2026-08-05 21:45 prompt_recupero_capi_2_1_C1_C4
