# Prompt: lane-run v2, the chat's side of the harness after one night of unattended lanes

Prompt-ID: P-2026-09-27-1035
Chat: C-2026-09-26-1702
Lane: full (one script and its tests, one template folder, one protocol paragraph; no product code, no critical zone; no visual check)
Status: eseguito 2026-09-27 · lane fast · d6f619ce7, 58de29980

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, `git log -1` is the commit that adds this file (its parent `dfb52022f`, or a later docs-only commit: say so and continue), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1035 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

Twelve lanes ran unattended in the night of 2026-09-26/27 through `frontend/scripts/lane-run.mjs` (P16). The sessions were fine; the time still lost is on the chat's side, and it is all mechanical. Measured (chat, this morning): four merge prompts and one trunk-into-branch prompt written by hand, 8 to 10 minutes each, ninety percent identical, the variable part (merge base, `merge-tree`, files on both sides, governance files, test count) all measurable; every GO and every resume message written to a file and carried to the Mac through the desktop bridge, twice losing the execute bit of a helper script; the chat's independent probe re-runs done by an ad-hoc shell script rewritten three times; `lane-run start` refusing a prompt path relative to the caller's directory (03:01, `no prompt file`); `status` printing `outcome: none` when the session wrote `Outcome: done · <shas>` (04:20, P-2026-09-27-0405); and polling every ten minutes because nothing shorter existed. This lane gives `lane-run` the five pieces that remove those costs. Alfonso ratified the list in chat (2026-09-27 10:30, «vai»).

## DOVE

- `frontend/scripts/lane-run.mjs`: the five additions below; existing commands unchanged in behaviour except where stated.
- `frontend/scripts/hooks/__tests__/laneRun.test.ts`: tests for each addition, in the file's style (the script run as a child process against a fake `claude` and a temp git repo).
- `frontend/scripts/lane-templates/merge-into-trunk.md` and `trunk-into-branch.md` (new folder, new files): the two merge prompt templates with `{{placeholders}}`, derived from `docs/prompts/claude_2026-09-27_0345_prompt_merge_sim_profiles.md` and `claude_2026-09-27_0325_prompt_sim_profiles_take_trunk.md` (read both whole; keep their structure, COSA/COME/RIFERIMENTI, the Never list, the union rule for `docs/decisions.md` and the inboxes, the vitest expectation sentence).
- `docs/PROTOCOL.md`, P16: one paragraph **lane-run v2** listing the five commands in one line each, after the two bullets added by `P-2026-09-27-0405`.
- `docs/log-inbox/harness.md`: one entry. This prompt's Status flip.

Out of scope: `bash-guard.mjs`, `critical-zone.mjs`, `.claude/settings.json`, `check-*.ts`, every `src/` file, `CLAUDE.md`.

## COME

### The five additions

1. **`lane-run merge <branch> --into <trunk-branch> [--chat <id>] [--launch]`.** Run from the trunk's worktree. Measures: merge base, `git merge-tree --write-tree --name-only <trunk> <branch-tip>` (conflicts listed), files changed on both sides since the base, the governance files check (`CLAUDE.md AGENTS.md docs/PROTOCOL.md .claude/settings.json` unchanged on the branch), the branch's commits since the base (`git log --oneline`), the trunk's commits since the base, the branch's prompt files (from `docs/prompts/` files added on the branch) and whether each reads `Status: eseguito`, `git worktree list` for the branch and the trunk. Renders `merge-into-trunk.md` with a fresh Prompt-ID (`P-<today>-<HHmm>`, refused if that file exists), writes it to `docs/prompts/claude_<date>_<HHmm>_prompt_merge_<branch>.md`, prints the measurements and the path. With `--launch`: commits it alone (`git commit -- <file>`, subject `docs: add prompt <Prompt-ID>, merge <branch> into <trunk>`, `Model:` trailer taken from an env var `JJODEL_MODEL_TRAILER` or the literal `Model: chat via lane-run`) and calls `start` on it. A conflict in a code file or a changed governance file: the prompt is still rendered with the finding in its COSA, but `--launch` is refused and the reason printed. `lane-run merge --trunk-into <branch>` does the mirror with the second template, run from the branch's worktree (RC-14).
2. **Inline messages.** `resume <Prompt-ID> --text "<message>"` and `resume <Prompt-ID> -` (stdin) beside the existing message-file form; the text is written to `~/.jjodel-lanes/<id>/msg-<n>.md` before the run, so the log stays reproducible. `lane-run go <Prompt-ID> --smoke "<what the chat verified>" [--step <n>]` renders the standard GO (`[<id>] GO.` + the smoke sentence + `Now step <n>: …` taken from the prompt's COME by number when `--step` is given, else the generic «the closure commit as the prompt says») and resumes with it.
3. **`lane-run probe <worktree> <probe.ts> --port <n> [--config <vite config>] [--id <Prompt-ID>]`.** Refuses if the port is in use (`lsof`) or is 3001; starts `npx vite --config <cfg> --port <n> --strictPort` in `<worktree>/frontend` detached, waits for HTTP 200 on `/` (up to 60 s), runs `npx tsx <probe.ts>` with stdout and stderr to `~/.jjodel-lanes/<id or probe-<date>>/probe-<basename>.log`, writes `EXIT=<code>` and `end=<time>` there, kills the vite process it started (and only that one, by pid), and exits with the probe's code. The default config is `<worktree>/frontend/scripts/smoke/_tmp_lane_vite_<port>.config.ts`, generated if absent from the shape of `_tmp_chat_vite_3005.config.ts` (read it in `~/jjodel-icons/frontend/scripts/smoke/`, read-only; copy its shape, not the file): base config, `cacheDir` under `/tmp`, `strictPort`.
4. **Two fixes.** Prompt path: try the argument as given (absolute or relative to the caller's cwd), then relative to the worktree; refuse only when neither exists, naming both tried paths. Outcome parser: `OUTCOME` becomes `/^Outcome:\s*(done|hard-stop|question|blocked)\b/` (a suffix after the word is tolerated, P13 keeps the bare line as the norm); `status` prints `outcome: unparsed: <line>` when the last `Outcome:` line does not match, never `none` in that case; `status --all` lists every lane under `~/.jjodel-lanes/` in one table (id, state, outcome, elapsed), newest first.
5. **`lane-run wait <Prompt-ID>|--any <id,id,…> --max <seconds>`.** Polls every 2 s until the lane (or any of the lanes) is no longer running or the deadline passes; exits 0 when one exited (printing its status), 3 on timeout. Capped at 170 s by default (the chat's shell call has a hard limit near 180 s), a higher `--max` is refused with the reason.

### Steps

1. Read `lane-run.mjs` whole and the existing test file; keep the plain-ES-module, `node:*`-only rule. Baseline: `npx vitest run scripts/hooks` count (255 expected), `typecheck:scripts` exit 0, `check:scripts` PASS.
2. Tests first, red, one block per addition: `merge` on a temp repo with a branch (measurements right, prompt rendered, refused launch on a code conflict, Prompt-ID collision refused); `resume --text` and `-` (message file written, fake claude sees it on stdin); `go` (rendered text contains the id, the smoke sentence, the step); `probe` with a fake `npx` on the PATH that serves 200 and echoes (log written, exit code propagated, port refusal, 3001 refusal); the path fallback (both orders); the parser (bare line, suffix, unparsed); `status --all`; `wait` (exits 0 when the fake session ends, 3 on timeout, `--max 500` refused).
3. Implement, one addition per commit or all in one if they stay under 400 lines of diff in the script: say which. Subjects `feat(scripts): lane-run merge, go and inline resume (P-2026-09-27-1035)`, `feat(scripts): lane-run probe, wait, status --all and two fixes (P-2026-09-27-1035)` (each within 72 once the Prompt-ID is dropped); or a single `feat(scripts): lane-run v2, five additions for the chat side (P-2026-09-27-1035)`. Bodies: what each command measures or does, the tests, `Model:` trailer.
4. Dry run on the real tree, read-only: `lane-run merge sim-profiles --into alfonso-frontend-jjtl` without `--launch` must reproduce the measurements the chat made on 2026-09-27 03:40 (base `cdb46a7ee`, zero conflicts, 14 files on the branch side) and render a prompt whose COSA matches `claude_2026-09-27_0345_prompt_merge_sim_profiles.md` in structure; delete the rendered file afterwards (yours). `lane-run status --all` must list the night's lanes with 0405 as `done` (the suffix case) and 1015 as running or exited.
5. Gates: `typecheck:scripts` exit 0; the hook vitest run green (state the new count); `check:scripts` PASS; `check:docs` 4/4; no build (no `src/` file), say so.
6. Docs commit: the P16 paragraph, the inbox entry, the Status flip (`eseguito 2026-09-27 · lane fast · <code sha(s)>`); subject `docs: P16 lane-run v2; harness inbox (P-2026-09-27-1035)`.
7. `Outcome: done`, shas on the line above.

Stop with `Outcome: question` and a `Recommended:` line if a command needs anything outside `node:*`, or if `probe` cannot detect the served 200 without a dependency.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, a new dependency, an edit to a hook or to settings, push, any other tree except the read-only look at `~/jjodel-icons/frontend/scripts/smoke/_tmp_chat_vite_3005.config.ts`.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P16; `docs/decisions.md` RC-14, RC-19, RC-20, RC-22, RC-29, RC-30; `docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md`.
- The night's prompts under `docs/prompts/claude_2026-09-27_*` (0300, 0325, 0345 for the merge shapes); the GO texts the chat wrote, gitignored, in `frontend/scripts/smoke/_tmp_go_0300.md` and `_tmp_go_0345.md` (read them for the GO shape).
- `docs/log-inbox/harness.md` entries of `P-2026-09-27-0020` and `P-2026-09-27-0405`.
