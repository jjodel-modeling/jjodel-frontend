# Prompt: merge library-gallery into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-21-1518
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-21-1518 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `8f3e52ef3`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `library-gallery` into the trunk with one merge commit, `--no-ff`, of the explicit sha `dcc7c19d0`, in the shape of `61164a7c8` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `213243815`. The branch carries, on top of the base, 62 commits:

- `dcc7c19d0` docs: Status of P-2026-10-21-1415 (trunk taken into library-gallery)
- `ee2ddcb8e` merge: library-gallery takes alfonso-frontend-jjtl (P-2026-10-21-1415)
- `948340640` docs: add prompt P-2026-10-21-1415, merge alfonso-frontend-jjtl into library-gallery
- `6355b1672` merge: tpl-int, templates 3.2 lanes L-B1, L-B2, L-C, L-C2, L-D, L-E into library-gallery
- `28babece1` docs(log-inbox): rebuild templates-ui entries lost in the tpl-int merges
- `643e4fe20` Merge branch 'tpl-c2' into tpl-int
- `ab549528a` Merge branch 'tpl-e' into tpl-int
- `e0bda6326` docs: File › New report, log and status (P-2026-10-19-1650)
- `1c3d9460e` feat(navbar): File › New in the 3.2 structure (P-2026-10-19-1650)
- `057ccca08` docs: cropped template previews, report, log and status (P-2026-10-19-1651)
- `f120bd3cf` feat(library): crop template previews to the root class (P-2026-10-19-1651)
- `efe29b172` fix(dashboard): no left bar on the active sidebar item
- `6dda053ff` fix(templates): template ids follow the app bar mode switch
- `f72fd0163` fix(templates): white card and preview, as the handoff says
- `4d683d9c0` docs: add prompts P-2026-10-19-1650 (File › New) and 1651 (readable previews)
- `5956fcefa` docs: add prompts P-2026-10-19-1650 (File › New) and 1651 (readable previews)
- `ab3755454` Merge branch 'tpl-d' into tpl-int
- `1f8f0806b` Merge branch 'tpl-c' into tpl-int
- `8f9997e14` Merge branch 'tpl-b2' into tpl-int
- `03b9d4585` docs(library): closure of the gallery lanes, visual check passed (P-2026-10-19-0930)
- `ecfa139aa` docs: New model dialog, L-D report and log (P-2026-10-19-1618)
- `6d70d38c1` feat(project): New model dialog, metamodel tab only (P-2026-10-19-1618)
- `1fefd728f` docs(templates): L-B1 report section, log entry, status (P-2026-10-19-1615)
- `64e220112` docs(library): catalog level, concepts, callout, preview (P-2026-10-19-1615)
- `88f109b65` feat(templates): search, concept and level filters, card previews (P-2026-10-19-1615)
- `2ec9bcd8b` docs: gallery preview snapshots, L-C report, log, Status (P-2026-10-19-1617)
- `2e8cd5a7a` feat(library): gallery preview snapshots, seven PNGs (P-2026-10-19-1617)
- `b9a4c80a4` docs: L-B2 report section, log entry, Status (P-2026-10-19-1616)
- `b25c41db8` feat(dashboard): sidebar active state, no FILTERS or tip on Templates (P-2026-10-19-1616)
- `7db92862d` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `ba5c937fe` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `d31d4ff25` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `86854b0e3` docs: add prompts P-2026-10-19-1615..1618, templates 3.2 lanes L-B1, L-B2, L-C, L-D
- `8f0840e42` docs(discovery): templates, notations, file new (P-2026-10-19-1510)
- `e4192a3d7` docs: add prompt P-2026-10-19-1510, templates/notations/file new discovery
- `1ce53a8cf` docs(design): templates, notations, file new handoff (3.2, R-LIB)
- `e1bb5db65` fix(library): Petri example tokens hidden while a run is active (P-2026-10-19-0930)
- `15fac4bfa` docs(library): catalog sha256 of petri-producer-consumer@1 (P-2026-10-19-0930)
- `50ab1d74c` feat(ir): simActive predicate, true while a run shows an element's model (P-2026-10-19-0930)
- `790c059f5` docs: add prompt P-2026-10-19-0930 (IR simActive predicate)
- and 22 more: `git log --oneline 213243815..dcc7c19d0`

The trunk carries, since the base, 6 commits:

- `8f3e52ef3` docs: prompt for Tack v0b, first run on a repository with no session (P-2026-10-21-1500)
- `05701dc61` docs: Status flip and log entry for the tack-v0 merge (P-2026-10-21-1438)
- `61164a7c8` merge: tack-v0 into alfonso-frontend-jjtl (P-2026-10-21-1438)
- `859e7471d` docs: add prompt P-2026-10-21-1438, merge tack-v0 into alfonso-frontend-jjtl
- `31f34732b` docs: Status flip and log entry for the Tack v0 closure (P-2026-10-21-1330)
- `daa7c6077` feat(tack): v0.1.0, bounded repos output, install section (P-2026-10-21-1330)

Measured by `lane-run merge` at 2026-10-21 15:18, trunk at `8f3e52ef3`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dcc7c19d0`: zero conflicts.
- Files changed since the base: 120 on the branch side, 9 on the trunk side; on both sides: none.
- `git diff --name-only 213243815 dcc7c19d0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-21_1415_prompt_library-gallery_take_trunk.md` (eseguito 2026-10-21 · lane library-gallery · ee2ddcb8e · 12 docs conflicts, branch side (11) and union (1); typecheck, build, check:docs, check:scripts green; vitest 11507, 3 files red under load, green on rerun).
- `git worktree list`: `library-gallery` in `/Users/alfonso/jjodel-w-gallery`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `dcc7c19d0` is the tip of `library-gallery`; the prompt files of the branch read `Status: eseguito` at `dcc7c19d0`; `git worktree list` shows `library-gallery` only in `/Users/alfonso/jjodel-w-gallery`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl dcc7c19d0` (measured above: zero conflicts). `git diff --name-only 213243815 dcc7c19d0 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 213243815 alfonso-frontend-jjtl` with `git diff --name-only 213243815 dcc7c19d0` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: import loses the user-defined megamodel edges: registered under the file's project id` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: library gallery, five R-LIB-5 projects built and cloned from Templates (P-2026-10-18-1800)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: the app-bar mode control shows Basic after leaving All Projects, the stored mode is advanced` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: derived viewpoints in the five gallery projects, S1b (P-2026-10-18-2150)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — feat: gallery templates and examples, versioned, deep link, hand-written viewpoints (P-2026-10-18-2300)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-18 — ticket: edges end about 5 px off the node border in every diagram` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-19 — feat: hand-written viewpoints for the two gallery examples (P-2026-10-19-0300)` once (branch).
   - `docs/log-inbox/notation-library.md`: the heading `## 2026-10-19 — feat: IR predicate simActive, the Petri example's tokens hidden during a run (P-2026-10-19-0930)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — fix: template previews cropped to the root class, lane L-C2 (P-2026-10-19-1651)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: File › New in the 3.2 structure, lane L-E (P-2026-10-19-1650)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: New model dialog, metamodel tab only, lane L-D (P-2026-10-19-1618)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: gallery preview snapshots, lane L-C (P-2026-10-19-1617)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: dashboard sidebar and quick tip on Templates, lane L-B2 (P-2026-10-19-1616)` once (branch).
   - `docs/log-inbox/templates-ui.md`: the heading `## 2026-10-19 — feat: templates page, catalog fields and filters, lane L-B1 (P-2026-10-19-1615)` once (branch).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — feat: Tack v0 closure, v0.1.0, bounded repos output, first run on two foreign repositories` once (trunk).
   - `docs/log-inbox/tack.md`: the heading `## 2026-10-21 — merge: tack-v0 into alfonso-frontend-jjtl (P-2026-10-21-1438)` once (trunk).
4. `git merge --no-ff --no-commit dcc7c19d0`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: library-gallery into alfonso-frontend-jjtl (P-2026-10-21-1518)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `dcc7c19d0` in `/Users/alfonso/jjodel-w-gallery`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-gallery`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 8f3e52ef3` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 8f3e52ef3 HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of the `docs/log-inbox/` file of this branch's front (the branch adds headings to `docs/log-inbox/notation-library.md`, `docs/log-inbox/templates-ui.md`), both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the library-gallery merge (P-2026-10-21-1518)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-gallery`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
