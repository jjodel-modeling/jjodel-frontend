# R-RAIL-44, emendamento a R-RAIL-42, due voci a debito e rotazione del log

**Nome del documento prompt**: 2026-08-13 15:42
**Tipo**: docs. **Zero file sorgente toccati.**
**Base attesa**: `alfonso-frontend-jjtl` a `8cc34ed` o discendente.
**Quattro commit tematici**, in ordine. Nessun push.

---

## Regola zero, da leggere prima di tutto

**Questo task non ha fase di discovery.** Tutti i testi da scrivere sono forniti qui sotto
verbatim, e tutti i punti di inserimento sono indicati per contenuto oltre che per riga. Se ti
trovi a dover esplorare il codebase per capire dove va qualcosa, **fermati e chiedi**: significa
che il prompt ha un difetto, non che serve una discovery. Non produrre discovery report, non
serve.

**Non tocchi nessun file sorgente.** I sei file di questo task sono tutti sotto `docs/` più
`CLAUDE.md`. Se ti viene la tentazione di allineare il codice a quello che stai scrivendo nei
documenti, non farlo: la ratifica registra uno stato già implementato, non lo cambia.

**Numeri di riga**: quelli citati sono presi su `8cc34ed`. Usali per orientarti, ma ancora
l'inserimento al **contenuto** che trovi, non alla riga. Se il contenuto atteso non c'è dove
dovrebbe, fermati.

---

## Contesto minimo

L'arco 3 del rail destro (il form dell'inspector: griglia 84px, multiplicity segmentato, flag
come chip, disclosure Advanced) è implementato in `ad8e8e061` e verificato da una discovery a
posteriori in `96bbd8bbc`. Separatamente, il dark theme è stato sospeso: `e682047a1` ha tolto il
sottomenu Theme dalla navbar.

Due decisioni sono state prese in chat e vanno scritte a registro, più due voci di debito e la
rotazione del log che era già dovuta.

---

## COSA e DOVE, commit per commit

### Commit 1: `docs/decisions.md`

**1a. Nuova voce R-RAIL-44.** Va inserita in coda alle voci attive della sezione
`## Arco rail destro — preset 2a (dal 2026-08-10)`, cioè **subito dopo l'ultima riga di
R-RAIL-43** («altre due non hanno.») e **prima** della riga vuota che precede
`## Superate`. Su `8cc34ed` è dopo la riga 573.

Testo, da incollare senza modifiche:

```
- **R-RAIL-44** (2026-08-13) — **Il dark theme è sospeso: i componenti nuovi non scrivono
  varianti dark.** Sospeso e non deprecato: i blocchi `[data-theme="dark"]` esistenti restano in
  albero e non si rimuovono (Regola 9), semplicemente non si manutengono e non si verificano. Il
  freeze era già vero a codice prima di essere scritto qui: `e682047a1` toglie il sottomenu Theme
  dalla navbar, quindi il dark non è raggiungibile dall'interfaccia e resta accessibile solo
  scrivendo `localStorage.theme`, che è quello che fa l'harness Playwright. **Emenda R-RAIL-42**:
  cade la clausola dei due temi come condizione di chiusura di una superficie nuova; sopravvive
  intatta la seconda metà, cioè che i grade `--color-slate-*` sono palette grezza e non seguono
  il tema. La ragione per cui la sospensione va scritta invece che sottintesa è che senza questa
  voce ogni prompt SCSS futuro continua ad aggiungere blocchi dark per abitudine, e il freeze si
  erode senza che nessuno lo decida. Nel solo foglio del rail i blocchi dark sono dieci, cinque
  dei quali sulle superfici dell'arco 3. Conseguenza operativa immediata: la definition of done
  dell'arco 3 si misura in **un tema**, light.
```

**1b. Nota di emendamento dentro R-RAIL-42.** La voce R-RAIL-42 esiste già (su `8cc34ed` alle
righe 553-559, termina con «corregge i soli colori che il tema deve cambiare.»). **Non
riscriverla.** Aggiungere una riga di chiusura in coda alla voce, con la stessa indentazione a
due spazi delle righe di continuazione:

```
  **Emendata da R-RAIL-44** (2026-08-13): la clausola dei due temi come condizione di chiusura è
  sospesa insieme al dark theme; la seconda metà, sui grade `--color-slate-*` come palette
  grezza, resta viva e non dipende dal tema.
```

**Attenzione al separatore.** Tutte le 43 voci di `docs/decisions.md` usano il trattino lungo
`—` (U+2014) fra id e testo, e la voce nuova lo usa di conseguenza. **Non va "corretto"**
applicando le regole di scrittura dei documenti: è la convenzione del file, come per il formato
validato da `check:docs`.

**Commit**: `docs: R-RAIL-44, il dark theme è sospeso, ed emendamento a R-RAIL-42`

---

### Commit 2: `docs/redesign/rail/README.md`

Una riga sola. Su `8cc34ed` è la **244**, ed è l'unica occorrenza di `1fr` in tutto il file.

Testo attuale:

```
The core density move: `display: grid; grid-template-columns: 84px 1fr;
align-items: center; gap: 8px 10px`. Labels are 12px `#475569`, **right-aligned**,
in the left column; each field is one 30px row instead of a 3-row stack.
```

Testo nuovo:

```
The core density move: `display: grid; grid-template-columns: 84px minmax(0, 1fr);
align-items: center; gap: 8px 10px`. Labels are 12px `#475569`, **right-aligned**,
in the left column; each field is one 30px row instead of a 3-row stack. The second
track is `minmax(0, 1fr)` and not `1fr`: a `1fr` track has `min-width: auto`, refuses
to shrink below min-content, and produces horizontal scroll in a narrow rail.
```

Non toccare le altre due occorrenze di `84px` (righe 290 e 399): parlano della griglia in
astratto, non della sua dichiarazione CSS.

**Commit**: `docs: la seconda traccia della griglia del form è minmax(0, 1fr)`

---

### Commit 3: `docs/TECH-DEBT.md` e `CLAUDE.md`

**3a. Voce nuova in `docs/TECH-DEBT.md`**, in coda al file dopo l'ultima voce («Una quarta
palette entity, globale e non scopata»), preceduta da `---` e riga vuota come le altre. Formato
identico alle voci esistenti:

```markdown
## L'undo di un preset di multiplicity può ripristinarne metà

**Registrato:** 2026-08-13
**Origine:** verifica a posteriori dell'arco 3 (`docs/discovery/discovery_2026-08-13_arco3_fase1_griglia_84.md`, Q4). Non è un difetto dell'arco 3: è una proprietà preesistente che il controllo segmentato rende raggiungibile con un gesto solo.
**Stato attuale:** `applyPreset` in `Info.tsx` esegue due assegnazioni consecutive, `upperBound` e poi `lowerBound`. Ciascuna entra in un setter che apre una `TRANSACTION` propria (`LModelElement.tsx`, `set_upperBound` e `set_lowerBound`), quindi un preset è due transazioni e non una. Un solo Ctrl-Z ripristinerebbe soltanto la seconda. Non verificato a runtime: la lettura è statica. I due stepper che il segmentato ha sostituito facevano già due scritture separate, quindi la classe di bug non è nuova; quello che cambia è che prima servivano due gesti deliberati e ora basta un click. Un preset applicato a metà è uno stato del modello, non un artefatto visivo: non dà errore di compilazione e non si vede in una verifica a schermo.
**Fix strutturale raccomandato:** prima misurare. Applicare `[1..*]` a un attributo `[0..1]`, un solo Ctrl-Z, leggere i due bound in `windoww.store.getState().idlookup[<id>]` e confrontarli con lo stato di partenza. Se l'undo è parziale, la direzione è una transazione sola che porti entrambi i bound, non due chiamate in fila; da valutare contro CLAUDE.md §3.3, che vieta di avvolgere un `super` in una `TRANSACTION` esterna.
**Priorità:** media — il danno è nel modello e invisibile a schermo, ma richiede una sequenza precisa per manifestarsi.
**Effort stimato:** un'ora per la misura; il fix dipende da cosa dice.
**Riferimenti:**
- `frontend/src/components/editors/Info.tsx` — `MULTIPLICITY_PRESETS`, `applyPreset`
- `frontend/src/model/logicWrapper/LModelElement.tsx` — `set_lowerBound`, `set_upperBound`
- `CLAUDE.md` §3.3
```

**3b. Istanza misurata in `CLAUDE.md` §5.** La regola **esiste già** e non va duplicata: nel
sotto-paragrafo «an assertion of absence requires proof that the search ran» c'è la frase «The
same applies to partial reads: a count taken over lines 1-62 of a 157-line file is a count over
that window, and must be reported as such or not reported at all.»

Aggiungere **subito dopo quella frase**, nello stesso paragrafo, una istanza misurata nello
stile che il file usa già (`Measured YYYY-MM-DD:`):

```
Measured 2026-08-13: `npm run typecheck | tail -60` produced a count of 12; the same command read in full produced 33, the declared baseline. The window set the number, not the subject. The rule above was already written when this happened, which is the point: a rule that fires only when someone remembers it is not operational. Take counts on complete output, with the exit status recorded.
```

Non aggiungere una regola nuova e non riformulare quella esistente: se la si riscrive si ottiene
esattamente la degradazione per propagazione che R-RAIL-43 descrive.

**Commit**: `docs: undo parziale dei preset di multiplicity, e un caso misurato per §5`

---

### Commit 4: entry di log e rotazione

**4a. Entry di log** in cima a `docs/claude-code-log.md`, subito sotto il titolo `# Claude Code
Session Log`, nel formato delle entry vicine e validato da `check:docs`. Tipo `docs`. Campi da
compilare secondo CLAUDE.md §21.3, con questi valori dove sono già determinati:

- **Prompt document name**: `2026-08-13 15:42`
- **Outcome**: dipende da come è andata, non precompilato
- **Regressions**: nessuna possibile, il task non tocca file sorgente. Dichiararlo così, con la
  misura: `npm run typecheck` deve restare alla baseline attesa (**33 errori, di cui 19 di
  casing**, exit 2). Se dà un numero diverso, qualcosa era già rotto prima: dillo e fermati.
- **Layer Impact Report**: `not-required` — nessun file di §3.1
- **Smoke visivo**: `non applicabile` — nessuna modifica di resa
- **Files touched**: i sei file di questo task

**4b. Rotazione**, e qui l'aritmetica va fatta in quest'ordine perché è il punto dove le
rotazioni precedenti hanno sbagliato i conteggi:

1. `docs/claude-code-log.md` porta **23** intestazioni `## ` prima di questo task. Misuralo, non
   fidarti di questo numero: `command grep -c "^## " docs/claude-code-log.md`.
2. Aggiungi l'entry di 4a. Diventano **24**.
3. La soglia è **20 attive**, quindi vanno spostate le **4 più vecchie**, che nel file stanno in
   **fondo** (l'ordine è newest-first: in cima 2026-08-13, in coda 2026-08-11).
4. Le quattro entry si spostano in coda a `docs/claude-code-log-archive.md`, che è append-only in
   coda e porta **753** intestazioni prima della rotazione, **757** dopo. Misura anche questi due,
   non copiarli.
5. Nelle `**Notes**` della entry di log registra: quali entry sono state spostate, il conteggio
   dell'archivio prima e dopo, e se il taglio posizionale e quello cronologico concordano. Se non
   concordano, dichiara l'inversione invece di assorbirla, come hanno fatto il sesto e il settimo
   lotto.

**Non ricostruire i conteggi a memoria da questo prompt**: i numeri qui sopra sono presi su
`8cc34ed` e servono da controllo, non da fonte. Se una misura non torna, fermati.

Per lo staging del file di log, se `git add -p` presenta un hunk unico, usa il pattern di
CLAUDE.md §6.1 (backup, `git checkout HEAD --`, reincollo selettivo, `git add`, ripristino).

**Commit**: `docs: log entry e rotazione del ventitreesimo lotto`

---

## COME

- **Sei file, nessun altro**: `docs/decisions.md`, `docs/redesign/rail/README.md`,
  `docs/TECH-DEBT.md`, `CLAUDE.md`, `docs/claude-code-log.md`,
  `docs/claude-code-log-archive.md`.
- **Leggi ogni file intero, o almeno la sezione, prima di scriverci** (P4). In particolare
  `docs/decisions.md` e `docs/TECH-DEBT.md` hanno convenzioni locali di formato che vanno
  rispettate.
- **Staging per file esplicito**: `git add <path>`, mai `git add .`.
- **Quattro commit separati**, nell'ordine dato. Messaggi in italiano come quelli esistenti sul
  ramo, tipo convenzionale, una riga, sotto i 72 caratteri.
- **Nessun push.**
- **Nessun `--no-verify`**, nessun hook saltato.
- **Gate**: `npm run check:docs` deve passare dopo il commit 4, perché valida il formato delle
  entry di log. Se non passa, il problema è nella entry, non nel gate.
- Il typecheck non è un gate di questo task ma va eseguito una volta a fine lavoro come controllo
  che l'albero non sia stato toccato per sbaglio: 33 errori attesi.

## Hard stop

Finiti i quattro commit, **fermati**. Non pushare, non aprire branch, non toccare il codice
dell'arco 3, non proporre il fix dell'undo che la voce 3a apre. Riporta: i quattro hash, i
conteggi misurati del log e dell'archivio prima e dopo, e l'esito di `check:docs`.

---

## RIFERIMENTI

**Da dove vengono le due decisioni.** Sono state ratificate in chat il 13 agosto e sono scritte
per esteso nel memo `2026-08-13_memo_ratifica_freeze_dark_e_chiusura_arco3.md`, che sta nel
Project Knowledge e non nel repo. Questo prompt le porta nel repo: è il motivo per cui esiste.

**Cosa NON è in scope, per quanto correlato.**

- Il delta non committato su `frontend/src/components/editors/properties-with-tree-view.scss`
  (lavoro su `--color-selection-bg` nei chip di multiplicity e nei flag, del 13 agosto
  pomeriggio). Se lo trovi nel working tree, **lascialo dove sta** e non includerlo in nessuno
  dei quattro commit: è una decisione di Alfonso, non tua.
- La misura della definition of done dell'arco 3 (nove controlli a 420×1000 senza scroll). È un
  altro task e ha un harness suo.
- La verifica a runtime dell'undo dei preset. La voce 3a la apre, non la esegue.
- La rimozione dei blocchi `[data-theme="dark"]` esistenti. **Vietata** da R-RAIL-44 stessa e
  dalla Regola 9.

**Vincoli di registro che restano attivi e che questo task non tocca**: R-RAIL-12 (`NODE` resta
nel guscio), R-RAIL-25 e R-RAIL-26 (i due fogli fuori perimetro), P2 (nessun identificatore
esistente rinominato).
