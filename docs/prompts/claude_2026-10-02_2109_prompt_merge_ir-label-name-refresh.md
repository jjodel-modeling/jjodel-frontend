# Prompt: merge ir-label-name-refresh into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-02-2109
Chat: C-2026-10-01-2349
Lane: full (merge; 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md` measured)
Status: eseguito 2026-10-02 · lane merge · fc11b841a · verifica visiva passata 2026-10-02 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-02-2109 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `79b29a7da`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `ir-label-name-refresh` into the trunk with one merge commit, `--no-ff`, of the explicit sha `fb567d6a2`, in the shape of `bc8989cdb` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `adb5d9731`. The branch carries, on top of the base, 6 commits:

- `fb567d6a2` docs: Status flip for P-2026-10-02-1645, chat check on the probe measures
- `6b62b6df5` docs: log entry and ticket, IR name label refresh (P-2026-10-02-1645)
- `8f5102d29` docs: addendum and R-IRN-39, IR name label refresh (P-2026-10-02-1645)
- `7c92ffc2c` fix: IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)
- `acf5a9fc3` docs: discovery, IR name label stale after a rename (P-2026-10-02-1645)
- `19d48ee0b` docs: add prompt P-2026-10-02-1645, IR name label keeps the old name after a rename

The trunk carries, since the base, 37 commits:

- `79b29a7da` docs: Status flip and log entry for the segment-editable-toggle merge (P-2026-10-02-1810)
- `bc8989cdb` merge: segment-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1810)
- `1ff8ab314` docs: add prompt P-2026-10-02-1810, merge segment-editable-toggle into alfonso-frontend-jjtl
- `013a4dc9c` docs: Status flip for P-2026-10-02-1646, chat check on the probe measures
- `85095bb87` docs: closure of the value segment editable toggle (P-2026-10-02-1646)
- `d8f2e61c3` fix(editor-v2): value segment toggle reads the effective default (P-2026-10-02-1646)
- `9e6adf714` docs: Status flip and log entry for the edge-ends merge (P-2026-10-02-1704)
- `0bcdac22a` merge: edge-ends into alfonso-frontend-jjtl (P-2026-10-02-1704)
- `4587049de` docs: add prompt P-2026-10-02-1704, merge edge-ends into alfonso-frontend-jjtl
- `76d2d72cc` docs: discovery of the value segment editable toggle (P-2026-10-02-1646)
- `5cc0522f0` docs: Status flip and log entry, edge-ends took the trunk (P-2026-10-02-1641)
- `cdec5e44d` docs: Status flip and log entry for the viewpoint-colors-pastel merge (P-2026-10-02-1642)
- `6519d3094` docs: add prompt P-2026-10-02-1646, value segment editable toggle reads the wrong default
- `abb05cb9f` merge: viewpoint-colors-pastel into alfonso-frontend-jjtl (P-2026-10-02-1642)
- `0c221f237` merge: edge-ends takes alfonso-frontend-jjtl (P-2026-10-02-1641)
- `bb4246523` docs: add prompt P-2026-10-02-1642, merge viewpoint-colors-pastel into alfonso-frontend-jjtl
- `a6f169ad2` docs: add prompt P-2026-10-02-1641, merge alfonso-frontend-jjtl into edge-ends
- `c80aed8bb` docs: edge-ends trunk sync, report §7, log entry, ticket, Status (P-2026-10-02-1505)
- `8b5bd6de5` docs: addendum, log entry, ticket, Status, pastel trunk sync (P-2026-10-02-1506)
- `119046cb2` fix(editor-v2): a junction trunk's marker, the bench survivor closed (P-2026-10-02-1505)
- `9e1f9fae5` fix(editor-v2): a junction trunk takes its own new-end marker (P-2026-10-02-1505)
- `25ed824fb` fix: cite the pastel rows by their trunk ids R-VP-37..39 (P-2026-10-02-1506)
- `68c3f8251` merge: alfonso-frontend-jjtl into viewpoint-colors-pastel (P-2026-10-02-1506)
- `48abe2b94` docs: discovery report for the pastel trunk sync (P-2026-10-02-1506)
- `1e1ce1334` merge: alfonso-frontend-jjtl into edge-ends (P-2026-10-02-1505)
- `b7d0885e9` docs: edge-ends trunk sync, Phase 1 report (P-2026-10-02-1505)
- `77a3596fe` docs: add prompt P-2026-10-02-1506, sync the trunk into viewpoint-colors-pastel
- `dc013e8ba` docs: add prompt P-2026-10-02-1505, sync the trunk into edge-ends
- `7d1882c5f` docs: R-VP-32..34, log entry, tickets, report addendum, Status (P-2026-09-30-2022)
- `feefa9214` feat: pastel metaclass colours, per-class overrides, reference-aware (P-2026-09-30-2022)
- `f61fc0265` docs: discovery report for pastel metaclass colours (P-2026-09-30-2022)
- `f8aea9a8f` docs: prompt viewpoint colors pastel (P-2026-09-30-2022)
- `633c22a8c` docs: slice E report §9, R-EE rows, log entry, Status (P-2026-09-30-1810)
- `462fba92d` feat(views): edge ends, the two gaps of the mutation bench closed (P-2026-09-30-1810)
- `8f3e7c307` feat(views): edge ends, seven glyphs, Conditional ends, end roles (P-2026-09-30-1810)
- `77c2f946b` docs: slice E edge ends discovery, Phase 1 report (P-2026-09-30-1810)
- `60d223baa` docs: add prompt P-2026-09-30-1810, slice E edge ends

Measured by `lane-run merge` at 2026-10-02 21:09, trunk at `79b29a7da`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fb567d6a2`: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`.
- Files changed since the base: 7 on the branch side, 37 on the trunk side; on both sides: `docs/decisions.md`, `docs/log-inbox/views.md`.
- `git diff --name-only adb5d9731 fb567d6a2 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-10-02_1645_prompt_ir_label_name_refresh.md` (eseguito 2026-10-02 · lane ir-label-name-refresh · 7c92ffc2c · Q1-Q4 adopted as recommended (unattended) · verifica della chat sulle misure della probe (before 11/18, after 21/22: renamed node re-resolves, others untouched; the one failure is the lane own two-frame bound on the metaclass rename, correct at the next read), scene 0 px, crop non ispezionati a vista · merge senza GO visivo di Alfonso: non cambia la demo (RC-26), su suo «1. proceed» del 2026-10-02).
- `git worktree list`: `ir-label-name-refresh` in `/Users/alfonso/jjodel-w-labelname`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `fb567d6a2` is the tip of `ir-label-name-refresh`; the prompt files of the branch read `Status: eseguito` at `fb567d6a2`; `git worktree list` shows `ir-label-name-refresh` only in `/Users/alfonso/jjodel-w-labelname`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl fb567d6a2` (measured above: 2 conflicts: `docs/decisions.md`, `docs/log-inbox/views.md`). `git diff --name-only adb5d9731 fb567d6a2 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only adb5d9731 alfonso-frontend-jjtl` with `git diff --name-only adb5d9731 fb567d6a2` (measured above: `docs/decisions.md`, `docs/log-inbox/views.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-IRN-39` (branch), `R-IRN-40` (trunk), `R-VP-37` (trunk), `R-VP-38` (trunk), `R-VP-39` (trunk), `R-EE-1` (trunk), `R-EE-2` (trunk), `R-EE-3` (trunk), `R-EE-4` (trunk); control: `- **R-EE-5**` none.
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — fix(editor-v2): IR node and row re-resolve on object and metaclass rename (P-2026-10-02-1645)` once (branch).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: IR edge labels and the form-hook comment after a rename` once (branch).
   - `docs/decisions.md`: the heading `## Serie R-EE — edge ends, slice E (decisioni 2026-09-30)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — fix(editor-v2): «editable inline» toggle of a value segment reads the effective value (P-2026-10-02-1646)` once (trunk).
   - `docs/log-inbox/symbol-editor.md`: the heading `## 2026-10-02 — merge: segment-editable-toggle into alfonso-frontend-jjtl (P-2026-10-02-1810)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): «Color by metaclass» v2, pastel swatches, per-metaclass overrides, reference-aware (P-2026-09-30-2022)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: colour the edges of a coloured viewpoint by source or target` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — ticket: criticalZone.test.ts goes red inside a go-ahead lane` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: the trunk into viewpoint-colors-pastel, pastel rows renumbered R-VP-37..39 (P-2026-10-02-1506)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: check:addonly reads a fold-and-rotate as a rewrite through a trunk-into-branch merge` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: viewpoint-colors-pastel into alfonso-frontend-jjtl (P-2026-10-02-1642)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-09-30 — feat(views): edge ends, seven glyphs, Conditional ends, end roles, slice E (P-2026-09-30-1810)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: alfonso-frontend-jjtl into edge-ends, slice E synced with the trunk (P-2026-10-02-1505)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — ticket: check:addonly refuses a fold and a rotation in one commit, and every trunk merge across it` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: edge-ends takes alfonso-frontend-jjtl, slice E on the trunk before its own merge (P-2026-10-02-1641)` once (trunk).
   - `docs/log-inbox/views.md`: the heading `## 2026-10-02 — merge: edge-ends into alfonso-frontend-jjtl (P-2026-10-02-1704)` once (trunk).
4. `git merge --no-ff --no-commit fb567d6a2`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: ir-label-name-refresh into alfonso-frontend-jjtl (P-2026-10-02-2109)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck 14, §17 set; `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `fb567d6a2` in `/Users/alfonso/jjodel-w-labelname`, read-only, `npx vitest run --reporter=dot` there is allowed; do not write in that tree), 0 failed, the same files red at import; hook tests (`npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 79b29a7da` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/views.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the ir-label-name-refresh merge (P-2026-10-02-2109)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-labelname`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
