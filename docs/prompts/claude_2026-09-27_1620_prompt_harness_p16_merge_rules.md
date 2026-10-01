# Prompt: P16 documents the two lane-run merge rules merged in 964597641

Prompt-ID: P-2026-09-27-1620
Chat: C-2026-09-27-1437
Lane: fast (one governance file, docs only; Alfonso's yes given in chat on 2026-09-27 16:15, so the merge runs with --governance-goahead)
Status: eseguito 2026-09-27 · lane harness-p16-merge-rules · the commit of this line

Worktree: `~/jjodel-gate`, branch `harness-p16-merge-rules` (cut by the chat from `alfonso-frontend-jjtl` at `2b1b346da`), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-gate`, branch `harness-p16-merge-rules`, `git log -1` is the docs commit that added this prompt; if any of the three differs, stop with `Outcome: blocked` and say which.

## COSA

Merge `964597641` (lane P-2026-09-27-1440, code `41e85a32e`) changed `lane-run merge` in two ways that `docs/PROTOCOL.md` P16 does not describe yet:

1. `lane-run merge` renders the merge prompt into `~/.jjodel-lanes/pending/` and copies it into `docs/prompts/` only on a `--launch` that passes every refusal; otherwise it prints a `by hand:` line with the command to run. A rendered prompt never sits untracked in the trunk tree.
2. `--governance-goahead` lifts only the governance-file refusal (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `.claude/settings.json` changed on the branch), and only after Alfonso's yes in chat; every other refusal still holds.

Write these as P16 text, in English, in the style of the surrounding bullets. Read the actual behaviour from `frontend/scripts/lane-run.mjs` (its usage header and the merge code) and from the merge commit body: the text follows the code, not this prompt, and if they differ say so in the Outcome.

## DOVE

- `docs/PROTOCOL.md`, section P16 only (the bullets on `merge`); no other section, no renumbering.
- `docs/log-inbox/harness.md`: one entry. This prompt's Status flip.

Out of scope: `lane-run.mjs` and every other script, `CLAUDE.md`, `.claude/`, `docs/decisions.md`.

## COME

1. Read `CLAUDE.md`, P16 whole, the merge part of `lane-run.mjs`, `git show 964597641` and `git show 41e85a32e --stat`.
2. The edit: at most two bullets or sentences, minimal diff, no em dashes.
3. Gates from `frontend/`: `check:docs`, `check:agents`, `check:scripts`.
4. One commit, pathspec after `--`, with PROTOCOL.md, the log entry and the Status flip (`eseguito 2026-09-27 · lane harness-p16-merge-rules · the commit of this line`): `docs(harness): P16 describes the pending render and --governance-goahead (P-2026-09-27-1620)`.
5. `Outcome: done` with the sha and the diff of P16.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes in any other tree.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P16; merge `964597641`, lane P-2026-09-27-1440 (prompt `b96195cc5`, code `41e85a32e`); RC-20, RC-26.
