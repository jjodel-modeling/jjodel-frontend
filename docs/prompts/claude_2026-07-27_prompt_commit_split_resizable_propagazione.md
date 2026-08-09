# Commit split: resizable + propagazione size (triage → esecuzione)

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

Branch: `alfonso-frontend-jjtl`. **Nessun push** (a meno che Alfonso lo chieda esplicitamente).
**Nessun edit di feature**: questo task e' SOLO operazione git (staging + commit). Non modificare
codice, non "sistemare" nulla.

**Autorizzazione esplicita di Alfonso**: per questo task puoi uscire dallo scope dei 5 file della
propagazione e mettere le mani anche sui file della feature `resizable`. Resta il divieto di
`git add .` / `git commit -a`: si stage per file o per hunk, mai in blocco.

## Contesto

Il working tree ha intrecciate tre cose: (A) la feature `resizable` mai committata, (B) la feature
`propagazione size` appena verificata, e (C/D) roba NON di queste feature che deve restare fuori dai
commit: un **refactor edge/anchor in `EditorV2.tsx`** e il **WIP della sessione TS1**. Obiettivo:
due commit tematici puliti (prima resizable, poi propagazione), lasciando C/D come WIP non
committato.

Classificazione attesa dei file (da confermare nel triage, le righe reali comandano):

- **Gruppo A — resizable (interi)**: `nodes/nodeSizing.ts`, `viewpoint/ir/irTypes.ts`,
  `nodes/ObjectNode.tsx`, `viewpoint/ir/irStyle.ts`.
- **Gruppo A — resizable (hunk)**: in `viewpoint/authoring/VertexAuthoringPanel.tsx`, SOLO gli hunk
  della **checkbox** (`const canResize`, import `defaultResizableForForm`, JSX della checkbox + hint).
- **Gruppo B — propagazione (interi)**: `events/registry.ts` (`PROPAGATE_VIEW_SIZE`),
  `sync/canvasToJjom.ts` (`syncSizeBatchToJjom`).
- **Gruppo B — propagazione (hunk)**: in `VertexAuthoringPanel.tsx` gli hunk del **bottone** "Propaga
  dimensione" (+ import `JjodelEvents`); in `EditorV2.tsx` gli hunk del **listener**
  `PROPAGATE_VIEW_SIZE` (+ i suoi import: `resolveIRView`, `syncSizeBatchToJjom`, `toast`).
- **Gruppo C/D — NON committare**: in `EditorV2.tsx` gli hunk del **refactor edge/anchor** (non di
  queste feature); qualunque file/hunk della **sessione TS1**; qualunque altro file estraneo.

I due file **misti** sono `VertexAuthoringPanel.tsx` (A+B) ed `EditorV2.tsx` (B+C). Solo lì serve lo
staging a livello di hunk.

## FASE 0 — Triage read-only (OBBLIGATORIO, HARD STOP)

Nessuno stage, nessun commit ancora. Produci il quadro e fermati.

1. `git status` e, per ogni file toccato, `git diff <file>`. 
2. Classifica **ogni hunk** in A / B / C / D secondo lo schema sopra. Per i due file misti
   (`VertexAuthoringPanel.tsx`, `EditorV2.tsx`) elenca gli hunk uno per uno con un'etichetta e una
   riga di descrizione, cosi' Alfonso vede la separazione.
3. Segnala esplicitamente **dove finisce il listener e dove inizia il refactor edge/anchor** in
   `EditorV2.tsx` (il confine e' il punto piu' rischioso).
4. Salva il triage in `docs/discovery/triage_2026-07-27_commit_split.md` (obiettivo, output di
   `git status`, tabella hunk→gruppo per i file misti, confine listener/refactor, dubbi).
5. **HARD STOP**: mostra la classificazione in chat e **aspetta il go-ahead di Alfonso** prima di
   toccare l'index. Se un hunk e' ambiguo (non sai se e' B o C), NON indovinare: chiedi.

## FASE 1 — Esecuzione (solo dopo go-ahead)

### Commit 1 — resizable
1. `git add` dei 4 file interi del gruppo A. Per `VertexAuthoringPanel.tsx`, stage dei **soli hunk
   checkbox** (usa `git add -p`, oppure `git diff` → patch → `git apply --cached` se `-p` non e'
   affidabile nel tuo ambiente).
2. **Verifica prima di committare**: `git diff --cached` deve contenere SOLO roba resizable. Se vedi
   un hunk del bottone o del listener o del refactor, rimuovilo dall'index (`git restore --staged`).
3. (Opzionale ma consigliato, per history bisect-clean) verifica che il commit builda in isolamento:
   `git stash --include-untracked` → `npm run build` → `git stash pop`. Se non pratico per via del
   WIP, salta e affidati alla verifica finale.
4. Includi nel commit anche, se non gia' committati, il discovery report resizable
   (`docs/discovery/discovery_2026-07-27_resizable_flag.md`) e l'entry di log resizable in
   `docs/claude-code-log.md`.
5. Commit, messaggio una riga:
   `feat: add resizable flag to IR vertex views and enable rect/rounded resize`

### Commit 2 — propagazione
1. `git add` di `events/registry.ts` e `sync/canvasToJjom.ts` interi. Stage degli **hunk bottone**
   in `VertexAuthoringPanel.tsx` e degli **hunk listener** in `EditorV2.tsx`.
2. **Verifica critica prima di committare**: `git diff --cached` di `EditorV2.tsx` deve contenere
   SOLO il listener `PROPAGATE_VIEW_SIZE` e i suoi import. **Nessun hunk del refactor edge/anchor,
   niente TS1.** Se compare, toglilo dall'index. Fai lo stesso check su `VertexAuthoringPanel.tsx`
   (solo bottone, non di nuovo la checkbox gia' committata).
3. Includi, se non gia' committati, i report propagazione
   (`docs/discovery/discovery_2026-07-27_size_propagation.md`,
   `docs/discovery/lir_2026-07-27_size_propagation.md`) e l'entry di log propagazione.
4. Commit, messaggio una riga:
   `feat: propagate resized dimensions to all instances of an IR view`

### Chiusura
- Il refactor edge/anchor in `EditorV2.tsx` e il WIP TS1 restano **non committati** nel working
  tree. Non toccarli, non stasharli via, non "pulirli".
- `git status` finale: mostra cosa e' rimasto non committato (deve essere solo C/D).
- `npm run build` sul working tree completo: deve restare verde (era gia' verificato).
- **Nessun push.** Riporta in chat i due hash di commit e il `git status` finale.

## Note
- Se in FASE 1 lo staging per hunk lascia `VertexAuthoringPanel.tsx` in uno stato in cui il commit 1
  (solo checkbox) non compila da solo per via di un simbolo introdotto dal bottone, **fermati e
  segnala**: significa che gli hunk checkbox/bottone condividono una riga e vanno separati con piu'
  cura (o rivalutata la strategia). Non forzare un commit che non builda.
- Ordine tassativo: prima resizable, poi propagazione (la seconda dipende dalla prima per buildare).
