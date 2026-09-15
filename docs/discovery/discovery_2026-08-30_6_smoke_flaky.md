# Discovery 2026-08-30 — lo smoke flaky: chi lo fa arrossire, e perche' il gate non ha margine

**Data**: 2026-08-30, 15:04-15:26 CEST
**Branch**: `alfonso-frontend-jjtl`. HEAD `433136733` all'inizio della misura,
`9c91c65ef` alla fine: la sessione parallela ha committato **durante** il batch, e questo
fatto e' parte del reperto, non un disturbo da scontare.
**Prompt**: «Discovery: lo smoke flaky (11/1/3 ambientale)» — 12/0/3 non e' piu' una baseline
affidabile dal 30-08. Solo discovery: zero fix, un report.
**Sonde** (in `frontend/scripts/smoke/`, **non committate**): `_tmp_hmrwatch.ts` (osservatore
passivo del client vite), `_tmp_flake_probe.ts` (tally per pattern, conteggio dei boot,
tempi). Piu' due script di regia nello scratchpad: `loop.sh` (N corse consecutive),
`inject.sh` (una corsa con un `touch` a tempo).
**Esito**: **causa trovata e riprodotta a comando**. Lo smoke non e' flaky per se': e'
**sensibile a chiunque salvi un file sotto `frontend/src` mentre gira**, perche' condivide
il dev server con le altre sessioni e il client HMR di vite scrive in console della pagina
che lo smoke sta misurando. Il gate A4 non ha **nessun** margine per assorbirlo.

Strumento: `command grep` (BSD grep), mai il wrapper `ugrep --ignore-files` a cui `grep`
risolve in questa shell. Ogni asserzione di assenza porta il proprio controllo positivo.

---

## 1. La risposta, in tre righe

1. **Riproducibilita'**: 12 corse consecutive, **10 verdi e 2 rosse**. Le due rosse sono
   esattamente le due corse dentro cui e' caduto un salvataggio della sessione parallela.
   Nelle 8 corse osservate dal watcher la correlazione e' **8 su 8**.
2. **Il 3x e' sintomo**, non causa: e' il conteggio di **tre boot** della stessa pagina.
   Il boot ripetuto arriva da un `full-reload` di vite, che parte quando il file salvato non
   ha un confine HMR. Riprodotto a comando con un `touch` che **non cambia un byte**.
3. **Perche' ora**: non e' nuovo — il log ne porta gia' uno il 29-08. Non e' cambiato niente
   nel codice della console: **ogni pattern della baseline e' gia' a margine 0**, e lo era
   anche prima. E' cambiata la frequenza dei salvataggi concorrenti, cioe' la probabilita'
   di prendersi il rumore dentro la finestra di 82 secondi in cui lo smoke misura.

---

## 2. La distribuzione, 12 corse consecutive su albero pulito

`npm run smoke` in serie, stessa shell, nessuna altra attivita' avviata da questa sessione.
Albero di partenza pulito (`git diff --stat` vuoto alle 15:04).

```
corsa  finestra           esito     empty-project   empty-metamodel-tab  advanced-mode
                                    msg/distinct    msg/distinct         msg/distinct
  1    15:04:33-15:05:55  12/0/3      13/11             14/12               15/12
  2    15:05:55-15:07:16  12/0/3      13/11             14/12               15/12
  3    15:07:16-15:08:37  12/0/3      13/11             14/12               15/12
  4    15:08:37-15:09:59  12/0/3      13/11             14/12               15/12
  5    15:09:59-15:11:20  12/0/3      13/11             14/12               15/12
  6    15:11:20-15:12:42  12/0/3      13/11             14/12               15/12
  7    15:12:42-15:14:05  12/0/3      13/11             14/12               15/12
  8    15:14:05-15:15:27  12/0/3      13/11             14/12               15/12
  9    15:15:27-15:16:49  12/0/3      13/11             14/12               15/12
 10    15:16:49-15:18:11  12/0/3      13/11             14/12               15/12
 11    15:18:11-15:19:33  11/1/3    * 15/12             14/12               15/12
 12    15:19:33-15:20:57  11/1/3      13/11           * 15/13               15/12
                                      ^ A4:FAIL       ^ A4:FAIL
```

Due fatti da leggere insieme:

- **Le dieci corse verdi sono identiche al messaggio**: 13/14/15 messaggi, 11/12/12 pattern
  distinti, dieci volte su dieci. Lo smoke **non ha jitter proprio**. Non e' un timer, non e'
  uno stato residuo fra gli stati (ogni stato apre un `browser.newContext()` con
  `localStorage` isolato), non e' una deriva del boot ripetuto.
- **L'assertion che fallisce migra**, ed e' sempre e solo A4. Nelle due rosse gli altri
  quattro gate (A1, A2, A3, A5) sono verdi e le geometrie sono identiche al pixel:
  `ratio 1.0000`, `canvas x=201 y=91 w=1238 h=776`, giunzioni `1.00 / 0.00 / 0.00`.

Durata media della corsa: **82 s** (min 81, max 84). E' la finestra di esposizione.

---

## 3. La causa, colta in flagrante

Durante il batch girava anche `_tmp_hmrwatch.ts`: **una sola pagina inerte** su
`http://localhost:3000/`, che stampa con timestamp ogni riga di console contenente
`[vite]` e ogni navigazione del main frame. Non tocca lo smoke, non tocca il repo.

Copertura del watcher: 15:08:49-15:22:49. Dentro quella finestra, tre eventi:

```
15:18:28  debug  [vite] hot updated: /src/components/abstract/tabs/InstanceManagerTab.tsx
15:18:32  debug  [vite] hot updated: /src/components/abstract/tabs/InstanceManagerTab.tsx
15:20:00  debug  [vite] hot updated: /src/components/forEndUser/tree.scss
```

Tre eventi, tutti e tre della **sessione parallela** (12b/12c lavora su `editor-v2/` e
`jjform/`; `InstanceManagerTab.tsx` risulta modificato nel working tree alla fine del
batch). Nessuno prodotto da questa sessione.

Ora la sovrapposizione. Le durate di stato, misurate da `_tmp_flake_probe.ts`, sono
21.8 s / 29.6 s / 29.7 s piu' ~1.5 s di avvio del browser:

| corsa | inizio | finestra `empty-project` | finestra `empty-metamodel-tab` | evento HMR | stato rosso |
|---|---|---|---|---|---|
| 11 | 15:18:11 | 15:18:13-15:18:35 | 15:18:35-15:19:04 | **15:18:28 e 15:18:32** | `empty-project` |
| 12 | 15:19:33 | 15:19:35-15:19:57 | 15:19:57-15:20:26 | **15:20:00** | `empty-metamodel-tab` |

E il referto dello smoke conta **lo stesso numero di eventi** che ha visto il watcher:

```
corsa 11, empty-project:
  FAIL  A4 no console regression vs baseline
        measured: 15 message(s), 12 distinct pattern(s); 1 new, 0 above baseline:
      NEW (2x): debug|[vite] hot updated: /src/components/abstract/tabs/InstanceManagerTab.tsx

corsa 12, empty-metamodel-tab:
  FAIL  A4 no console regression vs baseline
        measured: 15 message(s), 13 distinct pattern(s); 1 new, 0 above baseline:
      NEW (1x): debug|[vite] hot updated: /src/components/forEndUser/tree.scss
```

Due eventi nel watcher, `NEW (2x)` nello smoke. Un evento nel watcher, `NEW (1x)` nello
smoke. Lo stato che fallisce e' quello aperto in quell'istante. La traccia e' completa
dall'ingresso (un `Cmd+S` in un'altra finestra) all'uscita (`11 passed, 1 failed, 3 skipped`).

**Nelle 6 corse interamente osservate senza eventi HMR (5..10), il verde e' 6 su 6.**
Correlazione sulle 8 corse coperte dal watcher: **8 su 8**.

Nota su cosa basta a far rosso: la corsa 12 e' caduta su un **`.scss`**. Non serve toccare
un `.tsx`, non serve che il file c'entri con lo stato misurato. Basta che sia nel grafo dei
moduli caricati dalla pagina — cioe' quasi tutto `src`.

---

## 4. Il 3x e' sintomo: l'esperimento controllato

Le due rosse naturali sono la forma **lieve** del difetto: `loads = 1`, un pattern nuovo,
zero conteggi sopra baseline. La forma **grave** riportata il 30-08 («conteggi a 3x la
baseline — boot ripetuto») e' la stessa causa con un file diverso: quando il modulo salvato
non ha un confine HMR, vite non manda `hot updated` ma `full-reload`, e la pagina **riparte
da capo**.

Riproduzione a comando (`inject.sh`), una corsa di `npm run smoke` con due `touch` a
+12 s e +18 s dall'avvio, cioe' dentro `empty-project`:

```
bersaglio : frontend/src/joiner/classes.ts
md5 prima : 6d19220b3db864780513c68a5bca1fdf
md5 dopo  : 6d19220b3db864780513c68a5bca1fdf     <- nessun byte cambiato, solo mtime
touch     : 15:21:55  e  15:22:01
```

Il watcher, sulla sua pagina inerte, vede due **ricariche complete**:

```
15:21:55  NAV http://localhost:3000/ + [vite] connecting... + [vite] connected.
15:22:01  NAV http://localhost:3000/ + [vite] connecting... + [vite] connected.
```

E lo smoke da' esattamente il referto del 30-08:

```
  empty-project          A1:SKIP  A2:SKIP  A3:PASS  A4:FAIL  A5:SKIP
  empty-metamodel-tab    A1:PASS  A2:PASS  A3:PASS  A4:PASS  A5:PASS
  advanced-mode          A1:PASS  A2:PASS  A3:PASS  A4:PASS  A5:PASS
  11 passed, 1 failed, 3 skipped

  FAIL  A4: 33 message(s), 13 distinct pattern(s); 2 new, 9 above baseline:
      NEW (1x): debug|[vite] hot updated: /src/components/forEndUser/tree.scss
      NEW (2x): warning|init looping, project not found yet {pid: Pointer<N>_USER_2, temp: Object}
      WORSE: debug|[vite] connecting...  — baseline 1, observed 3
      WORSE: debug|[vite] connected.     — baseline 1, observed 3
      WORSE: info|%cDownload the React DevTools ... — baseline 1, observed 3
      ...
```

**33 messaggi contro i 13 della corsa quieta. `connecting...` a 3 contro 1.** Il «3x» e'
letteralmente il numero di boot: uno buono piu' due ricariche. Non e' un conteggio che
cresce, e' lo stesso conteggio ripetuto tre volte.

Due cose che questa corsa aggiunge:

- il `NEW (1x) hot updated: tree.scss` alle 15:21:53 **non e' mio**: e' la sessione parallela
  che ha salvato dentro la stessa corsa. Due sorgenti di rumore nello stesso minuto.
- `init looping, project not found yet` compare **solo** sulla ricarica: e' la corsa del boot
  contro un `#/project?id=` gia' in barra indirizzi. E' un percorso dell'app che lo smoke
  quieto non attraversa mai, e che il baseline quindi non conosce.

---

## 5. Perche' il gate cede: A4 ha margine 0 su ogni pattern vivo

`_tmp_flake_probe.ts` ha dumpato il tally completo per pattern e lo ha diffato contro
`console-baseline.json`. Il risultato spiega la fragilita' meglio di qualunque ipotesi:

```
empty-project                                                        baseline -> osservato
  1 ->   1  [margine 0 ] debug|[vite] connected.
  1 ->   1  [margine 0 ] debug|[vite] connecting...
  1 ->   1  [margine 0 ] debug|mismatching END() - transaction already closed
  6 ->   0  [slack 6   ] error|Warning: Encountered two children with the same key ...
  2 ->   2  [margine 0 ] error|... wrong project setup in navbar {projectid: null, ...}
  1 ->   1  [margine 0 ] error|init_dash
  1 ->   1  [margine 0 ] info|%cDownload the React DevTools ...
  1 ->   1  [margine 0 ] warning|Component naming conflict ... "Viewport"
  1 ->   1  [margine 0 ] warning|Module 'path-data-polyfill' requested via require() ...
  2 ->   2  [margine 0 ] warning|stateinitializer
  1 ->   1  [margine 0 ] warning|React Router Future Flag Warning: ... startTransition
  1 ->   1  [margine 0 ] warning|React Router Future Flag Warning: ... Splat routes
```

Idem negli altri due stati (13 pattern ciascuno, con in piu' `Selector unknown returned a
different result`). **Undici pattern su dodici — dodici su tredici — stanno a margine
esattamente zero.** L'unico con margine e' `Encountered two children with the same key`,
che vale 6/18/20 nella baseline ed e' **0 in tutti e tre gli stati**: quel bug e' stato
chiuso dopo il 01-08 e lo smoke lo segnala `IMPROVED` a ogni corsa da settimane.

Cioe':

- il margine nominale del totale (19/32/35 in baseline contro 13/14/15 osservati) e'
  **tutto concentrato in un pattern morto**. Non puo' assorbire niente, perche' un pattern
  a 0 non compensa un altro pattern che sale: A4 confronta **per chiave**, non il totale.
- qualunque emissione in piu' di qualunque pattern gia' baselinato, e qualunque pattern
  nuovo, fa rosso. Un solo messaggio.

Questo e' il **come cede**. Non e' un difetto in se': un gate console a margine zero e'
una scelta difendibile, ed e' quella che c'e'. Diventa un problema solo quando nel canale
entra rumore che non e' dell'applicazione — che e' esattamente il §3.

E c'e' un secondo effetto, piu' lento: la baseline e' del **01-08 @ `560987571`**, quattro
settimane fa, e da allora l'app ha smesso di emettere il pattern piu' grosso. La baseline
non e' piu' una fotografia di quello che l'app fa.

---

## 6. Perche' ora

Tre risposte, in ordine di forza dell'evidenza.

**(a) Non e' di ieri.** `docs/claude-code-log.md`, entry del **2026-08-29**, riga 323:

> `npm run smoke` 12 passed / 0 failed / 3 skipped — un primo giro dava `advanced-mode
> A4:FAIL` **lanciato in parallelo alla build**, rigiocato da solo e' verde e la misura e'
> «15 messaggi, tutti dentro la baseline»

Stesso gate, stesso stato, stessa forma, e la stessa correlazione con l'attivita'
concorrente. Il «15 messaggi» di quell'entry e' identico al mio verde di oggi. Quindi
12/0/3 **non e' mai stato** un gate deterministico: era un gate che non era ancora stato
disturbato abbastanza spesso.

**(b) Non e' cambiato il codice.** Le dieci corse verdi di oggi danno pattern per pattern
gli stessi conteggi della baseline del 01-08, tolto il pattern chiuso. Nessun pattern nuovo,
nessun conteggio salito. Se qualcosa fosse peggiorato nell'app, si vedrebbe qui.

**(c) E' cambiato quanto spesso si salva mentre lo smoke gira.** La misura di oggi: tre
eventi HMR in 14 minuti di watcher, piu' un quarto durante la corsa iniettata, piu' altri
due durante la corsa della sonda — tutti dalla sessione parallela. Con una finestra di
esposizione di **82 secondi per corsa** e un gate a margine zero, la probabilita' di rosso
e' la probabilita' che un collega salvi un file in quegli 82 secondi. Oggi si e' lavorato
in due su `frontend/src` per tutta la giornata; il 30-08 alle 14:30, ora del referto
originale, la sessione parallela ha committato alle 14:34, 14:35, 14:42 — e i suoi file
«sono atterrati nel working tree durante il task», come scrive l'entry stessa.

Da aggiungere: quell'entry ha anche misurato l'albero pulito **via `git stash`**. Uno
`stash` riscrive i file su disco, quindi e' anch'esso un evento HMR — il modo scelto per
togliere di mezzo il diff era, meccanicamente, un altro modo per perturbare la corsa.

---

## 7. Quello che **non** e' la causa (controlli, non congetture)

- **Il carico macchina.** La corsa **10** e' partita con load average **13,34** ed e'
  **verde**; le corse **11** e **12** sono partite con 7,56 e 5,80 e sono **rosse**. Il
  carico non predice il colore. (Resta vero che il carico rallenta: e' il meccanismo
  candidato per la rossa del 29-08 «in parallelo alla build», ma non per quelle di oggi.)
- **La ri-ottimizzazione delle dipendenze di vite.**
  `frontend/node_modules/.vite/deps/_metadata.json` porta mtime **6 agosto 13:29**, prima e
  dopo l'intero batch. Nessun re-bundle, nessun `504 Outdated Optimize Dep`, nessuna
  ricarica da quel lato. Controllo positivo: lo stesso `stat` sui tre file sorgente
  coinvolti restituisce mtime di oggi (15:25:36, 15:21:53, 15:22:01), quindi il comando
  legge davvero le mtime.
- **Stato residuo fra gli stati.** Ogni stato apre un `browser.newContext()`
  (`states.ts:openState`) con `localStorage` isolato e un progetto creato ex novo. Dieci
  corse consecutive danno 13/14/15 messaggi **identici**: se ci fosse accumulo, salirebbe.
- **Un timer o un polling dell'app.** Sei corse quiete in otto minuti danno lo stesso tally
  al messaggio. Niente cresce col tempo di sessione.
- **La versione di node/playwright/vite.** Invariate durante il batch; il colore cambia
  dentro la stessa serie di dodici corse, con gli stessi binari.

---

## 8. Il contorno ambientale, misurato

Quattro server node sullo stesso progetto, tutti in ascolto su `[::1]`:

```
porta 3000  vite dev      PID  4928   su da mar 25 ago 18:16   <- quello che lo smoke usa
porta 3001  vite preview  PID 96357   su da mar 25 ago 14:49   <- build statica (P8: puo' essere stale)
porta 3002  vite dev      PID 11363   su da mar 25 ago 22:55
porta 3003  vite dev      PID 96082   su da ven 28 ago 19:15
```

Due conseguenze pratiche:

1. **Aprire un dev server dedicato su una porta privata non isola lo smoke.** I tre dev
   server guardano tutti lo stesso `frontend/src`: un salvataggio li sveglia tutti. Ne'
   vite offre un flag CLI per spegnere l'HMR — `npx vite --help` elenca `--port`,
   `--strictPort`, `--force`, e nessun `--no-hmr`; si spegne solo da `server.hmr: false`
   in `vite.config.ts`, cioe' modificando un sorgente.
2. Il dev server di :3000 e' su da **cinque giorni**. Non e' la causa di niente qui (serve
   i moduli da disco a ogni richiesta, e le dieci corse verdi lo dimostrano), ma vale la
   pena saperlo prima di attribuirgli qualcosa in futuro.

---

## 9. Proposte — **nessuna applicata**, come da vincolo

In ordine di rapporto fra copertura e costo. Le prime due sono la coppia che chiude il
difetto; la terza da sola non basta, ed e' misurato perche'.

**(P1) Guardia di quiescenza: la corsa e' nulla, non rossa.**
Registrare `max(mtime)` sotto `frontend/src` prima e dopo la corsa (un `find` ricorsivo,
frazioni di secondo). Se e' cambiato, la corsa **non ha misurato l'albero che dichiarava**:
uscire con un codice dedicato e un messaggio che nomina il file cambiato, invece di
stampare `Smoke red`. E' l'**unica misura che copre tutti e tre i rossi osservati** — le
due naturali con `loads = 1` e quella iniettata con `loads = 3`, perche' in tutti e tre i
casi una mtime sotto `src` e' cambiata dentro la finestra.
Effetto collaterale voluto: rende esplicito nel prompt log «ambiente non quiescente»
invece di «smoke rosso», che e' la distinzione che oggi va ricostruita a mano.

**(P2) Contare i boot per stato.**
`page.on('load')` e' gia' disponibile dove si attaccano `console` e `pageerror`
(`states.ts:openState`). Se una pagina fa piu' di **1** `load`, la corsa e' nulla per quello
stato, con la ragione stampata («2 ricariche durante lo stato: la baseline console non e'
confrontabile»). Misurato: `loads = 1` in tutte le corse quiete, `loads = 3` nella corsa
iniettata. E' il discriminante fra la forma lieve e la forma grave del difetto, e trasforma
il «3x la baseline» da enigma in diagnosi stampata.

**(P3) Togliere il rumore del client vite dal tally — necessario ma non sufficiente.**
Scartare in `tallyConsole` le chiavi che iniziano con `debug|[vite] `. Misurato sulle corse
di oggi: da solo avrebbe reso **verdi** le corse 11 e 12 (in entrambe l'unico reperto era un
`NEW: [vite] hot updated`, con `0 above baseline`), ma **non** la corsa iniettata, dove i
conteggi dell'applicazione stessa sono triplicati. Va quindi **insieme** a P1/P2, mai al
loro posto: da solo nasconderebbe la forma grave invece di dichiararla.

**(P4) Ritarare `console-baseline.json`, sapendo che non aggiunge margine.**
E' del 01-08 @ `560987571` e contiene un pattern (`two children with the same key`,
6/18/20) che l'app non emette piu'. Ritararla toglie il rumore degli `IMPROVED` a ogni
corsa e riallinea la fotografia, ma **non** cambia la fragilita': tutti gli altri pattern
sono gia' a margine 0 e ci resterebbero. Se si ritara, ritarare **dopo** P1, e su una corsa
dichiarata quiescente — altrimenti si rischia di congelare in baseline un `[vite] hot
updated` di passaggio.

**(P5) Se si vuole un gate certificabile senza toccare l'harness: N corse con soglia.**
Con la distribuzione misurata (10/12 assolute; 6/6 nelle finestre quiete), **due corse
consecutive verdi** sono un criterio ragionevole, purche' la seconda parta dopo la prima e
il prompt log riporti la coppia. Non e' un gate migliore — e' lo stesso gate con la varianza
ambientale mediata a mano. Da preferire P1+P2, che dicono *perche'* invece di riprovare.

**(P6) L'isolamento vero costerebbe una baseline nuova.** Far girare lo smoke contro una
build statica (`vite preview`) elimina l'HMR alla radice. Ma in produzione
`vite.config.ts:esbuild.pure` scarta `console.log/debug/info/trace`: sparirebbero
`[vite] connecting...`, `connected.`, `mismatching END()`, il banner DevTools — cioe' meta'
dei pattern — e la baseline andrebbe rifatta da zero. In piu' `docs/PROTOCOL.md` P8
avverte che 3001 puo' servire una build stale. Registrata come opzione, non come
raccomandazione.

---

## 10. Limiti di questa misura, dichiarati

- **Dodici corse sono poche** per una stima di probabilita'. Il 10/12 non e' un tasso di
  flakiness: e' il conteggio di quante volte, in sedici minuti, un collega ha salvato. Il
  numero che conta e' l'altro, quello causale: 8 corse osservate, 8 volte l'esito
  concorda col watcher.
- **Il watcher copre 15:08:49-15:22:49**, non le corse 1-3. Quelle tre sono verdi ma senza
  osservazione indipendente: non posso escludere che siano state quiete per caso invece che
  per assenza di eventi. Le dico verdi, non le dico quiete.
- **Non ho misurato la forma «carico»**, quella sospettata il 29-08 per la rossa lanciata
  in parallelo alla build. Oggi il carico e' salito a 13,34 senza far rosso, il che la
  indebolisce, ma non l'ho esercitata: servirebbe un batch con `npm run build` in
  concorrenza, e non e' questo il prompt.
- **HEAD e' cambiato durante il batch** (`433136733` -> `9c91c65ef`) e il working tree e'
  passato da pulito a sporco delle modifiche della sessione parallela. Le dodici corse non
  hanno quindi misurato tutte lo stesso codice. Per quello che A4 misura la differenza non
  si vede (i dieci verdi sono identici al messaggio), ma la dichiaro invece di darla per
  irrilevante.
- **Zero modifiche a sorgente e smoke**, come da vincolo. L'unica scrittura fuori dallo
  scratchpad sono le due sonde `_tmp_*` in `frontend/scripts/smoke/`, non committate, e un
  `touch` su `frontend/src/joiner/classes.ts` che ha lasciato l'md5 invariato
  (`6d19220b3db864780513c68a5bca1fdf` prima e dopo) e non ha toccato lo stato git.
