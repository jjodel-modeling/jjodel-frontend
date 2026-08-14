# Arco 2, passo 2: R-RAIL-29 corretta, R-RAIL-30, e la scala entity a sorgente unica

**Nome del documento prompt**: 2026-08-11 17:21
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: docs più codice. Cinque commit, due stop visivi obbligatori.
**Vincolo di chiusura**: **niente push**. Il task finisce al quinto commit e al report in chat.
**Ambiente**: Claude Code sul Mac. Non dal bridge di Cowork.

**Vincolo generale**: `CLAUDE.md` è la fonte di verità. Se questo prompt lo contraddice in un
punto non dichiarato in §6, segnala il conflitto invece di eseguirlo.

Questo prompt è autocontenuto. Non ricostruire da memoria di sessione.

---

## 0. Guard di stato

```bash
git rev-parse --abbrev-ref HEAD
git log --oneline -1
git status --porcelain
git fetch --quiet origin alfonso-frontend-jjtl
git rev-list --left-right --count origin/alfonso-frontend-jjtl...HEAD
```

| Controllo | Atteso |
|---|---|
| branch | `alfonso-frontend-jjtl` |
| HEAD | `7decf84d2`, l'entry di log del passo 1 |
| working tree | vuoto |
| ahead/behind | `0    4`: quattro commit locali non pushati, nessuno remoto nuovo |

Tolleranza dichiarata, per R-RAIL-27: `.claude/settings.local.json` non deve comparire, perché
sul Mac lo copre `~/.config/git/ignore`. Se compare, non sei sul Mac di Alfonso: fermati.

Se il numero di sinistra è diverso da zero, qualcuno ha spinto: fermati e riporta.

---

## 1. COSA

Cinque commit, in quest'ordine.

| # | Contenuto | File |
|---|---|---|
| A | R-RAIL-29 corretta a norma, R-RAIL-29 e R-RAIL-30 a registro | `CLAUDE.md`, `docs/decisions.md`, più `AGENTS.md` rigenerati se il gate lo richiede |
| B | La scala entity a token, light e dark, e i due orfani rimossi | `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss` |
| C | Consumatori del pannello e della navbar | `frontend/src/styles/components/_form-system.scss`, `nestedView.scss`, `constants/documentTypes.ts` |
| D | Esadecimali residui in `entityMeta.ts` portati a token | `frontend/src/common/entityMeta.ts` |
| E | Entry di log e rotazione | `docs/claude-code-log.md`, `docs/claude-code-log-archive.md` |

**Stop visivo obbligatorio dopo B e dopo D.** Vedi §5.

---

## 2. DOVE

Nessun file oltre a quelli della tabella di §1, con la sola eccezione degli `AGENTS.md`
rigenerati dal gate, che entrano nel commit A. **Mai `git add .`**, in nessuna fase.

Se un file della tabella risulta avere un path diverso da quello scritto qui, fermati e
riporta: non cercarne uno somigliante.

---

## 3. COME

### 3.1 Commit A, parte 1: correzione del titolo di R-RAIL-29 in `CLAUDE.md` §5

La sotto-regola aggiunta al passo 1 resta. Questa ne è una **seconda**, e corregge un bersaglio
sbagliato prima che qualcuno lo insegua: `command grep` su questo Mac non è GNU grep ma BSD grep
2.6.0-FreeBSD, che `--include` e `--exclude-dir` li onora davvero. Il consiglio operativo era
giusto, la ragione no.

Collocazione: `CLAUDE.md` §5, subito dopo la sotto-regola sull'asserzione di assenza.

> **Sub-rule: the interactive `grep` is not the system `grep`**
>
> In an interactive shell here, `grep` resolves to a wrapper around `ugrep --ignore-files`. Two
> consequences, both measured:
>
> - Gitignored paths are skipped by default. `--exclude-dir=node_modules` is a no-op, and a
>   search for something that lives under an ignored path returns a silence that is not
>   evidence.
> - `--include=<glob>` does not filter. ugrep reads it as a file name and warns. Searches
>   written that way are wider than declared, not narrower.
>
> `command grep` bypasses the wrapper and resolves to BSD grep 2.6.0-FreeBSD, which honours
> both flags. Use it when those flags carry the meaning of the search. Do not go looking for
> GNU grep: it is not installed here.
>
> A search scope written into a prompt is a claim about what the command does. If the command
> does something else, the scope was never enforced.

**In questo task, ogni ricerca usa `command grep`.**

### 3.2 Commit A, parte 2: le due voci a registro

In coda alle R-RAIL, dopo R-RAIL-28, nella sezione «Arco rail destro — preset 2a».

> - **R-RAIL-29** (2026-08-11) — L'`grep` interattivo di questa macchina è un wrapper di
>   `ugrep --ignore-files`: `--exclude-dir` è inerte e `--include` non filtra. `command grep`
>   risolve a BSD grep, che li onora entrambi. Testo normativo in `CLAUDE.md` §5, sotto-regola
>   «the interactive grep is not the system grep». Corollario retroattivo: chi cita una vecchia
>   asserzione di assenza come autorità la rifà prima di citarla.
>
> - **R-RAIL-30** (2026-08-11) — La scala entity ha **una sorgente sola**, i token in
>   `_colors-light.scss` e `_colors-dark.scss`, generata in OKLCH a chiarezza e croma fissi:
>   cinque tinte cromatiche equispaziate a 59.6 gradi, banda cyan 210-250 esclusa perché
>   prenotata dalla selezione, e una coppia neutra slate per la famiglia dei contenitori. Le
>   sotto-entità prendono la tinta del genitore a croma ridotto. Sedici kind mappano su **nove
>   coppie**; la mappatura vive nei file di token come alias, non si duplica altrove e non si
>   ricopia a registro. Contrasto minimo misurato 5.96, su sedici kind e due temi.

```bash
npm run check:agents   # da frontend/; se rosso, npm run gen:agents e includi i rigenerati
git add CLAUDE.md docs/decisions.md   # più gli AGENTS.md rigenerati, se ce ne sono
git commit -m "docs: correct the grep sub-rule and register R-RAIL-29 and R-RAIL-30"
```

### 3.3 Commit B: i token

Nel blocco entity di `_colors-light.scss` (oggi `:332-355`) e nel blocco gemello di
`_colors-dark.scss`. **Sostituisci i valori delle nove coppie esistenti e aggiungi le nuove.**
Non cambiare la posizione del blocco, non riordinare le righe esistenti, non cambiare il
formato dei commenti già presenti.

Nove coppie canoniche, otto alias. I nomi già in vigore restano tutti: i consumatori di
`properties-with-tree-view.scss:1407-1413` e `tree-view-sidebar.scss:1482-1483` non si toccano
in questo commit e devono continuare a risolvere.

**Light**, in `_colors-light.scss`:

```scss
/* canoniche */
--color-entity-container-bg: #E2EAF5;   --color-entity-container-fg: #45566F;
--color-entity-class-bg: #FCE1EA;       --color-entity-class-fg: #7A4056;
--color-entity-object-bg: #F4E5EA;      --color-entity-object-fg: #6B4B56;
--color-entity-enum-bg: #FBE5D6;        --color-entity-enum-fg: #794821;
--color-entity-literal-bg: #F3E7DF;     --color-entity-literal-fg: #6A4F3C;
--color-entity-attribute-bg: #D5F1E8;   --color-entity-attribute-fg: #006453;
--color-entity-parameter-bg: #DEEDE9;   --color-entity-parameter-fg: #385E54;
--color-entity-reference-bg: #E8ECD5;   --color-entity-reference-fg: #535B1D;
--color-entity-operation-bg: #EBE6FC;   --color-entity-operation-fg: #5A4A7F;

/* alias: sei contenitori, la classe astratta, il tipo di dato */
--color-entity-metamodel-bg: var(--color-entity-container-bg);         --color-entity-metamodel-fg: var(--color-entity-container-fg);
--color-entity-model-bg: var(--color-entity-container-bg);             --color-entity-model-fg: var(--color-entity-container-fg);
--color-entity-package-bg: var(--color-entity-container-bg);           --color-entity-package-fg: var(--color-entity-container-fg);
--color-entity-viewpoint-bg: var(--color-entity-container-bg);         --color-entity-viewpoint-fg: var(--color-entity-container-fg);
--color-entity-transformation-bg: var(--color-entity-container-bg);    --color-entity-transformation-fg: var(--color-entity-container-fg);
--color-entity-view-bg: var(--color-entity-container-bg);              --color-entity-view-fg: var(--color-entity-container-fg);
--color-entity-abstract-class-bg: var(--color-entity-class-bg);        --color-entity-abstract-class-fg: var(--color-entity-class-fg);
--color-entity-data-type-bg: var(--color-entity-parameter-bg);         --color-entity-data-type-fg: var(--color-entity-parameter-fg);
```

**Dark**, in `_colors-dark.scss`, stessi nomi e stessi alias, valori canonici diversi:

```scss
--color-entity-container-bg: #242E3D;   --color-entity-container-fg: #BBCEE8;
--color-entity-class-bg: #44212E;       --color-entity-class-fg: #F6B8CD;
--color-entity-object-bg: #3B272E;      --color-entity-object-fg: #E4C1CD;
--color-entity-enum-bg: #43260F;        --color-entity-enum-fg: #F4C09C;
--color-entity-literal-bg: #3A2A1F;     --color-entity-literal-fg: #E3C6B2;
--color-entity-attribute-bg: #01372C;   --color-entity-attribute-fg: #95DDCA;
--color-entity-parameter-bg: #1C332D;   --color-entity-parameter-fg: #B0D6CB;
--color-entity-reference-bg: #2D310C;   --color-entity-reference-fg: #C9D399;
--color-entity-operation-bg: #312746;   --color-entity-operation-fg: #D1C2F9;
```

Gli otto alias del dark sono identici a quelli del light, riga per riga: puntano ai nomi
canonici, non ai valori.

**Verifica del casing, prima di scrivere.** I due nomi nuovi in kebab-case
(`abstract-class`, `data-type`) valgono solo se nessun codice costruisce il nome del token per
interpolazione dal valore di `EntityType`.

```bash
command grep -rn "color-entity-" frontend/src --include=*.ts --include=*.tsx
```

Se trovi una template string tipo `` `--color-entity-${type}-bg` ``, allora i nomi devono
seguire **esattamente** il casing dei valori di `EntityType`, quindi `abstractClass` e
`dataType`, non le forme kebab. In quel caso usa il casing dell'enum e dichiaralo nel report.
Se non trovi interpolazioni, usa il kebab come scritto sopra.

**I due orfani.** `--color-entity-viewpoint-saturated` e `--color-entity-model-saturated`
vengono rimossi, in light e in dark. `CLAUDE.md` vieta di rimuovere codice apparentemente
inutilizzato senza mandato: **questo prompt è il mandato**, ed è subordinato a una
riverifica che devi fare tu, non fidandoti della mia:

```bash
command grep -rn "entity-viewpoint-saturated\|entity-model-saturated" frontend/src
command grep -rln "saturated" frontend/src        # controllo positivo: il termine è cercabile
```

La prima deve restituire solo le righe dei due file di token. La seconda deve restituire
almeno un file: se restituisce zero, la ricerca è rotta e non hai provato niente, quindi
**non rimuovere nulla** e riporta. Se la prima trova un consumatore vero, non rimuovere e
riporta.

```bash
git add frontend/src/styles/tokens/_colors-light.scss frontend/src/styles/tokens/_colors-dark.scss
git commit -m "feat: regenerate the entity color scale from a single source"
```

### 3.4 Stop visivo, primo

**Fermati qui e riporta.** Dopo il commit B il tree e il pannello cambiano colore da soli,
perché consumano i nomi già in vigore. È la verifica più informativa del task e la fa Alfonso,
non tu. Riporta cosa ti aspetti che cambi e aspetta il via prima di procedere a C.

### 3.5 Commit C: i consumatori del pannello e della navbar

Tre file, tre interventi, tutti di sola sostituzione di valore.

1. **`_form-system.scss`, intorno a `:1251-1259`.** I nove modificatori `.jj-type-badge--*`
   passano da esadecimali inline a `var(--color-entity-<kind>-bg)` e
   `var(--color-entity-<kind>-fg)`. **Solo i valori**: non toccare i selettori, non aggiungere
   regole, non toccare `:1242-1249` dove stanno `text-transform`, `font-size` e
   `letter-spacing`. Il foglio è globale ed è stato una condizione di stop al passo 3: R-RAIL-30
   autorizza questa modifica e nient'altro dentro questo file.

2. **`nestedView.scss:3709`**, il badge `view`, alla stessa maniera, su
   `--color-entity-view-bg` e `--color-entity-view-fg`.

3. **`constants/documentTypes.ts`.** I campi `badgeBg` e `badgeColor` passano da esadecimale
   alla stringa `var(--color-entity-<kind>-bg)` e `var(--color-entity-<kind>-fg)`. Restano
   stringhe e restano consumati come oggi da `Navbar.tsx:290` nello `style` inline: `var()`
   dentro uno style inline si risolve normalmente. Non cambiare il tipo `DocumentTypeEntry`,
   non cambiare i nomi dei campi, non toccare `Navbar.tsx`.

Se un kind presente in `documentTypes.ts` non ha un token corrispondente fra i sedici nomi,
**fermati e riporta**: significa che l'inventario dei kind era incompleto e la mappatura va
decisa in chat, non qui.

```bash
git add frontend/src/styles/components/_form-system.scss frontend/src/styles/components/nestedView.scss frontend/src/constants/documentTypes.ts
git commit -m "refactor: read entity badge colors from tokens in panel and navbar"
```

I path esatti di `nestedView.scss` e `documentTypes.ts` verificali prima con
`command grep -rn "badgeBg" frontend/src` e con una `find`: quelli scritti qui sono ricostruiti
dal report, non letti da me.

### 3.6 Commit D: gli esadecimali residui di `entityMeta.ts`

**Prima leggi, poi decidi se toccare.** Il report del passo 1 dice che l'unico importatore di
`entityMeta.ts` prende `resolveEntityType` e i metadati, non i colori, e insieme registra
esadecimali propri per `object` `#CCFBF1 / #0D9488`, `transformation` `#E1F5EE / #0F6E56` e
`parameter` `#F1F5F9 / #475569`. Le due cose stanno insieme solo se quegli esadecimali sono
morti o consumati per un'altra via.

```bash
command grep -rn "entityMeta" frontend/src
command grep -rn "#CCFBF1\|#0D9488\|#E1F5EE\|#0F6E56" frontend/src
```

- Se gli esadecimali sono **consumati** e la sostituzione è meccanica, portali a
  `var(--color-entity-<kind>-bg)` e `-fg`, senza cambiare la forma della struttura dati.
- Se risultano **non consumati**, non rimuoverli: questo prompt non è mandato per quello.
  Scrivilo nel report e proponi una voce di `TECH-DEBT.md` per il passo successivo.
- Se il consumo passa da una via che non avevo previsto, **fermati e riporta**.

```bash
git add frontend/src/common/entityMeta.ts
git commit -m "refactor: read entity colors from tokens in entityMeta"
```

Se il commit D risulta vuoto perché non c'era nulla da cambiare, **saltalo** e dillo nel
report. Non fabbricare una modifica per riempire la tabella.

### 3.7 Stop visivo, secondo

**Fermati e riporta.** Superfici da guardare: i badge del pannello properties, i badge del
tree, il menu «New document» della navbar, il badge `view`. Aspetta il via prima di scrivere il
log.

### 3.8 Commit E: entry di log e rotazione

Formato: quello reale del file. Campi nell'ordine `**Prompt**`, `**Files touched**`,
`**Outcome**`, `**Corregge**`, `**Causa**`, `**Regressions**`, `**Out-of-scope changes**`,
`**Layer Impact Report**`, `**Smoke visivo**`, `**Notes**`, `**Prompt document name**`. Entry
nuova in testa.

- `**Corregge**`: `2026-08-11 16:29 — il titolo della sotto-regola sul grep puntava a GNU grep;
  command grep qui è BSD grep`. Il gate accetta solo la sentinella o un prefisso
  `YYYY-MM-DD HH:mm`, e questa entry corregge davvero il prompt precedente.
- `**Causa**`: `(c)`, discovery insufficiente o assunzione sbagliata sul codice esistente. Una
  sola lettera, per `CLAUDE.md` §21.3.
- `**Smoke visivo**`: gli esiti dei due stop di §3.4 e §3.7.
- `**Layer Impact Report**`: `not-required`, salvo che uno dei file toccati compaia in
  `CLAUDE.md` §3.1. Verificalo, non assumerlo.

Nelle `**Notes**`: la mappatura sedici kind su nove coppie e dove vive; l'esito della verifica
del casing di §3.3; se i due orfani sono stati rimossi o no e perché; se il commit D è stato
saltato.

**Rotazione**, stesso metodo dei passi precedenti:

1. Conta i blocchi `## ` del file attivo dopo l'aggiunta. Atteso: 21.
2. Tieni le 20 più recenti, sposta la più vecchia in coda all'archivio byte per byte.
3. Progressivo del lotto ricavato dal preambolo dell'archivio: l'ultimo è il tredicesimo,
   quindi questo è il quattordicesimo. Se il file dice altro, vince il file.
4. Conservazione: attivo 20, archivio 737, totale = precedente + 1. Se non torna, hard stop.

Il preambolo dell'archivio ha una riga vuota mancante fra il nono e il decimo paragrafo, svista
preesistente. **Non normalizzarla.**

```bash
git add docs/claude-code-log.md docs/claude-code-log-archive.md
git commit -m "docs: log the entity scale unification"
```

---

## 4. Gate

Da `frontend/`:

| Comando | Atteso | Quando |
|---|---|---|
| `npm run check:agents` | verde | commit A, che tocca `CLAUDE.md` |
| `npm run typecheck` | verde | dopo C e dopo D |
| `npm run build` | verde | dopo D |
| `npm run check:docs` | 2/2, 0 warning | a fine task |

---

## 5. Gli stop visivi

Due, non negoziabili, entrambi con hard stop e attesa del via. Il primo dopo B, il secondo dopo
D. Non accorparli e non proseguire per iniziativa tua: il colore è l'unica cosa in questo task
che nessun gate può validare.

---

## 6. Cosa NON fare

- Niente push, nessun force, nessun tag.
- Non toccare `properties-with-tree-view.scss` né `tree-view-sidebar.scss`: consumano i nomi
  esistenti e devono continuare a funzionare senza modifiche. Se non funzionano, è un bug della
  mappatura, non un invito a editarli.
- Non toccare `Navbar.tsx`, `Info.tsx`, `ViewData.tsx`, `ElementBadge.tsx`, `PropertiesHeader`.
- In `_form-system.scss`, niente oltre i nove valori dei modificatori.
- Non rinominare nessun token esistente, non cambiare il tipo `DocumentTypeEntry`.
- Non introdurre una decima coppia canonica. Se un kind non ha casa, fermati e chiedi.
- Non normalizzare formattazione, trattini, ordine delle righe nei file toccati.
- Non editare a mano nessun `AGENTS.md`.

---

## 7. Condizioni di hard stop

1. Il guard di §0 non torna, al netto della tolleranza dichiarata.
2. `docs/decisions.md` contiene già una R-RAIL-29 o una R-RAIL-30.
3. `check:agents` resta rosso dopo `gen:agents`.
4. La verifica del casing di §3.3 trova interpolazione: non è uno stop del task, ma il casing
   cambia e va dichiarato.
5. Il controllo positivo su `saturated` restituisce zero file: la ricerca è rotta, non rimuovere
   niente.
6. Un kind di `documentTypes.ts` senza token corrispondente.
7. Il consumo dei colori in `entityMeta.ts` non è quello descritto in §3.6.
8. `typecheck` o `build` rossi dopo C o dopo D.
9. Il file attivo del log non è a 20 entry prima dell'aggiunta, o la conservazione non torna.
10. Uno dei file toccati compare in `CLAUDE.md` §3.1: serve il Layer Impact Report prima di
    committare.
11. Stai girando sul bridge di Cowork invece che in locale.

In ogni caso di stop: riporta il rilievo, lo stato del working tree e cosa proponi. Non
committare lavoro parziale.

---

## 8. Definition of done

- Cinque commit, nell'ordine A, B, C, D, E, salvo D saltato e dichiarato.
- Due stop visivi rispettati, con il via di Alfonso in mezzo.
- Nove coppie canoniche e otto alias in entrambi i file di token; nessun nome esistente perduto.
- Nessun esadecimale entity residuo nei consumatori toccati.
- `check:agents`, `typecheck`, `build` verdi; `check:docs` 2/2 con 0 warning.
- Log attivo a 20, archivio a 737, conservazione verificata.
- Niente pushato.

Riporta in chat: sha dei commit; l'esito della verifica del casing; se i due orfani sono morti;
se il commit D è avvenuto o è stato saltato e perché; e la lista dei kind che dopo questo passo
non hanno più un colore proprio, che è il costo dichiarato della scala e va visto scritto.

---

## 9. RIFERIMENTI

| Fonte | Contenuto rilevante |
|---|---|
| `2026-08-11_memo_ratifica_arco2_scala_entity.md` | Metodo di generazione della scala, ratificato |
| `CLAUDE.md` §5 | Le sotto-regole epistemiche, dove va la correzione |
| `CLAUDE.md` §7.2 | Token: sorgente unica, sempre light più dark |
| `CLAUDE.md` §3.1 | Critical zone, da verificare per il campo Layer Impact Report |
| `CLAUDE.md` §21.3 | Tassonomia di `Causa` |
| `docs/discovery/discovery_2026-08-11_identity_block_palette.md` | Inventario dei kind e dei consumatori |
| `2026-08-10_2000_prompt_rotazione_log.md` | Metodo di rotazione |
