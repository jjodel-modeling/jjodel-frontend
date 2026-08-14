# Passo 6: audit del registro R-RAIL, ratifica sul working tree, correzione della nota (15)

**Nome del documento prompt**: 2026-08-11 14:04
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: docs. Cinque commit, nessun file sorgente nel diff.
**Vincolo di chiusura**: **niente push**. Il task finisce al quinto commit.
**Ambiente**: questo task va eseguito da **Claude Code sul Mac**. Non dal bridge di Cowork:
su quel mount la unlink è vietata, git lascia un `.git/index.lock` stantio e blocca tutto,
VS Code compreso.
**Vincolo generale**: `CLAUDE.md` è la fonte di verità. Se questo prompt lo contraddice in un
punto non dichiarato in §5, segnala il conflitto invece di eseguirlo.

Questo prompt è autocontenuto. Non ricostruire da memoria di sessione.

---

## 0. Guard di stato, con tolleranza dichiarata

```bash
git rev-parse --abbrev-ref HEAD
git log --oneline -4
git status --porcelain
git rev-list --count origin/alfonso-frontend-jjtl..HEAD
```

| Controllo | Valore atteso |
|---|---|
| branch | `alfonso-frontend-jjtl` |
| HEAD | `019dbc318 docs: log arc 1 rail closure and rotate the oldest entry` |
| HEAD~1 | `e1ae67df7 docs: register R-RAIL-19 with the conformance grep set` |
| HEAD~2 | `cf750cade docs: rename session checkpoint and add the 2026-08-11 one` |
| HEAD~3 | `df8850653 feat: restyle tree pane rows in properties rail` |
| working tree | **vuoto**: `git status --porcelain` dà zero righe |
| ahead di origin | 5 |

**Tolleranza dichiarata.** `.claude/settings.local.json` **non deve comparire** in
`git status`. Sul Mac di Alfonso è coperto dal gitignore globale `~/.config/git/ignore:1`, non
dai dieci pattern `**/.claude/*` di `.git/info/exclude`. Se compare, non stai girando sul suo
Mac: fermati. Questa riga esiste perché il guard del passo 5 lo elencava fra le righe attese,
sulla base di uno stato osservato dal bridge, dove quel gitignore globale non c'è.

Nessun'altra divergenza è tollerata. Se un controllo non corrisponde: fermati e riporta. Non
riallineare, non stashare, non fare checkout.

---

## 1. COSA

Cinque commit, in quest'ordine. Nessun file sorgente in nessuno dei cinque.

| # | Contenuto | File |
|---|---|---|
| 0 | Report di discovery della Fase 1 | `docs/discovery/discovery_2026-08-11_audit_registro_rail.md` |
| A | Backfill delle otto R-RAIL mancanti | `docs/decisions.md` |
| B | R-RAIL-27, working tree non invariante per macchina | `docs/decisions.md` |
| C | Due voci di backlog | `docs/TECH-DEBT.md` |
| D | Entry di log e rotazione | `docs/claude-code-log.md`, `docs/claude-code-log-archive.md` |

Il commit 0 precede i commit di registro per **R-RAIL-20**, che è anche una delle voci che
questo passo iscrive.

---

## 2. DOVE

Nessun file oltre ai cinque della tabella di §1. **Mai `git add .`**, in nessuna fase.

---

## 3. COME

### 3.0 Perché le otto voci mancano, e da dove vengono i testi

Il §1.B del prompt del passo 5 dichiarava R-RAIL-19 come unica mancante, sulla base
dell'elenco «ci sono 1..13, 16, 18, 22, 23, 24, 25, 26». Quell'elenco veniva da un conteggio
con `grep -o` che non distingue una **voce definita** da una **citazione in prosa** dentro il
corpo di un'altra voce. Stato reale del registro, verificato l'11 agosto sulla revisione
pubblicata su origin:

| Insieme | Numeri |
|---|---|
| voci definite | 1..13, 23, 24, 25, 26 |
| solo citate in prosa di altre voci | 16, 18, 22 |
| assenti del tutto | 14, 15, 17, 19, 20, 21 |

Con R-RAIL-19 iscritta dal commit `e1ae67df7`, restano **otto** lacune: 14, 15, 17, 20, 21
assenti, e 16, 18, 22 da promuovere da citazione a voce.

**Fonte dei testi**: la lista «Le ventisei ratifiche» in
`docs/sessioni/claude_sessione_2026-08-10_4.md`. Verificata l'11 agosto dalla sessione Cowork:
**tutte e otto sono presenti** in quel file, e i testi di §3.2 ne sono la trascrizione
verbatim. Nota sui nomi: su origin quel file compare ancora come
`docs/sessioni/sessione_2026-08-10_4.md`, perché la rinomina è nel commit `cf750cade`, non
pushato. Sul Mac a HEAD il nome è quello col prefisso `claude_`.

### 3.1 Fase 1: discovery read-only, con report obbligatorio

Non scrivere nulla in `decisions.md` o in `TECH-DEBT.md` prima di aver letto questi file e
prodotto il report.

Cosa leggere:

1. `docs/decisions.md`, la sezione **«Arco rail destro — preset 2a (dal 2026-08-10)»** per
   intero. Rileva: l'ordine reale delle voci; la forma esatta dell'intestazione, attesa
   `**R-RAIL-N** (data) — testo`; la **larghezza di wrap effettiva** delle voci vicine, attesa
   98 colonne; le righe dove 16, 18 e 22 compaiono citate nella prosa di altre voci.
2. `docs/TECH-DEBT.md` per intero. Il modello da ricalcare è la voce di **R-RAIL-25**, sulla
   unificazione delle palette entity.
3. La prima entry di `docs/claude-code-log.md`, per i campi e il loro ordine. Il file è
   cambiato ieri: rileggilo, non fidarti di una memoria del formato.
4. I conteggi: `grep -c '^## ' docs/claude-code-log.md` e lo stesso sull'archivio. Attesi
   **20** e **734**.

**Report**: `docs/discovery/discovery_2026-08-11_audit_registro_rail.md`. Contenuto minimo:
obiettivo della discovery, file letti con path completi, findings rilevanti, dipendenze e
rischi individuati, domande aperte per Alfonso.

```bash
git add docs/discovery/discovery_2026-08-11_audit_registro_rail.md
git commit -m "docs: add discovery report for the R-RAIL register audit"
```

**Stop condizionale.** `docs/` non è critical zone, quindi non serve un go-ahead in chat:
prosegui a §3.2 salvo che scatti una delle condizioni di §6. Se scatta, fermati e riporta.

### 3.2 Commit A: le otto voci

Forma di ogni voce: `**R-RAIL-N** (2026-08-10) — <testo>`, ricalcando le voci vicine per
livello di lista, larghezza di riga e uso del grassetto. La data `(2026-08-10)` è quella delle
voci 13 e 23 che la circondano; se il checkpoint attribuisce a una voce specifica una data
diversa, vince il checkpoint.

Posizione: la sezione è ordinata, quindi 14, 15, 16, 17, 18 vanno fra R-RAIL-13 e R-RAIL-19, e
20, 21, 22 fra R-RAIL-19 e R-RAIL-23.

Testi, verbatim:

> - **R-RAIL-14** (2026-08-10) — Postura Browse/Focus **fuori dall'arco 1** (per R-RAIL-12).
>   `PRESET_2A` codifica solo geometria. Tree 392px quando entrambi i pane sono montati;
>   altezza intera al pane superstite; nessuna altezza trascinabile.
>
> - **R-RAIL-15** (2026-08-10) — Il restyle del tree si scrive in `tree-view-sidebar.scss`
>   (ampliamento di scope dichiarato). Vietati gli override di specificità dal foglio del rail.
>
> - **R-RAIL-16** (2026-08-10) — Identity block = `PropertiesHeader`, restilato in loco nel
>   ramo model element; niente blocco nel guscio; **niente chip di firma**. **Superata per
>   l'arco 1 da R-RAIL-26**.
>
> - **R-RAIL-17** (2026-08-10) — Default larghezza **400** (già a codice); `MIN_OVERLAY_WIDTH`
>   da 320 a **360**.
>
> - **R-RAIL-18** (2026-08-10) — Header unico: si riusa quello della card PROPERTIES; l'header
>   del tree diventa label di sezione senza azioni; pin e HelpButton restano dove sono;
>   **footer fuori arco**.
>
> - **R-RAIL-20** (2026-08-10) — Il report di discovery si committa a sé, prima del passo di
>   registro.
>
> - **R-RAIL-21** (2026-08-10) — `jjodel_property_tree_height`: sparisce il codice, **resta il
>   dato** nei `localStorage`; nessun cleanup, annotazione in log.
>
> - **R-RAIL-22** (2026-08-10) — L'espressione di `overlayShown` non si tocca; il guscio si
>   monta sulla condizione di oggi; i due pane si rendono ciascuno sulla propria visibilità.

**Non riscrivere nessuna voce esistente.** In particolare, le prose che citano 16, 18 e 22
restano identiche: iscrivere le voci rende quelle citazioni risolvibili, e non va aggiunto
alcun rimando.

```bash
git add docs/decisions.md
git commit -m "docs: backfill the eight missing R-RAIL register entries"
```

### 3.3 Commit B: R-RAIL-27

Posizione: in coda alle R-RAIL, **dopo R-RAIL-26**, nella stessa sezione. Non creare sezioni
nuove: R-RAIL-20 è già una regola di metodo dentro quella sezione, e il registro usa una sola
serie numerica.

> - **R-RAIL-27** (2026-08-11) — Lo stato del working tree **non è invariante per macchina**:
>   `git status` risente del gitignore globale `~/.config/git/ignore`, che è per utente e per
>   macchina. Un working tree osservato dal bridge di Cowork non descrive quello che Claude
>   Code vede sul Mac. Conseguenze: (a) un guard di prompt non elenca file ignorati fra le
>   righe attese; (b) ogni guard dichiara la propria **tolleranza**, cioè quali divergenze
>   sono ammesse e quali fermano il task, altrimenti si compra uno stop falso a ogni passo;
>   (c) una divergenza di guard diagnosticata e a riduzione di lavoro non è un hard stop, ma
>   va riportata. Estende alle **letture** la regola già in vigore per le scritture git dal
>   bridge.

```bash
git add docs/decisions.md
git commit -m "docs: register R-RAIL-27 on machine-dependent working tree state"
```

### 3.4 Commit C: due voci in `docs/TECH-DEBT.md`

Ricalca il formato della voce di R-RAIL-25 rilevato in Fase 1. Contenuto delle due voci:

**Portata reale del restyle del tree.** Il restyle di R-RAIL-7 raggiunge le righe di NODE ma
non i nomi di istanza e di feature: quelli usano `.tree-feature__name` e restano a 11px, e il
peso 600 non li raggiunge perché marcano la selezione con `tree-row__content--selected` e non
con `tree-row--selected`. Da decidere nell'arco 2 se uniformare o se la differenza è voluta.
Rilevato nella nota (14) dell'entry di log del 2026-08-11.

**Sopravvivenza degli `@import` di `_typography.scss`.**
`frontend/src/styles/tokens/_typography.scss` carica Inter e IBM Plex Mono con due
`@import url(...)` da Google Fonts, collocati **dopo quattro blocchi `:root { }`** dello stesso
file. Per specifica CSS un `@import` che segue una regola di stile è invalido e viene scartato;
sopravvive solo se il bundler lo risale in testa alla CSS emessa. Verifica: DevTools, Network,
filtro `fonts.googleapis`, hard refresh su `localhost:3001`. Due richieste: i font si caricano
e la voce si chiude senza debito. Zero richieste: non si carica nemmeno Inter, ed è un difetto
di tipografia globale, non del solo suffisso mono.

```bash
git add docs/TECH-DEBT.md
git commit -m "docs: add backlog items for tree restyle reach and font import validity"
```

### 3.5 Commit D: entry di log e rotazione

Formato: quello reale del file, non quello minimo di CLAUDE.md §21.2. Campi nell'ordine
`**Prompt**`, `**Files touched**`, `**Outcome**`, `**Corregge**`, `**Causa**`,
`**Regressions**`, `**Out-of-scope changes**`, `**Layer Impact Report**`, `**Smoke visivo**`,
`**Notes**`, `**Prompt document name**`. La nuova entry va **in testa**, subito sotto
`# Claude Code Session Log`.

Bozza. Verifica ogni affermazione contro il repo prima di scriverla; dove la bozza sbaglia,
correggi la bozza, non il repo.

```markdown
## 2026-08-11 — docs: audit del registro R-RAIL e ratifica sul working tree per macchina

**Prompt**: «passo 6, audit del registro», documento prompt «2026-08-11 14:04».
**Files touched**: `docs/decisions.md` (otto voci di backfill, commit A; R-RAIL-27, commit B);
`docs/TECH-DEBT.md` (due voci di backlog, commit C);
`docs/discovery/discovery_2026-08-11_audit_registro_rail.md` (nuovo, commit 0).
**Outcome**: ✅ completed
**Corregge**: la nota (15) dell'entry «2026-08-11 — feat: restyle del tree pane e chiusura
dell'arco 1 del rail destro» afferma che IBM Plex Mono «non è caricato da nessuna parte». È
falso: `frontend/src/styles/tokens/_typography.scss` contiene
`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`,
preceduto due righe sopra dall'analogo per Inter. Resta aperto se i due `@import` sopravvivano
al bundling, perché seguono quattro blocchi `:root { }` dello stesso file: voce di backlog in
`docs/TECH-DEBT.md`. L'entry dell'11 agosto non è stata toccata, per il §5 del prompt del
passo 5.
**Causa**: asserzione di assenza non verificata sul file dei token, che è il solo punto dove i
font vengono caricati.
**Regressions**: no — nessun file sorgente nel diff.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: not-required — nessuna superficie toccata.
**Notes**: (1) **Le lacune del registro erano otto, non una.** Il §1.B del prompt del passo 5
dava R-RAIL-19 come unica mancante, sulla base di un elenco «1..13, 16, 18, 22, 23..26» che
contava con `grep -o` e non distingueva le voci definite dalle citazioni in prosa. Stato reale
prima di questo passo: definite 1..13, 19 e 23..26; solo citate 16, 18, 22; assenti 14, 15,
17, 20, 21. (2) **Tre delle lacune erano citate come autorità** dall'entry di chiusura
d'arco: R-RAIL-15 autorizzava l'ampliamento di scope su `tree-view-sidebar.scss`, R-RAIL-14
era il vincolo contro cui la postura Browse/Focus era stata costruita, R-RAIL-21 la fonte
della scelta sulle chiavi inerti. Il log citava come autorità voci che il registro non
conteneva: è la stessa trappola che ha prodotto l'hard stop del passo 4. (3) **R-RAIL-20
obbedita dal passo che la iscrive**: il report di discovery è stato committato a sé, prima dei
commit di registro. (4) **ROTAZIONE**: attivo da 20 a 21 con questa entry, poi la più vecchia
in archivio, quindi 20; archivio da 734 a 735. Progressivo del lotto ricavato dal preambolo
dell'archivio, non assunto da questo prompt.
**Prompt document name**: 2026-08-11 14:04
```

**Rotazione**, stesso metodo del passo 5:

1. Conta i blocchi `## ` del file attivo **dopo** l'aggiunta. Atteso: 21.
2. Tieni le 20 più recenti; sposta la più vecchia in coda all'archivio, **byte per byte**,
   senza riformattare nulla. Il taglio è posizionale.
3. Progressivo del lotto **ricavato dal preambolo dell'archivio**, che li numera in inglese:
   l'ultimo presente è l'undicesimo, quindi questo dovrebbe essere il dodicesimo. Non
   assumerlo: verificalo sul file. Se la numerazione risulta diversa, vince il file.
4. Conservazione: attivo 20, archivio 735, totale = totale precedente + 1. Se non torna, hard
   stop senza committare.

Il preambolo dell'archivio ha una riga vuota mancante fra il nono e il decimo paragrafo, svista
tipografica preesistente rilevata al passo 5. **Non normalizzarla.**

```bash
git add docs/claude-code-log.md docs/claude-code-log-archive.md
git commit -m "docs: log the R-RAIL register audit and rotate the oldest entry"
```

---

## 4. Gate

`npm run check:docs`, **eseguito da `frontend/`** → atteso **2/2, 0 warning**.

Build e typecheck non sono richiesti: nessun file sorgente nel diff.

---

## 5. Cosa NON fare

- Niente push, nessun force, nessun tag.
- Nessun file sorgente nel diff, in nessuno dei cinque commit.
- Non riscrivere, riordinare o «correggere» voci esistenti di `docs/decisions.md`. Le prose che
  citano 16, 18 e 22 restano identiche.
- Non toccare l'entry del log del 2026-08-11: la correzione della nota (15) vive nel campo
  `**Corregge**` della entry nuova, che è append-only per costruzione.
- Non riformattare il log o l'archivio, non normalizzare trattini o maiuscole.
- Non creare sezioni nuove in `docs/decisions.md`.
- Non toccare `.claude/settings.local.json` né `.git/info/exclude`.
- Non aprire il perimetro dell'arco 2 (identity block, palette entity, chip di firma, postura
  Browse/Focus).

---

## 6. Condizioni di hard stop

1. Il guard di §0 non torna, al netto della tolleranza dichiarata.
2. Una delle otto risulta già presente come voce definita in `docs/decisions.md`: non
   sovrascriverla, riportane il testo e fermati.
3. `docs/sessioni/claude_sessione_2026-08-10_4.md` non contiene una delle otto, o la contiene
   con un testo diverso da quello di §3.2.
4. La sezione «Arco rail destro — preset 2a» non risulta ordinata numericamente: in quel caso
   la regola di posizione di §3.2 non si applica, riporta l'ordine reale e chiedi.
5. `docs/TECH-DEBT.md` non esiste, o non contiene la voce di R-RAIL-25 da cui ricalcare il
   formato.
6. Il file attivo del log non è a 20 entry prima dell'aggiunta, o la conservazione dei
   conteggi non torna dopo la rotazione.
7. `check:docs` non è 2/2.
8. Stai girando sul bridge di Cowork invece che in locale.

In ogni caso di stop: riporta il rilievo, lo stato del working tree e cosa proponi. Non
committare lavoro parziale.

---

## 7. Definition of done

- Cinque commit sulla branch, nell'ordine 0, A, B, C, D.
- Working tree pulito.
- `docs/decisions.md` contiene R-RAIL-1..27 come voci definite, **senza lacune**.
- `docs/TECH-DEBT.md` contiene le due voci nuove.
- Log attivo a 20 entry, archivio a 735, conservazione verificata sui conteggi.
- `check:docs` 2/2, 0 warning.
- Niente pushato. Ahead di origin atteso: **10**.

Riporta in chat: sha dei cinque commit; l'elenco delle voci iscritte con la loro posizione
finale; conteggi del log prima e dopo; progressivo del lotto e da dove l'hai ricavato; esito di
`check:docs`; ahead di origin.

---

## 8. RIFERIMENTI

| Fonte | Contenuto rilevante |
|---|---|
| `docs/sessioni/claude_sessione_2026-08-10_4.md`, «Le ventisei ratifiche» | I testi verbatim delle otto voci |
| `2026-08-11_1245_prompt_passo5_chiusura_arco1.md` §1.B | L'elenco sbagliato da cui nasce l'audit |
| `2026-08-10_2000_prompt_rotazione_log.md` | Metodo di rotazione: conteggio, progressivo dall'archivio, conservazione |
| Prima entry di `docs/claude-code-log.md` | Formato reale dei campi, che `check:docs` valida |
| Voce di R-RAIL-25 in `docs/TECH-DEBT.md` | Formato da ricalcare per le due voci di backlog |
