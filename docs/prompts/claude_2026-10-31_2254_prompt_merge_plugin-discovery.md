# Prompt: merge plugin-discovery into alfonso-frontend-jjtl

Prompt-ID: P-2026-10-31-2254
Chat: C-2026-10-31-1743
Request: none (rendered by lane-run, no chat URL known for no --chat)
Lane: full (merge; zero conflicts measured)
Status: eseguito 2026-10-31 · lane merge · 4ac40a8ef · verifica visiva passata 2026-10-31 (chat, unattended; Alfonso in the morning digest)

Worktree: `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop with `Outcome: blocked`. Every reply opens with `[P-2026-10-31-2254 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

**Other chats.** Two merges never run at once in this tree: if the tree is dirty, a merge is in progress (`MERGE_HEAD`), or the trunk tip is not the commit that adds this file (its parent `cac7522dd`), stop and say what you see. If the tip moved because another chat added a docs-only commit on top, say so, accept it as part of the trunk, and continue: only a dirty tree or a running merge is a stop.

## COSA

Bring `plugin-discovery` into the trunk with one merge commit, `--no-ff`, of the explicit sha `c97fccffc`, in the shape of `4586d0e17` (the last merge commit on `alfonso-frontend-jjtl`; read its body first). Merge base `de519893f`. The branch carries, on top of the base, 4 commits:

- `c97fccffc` docs: log entry and status of plugin discovery (P-2026-10-31-1800)
- `1ea149576` docs(discovery): plugin mechanism census and sandbox probe (P-2026-10-31-1800)
- `6980be947` docs(discovery): plugin sandbox harness (P-2026-10-31-1800)
- `a298231e0` test(probe): plugin sandbox probe (P-2026-10-31-1800)

The trunk carries, since the base, 43 commits:

- `cac7522dd` docs: Status flip and log entry for the spec-prompt-typed merge (P-2026-10-31-2230)
- `4586d0e17` merge: spec-prompt-typed into alfonso-frontend-jjtl (P-2026-10-31-2230)
- `92e099b78` docs: add prompt P-2026-10-31-2240, project open code consent discovery
- `a20220f45` docs(decisions): R-PLG-1..11, the plugin mechanism
- `6efbeba90` docs: add prompt P-2026-10-31-2230, merge spec-prompt-typed into alfonso-frontend-jjtl
- `164a91bce` docs: Status flip and log entry for SPEC 3.5 prompt forms (P-2026-10-31-2025)
- `8e5ee511b` docs(jjtl): SPEC 3.5 documents prompt(message, Type [, default]) (P-2026-10-31-2025)
- `0f52d6fe9` docs(prompts): add P-2026-10-31-2025
- `f5900d52b` docs: Status flip and log entry for the jjtl-jjel-parity merge (P-2026-10-31-2011)
- `03e53f926` merge: jjtl-jjel-parity into alfonso-frontend-jjtl (P-2026-10-31-2011)
- `d39faf966` docs: add prompt P-2026-10-31-2011, merge jjtl-jjel-parity into alfonso-frontend-jjtl
- `a2622ec4b` docs: log entry and Status flip for JjTL JjEL-path parity (P-2026-10-31-1910)
- `d3d42310c` feat(jjtl): app parser hook and editor parse on the JjEL path (P-2026-10-31-1910)
- `73294243b` fix(jjtl): prompt, confirm, input and multi-line else on the JjEL path (P-2026-10-31-1910)
- `a31bcf9b5` docs(discovery): JjTL JjEL-path parity, prompt and multi-line else (P-2026-10-31-1910)
- `f839d2458` docs(prompts): add P-2026-10-31-1910
- `4714a2ca7` docs(sessioni): checkpoint of chat C-2026-10-31-1328, round 2 merges
- `003e597ba` docs: Status flip and log entry for the jjtl-app-source merge (P-2026-10-31-1924)
- `26ba0e08b` merge: jjtl-app-source into alfonso-frontend-jjtl (P-2026-10-31-1924)
- `c905f27a8` docs: add prompt P-2026-10-31-1924, merge jjtl-app-source into alfonso-frontend-jjtl
- `ef3114f64` docs: Status flip and log entry, jjtl-app-source took the trunk (P-2026-10-31-1902)
- `bd1dbb29d` merge: jjtl-app-source takes alfonso-frontend-jjtl (P-2026-10-31-1902)
- `fcfc56543` docs: add prompt P-2026-10-31-1902, merge alfonso-frontend-jjtl into jjtl-app-source
- `cb2a8b160` docs: Status of P-2026-10-31-1710, point 1 moved to P-2026-10-31-1910
- `6ea23356a` docs: Status flip and log entry for the ecore-nsuri merge (P-2026-10-31-1839)
- `ff05fd79d` merge: ecore-nsuri into alfonso-frontend-jjtl (P-2026-10-31-1839)
- `2ecc6c99f` docs: add prompt P-2026-10-31-1839, merge ecore-nsuri into alfonso-frontend-jjtl
- `432ad62ed` docs: Status flip and log entry for the cg-spec-note merge (P-2026-10-31-1751)
- `2a41d7507` merge: cg-spec-note into alfonso-frontend-jjtl (P-2026-10-31-1751)
- `e190e7158` docs: Status flip and log entry for the jjel-range merge (P-2026-10-31-1746)
- `10e73040e` docs: log follow-up for the nsURI refusal message (P-2026-10-31-1711)
- `35fca6676` fix(ecore): nsURI refusal says only to delete the loaded metamodel (P-2026-10-31-1711)
- `86d91287c` docs: Status, log entry and report addendum for jjtl-app-source (P-2026-10-31-1710)
- `370c12155` fix(jjtl): let variables reach nested bodies at any depth (P-2026-10-31-1710)
- `7f77bdc16` docs(discovery): JjTL app parser with source, let scope in nested bodies (P-2026-10-31-1710)
- `2fd5d83d8` docs: Status flip and log entry for the Ecore nsURI guard (P-2026-10-31-1711)
- `dad0678a7` fix(ecore): refuse import of an nsURI already loaded (P-2026-10-31-1711)
- `16bcd3432` docs: Status flip and log entry for the spec and draft-note lane (P-2026-10-31-1712)
- `a8499d9d0` docs(jjel): SPEC 9.4, origins of member reads through + and join (P-2026-10-31-1712)
- `90123e307` fix(codegen): stale-draft note only while the metamodel exists (P-2026-10-31-1712)
- and 3 more: `git log --oneline de519893f..cac7522dd`

Measured by `lane-run merge` at 2026-10-31 22:54, trunk at `cac7522dd`:

- `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c97fccffc`: zero conflicts.
- Files changed since the base: 8 on the branch side, 42 on the trunk side; on both sides: none.
- `git diff --name-only de519893f c97fccffc -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json`: empty.
- Prompt files the branch adds under `docs/prompts/`: none.
- `git worktree list`: `plugin-discovery` in `/Users/alfonso/jjodel-w-plugins`; `alfonso-frontend-jjtl` in `/Users/alfonso/jjodel-release`.

**Behaviour brought into force on 3001:** the one the branch's prompts above declare; the chat's smoke on 3001 checks it before the GO.

## COME

1. Preconditions, each a stop if false: `git status` empty; `MERGE_HEAD` absent; `c97fccffc` is the tip of `plugin-discovery`; the prompt files of the branch read `Status: eseguito` at `c97fccffc`; `git worktree list` shows `plugin-discovery` only in `/Users/alfonso/jjodel-w-plugins`.
2. Measure again. `git merge-tree --write-tree --name-only alfonso-frontend-jjtl c97fccffc` (measured above: zero conflicts). `git diff --name-only de519893f c97fccffc -- CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` must be empty. No code file may have changed on both sides since the base: compare `git diff --name-only de519893f alfonso-frontend-jjtl` with `git diff --name-only de519893f c97fccffc` (measured above: none). A conflict outside `docs/decisions.md` and `docs/log-inbox/*.md`, or a code file changed on both sides: **stop** and report before merging (RC-14: the branch takes the trunk first).
3. Semantic probes on the merge-tree result, each counted with `git show <tree>:<path> | grep -c -F`:
   - `docs/decisions.md`, each row once, counted on `- **<id>**`: `R-PLG-1` (trunk), `R-PLG-2` (trunk), `R-PLG-3` (trunk), `R-PLG-4` (trunk), `R-PLG-5` (trunk), `R-PLG-6` (trunk), `R-PLG-7` (trunk), `R-PLG-8` (trunk), `R-PLG-9` (trunk), `R-PLG-10` (trunk), `R-PLG-11` (trunk); control: `- **R-PLG-12**` none.
   - `docs/log-inbox/plugins.md`: the heading `## 2026-10-31 — discovery: plugin mechanism census and sandbox probe` once (branch).
   - `docs/decisions.md`: the heading `## R-PLG: the plugin mechanism (decisions 2026-10-31)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — fix(codegen): stale-draft note only while the metamodel exists, SPEC on origins through + and join (P-2026-10-31-1712)` once (trunk).
   - `docs/log-inbox/codegen.md`: the heading `## 2026-10-31 — merge: cg-spec-note into alfonso-frontend-jjtl (P-2026-10-31-1751)` once (trunk).
   - `docs/log-inbox/ecore-nsuri.md`: the heading `## 2026-10-31 — fix(ecore): refuse import of an nsURI already loaded (P-2026-10-31-1711)` once (trunk).
   - `docs/log-inbox/ecore-nsuri.md`: the heading `## 2026-10-31 — merge: ecore-nsuri into alfonso-frontend-jjtl (P-2026-10-31-1839)` once (trunk).
   - `docs/log-inbox/hw-notation.md`: the heading `## 2026-10-31 — merge: jjel-range into alfonso-frontend-jjtl (P-2026-10-31-1746)` once (trunk).
   - `docs/log-inbox/jjtl-app-source.md`: the heading `## 2026-10-31 — fix(jjtl): let variables reach nested bodies; app parser switch measured, not applied (P-2026-10-31-1710)` once (trunk).
   - `docs/log-inbox/jjtl-app-source.md`: the heading `## 2026-10-31 — merge: jjtl-app-source takes alfonso-frontend-jjtl (P-2026-10-31-1902)` once (trunk).
   - `docs/log-inbox/jjtl-app-source.md`: the heading `## 2026-10-31 — merge: jjtl-app-source into alfonso-frontend-jjtl (P-2026-10-31-1924)` once (trunk).
   - `docs/log-inbox/jjtl-jjel-parity.md`: the heading `## 2026-10-31 — fix(jjtl): prompt, confirm, input and multi-line else on the JjEL path; app parser switched (P-2026-10-31-1910)` once (trunk).
   - `docs/log-inbox/jjtl-jjel-parity.md`: the heading `## 2026-10-31 — merge: jjtl-jjel-parity into alfonso-frontend-jjtl (P-2026-10-31-2011)` once (trunk).
   - `docs/log-inbox/spec-prompt-typed.md`: the heading `## 2026-10-31 — docs(jjtl): SPEC §3.5 documents prompt(message, Type [, default]) (P-2026-10-31-2025)` once (trunk).
   - `docs/log-inbox/spec-prompt-typed.md`: the heading `## 2026-10-31 — merge: spec-prompt-typed into alfonso-frontend-jjtl (P-2026-10-31-2230)` once (trunk).
4. `git merge --no-ff --no-commit c97fccffc`. A conflict in `docs/decisions.md` or in a `docs/log-inbox/*.md` file is resolved by union: both blocks kept whole and verbatim, the trunk's first, then the branch's, no conflict markers, no edit inside any decision block or log entry, each heading once. Any other conflict: stop.
5. Commit the merge. Subject within 72 characters, counted once the Prompt-ID is dropped: `merge: plugin-discovery into alfonso-frontend-jjtl (P-2026-10-31-2254)`. Body in the shape of the precedent named in COSA: the branch's shas above; the trunk's commits since the base (this prompt's commit and any docs commit that moved the tip); the measurement of step 2; the probes; the union resolutions, if any; `Model:` and `Co-Authored-By` trailers.
6. Gates on the merge commit, from `frontend/`: typecheck exit 0, no error (§17, RC-48); `typecheck:scripts` exit 0; vitest: measure the trunk tip before step 4 and state the expected total first, the trunk tip plus the branch's new tests (measure them on `c97fccffc` in `/Users/alfonso/jjodel-w-plugins`, read-only, `node /Users/alfonso/jjodel-release/frontend/scripts/run-quiet.mjs vitest-branch -- npx vitest run --reporter=dot` from ``/Users/alfonso/jjodel-w-plugins`/frontend` is allowed, the runner's log goes to this tree's `.agent-logs/`; do not write in that tree), 0 failed, the same files red at import; hook tests (`node scripts/run-quiet.mjs vitest-hooks -- npx vitest run scripts/hooks`) the trunk tip's count plus the branch's new ones; build exit 0; `check:docs` 4/4; `check:agents` green; `check:scripts` PASS; `check:addonly` PASS (default `HEAD`, the merge commit). On a `check:addonly` violation, unlike every other gate above: `git reset --hard cac7522dd` (the pre-merge tip; this is the one exception to the `git reset --hard` ban below), quote the offending lines it printed, and stop at `Outcome: blocked` — do not continue to step 7.
7. If `git diff --name-only cac7522dd HEAD -- frontend/scripts/lane-board/` lists a file, the shared lane board still runs the module it loaded: run `launchctl kickstart -k gui/$(id -u)/io.jjodel.lane-board`, check that `http://localhost:4700/api` answers 200 within 30 s, and report the line (restarted, or why not). `Outcome: hard-stop`: 3001 runs from `/Users/alfonso/jjodel-release` (do not restart it; say whether it is up with `lsof -nP -iTCP:3001 -sTCP:LISTEN`). The chat runs the smoke on 3001 and gives the GO.
8. After the GO (a resume), one docs commit: this prompt's Status flipped to `eseguito <YYYY-MM-DD> · lane merge · <merge sha> · verifica visiva passata <YYYY-MM-DD> (chat, unattended; Alfonso in the morning digest)` and the P9 entry of this merge appended at the end of `docs/log-inbox/plugins.md`, both in that commit and nothing else, pathspec after `--`, subject `docs: Status flip and log entry for the plugin-discovery merge (P-2026-10-31-2254)` (P16, RC-17). Then `Outcome: done`.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard` (except the single `check:addonly` case of step 6), `git checkout -- .`, `git clean`, `--no-verify`, `git branch -f`, merging the branch name, squash, rebase, push, editing any line inside a decision block or a log entry, any other tree except the read-only vitest count in `/Users/alfonso/jjodel-w-plugins`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P9, P13, P14, P16; `docs/decisions.md` RC-13, RC-14, RC-17, RC-29.
- Rendered by `lane-run merge` from `frontend/scripts/lane-templates/merge-into-trunk.md`, in the shape of `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0300_prompt_merge_sim_derived.md`.
