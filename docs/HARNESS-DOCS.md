# HARNESS-DOCS — organizzazione documentale dell'harness Jjodel

Posizione: `docs/HARNESS-DOCS.md` nel repo `jjodel-frontend`.
Versione: 1.0 (2026-08-15).
Copia nel Project Knowledge: sì, integrale. Sostituisce `INDICE_ARCHIVIO.md`.

Questo file dice, per ogni tipo di documento che l'harness produce, chi lo scrive, chi lo legge, dove
vive, come si chiama, che formato ha, quale gate lo verifica e quando muore. È normativo: un prompt
può citarlo, e in caso di conflitto con la pratica corrente vince questo file finché non viene
emendato qui.

Non contiene razionale storico. Le motivazioni delle scelte stanno nei verbali (`docs/ratifiche/`),
i vincoli operativi che ne discendono in `docs/decisions.md`, la cronaca della bonifica documentale
in `docs/archivio/triage_kb_2026-08-15.md`.

**Nota sui trattini lunghi.** Le regole di scrittura del progetto li vietano. Compaiono qui solo
dentro i blocchi di formato citati verbatim (intestazione delle entry di log, intestazione delle
clausole di `PROTOCOL.md`, riga di protocollo in testa ai prompt), dove sono parte della sintassi
validata da `npm run check:docs`. Fuori da quei blocchi non se ne usano.

---

## 1. I tre attori e i due depositi

L'harness ha tre attori e due soli posti dove un documento può vivere. Ogni confusione documentale
osservata finora nasce dall'aver messo un documento nel deposito sbagliato.

| Attore | Superficie | Produce | Consuma |
|---|---|---|---|
| **Alfonso**, direttore | verifica visiva su `http://localhost:3000` | decisioni, GO visivi, ratifiche | tutto |
| **Claude architetto** | chat di progetto claude.ai, o sessione Cowork col bridge sulla cartella | prompt, memo di ratifica, checkpoint, indici | Project Knowledge, e col bridge anche il repo |
| **Claude Code** | plugin VS Code, sul repo | codice, discovery report, entry di log, commit | `CLAUDE.md`, `PROTOCOL.md`, `decisions.md`, `claude-code-log.md`, il prompt ricevuto |

| Deposito | Cosa contiene | Chi lo vede | Persistenza | Costo |
|---|---|---|---|---|
| **Project Knowledge** (claude.ai) | sei documenti, lo stato corrente | ogni chat del progetto, sempre, via RAG | permanente finché non si cancella | ogni documento in più diluisce il retrieval di tutti gli altri |
| **Repo**, sotto `docs/` | tutto il resto, la storia | Claude Code sempre; l'architetto solo col bridge connesso | permanente, versionata | nessuno finché non si legge |

La regola che li separa: **il Project Knowledge tiene lo stato corrente, il repo tiene la storia.**
Un documento che descrive qualcosa di concluso non ha titolo per stare nel KB, anche se è recente.

---

## 2. Il Project Knowledge: sei documenti, per nome

| # | Documento | Chi lo scrive | Quando cambia | Ruolo |
|---|---|---|---|---|
| 1 | `contesto_progetto.md` | architetto | a fine sessione, o quando lo stato è divergente | indice di alto livello: fronti aperti e chiusi, stato su origin, bug, debiti, regole di processo, info strutturali |
| 2 | `sessione_CORRENTE.md` | architetto | a ogni checkpoint, **per sostituzione** | ultimo checkpoint di sessione, integrale |
| 3 | `spec_attive.md` | architetto | quando una spec nasce o è emendata | indice delle spec vigenti, catena di supersessione, puntatori ai file integrali nel repo |
| 4 | `HARNESS-DOCS.md` | architetto | quando cambia l'organizzazione documentale | questo file |
| 5 | `template-ir-authoring` | architetto | raramente | template attivo |
| 6 | `template-task-visivi` | architetto | raramente | template attivo |

**La whitelist è per nome, non per prefisso.** I documenti scritti da un agente finiscono sotto il
namespace `claude/` per costruzione dello strumento, quindi `spec_attive.md` e `HARNESS-DOCS.md`
compaiono come `claude/spec_attive.md` e `claude/HARNESS-DOCS.md`. Una bonifica futura che
cancellasse tutto ciò che sta sotto `claude/` distruggerebbe due dei sei file da tenere.

**Cosa non entra mai nel Project Knowledge**: prompt, memo di ratifica, discovery report, checkpoint
storici, spec integrali, snippet, mockup, harness eseguibili, patch, `CLAUDE.md`. Le prime sei classi
vanno in `docs/`; `CLAUDE.md` sta già nella root del repo e Claude Code lo legge da lì, mentre nel KB
peserebbe 48 KB e dominerebbe il retrieval di ogni query.

**Se il conteggio supera sei, il ciclo è rotto.** Non è una soglia estetica: il 14 agosto 2026 il KB
aveva 339 documenti e alla query «stato corrente e prossimi passi» rispondeva con un design doc di
maggio e con un `contesto_progetto.md` fermo a quattro giorni prima, senza mai restituire il
checkpoint di quella notte.

---

## 3. Il repo: mappa di `docs/`

842 file. Le cartelle vive dell'harness sono le prime sei.

| Cartella | File | Contenuto | Chi scrive | Naming |
|---|---|---|---|---|
| `docs/prompts/` | 195 | prompt Claude Code eseguiti | architetto | `claude_<data>[_<HHmm>]_prompt_<slug>.md` |
| `docs/discovery/` | 256 | discovery report | Claude Code, o architetto col bridge | `discovery_<data>_<slug>.md` |
| `docs/ratifiche/` | 40 | verbali delle decisioni, con alternative scartate | architetto | `claude_<data>_<memo\|ratifiche>_<slug>.md` |
| `docs/sessioni/` | 32 | checkpoint di sessione storici | architetto | `claude_sessione_<data>[_N].md` |
| `docs/archivio/` | 31 | materiale di lavoro: piani, backlog, censimenti, mappe, review, verifiche, kickoff, triage | architetto | `claude_<slug>.md` |
| `docs/archivio/artefatti/` | 14 | allegati non testuali: snippet, mockup, harness eseguibili, cruscotti | architetto | `claude_<tipo>_<data>_<slug>.<ext>` |
| `docs/spec/` | 9 | spec integrali vigenti | architetto | `claude_spec_<data>_<slug>.md` |
| `docs/spec/parcheggiate/` | 2 | spec congelate, recuperabili per decisione esplicita | architetto | invariato |
| `docs/redesign/` | 19 | documenti di design, incluso `rail/` | Alfonso, o fonti esterne | libero |
| `docs/benchmarks/` | 11 | harness di misura e risultati versionati | Claude Code | `<data>_<scenario>_run<N>.json` |
| `docs/reports/` | 11 | analisi e diagnostiche di aprile-maggio 2026 | storico | libero |
| `docs/handover/` | 25 | handover storici | storico | libero |
| `docs/parked/` | 3 | codice e prompt parcheggiati, fuori dalla build | Alfonso | `.parked` sul codice |
| `docs/mde-intelligence-2026/` | 9 più sottocartelle | materiale del paper: goal model, metriche, debt register, fasi di evoluzione dell'harness | Alfonso | libero |
| radice di `docs/` | 58 `.md` | i normativi vivi più molto storico | vedi §4 e §11 | maiuscolo per i normativi |

`docs/help/` contiene documentazione del prodotto per l'utente finale, non dell'harness. `docs/_agents/`,
`docs/ai-agents/` e `docs/analysis/` contengono un file ciascuno, storico: vedi §11.

---

## 4. Schede per tipo di documento

### 4.1 Prompt Claude Code

**Definizione.** L'unità di lavoro trasferita dall'architetto all'esecutore. Autoportante: contiene
tutto ciò che serve, e non presuppone la conversazione in cui è nato.

**Produttore**: architetto. **Consumatore**: Claude Code, una volta.
**Path**: `docs/prompts/`. **Naming**: `claude_<YYYY-MM-DD>[_<HHmm>]_prompt_<slug_snake_case>.md`.

L'orario nel nome non è decorativo. Il campo `**Corregge**` del prompt log si risolve sul prefisso
timestamp `YYYY-MM-DD HH:mm` (ratifica RC-7), quindi un prompt senza orario non può essere puntato da
una catena di rework e sparisce dalla misura del tasso di successo al primo colpo. Oggi solo 29 dei
194 prompt archiviati portano l'orario: è un debito noto, e vale per i nuovi.

**Struttura**: intestazione con nome del documento e riga di protocollo, poi COSA, DOVE, COME,
RIFERIMENTI. Le clausole condivise si citano per numero, non si ricopiano.

```
# <titolo>

> **Nome del documento prompt**: YYYY-MM-DD HH:mm

Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P<n> non si applica (motivo: ...).

Leggi `CLAUDE.md`. Branch: `alfonso-frontend-jjtl`.

## Contesto (non rifare l'analisi)
## COSA
## HARD STOP
## NON FARE
## RIFERIMENTI
```

**Due corsie** (ratifica RC-3, 2026-08-05). Corsia completa, con two-phase, discovery report,
ratifiche, verbale e gate pieni, per: critical zone (`useJjomSync.ts`, `portDistribution.ts`),
migrazioni, task sopra tre file, task che cambiano interfacce esportate. Corsia veloce per tutto il
resto: prompt fino a circa 80 righe, verifica preventiva inline riportata in massimo dieci righe
nella entry di log, nessun report separato, gate ridotti, verifica visiva raggruppata in un solo hard
stop di fine sessione. **Il prompt dichiara in testa la propria corsia.**

**Ciclo di vita**: nasce in chat, si esegue una volta, si archivia. Non si riscrive dopo l'esecuzione:
se il risultato va corretto, nasce un prompt nuovo che punta al vecchio con `**Corregge**`.

**Errori tipici**: prompt che assume lo stato del working tree (vietato da R-RAIL-27, quello stato
non è invariante per macchina); prompt che chiede un'asserzione di assenza senza dichiarare la
ricerca che la sostiene (R-RAIL-28); glob non quotati nei comandi di shell (R-RAIL-31).

### 4.2 Discovery report

**Definizione.** L'esito scritto della Fase 1 read-only. È un insieme di ipotesi con evidenze, non un
riferimento definitivo: chi lo usa a valle rilegge i file reali.

**Produttore**: Claude Code, o l'architetto quando lavora col bridge. **Consumatore**: architetto,
per decidere; poi il prompt di Fase 2.
**Path**: `docs/discovery/`. **Naming**: `discovery_<YYYY-MM-DD>_<descrizione_snake_case>.md`,
suffisso `_N` per più report dello stesso giorno sullo stesso tema. Senza prefisso `claude_`, a
differenza di tutto il resto.

**Contenuto minimo** (P4): l'ipotesi che la discovery sta falsificando, l'obiettivo, i file letti con
path completi, i findings con `file:riga` e citazione verbatim, dipendenze e rischi, domande aperte.

**Regola dura**: il report chiude la Fase 1. L'hard stop non è raggiunto finché non è scritto, e
l'analisi in chat parte dal file salvato, non dalla memoria della sessione. Una discovery breve
produce un report sintetico, mai nessun report.

**Report già esistente al path indicato** (ratifica R-E/E-1): non si riscrive. Si legge per intero,
si confronta punto per punto, si aggiunge in coda un addendum con le sole cose non coperte.

**Vincolo sull'architetto**: ogni prompt che contiene una fase di discovery deve riportare
esplicitamente path e naming, così l'esecutore non può ometterli.

**Sottocartelle**: `docs/discovery/harness/` contiene gli harness eseguibili di misura usati da una
discovery (`.mjs`, `.html`); `docs/discovery/emse-dataset/` è materiale di ricerca, non harness.

### 4.3 Memo di ratifica

**Definizione.** Il verbale di una decisione presa in chat: cosa è stato deciso, perché, e cosa è
stato scartato. È la fonte; il vincolo che ne discende vive altrove.

**Produttore**: architetto, dopo che Alfonso ha ratificato. **Consumatore**: architetto delle sessioni
successive, e chiunque debba capire perché una regola esiste.
**Path**: `docs/ratifiche/`. **Naming**: `claude_<YYYY-MM-DD>_memo_<slug>.md` o
`claude_ratifiche_<YYYY-MM-DD>_<slug>.md`.

**Struttura**: data, branch, commit di riferimento, report di riferimento, poi la decisione, il
contratto o la formula, il razionale, le alternative scartate con la ragione, il prossimo passo.

**Regola di completamento**: un memo non è chiuso finché la riga corrispondente non è in
`docs/decisions.md`. Una decisione che sta solo nel memo non vincola l'esecutore, che il memo non lo
legge.

### 4.4 Riga di decisione

**Definizione.** Il vincolo operativo, in una riga. `docs/decisions.md`, 55 KB, letto da Claude Code
a inizio sessione come `CLAUDE.md`.

**Formato**: `**<SIGLA>** (<data>) — <vincolo operativo>`. Le motivazioni estese non stanno qui,
stanno nel memo.

**Organizzazione**: per serie, ciascuna con la propria sezione. Oggi: Processo (RC-n, R-E/E-n), Arco A,
Voce 4, Edge IR (R-B), arco U, Voce 5, arco rail destro (R-RAIL-1..45), serie R-IRN. In coda la
sezione **Superate**, dove le decisioni sostituite si spostano con la data.

**Disambiguazione**: quando due serie condividono una sigla, si cita l'id con la data.

**Errore tipico**: sigle nate in un memo e mai iscritte. Al 15 agosto 2026 le serie D (forme,
dashboard) e R-J (JjEL) sono in questo stato, e per R-J esiste già un prompt esecutivo che le cita
come governanti. O si iscrivono, o il prompt non va eseguito.

### 4.5 Entry di prompt log

**Definizione.** Il registro append-only di cosa è stato fatto, con l'autovalutazione.
`docs/claude-code-log.md`, 199 KB, 38 entry attive; l'archivio `docs/claude-code-log-archive.md`
pesa 2,4 MB e ne contiene 760.

**Produttore**: Claude Code al termine di ogni task, dopo la conferma visiva. **Consumatore**: Claude
Code a inizio sessione, e la misura del processo.

**Formato canonico**, definito in `CLAUDE.md` §21.2 e ricopiato verbatim in `PROTOCOL.md` P9. I due
blocchi sono confrontati byte a byte dal gate `check:docs`, check A:

```
## YYYY-MM-DD — type: short description
**Prompt**: summary of received prompt
**Files touched**: list of modified files
**Outcome**: ✅ completed | ⚠️ partial | ❌ problems
**Corregge**: <name of the prompt document this task corrects> | —
**Causa**: <letter from the §21.3 taxonomy> | —
**Regressions**: yes | no | unknown
**Out-of-scope changes**: yes | no
**Layer Impact Report**: produced | not-required | skipped
**Smoke visivo**: passato | fallito (dettaglio) | non applicabile
**Notes**: (optional)
**Prompt document name**: YYYY-MM-DD HH:mm
```

**Semantica dei campi di autovalutazione** (`CLAUDE.md` §21.3), verificata dal check B su tutte le
entry dal 2026-08-02 in poi:

- `Corregge`: il nome del prompt che questo task esiste per rimediare, **anche se quel task era
  chiuso con ✅**. Altrimenti il sentinella. Solo due valori sono ammessi: il sentinella, oppure un
  timestamp `YYYY-MM-DD HH:mm` eventualmente seguito da un'annotazione. Un path o una frase fanno
  fallire il gate.
- `Causa`: una lettera sola, la prevalente. Si compila quando l'esito è ⚠️ o ❌, **oppure** quando
  `Corregge` è compilato. Tassonomia: (a) specifica ambigua o incompleta nel prompt; (b) scope
  ecceduto; (c) discovery insufficiente o assunzione sbagliata sul codice esistente; (d) regressione
  visiva trovata solo alla verifica manuale; (e) conflitto con lo stato git non committato;
  (f) decisione architetturale cambiata a metà; (g) ambientale od operativa.
- `Regressions`: `unknown` se non verificabile. `no` significa «ho verificato che non si è rotto
  niente», non «spero».
- `Out-of-scope changes`: aggiungere un import mancante in un file dichiarato non conta; toccare un
  file adiacente per migliorarlo conta, a prescindere dall'intenzione.
- `Layer Impact Report`: `skipped` è una violazione di processo. Si marca onestamente.

**Principio di onestà**: nel dubbio si marca l'opzione peggiore. Un segnale negativo onesto vale più
di una entry conforme che nasconde un problema. Nessuno assegna voti: i campi servono a far emergere
pattern nel tempo.

**Ordinamento**: newest-first **per giorno** (R-RAIL-45). L'ordine si legge nella data, mai nella
posizione.

**Rotazione**: oltre le 20 entry attive, le più vecchie si spostano in `claude-code-log-archive.md`.
Oggi sono 38: la rotazione è dovuta e rinviata, perché sullo stesso file lavorano sessioni
concorrenti e va fatta a repo fermo.

**Staging in un file denso** (`CLAUDE.md` §6.1): `git add -p` presenta un unico hunk gigante. Si usa
invece il pattern backup, `git checkout HEAD --`, reincollo delle sole entry da committare, commit,
ripristino.

### 4.6 Checkpoint di sessione

**Definizione.** Lo snapshot autoportante con cui una sessione passa il testimone alla successiva. È
la staffetta di continuità dell'harness.

**Produttore**: architetto. **Consumatore**: la sessione successiva, come primo documento letto.
**Quando**: al 60% stimato di riempimento del contesto, o su richiesta esplicita con la parola
`checkpoint`, o a fine sessione.

**Sezioni**: stato a fine sessione (tabella dei commit, con la colonna «verificato»), decisioni prese,
bug risolti con root cause e fix, bug nuovi e todo con priorità, documenti aggiornati, prompt generati
con esito, prompt pendenti, prossimi passi ordinati, info strutturali scoperte, cronologia.

**Doppia vita**: la versione corrente sta nel KB come `sessione_CORRENTE.md` e si **sostituisce**, non
si affianca; la precedente si committa in `docs/sessioni/` come `claude_sessione_<data>[_N].md`.

**Precisazione sulla verifica**: la colonna «verificato» distingue «gate verdi» da «visto a schermo da
Alfonso». Sono due cose diverse e il checkpoint non le confonde. Due volte in due giorni una verifica
visiva ha smentito un checkpoint che dava una cosa per fatta: un documento che dice «fatto» non è una
prova che sia fatto.

### 4.7 Spec, addendum, e l'indice delle spec

**Spec integrale**: `docs/spec/claude_spec_<data>_<slug>.md`. Normativa. Un addendum è additivo su una
sezione della spec base e non la riscrive.

**Indice**: `spec_attive.md`, nel KB. Contiene stato, catena di supersessione, invarianti essenziali e
puntatore al file integrale. Non duplica il contenuto normativo: **se l'indice contraddice il file
integrale, vince il file integrale.**

**Regola di manutenzione**: quando una spec nasce o è emendata, file integrale nel repo, riga
aggiornata nell'indice, indice ricaricato nel KB per sostituzione.

**Promozione**: un contratto implementato e stabilizzato che vive ancora solo in un memo va promosso ad
addendum. Oggi il contratto della taglia delle forme (`contentRect` / `boxForContent`, decisioni
D8..D13) è in questo stato: implementato nel registry, inerte, senza un file in `docs/spec/`.

### 4.8 Materiale di lavoro

**Cosa**: piani, backlog, censimenti, mappe di copertura, proposte, review, verifiche, kickoff, triage.
Non normativo. **Path**: `docs/archivio/`. **Naming**: `claude_<slug>.md`.

Il confine con `docs/ratifiche/` è netto: se il documento registra una decisione presa, è un verbale e
va in `ratifiche/`; se prepara una decisione o fotografa uno stato, è materiale di lavoro.

### 4.9 Artefatti non testuali

**Cosa**: snippet `.js`, mockup `.html`, harness eseguibili `.mjs`, cruscotti `.jsx`, seed `.json`.
**Path**: `docs/archivio/artefatti/`. Eccezione: gli harness di misura nati dentro una discovery
stanno in `docs/discovery/harness/`, accanto al report che li ha prodotti.

**Patch e mbox: non si archiviano.** Git è la fonte di verità, e una patch salvata a parte è un
duplicato inerte che invita a riapplicare qualcosa di già applicato. Regola fissata dal triage del
2026-08-09 e applicata il 2026-08-15 su 22 file.

### 4.10 Documenti normativi

Vedi §5.

---

## 5. I normativi e la loro gerarchia

| File | Ruolo | Chi lo legge | Come si modifica |
|---|---|---|---|
| `CLAUDE.md` (root) | fonte di verità delle convenzioni del codebase: regole non negoziabili, critical zone e Layer Impact Report (§3), diagnosi dei bug visivi (§5), comandi (§17), semantica dell'autovalutazione (§21.3) | Claude Code a inizio di ogni sessione | a mano, poi `npm run gen:agents` e `npm run check:agents` |
| `AGENTS.md` (root) | **generato** da `CLAUDE.md` per gli agenti non-Claude | altri agenti | **mai a mano**: si rigenera |
| `docs/PROTOCOL.md` | regole di ingaggio condivise, clausole P1..P10, citate per numero dai prompt | tutti e tre gli attori | a mano, con bump di versione |
| `docs/decisions.md` | vincoli operativi attivi, una riga per decisione | Claude Code a inizio sessione | si aggiunge in coda alla serie; le superate si spostano |
| `docs/TECH-DEBT.md` | debiti tecnici aperti con priorità, 31 KB | architetto in planning | si aggiunge o si chiude una voce |
| `docs/claude-code-log.md` | registro operativo | Claude Code a inizio sessione | append in testa, formato validato |
| `docs/HARNESS-DOCS.md` | questo file | architetto, e i prompt che lo citano | a mano, con bump di versione |

**Ordine di precedenza in caso di conflitto**, dal più forte:

1. `CLAUDE.md`, regole non negoziabili. Se un prompt le contraddice, Claude Code si ferma e segnala.
   Non esegue e non ignora in silenzio.
2. Regole della critical zone (`CLAUDE.md` §3.x). Sovrascrivono la regola 1 sullo scope: se una regola
   di §3 impone di toccare un file fuori dallo scope dichiarato, si segue §3 e si riporta
   l'allargamento nel diff di chiusura.
3. `docs/decisions.md`, vincoli ratificati.
4. `docs/PROTOCOL.md`, clausole P1..P10, salvo deroga esplicita e motivata nel prompt.
5. Il prompt.

**Duplicazione controllata**: il blocco di formato delle entry di log esiste in due posti,
`CLAUDE.md` §21.2 e `PROTOCOL.md` P9, ed è l'unica duplicazione ammessa perché un gate la verifica
byte a byte. Ogni altra duplicazione è un difetto: `PROTOCOL.md` non ripete la critical zone,
`CLAUDE.md` non ripete le clausole di ingaggio.

---

## 6. Gate: cosa verifica una macchina, cosa la disciplina

I documenti generati sono verificati da un gate, non dalla disciplina (ratifica RC-7).

| Comando | Cosa verifica | Stato al 2026-08-15 |
|---|---|---|
| `npm run check:docs` | **A**: identità byte a byte del blocco di formato fra `CLAUDE.md` §21.2 e `PROTOCOL.md` P9. **B**: campi delle entry di log dal 2026-08-02 in poi, con tassonomia e forma dei valori | A passa, B fallisce su cinque entry preesistenti del 14 agosto |
| `npm run check:agents` | rigenera in una temp di sistema e confronta con **tutti** i file prodotti dal generatore (`AGENTS.md` e `frontend/src/jjtl/AGENTS.md`), mai il solo root | da eseguire dopo ogni tocco a un `CLAUDE.md` |
| `npm run typecheck` | `tsc --noEmit`. Baseline: 33 su macOS, 14 su Linux, ed è lo stesso numero (19 errori di casing non esistono su filesystem case-sensitive) | verde rispetto alla baseline |
| `npx vitest run` | test unitari | 1179 passed, 0 failed; nove suite non collezionano per `window is not defined`, note |
| `npm run build` | build di produzione | verde |
| `npm run smoke` | cinque asserzioni su stati noti: console pulita, larghezza del canvas sopra soglia, nodi renderizzati sopra zero, nessun `position: fixed` che interseca la status bar, nessun figlio clippato oltre tolleranza | implementato; i prompt che non lo usano dichiarano la deroga |

**Cosa nessun gate verifica, e resta disciplina**: che un memo abbia la sua riga in `decisions.md`;
che un prompt abbia l'orario nel nome; che il Project Knowledge stia a sei file; che un discovery
report sia stato davvero scritto prima dell'hard stop. Sono i quattro punti dove l'harness ha già
ceduto almeno una volta.

**Regola sui gate rossi**: non si edita un documento solo per far tornare verde un gate. Il messaggio
di `check:docs` lo dice esplicitamente. Si legge prima cosa è fallito.

---

## 7. Il ciclo di vita di un task, documento per documento

**Corsia completa.**

```
Alfonso chiede una feature
   → architetto scrive il PROMPT DI DISCOVERY            docs/prompts/
       (con path e naming del report scritti dentro)
   → Claude Code esegue Fase 1 read-only
   → Claude Code scrive il DISCOVERY REPORT              docs/discovery/
   → HARD STOP
   → architetto analizza il report in chat, non a memoria
   → Alfonso ratifica
   → architetto scrive il MEMO DI RATIFICA               docs/ratifiche/
   → architetto aggiunge la RIGA in                      docs/decisions.md
   → architetto scrive il PROMPT DI IMPLEMENTAZIONE      docs/prompts/
   → Claude Code implementa, gate, commit
   → Claude Code scrive l'ENTRY DI LOG                   docs/claude-code-log.md
   → Alfonso verifica a schermo, GO o rework
   → al 60% di contesto: architetto scrive il CHECKPOINT
       sessione_CORRENTE.md nel KB (sostituzione),
       la versione precedente in                         docs/sessioni/
```

**Corsia veloce**: cadono discovery report, memo e ratifica; il prompt sta sotto le 80 righe, la
verifica preventiva sta in dieci righe dentro l'entry di log, la verifica visiva si raggruppa in un
solo hard stop di fine sessione. Restano obbligatori: prompt archiviato, entry di log, commit.

**Eccezione documentata**: dal 13 al 15 agosto 2026 quattro sessioni hanno implementato direttamente
in chat Cowork col bridge, saltando Claude Code. Resta l'eccezione, non la norma, ed è dichiarata nei
checkpoint. In quella configurazione il produttore del discovery report e dell'entry di log è
l'architetto, il resto non cambia.

---

## 8. Naming: tabella completa

| Tipo | Pattern | Esempio reale |
|---|---|---|
| prompt | `claude_<YYYY-MM-DD>[_<HHmm>]_prompt_<slug>.md` | `claude_2026-08-13_1400_prompt_arco3_fase1_discovery.md` |
| discovery report | `discovery_<YYYY-MM-DD>_<slug>[_N].md` | `discovery_2026-08-14_labelbox_content_inset.md` |
| memo di ratifica | `claude_<YYYY-MM-DD>_memo_<slug>.md` | `claude_2026-08-14_memo_ratifica_taglia_forme_geometriche.md` |
| verbale di ratifica | `claude_ratifiche_<YYYY-MM-DD>_<slug>.md` | `claude_ratifiche_2026-08-05_panel_state_lifting.md` |
| checkpoint | `claude_sessione_<YYYY-MM-DD>[_N].md` | `claude_sessione_2026-08-15.md` |
| spec | `claude_spec_<YYYY-MM-DD>_<slug>.md` | `claude_spec_2026-07-18_ir_schema_v1_2.md` |
| materiale di lavoro | `claude_<slug>.md` | `claude_backlog_2026-08-04_vista_ordinata.md` |
| artefatto | `claude_<tipo>_<YYYY-MM-DD>_<slug>.<ext>` | `claude_snippet_2026-07-26_edge_view_ir_e0.js` |
| triage documentale | `triage_kb_<YYYY-MM-DD>.md` | `triage_kb_2026-08-15.md` |
| risultato di benchmark | `<YYYY-MM-DD>_<scenario>_run<N>.json` | `2026-07-19_baseline_m3_run1.json` |

**Regole trasversali.** Data sempre `YYYY-MM-DD`. Slug in `snake_case`, mai trattini singoli (i nomi
di trasformazione seguono la stessa regola nel prodotto). Prefisso `claude_` su tutto ciò che nasce in
chat, tranne i discovery report, che seguono il naming di P4 perché li produce l'esecutore. Suffisso
`_N` per il secondo documento dello stesso tipo, stesso giorno, stesso tema.

---

## 9. Ciclo di vita: come un documento muore

| Documento | Fine |
|---|---|
| prompt | eseguito una volta, archiviato per sempre; se il risultato va corretto nasce un prompt nuovo che lo punta con `Corregge` |
| discovery report | resta; un report successivo sullo stesso tema si aggiunge in coda come addendum, non lo riscrive |
| memo di ratifica | resta; la decisione può finire in **Superate** dentro `decisions.md`, il memo no |
| riga di decisione | si sposta in **Superate** con la data quando una ratifica successiva la sostituisce |
| entry di log | ruota in `claude-code-log-archive.md` oltre le 20 attive |
| checkpoint | esce dal KB alla sostituzione, entra in `docs/sessioni/`, resta |
| spec | passa a SUPERATA nell'indice, il file resta in `docs/spec/` come riferimento storico |
| spec parcheggiata | in `docs/spec/parcheggiate/`, si riattiva per decisione esplicita |
| codice parcheggiato | in `docs/parked/` con estensione `.parked`, fuori dalla build, mai importato |
| patch | non nasce come documento: sta in git |

**Nessun back-filling.** I campi di autovalutazione si applicano dai task successivi al commit che li
ha introdotti. Le entry esistenti restano come sono.

---

## 10. Mappa tematica dell'archivio

Come trovare la storia di un tema senza frugare. Sostituisce `INDICE_ARCHIVIO.md`.

**Rail destro, archi 1, 2, 3.** Decisioni R-RAIL-1..45 in `docs/decisions.md`. Memo in
`docs/ratifiche/claude_2026-08-1*`. Prompt in `docs/prompts/`, cercare `arco1`, `arco2`, `arco3`,
`rail`. Design di partenza in `docs/redesign/rail/`.

**Forme dei nodi e taglia.** `docs/ratifiche/claude_2026-08-14_memo_ratifica_taglia_forme_geometriche.md`
e `claude_2026-08-15_memo_contratto_contentrect_nel_registry.md`. Piano in
`docs/archivio/claude_2026-08-14_piano_sistema_forme.md`. Discovery `discovery_2026-08-14_ir_shape_form.md`,
`_labelbox_content_inset.md`, `_catalogo_area_utile.md`. Harness di misura in `docs/discovery/harness/`.

**JjEL come linguaggio dell'IR.** `docs/discovery/discovery_2026-08-14_jjel_come_linguaggio_espressioni_ir.md`,
`docs/ratifiche/claude_2026-08-14_memo_ratifica_jjel_linguaggio_ir.md`,
`docs/prompts/claude_2026-08-14_1530_prompt_J1_walker_jjel_modulo_puro.md`.

**Schema IR.** Catena di supersessione e invarianti in `spec_attive.md`, nel KB. File integrali in
`docs/spec/`.

**Dashboard progetti.** `docs/discovery/discovery_2026-08-14_dashboard_right_panel.md`,
`_catalogo_lotto_e_ordinamento.md`, checkpoint `docs/sessioni/claude_sessione_2026-08-14_2.md`.

**Collasso IR-nativo delle view.** Serie R-IRN in `docs/decisions.md`, discovery
`discovery_2026-08-13_view_creation_sites_ir_native.md` e `_seed_creation_fase0.md`.

**Performance e baseline.** `docs/benchmarks/`, README con harness, metriche e tre campagne di misura
(cloud, M3, post-clamp).

**Stato pre-arco IR, fino ad aprile 2026.** `docs/archivio/claude_archivio_2026-04-16_pre_arco_ir.md`.

**Storia dell'harness stesso.** `docs/archivio/triage_kb_2026-08-09.md` e `triage_kb_2026-08-15.md`;
`docs/mde-intelligence-2026/harness-evolution-phases.md` e `harness-performance-parameters.md`;
`docs/archivio/claude_contesto_progetto_2026-08-10.md` come snapshot dello stato al 10 agosto.

---

## 11. Trappole note

**Documenti che sembrano normativi e non lo sono.** Nella radice di `docs/` e in `docs/ai-agents/`
vive materiale del gennaio-febbraio 2026 che si presenta con l'autorità di una guida e contraddice lo
stato attuale. `docs/ai-agents/README.md` (versione 1.1.0, ultimo aggiornamento 2026-01-24) dice a un
agente di leggere `CLAUDE_DEVELOPMENT_GUIDE.md` per primo, descrive `CLAUDE.md` come «UI/UX design
system», e prescrive un focus rosso `#ef4444` sugli input. Nessuna delle tre cose è vera oggi. Idem
per `AGENTIC-CONVERSATIONAL-DEVELOPMENT.md`, `HANDOVER_COMPLETO.md`, `EDITOR-V3-DESIGN.md` e i 58 file
sciolti nella radice. **Nessuno di questi vincola.** Vincolano solo i file elencati in §5.

**L'archiviazione non è ripulitura.** Copiare un documento nel repo e lasciarlo nel KB non riduce il
rumore: il documento archiviato continua a competere in retrieval con la propria versione più recente.
Sono due passi, e il secondo è quello che conta.

**Il prefisso `claude/` nel KB non è una categoria.** È un namespace che lo strumento assegna ai
documenti scritti da un agente. Non usarlo come criterio di cancellazione.

**I lock di git sul mount del bridge.** Ogni comando git lascia un lock che il mount non consente di
cancellare e che blocca il comando successivo. Vanno spostati in `_to_delete/git-locks/` **prima di
ogni invocazione**, non una volta a inizio catena, e la lista include `index.lock`, `HEAD.lock` e i
lock dei ref. Il warning `unable to unlink` sul `mv` è cosmetico.

**Sessioni concorrenti sullo stesso repo.** Sono la norma. Staging sempre per file o cartella
esplicita, `git status` letto fra la scrittura e lo staging, mai `git add .`.

**I trattini lunghi del formato di log sono validati dal gate.** Non vanno «corretti» applicando le
regole di scrittura dei documenti.

**Gate girati altrove, commit fatti qui.** Quando i test girano in un container e il commit avviene
sul disco di Alfonso, confrontare gli `sha256` prima di committare. Senza quel confronto «ho fatto
girare i test» e «ho committato quel file» sono due affermazioni diverse.

---

## 12. Invarianti

Le sette righe che reggono tutto il resto.

1. Il Project Knowledge tiene lo stato corrente, il repo tiene la storia. Sei documenti nel KB, per
   nome.
2. Un prompt, un memo o un checkpoint generato in chat si salva in `docs/`, mai nel KB.
3. Ogni fase esplorativa produce un report su file. L'output di terminale o di chat non conta, e
   l'hard stop non è raggiunto finché il report non è scritto.
4. Una decisione che non sta in `docs/decisions.md` non vincola l'esecutore.
5. Ogni task chiude con una entry di log, compilata onestamente. Nel dubbio si marca l'opzione
   peggiore.
6. Un documento che dice «fatto» non è una prova che sia fatto. La verifica batte il documento.
7. Se il conteggio del KB supera sei, o le entry attive del log superano venti, il ciclo è rotto e
   serve un triage, non una deroga.
