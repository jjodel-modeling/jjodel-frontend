# Attribuzione harness: cosa dice la storia git dal 2026-01-01

**Data**: 2026-08-28. Branch `alfonso-frontend-jjtl`. HEAD `758aded1b` (2026-08-28 19:16:13 +0200).
**Perimetro**: i 1357 commit raggiungibili da HEAD con author date >= 2026-01-01 (55 merge, 1302 non-merge).
**Dati grezzi**: `harness-attribution-commits.csv`, `harness-attribution-monthly.csv`,
`harness-attribution-blame.csv`, `harness-attribution-fingerprint.csv`, `harness-attribution-files.csv`,
`harness-attribution-growth.csv`,
tutti in questa directory.
**Stato**: read-only. Nessun file fuori da `docs/analysis/` e' stato toccato.
**Nota**: durante l'analisi HEAD si e' mosso di tre commit (19:49-19:51, sessione concorrente).
Ogni cifra qui e' presa a `758aded1b` e non li comprende.

> Nessuna percentuale complessiva compare in questo documento, per scelta. Ci sono solo conteggi
> grezzi per classe, e la quota di incerti e' sempre riportata accanto alle altre due.

---

## 0. Perimetro e metodo

### 0.1 Cosa e' stato contato

I commit vengono da `git log --since=2026-01-01`, cioe' tutti gli antenati raggiungibili da HEAD
(non solo il first-parent): 1357, di cui 55 merge.
I merge non hanno contenuto proprio e sono esclusi da ogni profilo statistico e da ogni
classificazione; restano nei totali di §1 come riga a se'.

### 0.2 Cosa e' stato escluso dal conteggio righe

Il `git blame` di §2 gira su **2244 file** dei 5797 tracciati a HEAD. Le esclusioni, applicate
per prefisso di path, nome ed estensione (la funzione e' riportata in fondo, §7.2), sommano a 3553:

| Motivo | Esempi | File esclusi |
|---|---|---|
| Vendored di terze parti | `frontend/public/boxicons-2.1.4/` (1645), `frontend/public/webjars/` (1638), `frontend/public/xtext/` (38), `frontend/src/common/libraries/` (7) | 3328 |
| Asset e artefatti binari o di build | `.svg .png .jpg .woff .pdf .map`, artefatti LaTeX `.aux .dvi .fls .toc .cls .bbl` | 182 |
| Lockfile e generati | `package-lock.json`, `AGENTS.md` (rigenerato da `npm run gen:agents`), `docs/design/*/support.js` (che si autodichiara «GENERATED ... do not edit») | 5 |
| Dataset macchina e build LaTeX | `docs/discovery/emse-dataset/` (29), `docs/mde-intelligence-2026/paper/_build/` (9) | 38 |

`docs/discovery/emse-dataset/` merita una riga a se': e' un dump di estrazione git generato il
2026-06-09, e da solo pesa **343 609 righe vive**, cioe' piu' di un terzo dell'albero prima del
filtro. Un singolo file, `git/churn_raw.txt`, ne porta 337 826. Tenerlo dentro avrebbe schiacciato
ogni altra cifra di §2 su un unico commit di giugno. Non e' codice ne' prosa: e' output di comandi.

Dopo il filtro restano **596 180 righe vive in 2241 file**. Le 227 righe non attribuite a nessun
commit sono modifiche non committate nel working tree al momento della misura, e sono escluse da
tutte le tabelle.

Tre dei 2244 file sono vuoti (0 byte) e non producono righe: da qui i 2241 con almeno una riga.

### 0.3 Comandi

`git blame -w --incremental` per file, aggregato per commit. Il flag `-w` ignora le variazioni di
solo spazio, quindi una riga riformattata resta attribuita a chi l'ha scritta e non a chi l'ha
indentata. Non e' stato usato `-M`/`-C`: uno spostamento di codice fra file conta come riga nuova
del commit che lo ha spostato.

**Controllo positivo del blame.** L'assenza di righe per un file e' identica a un comando che non
e' partito. Il totale del blame (955 603 righe prima del filtro) e' stato confrontato con `wc -l`
sugli stessi file (955 494): la differenza di 109 righe e' dovuta ai file senza newline finale, che
`blame` conta e `wc -l` no. Cinque file risultavano a zero righe: quattro sono vuoti davvero,
il quinto (`scripts/generate-agents.mjs`, 154 righe) era stato saltato dal loop di shell perche' la
lista dei path non terminava con newline. E' stato reintegrato a mano. Senza questo controllo
sarebbe passato per un file senza storia.

---

## 1. Copertura dei trailer

Il marcatore cercato e' `Co-Authored-By: Claude ...` in coda al messaggio. La forma
`🤖 Generated with Claude Code` **non compare mai** come footer in questo repo: le tre occorrenze
della stringa «Generated with» in tutta la storia sono prosa dentro il corpo del messaggio, non
trailer. Un secondo marcatore indipendente esiste dal 2026-07: i commit il cui **autore git** e'
`Claude <noreply@anthropic.com>` o `Claude (cloud) <noreply@anthropic.com>`, prodotti da sessioni
cloud, che non portano il trailer perche' l'attribuzione e' gia' nel campo autore.

Nel resto del documento **marcato** significa: trailer presente, oppure autore git `Claude`.

| Mese | commit | merge | non-merge | con trailer | autore Claude | marcati | non marcati |
|---|---|---|---|---|---|---|---|
| 2026-01 | 99 | 1 | 98 | 19 | 0 | 19 | 79 |
| 2026-02 | 71 | 5 | 66 | 14 | 0 | 14 | 52 |
| 2026-03 | 121 | 6 | 115 | 55 | 0 | 55 | 60 |
| 2026-04 | 71 | 9 | 62 | 16 | 0 | 16 | 46 |
| 2026-05 | 155 | 14 | 141 | 62 | 0 | 62 | 79 |
| 2026-06 | 89 | 13 | 76 | 63 | 0 | 63 | 13 |
| 2026-07 | 193 | 3 | 190 | 144 | 17 | 161 | 29 |
| 2026-08 | 558 | 4 | 554 | 277 | 52 | 324 | 230 |
| **totale** | **1357** | **55** | **1302** | **650** | **69** | **714** | **588** |

Il primo trailer del repo e' `eedf675ea`, 2026-01-16 21:43, *«Phase 3 complete: Layout Components
restyled with design tokens»*. Prima di quella data non esiste alcun marcatore, in nessuna forma,
in tutta la storia dal 2021.

### 1.1 I modelli dichiarati nel trailer

Il campo modello dentro il trailer e' una successione cronologica pulita, senza sovrapposizioni
anomale. E' la ragione principale per cui il trailer, **quando c'e'**, si puo' prendere per buono:
un marcatore inventato o copiato a mano non produrrebbe questa monotonia.

| Modello dichiarato | commit | primo | ultimo |
|---|---|---|---|
| Claude Opus 4.5 | 23 | 2026-01-16 | 2026-02-11 |
| Claude Opus 4.6 | 29 | 2026-02-14 | 2026-03-16 |
| Claude Sonnet 4.6 | 4 | 2026-03-11 | 2026-03-11 |
| Claude Opus 4.6 (1M context) | 33 | 2026-03-16 | 2026-04-01 |
| Claude Opus 4.7 (1M context) | 70 | 2026-04-23 | 2026-05-27 |
| Claude Opus 4.8 | 136 | 2026-05-30 | 2026-08-03 |
| Claude Opus 4.8 (1M context) | 43 | 2026-07-20 | 2026-07-29 |
| Claude Fable 5 | 37 | 2026-07-16 | 2026-08-25 |
| Claude Opus 5 | 275 | 2026-07-29 | 2026-08-28 |

Somma: 650, che e' esattamente il conteggio dei trailer. Ogni trailer porta un modello.

### 1.2 Il trailer non e' una misura di copertura

Il dato piu' importante di questa sezione e' negativo. Il prompt assume attribuzione certa dal
2026-08-14 in poi; in quella finestra ci sono **338 commit non-merge, e 156 non portano alcun
marcatore**. Non e' un periodo marcato in modo uniforme.

Quei 156 non sono commit di altro tipo. Hanno lo stesso churn mediano (142 contro 156), lo stesso
numero di file toccati, la stessa distribuzione oraria, e il prefisso conventional-commit su
155 su 156. L'unica differenza sistematica e' che **153 su 156 hanno un messaggio di una sola
riga** (contro 96 su 182 fra i marcati). Il trailer, in questo repo, tende a comparire insieme al
corpo esteso del messaggio, non insieme a un tipo di lavoro.

Conseguenza operativa: l'assenza del trailer non e' evidenza di lavoro manuale, in nessun mese.
Tutte le tabelle che seguono contano i commit **senza marcatore** come una classe da esaminare,
mai come una classe di controllo negativa.

---

## 2. Attribuzione delle righe vive

`git blame` su HEAD, 596 180 righe in 2241 file dopo le esclusioni di §0.2.

### 2.1 Per mese di origine e classe di marcatore

| Bucket | righe vive | trailer | autore Claude | senza marcatore |
|---|---|---|---|---|
| pre-2026 | 64 672 | 0 | 0 | 64 672 |
| 2026-01 | 121 942 | 8 259 | 0 | 113 683 |
| 2026-02 | 69 265 | 5 389 | 0 | 63 876 |
| 2026-03 | 49 671 | 17 473 | 0 | 32 198 |
| 2026-04 | 27 923 | 1 773 | 0 | 26 150 |
| 2026-05 | 39 499 | 7 912 | 0 | 31 587 |
| 2026-06 | 23 843 | 10 103 | 0 | 13 740 |
| 2026-07 | 48 168 | 30 879 | 3 633 | 13 656 |
| 2026-08 | 150 970 | 74 523 | 19 660 | 56 787 |
| **totale** | **595 953** | **156 311** | **23 293** | **416 349** |

Il totale di riga e' 595 953 e non 596 180 per via delle 227 righe non committate (§0.2).

### 2.2 Per area del repo

| Area | righe vive | trailer | autore Claude | senza marcatore |
|---|---|---|---|---|
| `frontend/src` | 348 716 | 59 258 | 6 037 | 283 421 |
| `docs` | 237 448 | 93 683 | 16 943 | 126 822 |
| `frontend/` (altro) | 7 227 | 2 813 | 313 | 4 101 |
| root + `scripts` | 2 562 | 557 | 0 | 2 005 |

La documentazione e' l'area dove il marcatore e' piu' frequente. Il codice sorgente vivo resta in
maggioranza su commit senza marcatore, ma §1.2 dice che questo non basta a chiamarlo manuale.

### 2.3 Il peso dei singoli commit

L'attribuzione per riga e' dominata da pochi commit grossi, e va letta sapendolo. I primi cinque
per righe sopravvissute, dopo il filtro di §0.2:

| Righe vive | Commit | Data | Trailer | Oggetto |
|---|---|---|---|---|
| 26 298 | `28db0a38d` | 2026-08-10 | si | docs: add documentation archive structure migrated from project |
| 19 226 | `45a83df9a` | 2026-03-10 | no | Fix JjEL Console implicit context: allow unqualified property |
| 12 717 | `de518e89d` | 2026-01-30 | no | RAG integrato in Jjodie |
| 12 562 | `e14c2b17d` | 2026-08-14 | autore Claude | docs(archivio): archive the remaining chat documents |
| 9 989 | `75fe8f2f5` | 2026-02-20 | no | primo committ dopo l'editor definito e dopo l'integrazione |

Tre di questi cinque sono spostamenti o import di documentazione, non scrittura. Una riga di
`docs/archivio` vale quanto una riga di `useJjomSync.ts` in questa tabella, e non dovrebbe.

### 2.4 Da dove siamo partiti

Le righe vive di §2 dicono chi ha scritto quel che sopravvive, non quanto e' cresciuto l'albero.
Questa e' la seconda misura: conteggio riga per riga dello snapshot a ogni inizio mese, stesso
filtro di §0.2, letto con `git ls-tree` + `git cat-file` senza checkout. Metodo indipendente dal
blame; i due concordano a HEAD entro 2 righe su 596 000 (595 955 contro 595 953).

| Snapshot | file | TS/TSX | test TS/TSX | SCSS/CSS | JS | docs | altro | **totale** |
|---|---|---|---|---|---|---|---|---|
| origine 2021-03-31 | 19 | 64 | 9 | 51 | 0 | 0 | 241 | **365** |
| 2025-01-01 | 325 | 49 017 | 0 | 22 993 | 136 | 0 | 1 264 | **73 410** |
| **2026-01-01** | **358** | **60 752** | **0** | **15 206** | **281** | **0** | **1 934** | **78 173** |
| 2026-02-01 | 774 | 112 909 | 275 | 64 835 | 277 | 30 391 | 3 911 | **212 598** |
| 2026-03-01 | 975 | 161 403 | 275 | 82 381 | 281 | 32 577 | 4 098 | **281 015** |
| 2026-04-01 | 1 151 | 184 846 | 4 725 | 92 192 | 462 | 46 423 | 6 857 | **335 505** |
| 2026-05-01 | 1 192 | 189 695 | 6 490 | 92 912 | 462 | 57 764 | 5 635 | **352 958** |
| 2026-06-01 | 1 297 | 196 655 | 7 254 | 94 712 | 462 | 85 832 | 7 156 | **392 071** |
| 2026-07-01 | 1 390 | 201 182 | 7 587 | 95 322 | 462 | 105 007 | 7 339 | **416 899** |
| 2026-08-01 | 1 505 | 207 996 | 10 930 | 95 889 | 850 | 115 257 | 7 256 | **438 178** |
| **2026-08-28 (758aded1b)** | **2 241** | **227 897** | **20 269** | **101 873** | **868** | **237 459** | **7 589** | **595 955** |

Numeri per il periodo del documento, dal 2026-01-01 a oggi:

- **totale albero**: da 78 173 a 595 955 righe, **+517 782**, in 358 → 2241 file.
- **codice applicativo** (TS/TSX/SCSS/CSS/JS, test esclusi): da 76 239 a 330 638, **+254 399**.
- **solo TS/TSX di produzione**: da 60 752 a 227 897, **+167 145**, in 238 → 928 file.
- **test**: da 0 a 20 269 righe in 82 file. Non ne esisteva uno il 2026-01-01.
- **documentazione**: da 0 a 237 459 righe in 896 file. `docs/` nasce a gennaio 2026.

Ai due estremi, il rapporto fra le due misure. Delle 78 173 righe presenti il 2026-01-01, **64 672
sopravvivono oggi non toccate** (51 297 TS/TSX, 11 292 SCSS/CSS, 2 083 altro): il resto e' stato
riscritto o cancellato. Detto al contrario, delle 595 955 righe di oggi ne restano 64 672 che
nessun commit del 2026 ha piu' sfiorato, e 531 283 scritte o riscritte quest'anno.

Due avvertenze sulla lettura di questa tabella. La prima: le righe `docs` a marzo e aprile
includono i file poi archiviati, e la crescita di agosto (115 257 → 237 459) e' in buona parte
l'import dell'archivio di `28db0a38d`, cioe' spostamento, non scrittura (§2.3). La seconda: SCSS/CSS
cresce di 86 667 righe, piu' della meta' del delta TS/TSX, e questo pesa su ogni conteggio «righe di
codice» che non separi i fogli di stile.

---

## 3. Impronta di riferimento

Il riferimento **harness certo** e' l'insieme dei 182 commit non-merge dal 2026-08-14 con
marcatore. Il riferimento **manuale certo** e' l'insieme dei 1325 commit non-merge **precedenti al
2026-01-01**: prima della comparsa del primo trailer nel repo (2026-01-16) e quattordici mesi
prima dell'apertura del log operativo (2026-03-17).

Le due colonne centrali servono da controllo: i non marcati della stessa finestra di riferimento, e
il periodo ambiguo diviso per marcatore.

| Metrica | REF >= 08-14 marcati | REF >= 08-14 non marcati | REF pre-2026 | AMB marcati | AMB non marcati |
|---|---|---|---|---|---|
| n (non-merge) | 182 | 156 | 1325 | 532 | 432 |
| churn p10 | 14 | 6 | 2 | 9 | 8 |
| churn p25 | 45 | 26 | 7 | 20 | 46 |
| **churn mediano** | **156** | **142** | **46** | **88** | **261** |
| churn p75 | 323 | 313 | 203 | 304 | 1022 |
| churn p90 | 552 | 912 | 552 | 706 | 2764 |
| churn medio | 303 | 334 | **8829** | 364 | **6790** |
| file toccati mediano | 3 | 2 | 3 | 2 | 4 |
| file toccati p90 | 7 | 7 | 16 | 8 | 22 |
| file toccati medio | 3,59 | 2,80 | **22,67** | 4,12 | **16,55** |
| subject p10 | 52 | 45 | 5 | 51 | 12 |
| **subject mediano** | **66** | **64** | **17** | **66** | **38** |
| subject p90 | 78 | 86 | 39 | 82 | 75 |
| corpo messaggio mediano | 81 | 64 | 18 | 437 | 42 |
| messaggi multi-riga | 86 / 182 | 3 / 156 | 96 / 1325 | 373 / 532 | 74 / 432 |
| **prefisso conventional** | **181 / 182** | **155 / 156** | **2 / 1325** | 488 / 532 | 174 / 432 |
| subject in minuscolo | 182 / 182 | 156 / 156 | 1002 / 1325 | 488 / 532 | 347 / 432 |
| intervallo dal precedente, p25 (min) | 3,9 | 3,4 | 16,8 | 5,4 | 13,6 |
| **intervallo mediano (min)** | **15,5** | **15,0** | **210,2** | **27,4** | **66,5** |
| intervallo p75 (min) | 32,8 | 46,3 | 1211,2 | 145,1 | 559,5 |
| commit fra le 22:00 e le 05:59 | 54 | 48 | 393 | 225 | 141 |
| commit che toccano il log operativo | 91 | 59 | 0 | 229 | 119 |

Cosa separa davvero le due popolazioni:

1. **Il prefisso conventional-commit** e' il discriminante piu' netto della tabella: 181 su 182
   nell'harness certo, 2 su 1325 nel manuale certo.
2. **La lunghezza del subject**: mediana 66 contro 17; il decimo percentile dell'harness (52) e'
   sopra il novantesimo del manuale (39). Le due distribuzioni non si sovrappongono quasi.
3. **La forma della coda del churn**: le mediane sono vicine (156 contro 46, stesso ordine di
   grandezza), ma le medie divergono di due ordini (303 contro 8829). Il lavoro manuale del periodo
   pre-2026 procede a commit-valanga; l'harness no.
4. **La cadenza**: 15 minuti di intervallo mediano contro 210.

Cosa **non** separa niente: l'ora del giorno. Entrambe le popolazioni lavorano di notte con
frequenza simile, e l'istogramma orario non porta segnale utilizzabile.

L'avvertenza pesa quanto la tabella: il riferimento manuale viene da un'**epoca diversa** del
progetto, non da un'altra mano nello stesso periodo. Le tre metriche che discriminano sono tutte
metriche di **disciplina di commit**, e quella disciplina e' scritta in `CLAUDE.md` §6.2 e in
`docs/PROTOCOL.md`. Un essere umano che segue quel protocollo produce la stessa impronta. Quello
che l'impronta misura e' l'aderenza allo stile della casa nel periodo harness, non l'autore.

---

## 4. Classificazione del periodo ambiguo

### 4.1 La regola

Punteggio naive-Bayes in log-odds sulle cinque feature binarie sotto, con rapporti di verosimiglianza
stimati da REF-harness contro REF-pre-2026, smoothing di Laplace e contributo per feature limitato
a ±2,5 per impedire che una sola feature decida da sola.

| Feature | P(f \| harness) | P(f \| manuale) | log-LR se vera | log-LR se falsa |
|---|---|---|---|---|
| prefisso `tipo(scope):` | 0,992 | 0,002 | +2,50 | −2,50 |
| subject >= 45 caratteri | 0,964 | 0,071 | +2,50 | −2,50 |
| <= 8 file toccati | 0,954 | 0,773 | +0,21 | −1,58 |
| churn <= 1200 righe | 0,981 | 0,955 | +0,03 | −0,85 |
| messaggio multi-riga | 0,473 | 0,073 | +1,87 | −0,56 |

Nessuna feature documentale entra qui: l'ancoraggio di §5 resta indipendente, altrimenti le due
sezioni si confermerebbero a vicenda per costruzione.

Le due feature forti sono correlate fra loro, quindi il naive-Bayes sovrastima la propria
sicurezza sui casi in cui concordano e — soprattutto — produce un punteggio arbitrario sui casi in
cui **discordano**. Per questo l'etichetta finale non e' il solo punteggio:

- **probabile-harness**: prefisso conventional **e** subject >= 45 **e** punteggio >= +3
- **probabile-manuale**: nessuno dei due **e** punteggio <= −3
- **incerto**: tutto il resto, e in particolare **ogni caso in cui le due feature forti discordano**

I 43 casi di discordanza del periodo ambiguo finiscono tutti in `incerto`, per costruzione.
Esempi dei due tipi: `feat: jjEL in jjodie improved` (prefisso ma subject corto),
`molte modifiche, molte riguardano la parte di editor di progetto` (subject lungo, nessun prefisso).

### 4.2 Verifica della regola

In-sample, quindi ottimistica — i riferimenti sono gli stessi da cui vengono i rapporti:

| Insieme | n | probabile-harness | probabile-manuale | incerto |
|---|---|---|---|---|
| REF harness certo (>= 08-14, marcati) | 182 | 171 | **1** | 10 |
| REF manuale certo (pre-2026) | 1325 | **0** | 1193 | 132 |

Zero falsi «harness» su 1325 commit manuali certi. L'unico falso «manuale» e' `6f8cd3909`,
2026-08-25, subject `tree view: viewpoint-aware rendering state`: `tree view:` non e' un tipo
conventional valido, e il subject sta sotto i 45 caratteri.

**Sonda fuori campione.** I 156 commit dal 2026-08-14 senza marcatore — epoca nota, marcatore
assente — vengono classificati **130 probabile-harness, 1 probabile-manuale, 25 incerto**. Coerente
con la lettura di §1.2: in quella finestra il trailer manca in modo non informativo.

### 4.3 Esito sul periodo ambiguo

Commit dal 2026-01-01 al 2026-08-13, non-merge, **senza alcun marcatore**: 432.
I 532 commit marcati dello stesso periodo non sono classificati — sono gia' attribuiti dal trailer.

| Mese | n | probabile-harness | probabile-manuale | **incerto** |
|---|---|---|---|---|
| 2026-01 | 79 | 0 | 71 | **8** |
| 2026-02 | 52 | 0 | 44 | **8** |
| 2026-03 | 60 | 1 | 46 | **13** |
| 2026-04 | 46 | 25 | 17 | **4** |
| 2026-05 | 79 | 48 | 21 | **10** |
| 2026-06 | 13 | 4 | 8 | **1** |
| 2026-07 | 29 | 20 | 4 | **5** |
| 2026-08 (fino al 13) | 74 | 60 | 9 | **5** |
| **totale** | **432** | **158** | **220** | **54** |

Gli incerti restano incerti. Nessuno dei 54 e' stato spostato in una delle altre due classi.

**Sensibilita' alla soglia.** La ripartizione e' stabile fra +2 e +4 e collassa a +5, dove il
punteggio massimo ottenibile dalle sole feature forti non basta piu':

| soglia | harness | manuale | incerto |
|---|---|---|---|
| 2,0 | 168 | 238 | 26 |
| 2,5 | 160 | 236 | 36 |
| **3,0** | **158** | **233** | **41** |
| 3,5 | 158 | 220 | 54 |
| 4,0 | 157 | 220 | 55 |
| 5,0 | 43 | 217 | 172 |

I numeri di questa tabella escludono la regola di discordanza di §4.1, che e' la ragione per cui il
totale a 3,0 e' 41 qui e 54 in tabella 4.3.

**Autori.** I 432 commit ambigui non sono tutti di una mano: 345 Alfonso Pierantonio,
60 Damiano Di Vincenzo, 17 Juri Di Rocco, 6 Andrea Perelli, 4 Riccardo Belliato. Gli 87 commit dei
collaboratori si classificano 69 manuale, 6 harness, 12 incerto — ma per loro non esiste nessun
riferimento harness certo, quindi quelle 6 etichette «harness» vanno lette come «stile conforme al
protocollo», niente di piu'.

---

## 5. Ancoraggio documentale

Il repo ha una traccia scritta indipendente dal trailer:

- `docs/claude-code-log.md` + `docs/claude-code-log-archive.md`: **942 voci**, ognuna con data e
  campo `Files touched` / `File toccati`. 727 voci hanno una lista di file estraibile. Copertura:
  **128 giornate distinte, dal 2026-03-17 al 2026-08-28**.
- Documenti datati sotto `docs/prompts/`, `docs/discovery/`, `docs/sessioni/`, `docs/ratifiche/`,
  `docs/spec/`, `docs/reports/`, `docs/handover/`, `docs/analysis/`: **111 date distinte**, dal
  2025-01-28 al 2026-08-28. Per mese del 2026: 10, 4, 0, 4, 21, 17, 26, 28.

Quattro test di ancoraggio, calcolati per ogni commit e presenti nel CSV:

| Test | Definizione |
|---|---|
| `anchor_log_date` | la data del commit e' una data con almeno una voce di log |
| `anchor_log_filematch` | esiste una voce di log entro ±1 giorno la cui lista `Files touched` interseca i file del commit, escluso il log stesso |
| `anchor_touches_log` | il commit modifica `claude-code-log.md` o l'archivio |
| `anchor_protdoc_sameday` | il commit tocca un documento di protocollo datato, la cui data nel nome coincide con la data del commit |

### 5.1 Ancoraggio per stato del marcatore, tutti i commit non-merge del 2026

| Insieme | n | log-date | file-match | tocca il log | doc protocollo | almeno uno |
|---|---|---|---|---|---|---|
| marcati | 714 | 623 | 414 | 320 | 130 | **571** |
| non marcati | 588 | 397 | 240 | 178 | 140 | **349** |

### 5.2 Ancoraggio del periodo ambiguo, per etichetta di §4

| Etichetta | n | log-date | file-match | tocca il log | doc protocollo | almeno uno | **nessuno** |
|---|---|---|---|---|---|---|---|
| probabile-harness | 158 | 150 | 114 | 83 | 33 | 140 | **18** |
| probabile-manuale | 220 | 65 | 32 | 23 | 27 | 53 | **167** |
| incerto | 54 | 26 | 13 | 13 | 7 | 22 | **32** |

Le due classificazioni sono state costruite indipendentemente e concordano: i commit che lo stile
manda su «harness» sono anche quelli con la traccia scritta, 140 su 158.

### 5.3 Ancoraggio per mese, periodo ambiguo

| Mese | n | log-date | file-match | tocca il log | doc protocollo | almeno uno |
|---|---|---|---|---|---|---|
| 2026-01 | 79 | 0 | 0 | 0 | 14 | 14 |
| 2026-02 | 52 | 0 | 0 | 0 | 2 | 2 |
| 2026-03 | 60 | 17 | 5 | 4 | 0 | 7 |
| 2026-04 | 46 | 31 | 25 | 20 | 2 | 29 |
| 2026-05 | 79 | 78 | 53 | 43 | 18 | 61 |
| 2026-06 | 13 | 13 | 10 | 10 | 7 | 13 |
| 2026-07 | 29 | 28 | 19 | 16 | 8 | 26 |
| 2026-08 | 74 | 74 | 47 | 26 | 16 | 63 |

Gennaio e febbraio sono ciechi per costruzione: il log operativo comincia il 2026-03-17. Le uniche
conferme di quei due mesi vengono dai documenti datati, 14 e 2. Non e' una prova di lavoro manuale:
e' assenza dello strumento di prova. I 19 e 14 commit con trailer di gennaio e febbraio (§1)
dimostrano che l'harness era gia' in uso quando il log non c'era ancora.

### 5.4 I casi in disaccordo

**21 commit** hanno stile «probabile-manuale» ma un ancoraggio documentale forte (intersezione su
due o piu' file con una voce di log della stessa giornata). Sono il residuo onesto dell'analisi:
la traccia scritta dice che quel giorno una sessione harness ha toccato quei file, lo stile del
messaggio dice il contrario. Primi esempi:

| Data | Commit | Subject | File in comune con la voce di log |
|---|---|---|---|
| 2026-03-26 | `e213f610c` | JjScript block fixed | `ScriptExecutionWindow.tsx`, `commands/forall.ts` |
| 2026-04-14 | `f667e16dc` | infinite loop problem fixed (maybe) | `EditorV2.scss`, `EditorV2.tsx` |
| 2026-05-04 | `7482f9359` | default custom view revisisted | `2026-05-03-default-class-view-template-discovery.md`, `Info.tsx` |
| 2026-05-25 | `729c5ce07` | anchorpoint fixes | `2026-05-25_cross_role_ordering_feasibility.md`, `2026-05-25_identity_binding.md` |
| 2026-06-04 | `248bb0bcf` | json export of the mappings | `2026-06-03_advanced_mode_audit.md`, `2026-06-04_advanced_mode_consolidation_phaseA.md` |

La lettura piu' semplice: sessione harness, commit scritto a mano fuori dalla sessione. Non e'
verificabile da qui, e questi 21 non sono stati riclassificati.

Nell'altra direzione, **18 commit** «probabile-harness» non hanno alcun ancoraggio documentale.

### 5.5 Limite del test file-match

L'intersezione su **un solo** file puo' scattare per coincidenza su file caldi
(`EditorV2.tsx`, `docs/decisions.md`, i file dei token). Per questo la colonna `strong`
del CSV richiede due file o piu'. Sul periodo ambiguo: 83 dei 158 «probabile-harness» reggono il
test forte, 21 dei 220 «probabile-manuale», 12 dei 54 incerti.

---

## 6. Quello che questi numeri non dicono

1. **Il trailer misura la sua presenza, non l'uso dell'harness.** 156 commit su 338 nella finestra
   che il prompt dava per certa non lo portano, e non sono commit diversi dagli altri (§1.2).
2. **L'impronta di §3 misura lo stile di commit, non l'autore.** Le tre metriche discriminanti sono
   esattamente quelle normate da `CLAUDE.md` §6.2. Chi segue il protocollo a mano e' indistinguibile.
3. **Il riferimento manuale viene da un'altra epoca**, non da un'altra mano nello stesso mese. Il
   classificatore risponde a «somiglia allo stile pre-2026 o a quello harness-2026», che e' una
   domanda diversa da quella posta.
4. **Le righe vive non sono lavoro.** Un commit di archiviazione documenti pesa 26 298 righe, un fix
   nella critical zone ne pesa 12. §2.3 mostra quanto poche siano le mani che muovono la tabella.
5. **Gennaio e febbraio non hanno strumento di prova** (§5.3). Non c'e' modo, da questo repo, di
   distinguere «non documentato» da «non harness» in quei due mesi.
6. **La verifica di §4.2 e' in-sample.** Non c'e' un insieme di validazione indipendente perche' non
   esiste un corpus manuale certo contemporaneo all'harness.

---

## 7. Riproducibilita'

### 7.1 File prodotti

| File | Contenuto |
|---|---|
| `harness-attribution-commits.csv` | 1357 righe, una per commit dal 2026-01-01: metadati, marcatore, modello, churn, feature, punteggio, classe, i cinque test di ancoraggio |
| `harness-attribution-monthly.csv` | copertura e classificazione per mese |
| `harness-attribution-blame.csv` | righe vive per bucket temporale e per area |
| `harness-attribution-fingerprint.csv` | la tabella di §3 |
| `harness-attribution-files.csv` | 2241 righe, una per file: righe vive per classe |
| `harness-attribution-growth.csv` | la tabella di §2.4: conteggio righe per snapshot mensile |

### 7.2 Il filtro di esclusione

```python
EXCL_DIR = ('frontend/public/webjars/', 'frontend/public/boxicons-', 'frontend/public/xtext/',
            'node_modules/', 'dist/', 'build/', 'docs/discovery/emse-dataset/',
            'frontend/src/common/libraries/', 'docs/mde-intelligence-2026/paper/_build/')
EXCL_EXT = {'svg','png','jpg','jpeg','gif','webp','ico','woff','woff2','ttf','eot','otf','pdf',
            'map','aux','dvi','fls','fdb_latexmk','toc','out','synctex','xmi','ecore','zip','gz',
            'mp4','mov','cls','bbl','bst','sty'}
EXCL_NAME = {'package-lock.json','yarn.lock','pnpm-lock.yaml','AGENTS.md'}
# piu': *.min.js, *.min.css, i path contenenti 'html@c=', docs/design/*/support.js
```

### 7.3 Nota sul grep

Le ricerche testuali di questa analisi sono state fatte con `command grep` e non con `grep`: in
questa shell `grep` e' un wrapper su `ugrep --ignore-files`, che salta i path gitignorati e
interpreta `--include` come nome di file. La distinzione e' la stessa gia' registrata in
`CLAUDE.md` §5.
