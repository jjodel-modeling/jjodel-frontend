# Passo 5 dell'arco 1: residuo, ratifica, entry di log e rotazione

**Nome del documento prompt**: 2026-08-11 12:45
**Repo**: `jjodel-frontend`
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: docs. Tre commit, nessun file sorgente nel diff.
**Vincolo di chiusura**: **niente push**. Il task finisce al terzo commit.
**Vincolo generale**: `CLAUDE.md` è la fonte di verità. Se questo prompt lo contraddice in un
punto non dichiarato in §6, segnala il conflitto invece di eseguirlo.

Questo prompt è autocontenuto. Non ricostruire da memoria di sessione.

---

## 0. Guard di stato

```bash
git rev-parse --abbrev-ref HEAD
git log --oneline -4
git status --porcelain
```

Atteso:

| Controllo | Valore atteso |
|---|---|
| branch | `alfonso-frontend-jjtl` |
| HEAD | `df8850653 feat: restyle tree pane rows in properties rail` |
| HEAD~1 | `238037853 docs: add discovery report for tree row restyle cross-reference` |
| HEAD~2 | `abe5fdc8b session document` |
| HEAD~3 | `2a9226c0f docs: record R-RAIL-24..26 and entity palette unification backlog item` |
| working tree | **quattro righe**, quelle di §1.A qui sotto, e nient'altro |

Se un controllo non corrisponde: fermati e riporta. Non riallineare, non stashare, non fare
checkout.

**Attenzione all'ambiente**: se stai girando sul bridge di Cowork e non in locale, le
scritture git non sono sicure. La unlink è vietata sul mount, quindi git non riesce a
rimuovere `.git/index.lock` e ne lascia uno stantio che blocca tutto, anche VS Code. In quel
caso fermati: questo task va eseguito da Claude Code sul Mac.

---

## 1. COSA

Tre commit, in quest'ordine. Nessun file sorgente in nessuno dei tre.

### A. Chiusura del residuo di `docs/sessioni/`

Il working tree porta una rinomina aperta da ieri, mai committata, più il checkpoint di oggi:

```
 D docs/sessioni/sessione_2026-08-10_4.md
?? .claude/settings.local.json
?? docs/sessioni/claude_sessione_2026-08-10_4.md
?? docs/sessioni/claude_sessione_2026-08-11.md
```

Le due righe di `sessione_2026-08-10_4` sono la stessa rinomina, fatta a mano da Alfonso: il
checkpoint prende il prefisso `claude_` degli altri venti di quella cartella.

`claude_sessione_2026-08-11.md` è il checkpoint di oggi, depositato l'11 agosto alle 12:50
dalla sessione Cowork. Entra nello stesso commit. Se non c'è, non crearlo e non nominarlo: vuol
dire che qualcuno lo ha spostato, e va segnalato.

`.claude/settings.local.json` **resta untracked e fuori da ogni commit**. È configurazione
locale di Claude Code, del 24 luglio, non coperta dai dieci pattern `**/.claude/*` di
`.git/info/exclude`. La scelta di lasciarlo dov'è è di Alfonso, dell'11 agosto. Non
aggiungerlo agli exclude, non committarlo, non spostarlo.

```bash
git add docs/sessioni/sessione_2026-08-10_4.md \
        docs/sessioni/claude_sessione_2026-08-10_4.md \
        docs/sessioni/claude_sessione_2026-08-11.md
git commit -m "docs: rename session checkpoint and add the 2026-08-11 one"
```

### B. R-RAIL-19 e R-RAIL-27 in `docs/decisions.md`

**Due voci, un commit solo.** Entrambe vanno nella sezione «Arco rail destro — preset 2a», in
posizione numerica se quella sezione è ordinata, altrimenti in coda alle voci R-RAIL esistenti.
Rispetta la formattazione delle voci vicine: stesso livello di lista, stessa larghezza di riga,
nessuna riscrittura di voci esistenti.

#### B.1 — R-RAIL-19

La voce non esiste nel registro, ed è l'unica delle ratifiche dell'arco 1 a mancare (ci sono
1..13, 16, 18, 22, 23, 24, 25, 26). La sua assenza ha prodotto un hard stop reale al passo 4,
perché il prompt mandava a recuperarla da lì. Va iscritta con la forma fissata l'11 agosto.

Testo:

> - **R-RAIL-19** (2026-08-10, forma fissata il 2026-08-11) — Le grep di conformità dell'arco
>   girano sul **diff staged**, mai sul file intero: il foglio del rail ha 82 letterali
>   esadecimali preesistenti che renderebbero rossa la grep sempre. Le occorrenze preesistenti
>   si riferiscono nell'entry di log, non si correggono. Il quartetto originario non era stato
>   messo a registro e non è più stato recuperabile dalle fonti autorizzate; l'11 agosto si è
>   fissato il **quintetto** che lo sostituisce, preso da
>   `docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md` §8: (1) i 13 nomi in lista nera
>   di R-RAIL-6; (2) `var(--shadow-`; (3) letterali esadecimali `#[0-9a-fA-F]{3,8}`;
>   (4) `z-index`; (5) `font-family:`. La quinta ha atteso **diverso da zero** quando il passo
>   aggiunge una famiglia: la verifica è che la riga consumi `var(--font-mono)` e non un nome
>   in chiaro. Forma sul diff:
>   `git diff --cached -U0 -- <file> | grep '^+' | grep -v '^+++' | grep …`.

#### B.2 — R-RAIL-27

Ratificata da Alfonso l'11 agosto sul memo
`claude/2026-08-11_memo_ratifica_palette_entity.md` (opzione C). È il presupposto dell'arco 2 e
va a registro **prima** che l'arco 2 parta, altrimenti si ripete esattamente il caso di
R-RAIL-19.

Testo:

> - **R-RAIL-27** (2026-08-11) — La palette dei badge di entità ha **sorgente unica** in
>   `common/entityMeta.ts`, esposta come token `--color-entity-<kind>-{bg,fg}`: i quattro token
>   di C9.1 sono la copia byte per byte dei suoi `badgeBg`/`badgeText`, verificata a HEAD
>   `df8850653`. Ogni superficie **nuova** consuma i token, mai esadecimali in chiaro (R-RAIL-4).
>   I nove `.jj-type-badge--*` di `styles/components/_form-system.scss:1251-1259` sono una
>   **palette legacy**: non si toccano, non si estendono, e i loro consumatori si migrano solo
>   con una voce di lavoro dedicata. Le due palette divergono su sei kind, con attribute ed enum
>   proprio invertiti. Non si unifica adesso perché `_form-system.scss` è importato globalmente
>   da `styles/style.scss:2` e ha un consumatore vivo fuori da `Info` (`views/ViewData.tsx:221`),
>   quindi il raggio d'azione sarebbe l'app; e perché l'identity block dell'arco 2 sostituisce il
>   badge di `PropertiesHeader`, dopo di che il rail smette di consumare la palette legacy e la
>   divergenza esce dallo stesso schermo. Conseguenza: le quattro coppie di C9.1 smettono di
>   essere token senza consumatori, il che chiude la seconda metà di R-RAIL-9. Fuori da questa
>   ratifica, a backlog: correggere i commenti stale di `entityMeta.color`, che dichiarano di
>   rispecchiare i `$color-*` del tree e per package, class e attribute non lo fanno.

```bash
git add docs/decisions.md
git commit -m "docs: register R-RAIL-19 and R-RAIL-27 in the rail arc section"
```

### C. Entry di log e rotazione

Un solo commit, due file: `docs/claude-code-log.md` e `docs/claude-code-log-archive.md`.

---

## 2. DOVE

| File | Commit |
|---|---|
| `docs/sessioni/sessione_2026-08-10_4.md`, `docs/sessioni/claude_sessione_2026-08-10_4.md` | A |
| `docs/sessioni/claude_sessione_2026-08-11.md` | A |
| `docs/decisions.md` | B |
| `docs/claude-code-log.md`, `docs/claude-code-log-archive.md` | C |

Nessun altro file. Mai `git add .`, in nessuna fase.

---

## 3. COME, commit C

### 3.1 Una sola entry per tutto l'arco

**Deroga dichiarata** alla regola di una entry per task: i passi 2, 2-bis, 3 e 4 non hanno
entry, perché ogni prompt dell'arco ne ha rimandato la scrittura qui. La deroga è stata
pianificata nel checkpoint `sessione_2026-08-10_4`, quindi non è un conflitto da segnalare.
Si scrive **una** entry di chiusura d'arco, e la rotazione è di conseguenza di una sola entry.

### 3.2 Formato

Il formato è quello reale del file, non quello minimo di CLAUDE.md §21.2. Leggi la prima
entry del file attivo e ricalcane i campi nell'ordine: `**Prompt**`, `**Files touched**`,
`**Outcome**`, `**Corregge**`, `**Causa**`, `**Regressions**`, `**Out-of-scope changes**`,
`**Layer Impact Report**`, `**Smoke visivo**`, `**Notes**`, `**Prompt document name**`.
`check:docs` valida questa struttura, trattini lunghi delle intestazioni inclusi: sono
formato, non stile, e non vanno normalizzati con le regole di scrittura dei documenti.

Ordine del file: le entry sono in ordine cronologico inverso, la nuova va **in testa**, subito
sotto `# Claude Code Session Log`. Verificalo su tre entry consecutive prima di scrivere.

### 3.3 Bozza dell'entry

Verifica ogni affermazione contro il repo prima di scriverla. Dove la bozza sbaglia, correggi
la bozza, non il repo.

```markdown
## 2026-08-11 — feat: restyle del tree pane e chiusura dell'arco 1 del rail destro

**Prompt**: «passo 4 dell'arco 1, restyle del tree pane», documento prompt «2026-08-11 00:55»
con l'emendamento «2026-08-11 12:03». Entry di chiusura d'arco: copre anche i passi 2, 2-bis e
3, che per deroga dichiarata dai rispettivi prompt non hanno una entry propria.
**Files touched**: `frontend/src/components/TreeViewSidebar/tree-view-sidebar.scss` (+8 −1,
commit `df8850653`); `docs/discovery/discovery_2026-08-11_rimando_blocco_altezze.md` (nuovo,
83 righe, commit `238037853`). Commit precedenti dell'arco, senza entry propria:
`bcc68da8f` guscio, `77e2bb6a6` ritiro della postura, `9808a812d` NODE come disclosure,
`ef1260ddc` NODE chiusa di default, `2a9226c0f` registro R-RAIL-24..26.
**Outcome**: ✅ completed — i quattro valori di R-RAIL-7 applicati, verifica visiva di Alfonso
passata.
**Corregge**: —
**Causa**: —
**Regressions**: no — il diff del CSS emesso, ottenuto compilando il foglio prima e dopo con
dart-sass e confrontando l'output, contiene esattamente le quattro dichiarazioni e nient'altro.
Nessun effetto altrove nel foglio.
**Out-of-scope changes**: no — un solo file di codice, `tree-view-sidebar.scss`. Ampliamento di
scope rispetto al «foglio del rail» dichiarato e autorizzato da R-RAIL-15.
**Layer Impact Report**: not-required — nessun file di §3.1.
**Smoke visivo**: ✅ — riga, nome, peso sul selezionato, suffisso in mono e bottoni di azione su
hover verificati da Alfonso su localhost:3001 con hard refresh.
**Notes**: (1) **Ampliamento di scope su `tree-view-sidebar.scss`**, autorizzato da R-RAIL-15:
i quattro valori di R-RAIL-7 non stanno nel foglio del rail. (2) **`height: 26px` e non
`min-height`**: `.tree-row__name` dichiara `white-space: nowrap` e `text-overflow: ellipsis`,
quindi il nome non manda a capo, e `* { box-sizing: border-box }`
(`styles/tokens/index.scss:61`) fa assorbire gli 8px di padding verticale dentro i 26. Padding
e proprietà di troncamento non toccati. (3) **Rimando di una riga** verso
`frontend/src/components/editors/properties-with-tree-view.scss:15`, blocco righe 4-34: il
blocco delle tre altezze resta punto unico e non è stato duplicato. (4) **Correzione di un dato
che circolava nei prompt**: i «92 letterali esadecimali e l'unica occorrenza di lista nera a
`:735`» del foglio del rail sono misure **pre-arco**, prese su `bcc68da8f^` (1366 righe). A
HEAD valgono **82** e **`:717`**, stessa riga byte per byte
(`border-bottom: 1px solid #f1f5f9; // var(--color-border-primary);`); il delta di 10 è la
tokenizzazione fatta dall'arco. Chi scrive prompt futuri dichiari la revisione insieme al
numero. (5) **Le grep di R-RAIL-19 sono cinque, non quattro**: il quartetto non era a registro e
non è stato recuperabile; l'11 agosto Alfonso ha ratificato il quintetto come soprainsieme, ora
iscritto in `docs/decisions.md`. Esito sul diff staged: lista nera 0, `var(--shadow-` 0,
esadecimali 0, `z-index` 0, `font-family:` **1**, ed è `+ font-family: var(--font-mono);`, cioè
il valore 1 del passo. (6) **Divergenza di forma sul valore 4**: il blocco
`.tree-row--selected` non esiste, ci sono solo `&--selected::before` e
`&--selected:hover::before`, quindi il peso è stato scritto come discendente
`&--selected .tree-row__name`, convenzione già in uso a `:1981` e `:1997`. (7) **`.tree-row`
diventa 2px più bassa**: prima l'altezza era guidata dal contenuto, con i bottoni di azione a
20px più 8px di padding; ora è fissa a 26. I bottoni sbordano di 1px per lato dentro il padding
e non vengono tagliati, perché `.tree-row` non dichiara `overflow`. Verificato a video.
(8) **Postura Browse/Focus**: costruita in `bcc68da8f` contro R-RAIL-14 e ritirata al passo
2-bis con un commit additivo, così resta recuperabile da lì per l'arco 2. (9) **Commit 1 del
passo 3 non eseguito**, su due condizioni di stop entrambe corrette: `_form-system.scss` è
globale e intoccabile, e le due palette entity non divergono, sono **invertite** su attribute ed
enum. Ne è seguito R-RAIL-26, che manda il renderer dell'identity block all'arco 2.
(10) **Meccanismo reale di colorazione del badge**: i colori vengono da
`styles/components/_form-system.scss:1251-1259`, nove modificatori `.jj-type-badge--*` con
esadecimali inline; `getElementTypeInfo` restituisce solo il nome di classe. Consumatore vivo
oltre a `Info`: `views/ViewData.tsx:221`. La migrazione ai token entity è a backlog in
`docs/TECH-DEBT.md` (R-RAIL-25). (11) **Chiavi rese inerti e non rimosse**:
`jjodel_property_tree_height` resta nei `localStorage` degli utenti per scelta (R-RAIL-21);
`attentionPulse` è stato rimosso perché privo di superficie dopo il ritiro dei
`CollapsedPanelToggle`. (12) **`--color-slate-400` sul caret della disclosure NODE**: palette
grezza, non segue il tema. Debito per il dark mode, a backlog. (13) **Incidente di ambiente,
agli atti**: un `git status` eseguito dal bridge di Cowork ha lasciato un `.git/index.lock`
stantio, perché su quel mount la unlink è vietata. Le scritture git dal bridge non sono sicure;
il lavoro sul repo va fatto da Claude Code in locale. (14) **ROTAZIONE**: attivo da 20 a 21 con
questa entry, poi la più vecchia in archivio, quindi 20; archivio da 733 a 734. Progressivo del
lotto ricavato dal preambolo dell'archivio, non assunto da questo prompt.
**Prompt document name**: 2026-08-11 00:55
```

Il campo `**Prompt document name**` porta il timestamp del prompt **principale** del passo 4,
non dell'emendamento: l'emendamento è citato nel corpo di `**Prompt**`.

### 3.4 Rotazione

1. Conta i blocchi `## ` del file attivo **dopo** l'aggiunta dell'entry. Atteso: 21.
2. Tieni nel file attivo le **20 più recenti**; sposta la più vecchia in
   `docs/claude-code-log-archive.md`, **byte per byte**, in coda, senza riformattare nulla.
3. Il progressivo del lotto va **ricavato dal preambolo dell'archivio**, che li numera in
   inglese: l'ultimo presente è il decimo, quindi questo dovrebbe essere l'undicesimo. Non
   assumerlo: verificalo sul file. Se la numerazione risulta diversa, vince il file.
4. Conservazione: attivo 20, archivio 734, totale = totale precedente + 1. Se non torna, hard
   stop senza committare.

```bash
git add docs/claude-code-log.md docs/claude-code-log-archive.md
git commit -m "docs: log arc 1 rail closure and rotate the oldest entry"
```

---

## 4. Gate

`npm run check:docs` → atteso **2/2, 0 warning**. Zero warning è il valore corrente, misurato
l'11 agosto: la nota (6) del decimo lotto spiega perché i due warning storici sono usciti dal
perimetro.

Build e typecheck non sono richiesti: nessun file sorgente nel diff. Se li giri comunque,
attesi build 0 e typecheck 33.

---

## 5. Cosa NON fare

- Niente push, nessun force, nessun tag.
- Nessun file sorgente nel diff, in nessuno dei tre commit.
- Non riformattare, riordinare o «correggere» entry esistenti del log o dell'archivio, e non
  normalizzare trattini o maiuscole. Il taglio della rotazione è posizionale.
- Non toccare `.claude/settings.local.json` né `.git/info/exclude`.
- Non riscrivere voci esistenti di `docs/decisions.md`: si aggiunge R-RAIL-19 e basta.
- Non aprire il perimetro dell'arco 2 (identity block, palette entity, chip di firma, postura
  Browse/Focus).

---

## 6. Condizioni di hard stop

1. Il guard di §0 non torna.
2. Il file attivo non è a 20 entry prima dell'aggiunta, o la conservazione dei conteggi non
   torna dopo la rotazione.
3. Il formato dell'archivio è ambiguo o incoerente fra le sue parti.
4. `docs/decisions.md` contiene già una voce R-RAIL-19 o R-RAIL-27: in quel caso non
   sovrascriverla, riportane il testo e fermati.
5. `check:docs` non è 2/2.
6. Stai girando sul bridge di Cowork invece che in locale.

In ogni caso di stop: riporta il rilievo, lo stato del working tree e cosa proponi. Non
committare lavoro parziale.

---

## 7. Definition of done

- Tre commit sulla branch, nell'ordine A, B, C.
- Working tree a fine task: **esattamente** `?? .claude/settings.local.json`.
- `docs/decisions.md` contiene R-RAIL-19 col quintetto **e** R-RAIL-27 con la sorgente unica
  della palette entity.
- Log attivo a 20 entry, archivio a 734, conservazione verificata sui conteggi.
- `check:docs` 2/2, 0 warning.
- Niente pushato.

Riporta in chat: sha dei tre commit, conteggi attivo e archivio prima e dopo, progressivo del
lotto e da dove l'hai ricavato, esito di `check:docs`, e il numero di commit ahead di origin.

---

## 8. RIFERIMENTI

| Fonte | Contenuto rilevante |
|---|---|
| `2026-08-11_0055_prompt_passo4_restyle_tree.md` | Il passo 4 eseguito, di cui questa è l'entry |
| `2026-08-11_1203_prompt_passo4_emendamento_1.md` | Quintetto di grep, atto zero, Fase A già risolta |
| `2026-08-10_2000_prompt_rotazione_log.md` | Metodo di rotazione: conteggio, progressivo del lotto dall'archivio, verifica di conservazione |
| `docs/discovery/discovery_2026-08-10_arco1_ancoraggio.md` §8 | Le cinque grep e le misure di baseline |
| `docs/sessioni/claude_sessione_2026-08-10_4.md` | Elenco dei punti che l'entry deve riportare |
| Prima entry di `docs/claude-code-log.md` | Formato reale dei campi, che `check:docs` valida |
