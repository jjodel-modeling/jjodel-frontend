# Prompt: merge the Bootstrap Icons font lane into the trunk

Prompt-ID: P-2026-09-26-1340
Chat: C-2026-09-26-1335
Lane: fast (merge, no code moved on the trunk side of `vite.config.ts` expected)
Status: da eseguire

Worktree: `~/jjodel-release`, branch `alfonso-frontend-jjtl`. Before anything else run `pwd` and `git branch --show-current`: if the answer is not `/Users/alfonso/jjodel-release` on `alfonso-frontend-jjtl`, stop. `~/jjodel-icons` is read-only here. Do not touch `~/jjodel`, `~/jjodel-open`, `~/jjodel-sim`, `~/jjodel-gate`, `~/jjodel-harness`, nor the servers on 3000, 3002 and 3003.

Single phase, with two hard stops (step 1, the serialization check; step 6, the visual check). A merge: no source file is edited by hand.

**This file lives on `icons-font`, not on the trunk.** It reaches the trunk with the merge.

**Serialization.** The trunk also expects the merge of `navigate-cancel` (`P-2026-09-25-1905`, chat `C-2026-09-25-1353`, `~/jjodel-open`). The two merges never run at the same time in this tree. Step 1 does not proceed without Alfonso's explicit word, in this session, that the navigate-cancel merge is not running and will not start before this prompt's Status flip is committed.

## COSA

Branch `icons-font` (tip: the commit that adds this file, on top of `a860c436d`), closed by `P-2026-09-26-1335` with visual check passed on 3005 on 2026-09-26. Commits over `9290c17be` (the trunk commit that added the 1335 prompt): `ad64eaa34` (report `docs/discovery/discovery_2026-09-26_bootstrap_icons_font_403.md`), `b1ba29157` (`frontend/vite.config.ts`: `server.fs.allow` with `searchForWorkspaceRoot(__dirname)` and the real `node_modules` directory resolved at config time, guarded), `a860c436d` (closure: Status, one entry in `docs/log-inbox/harness.md` after the three of the 1820 lane), and the commit that adds this prompt. Four files changed against `9290c17be`. Do not merge a branch name, merge the sha recorded as `<B>`.

The branch's only code file is `frontend/vite.config.ts`. The trunk is not expected to have touched it since `8a4335402`; if it did, stop. The only file expected on both sides, if any, is `docs/log-inbox/harness.md` (the trunk may have folded or appended to it since `9290c17be`): resolution is the trunk's content followed by exactly the branch's one new entry (the `chore(dev)` entry of P-2026-09-26-1335), verbatim, with no entry appearing twice. If the trunk is still at `9290c17be`, the merge is a plain fast-forward candidate: still merge with `--no-ff`, as the precedents do.

## COME

1. **Hard stop, serialization.** Ask Alfonso whether the navigate-cancel merge is running or about to run. Proceed only on his explicit go. Then, hard stops: `git status` empty in `~/jjodel-release` and `~/jjodel-icons`; no `MERGE_HEAD`; `git worktree list` shows `alfonso-frontend-jjtl` only here and `icons-font` only in `~/jjodel-icons`; the tip of `icons-font` adds this file and its parent is `a860c436d`. Record it as `<B>` and record the trunk tip as `<T>`.
2. Measure: merge base, `git diff --name-only` of each side, `git merge-tree --write-tree --name-only alfonso-frontend-jjtl <B>`. Expected: no conflict, or exactly one on `docs/log-inbox/harness.md`. Any other conflict, or `frontend/vite.config.ts` changed on both sides: stop. Confirm the branch changes no normative file (`CLAUDE.md`, `AGENTS.md`, `docs/PROTOCOL.md`, `docs/decisions.md`).
3. `git merge --no-ff <B>`. If `harness.md` conflicts, resolve as in COSA and check that `git show <T>:docs/log-inbox/harness.md` is a prefix of the result and each new entry appears once. `npm run check:docs` from `frontend/` before concluding: 4/4. Subject `merge: allow the shared node_modules in the Vite serving list (P-2026-09-26-1335)`; body in the shape of the precedents (`98ff75a27`): the shas of the branch, what the trunk gained since the base, the conflict if any and its resolution, the probe results; `Model:` and `Co-Authored-By` trailers. Any other conflict: `git merge --abort`, stop.
4. Gates on the merge commit, from `frontend/` (permanent symlink here: never remove it): `npm run typecheck` (state the expected count from `<T>` first), `npm run typecheck:scripts` exit 0, `npx vitest run` (expected: the `<T>` total, the branch adds no tests), `npm run build` exit 0 with the same warnings, `npm run check:docs` 4/4, `npm run check:agents` green, `npm run check:scripts` 0 hits.
5. Probe on 3001, which restarts by itself on a `vite.config.ts` change (do not restart it, do not touch its cache): wait for the restart line in its output if visible, otherwise wait ten seconds; then `curl -s http://localhost:3001/src/index.tsx`, follow the `bootstrap-icons.css` URL, extract the `.woff2` URL and `curl -o /dev/null -s -w '%{http_code} %{content_type}\n'` on it: expected `200 font/woff2`. Negative controls `/@fs/Users/alfonso/jjodel/frontend/package.json` and `/@fs/etc/hosts`: expected 403 each. A 403 on the font or a 200 on a control: report and stop; no revert without instruction.
6. **Visual regression, hard stop.** Tell Alfonso to hard-refresh `http://localhost:3001/` and check that the Bootstrap icons render in toolbar, panels and context menus, and that a healthy project opens as before. Wait. On a failure, report and stop; no revert without instruction.
7. After his OK, one docs commit: this prompt's Status flipped to `eseguito 2026-09-26 · lane merge · <merge sha> · verifica visiva passata 2026-09-26`, pathspec after `--`, subject `docs: Status flip for the Bootstrap Icons font merge (P-2026-09-26-1340)`, `Model:` trailer. No log entry for the merge (precedents).
8. Leave `~/jjodel-icons` and `icons-font` in place. Closing report opening with `[P-2026-09-26-1340 · session <id>]`: `<T>`, `<B>`, merge sha, conflict state, gate numbers, 3001 probe codes, visual result, push state without pushing. Say explicitly that the navigate-cancel merge may now start.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, merging the branch name instead of the sha, squash, rebase, deleting any cache, killing or restarting a server you did not start, removing any worktree, push.

## RIFERIMENTI

- On `icons-font`: `docs/prompts/claude_2026-09-26_1335_prompt_bootstrap_icons_font.md`, `docs/discovery/discovery_2026-09-26_bootstrap_icons_font_403.md`, `docs/log-inbox/harness.md`.
- Merge precedents `98ff75a27` (P-2026-09-26-1045, same file) and `4b70b5634` (P-2026-09-26-1240); `docs/prompts/claude_2026-09-26_1045_prompt_merge_vite_dep_scan.md`.
- `docs/PROTOCOL.md` P13, P14, P15; `docs/decisions.md` RC-12, RC-17.
