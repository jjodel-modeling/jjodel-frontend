# Ratifiche 2026-08-05 (terza sessione): canonicalize e risalita al parent

**Data**: 2026-08-05, 14:40
**Ratificate da**: Alfonso, su delega esplicita ("decidi tu", con vincolo di fretta).
**Rapporto con le ratifiche precedenti**: completano, non superano. **R-F** chiude la trappola
lasciata aperta da R-1 di `claude/ratifiche_2026-08-04_tab_partizione.md`; **R-G** chiude la
decisione sospesa su F3 registrata in `claude/backlog_2026-08-04_vista_ordinata.md`.
**Numerazione**: prosegue la serie a lettere aperta il 2026-08-05 in
`claude/ratifiche_2026-08-05_panel_state_lifting.md` (R-A..R-E) più R-8 dell'emendamento sulla
strada B. Le due qui sono R-F e R-G.

## R-F: `canonicalize` esclude il pin di identità

**Ratificato**: `canonicalize` esclude il campo del pin dal confronto, esattamente come già fa
con `migratedFrom`. Il vincolo di scrittura congiunta con `metaclasses` già presente nel prompt
1.3 **resta valido e non viene sostituito**: le due cose stanno insieme, una è una proprietà,
l'altra è un'igiene.

Scartata l'altra uscita di R-1 (scrivere il pin solo su azione esplicita dell'autore) come
**decisione autonoma**. Continua a valere come effetto collaterale della scrittura congiunta,
ma non è ciò che protegge dalla trappola.

### Perché l'esclusione, e non la sola disciplina di scrittura

1. **È una questione di categoria, non di taratura.** `canonicalize` serve a confrontare due IR
   per quello che significano. Esclude già `migratedFrom` perché è metadato di provenienza. Il
   pin è metadato di authoring per ratifica esplicita di R-1, e il resolver non lo legge:
   lasciarlo dentro l'hash significa far dipendere l'identità semantica di un IR da un campo che
   la semantica non consulta. Non è una scelta prudenziale, è la correzione di un errore di
   definizione.
2. **La disciplina va ricordata, la proprietà no.** La scrittura congiunta protegge finché ogni
   sito di scrittura, presente e futuro, se ne ricorda. L'esclusione rende la trappola
   irraggiungibile qualunque cosa faccia il chiamante. Il progetto ha già pagato tre volte per
   la forma "stessa regola replicata in N punti" (`parsePathExpr` in tre copie,
   `isUsableEndpointExpr` più il suo mirror, `nextEdgeForEndpoints`).
3. **La sola disciplina lascia scoperto un caso residuo.** Una riscrittura idempotente di
   `metaclasses` (stessi nomi, ma con il pin che prima non c'era) cambierebbe l'hash senza
   cambiare niente di semantico, e la view smetterebbe di delegare al rendering nativo. Con
   l'esclusione quel caso non esiste.
4. **Costo**: una riga, nello stesso punto e con lo stesso pattern di `migratedFrom`, e
   testabile in isolamento come tutta `irDefaults.ts`.

### Conseguenza da mettere agli atti

Due IR che differiscono **solo** per il pin producono lo stesso `irHash`. È esattamente ciò che
si vuole per `isMigratedDefaultView`, perché il pin non cambia il rendering. Ma è anche una
promessa: **nessuna memoizzazione di livello authoring può essere keyata su `irHash`**, perché
non si invaliderebbe al cambio di pin.

**Guardia da eseguire dentro la slice 1.3** (costa una `grep`, non è discovery): censire i
consumatori di `irHash` e `canonicalize`. Se ne esiste uno di livello authoring, va segnalato
nel report di chiusura prima di procedere, non scoperto dopo.

## R-G: la risalita al parent nomina la feature di composizione

**Ratificato**: la semantica dell'operatore di risalita è **"il contenitore che mi tiene tramite
questa feature"**, non "il contenitore di questo tipo" e non "il mio contenitore" generico.
Scartate la forma tipata (`$^State`) e la forma nuda (`$^`).

Il **lessema concreto** (`$^transitions` o altra forma) resta delegato al prompt di
implementazione, subordinato alla ricerca globale di collisione sul carattere prescelto dentro
la grammatica PathExpr esistente. Qui si ratifica la semantica, non i caratteri.

### Perché la feature

1. **Disambigua, il tipo no.** Una metaclasse può essere contenuta da più feature dello stesso
   parent (`regions` e `subStates` che contengono entrambe `State`). Nominare il tipo non
   distingue i due casi. È la stessa forma dell'argomento di R-1 sul pin di identità: si nomina
   ciò che identifica, non ciò che oggi capita di essere unico.
2. **È verificabile staticamente.** Data la metaclasse figlia, l'insieme delle feature di
   composizione che possono contenerla è calcolabile sul metamodello. Quindi il pannello
   **offre una lista** invece di accettare testo libero, e il compilatore rifiuta una feature
   inesistente. L'obiezione ovvia alla forma per feature (l'autore non conosce il nome) cade
   proprio qui: l'autore sceglie, non digita.
3. **Non introduce un secondo vocabolario.** PathExpr oggi naviga **feature** scendendo
   (`$attributes`, `$ref.values[0]`). Risalire per feature è lo stesso vocabolario con un
   marcatore di direzione; risalire per tipo aggiungerebbe una seconda categoria di nomi a una
   grammatica che ne ha una sola.
4. **Riusa il canale di invalidazione esistente.** Il debito noto "path non invalidati al cambio
   metaclasse" copre già i riferimenti a feature. Una risalita per tipo richiederebbe un secondo
   canale keyato sui nomi di metaclasse.

### Due vincoli per il prompt di F3 (task 2.3)

**V1: nessun fallimento silenzioso, questa volta.** Il debito ⚠️ già registrato (path non
invalidati, fallimento muto) è la ragione per cui questa feature non deve nascere con lo stesso
difetto. La feature offerta viene calcolata dal metamodello e una feature ignota viene rifiutata
dal compilatore, non ignorata.

**V2: 2.1 è prerequisito duro, non consigliato.** Estendere la grammatica mentre
`isUsableEndpointExpr` vive in cinque copie significa che l'endpoint accetterà ciò che il
compilatore rifiuta, o il contrario. 2.3 non parte prima che 2.1 sia landata.

## Effetto sul backlog

- **1.3 è sbloccato.** Prompt aggiornato in
  `claude/2026-08-05_prompt_1_3_pin_identita_metaclasse_v2.md` (14:40): la trappola di
  `isMigratedDefaultView` era ratificata il 04-08 come "da mettere nel prompt" e nella v1 **non
  c'era**. Ora c'è, con la decisione R-F, il file in DOVE, due test e una verifica visiva
  dedicata.
- **2.3 (F3) è sbloccato**, ma resta dietro 2.1 e 2.2 per sequenza.
- Restano aperte, e non sono toccate qui: R-2 (collasso condiviso fra viewpoint), R-9
  (isolamento per modello dei singleton di sessione), la misura residua sul css di default sotto
  prefisso `body` che decide la taglia di 3.6.

## Rettifica del 2026-08-05 (quarta sessione)

Il rinvio al prompt 1.3 in questo documento puntava a
`claude/2026-08-05_prompt_1_3_pin_identita_metaclasse.md`, cioè alla **v1**, che è la versione
priva del punto 5 sulla trappola di `isMigratedDefaultView`. Chi avesse seguito il rinvio
avrebbe eseguito proprio la variante che R-F esiste per correggere.

Fatto: il rinvio ora punta a `..._v2.md`, e la v1 è stata **rimossa dal knowledge base** perché
non fosse pescabile per nome. La v2 è l'unica versione valida del prompt 1.3.
