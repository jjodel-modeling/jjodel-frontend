# Arco 2, passo 2, ripresa: commit C, D, E

**Nome del documento prompt**: 2026-08-11 17:34
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: codice più docs. Tre commit, uno stop condizionale.
**Vincolo di chiusura**: **niente push**. Il task finisce al terzo commit e al report in chat.
**Ambiente**: Claude Code sul Mac. Non dal bridge di Cowork.

**Che cosa è già fatto.** I commit A e B del passo 2 sono in `f8a680db9` e `30f5e1855`. Il
primo stop visivo è stato superato: le tre superfici attese sono cambiate, nessun'altra si è
mossa. Questo prompt riprende da lì e **sostituisce** i §3.5, §3.6 e §3.8 del prompt
`2026-08-11 17:21`, che restano validi nella sostanza ma avevano due comandi scritti male.

**Vincolo generale**: `CLAUDE.md` è la fonte di verità. Se questo prompt lo contraddice in un
punto non dichiarato in §5, segnala il conflitto invece di eseguirlo.

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
| HEAD | `30f5e1855`, il commit B dei token |
| working tree | vuoto |
| ahead/behind | `0    6`: sei commit locali non pushati |

Tolleranza dichiarata, per R-RAIL-27: `.claude/settings.local.json` non deve comparire, perché
sul Mac lo copre `~/.config/git/ignore`. Se compare, non sei sul Mac di Alfonso: fermati.

---

## 0-bis. Come si scrivono i comandi in questo task

Due errata rispetto al prompt precedente, entrambe da rispettare qui e da citare nelle `Notes`
del log:

1. **Ogni glob va quotato.** `--include="*.ts"`, mai `--include=*.ts`. In zsh un glob nudo che
   non espande fa fallire il comando con `no matches found`, e il comando non gira affatto:
   silenzio che si legge come risultato negativo. È la trappola di R-RAIL-28, ed era dentro il
   prompt che iscriveva R-RAIL-29.
2. **Le alternanze usano `-E` con barre nude.** `command grep -rnE "A|B|C"`, mai `"A\|B\|C"`,
   che è sintassi GNU in espressione regolare di base e su BSD grep non è garantita.

Come da R-RAIL-29, ogni ricerca di questo task usa `command grep`.

---

## 1. COSA

| # | Contenuto | File |
|---|---|---|
| C | Consumatori del pannello e della navbar portati a token | `_form-system.scss`, `nestedView.scss`, `constants/documentTypes.ts` |
| D | Esadecimali residui di `entityMeta.ts` portati a token | `frontend/src/common/entityMeta.ts` |
| E | Entry di log del passo 2 intero, e rotazione | `docs/claude-code-log.md`, `docs/claude-code-log-archive.md` |

---

## 2. DOVE

Nessun file oltre a quelli della tabella. **Mai `git add .`**, in nessuna fase.

I path esatti di `nestedView.scss` e `documentTypes.ts` sono ricostruiti dal report, non letti
da me. Verificali prima di aprirli:

```bash
command grep -rn "badgeBg" frontend/src
command grep -rn "jj-type-badge--" frontend/src --include="*.scss"
```

Se un path reale differisce da quello scritto qui, usa quello reale e dichiaralo nel report. Se
non trovi affatto uno dei due, fermati: non cercare un file somigliante.

---

## 3. COME

### 3.1 Commit C: pannello, badge view, navbar

Tre interventi, tutti di sola sostituzione di valore. Nessun selettore nuovo, nessuna regola
nuova, nessuna proprietà nuova.

**1. `_form-system.scss`, intorno a `:1251-1259`.** I nove modificatori `.jj-type-badge--*`
passano da esadecimale inline a `var(--color-entity-<kind>-bg)` e `var(--color-entity-<kind>-fg)`.

La mappatura si ricava dal nome del modificatore: `.jj-type-badge--metamodel` consuma
`--color-entity-metamodel-*`, e così per gli altri otto. **Non tradurre, non interpretare, non
accorpare.** Se il kind di un modificatore non compare fra i sedici nomi definiti al commit B,
**fermati e riporta**: significa che l'inventario dei kind era incompleto, e la mappatura si
decide in chat.

Non toccare `:1242-1249`, dove stanno `text-transform`, `font-size` e `letter-spacing`. Il
foglio è globale ed è stato una condizione di stop al passo 3: R-RAIL-30 autorizza questa
sostituzione di valori e nient'altro dentro questo file.

**2. `nestedView.scss`, intorno a `:3709`**, il badge `view`, su `--color-entity-view-bg` e
`--color-entity-view-fg`.

**3. `constants/documentTypes.ts`.** I campi `badgeBg` e `badgeColor` passano da esadecimale
alla stringa `var(--color-entity-<kind>-bg)` e `var(--color-entity-<kind>-fg)`. Restano
stringhe e restano consumati come oggi da `Navbar.tsx:290` nello `style` inline: una `var()`
dentro uno style inline si risolve normalmente. Non cambiare il tipo `DocumentTypeEntry`, non
cambiare i nomi dei campi, non toccare `Navbar.tsx`.

Se un tipo di documento presente in `documentTypes.ts` non ha un token corrispondente,
**fermati e riporta**.

```bash
npm run typecheck    # da frontend/
npm run build        # da frontend/
git add frontend/src/styles/components/_form-system.scss frontend/src/styles/components/nestedView.scss frontend/src/constants/documentTypes.ts
git commit -m "refactor: read entity badge colors from tokens in panel and navbar"
```

### 3.2 Stop condizionale, dopo C

Non è un go-ahead in chat obbligatorio, è uno stop a condizione. **Prosegui a D salvo che si
verifichi una di queste**, nel qual caso fermati e riporta:

1. Una superficie fuori da badge del pannello, badge `view` e menu «New document» cambia
   aspetto.
2. Un badge rende trasparente, nero, o col testo illeggibile.
3. `typecheck` o `build` rossi.
4. Alfonso ha riportato, sul dark del commit B, che la riga viewpoint del tree si legge come un
   blocco che galleggia. In quel caso **il token sta facendo due mestieri**, pastiglia nel
   pannello e tinta di riga nel tree, e la soluzione non è tornare a `rgba`: serve un token di
   riga derivato dalla stessa tinta a croma più bassa. È una decisione di chat, non tua:
   fermati dopo C e non toccare D.

### 3.3 Commit D: gli esadecimali residui di `entityMeta.ts`

**Prima leggi, poi decidi se toccare.** Il report del passo 1 dice che l'unico importatore di
`entityMeta.ts` prende `resolveEntityType` e i metadati, non i colori, e insieme registra
esadecimali propri per `object` `#CCFBF1 / #0D9488`, `transformation` `#E1F5EE / #0F6E56` e
`parameter` `#F1F5F9 / #475569`. Le due cose stanno insieme solo se quegli esadecimali sono
morti, oppure consumati per una via diversa dall'import diretto.

```bash
command grep -rn "entityMeta" frontend/src
command grep -rnE "#CCFBF1|#0D9488|#E1F5EE|#0F6E56|#F1F5F9|#475569" frontend/src
```

Controllo positivo obbligatorio prima di dichiarare qualunque assenza, per R-RAIL-28: cerca col
**medesimo comando** un esadecimale che sai presente, per esempio uno dei nove canonici scritti
al commit B nei file di token, e verifica che lo trovi. Se il controllo torna vuoto, la ricerca
è rotta e non hai provato niente.

Tre esiti, tre condotte:

- **Consumati, e la sostituzione è meccanica**: portali a `var(--color-entity-<kind>-bg)` e
  `-fg`, senza cambiare la forma della struttura dati né i nomi dei campi.
- **Non consumati**: non rimuoverli, questo prompt non è mandato per la rimozione. Salta il
  commit D, dillo nel report, e proponi una voce di `docs/TECH-DEBT.md` per il passo successivo.
- **Consumo per una via non prevista qui**: fermati e riporta.

Attenzione a `#F1F5F9 / #475569`: è la coppia slate che oggi serve sia `parameter` sia
`dataType`, ed è anche un valore di piattaforma che può comparire altrove per ragioni che non
c'entrano con le entity. Non sostituirla dove non è un colore di entity.

```bash
npm run typecheck
npm run build
git add frontend/src/common/entityMeta.ts
git commit -m "refactor: read entity colors from tokens in entityMeta"
```

### 3.4 Secondo stop visivo, dopo D

**Fermati e riporta**, e aspetta il via prima di scrivere il log. Superfici da guardare: badge
del pannello properties, righe e badge del tree, menu «New document», badge `view`, in light e
in dark.

### 3.5 Commit E: entry di log del passo 2 intero, e rotazione

Una sola entry, che copre A, B, C, D. Formato: quello reale del file. Campi nell'ordine
`**Prompt**`, `**Files touched**`, `**Outcome**`, `**Corregge**`, `**Causa**`,
`**Regressions**`, `**Out-of-scope changes**`, `**Layer Impact Report**`, `**Smoke visivo**`,
`**Notes**`, `**Prompt document name**`. Entry nuova in testa.

- `**Prompt document name**`: `2026-08-11 17:21`, che è il prompt del passo 2. Questo documento
  ne è la ripresa, non un prompt nuovo.
- `**Corregge**`: `2026-08-11 16:29 — il titolo della sotto-regola sul grep puntava a GNU grep;
  command grep qui è BSD grep 2.6.0-FreeBSD`.
- `**Causa**`: `(c)`. Una sola lettera, forma parentesizzata, per `CLAUDE.md` §21.3.
- `**Layer Impact Report**`: `not-required`, salvo che uno dei file toccati compaia in
  `CLAUDE.md` §3.1. Verificalo, non assumerlo.
- `**Smoke visivo**`: gli esiti dei due stop, quello dopo B e quello dopo D.

Nelle `**Notes**`, tutte e cinque:

1. La scala entity ha una sorgente sola; sedici kind su nove coppie; la mappatura vive nei
   file di token come alias e non si duplica altrove.
2. I due token `-saturated` sono stati rimossi dopo riverifica con controllo positivo a
   segnale, dieci file sotto `frontend/src` contengono il termine.
3. Casing: nessuna interpolazione del nome del token, quindi kebab-case per `abstract-class` e
   `data-type`.
4. Due errata al prompt `2026-08-11 17:21`: un glob non quotato in §3.3, che in zsh fa fallire
   il comando senza eseguirlo, e un'alternanza scritta in sintassi GNU in §3.6.
5. **Candidata R-RAIL-31**, da iscrivere nel primo passo che tocchi il registro: ogni comando
   di shell scritto in un prompt quota i suoi glob e usa `-E` con barre nude per le alternanze.
   Terza occorrenza in un arco della stessa specie di errore, cioè un'affermazione scritta con
   la sicurezza di una misura e mai misurata.

**Rotazione**:

1. Conta i blocchi `## ` del file attivo dopo l'aggiunta. Atteso: 21.
2. Tieni le 20 più recenti, sposta la più vecchia in coda all'archivio, byte per byte. Il taglio
   è posizionale.
3. Progressivo del lotto ricavato dal preambolo dell'archivio: l'ultimo è il tredicesimo, quindi
   questo è il quattordicesimo. Se il file dice altro, vince il file.
4. Conservazione: attivo 20, archivio 737, totale = precedente + 1. Se non torna, hard stop
   senza committare.

Il preambolo dell'archivio ha una riga vuota mancante fra il nono e il decimo paragrafo, svista
preesistente. **Non normalizzarla.**

```bash
npm run check:docs   # da frontend/
git add docs/claude-code-log.md docs/claude-code-log-archive.md
git commit -m "docs: log the entity scale unification"
```

---

## 4. Gate

Da `frontend/`:

| Comando | Atteso | Quando |
|---|---|---|
| `npm run typecheck` | verde | dopo C e dopo D |
| `npm run build` | verde | dopo C e dopo D |
| `npm run check:docs` | 2/2, 0 warning | prima del commit E |

`check:agents` non serve: `CLAUDE.md` non si tocca in questo prompt.

---

## 5. Cosa NON fare

- Niente push, nessun force, nessun tag.
- Non toccare `properties-with-tree-view.scss` né `tree-view-sidebar.scss`. Consumano i nomi
  esistenti e devono funzionare senza modifiche. Se non funzionano, è un difetto della
  mappatura del commit B, quindi si riporta, non si edita qui.
- Non toccare `Navbar.tsx`, `Info.tsx`, `ViewData.tsx`, `ElementBadge.tsx`, `PropertiesHeader`,
  né i due file di token.
- In `_form-system.scss`, niente oltre i nove valori dei modificatori.
- Non rinominare token, non cambiare il tipo `DocumentTypeEntry`, non introdurre una decima
  coppia canonica.
- Non rimuovere codice apparentemente inutilizzato: questo prompt non è mandato per rimozioni,
  i due orfani del commit B erano l'unica autorizzata.
- Non normalizzare formattazione, trattini, ordine delle righe.
- Non riscrivere entry esistenti del log.

---

## 6. Condizioni di hard stop

1. Il guard di §0 non torna, al netto della tolleranza dichiarata.
2. Un modificatore `.jj-type-badge--*` o un tipo di `documentTypes.ts` senza token
   corrispondente fra i sedici.
3. Una delle quattro condizioni di §3.2.
4. Il consumo dei colori in `entityMeta.ts` non è fra i tre esiti previsti in §3.3.
5. Un controllo positivo che torna vuoto: la ricerca è rotta, non concludere nulla.
6. `typecheck` o `build` rossi.
7. Uno dei file toccati compare in `CLAUDE.md` §3.1: serve il Layer Impact Report prima di
   committare.
8. Il file attivo del log non è a 20 entry prima dell'aggiunta, o la conservazione non torna.
9. `check:docs` non è 2/2.
10. Stai girando sul bridge di Cowork invece che in locale.

In ogni caso di stop: riporta il rilievo, lo stato del working tree e cosa proponi. Non
committare lavoro parziale.

---

## 7. Definition of done

- Commit C ed E fatti; D fatto oppure saltato e dichiarato con la ragione.
- Secondo stop visivo rispettato, col via di Alfonso prima del log.
- Nessun esadecimale entity residuo nei consumatori toccati.
- `typecheck` e `build` verdi; `check:docs` 2/2 con 0 warning.
- Log attivo a 20, archivio a 737, conservazione verificata.
- Niente pushato. La branch resta a otto o nove commit avanti a origin.

Riporta in chat: sha dei commit; la mappatura effettiva dei nove modificatori sui token, riga
per riga, che è il punto dove un errore silenzioso è più probabile; se il commit D è avvenuto o
è stato saltato e perché; e la lista dei kind che dopo questo passo non hanno più un colore
proprio.

---

## 8. RIFERIMENTI

| Fonte | Contenuto rilevante |
|---|---|
| `2026-08-11_1721_prompt_arco2_passo2_scala_entity.md` | Il prompt che questo riprende; §3.3 porta i valori dei token, già applicati |
| `2026-08-11_memo_ratifica_arco2_scala_entity.md` | Metodo di generazione della scala, ratificato |
| `CLAUDE.md` §5 | Le due sotto-regole sul grep, in vigore da questo arco |
| `CLAUDE.md` §3.1 | Critical zone, per il campo Layer Impact Report |
| `CLAUDE.md` §21.3 | Tassonomia di `Causa` |
| `2026-08-10_2000_prompt_rotazione_log.md` | Metodo di rotazione |
