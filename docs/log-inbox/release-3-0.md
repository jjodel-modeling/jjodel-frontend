# Log inbox — release 3.0

Entries for the release lane, kept out of the active `docs/claude-code-log.md` while parallel lanes
are running (P9). To be merged into the active log by whoever rotates it.

## 2026-09-15 — chore(release): 3.0.0, version, changelog, PR towards staging
**Prompt**: `claude_2026-09-14_1250_prompt_release_3_0_version_tag_staging.md` — steps 1 to 5, with
the counts re-measured first because the ones written on 14/9 predate lane A and the C/G/B2/D
cherry-pick. HARD STOP before the merge of the PR; step 6 (the tag) waits for the GO.
**Files touched**: all in `~/jjodel-release` on `alfonso-frontend-jjtl`, nothing in `~/jjodel`
except the rule that this entry is not written there. `b6ec8c63a` (docs): the release prompt, whose
stale literals are replaced by measured values and whose step 1 gate now compares against a
measurement taken at the entry gate instead of asserting `31`. `7e37a1b3d` (`chore(release)`):
`frontend/package.json` and `frontend/package-lock.json`, two lines each, `3.0.0-beta` to `3.0.0`.
`6e9a31fe7` (docs): `CHANGELOG.md`, `[Unreleased]` becomes `[3.0.0] - 2026-09-15` with a new empty
`[Unreleased]` above it and the `docs.jjodel.io/whats-new/` line under the heading. This entry in
its own docs commit, not pushed.
**Outcome**: ⚠️ partial — steps 1 to 5 done, step 6 pending the GO, and one gate of step 4 is
unsatisfiable as written (see **Notes**).
**Corregge**: —
**Causa**: (c) — the prompt's counts and its step 4 bundle grep were written without being run
against a built bundle.
**Regressions**: no. Entry gate: worktree clean, branch right, behind by exactly 1 and that one is
`27a0a436e`. Measured at the entry gate: `AHEAD` 42, `FRONTEND` 13. After the rebase onto
`origin/alfonso-frontend-jjtl`, no conflict, the same two numbers, and
`git merge-base --is-ancestor origin/alfonso-frontend-jjtl HEAD` exit 0. Gates in
`~/jjodel-release/frontend` with `node_modules` in a temporary symlink, removed at the end,
`git status` empty before and after: `npm run typecheck` exit 2, **14** `error TS` on full output,
the same set as before the release commits (`diff` exit 0), which is this branch's baseline;
`npm run build` exit 0 with the chunk-size warning only. Push fast-forward,
`27a0a436e..6e9a31fe7`. PR **#144** towards `staging`, not merged.
**Out-of-scope changes**: no. The prompt edit is the one the lane was told to make first.
**Layer Impact Report**: not-required — no critical-zone file (§3.1).
**Smoke visivo**: pending Alfonso on `beta.jjodel.io` after the merge: footer `v3.0.0`, hard refresh.
**Notes**: Step 4's `grep -rl 'v3.0.0 (' dist/assets/*.js` can never match: `VERSION_LABEL` survives
minification as the template literal `` `v${APP_VERSION} (${BUILD_COUNT})` ``, so the contiguous
string does not exist in the bundle, for `3.0.0-beta` either. Substitutes, measured: the bundle
holds `APP_VERSION="3.0.0"`, `BUILD_COUNT="3312"`, `BUILD_SHA="6e9a31fe7"`, the About dialog holds
the literal `v3.0.0`, and `3.0.0-beta` appears in zero files under `dist/`. The gate needs
rewriting; not done in this lane.
**Prompt document name**: 2026-09-14 12:50
