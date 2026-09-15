# Arco 2, passo 1, Fase 1: R-RAIL-28 a norma e discovery su identity block e palette entity

**Nome del documento prompt**: 2026-08-11 16:29
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: docs più discovery. Quattro commit, **nessun file di codice nel diff**.
**Vincolo di chiusura**: **niente push**. Il task finisce al quarto commit e al report in chat.
**Ambiente**: Claude Code sul Mac. Non dal bridge di Cowork.

**Vincolo generale**: `CLAUDE.md` è la fonte di verità. Se questo prompt lo contraddice in un
punto non dichiarato in §5, segnala il conflitto invece di eseguirlo.

Questo prompt è **solo la Fase 1**. La Fase 2, che implementa l'identity block, arriva in un
prompt suo dopo che Alfonso ha deciso sulla palette. Non anticiparla.

Questo prompt è autocontenuto. Non ricostruire da memoria di sessione.

---

## 0. Guard di stato

```bash
git rev-parse --abbrev-ref HEAD
git log --oneline -2
git status --porcelain
git fetch --quiet origin alfonso-frontend-jjtl
git rev-list --left-right --count origin/alfonso-frontend-jjtl...HEAD
```

| Controllo | Atteso |
|---|---|
| branch | `alfonso-frontend-jjtl` |
| HEAD | `54154fd4a docs: log the R-RAIL register audit and rotate the oldest entry` |
| working tree | vuoto |
| ahead/behind | `0    0`: la branch è allineata a origin |

Il `git fetch` che precede il conteggio non è decorativo: senza, il confronto gira contro il
ref di tracking locale, che è fermo all'ultimo push fatto da questa macchina, e non può per
costruzione rilevare una spinta altrui. Un controllo che non può produrre il segnale che
dichiara non è un controllo.

Tolleranza dichiarata, per R-RAIL-27: `.claude/settings.local.json` non deve comparire, perché
sul Mac lo copre `~/.config/git/ignore`. Se compare, non sei sul Mac di Alfonso: fermati.

Se il numero di sinistra è diverso da zero, qualcuno ha spinto: fermati e riporta.

---

## 1. COSA

Quattro commit, in quest'ordine, poi il report in chat e stop.

| # | Contenuto | File |
|---|---|---|
| A | R-RAIL-28 come sotto-regola normativa | `CLAUDE.md`, più gli `AGENTS.md` rigenerati se il gate lo richiede |
| B | R-RAIL-28 a registro, voce puntatore di una riga | `docs/decisions.md` |
| C | Report di discovery della Fase 1 | `docs/discovery/discovery_2026-08-11_identity_block_palette.md` |
| D | Entry di log e rotazione | `docs/claude-code-log.md`, `docs/claude-code-log-archive.md` |

**Nessun file sotto `frontend/src/` nel diff.** La Fase 1 è di sola lettura sul codice.

---

## 2. DOVE

Nessun file oltre a quelli della tabella di §1, con la sola eccezione degli `AGENTS.md`
rigenerati dal gate, che entrano nel commit A. **Mai `git add .`**, in nessuna fase.

---

## 3. COME

### 3.1 Commit A: R-RAIL-28 in `CLAUDE.md`

**Perché in CLAUDE.md e non solo a registro.** `docs/decisions.md` è il verbale dell'arco;
`CLAUDE.md` è quello che Claude Code legge a inizio di ogni sessione. Una regola di metodo
iscritta solo nel verbale non si applica da sola: R-RAIL-20 ne è la prova, perché il report di
discovery del passo 6 è stato committato a sé grazie al prompt, non grazie al registro. Il
testo normativo sta quindi in un posto solo, qui, e il registro rimanda.

**Collocazione primaria**: **§5**, come quarta sotto-regola, dopo *«do not trust fixtures from
memory across sessions»*. Le tre sotto-regole già presenti sono della stessa famiglia
epistemica: verificare i consumatori prima di assumere che un output sia load-bearing, non
validare un sort leggendo il comparatore, non fidarsi di fixture ricordate. Questa è la quarta.

**Leggi la §5 per intero prima di scrivere.** Se risulta così legata ai bug visivi che una
regola generale sulle ricerche ci sta male, **fermati e chiedi**: il ripiego è una sezione
corta a sé, ma è una decisione di Alfonso, non tua.

Testo da inserire, in inglese come le sotto-regole vicine, ricalcandone la forma:

> **Sub-rule: an assertion of absence requires proof that the search ran**
>
> "Nothing found" and "the command never ran" produce identical output. A glob that failed to
> expand, a path that does not exist, a filter that excluded the answer, a read that stopped
> short of the relevant line: each returns a silence that reads exactly like a negative result.
>
> Before writing "X does not exist", "X is not used anywhere", or "X is not loaded", do one of:
>
> - check the exit status of the command that produced the silence, or
> - run a **positive control** on the same command: search for something you know is present.
>   If the control comes back empty, the search is broken, not the subject.
>
> A positive control is only a control if it has signal. `grep -rn "(a)" --include="*.md" .`
> at the repo root returns twenty lines of `node_modules` READMEs and answers nothing;
> `--exclude-dir=node_modules` is what turns it into a search. The same applies to partial
> reads: a count taken over lines 1-62 of a 157-line file is a count over that window, and must
> be reported as such or not reported at all.

**Gate obbligatorio su questo commit**, da `frontend/`:

```bash
npm run check:agents
```

Se è rosso, gira `npm run gen:agents` e **includi i file rigenerati nello stesso commit A**.
Non editare mai a mano un `AGENTS.md`.

```bash
git add CLAUDE.md          # più gli AGENTS.md rigenerati, se ce ne sono
git commit -m "docs: require proof that a search ran before asserting absence"
```

### 3.2 Commit B: R-RAIL-28 a registro, senza duplicare il testo

Posizione: in coda alle R-RAIL, dopo R-RAIL-27, nella stessa sezione «Arco rail destro
— preset 2a». Ricalca la forma delle voci vicine.

> - **R-RAIL-28** (2026-08-11) — Un'asserzione di assenza vale solo se la ricerca che la
>   sostiene è provata: exit status verificato, oppure un controllo positivo con segnale sullo
>   stesso comando. **Testo normativo in `CLAUDE.md` §5**, sotto-regola «an assertion of absence
>   requires proof that the search ran»: qui non si duplica, per non creare la solita coppia
>   che diverge. Ratificata dopo quattro occorrenze in due giorni.

```bash
git add docs/decisions.md
git commit -m "docs: register R-RAIL-28 pointing at the CLAUDE.md rule"
```

### 3.3 Fase 1: discovery, sola lettura sul codice

**R-RAIL-28 è in vigore da qui.** Ogni affermazione di assenza in questo report porta il suo
controllo positivo, scritto nel report accanto al risultato. Nessuna eccezione: è la prima
applicazione della regola appena iscritta.

**Obiettivo**: mettere Alfonso in condizione di decidere quale palette entity vince, e dire
cosa costa ciascuna delle due direzioni. La discovery **non decide**.

Cosa deve contenere il report, punto per punto:

1. **Le due palette affiancate.** Il pannello colora i badge da
   `frontend/src/styles/components/_form-system.scss`, intorno a `:1251-1259`, con nove
   modificatori `.jj-type-badge--*` a esadecimali inline. Il tree li colora da
   `frontend/src/common/entityMeta.ts`. Tabella kind per kind con i **valori esatti**, light e
   dark, e path più riga di ogni sorgente. È noto che in light nessuno dei quattro kind
   coincide e che **attribute ed enum sono invertiti**: verificalo, non darlo per buono, e
   riporta i numeri.

2. **Chi consuma cosa.** Grep globale, con `--exclude-dir=node_modules`, per ogni sito che
   legge `.jj-type-badge` e per ogni sito che importa da `entityMeta.ts`. Consumatori già noti:
   `Info` e `frontend/src/components/editors/views/ViewData.tsx:221`. Attesa: che ce ne siano
   altri. `getElementTypeInfo` restituisce solo il nome di classe, non un colore: confermalo.

3. **Il costo delle due direzioni.** Se vince la palette del pannello, quanti siti cambiano e
   quali superfici si vedono diverse a video. Se vince quella del tree, idem. Conta i siti, non
   stimarli.

4. **Esistono già token entity?** In `frontend/src/styles/tokens/` cerca variabili per i kind
   entity, in `_colors-light.scss` e `_colors-dark.scss`. R-RAIL-25 parla di «migrazione ai
   token entity», quindi potrebbero esistere già, o essere solo previsti. Riporta quale dei
   due, con la prova.

5. **Stato di `PropertiesHeader`.** Dove sta, cosa rende oggi nel ramo model element, quali
   classi usa, e cosa comporterebbe «restilarlo in loco» secondo R-RAIL-16, che R-RAIL-26 ha
   superato per il solo arco 1. Non proporre un design: descrivi cosa c'è.

6. **Vincoli rilevati.** `_form-system.scss` è globale: al passo 3 dell'arco 1 fu una
   condizione di stop, e resta intoccabile senza discussione. `CLAUDE.md` §7.2 vieta di
   definire variabili CSS nei file di componente e impone di aggiungere ogni token nuovo sia in
   light sia in dark. Riporta ogni altro vincolo che incontri.

7. **Critical zone.** Verifica se qualcuno dei file toccati dalla futura Fase 2 compare in
   `CLAUDE.md` §3.1. Se sì, dillo nel report: la Fase 2 richiederà un Layer Impact Report.

**Domande aperte per Alfonso**: chiudile con la domanda della palette formulata in modo che si
possa rispondere con una riga.

### 3.4 Commit C: il report

Percorso e nome: `docs/discovery/discovery_2026-08-11_identity_block_palette.md`.
Struttura minima: obiettivo, file letti con path completi, findings, dipendenze e rischi,
domande aperte. Il report si committa **a sé**, per R-RAIL-20.

```bash
git add docs/discovery/discovery_2026-08-11_identity_block_palette.md
git commit -m "docs: add discovery report on identity block and entity palettes"
```

### 3.5 Commit D: entry di log e rotazione

Formato: quello reale del file. Campi nell'ordine `**Prompt**`, `**Files touched**`,
`**Outcome**`, `**Corregge**`, `**Causa**`, `**Regressions**`, `**Out-of-scope changes**`,
`**Layer Impact Report**`, `**Smoke visivo**`, `**Notes**`, `**Prompt document name**`. Entry
nuova **in testa**.

Valori vincolati dal gate, da rispettare alla lettera:

- `**Corregge**`: sentinella `—`. Questo task non rimedia a nessun prompt precedente. Il gate
  accetta solo la sentinella o un prefisso `YYYY-MM-DD HH:mm`.
- `**Causa**`: sentinella `—`. Si compila solo se l'esito è ⚠️ o ❌, oppure se `Corregge` è
  compilato. Se l'esito è diverso da ✅, usa **una sola lettera** dalla tassonomia di
  `CLAUDE.md` §21.3, quella prevalente, in forma parentesizzata.
- `**Smoke visivo**`: `non applicabile`. Nessuna superficie toccata.
- `**Layer Impact Report**`: `not-required`, salvo che il punto 7 della discovery dica il
  contrario.

Nelle `**Notes**` riporta almeno: che il testo di R-RAIL-28 vive in un posto solo e il registro
rimanda; l'esito di `check:agents` e se ha richiesto la rigenerazione; il fatto che la
discovery è la prima ad applicare R-RAIL-28 con controlli positivi espliciti.

**Rotazione**, stesso metodo dei due passi precedenti:

1. Conta i blocchi `## ` del file attivo dopo l'aggiunta. Atteso: 21.
2. Tieni le 20 più recenti; sposta la più vecchia in coda all'archivio, **byte per byte**. Il
   taglio è posizionale.
3. Progressivo del lotto **ricavato dal preambolo dell'archivio**: l'ultimo presente è il
   dodicesimo, quindi questo dovrebbe essere il tredicesimo. Verificalo sul file; se la
   numerazione risulta diversa, vince il file.
4. Conservazione: attivo 20, archivio 736, totale = precedente + 1. Se non torna, hard stop
   senza committare.

Il preambolo dell'archivio ha una riga vuota mancante fra il nono e il decimo paragrafo, svista
preesistente. **Non normalizzarla.**

```bash
git add docs/claude-code-log.md docs/claude-code-log-archive.md
git commit -m "docs: log R-RAIL-28 and the identity block discovery"
```

---

## 4. Gate

Da `frontend/`:

| Comando | Atteso | Quando |
|---|---|---|
| `npm run check:agents` | verde | obbligatorio, commit A tocca `CLAUDE.md` |
| `npm run check:docs` | 2/2, 0 warning | obbligatorio, a fine task |

Build e typecheck non sono richiesti: nessun file sorgente nel diff.

---

## 5. Cosa NON fare

- Niente push, nessun force, nessun tag.
- **Nessun file sotto `frontend/src/` nel diff.** La Fase 1 legge il codice, non lo tocca.
- Non implementare l'identity block, non toccare `_form-system.scss`, non toccare
  `entityMeta.ts`, non creare token entity. Sono Fase 2, e la Fase 2 non è autorizzata.
- Non decidere la palette. La discovery espone il costo delle due direzioni e si ferma.
- Non duplicare in `docs/decisions.md` il testo della regola: la voce è un puntatore.
- Non editare a mano nessun `AGENTS.md`.
- Non riscrivere voci esistenti di `docs/decisions.md`, non riformattare log o archivio, non
  normalizzare trattini.
- Non toccare `.claude/settings.local.json` né `.git/info/exclude`.

---

## 6. Condizioni di hard stop

1. Il guard di §0 non torna, al netto della tolleranza dichiarata.
2. La §5 di `CLAUDE.md` risulta inadatta a ospitare una regola generale sulle ricerche: riporta
   perché e proponi, non decidere.
3. `docs/decisions.md` contiene già una voce R-RAIL-28: non sovrascriverla, riportane il testo
   e fermati.
4. `check:agents` resta rosso anche dopo `gen:agents`.
5. La discovery incontra un file di `CLAUDE.md` §3.1: non è uno stop del task, ma va dichiarato
   nel report e nel campo `**Layer Impact Report**`.
6. Il file attivo del log non è a 20 entry prima dell'aggiunta, o la conservazione non torna.
7. `check:docs` non è 2/2.
8. Stai girando sul bridge di Cowork invece che in locale.

In ogni caso di stop: riporta il rilievo, lo stato del working tree e cosa proponi. Non
committare lavoro parziale.

---

## 7. Definition of done

- Quattro commit, nell'ordine A, B, C, D.
- Working tree pulito, nessun file sotto `frontend/src/` toccato.
- `CLAUDE.md` porta la sotto-regola; `docs/decisions.md` porta R-RAIL-28 come puntatore.
- Il report di discovery esiste e risponde ai sette punti di §3.3, con un controllo positivo
  accanto a ogni affermazione di assenza.
- `check:agents` verde, `check:docs` 2/2 con 0 warning.
- Log attivo a 20, archivio a 736, conservazione verificata.
- Niente pushato.

Riporta in chat: sha dei quattro commit; se `check:agents` ha richiesto la rigenerazione e
quali file ha toccato; **la tabella delle due palette affiancate**, che è il cuore della
decisione; il conteggio dei consumatori per ciascuna delle due sorgenti; il costo delle due
direzioni; e la domanda sulla palette formulata in una riga.

---

## 8. RIFERIMENTI

| Fonte | Contenuto rilevante |
|---|---|
| `CLAUDE.md` §5 | Le tre sotto-regole epistemiche accanto a cui va la quarta |
| `CLAUDE.md` §7.2 | Token: sorgente unica, sempre light più dark, mai variabili nei componenti |
| `CLAUDE.md` §17 | I gate `check:agents` e `check:docs`, e la regola sulla rigenerazione |
| `CLAUDE.md` §21.3 | Tassonomia di `Causa`, se l'esito non è ✅ |
| `CLAUDE.md` §3.1 | Elenco della critical zone, per il punto 7 della discovery |
| `docs/decisions.md`, R-RAIL-25 e R-RAIL-26 | Backlog della palette e rimando dell'identity block all'arco 2 |
| `2026-08-10_2000_prompt_rotazione_log.md` | Metodo di rotazione |
