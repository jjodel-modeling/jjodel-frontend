# Prompt: merge harness-gate into the trunk (P-2026-09-24-1630, with the P15 carry)

Prompt-ID: P-2026-09-25-0016
Chat: C-2026-09-25-0016
Status: eseguito 2026-09-25 · lane merge · 2dd17270b

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop and say so; never work by absolute path on another worktree, except for the read-only probe of step 3, which runs in `~/jjodel-gate` and leaves it as found. Do not touch `~/jjodel`, `~/jjodel-sim`, or `~/jjodel-harness` (private notes, not a worktree).

Single phase, with hard stops. This is a merge, not a feature: no source file is edited by hand.

## COSA

Bring the harness gate lane `P-2026-09-24-1630` into the trunk with one merge commit, `--no-ff`, in the shape of `3092e5aa8` and `94a72edba` (read both bodies first and mirror them).

Merge the explicit sha `684f81056`, not the branch name. It carries: the 1630 prompt `08e6c05a6`, the Phase 1 report `a1fe080a0`, code `80581e1c7` (inbox lint, `ticket:` entry type, `check:scripts`), skill `78ce6c780` (`.claude/skills/log-entry/SKILL.md`), docs `81fd7eda5`, corrections `d9af59d8b`, addendum `684f81056`.

The merge is also the P15 carry: `harness-gate` changed `CLAUDE.md` (§17 baseline and red-at-import list, `check:scripts`, §21.2 ticket type), `AGENTS.md` (regenerated) and `docs/PROTOCOL.md` (P9 ticket type, version line unchanged at 1.5). Those rules bind only `harness-gate` until they are on the trunk.

## DOVE

Only the merge commit and one Status commit on `alfonso-frontend-jjtl` in `~/jjodel-release`. Measured at 2026-09-25 00:16: merge base `94a72edba`; the trunk gained 5 commits (`b297b5e11`, `925cd8d7c`, `5f17cf4e3`, `d1db82011`, `7bf984925`), the branch 7; the two file sets are disjoint and `git merge-tree` reports no textual conflict. Trunk side: `frontend/src/redux/VersionFixer.tsx`, `frontend/src/redux/__tests__/versionfixer_old_states.test.ts`, `docs/log-inbox/versionfixer.md`, a discovery report, a session file, two prompt Status lines. Branch side: `frontend/scripts/gates/*`, `frontend/package.json`, `frontend/scripts/tsconfig.json`, `.claude/skills/log-entry/SKILL.md`, `CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `docs/HARNESS-DOCS.md`, `docs/log-inbox/harness.md`, a discovery report, the prompt file. Re-measure; do not inherit these claims.

## COME

1. Preconditions, each a hard stop if false: `git status` empty in `~/jjodel-release` and in `~/jjodel-gate`; the 1630 prompt Status on `684f81056` reads `eseguito`; the 1610 prompt Status on the trunk reads `eseguito`; `git worktree list` shows `alfonso-frontend-jjtl` only in `~/jjodel-release` and `harness-gate` only in `~/jjodel-gate`; `684f81056` is the tip of `harness-gate` (if the branch moved, stop: anything newer is not in this merge).

2. Re-measure both sides from the merge base, file by file, and run `git merge-tree --write-tree --name-only alfonso-frontend-jjtl 684f81056`. If any file is touched on both sides or the merge tree reports a conflict, stop and report before merging.

3. Semantic probe, before the merge (P14: semantic conflicts are resolved before the merge, so that the merge resolves text only). The one known semantic contact: the new lint checks **every** inbox entry before the fold, and the trunk's `docs/log-inbox/versionfixer.md` was written before the lint and the `ticket:` type existed (it has `**Ticket**` and `**Console snippet**` paragraphs inside the entry). In `~/jjodel-gate`, write the trunk's version to the same path with `git show 7bf984925:docs/log-inbox/versionfixer.md > docs/log-inbox/versionfixer.md`, run `npm run check:docs` from `frontend/` (temporary `node_modules` symlink of P14 if absent), record the full output, then remove the file and the symlink and confirm `git status` is empty again. If the lint rejects anything in that file: hard stop, report the exact message and line, propose the smallest change, and wait. Do not edit the inbox to make the gate green (HARNESS-DOCS §6, rule on red gates).

4. `git merge --no-ff 684f81056` in `~/jjodel-release`. Subject: `merge: harness gate, inbox lint and ticket type (P-2026-09-24-1630)`. Body, in the shape of the precedents: the shas of COSA; what the trunk gained since `94a72edba`; the gate report `docs/discovery/discovery_2026-09-24_harness_gate.md` cited (RC-14); one paragraph `P15 carry:` listing the commits that change `CLAUDE.md`, `AGENTS.md` or `docs/PROTOCOL.md`, as returned by `git log --format=%h 94a72edba..684f81056 -- CLAUDE.md AGENTS.md docs/PROTOCOL.md`, stating that from this commit those rules bind the trunk; the RC-13 exception declared (the merge brings docs, skill and code in one commit, the one admitted exception of P14); then the `Model:` and `Co-Authored-By` trailers. Any conflict: `git merge --abort`, stop, report.

5. Gates on the merge commit, from `frontend/`, with the temporary symlink if needed, leaving the tree as found:
   - `npm run typecheck`: 14 errors, the baseline set by file and code (diff against the baseline list, not only the count).
   - `npm run typecheck:scripts`: exit 0.
   - `npx vitest run`: expected 4449 passed (trunk 4273 plus the branch's 176), 0 failed, the same 9 files red at import now named in `CLAUDE.md` §17. Report the exact number; any gap is explained, not rounded.
   - `npm run build`: exit 0.
   - `npm run check:docs`: 4/4. It now lints all nine inboxes; report the telemetry lines.
   - `npm run check:agents`: green. The trunk did not touch `CLAUDE.md` since the base, so `AGENTS.md` from the branch must still match the generator.
   - `npm run check:scripts`: first run in this worktree. It reads the disk, `_tmp_*` included. Report every hit with file and line. Hits only in untracked `_tmp_*` probes: declared, not a stop, not fixed here. A hit in a tracked file: stop and report.

6. No visual check and no smoke: nothing in the merge reaches the UI (the trunk side was checked on 3001 by Alfonso in 1610). Say so in the report.

7. No log entry for the merge (precedents `3092e5aa8`, `94a72edba`): the merge body is the record. The inboxes are not folded in this lane: the fold and rotation are the exclusive P13 lane that comes next.

8. One docs commit: the Status line of this prompt file, flipped to `eseguito 2026-09-25 · lane merge · <merge sha>`, pathspec after `--`, subject `docs: Status flip for the harness gate merge (P-2026-09-25-0016)`, `Model:` trailer. Then stop.

9. Closing report: the merge sha, the gate numbers, the probe output of step 3, the `check:scripts` hits, and the push order P14 requires, without pushing: `harness-gate` first (it has never been on origin), then the trunk (origin is at `3092e5aa8`, so the push also publishes the 1605, 1455 and 1610 lanes).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name instead of the sha, squash, push, editing any file of `~/jjodel-gate` beyond the temporary probe of step 3.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13 (Status flips), P14 (worktrees; reintegration of a branch), P15 (where the rules live).
- `docs/decisions.md` RC-13, RC-14.
- Merge precedents `3092e5aa8`, `94a72edba`.
- `docs/prompts/claude_2026-09-24_1630_prompt_harness_gate.md` and `docs/discovery/discovery_2026-09-24_harness_gate.md` on `harness-gate`.
- `docs/log-inbox/harness.md` on `harness-gate`: the entry of 1630 and its three tickets (ticket 1 asks for `check:scripts` in `~/jjodel-release`, covered by step 5).
