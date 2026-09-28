# Prompt: three harness tickets from the night lanes (typecheck:scripts and `_tmp_*`, P16 foreground gates, bash-guard header)

Prompt-ID: P-2026-09-27-0405
Chat: C-2026-09-26-1702
Lane: fast (two files of code-adjacent config and comments, one protocol clause, one inbox entry; no source under `src/`, no critical zone)
Status: eseguito 2026-09-27 · lane fast · fbd9064c9

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`, a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-release`, branch `alfonso-frontend-jjtl`, `git log -1` is the commit that adds this file (its parent `2e8654646`, the Status flip of the profiles panel merge), `git status` empty apart from gitignored `frontend/scripts/smoke/_tmp_*`. If the tip moved because another chat added a docs-only commit on top, say so and continue. Otherwise stop with `Outcome: blocked`. Every reply opens with `[P-2026-09-27-0405 · session <id>]` and ends with an `Outcome:` line (P16). Run gates in the foreground, never as a background task.

## COSA

Close three tickets the night's lanes opened, all measured by the chat:

1. **`typecheck:scripts` and the chat's probes.** `P-2026-09-27-0325` saw `npm run typecheck:scripts` exit 2 with 25 errors, all in gitignored `frontend/scripts/smoke/_tmp_*` probe files (the chat's re-run scripts and scratch vite configs, which also pull `vite.config.ts` into the check). Gitignored scratch must not decide a gate: `scripts/tsconfig.json` excludes `_tmp_*`.
2. **P16, foreground gates and the prompt path.** `P-2026-09-27-0120` ended its turn with the gates running as a background task and no `Outcome` line: in a `-p` session a background task does not survive the end of the turn (measured 2026-09-27 02:05, resumed with the instruction to run them in the foreground). And `lane-run start <worktree> <prompt-file>` resolves a relative prompt path against the worktree, not the caller's directory (`lane-run.mjs` line 192; a `../docs/...` path from `frontend/` fails with `no prompt file`, measured 03:01). Both go in P16 as one-line rules, so prompts stop repeating them.
3. **`bash-guard.mjs` header.** Its comment still says «the `ask` rules on `git commit*` and `git push*` in settings stay»; RC-29 (`620e3d5cd`) removed `Bash(git commit*)` from `permissions.ask`, only `Bash(git push*)` remains. Comment only; no behaviour changes.

## DOVE

Code commit (config and comments; no `src/` file):

- `frontend/scripts/tsconfig.json`: add `"exclude": ["**/_tmp_*"]` after `include`, with a one-line comment saying why (gitignored chat and session probes are not part of the gate).
- `frontend/scripts/hooks/bash-guard.mjs`: the header comment only, the sentence about the `ask` rules rewritten to the RC-29 state (`Bash(git push*)` is the only `ask` left; the commit is not a human gate, RC-19 and RC-29).

Docs commit:

- `docs/PROTOCOL.md`, clause P16: two bullets appended after **Launch and resume (RC-20)**, in its style: **Prompt path.** `lane-run start` reads a relative `<prompt-file>` from `<worktree>`, so the chat passes `docs/prompts/<file>.md`, never a path relative to its own directory (measured 2026-09-27). **Foreground gates.** A `-p` session ends its turn when the last foreground command returns; a gate launched as a background task is lost with the turn and the session exits without its `Outcome` line (measured 2026-09-27, `P-2026-09-27-0120`). Every gate runs in the foreground; a prompt may still repeat it.
- `docs/log-inbox/harness.md`: one entry for this lane (both commits, the three tickets closed, the measurement of step 3 below).
- This prompt's Status flip.

Out of scope: `lane-run.mjs`, `critical-zone.mjs`, `.claude/settings.json`, `frontend/tsconfig.json`, every file under `src/`, `docs/HARNESS-DOCS.md`, `docs/decisions.md`.

## COME

1. Baseline from `frontend/`: `npm run typecheck:scripts` (state exit code and error count: if `_tmp_*` probes are present in `scripts/smoke/`, the baseline may be red, and that is the ticket); `npm run test:hooks` or the hook vitest file (255); `check:docs` 4/4.
2. Measure the fix before writing it: create `scripts/smoke/_tmp_p0405_typeerror.ts` holding `const n: number = 'x'; export {};` (gitignored); confirm `typecheck:scripts` reports it; then add the `exclude` and confirm exit 0 with the same file present, and that the 14 tracked `.ts` files under `scripts/smoke/` and `scripts/gates/` are still covered (`tsc --noEmit -p scripts/tsconfig.json --listFilesOnly | grep -c 'scripts/'` before and after, minus the `_tmp_` ones). Remove your `_tmp_p0405_typeerror.ts` at the end (it is yours: the other `_tmp_*` files in that folder belong to the chat and stay).
3. Code commit, pathspec after `--` (the two files), subject `fix(scripts): typecheck:scripts ignores _tmp_ probes; bash-guard header after RC-29 (P-2026-09-27-0405)`; if over 72 characters once the Prompt-ID is dropped, use `fix(scripts): typecheck:scripts skips _tmp_ probes (P-2026-09-27-0405)`. Body: the measurement of step 2, `Model:` trailer.
4. Docs commit: P16 bullets, the inbox entry, the Status flip (`eseguito 2026-09-27 · lane fast · <code sha>, <docs sha>` is impossible in the same commit, so write `eseguito 2026-09-27 · lane fast · <code sha>`), pathspec after `--`, subject `docs: P16 prompt path and foreground gates; harness inbox (P-2026-09-27-0405)`. `check:docs` 4/4 before committing.
5. Gates after both commits: `typecheck:scripts` exit 0; hook tests 255; `check:docs` 4/4; `check:scripts` PASS; `git status` clean apart from the chat's `_tmp_*`. No build needed (no `src/` file changed); say so.
6. `Outcome: done` with both shas. No visual check (nothing rendered changes).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, deleting any `_tmp_*` file you did not create, editing `lane-run.mjs` or `critical-zone.mjs`, push, any other tree.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P16; `docs/decisions.md` RC-19, RC-20, RC-29; `docs/log-inbox/harness.md` (the `P-2026-09-27-0020` entry for the shape).
- Measurements: `P-2026-09-27-0325` closing report (typecheck:scripts, 25 errors in `_tmp_*`); `P-2026-09-27-0120` (background gates); chat, 03:01 (`lane-run start` with `../docs/...`).
