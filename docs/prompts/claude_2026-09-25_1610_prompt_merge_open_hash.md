# Prompt: merge the hash-change fix into the trunk

Prompt-ID: P-2026-09-25-1610
Chat: C-2026-09-25-1353
Lane: full (more than 3 files)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. Do not touch `~/jjodel`, `~/jjodel-open` (read-only here), `~/jjodel-sim`, `~/jjodel-events`, `~/jjodel-gate`, `~/jjodel-harness`.

Single phase, with one hard stop (the visual check). A merge, not a feature: no source file is edited by hand.

**Other chats.** Chat `C-2026-09-25-1500` runs `P-2026-09-25-1500` on `sim-event-trigger` in `~/jjodel-events` and committed on the trunk (`79175e94c`). Two merges never run at once in this tree: if the tree is dirty, a merge is in progress, or the trunk tip is not `79175e94c` or the commit that adds this file, stop and say what you see.

## COSA

Bring `P-2026-09-25-1440` into the trunk with one merge commit, `--no-ff`, in the shape of the open-path merge `74ca160e7` (read its body first and mirror it). Merge the explicit sha `f530682da`, the tip of `open-hash`, not the branch name. On top of the merge base `1201382ac` it carries: `dc383a8b8` (discovery report), `5c47e40ec` (fix: `PathChecker.tsx`, new `openKey.ts` and its test, `Project.tsx`, `reducer.ts`), `f530682da` (closure: inbox entry with two tickets, Status flip). Visual check passed on 3003 on 2026-09-25.

Measured from chat at 16:10: `git merge-tree --write-tree --name-only` reports no conflict; the trunk changed since the base only docs (`docs/decisions.md`, the 1500 prompt). Re-measure; do not inherit.

## COME

1. Preconditions, each a stop if false: `git status` empty; `git rev-parse -q --verify MERGE_HEAD` empty; `f530682da` is the tip of `open-hash`; the 1440 prompt on `f530682da` reads `Status: eseguito`; `git worktree list` shows `alfonso-frontend-jjtl` only here.
2. Re-measure both sides from the base and run `git merge-tree --write-tree --name-only alfonso-frontend-jjtl f530682da`. A conflict: stop and report. Confirm the branch changes no normative file (`git diff --name-only 1201382ac f530682da -- CLAUDE.md AGENTS.md docs/PROTOCOL.md docs/decisions.md` empty).
3. Inbox lint probe (as in 1247): overwrite `docs/log-inbox/versionfixer.md` here with the branch version, run `npm run check:docs` from `frontend/`, record, restore from `HEAD`, `git status` empty. A rejection: stop.
4. `git merge --no-ff f530682da`. Subject within 72 characters, counted before committing: `merge: hash change between two projects opens B (P-2026-09-25-1440)`. Body in the shape of `74ca160e7`: the shas of COSA, the trunk's own commits since the base, the probe results, the behaviour this brings into force (a change of project id in the URL opens that project; a superseded open no longer loads; `Project.tsx` shows the loading screen until the store holds the URL's project), the two tickets now in the inbox; `Model:` and `Co-Authored-By` trailers.
5. Gates on the merge commit, from `frontend/` (the permanent symlink is there; the Vite cache is this tree's own): typecheck 14, the §17 set; vitest: state the expected total first (4620 on the trunk plus 5: 4625), 0 failed, the same 9 files red at import; build exit 0; `check:docs` 4/4 (warnings for inboxes waiting are expected); `check:scripts` 0 tracked hits.
6. **Visual check, hard stop.** 3001 runs from this tree (pid in `lsof -nP -iTCP:3001 -sTCP:LISTEN`, cwd `~/jjodel-release/frontend`); Vite reloads on the merge. If it is not running, say so and let Alfonso start it. Ask Alfonso to hard-refresh `http://localhost:3001/` and check: (a) a healthy project opens from the list; (b) with it open, editing the id in the address bar to another saved project opens that one, no blank page. Wait.
7. After his OK, one docs commit: this prompt's Status flipped to `eseguito 2026-09-25 · lane merge · <merge sha> · verifica visiva passata 2026-09-25`, pathspec after `--`, subject `docs: Status flip for the hash change merge (P-2026-09-25-1610)`, `Model:` trailer. No log entry (precedents); the 1440 inbox entry waits for the next P13 fold.
8. Closing report opening with `[P-2026-09-25-1610 · session <id>]`: merge sha, probes, gates, visual result, push state (do not push).

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name, squash, rebase, push.

## RIFERIMENTI

- `docs/PROTOCOL.md` P13, P14; `docs/decisions.md` RC-13, RC-14, RC-17.
- Merge precedent `74ca160e7` and its prompt `docs/prompts/claude_2026-09-25_1115_prompt_merge_open_path.md`; `docs/prompts/claude_2026-09-25_1247_prompt_merge_sim_step3.md`.
- On `open-hash`: `docs/discovery/discovery_2026-09-25_hash_change_open.md`, `docs/log-inbox/versionfixer.md`.
