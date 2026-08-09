# Prompt Claude Code — Completare lo staging/commit di Fase B (rimasto a metà) prima di B2a

**Tipo**: chore (staging/commit, nessuna modifica funzionale al codice). **Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna.

## Contesto

Il commit di Fase B (`feat: vertex authoring panel with live IR preview (phase B)`) risulta annotato in `docs/claude-code-log.md`, ma `VertexAuthoringPanel.tsx` e `TextSourceEditor.tsx` risultano **untracked** nel working tree: il `git add` di quel commit non li ha inclusi. Il commit di Fase B, di fatto, non contiene i file che la sua stessa entry di log descrive.

Questo prompt **non tocca codice**: chiude solo lo staging rimasto a metà, così che l'entry di log già scritta torni accurata e il prossimo prompt (Fase B2a, breadth: lista label/fieldCompartments/badge) possa partire da un albero coerente (B2a riusa `TextSourceEditor.tsx` e presuppone che sia già tracciato).

## COSA

1. Verificare con `git status` quali file della Fase B risultano effettivamente untracked o modificati e non ancora committati. Attesi almeno:
   - `components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
   - `components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx`
   - eventuale `components/editor-v2/viewpoint/authoring/useDebouncedCommit.ts` (se creato come file separato)
   - la modifica additiva a `components/editors/Info.tsx` (mount della sezione), se non già inclusa nel commit esistente.

   Usa come riferimento la tabella "DOVE" del prompt originale di Fase B (`claude/2026-07-21_prompt_authoring_faseB_panel.md`, sezione DOVE) per l'elenco esatto dei file di competenza di quella fase.

2. `git add` di **solo** questi file (perimetro Fase B, non allargare a file di altre fasi).

3. Commit con messaggio **identico** a quello già annotato nel log:
   ```
   feat: vertex authoring panel with live IR preview (phase B)
   ```
   Nessuna nuova entry in `docs/claude-code-log.md`: l'entry esiste già e con questo commit diventa accurata. Se il messaggio nel log differisce anche di poco da quanto sopra, usa quello effettivamente presente nel log (non inventarne uno nuovo).

4. Verifica post-commit: `npm run build` (o il comando di typecheck/build standard del progetto) verde su questo commit isolato, **prima** di procedere a qualunque altro task. Se non è verde, STOP e report — non proseguire con Fase B2a finché questo commit non è pulito e buildabile.

## DOVE

Solo i file elencati al punto 1. Nessuna modifica a codice, nessun file toccato al di fuori del perimetro Fase B già definito nel prompt originale.

## COME

- Nessun refactoring, nessuna modifica di contenuto: è un'operazione di git puro (add + commit) su file già scritti e presumibilmente già verificati visivamente in questa stessa giornata.
- Non usare `git add -A` né `git add .`: elenco esplicito dei file.
- Se `git status` mostra file inattesi rispetto alla lista sopra (es. altri file toccati da sessioni successive non ancora committati), non includerli in questo commit: segnalali e basta, restano fuori perimetro.

## RIFERIMENTI

- Perimetro file Fase B: `claude/2026-07-21_prompt_authoring_faseB_panel.md`, tabella "DOVE".
- Entry di log esistente per Fase B in `docs/claude-code-log.md` (messaggio commit da riusare identico).
- Prossimo step, solo a commit pulito e build verde: `claude/2026-07-22_prompt_faseB2a_breadth_labels_compartments_badges.md`.
