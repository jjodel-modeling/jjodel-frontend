# Prompt Claude Code: Triage READ-ONLY del WIP nel working tree (7 file) prima di R3

**Data**: 2026-07-25 20:06
**Tipo**: discovery (READ-ONLY: zero mutazioni al codice, unica scrittura = report + entry di log)
**Repo**: jjodel-frontend, branch `alfonso-frontend-jjtl`
**Hard stop**: dopo la scrittura del report. Nessun commit, nessuno stash, nessun edit al codice.

## Perche' questo task

Sul working tree, in cima a R2 (`d12a54aa0`), esiste WIP non committato su ~7 file
(ClassNode, EnumNode, ObjectNode, VertexAuthoringPanel, IRNodeContent, irStyle,
nodeSizing). L'ipotesi corrente e' "un solo filone shape/resize eseguito e mai
committato", ma non regge all'incrocio con lo scope dei prompt: 5 file combaciano
(ObjectNode, ClassNode, EnumNode, nodeSizing, un file SCSS della shape), ma
**VertexAuthoringPanel e IRNodeContent no**. Il prompt shape/resize del 24/07 metteva
`VertexAuthoringPanel` **esplicitamente fuori scope**. Il prossimo task (R3) sta per
editare proprio `VertexAuthoringPanel`: serve sapere COSA c'e' sotto PRIMA di
costruirci sopra. Questo task **mappa** il WIP, non lo tocca.

## Vincoli assoluti (nessuna eccezione)

- **READ-ONLY sul codice.** NON modificare nessuno dei file WIP. NON `git add`, NON
  `git commit`, NON `git stash`, NON `git checkout`/`git restore`/`git reset`, NON
  `git clean`. Nessun revert di hunk, nessuno stash "temporaneo".
- L'UNICA scrittura ammessa e' il file di report in `docs/discovery/` e l'entry finale
  in `docs/claude-code-log.md`. Nient'altro.
- NON "completare" ne' "sistemare" il WIP. NON eseguire i prompt shape/resize. Solo
  osservare e documentare.
- Se un qualsiasi passo richiedesse una mutazione per procedere, FERMATI e segnala nel
  report invece di eseguirla.

## Prima di iniziare

1. Leggi `CLAUDE.md`. Se un punto di questo prompt lo contraddice, segnala il conflitto
   invece di procedere.
2. Leggi `docs/claude-code-log.md` per il contesto recente; cerca un'entry del task
   shape/resize ("content-hug" / "free-resize").

## COSA (in ordine)

### 1. Stato del tree
- `git branch --show-current` -> conferma `alfonso-frontend-jjtl`.
- `git log --oneline -6` -> conferma che in cima ci sono `d12a54aa0` (R2),
  `8a650833b` (R1), `bb88adab4` (docs discovery row dispatch). Se HEAD diverge da
  quanto atteso, riportalo.
- `git status --porcelain` e `git diff --stat` -> elenco COMPLETO di file
  modificati/untracked. Conferma se sono esattamente i 7 attesi o se ce ne sono di
  piu'/meno. Attenzione: `nodeSizing.ts` e' probabilmente un file NUOVO (untracked):
  includilo (`git status` lo mostra come `??`).

### 2. Diff per file + classificazione
Per OGNI file modificato: `git diff <file>` (se untracked, leggilo). Caratterizza in
UNA riga COSA fa il cambiamento (semantica, non conteggio righe). Poi classifica:
- **Filone shape/resize** se il diff introduce/usa: `NODE_SIZING_DEFAULTS`,
  `NodeSizing`, `isNodeResizable`, `SHAPE_MIN_SIZE`, `hasGeometricShape`, il gate del
  `NodeResizer`, `minWidth`/`minHeight`, `min-width: 0`/`min-height: 0`,
  `text-overflow: ellipsis` sulla shape. (Scope dichiarato del task shape:
  `nodeSizing.ts` nuovo; edit a ObjectNode/ClassNode/EnumNode; UN file SCSS per
  neutralizzare il minimo della shape del ramo IR.)
- **Ignoto / altro filone** altrimenti.

### 3. Deep-dive sui due anomali (OBBLIGATORIO)
- **VertexAuthoringPanel**: il prompt shape/resize lo escludeva esplicitamente.
  Riporta la natura completa del suo diff. Cerca segnali di origine nel diff:
  riferimenti a feature-picker, by-name vs by-id, matching, `classNames`, compartment,
  IR authoring. Ipotizza il filone (residuo del task feature-picker? sforamento di
  scope del task shape? lavoro R3-adiacente gia' iniziato? altro?). Dichiara se il diff
  e' coerente e completo oppure un edit lasciato a meta'.
- **IRNodeContent**: fuori dallo scope SCSS-only dichiarato del task shape. Riporta la
  natura del diff e ipotizza se e' companion del ramo IR shape (es. wrapper
  `min-width:0` / aggiunta di className) o un filone diverso.

### 4. Segnali di provenienza
- Esiste `docs/discovery/discovery_2026-07-24_shape_node_min_resize.md`? (il task shape
  doveva crearlo). Si'/no.
- In `docs/claude-code-log.md` c'e' un'entry per il task shape/resize
  (content-hug / free-resize)? Si'/no, con data.
- Interpreta: report + entry di log presenti -> il task shape E' stato eseguito, il WIP
  e' quel task con staging non completato; assenti -> WIP di origine diversa. Concludi
  esplicitamente.

### 5. Il tree compila?
- `npm run build` (o il comando di build del progetto). Riporta PASS/FAIL. Se FAIL,
  riporta gli errori: dicono se il WIP e' un edit coerente o un half-edit rotto (dato
  critico prima di far costruire R3 sopra VertexAuthoringPanel). NON modificare nulla
  per far passare la build; se fallisce, documenta e basta.

### 6. Report (unica scrittura sul repo, oltre al log)
Scrivi `docs/discovery/discovery_2026-07-25_wip_7_file_triage.md` con:
- **Obiettivo**.
- **Stato tree**: output di `git branch` / `git log --oneline -6` / `git status` /
  `git diff --stat`.
- **Tabella per-file**: file | path completo | natura del diff (1 riga) |
  filone (shape-resize | ignoto) | completo o half-edit.
- **Deep-dive** VertexAuthoringPanel + IRNodeContent (dal punto 3).
- **Segnali di provenienza** (dal punto 4): presenza del report shape + entry di log.
- **Esito build** (dal punto 5).
- **Conclusione**: e' un solo filone? Se no, quali file/hunk appartengono a cosa.
  Proposta di split: quali file in un commit tematico (es. shape/resize), quali da
  stashare o scartare, quali eventualmente gia' allineati a HEAD.
- **Domande aperte per Alfonso**.

## DOVE
- **Lettura**: i file WIP (path reali dal `git status`), `docs/claude-code-log.md`,
  `docs/discovery/` (esistenza del report shape), `CLAUDE.md`.
- **Scrittura**: SOLO `docs/discovery/discovery_2026-07-25_wip_7_file_triage.md` e
  l'entry finale in `docs/claude-code-log.md` (tipo `chore`, discovery). Nessun altro
  file.

## COME
- Nessun edit al codice; nessuna operazione git che muti index o working tree (vedi
  Vincoli assoluti).
- HARD STOP dopo il report. In chat: sintesi della tabella per-file + conclusione +
  domande aperte.

## RIFERIMENTI
- Prompt shape/resize (per confronto di scope):
  `2026-07-24_prompt_fase2_shape_free_resize_content_hug.md` (knowledge base progetto).
  Scope dichiarato: `nodeSizing.ts` nuovo, ObjectNode/ClassNode/EnumNode, UN file SCSS;
  `VertexAuthoringPanel` ESPLICITAMENTE fuori scope.
- R3 (prossimo task, che tocca VertexAuthoringPanel):
  `2026-07-25_prompt_faseR3_row_authoring_preserve.md`.
- Commit di riferimento: `d12a54aa0` (R2), `8a650833b` (R1), `bb88adab4` (docs
  discovery row dispatch).
