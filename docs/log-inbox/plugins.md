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
