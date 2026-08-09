# Fase B step 2 — Ricostruzione index in commit tematici (ESECUZIONE)

**Tipo:** chore / git surgery (repackaging di lavoro non committato; **nessun cambio di comportamento del codice**)
**Data:** 2026-07-28
**Branch:** `alfonso-frontend-jjtl` · **HEAD:** `9bd8cad9a` (E-ref) · ahead of origin by 3 (E0/TS1/E-ref)
**Basato su:** `docs/discovery/triage_2026-07-28_working_tree_reconstruction.md` (Fase B step 1). Leggilo prima.

> Trasformi il working tree attuale in **7 commit tematici** che buildano a ogni passo. È **chirurgia git su lavoro non committato**: la priorità è **non perdere nulla** e **non rompere il build**, non l'eleganza. Nessun push.

---

## 0. Vincoli di ingaggio (leggere prima)

- Leggi `CLAUDE.md`. Se qualcosa qui lo contraddice, segnala e fermati.
- **Comandi git permessi:** `git add`, `git rm`, `git rm --cached`, `git commit`, `git apply --cached`, `git tag`, `git rebase --exec`, e i read-only (`status`, `diff`, `log`, `ls-files`).
- **Comandi VIETATI** (salvo la procedura di recovery §Recovery): `git reset`, `git checkout <path>`, `git restore`, `git clean`, `git stash drop`, `git push`. **Nessun edit di codice** (solo staging/commit; l'unica scrittura di file è: aggiungere una entry al log §7 e la riga in `.gitignore` §7).
- **Preflight obbligatorio (§1).** Se lo stato reale del tree diverge dallo snapshot del triage, **FERMATI e segnala**: non improvvisare.
- Decisioni ratificate (non re-interpretare): **keep-removal** di F5 e F6; **F5+F6 in un unico commit** chore; **F8 = header + tab in un unico commit**; **log e docs discovery nel chore finale F7**; **ordine F2 → F1 → F3 → …**; `.claude/scheduled_tasks.lock` **untracked via `git rm --cached` + `.gitignore`**, contenuto non committato.

---

## 1. STEP 0 — Backup + preflight (nessun commit)

1. **Anchor di recovery:** `git tag reconstruct-base-2026-07-28` (marca `9bd8cad9a`).
2. **Backup tracciati:** `git diff HEAD > /tmp/reconstruction-backup.patch` (cattura index + working tree vs HEAD).
3. **Backup untracked:** `git ls-files --others --exclude-standard > /tmp/untracked.list` poi `tar czf /tmp/untracked-backup.tgz -T /tmp/untracked.list`.
4. **Baseline build:** esegui il build del progetto (`npm run build` o comando da `CLAUDE.md`). **Se NON builda ora, FERMATI**: il tree è già rotto, non è compito di questo task.
5. **Assert snapshot** (confronta col triage §2): `git status --porcelain` deve mostrare, in INDEX, i 5 file F2 (`ObjectNode.tsx`, `nodeSizing.ts`, `VertexAuthoringPanel.tsx`, `irStyle.ts`, `irTypes.ts`); in working tree i file F1/F3/F4/F6/F8 + log + lock; untracked i 13 doc + `TextStyleField.tsx`. Verifica in particolare che `git diff --cached --name-only` = **esattamente** i 5 file F2 e che `git diff --cached -- .../VertexAuthoringPanel.tsx` contenga **solo** l'hunk checkbox `Resizable` (non il bottone). **Se diverge, STOP.**

> **HARD STOP #1** dopo lo STEP 0: riporta ad Alfonso l'esito di preflight (build verde + snapshot combaciante) e attendi conferma prima di committare.

---

## 2. Sequenza commit (ognuna builda; verifica lo staged-set PRIMA di ogni `commit`)

Regola per **ogni** commit: dopo lo staging, stampa `git diff --cached --name-only` e confronta con l'atteso; se non combacia, **STOP**. Messaggi convenzionali, inglese, una riga.

### Commit 1 — F2 (resizable) — *l'index è GIÀ questo: nessuno staging*
- **Non fare `git add`.** L'index è già esattamente F2.
- Verifica: `git diff --cached --name-only` = i 5 file F2.
- `git commit -m "feat(editor-v2): add resizable flag to IR vertex views and enable rect/rounded resize"`
- **HARD STOP #2**: mostra `git show --stat HEAD` ad Alfonso (conferma che il primo commit surgical è pulito) prima di proseguire.

### Commit 2 — F1 (co-evoluzione)
- `git add frontend/src/components/editor-v2/hooks/useEditorMode.ts`
- Atteso: 1 file. 
- `git commit -m "fix(editor-v2): include feature names in the M2 signature so id-preserving renames re-derive modeInfo"`

### Commit 3 — F3 (size propagation) — *dipende da F2; unico split per-hunk del task*
File interi (dopo F2, il residuo di VertexAuthoringPanel è solo l'hunk bottone):
- `git add frontend/src/components/editor-v2/sync/canvasToJjom.ts frontend/src/events/registry.ts frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`

**Split chirurgico di `EditorV2.tsx` (solo hunk F3):**
1. `git diff -- frontend/src/components/editor-v2/EditorV2.tsx > /tmp/ev2.patch`
2. `grep -n '^@@' /tmp/ev2.patch` → attesi hunk nelle regioni ~37, ~49, ~68, ~103, ~942, ~966/1026, ~1360+. Mappa: **F3** = 37 (`resolveIRView`), 68 (`syncSizeBatchToJjom`), 103 (`toast`), 942 (listener `PROPAGATE_VIEW_SIZE`). **F6** = 49 (rimozione import laneSeparation), 966/1026 (blocco `LANE_DEBUG`). **F5** = 1360+ (`[BUG-DIAG-DROP]`).
3. Costruisci `/tmp/ev2.f3.patch` = header del diff (righe `diff --git`, `index`, `---`, `+++`) + **solo** gli hunk F3 (37, 68, 103, 942). Escludi 49, 1026, 1360+.
4. `git apply --cached /tmp/ev2.f3.patch`
5. **Gate anti-errore (obbligatorio):**
   - `git diff --cached -- .../EditorV2.tsx` **non deve** contenere `laneSeparation`, `LANE_DEBUG`, `reconstructEdgePoints`, `BUG-DIAG`.
   - `git diff -- .../EditorV2.tsx` (residuo unstaged) **deve** contenere quelle stringhe (restano per il Commit 6).
   - Se il gate fallisce, `git restore --staged .../EditorV2.tsx` (unico uso permesso, solo per annullare questo staging errato) e riprova la costruzione della patch.
- Verifica staged-set: `canvasToJjom.ts`, `registry.ts`, `VertexAuthoringPanel.tsx`, `EditorV2.tsx`.
- `git commit -m "feat(editor-v2): propagate a resized instance size to all instances of an IR view"`
- **HARD STOP #3**: mostra `git show --stat HEAD` + l'esito del gate ad Alfonso.

### Commit 4 — F4 (TextStyle field + editor, atomico 4 file)
- `git add frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx frontend/src/components/editor-v2/viewpoint/authoring/TextStyleField.tsx frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx frontend/src/styles/components/_form-system.scss`
- `TextStyleField.tsx` è nuovo (untracked): `git add` lo traccia. Atteso: 4 file.
- `git commit -m "feat(editor-v2): TextStyle trigger+popover field and per-axis editor redesign"`

### Commit 5 — F8 (view header + tab, un unico commit)
- `git add frontend/src/components/editors/views/ViewData.tsx frontend/src/components/editors/views/nestedView.scss`
- Atteso: 2 file (ViewData intero = solo hunk header; nestedView intero = header `.props-header--view` + tab-bar overflow).
- `git commit -m "feat(editors): collapse the view header into a single inline-breadcrumb row"`

### Commit 6 — F5 + F6 (cleanup strumentazione edge)
- `git rm frontend/src/components/editor-v2/utils/laneSeparation.ts` (stage della delete)
- `git add frontend/src/components/editor-v2/EditorV2.tsx` (residuo = solo hunk F5+F6, dato che F3 è già committato)
- **Gate:** `git diff --cached -- .../EditorV2.tsx` **deve** contenere solo rimozioni di `laneSeparation`/`LANE_DEBUG`/`BUG-DIAG`; non deve toccare il listener F3.
- `git commit -m "chore(editor-v2): remove edge debug instrumentation (lane-separation + connect diag logs)"`

### Commit 7 — F7 (docs + log + untrack lock, finale)
1. Aggiungi in testa a `docs/claude-code-log.md` **una** entry per questa ricostruzione (tipo `chore`, prompt riassunto in una riga, "reconstruction working tree in 7 thematic commits", esito, `Nome del documento prompt: 2026-07-28 Fase B step 2 commit reconstruction`).
2. Aggiungi la riga `.claude/scheduled_tasks.lock` a `.gitignore` (se non già presente).
3. `git rm --cached .claude/scheduled_tasks.lock` (untrack; il file resta su disco, ora ignorato; **non** committarne il contenuto).
4. `git add docs/discovery/*.md docs/claude-code-log.md .gitignore`
5. Verifica: lo staged include i 13 doc discovery + il triage + log + `.gitignore` + la delete-from-index del lock; **non** deve includere `.claude/scheduled_tasks.lock` come modifica di contenuto.
- `git commit -m "chore: add discovery reports, update prompt log, and stop tracking the session lock file"`

---

## 3. STEP 8 — Verifica finale (prova che OGNI commit builda)

- `git log --oneline reconstruct-base-2026-07-28..HEAD` → devono comparire **7 commit** nell'ordine atteso.
- **Isolated build di ogni commit:** `git rebase --exec "<comando build>" reconstruct-base-2026-07-28`
  - Riesegue i 7 commit uno per uno, buildando dopo ciascuno; si ferma al primo che non builda, indicando quale.
  - Riscrive gli SHA dei 7 commit nuovi (innocuo: sono locali e non pushati; i 3 commit E0/TS1/E-ref sotto la base non vengono toccati).
  - Se un commit non builda: la ricostruzione ha un errore di ordinamento/split → **STOP e segnala** (quale commit, quale errore); non forzare.
- A rebase completato: `git status` deve essere pulito salvo `.claude/scheduled_tasks.lock` (ora ignorato).

---

## 4. Chiusura

- **Non fare push.** Riporta ad Alfonso: `git log --oneline reconstruct-base-2026-07-28..HEAD`, l'esito del rebase-build, e conferma che il tree è pulito.
- Il tag `reconstruct-base-2026-07-28` resta come anchor; Alfonso deciderà quando/se rimuoverlo dopo il push.
- Se in qualsiasi punto un gate o un build fallisce e non è ovvio come procedere: **fermati e chiedi**, non tentare `reset`/`checkout` fuori dalla procedura di recovery.

## Recovery (solo se qualcosa va storto)

Stato recuperabile al 100% da: tag `reconstruct-base-2026-07-28` + `/tmp/reconstruction-backup.patch` + `/tmp/untracked-backup.tgz`.
Procedura: `git reset --hard reconstruct-base-2026-07-28` → `git apply /tmp/reconstruction-backup.patch` → `tar xzf /tmp/untracked-backup.tgz` → `git stash`/re-stage manuale come pre-ricostruzione. Eseguire **solo** su richiesta esplicita di Alfonso.

## 5. Riferimenti

- Triage Fase B step 1: `docs/discovery/triage_2026-07-28_working_tree_reconstruction.md` (mappa hunk→filone, build-order, i due file misti).
- Ordine build-safe: 1→2→3 (F2 prima di F3); 4/5/6/7 indipendenti dopo. `.claude/scheduled_tasks.lock` mai committato come contenuto.
- Nota: F8 copre solo tab + header del redesign Properties; l'EN di VertexAuthoringPanel, le micro-label Border e ConditionalEditor restano da fare in un secondo momento (fuori da questa ricostruzione).
