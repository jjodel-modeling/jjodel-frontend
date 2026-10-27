# Prompt: merge vp-glyph-nocolor into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-02-2315
Chat: —
Lane: full (merge; 1 conflict: `docs/log-inbox/views.md` measured)
Status: non eseguito 2026-10-02 · superseded by P-2026-10-02-2330 · the direct worker stopped at Outcome: blocked before any merge commit (the incoming vitest gate found no vitest: the lane P-2026-10-02-2045 had removed its node_modules symlink from ~/jjodel-w-vpglyph); symlink restored by the chat, merge rerun as P-2026-10-02-2330

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-2315 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `872d0abe8`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `vp-glyph-nocolor` into the trunk with one merge commit, `--no-ff`, of the explicit sha `e6bbc9829`, in the shape of `949e0c75d` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `1ff8ab314`. The branch carries, on top of the base, 4 commits:

- `e6bbc9829` docs: report addendum, R-VP-50, log entry, ticket, Status (P-2026-10-02-2045)
- `00b16d998` fix(views): notation glyphs keep their colours under Color by metaclass (P-2026-10-02-2045)
- `353fa49b4` docs: discovery, notation glyphs out of Color by metaclass (P-2026-10-02-2045)
- `c14dc0c67` docs: add prompt P-2026-10-02-2045, notation glyphs out of Color by metaclass

The trunk carries, since the base, 28 commits:

- `872d0abe8` docs: proposal for the simulator state UI (R-SIM-P1..P8, accepted 2026-10-02)
- `8d7eab8cb` docs: Status flip and log entry for the path-label-edit merge (P-2026-10-02-2157)
- `949e0c75d` merge: path-label-edit into alfonso-frontend-jjtl (P-2026-10-02-2157)
- `d75bd00dd` docs: add prompt P-2026-10-02-2157, merge path-label-edit into alfonso-frontend-jjtl
- `3aa9dd34f` docs: Status flip and log entry, path-label-edit took the trunk (P-2026-10-02-2132)
- `1dff977e4` merge: path-label-edit takes alfonso-frontend-jjtl (P-2026-10-02-2132)
- `641fc9a57` docs: add prompt P-2026-10-02-2132, path-label-edit takes the trunk
- `936a1b947` docs: Status flip and log entry for the ir-label-name-refresh merge (P-2026-10-02-2109)
- `c0dfec656` docs: Status flip for P-2026-10-02-1647, chat check on the probe measures
- `52271ce80` docs: R-IRN-41, log entry, undo ticket and Status for path label edit (P-2026-10-02-1647)
- `fc11b841a` merge: ir-label-name-refresh into alfonso-frontend-jjtl (P-2026-10-02-2109)
- `8705c9fdc` docs: add prompt P-2026-10-02-2109, merge ir-label-name-refresh into alfonso-frontend-jjtl
- `79b29a7da` docs: Status flip and log entry for the segment-editable-toggle merge (P-2026-10-02-1810)
- `fb567d6a2` docs: Status flip for P-2026-10-02-1645, chat check on the probe measures
- `bc8989cdb` merge: segment-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1810)
- `6b62b6df5` docs: log entry and ticket, IR name label refresh (P-2026-10-02-1645)
- `8f5102d29` docs: addendum and R-IRN-39, IR name label refresh (P-2026-10-02-1645)
- `013a4dc9c` docs: Status flip for P-2026-10-02-1646, chat check on the probe measures
- `aa04b92fb` feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)
- `85095bb87` docs: closure of the value segment editable toggle (P-2026-10-02-1646)
- `d8f2e61c3` fix(editor-v2): value segment toggle reads the effective default (P-2026-10-02-1646)
- `ddb7a8c16` docs: discovery report, path label editable on the canvas (P-2026-10-02-1647)
- `7c92ffc2c` fix: IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)
- `acf5a9fc3` docs: discovery, IR name label stale after a rename (P-2026-10-02-1645)
- `76d2d72cc` docs: discovery of the value segment editable toggle (P-2026-10-02-1646)
- `7bb901a12` docs: add prompt P-2026-10-02-1647, path label editable on the canvas
- `6519d3094` docs: add prompt P-2026-10-02-1646, value segment editable toggle reads the wrong default
- `19d48ee0b` docs: add prompt P-2026-10-02-1645, IR name label keeps the old name after a rename

Measured by `lane-run merge` at 2026-10-02 23:15, trunk at `872d0abe8`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e6bbc9829`: 1 conflict: `docs/log-inbox/views.md`.
- Files changed since the base: 9 on the branch side, 26 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`.
- `git diff --name-only 1ff8ab314 e6bbc9829 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-02_2045_prompt_vp_glyph_nocolor.md` (eseguito 2026-10-02 · lane vp-glyph-nocolor · 353fa49b4, 00b16d998 · non fuso: hard-stop, derived glyphs (bars, ink discs, bull's-eyes, Petri bars) not coloured, lane probe on 3097 (light) 30/30 and the base run 17/17, the four default scenes 0 px, mutation bench 14/14, crops in frontend/scripts/smoke/_tmp_vpglyph_crops/ (gitignored), R-VP-50, Statechart's entry mark not changed (ticket), verifica visiva alla chat).
- `git worktree list`: `vp-glyph-nocolor` in `/Users/alfonso/jjodel-w-vpglyph`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Direct.** Merged by `lane-run merge --direct`, no session: the gates and the outcome are in `/Users/alfonso/.jjodel-lanes/P-2026-10-02-2315/result.json`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `e6bbc9829` is the tip of `vp-glyph-nocolor`; the prompt files of the branch read `Status: eseguito` at `e6bbc9829`; `git worktree list` shows `vp-glyph-nocolor` only in `/Users/alfonso/jjodel-w-vpglyph`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl e6bbc9829` (measured above: 1 conflict: `docs/log-inbox/views.md`). `git diff --name-only 1ff8ab314 e6bbc9829 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 1ff8ab314 alfonso-frontend-jjtl` with `git diff --name-only 1ff8ab314 e6bbc9829` (measured above: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-VP-50` (branch), `R-IRN-40` (trunk), `R-IRN-39` (trunk), `R-IRN-41` (trunk); control: `- **R-IRN-42**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(views): notation glyphs out of «Color by metaclass» (P-2026-10-02-2045)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: name-ink marks outside a coloured node take its text colour` once (branch).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — fix(editor-v2): «editable inline» toggle of a value segment reads the effective value (P-2026-10-02-1646)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: segment-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1810)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — feat(editor-v2): a path label on one attribute edits on the canvas (P-2026-10-02-1647)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — ticket: one undo does not restore a slot value written by syncUpdateFeatureValue` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: path-label-edit takes alfonso-frontend-jjtl, the path label on the trunk before its own merge (P-2026-10-02-2132)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: path-label-edit into alfonso-frontend-jjtl (P-2026-10-02-2157)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(editor-v2): IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: IR edge labels and the form-hook comment after a rename` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: ir-label-name-refresh into alfonso-frontend-jjtl (P-2026-10-02-2109)` once (trunk).
4. `git merge --no-ff --no-commit e6bbc9829`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: vp-glyph-nocolor into alfonso-frontend-jjtl (P-2026-10-02-2315)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `e6bbc9829` in `/Users/alfonso/jjodel-w-vpglyph`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 872d0abe8` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the vp-glyph-nocolor merge (P-2026-10-02-2315)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-vpglyph`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
