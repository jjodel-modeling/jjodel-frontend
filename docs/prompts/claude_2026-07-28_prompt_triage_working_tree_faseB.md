# Prompt Claude Code: Triage read-only del working tree — piano di ricostruzione index (Fase B, step 1)

**Data**: 2026-07-28
**Tipo**: discovery / chore (Fase 1 read-only del two-phase)
**Repo/branch**: jjodel-frontend / `alfonso-frontend-jjtl`
**HEAD**: `9bd8cad9a` (E-ref appena committato). `origin/alfonso-frontend-jjtl` è a `4273317f8`; HEAD è avanti di 3 commit non pushati (`420657f98` E0, `e2368cad7` TS1, `9bd8cad9a` E-ref).
**HARD STOP TOTALE, READ-ONLY**: questo task NON modifica nulla. **Vietati**: `git add`, `git rm`, `git restore`, `git reset`, `git stash`, `git commit`, qualsiasi edit di file di codice. L'unico output su disco è il report in `docs/discovery/`. Se ti viene la tentazione di stageare o resettare "per provare la separazione", NON farlo: la separazione si descrive a parole nel report, non si esegue.

## Perché questo task

Dopo il commit E-ref, il working tree contiene ancora cinque-sei filoni di lavoro intrecciati, in parte staged in parte no, con due file che mescolano più filoni nello stesso diff. Prima di ricostruire l'index in commit tematici puliti serve una mappa a livello di hunk. Questo task produce SOLO quella mappa + una sequenza di commit proposta. I commit veri sono un task separato (Fase B step 2), dopo la ratifica di Alfonso in chat.

## Prima di iniziare
1. Leggere `CLAUDE.md` e `docs/claude-code-log.md`.
2. Come mappa di partenza (NON come verità): `docs/discovery/triage_2026-07-27_commit_split.md` classifica già resizable vs propagazione; il tree è cambiato da allora, quindi conferma tutto leggendo i diff reali.

## Filoni attesi (da confermare leggendo i diff, le righe reali comandano)

- **F1 — Fix co-evoluzione**: `hooks/useEditorMode.ts` (firma metamodello con nomi feature). Non-staged. Atteso indipendente.
- **F2 — Resizable**: `nodes/ObjectNode.tsx`, `nodes/nodeSizing.ts`, `viewpoint/ir/irStyle.ts`, `viewpoint/ir/irTypes.ts` (staged interi) + hunk **checkbox** in `viewpoint/authoring/VertexAuthoringPanel.tsx`.
- **F3 — Propagazione size**: `sync/canvasToJjom.ts` (`syncSizeBatchToJjom`), `events/registry.ts` (`PROPAGATE_VIEW_SIZE`), hunk **bottone** in `VertexAuthoringPanel.tsx`, hunk **listener** in `EditorV2.tsx`. Dipende da F2 per buildare.
- **F4 — Textstyle Fase 2/2b**: `viewpoint/authoring/LabelEntryEditor.tsx`, `viewpoint/authoring/TextStyleEditor.tsx`, `viewpoint/authoring/TextStyleField.tsx` (untracked, nuovo), `styles/components/_form-system.scss`. TS1 base è già committato (`e2368cad7`): questi sono il refactor trigger+popover e il redesign per-asse.
- **F5 — WIP orfano edge/anchor**: hunk in `EditorV2.tsx`. **Non tracciato in nessuna sessione**: origine ignota. Da descrivere e sottoporre a decisione keep/drop.
- **F6 — WIP lane-separation**: `utils/laneSeparation.ts` (deleted) + eventuali hunk in `EditorV2.tsx`. Da descrivere e sottoporre a decisione keep/drop.
- **F7 — Chore**: i `docs/discovery/*.md` untracked + `docs/claude-code-log.md` modificato.
- **Rumore**: `.claude/scheduled_tasks.lock` (file di lock locale: valutare se va semplicemente ignorato / non committato mai).

## COSA fare (tutto read-only)

### 1. Fotografia
`git status`. Poi `git diff --cached` (staged) e `git diff` (unstaged) integrali. Per i due file misti, isolare gli hunk uno per uno.

### 2. Analisi dettagliata dei due file misti (il cuore del task)

**`EditorV2.tsx`** — separare i tre filoni presenti:
- hunk del **listener `PROPAGATE_VIEW_SIZE`** (F3): righe inizio/fine, import associati.
- hunk del **refactor edge/anchor** (F5): righe inizio/fine, e una descrizione di COSA fa (quali funzioni/handler tocca, che comportamento cambia rispetto al rendering E0). Questo è WIP orfano: la descrizione serve ad Alfonso per decidere keep/drop.
- hunk della **lane-separation** (F6), se presenti in questo file oltre alla cancellazione di `laneSeparation.ts`: righe, e cosa rimuovono/introducono.
- **Segnalare i confini esatti** tra i tre gruppi (righe). È il punto più rischioso per un futuro staging per-hunk.

**`VertexAuthoringPanel.tsx`** — separare:
- hunk **checkbox resizable** (F2) da hunk **bottone "Propaga dimensione"** (F3).
- Notare quali hunk sono **staged** e quali **non-staged** (il file compare in entrambe le sezioni di `git status`).
- Verificare se checkbox e bottone **condividono righe** (import comuni, blocco JSX adiacente): se sì, la separazione pulita in due commit distinti potrebbe non essere possibile senza cura; segnalarlo.

### 3. Censimento del resto (tabellare, leggero)
Per ogni altro file toccato, una riga: path, filone (F1/F4/F7/…), staged o no, una frase su cosa contiene. Non serve il diff integrale di questi: basta la classificazione. Includere gli untracked (in particolare `TextStyleField.tsx` → F4; i discovery report → F7, indicando a quale filone/sessione appartiene ciascuno).

### 4. Sequenza di commit proposta (con build-safety)
Proporre un ordine di commit tematici che **builda a ogni passo**. Ipotesi di partenza da confermare: F1 (fix co-evoluzione) indipendente; F2 (resizable) prima di F3 (propagazione); F4 (textstyle) indipendente; F5/F6 solo se Alfonso decide keep; F7 (chore discovery+log) come commit finale. Per ogni commit: file/hunk inclusi, messaggio convenzionale proposto, ed eventuali dipendenze di build.

### 5. Strategia di ricostruzione dell'index (raccomandazione, NON eseguirla)
L'index oggi è parzialmente popolato col filone F2 (resizable staged) più `VertexAuthoringPanel.tsx` staged parziale. Raccomandare nel report se convenga (a) partire da un `git reset` mixed per azzerare l'index e ricostruire ogni commit da zero con staging per-hunk controllato, oppure (b) lavorare sull'index attuale. Argomentare in una riga. La decisione la prende Alfonso in chat; qui solo la raccomandazione.

## Report (unico output su disco)
Salvare in **`docs/discovery/triage_2026-07-28_working_tree_reconstruction.md`** (la cartella `docs/discovery/` esiste già). Contenuto minimo:
- Obiettivo del triage.
- Output di `git status`.
- Tabella file/hunk → filone (F1..F7) per l'intero tree.
- Per `EditorV2.tsx` e `VertexAuthoringPanel.tsx`: separazione hunk con righe e descrizioni; confini tra gruppi.
- Descrizione semantica di **F5 (edge/anchor)** e **F6 (lane-separation)** con la domanda esplicita **keep/drop** per Alfonso.
- Sequenza di commit proposta con build-safety per passo.
- Raccomandazione sulla strategia di ricostruzione index (reset vs no).
- Dubbi e domande aperte.

## COME
- Read-only assoluto. Nessuna mutazione di git o di file di codice.
- Il report è un file nuovo in `docs/discovery/` (resta untracked: lo committeremo come chore nella sequenza F7).
- **HARD STOP**: consegnare in chat il riassunto della classificazione + la sequenza proposta, e fermarsi. L'analisi in chat parte dal report salvato, non dalla memoria della sessione.

## RIFERIMENTI
- Commit appena fatto: `9bd8cad9a` (E-ref). Sopra: `e2368cad7` (TS1), `420657f98` (E0).
- Triage parziale precedente: `docs/discovery/triage_2026-07-27_commit_split.md`.
- Prompt dei filoni (KB Claude.ai, se serve contesto): fix co-evoluzione (`2026-07-26_prompt_fix_coevolution_signature_fase1.md`), propagazione (`2026-07-27_prompt_fase2_size_propagation.md`), resizable (`2026-07-27_prompt_fase2_resizable_flag.md`), textstyle (`2026-07-27_prompt_fase2_textstyle_field_popover.md`, `2026-07-27_prompt_fase2b_textstyle_editor_redesign.md`).
