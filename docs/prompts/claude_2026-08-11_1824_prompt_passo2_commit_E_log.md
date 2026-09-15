# Passo 2, commit E: entry di log del passo intero, e rotazione

**Nome del documento prompt**: 2026-08-11 18:24
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: docs. Un commit solo, nessun file di codice nel diff.
**Vincolo di chiusura**: **niente push**. Il task finisce al commit e al report in chat.
**Ambiente**: Claude Code sul Mac.

**Stato di partenza**: secondo stop visivo superato. HEAD `1b27b3e23`, working tree pulito, nove
commit avanti a origin. Questo prompt chiude il passo 2 e sostituisce il §3.5 del prompt del
17:34, che non conosceva né l'emendamento né l'esito del commit D.

Valgono i due errata di §0-bis del prompt del 17:34: glob sempre quotati, alternanze con `-E` e
barre nude, ogni ricerca con `command grep`.

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
| HEAD | `1b27b3e23`, il commit C |
| working tree | vuoto |
| ahead/behind | `0    9` |

Tolleranza dichiarata, per R-RAIL-27: `.claude/settings.local.json` non deve comparire.

---

## 1. COSA

Un commit: `docs/claude-code-log.md` e `docs/claude-code-log-archive.md`. Nient'altro.

**Nessuna voce di `TECH-DEBT.md` in questo commit.** Le cinque voci maturate oggi si aprono al
passo 3, in un commit loro. Elencarle qui e non aprirle è voluto.

---

## 2. DOVE

Solo i due file del log. **Mai `git add .`**.

---

## 3. COME

### 3.1 L'entry

Formato: quello reale del file, che va riletto prima di scrivere. Campi nell'ordine `**Prompt**`,
`**Files touched**`, `**Outcome**`, `**Corregge**`, `**Causa**`, `**Regressions**`,
`**Out-of-scope changes**`, `**Layer Impact Report**`, `**Smoke visivo**`, `**Notes**`,
`**Prompt document name**`. Entry nuova **in testa**.

Valori vincolati dal gate, alla lettera:

- `**Corregge**`: `2026-08-11 16:29 — il titolo della sotto-regola sul grep puntava a GNU grep;
  command grep qui è BSD grep 2.6.0-FreeBSD`. Il gate accetta solo la sentinella o un prefisso
  `YYYY-MM-DD HH:mm`.
- `**Causa**`: `(c)`. Una sola lettera, forma parentesizzata, per `CLAUDE.md` §21.3.
- `**Prompt document name**`: `2026-08-11 17:21`, il prompt che ha aperto il passo. La ripresa
  delle 17:34, l'emendamento delle 17:46 e questo documento sono suoi discendenti e vanno
  nominati nelle note, non qui.

Gli altri campi:

- `**Files touched**`: `CLAUDE.md`, `docs/decisions.md`,
  `frontend/src/styles/tokens/_colors-light.scss`,
  `frontend/src/styles/tokens/_colors-dark.scss`,
  `frontend/src/styles/components/_form-system.scss`,
  `frontend/src/components/editors/views/nestedView.scss`,
  `frontend/src/constants/documentTypes.ts`, più gli `AGENTS.md` rigenerati al commit A se ce
  ne sono stati. Verifica l'elenco reale con `git diff --name-only f8a680db9^..1b27b3e23`
  invece di ricopiare questo.
- `**Outcome**`: ✅, se non hai rilievi tuoi.
- `**Regressions**`: nessuna. I cambiamenti di colore sono voluti e verificati ai due stop
  visivi; non sono regressioni.
- `**Out-of-scope changes**`: la conversione di `nestedView.scss:3710`, il modificatore
  `--viewpoint`, non nominato dal prompt, convertito per non lasciare un esadecimale entity nel
  file appena toccato. Perimetro allargato di una riga, dichiarato e autorizzato a posteriori
  dall'emendamento delle 17:46.
- `**Layer Impact Report**`: `not-required`, dopo aver verificato che nessuno dei file di
  `Files touched` compaia in `CLAUDE.md` §3.1. Verificalo, non assumerlo.
- `**Smoke visivo**`: gli esiti dei due stop. Primo stop, dopo B: tre superfici cambiate,
  quelle attese, nessun'altra. Secondo stop, dopo C: nove badge del pannello a token, cinque
  pastiglie del menu «New document» diventate tutte slate, badge `view` cambiato solo fuori dal
  rail.

### 3.2 Le note

Undici, tutte. Sono il verbale del passo e vanno scritte per esteso, non compresse.

1. La scala entity ha una sorgente sola. I kind mappano su nove coppie canoniche; la mappatura
   vive nei file di token come alias, è lì che si conta, e non si ricopia altrove.
2. I due token `-saturated` rimossi dopo riverifica con controllo positivo a segnale: il termine
   esiste in dieci file sotto `frontend/src`, quindi la ricerca funzionava.
3. Casing: nessuna interpolazione del nome del token in TS o TSX, quindi kebab-case per
   `abstract-class` e `data-type`.
4. Due errata al prompt `2026-08-11 17:21`: un glob non quotato in §3.3, che in zsh fa fallire
   il comando senza eseguirlo, e un'alternanza scritta in sintassi GNU in §3.6, non garantita su
   BSD grep.
5. **Candidata R-RAIL-31**, da iscrivere al primo passo che tocchi il registro: ogni comando di
   shell scritto in un prompt quota i suoi glob e usa `-E` con barre nude per le alternanze.
6. `refactoring`, scoperto in `documentTypes.ts` e assente dai token, assorbito dalla famiglia
   contenitori con un alias invece che con una coppia canonica nuova. Kind da sedici a
   diciassette, coppie ferme a nove.
7. I due numerali dei kind rimossi da R-RAIL-30 al commit B3: un conteggio a registro duplica
   una mappatura che vive nei file di token, ed è scaduto in un'ora. Nessuna regola di
   `CLAUDE.md` vieta l'edit di una voce di `decisions.md` già committata; verificato prima di
   procedere.
8. Il prompt del 17:34 dava un path sbagliato per `nestedView.scss`; il guard di §2 ha
   funzionato e si è usato il path reale,
   `frontend/src/components/editors/views/nestedView.scss`.
9. **Commit D saltato**, secondo dei tre esiti previsti: i campi colore di `entityMeta.ts` non
   sono consumati da nessuno. `entityColor`, `entityIcon` e `entityIsAbstract` non hanno
   chiamanti fuori dal file; nessun lettore di `badgeBg`, `badgeText`, `badgeBgDark`,
   `badgeTextDark` in `frontend/src`; gli unici accessor usati sono `entityLetter` e
   `resolveEntityType`, da `ElementBadge.tsx:9`, che i colori non li tocca. Controllo positivo
   passato sulla stessa catena. Non rimosso nulla: il prompt non era mandato per rimozioni.
10. **L'unificazione è a metà.** I token sono sorgente unica per pannello e navbar, ma il tree
    consuma ancora variabili SCSS locali in `tree-view-sidebar.scss:36-42`. È il primo punto del
    passo 3, non una voce di backlog.
11. **Candidata R-RAIL-32**: una regola di famiglia vale finché i membri non compaiono come
    fratelli simultanei. La famiglia contenitori era stata giustificata sul presupposto che i
    contenitori si vedano uno alla volta; il menu «New document» li affianca tutti e cinque, e
    lì la premessa non tiene. La superficie che affianca i membri va cercata prima di ratificare
    la regola. Misurato prima di scartare la via della sfumatura: cinque gradini di chiarezza
    sulla stessa tinta distano 0.016 in OKLab, sul limite del percepibile fra campiture
    adiacenti, quindi leggerebbero come gradiente e non come cinque identità. Se quel menu deve
    tornare a distinguere, il canale è un'icona per tipo, non il colore.

**Cinque voci di `TECH-DEBT.md` maturate oggi, da aprire al passo 3 e non qui**: i campi colore
morti in `entityMeta.ts`; il teal `#CCFBF1 / #0D9488` e `#E1F5EE / #0F6E56` duplicato in otto
fogli; il commento ora fuorviante a `documentTypes.ts:44`; l'override di `.jj-type-badge--view`
in `properties-with-tree-view.scss:373-376`, superficie che mostra un badge entity senza
consumare la scala entity; le variabili SCSS locali del tree. Citale in nota, non aprirle.

### 3.3 Rotazione

1. Conta i blocchi `## ` del file attivo dopo l'aggiunta. Atteso: 21.
2. Tieni le 20 più recenti, sposta la più vecchia in coda all'archivio, **byte per byte**. Il
   taglio è posizionale.
3. Progressivo del lotto ricavato dal preambolo dell'archivio: l'ultimo è il tredicesimo,
   quindi questo è il quattordicesimo. Se il file dice altro, vince il file.
4. Conservazione: attivo 20, archivio 737, totale = precedente + 1. Se non torna, **hard stop
   senza committare**.

Il preambolo dell'archivio ha una riga vuota mancante fra il nono e il decimo paragrafo, svista
preesistente. **Non normalizzarla.**

```bash
npm run check:docs    # da frontend/
git add docs/claude-code-log.md docs/claude-code-log-archive.md
git commit -m "docs: log the entity scale unification"
```

---

## 4. Gate

| Comando | Atteso | Quando |
|---|---|---|
| `npm run check:docs` | 2/2, 0 warning | prima del commit |

`check:agents` non serve, `CLAUDE.md` non si tocca. Build e typecheck non servono, nessun file
sorgente nel diff.

---

## 5. Cosa NON fare

- Niente push, nessun force, nessun tag.
- Nessun file di codice, nessun file di token, nessun tocco a `CLAUDE.md` o a
  `docs/decisions.md`.
- Non aprire voci di `TECH-DEBT.md`: sono del passo 3.
- Non riscrivere entry esistenti del log, non riformattare l'archivio, non normalizzare
  trattini né la riga vuota mancante del preambolo.
- Non comprimere le undici note in un riassunto.

---

## 6. Condizioni di hard stop

1. Il guard di §0 non torna, al netto della tolleranza dichiarata.
2. Il file attivo non è a 20 entry prima dell'aggiunta.
3. La conservazione non torna: attivo 20, archivio 737, totale precedente più uno.
4. Il progressivo del lotto letto dal preambolo non è il tredicesimo.
5. `check:docs` non è 2/2, o dà warning.
6. Uno dei file di `Files touched` compare in `CLAUDE.md` §3.1: allora `Layer Impact Report`
   non è `not-required` e serve prima di committare.
7. Stai girando sul bridge di Cowork invece che in locale.

In ogni caso di stop: riporta il rilievo e non committare lavoro parziale.

---

## 7. Definition of done

- Un commit, i due file del log.
- Entry con gli undici punti di nota, `Corregge` e `Causa` compilati nella forma che il gate
  accetta, `Out-of-scope changes` con la riga 3710.
- `check:docs` 2/2 con 0 warning.
- Log attivo 20, archivio 737, quattordicesimo lotto, conservazione verificata.
- Working tree pulito, dieci commit avanti a origin, niente pushato.

Riporta in chat: sha del commit; i tre conteggi verificati; e conferma che nessun file di
`Files touched` sta in `CLAUDE.md` §3.1.

---

## 8. RIFERIMENTI

| Fonte | Contenuto rilevante |
|---|---|
| `2026-08-11_1721_prompt_arco2_passo2_scala_entity.md` | Il prompt che ha aperto il passo, e il valore del campo `Prompt document name` |
| `2026-08-11_1734_prompt_arco2_passo2_ripresa_C_D_E.md` | Ripresa, e i due errata di §0-bis |
| `2026-08-11_1746_prompt_passo2_emendamento_1_refactoring.md` | Emendamento su `refactoring` e su R-RAIL-30 |
| `CLAUDE.md` §21.3 | Tassonomia di `Causa` |
| `CLAUDE.md` §3.1 | Critical zone, per il campo `Layer Impact Report` |
| `2026-08-10_2000_prompt_rotazione_log.md` | Metodo di rotazione |
