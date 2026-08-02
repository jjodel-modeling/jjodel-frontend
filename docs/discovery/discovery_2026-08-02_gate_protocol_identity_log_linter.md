# Discovery — gate di identità del blocco protocollo + linter del claude-code-log

**Data**: 2026-08-02
**Prompt**: 2026-08-02 15:31
**Branch**: `alfonso-frontend-jjtl` @ `733dab0bb` (il prompt cita `1b20cc5c8`; nel frattempo sono atterrati `77edbfbc5` e `733dab0bb`, più due commit Jjodie di un filone concorrente)
**Fase**: 1 (read-only). Nessun file modificato. Unico artefatto prodotto: questo report.
**Protocollo**: `docs/PROTOCOL.md` P1..P9. `Deroga: P8 non applicabile`.

---

## 0. Obiettivo

Rendere eseguibile un vincolo oggi garantito solo da un comando lanciato a mano: l'identità byte a byte del blocco template fra `CLAUDE.md` §21.2 e `docs/PROTOCOL.md` P9. Nello stesso script, validare i valori dei campi `Corregge` e `Causa` nel prompt log.

**Esito della Fase 1: nessun blocco.** L'implementazione è fattibile come descritta. Restano **due domande aperte non risolvibili dai documenti** (§9, Q1 e Q2): il vocabolario atterrato è sotto-specificato rispetto a quello che un linter deve decidere, e le uniche due entry reali che usano i campi non passerebbero un linter scritto alla lettera del prompt.

---

## 1. Infrastruttura di script

`frontend/scripts/`:

```
frontend/scripts/
├── benchmarks/          bench_baseline.mjs, bench.ecore, bench.xmi, generate_synthetic_model.py
├── smoke/               assertions.ts, calibrate.ts, console-baseline.json, README.md, run.ts, states.ts
└── tsconfig.json
```

Esiste anche `scripts/generate-agents.mjs` alla **root del repo**, fuori da `frontend/` (§7).

Script npm rilevanti (`frontend/package.json:92-101`):

| Script | Comando esatto |
|---|---|
| `build` | `vite build` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `typecheck:scripts` | `tsc --noEmit -p scripts/tsconfig.json` |
| `smoke` | `node --disable-warning=ExperimentalWarning --experimental-strip-types scripts/smoke/run.ts` |
| `smoke:calibrate` | `node --disable-warning=ExperimentalWarning --experimental-strip-types scripts/smoke/calibrate.ts` |
| `gen:agents` | `node ../scripts/generate-agents.mjs` |

Runtime degli script `.ts`: **node con `--experimental-strip-types`**, nessun transpiler. Node richiesto >= 22.6.0, verificato su 23.3.0 (`frontend/scripts/smoke/README.md`).

### 1.1 Un nuovo `.ts` rientra automaticamente in `typecheck:scripts`?

**No.** `frontend/scripts/tsconfig.json`:

```json
"include": [
    "smoke/**/*.ts"
]
```

L'include è ristretto a `smoke/`. Un file in `frontend/scripts/gates/` o in `frontend/scripts/` a livello top **non sarebbe coperto**. Il prompt lo prevede: «Se la sua posizione naturale non ci rientra, aggiornare l'include del tsconfig degli script e dichiararlo».

Compiler options rilevanti ereditate: `module: nodenext`, `moduleResolution: nodenext`, `allowImportingTsExtensions: true`, `types: ["node"]`, `strict: true` (da `../tsconfig.json`), `noEmit: true`.

Nota: `types: ["node"]` è già impostato, quindi `node:fs` / `node:path` sono tipizzati senza aggiungere dipendenze.

---

## 2. Ancore del blocco template

Il blocco è **dentro un fence, con info string assente** (fence nudo ```` ``` ````) in entrambi i file.

| | `CLAUDE.md` | `docs/PROTOCOL.md` |
|---|---|---|
| fence di apertura | riga **866** | riga **91** |
| prima riga di contenuto | riga **867** | riga **92** |
| ultima riga di contenuto | riga **878** | riga **103** |
| fence di chiusura | riga **879** | riga **104** |
| righe di contenuto | 12 | 12 |

Prima riga, verbatim e identica nei due file:

```
## YYYY-MM-DD — type: short description
```

Ultima riga, verbatim e identica nei due file:

```
**Prompt document name**: YYYY-MM-DD HH:mm
```

### 2.1 Unicità dell'ancora di inizio

```
$ grep -c "^## YYYY-MM-DD — type: short description" CLAUDE.md docs/PROTOCOL.md AGENTS.md
CLAUDE.md         1
docs/PROTOCOL.md  1
AGENTS.md         1
```

**Compare esattamente una volta in ciascun file.** L'estrazione per ancora è quindi non ambigua oggi. Il Check A deve comunque verificare l'unicità a runtime, come prescritto: è la guardia contro il caso in cui una futura entry di esempio nella documentazione reintroduca la stringa.

Nota sui caratteri: l'ancora contiene un **em dash U+2014** (`—`), non un trattino ASCII. Un `grep` con `-` normale non la trova. Idem per il valore sentinella (§5).

### 2.2 Contesto immediatamente successivo al blocco

- `CLAUDE.md:881` — `This block is the canonical format, mirrored verbatim in \`docs/PROTOCOL.md\` P9.`
- `docs/PROTOCOL.md:106` — `La semantica dei campi di autovalutazione è definita in \`CLAUDE.md\` §21.3.`

**Rilevante per la Fase 2**: `PROTOCOL.md` ha **già** una riga di puntatore a §21.3, subito fuori dal blocco. La riga richiesta dalla tabella DOVE esiste in sostanza. Vedi Q3 (§9).

---

## 3. Nomi dei campi come sono atterrati

Verbatim dal blocco, nell'ordine reale, tutti e dieci:

```
**Prompt**
**Files touched**
**Outcome**
**Corregge**
**Causa**
**Regressions**
**Out-of-scope changes**
**Layer Impact Report**
**Smoke visivo**
**Notes**
**Prompt document name**
```

(undici righe contando l'intestazione `## YYYY-MM-DD — type: short description`)

Osservazione, non un problema ma va detta: i nomi sono **misti italiano/inglese**. `Corregge`, `Causa` e `Smoke visivo` in italiano; il resto in inglese. È lo stato atterrato e il prompt vieta di rinominare.

---

## 4. Vocabolario di `Causa`

Da `CLAUDE.md` §21.3, righe **896-904**, dentro un fence nudo:

```
(a) ambiguous or incomplete specification in the prompt
(b) scope exceeded: files touched that were not declared
(c) insufficient discovery, or a wrong assumption about existing code
(d) visual regression found only at manual verification
(e) conflict with uncommitted git state
(f) architectural decision changed midway
(g) environmental or operational (port, dev server, build, quota, cache)
```

Sette valori, da `(a)` a `(g)`.

### 4.1 È dichiarato chiuso o esemplificativo?

**Né l'uno né l'altro esplicitamente.** §21.3 non usa mai le parole "closed", "exhaustive", "e.g." o "among others". La chiusura è **implicita** in due formulazioni:

- riga 892: «`Causa` — **one letter from the taxonomy below**»
- riga 906: «One letter per entry: the prevailing one. If there genuinely are two, the second goes in `**Notes**`.»

«from the taxonomy below» implica insieme chiuso. Il prompt di Fase 2 lo assume chiuso («il valore di `Causa` deve appartenere al vocabolario chiuso») ed è coerente con la lettura, ma **la chiusura non è scritta a lettere in §21.3**. Se il linter la rende esecutiva, la rende chiusa di fatto: è la scelta giusta, va solo saputa.

### 4.2 Forma del token: con parentesi

La tassonomia rende i valori **con parentesi**: `(a)`, non `a`. E l'unica entry reale che valorizza il campo scrive `**Causa**: (a)`. Vedi §6.2 e Q2.

---

## 5. Regola di compilazione di `Corregge`

`CLAUDE.md` §21.3 riga **891**, verbatim:

> - `Corregge` — the name of the prompt document this task exists to remedy. Fill it whenever the task was born to fix the result of a previous one, **even if that task's outcome was ✅**. Otherwise `—`.

E nel blocco template, riga 871:

```
**Corregge**: <name of the prompt document this task corrects> | —
```

### 5.1 Referente prescritto — nessun conflitto con D1

Il referente è **«the name of the prompt document»**. Il formato del nome del documento prompt è fissato dall'ultimo campo dello stesso blocco:

```
**Prompt document name**: YYYY-MM-DD HH:mm
```

Quindi: il referente prescritto è il nome del documento prompt, **e quel nome è per costruzione un timestamp `YYYY-MM-DD HH:mm`**. La decisione D1 della ratifica, che assume il timestamp come chiave, **coincide** con la regola atterrata.

**Non si applica la condizione di stop del prompt** («se la regola atterrata prescrive un referente diverso dal timestamp, fermarsi»).

Una precisazione onesta: §21.3 non dice letteralmente «timestamp». Dice «name of the prompt document», e il formato del nome si deduce dal campo `**Prompt document name**`. È un'inferenza a un passo, non una lettura letterale. È solida — e l'unica entry reale che valorizza il campo la conferma nell'uso (§6.2) — ma è un'inferenza, e se un domani il naming dei documenti prompt cambiasse, la regola seguirebbe il naming e non il timestamp.

### 5.2 Valore sentinella

**`—`, em dash U+2014.** Confermato in due punti indipendenti: nel template (`| —`) e in §21.3 (`Otherwise \`—\``). Confermato nell'uso reale: `docs/claude-code-log.md:20-21`.

Non è un trattino ASCII `-` né un en dash `–`. Il linter deve confrontare su U+2014.

---

## 6. Stato del log

| File | Righe | Entry (`^## YYYY-MM-DD`) |
|---|---|---|
| `docs/claude-code-log.md` | — | **27** |
| `docs/claude-code-log-archive.md` | 8589 | **640** |

Il log attivo è a 27 entry contro le 20 previste da P9: debito preesistente, già annotato in due entry precedenti, fuori dallo scope di questo task.

### 6.1 Formato reale delle intestazioni

`## YYYY-MM-DD — <tipo>: <descrizione>`, con em dash. Il tipo include forme con scope: `fix(jodie):`, oltre a `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `chore:`, `test:`, e forme composte come `docs+test:`, `test+fix:`, `refactor+feat:`.

Un linter che volesse validare il tipo dovrebbe accettare anche le forme composte e con scope. **Il prompt non lo chiede**, e non va aggiunto.

### 6.2 Le entry già in scope per il linter

Il prompt fissa la soglia a **data entry >= 2026-08-02**. Sul repo attuale c'è **una sola entry in scope**:

`docs/claude-code-log.md:3` — `## 2026-08-02 — fix(jodie): finestra chat allineata a sinistra (flottante e fullscreen)`, prodotta da un filone concorrente.

Valori atterrati, righe 7-8, **verbatim**:

```
**Corregge**: 2026-08-01 13:31 (prompt `jjodie_window_default_bottom_left`)
**Causa**: (a)
```

**Questo è il finding più importante del report.** Un linter scritto alla lettera del prompt di Fase 2 — «il valore di `Corregge` deve essere o il valore sentinella o un timestamp nel formato prescritto», «il valore di `Causa` deve appartenere al vocabolario chiuso» — implementato con i due regex naturali:

```
Corregge:  ^(—|\d{4}-\d{2}-\d{2} \d{2}:\d{2})$
Causa:     ^[a-g]$
```

**fallirebbe su entrambi i campi di questa entry**, che è compilata correttamente e con cura. `Corregge` porta un'annotazione fra parentesi dopo il timestamp; `Causa` porta le parentesi come le rende la tassonomia.

Sarebbe un gate rosso al primo run per un difetto del gate, non del log. Da qui Q1 e Q2 (§9).

Nota positiva: il bersaglio `2026-08-01 13:31` **risolve** — `docs/claude-code-log.md:60` porta `**Prompt document name**: 2026-08-01 13:31`. Il check di risoluzione (warning non bloccante) è quindi implementabile e già verificabile su un caso reale.

L'altra entry con i campi valorizzati è `docs/claude-code-log.md:20-21` (`—` / `—`), datata 2026-08-01: **fuori scope**, ignorata senza warning.

### 6.3 Conformità delle 27 entry attive al template

Scansione campo per campo:

| Campo | Entry che lo portano |
|---|---|
| `**Prompt**` | 27 / 27 |
| `**Files touched**` | 27 / 27 |
| `**Outcome**` | 27 / 27 |
| `**Regressions**` | 27 / 27 |
| `**Out-of-scope changes**` | 27 / 27 |
| `**Layer Impact Report**` | 27 / 27 |
| `**Prompt document name**` | 27 / 27 |
| `**Smoke visivo**` | **4 / 27** |
| `**Corregge**` / `**Causa**` | **2 / 27** |

I campi recenti sono presenti solo nelle entry successive alla loro introduzione, come previsto dalla regola di non-retro-compilazione. **La soglia sulla data protegge correttamente**: applicato senza soglia, il linter produrrebbe 23 falsi errori su `Smoke visivo` e 25 su `Corregge`/`Causa`.

### 6.4 Le entry NON sono in ordine cronologico

Sequenza reale delle date nel file attivo:

```
2026-08-02, 2026-08-01 ×4, 2026-07-29 ×10, 2026-07-30 ×5,
2026-07-31 ×5, 2026-08-01 ×2
```

Le ultime due entry del file sono datate 2026-08-01, più recenti di gran parte di quelle che le precedono. **Il linter non può assumere ordinamento** né fermarsi alla prima entry sotto soglia: deve scandire tutte le entry e filtrare ciascuna sulla propria data di intestazione.

---

## 7. Generatore di AGENTS.md

**Esiste**, a `scripts/generate-agents.mjs` (root del repo, non `frontend/`). Si invoca con `npm run gen:agents` da `frontend/`, che risolve `node ../scripts/generate-agents.mjs`.

**È deterministico.** Il file lo dichiara — «Deterministic & idempotent: the output is a pure function of the CLAUDE.md file(s) (+ the optional root runtime fragment). The script never reads AGENTS.md back» — e la verifica lo conferma.

Verifica eseguita, **senza sovrascrivere nulla di persistente**: copia di `AGENTS.md` da HEAD in scratchpad, rigenerazione, `diff`.

```
IDENTICAL — generator deterministic, AGENTS.md in HEAD is in sync
$ git status --short AGENTS.md
(vuoto)
```

`AGENTS.md` in HEAD è **byte-identica** alla proiezione corrente di `CLAUDE.md`, e la rigenerazione non ha prodotto diff: il working tree resta pulito.

Vincolo noto, già annotato: `generate-agents.mjs:89` fa `throw` se non trova la stringa `## 0. ` in `CLAUDE.md`.

### 7.1 Il blocco template esiste anche in AGENTS.md

`AGENTS.md:857` porta la stessa ancora, una sola volta. È una proiezione, quindi resta allineata automaticamente a `CLAUDE.md`. **Il Check A non deve includerla**: sarebbe ridondante con il generatore e trasformerebbe un `AGENTS.md` non rigenerato in un fallimento del gate di identità invece che, correttamente, in un problema di rigenerazione. Il prompt infatti chiede il confronto sulla sola coppia `CLAUDE.md` / `PROTOCOL.md`.

---

## 8. Smoke skipped — domanda chiusa

I due skipped sono **A1 e A2 nello stato `empty-project`**, dichiarati esplicitamente in `frontend/scripts/smoke/states.ts:134-142`:

```
skip: [
    { assertion: 'A1', reason: 'no tab is open, so the editor is legitimately not mounted' },
    { assertion: 'A2', reason: 'no canvas to measure without a mounted editor' },
]
```

Motivo: `empty-project` apre il progetto senza aprire alcuna tab, e in quello stato l'editor non è montato — verificato in calibrazione, `.editor-v2*` conta 0. A1 (struttura montata) e A2 (geometria canvas) non hanno oggetto. Sono stampati come `SKIP` con motivo, mai come `PASS`.

Non è un difetto e non è debito: è la dichiarazione corretta di non-applicabilità.

---

## 9. Collisioni di nomi

Nessuna collisione per tutti i candidati verificati.

| Nome candidato | Occorrenze in `package.json` |
|---|---|
| `gates` | 0 |
| `check` | 0 |
| `check:docs` | 0 |
| `check:protocol` | 0 |
| `lint` | 0 |
| `lint:log` | 0 |
| `docs:check` | 0 |
| `verify` | 0 |

`frontend/scripts/` contiene solo `benchmarks/`, `smoke/`, `tsconfig.json`: una cartella `gates/` non collide. Nessun file nel repo si chiama `*protocol*` o `*log-lint*` in `frontend/` (i due match sono discovery report in `docs/`).

Promemoria da CLAUDE.md: `lint` è un nome da evitare comunque, perché §17 dichiara «No `lint` script: ESLint is not installed, so do not run it» e introdurne uno con quel nome sarebbe fuorviante.

---

## 10. Esiste una lista di gate in CLAUDE.md?

**Sì, due.** `CLAUDE.md` §17 (righe 731-747):

- righe 733-740, blocco comandi di sviluppo
- righe 744-747, **«Verification gates before commit:»** con tre voci (`build`, `typecheck`, `test`)

La condizione della tabella DOVE («solo se esiste già una lista di gate») **è soddisfatta**: il nuovo comando va aggiunto a §17, e `AGENTS.md` va rigenerato di conseguenza.

**Ma §17 è già stale**: non menziona `smoke`, `smoke:calibrate` né `typecheck:scripts`, tutti introdotti negli ultimi due commit. Aggiungere solo il nuovo comando lascerebbe la lista incoerente. Vedi Q4.

---

## 11. Dipendenze e rischi

| # | Rischio | Gravità | Mitigazione |
|---|---|---|---|
| R1 | Linter scritto alla lettera → **rosso al primo run** sull'unica entry in scope, che è compilata bene (§6.2) | **Alta** | Q1 e Q2 prima di scrivere i regex |
| R2 | `include` del tsconfig script non copre la nuova posizione | Media | Aggiornare `include`, dichiararlo (previsto dal prompt) |
| R3 | Puntatore in `PROTOCOL.md` inserito **dentro** il fence → romperebbe il vincolo che il task protegge | Media | Inserirlo dopo la riga 104 (chiusura fence); rieseguire il confronto dopo l'edit. Nota: una riga equivalente esiste già a :106 (Q3) |
| R4 | Estrazione per ancora su file con ancora duplicata → confronto falsato | Media | Check A verifica unicità e non-vuoto, come prescritto |
| R5 | Confronto su em dash: `—` U+2014 in ancora e sentinella | Media | Confronto su stringhe UTF-8, mai normalizzare |
| R6 | Il log non è in ordine cronologico (§6.4) | Media | Scandire tutte le entry, filtrare per data propria; mai early-exit |
| R7 | Risoluzione bersaglio `Corregge` su 667 entry (27 + 640) | Bassa | Indice in memoria dei `**Prompt document name**`; è comunque solo un warning |
| R8 | §17 stale dopo l'aggiunta del solo nuovo comando | Bassa | Q4 |
| R9 | Vocabolario `Causa` reso chiuso di fatto senza che §21.3 lo dichiari (§4.1) | Bassa | Consapevole; eventualmente esplicitarlo in §21.3 in un task separato |

---

## 12. Domande aperte

**Bloccanti per il Check B** — nascono entrambe dal fatto che §21.3 non specifica il *formato* dei valori, solo la loro semantica, e l'unica entry reale usa forme più ricche di quelle che il prompt assume.

**Q1 — `Corregge` accetta un'annotazione dopo il timestamp?**
Valore reale: `2026-08-01 13:31 (prompt \`jjodie_window_default_bottom_left\`)`.
Opzioni: (i) il timestamp deve essere un **prefisso**, il resto è testo libero — l'entry attuale passa; (ii) solo timestamp nudo — l'entry attuale fallisce e andrebbe modificata, ma il linter «legge il log e basta».
**Raccomandazione: (i).** L'annotazione è informativa e utile, e (ii) renderebbe il gate rosso su lavoro corretto.

**Q2 — il token di `Causa` è `(a)` o `a`?**
La tassonomia rende `(a)`; l'entry reale scrive `(a)`; il prompt di Fase 2 parla di «lettera».
Opzioni: (i) canonico `(a)`, accettato anche `a`; (ii) solo `(a)`; (iii) solo `a` — quest'ultima fa fallire l'entry reale.
**Raccomandazione: (i)**, con `(a)` come forma canonica documentata.

**Non bloccanti.**

**Q3 — la riga di puntatore in `PROTOCOL.md` esiste già.**
`docs/PROTOCOL.md:106` dice già «La semantica dei campi di autovalutazione è definita in `CLAUDE.md` §21.3», fuori dal blocco. La tabella DOVE chiede «una riga di puntatore a §21.3 per le regole di compilazione». È la stessa cosa. Opzioni: lasciarla com'è e dichiararlo; oppure estenderla citando esplicitamente `Corregge`/`Causa`. **Raccomandazione: estendere di poche parole**, così il puntatore copre nominalmente anche i due campi nuovi, senza duplicare le regole.

**Q4 — §17 è stale: aggiungere solo il nuovo comando o allinearla?**
Mancano `smoke`, `smoke:calibrate`, `typecheck:scripts`. Il prompt autorizza solo l'aggiunta del nuovo comando. Aggiungerne uno solo lascia una lista di gate che non elenca il gate visivo introdotto ieri. **Raccomandazione: aggiungere il nuovo comando + le tre voci mancanti in §17**, che è pura documentazione già dovuta; se preferisci lo scope stretto, aggiungo solo il nuovo e apro la voce come debito.

**Q5 — nome dello script e posizione.**
Proposta: file `frontend/scripts/gates/check-docs.ts`, script npm `check:docs`, `include` del tsconfig esteso a `["smoke/**/*.ts", "gates/**/*.ts"]`. Tutti i nomi sono liberi (§9). Confermi, o preferisci un altro nome?

---

## 13. File letti

```
/Users/alfonso/jjodel/CLAUDE.md                                    (§0, §17, §21.2, §21.3)
/Users/alfonso/jjodel/AGENTS.md                                    (ancora del blocco, banner)
/Users/alfonso/jjodel/docs/PROTOCOL.md                             (P9 e contorno)
/Users/alfonso/jjodel/docs/claude-code-log.md                      (27 entry, scansione campi)
/Users/alfonso/jjodel/docs/claude-code-log-archive.md              (conteggio e intestazioni)
/Users/alfonso/jjodel/scripts/generate-agents.mjs                  (determinismo)
/Users/alfonso/jjodel/frontend/package.json                        (script, collisioni)
/Users/alfonso/jjodel/frontend/scripts/tsconfig.json               (include)
/Users/alfonso/jjodel/frontend/scripts/smoke/states.ts             (skip A1/A2)
/Users/alfonso/jjodel/frontend/scripts/smoke/README.md             (runtime, versione Node)
```

**Nessun file modificato.** La rigenerazione di §7 è stata verificata con copia in scratchpad e ha lasciato il working tree pulito (`git status --short AGENTS.md` vuoto).
