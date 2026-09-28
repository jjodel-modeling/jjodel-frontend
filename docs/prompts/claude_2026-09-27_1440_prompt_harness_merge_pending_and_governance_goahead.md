# Prompt: lane-run merge, two tickets from the afternoon: the unlaunched prompt dirties the trunk tree, and a governance change on the branch needs a launch by hand

Prompt-ID: P-2026-09-27-1440
Chat: C-2026-09-27-1428
Lane: fast (one script and its test, the script's usage header; no frontend code, no critical zone, no governance file; no visual check)
Status: eseguito 2026-09-27 · lane harness-merge-pending · 41e85a32e

Worktree: `~/jjodel-gate`, branch `harness-merge-pending` (cut by the chat from `alfonso-frontend-jjtl` at `86520a8f3`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `harness-merge-pending`, `git log -1` is the commit that adds this file (its parent `86520a8f3`), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-1440 · session <id>]` and ends with a bare `Outcome:` line, the shas on the line above. Run gates in the foreground.

## COSA

Two defects of `lane-run merge` (P-2026-09-27-1035, amended by P-2026-09-27-1225), both measured by the chat on 2026-09-27:

1. **The unlaunched prompt dirties the trunk tree.** `merge` renders the prompt into `docs/prompts/` of the receiving worktree before it knows whether it will launch. Without `--launch`, or when `--launch` is refused, the file stays there untracked, and the next merge lane's precondition («`git status` empty») reads it as a dirty tree: measured on P-2026-09-27-1409, `blocked` on the parked prompt of P-2026-09-27-1242, unblocked by moving the file to `~/.jjodel-lanes/pending/` by hand. Rule: a prompt file enters the tree only in the run that commits it. `merge` renders into `<lanesRoot>/pending/<file>` (create the folder; `lanesRoot()` is the state root the tests already redirect); only a launch that passes every refusal moves the file to `docs/prompts/` and commits it, as today. The `prompt:` output line prints the path actually written. When the launch is not requested or refused, one more output line, `by hand: cp <pending file> <docs/prompts path> && git -C <top> add -- <rel> && git -C <top> commit -m '<subject>' -- <rel> && lane-run start <top> <rel>`, with the same subject `--launch` would use, so the chat launches by hand without composing anything. No change to `start`, `resume`, `go`, `status`, `wait`, `probe`, the templates, the measurement.

2. **A governance change on the branch needs a launch by hand.** The governance finding (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `.claude/settings.json` changed on the branch) refuses `--launch` by design, RC-26: Alfonso's yes is what lifts it. Today his yes still costs the chat the by-hand sequence above (measured on P-2026-09-27-1428: yes at 14:27, rendered, committed by hand, started). Rule, in the shape of RC-30's `--critical-zone-goahead`: `merge … --launch --governance-goahead` lifts the governance finding only, never a conflict, a code file changed on both sides, or a branch prompt whose Status is not `eseguito`. With the flag, the prompt's Findings paragraph is kept and reads «**Findings.** governance files changed on the branch: `<files>`; launch allowed by Alfonso's yes (`--governance-goahead`, <YYYY-MM-DD HH:mm>)», and the prompt commit's body carries the sentence `Governance go-ahead: Alfonso's yes, <YYYY-MM-DD HH:mm> (--governance-goahead).` under the `Model:` trailer. Without `--launch` the flag is accepted and ignored (the `by hand:` line then shows the launch command with the flag). The flag is refused with a usage line if it carries a value.

## DOVE

- `frontend/scripts/lane-run.mjs`: `merge` (the render target, the `by hand:` line, the move-then-commit on launch), `parseMerge` (the flag), `mergeFindings` or its caller (the lift), `mergeValues` (the Findings text), the usage comment at the top for `merge`. No other function; `GOVERNANCE` unchanged.
- `frontend/scripts/hooks/__tests__/laneRun.test.ts`: in `describe('lane-run merge')`: (a) without `--launch`, `git status --porcelain` of the trunk fixture is empty and the file exists under the state root's `pending/`; (b) `--launch` refused on a governance change leaves the tree clean too; (c) `--launch --governance-goahead` on a governance change commits the prompt (the commit body carries the go-ahead sentence) and starts; (d) `--governance-goahead` does not lift a conflict or a non-`eseguito` branch prompt; (e) `--governance-goahead=x` or a following value is a usage refusal. Keep every existing merge test; if one asserts the file inside `docs/prompts/` after an unlaunched merge, flip it to `pending/`.
- `docs/log-inbox/harness.md`: one entry. This prompt's Status flip.

Out of scope: `docs/PROTOCOL.md` (the P16 sentence for both rules goes in a docs lane on the trunk, after this branch is merged: a governance file here would put this very merge behind the flag it adds), `docs/decisions.md`, the templates under `frontend/scripts/lane-templates/`, the hooks, anything under `frontend/src/`.

## COME

1. Baseline from `frontend/`: `npx vitest run scripts/hooks/__tests__/laneRun.test.ts` count, 0 failed; `check:scripts` PASS.
2. Tests first, red, then the edits, minimal diffs, no rename.
3. Mutation bench, table in the commit body, a survivor is a stop: (1) the file rendered into `docs/prompts/` and moved to `pending/` only on refusal (a crash between render and refusal leaves the tree dirty); (2) `--governance-goahead` lifting every finding; (3) the go-ahead sentence missing from the commit body; (4) the `by hand:` line naming the `pending/` path as the `start` argument (`start` needs the tree path, or the lane's prompt is untracked).
4. Gates: the lane-run test file green with the new count; `check:scripts` PASS; `check:docs` 4/4; `typecheck:scripts` green.
5. Two commits, pathspec after `--`: code, subject `fix(harness): lane-run merge renders to pending, --governance-goahead (P-2026-09-27-1440)` (72 characters measured without the `(P-…)` suffix, CLAUDE.md §6.2), body with the two measurements, the mutant table, `Model:` trailer; docs, the inbox entry and the Status flip `eseguito 2026-09-27 · lane harness-merge-pending · <code sha>`, subject `docs: close the merge pending and governance go-ahead tickets (P-2026-09-27-1440)`.
6. `Outcome: done`, shas on the line above.

Stop with `Outcome: question` and a `Recommended:` line only if the test lab's trunk fixture cannot show a governance change on the branch without a new fixture helper of more than twenty lines.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, any other tree. Do not run `lane-run` against `~/.jjodel-lanes` (the real lanes): the tests use their own state root.

## RIFERIMENTI

- `frontend/scripts/lane-run.mjs`: `merge` (around lines 900-966: the render at `writeFileSync(file, text)`, the refusals, the `git add`/`commit` and `start(o.top, file)`), `parseMerge` (around 870-890), `mergeFindings` (around 796-812), `mergeValues` (around 850-870), `goAheadOption` (246-255) as the shape to follow, `lanesRoot()` and `laneFiles()` (around 140-150), the usage header lines 30-62.
- `frontend/scripts/hooks/__tests__/laneRun.test.ts` `describe('lane-run merge')` (from line 598) and its fixtures.
- Session checkpoint `docs/sessioni/sessione_2026-09-27_3.md`, «New bugs and tickets» and «Structural notes discovered».
- RC-14, RC-17, RC-20, RC-25..30.
