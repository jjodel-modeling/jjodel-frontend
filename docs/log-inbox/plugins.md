# log-inbox — lane «plugins»

Entries written by the plugins lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-31 — discovery: plugin mechanism census and sandbox probe
**Prompt**: P-2026-10-31-1800, read-only discovery of the plugin front: census of the extension points, role-catalog comparison, write paths (H3), evaluation budgets, sandbox probe of iframe + CSP + worker (H2), report, no product code.
**Files touched**: frontend/scripts/probe/plugin-sandbox-probe.ts (a298231e0); docs/discovery/harness/plugin-sandbox/{server.mjs,host.html,plugin-boot.js,worker.js} (6980be947); docs/discovery/discovery_2026-10-31_plugin_mechanism.md (1ea149576); docs/log-inbox/plugins.md and the prompt Status line (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Out-of-scope is yes only by the >5-files count (RC-11): every file is new and in the prompt's DOVE. The session hit the 200k soft ceiling before committing; the closure ran on GO. Probe: Chromium only, run 2 exit 0. H1 partly, H2 holds in the worker but not on the iframe main thread, H3 partly. Main finding (read): project open runs stored view code via new Function (reducer.ts:542 -> 862). R-RFB-12 does not exist.
**Prompt document name**: 2026-10-31 18:00

## 2026-10-31 — merge: plugin-discovery into alfonso-frontend-jjtl (P-2026-10-31-2254)
**Prompt**: Bring `plugin-discovery` at `c97fccffc` into the trunk `alfonso-frontend-jjtl` with one `--no-ff` merge commit of the explicit sha (RC-14), probes on the merge-tree, union resolution of decisions and log inboxes if they conflict, gates on the merge commit, then the Status flip and this entry after the GO.
**Files touched**: merge commit 4ac40a8ef (8 files from the branch: the discovery report, the plugin-sandbox harness, `frontend/scripts/probe/plugin-sandbox-probe.ts`, the branch prompt Status line and inbox); `docs/prompts/claude_2026-10-31_2254_prompt_merge_plugin-discovery.md` Status line; `docs/log-inbox/plugins.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat on 3001, unattended: no user-facing change, docs, harness and probe only)
**Notes**: Tip did not move. Re-measured at 0ff38d4c5: zero conflicts, tree 8ca9c9e2f = index. No file on both sides, no union, 27 probes as expected. Branch prompt is modified, not added (in the base). Gates on 4ac40a8ef: typecheck 0, typecheck:scripts 0; vitest 12583, 471 files, same 9 red at import; hooks 967; build 0; check:docs 5/5 (prompt said 4/4); agents, scripts, addonly PASS. irCollapsedRender red once on the tip baseline (Chromium hook timeout), 13/13 alone. Lane board untouched; 3001 up.
**Prompt document name**: 2026-10-31 22:54
