# Prompt: merge 168-context into feat/168-jodie-consumer

Prompt-ID: P-2026-10-02-2147
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/jodie-consumer.md` measured)
Status: eseguito 2026-10-02 · lane merge · 9065643db · sonde di A sul trunk dopo il merge 21/21 e 23/23 (verifica visiva di Juri passata sulla lane il 2026-10-02); check:docs rosso pre-esistente, identico alla baseline del trunk

Worktree: `/Users/juridirocco/development/jjodel-168`, branch `feat/168-jodie-consumer`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/juridirocco/development/jjodel-168` on `feat/168-jodie-consumer`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-2147 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `a70f54af5`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `168-context` into the trunk with one merge commit, `--no-ff`, of the explicit sha `a1455999a`, in the shape of `36695c8b3` (the last merge commit on `feat/168-jodie-consumer`; read its body first). Merge base `8961023e1`. The branch carries, on top of the base, 5 commits:

- `a1455999a` docs(#168): close lane A, inbox entries, tickets and Status (P-2026-10-01-2301)
- `800238541` feat(#168): Jodie follows the drill-in inside the Configurator detail (P-2026-10-01-2301)
- `491e3a022` fix(#168): the consumer selection line renders in italics (P-2026-10-01-2301)
- `39b6b7cde` feat(#168): Jodie follows the Configurator selection and the profile (P-2026-10-01-2301)
- `72dca4dc3` docs(#168): discovery A, what Jodie sees in stand-alone (P-2026-10-01-2301)

The trunk carries, since the base, 18 commits:

- `a70f54af5` docs(#168): lane prompt C1, reference writes and the chat prompt
- `b079b1b15` docs: Status flip and log entry for the 168-reparent merge (P-2026-10-02-1247)
- `36695c8b3` merge: 168-reparent into feat/168-jodie-consumer (P-2026-10-02-1247)
- `e931c3609` docs: add prompt P-2026-10-02-1247, merge 168-reparent into feat/168-jodie-consumer
- `20ecaad98` docs: Status flip and log entry for lane R, suspended (P-2026-10-02-0740)
- `3a5ae1084` docs(#168): discovery R, reparent from the model root (P-2026-10-02-0740)
- `a78d614b7` docs(#168): lane prompt R, a containment move leaves the model root
- `47ede9f55` docs: Status flip and log entry for the 168-guard merge (P-2026-10-02-0732)
- `ae61c823b` merge: 168-guard into feat/168-jodie-consumer (P-2026-10-02-0732)
- `6f6c2c54b` docs: add prompt P-2026-10-02-0732, merge 168-guard into feat/168-jodie-consumer
- `ab102f3ce` docs: Status flip and log entry for the 168-measures merge (P-2026-10-02-0728)
- `6a9a45b69` merge: 168-measures into feat/168-jodie-consumer (P-2026-10-02-0728)
- `1b1f1dd48` docs: add prompt P-2026-10-02-0728, merge 168-measures into feat/168-jodie-consumer
- `8ea1e68c4` docs(#168): close lane B, inbox entry, two tickets, Status (P-2026-10-01-2302)
- `b3b9fcb9d` feat(#168): JjScript refuses what the profile does not allow (P-2026-10-01-2302)
- `ff8a28553` docs(#168): log-inbox entry and Status flip for M0 (P-2026-10-01-2300)
- `58adb6728` docs(#168): discovery M0, measures for J4 (P-2026-10-01-2300)
- `f1992b96a` docs(#168): discovery B, the profile guard for JjScript (P-2026-10-01-2302)

Measured by `lane-run merge` at 2026-10-02 21:47, trunk at `a70f54af5`:

- `git merge-tree --write-tree --name-only feat/168-jodie-consumer a1455999a`: 1 conflict: `docs/log-inbox/jodie-consumer.md`.
- Files changed since the base: 8 on the branch side, 14 on the trunk side; on both sides: `docs/log-inbox/jodie-consumer.md`.
- `git diff --name-only 8961023e1 a1455999a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `168-context` in `/Users/juridirocco/development/jjodel-168-context`; `feat/168-jodie-consumer` in `/Users/juridirocco/development/jjodel-168`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/juridirocco/.jjodel-lanes/P-2026-10-02-2147/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `a1455999a` is the tip of `168-context`; the prompt files of the branch read `Status: eseguito` at `a1455999a`; `git worktree list` shows `168-context` only in `/Users/juridirocco/development/jjodel-168-context`.
2. Measure again. `git merge-tree --write-tree --name-only feat/168-jodie-consumer a1455999a` (measured above: 1 conflict: `docs/log-inbox/jodie-consumer.md`). `git diff --name-only 8961023e1 a1455999a -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 8961023e1 feat/168-jodie-consumer` with `git diff --name-only 8961023e1 a1455999a` (measured above: `docs/log-inbox/jodie-consumer.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — feat(#168): Jodie segue la selezione del Configurator e vede solo ciò che il profilo mostra (J1, J2)` once (branch).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — fix(#168): la riga della selezione del fruitore in corsivo; la chiave della dedup si muove solo quando la riga è scritta` once (branch).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — feat(#168): Jodie segue la navigazione dentro il dettaglio del Configurator` once (branch).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — ticket: la testata di Jodie mostra «M2 · <metamodello>» nello stand-alone` once (branch).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — ticket: developer → consumer senza ricarica lascia il rail destro sul metamodello` once (branch).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — ticket: le righe di avviso di Jodie mostrano il pulsante «Source» del markdown` once (branch).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-01 — docs(#168): discovery M0, measures for J4 (annullamento, «Unsaved», riferimenti, contenimento)` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — merge: 168-measures into feat/168-jodie-consumer` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-01 — feat(#168): JjScript rifiuta ciò che il profilo non consente (J5, lane B)` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-01 — ticket: in consumer le letture JjScript nominano istanze di tipi hidden` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-01 — ticket: delete a cascata e link di contenimento toccano elementi read o hidden` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — merge: 168-guard into feat/168-jodie-consumer` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — docs(#168): discovery R, contenimento e radice del modello (sospesa, opzione d)` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — ticket: due forme di annidamento nel core, e consumatori che leggono solo model.objects` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — ticket: l'espulsione da uno slot di composizione lascia un orfano` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — ticket: se un riferimento di aggregazione debba ri-padrare l'oggetto` once (trunk).
   - `docs/log-inbox/jodie-consumer.md`: the heading `## 2026-10-02 — merge: 168-reparent into feat/168-jodie-consumer` once (trunk).
4. `git merge --no-ff --no-commit a1455999a`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: 168-context into feat/168-jodie-consumer (P-2026-10-02-2147)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `a1455999a` in `/Users/juridirocco/development/jjodel-168-context`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS.
7. `Outcome: hard-stop`: 3001 runs from `/Users/juridirocco/development/jjodel-168` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/jodie-consumer.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the 168-context merge (P-2026-10-02-2147)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/juridirocco/development/jjodel-168-context`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
