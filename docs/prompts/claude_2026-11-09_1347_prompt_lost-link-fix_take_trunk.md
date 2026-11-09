# Prompt: lost-link-fix takes the trunk before its own merge

Prompt-ID: P-2026-11-09-1347
Chat: —
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge of the trunk into the branch; zero conflicts measured)
Status: eseguito 2026-11-09 · lane lost-link-fix · 067e796bc

Worktree: `/Users/alfonso/jjodel-w-lostfix`, branch `lost-link-fix`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-lostfix`, branch `lost-link-fix`, `git log -1` is the commit that adds this file (its parent `646c78b89`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`, `MERGE_HEAD` absent. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-09-1347 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

RC-14: a branch resolves its conflicts with the trunk on the branch, before the trunk takes it. Bring the trunk `alfonso-frontend-jjtl` at the explicit sha `7571f8a53` into `lost-link-fix` with one merge commit, `--no-ff`, in the shape of `7255e5c36` (the last merge commit on `lost-link-fix`; read its body first). Merge base `53e89405f`. The trunk brings, since the base, 50 commits:

- `7571f8a53` docs: Status flip and log entry for the oi-rail merge (P-2026-11-09-1209)
- `b103b2481` merge: oi-rail into alfonso-frontend-jjtl (P-2026-11-09-1209)
- `de3440898` docs: add prompt P-2026-11-09-1209, merge oi-rail into alfonso-frontend-jjtl
- `b292b3d1b` docs: Status flip and log entry for the rail in a split pane (P-2026-11-09-1115)
- `2d874313a` chore(probe): the rail in a split pane, SP-0..SP-6 (P-2026-11-09-1115)
- `e52cfa569` fix(editor-v2): the rail in a split pane, click centre and drop guard (P-2026-11-09-1115)
- `a031db094` docs: add prompt P-2026-11-09-1115, rail in a split pane
- `5d9537948` docs: Status flip and log entry, oi-rail took the trunk (P-2026-11-09-0943)
- `a1cb914c0` merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)
- `4cc6384f4` docs: add prompt P-2026-11-09-0943, merge alfonso-frontend-jjtl into oi-rail
- `04246f1ca` docs: checkpoint instance-of update, levels, class rail, S4 (C-2026-10-25-2159)
- `355ee1537` docs: S2-L28 entry, R-OI-22 amendment, two Status flips (P-2026-11-08-2214)
- `4ee0983ac` chore(probe): S2-L28 controls and undo trace, S4 handle reach (P-2026-11-08-2214)
- `a102c23a5` fix(editor-v2): one undo removes a class-level generalization (P-2026-11-08-2214)
- `7a972ed03` docs: add prompt P-2026-11-08-2214, class fixes continuation
- `a5f657409` fix(editor-v2): attribute defaults, row growth, generalization owner (P-2026-11-08-2146)
- `065d35fa6` docs: add prompt P-2026-11-08-2146, class diagram fixes
- `459ac12e4` docs: R-OI-24, S4 links entry, two Status flips (P-2026-11-08-2041)
- `2bed6cb5c` chore(probe): S4 links between instances, 14/14 (P-2026-11-08-2041)
- `21cf3a99e` fix(editor-v2): a link goes in the container of R-OI-22 (P-2026-11-08-2041)
- `64ad665bc` docs: add prompt P-2026-11-08-2041, S4 links continuation
- `d9b1912f9` feat(editor-v2): a link drawn between two instances (P-2026-11-08-2012)
- `dde9b5466` docs: add prompt P-2026-11-08-2012, S4 links between instances
- `7da4590f6` docs: R-OI-21..R-OI-23, class rail entry, two Status flips (P-2026-11-08-1822)
- `3f399f545` chore(probe): class rail checks, S2-L5 and S2-L6 amended (P-2026-11-08-1822)
- `6e0b772ca` docs: add prompt P-2026-11-08-1822, class rail continuation
- `b8b9bfe30` feat(editor-v2): class-level rail and pane menu from the binding (P-2026-11-08-1753)
- `57c722dec` docs: add prompt P-2026-11-08-1753, class-level rail from the binding
- `0b12cf59a` docs: R-OI-19, R-OI-20, levels entry, four Status flips (P-2026-11-08-1726)
- `b8fbddd72` chore(probe): onto levels block S2-L0..L10 (P-2026-11-08-1726)
- `d85e06388` docs: add prompt P-2026-11-08-1726, level surfaces continuation
- `a709a12b1` feat(editor-v2): instance surfaces follow the viewpoint's level (P-2026-11-08-1658)
- `f418a18ce` docs: add prompt P-2026-11-08-1658, level-aware creation surfaces
- `4d736d663` docs: addendum to onto levels discovery, probe run (P-2026-11-08-1635)
- `940959760` docs: discovery onto levels, class rail, links (P-2026-11-08-1635)
- `2b69e0c4f` docs: add prompt P-2026-11-08-1635, levels discovery continuation
- `33455491b` docs: add prompt P-2026-11-08-1605, discovery levels, class rail, links
- `fe6e1b22c` docs: checkpoint instance-of 2026-11-08 (C-2026-10-25-2159)
- `0688d25fa` docs: close onto rail lanes, R-OI-18, log entry (P-2026-11-08-0241)
- `ba69124a9` chore(probe): onto rail S2-R0..R4 (P-2026-11-08-0212)
- and 10 more: `git log --oneline 53e89405f..7571f8a53`

This branch brings, 14 commits:

- `646c78b89` docs(dcn): close the queued appends fix, entry and status (P-2026-11-09-1323)
- `3b7e06289` docs(dcn): LIR measures, two drops before and after (P-2026-11-09-1323)
- `d3f989d5c` docs(dcn): prompt to close the queued appends fix (P-2026-11-09-1323)
- `0971567bb` test(editor-v2): landed entry in flight, every slot settled (P-2026-11-09-1227)
- `c3eabab15` test(dcn): arms keep both writes, two real drops (P-2026-11-09-1227)
- `3d567c77a` fix(editor-v2): queue slot appends so a burst keeps every write (P-2026-11-09-1227)
- `f9b8f2e2a` feat(editor-v2): queue of slot appends not yet in the store (P-2026-11-09-1227)
- `6b66f67ad` docs(dcn): Layer Impact Report of the queued appends (P-2026-11-09-1227)
- `f840dac52` docs(dcn): prompt for the queued appends fix (P-2026-11-09-1227)
- `95dbfaacb` docs(dcn): Status of the lost containment discovery prompt (P-2026-11-09-1020)
- `08ee13b31` docs(dcn): Status flip of the lost containment discovery (P-2026-11-09-1020)
- `b7b4817b1` docs(dcn): lost containment write discovery (P-2026-11-09-1020)
- `780b0b99e` test(dcn): probe of the lost containment write (P-2026-11-09-1020)
- `285600ecb` docs(dcn): prompt P-2026-11-09-1020

Measured by `lane-run merge --trunk-into` at 2026-11-09 13:47, trunk at `7571f8a53`:

- `git merge-tree --write-tree --name-only lost-link-fix 7571f8a53`: zero conflicts.
- Files changed since the base: 12 on the branch side, 43 on the trunk side; on both sides: `frontend/src/components/editor-v2/EditorV2.tsx`.
- `git diff --name-only 53e89405f 646c78b89 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-09_1020_prompt_lost_containment_discovery.md` (eseguito 2026-11-09 · lane discovery · b7b4817b1), `claude_2026-11-09_1227_prompt_lost_link_fix.md` (eseguito 2026-11-09 · lane lost-link-fix · 0971567bb), `claude_2026-11-09_1323_prompt_lost_link_fix_close.md` (eseguito 2026-11-09 · lane lost-link-fix · 3b7e06289).
- `git worktree list`: `lost-link-fix` in `/Users/alfonso/jjodel-w-lostfix`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

## COME

1. Preconditions above, plus: `7571f8a53` is the tip of `alfonso-frontend-jjtl` (if a docs-only commit moved it, say so and merge `7571f8a53` all the same); `git worktree list` shows `alfonso-frontend-jjtl` only in `/Users/alfonso/jjodel-release`.
2. Measure again: `git merge-tree --write-tree --name-only lost-link-fix 7571f8a53` (measured above: zero conflicts). A conflict in any file outside `docs/decisions.md` and `docs/log-inbox/*.md`: **stop** with `Outcome: question` and the conflict hunks quoted; do not resolve code by hand in this lane.
3. `git merge --no-ff --no-commit 7571f8a53`.
4. Resolve `docs/decisions.md`, if it conflicts, by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block, each section heading once. Resolve every `docs/log-inbox/*.md` that conflicts by union: preamble, the trunk's entries, then the branch's entries, all verbatim, each heading once. Probes on the resolved tree, each counted with `grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-OI-18` (trunk), `R-OI-19` (trunk), `R-OI-20` (trunk), `R-OI-21` (trunk), `R-OI-22` (trunk), `R-OI-23` (trunk), `R-OI-24` (trunk); control: `- **R-OI-25**` none.
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-09 — fix: queued slot appends keep every write of a burst (P-2026-11-09-1227, P-2026-11-09-1323)` once (branch).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: onto binding editor with Detect, probe and bench (P-2026-11-08-0151)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: value kinds can be edited in the binding editor but not added` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: «Instances of» rail section, probe, regression, bench (P-2026-11-08-0241)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the viewpoint's level gates the instance surfaces (P-2026-11-08-1726)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: the class rail and pane menu from the binding, probe, bench (P-2026-11-08-1822)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — feat: a link drawn between two instances, probe, bench (P-2026-11-08-2041)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — fix: class diagram defects, one undo for the generalization, handle reach (P-2026-11-08-2214)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-08 — ticket: one undo does not remove an object-as-edge outside level class` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — merge: oi-rail takes alfonso-frontend-jjtl (P-2026-11-09-0943)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — fix: the rail in a split pane, click centre and drop guard (P-2026-11-09-1115)` once (trunk).
   - `docs/log-inbox/instance-of.md`: the heading `## 2026-11-09 — merge: oi-rail into alfonso-frontend-jjtl (P-2026-11-09-1209)` once (trunk).
5. On the resolved tree, before committing, read every file changed on both sides once from top to bottom (`frontend/src/components/editor-v2/EditorV2.tsx`); an auto-merge is a textual result, not a semantic one: no conflict marker, no duplicated declaration, hook or selector, one root per component.
6. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: lost-link-fix takes alfonso-frontend-jjtl (P-2026-11-09-1347)`. Body: the two sides' shas, the merge-tree measurement, the union resolutions, the reading of step 5, `Model:` and `Co-Authored-By` trailers.
7. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: state the expectation first as the trunk tip's count (measure it read-only in `/Users/alfonso/jjodel-release` with `node /Users/alfonso/jjodel-w-lostfix/frontend/scripts/run-quiet.mjs vitest-trunk -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-release`/frontend`, the runner's log goes to this tree's `.agent-logs/`; do not write there) plus the tests this branch added, 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 646c78b89` (this branch's own pre-merge tip; the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 8.
8. `Outcome: hard-stop`: the chat re-runs the visual probes of the branch on this tree and gives the GO. Do not start a server.
9. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane lost-link-fix · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/dcn.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry, lost-link-fix took the trunk (P-2026-11-09-1347)` (P16, RC-17). `Outcome: done`. The merge of `lost-link-fix` into the trunk gets its own prompt (`lane-run merge lost-link-fix --into alfonso-frontend-jjtl`).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 7), `git checkout -- .`, `git clean`, `--no-verify`, a hand edit to a code file, editing any line inside a decision block or a log entry, rebase, squash, push, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-release`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge --trunk-into` from `frontend/scripts/lane-templates/trunk-into-branch.md`, in the shape of `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md`.
