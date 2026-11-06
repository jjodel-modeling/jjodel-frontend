# Prompt: merge dcn-l21 into alfonso-frontend-jjtl

Prompt-ID: P-2026-11-06-2351
Chat: C-2026-11-06-2159
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (merge of dcn-l21 launched by chat C-2026-11-06-2159)
Lane: full (merge; zero conflicts measured)
Status: da eseguire

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-11-06-2351 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `6fcf5d5df`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `dcn-l21` into the trunk with one merge commit, `--no-ff`, of the explicit sha `37fc696f7`, in the shape of `59b532f43` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `895669463`. The branch carries, on top of the base, 13 commits:

- `37fc696f7` docs(dcn): L2.1 log entry and Status flip (P-2026-11-06-2300)
- `d51def3e7` feat(onto): featureSources in the binding, dormant slots in the closure (P-2026-11-06-2300)
- `12d1e16bb` docs(dcn): R-DCN-9..21 from discovery Q1..Q13, L2.1 prompt
- `e357a15fe` docs(dcn): Status flips of the foundations discovery (P-2026-11-06-2250)
- `7d3a33cbc` docs(dcn): foundations discovery, §7 decisions Q1..Q13 (P-2026-11-06-2250)
- `d635e43a1` docs(dcn): foundations discovery, §6 lane plan (P-2026-11-06-2250)
- `c80715205` docs(dcn): foundations discovery, §0 answer in brief (P-2026-11-06-2250)
- `a41c9078e` docs(dcn): discovery continuation prompt (P-2026-11-06-2250)
- `6ebd9d064` docs(dcn): foundations discovery, §4 self.in and §5 exporter (P-2026-11-06-2240)
- `4fb9bafab` docs(dcn): foundations discovery, §3 line citations (P-2026-11-06-2240)
- `5a90a9c1f` docs(dcn): foundations discovery, §3 second nucleus (P-2026-11-06-2240)
- `9af507690` docs(dcn): foundations discovery, §2 metamodel (P-2026-11-06-2240)
- `c35064743` docs(dcn): foundations discovery, §0-§1 dormant slots (P-2026-11-06-2240)

The trunk carries, since the base, 29 commits:

- `6fcf5d5df` docs: open front multi-tab, R-MT-1..4, discovery prompt
- `59b532f43` merge: textual-d1-comment-guard into alfonso-frontend-jjtl (P-2026-11-06-2326)
- `966fab975` docs: add prompt P-2026-11-06-2326, merge textual-d1-comment-guard into alfonso-frontend-jjtl
- `275eec130` docs: Status flip and log entry for D1 (P-2026-11-06-2301)
- `8049bf81b` docs: Status flip and log entry for the textual-c2e-ir-chip merge (P-2026-11-06-2302)
- `87ca3f547` feat(codegen): D1, commenting an object out asks first (P-2026-11-06-2301)
- `ad6da074b` merge: textual-c2e-ir-chip into alfonso-frontend-jjtl (P-2026-11-06-2302)
- `2e87b96f5` docs: R-FA-12 boundary ratified, R-FA-13 builtin errors name the rule
- `48ea40eec` docs: add prompt P-2026-11-06-2302, merge textual-c2e-ir-chip into alfonso-frontend-jjtl
- `53359fde7` docs: Status flip and log entry for C2e (P-2026-11-06-2041)
- `7edac8f1a` docs: add prompt P-2026-11-06-2301, D1, commenting an object out asks first
- `7d171b504` docs: Status flip and log entry for the textual-d-writing-aids merge (P-2026-11-06-2243)
- `77a912e14` merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-06-2243)
- `baec942aa` fix(editor-v2): label a nameless target `: <Class>` on the IR form (P-2026-11-06-2041)
- `7f360576e` docs: add prompt P-2026-11-06-2243, merge textual-d-writing-aids into alfonso-frontend-jjtl
- `54f38d163` test(smoke): seed the 3.1.1 welcome key
- `845f7612f` docs: Status flip and log entry for D2c (P-2026-11-06-2213)
- `f5fb02d8b` feat(codegen): D2c, the completion provider of the Text tab (P-2026-11-06-2213)
- `43435c106` docs: add prompt P-2026-11-06-2213, D2c, the completion provider
- `6cdf303ec` docs: Status flip and log entry for D2b (P-2026-11-06-2146)
- `387e558d7` feat(codegen): D2b C2, completion candidates in the language service (P-2026-11-06-2146)
- `b0b1139df` refactor(codegen): D2b C3, the printer's names and paths exported (P-2026-11-06-2146)
- `9434c8dc6` docs: add prompt P-2026-11-06-2146, D2b, completion candidates
- `69dd6f11e` docs: Status flip and log entry for D2a (P-2026-11-06-2118)
- `e23c3870c` test(codegen): D2a, a cursor changes nothing but the expected set (P-2026-11-06-2118)
- `c4a545aa3` feat(codegen): D2a, the expected set at a cursor (P-2026-11-06-2118)
- `582be338c` docs: add prompt P-2026-11-06-2118, D2a, the expected set at a cursor
- `ed9054afd` docs(editor-v2): C2e Phase 1, Layer Impact Report (P-2026-11-06-2041)
- `2edce622d` docs: add prompt claude_2026-11-06_2041_prompt_textual_c2e_ir_chip.md

Measured by `lane-run merge` at 2026-11-06 23:51, trunk at `6fcf5d5df`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 37fc696f7`: zero conflicts.
- Files changed since the base: 12 on the branch side, 26 on the trunk side; on both sides: `docs/decisions.md`.
- `git diff --name-only 895669463 37fc696f7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: `claude_2026-11-06_2250_prompt_dcn_foundations_discovery_cont.md` (eseguito 2026-11-06 · lane full · discovery, no code · report docs/discovery/discovery_2026-11-06_dcn_foundations.md (§0, §6, §7, c80715205..7d3a33cbc) · hard stop, Q1-Q13 to ratify), `claude_2026-11-06_2300_prompt_dcn_l21_feature_sources.md` (eseguito 2026-11-06 · lane dcn · d51def3e7 · bench 24/24 killed · verifica visiva non applicabile (RC-17)).
- `git worktree list`: `dcn-l21` in no worktree; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `37fc696f7` is the tip of `dcn-l21`; the prompt files of the branch read `Status: eseguito` at `37fc696f7`; `git worktree list` shows `dcn-l21` only in no worktree.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 37fc696f7` (measured above: zero conflicts). `git diff --name-only 895669463 37fc696f7 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only 895669463 alfonso-frontend-jjtl` with `git diff --name-only 895669463 37fc696f7` (measured above: `docs/decisions.md`). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-DCN-9` (branch), `R-DCN-10` (branch), `R-DCN-11` (branch), `R-DCN-12` (branch), `R-DCN-13` (branch), `R-DCN-14` (branch), `R-DCN-15` (branch), `R-DCN-16` (branch), `R-DCN-17` (branch), `R-DCN-18` (branch), `R-DCN-19` (branch), `R-DCN-20` (branch), `R-DCN-21` (branch), `R-FA-13` (trunk), `R-MT-1` (trunk), `R-MT-2` (trunk), `R-MT-3` (trunk), `R-MT-4` (trunk); control: `- **R-MT-5**` none.
   - `docs/log-inbox/dcn.md`: the heading `## 2026-11-06 — feat: featureSources in the ontological binding, dormant slots in the feature closure` once (branch).
   - `docs/decisions.md`: the heading `## R-MT: several tabs on models, each with its own viewpoint (decisions 2026-11-06)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2a, the expected set at a cursor (P-2026-11-06-2118)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2b, completion candidates in the language service (P-2026-11-06-2146)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D2c, the completion provider of the Text tab (P-2026-11-06-2213)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-d-writing-aids into alfonso-frontend-jjtl (P-2026-11-06-2243)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — fix(editor-v2): C2e, a nameless reference target is labelled `: <Class>` on the IR form (P-2026-11-06-2041)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — merge: textual-c2e-ir-chip into alfonso-frontend-jjtl (P-2026-11-06-2302)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-11-06 — feat(codegen): D1, commenting an object out asks first (P-2026-11-06-2301)` once (trunk).
4. `git merge --no-ff --no-commit 37fc696f7`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: dcn-l21 into alfonso-frontend-jjtl (P-2026-11-06-2351)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `37fc696f7` in no worktree, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from `no worktree/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard 6fcf5d5df` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only 6fcf5d5df HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/dcn.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the dcn-l21 merge (P-2026-11-06-2351)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in no worktree.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
