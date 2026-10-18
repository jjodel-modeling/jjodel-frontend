# log-inbox — lane «maintenance»

Entries written by the maintenance lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-12 — fix(types): 11 of the 14 baseline typecheck errors cleared in six files (P-2026-10-12-2000)
**Prompt**: `claude_2026-10-12_2000_prompt_typecheck_zero_s1_type_only.md`, full lane (more than 3 files), one phase, director Juri (chat `C-2026-10-12-1955`), lane 1/3 of `chain-P-2026-10-12-2000` in the worktree `jjodel-tc0` on `fix/typecheck-baseline-zero`: six one-site edits that the compiler erases, typecheck measured before and after, the chat's oracle on the emitted JavaScript.
**Files touched**: `b3f44be17`: `frontend/src/common/Dummy.ts` (line 46 deleted), `frontend/src/components/Jodie/ChatMessages.tsx` (line 282), `frontend/src/components/editor-v2/EditorV2.tsx` (line 3350), `frontend/src/components/forEndUser/Measurable.tsx` (line 271), `frontend/src/components/project/ProjectEditor.tsx` (line 227), `frontend/src/pages/components/Dashboard.tsx` (line 599). This commit: this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — every gate read as expected on its complete output, with its exit status: typecheck exit 2 with 14 errors before (the §17 list) and exit 2 with 3 after, all in `src/api/data.ts` (TS2304 ×2, TS2322); vitest 9 files red at import (the nine of §17), 9037 tests green in 361 files; build exit 0; check:docs 5/5; check:addonly and check:scripts exit 0. The oracle printed six `IDENTICAL JS`. The built bundle is the same bytes: `npm run build` on HEAD's content and on the edited tree, both at `e76c59c55`, 3501 files of `dist`, sha256 equal one by one.
**Out-of-scope changes**: no — eight files, above five (rule 19, RC-11), the eight of the prompt's DOVE: `Dummy.ts`, `ChatMessages.tsx`, `EditorV2.tsx`, `Measurable.tsx`, `ProjectEditor.tsx`, `Dashboard.tsx`, one line each; this inbox; the prompt's Status line.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — P8 derogated by the prompt, the oracle is the reason: `_tmp_tc0_jsdelta.cjs HEAD`, control ok, six `IDENTICAL JS` under `ts.transpileModule` 5.9.3, each `source changed: true`, exit 0. Measured beyond it, because Vite transforms with esbuild and not with tsc: under esbuild 0.27.7 five files are byte-identical and `Dummy.ts` differs in 29 lines by one local rename (the top-level import `i` gone, esbuild no longer renames the file's local `i` to `i2`; `i2` replaced by `i` in the old output gives the new one exactly). No dev server, no browser.
**Notes**: Derogations declared by the prompt: P4 (no discovery phase, no hard stop) and P8 (no visual check). Eight files: the six code files, this inbox, the prompt's Status line. The P8 reason, «byte-identical JavaScript», holds for tsc's emit and for the built bundle; under esbuild, which Vite serves in dev, `Dummy.ts` is the same program with one local renamed: Juri decides whether that is enough. Slice 2 uses the same tsc oracle.
**Prompt document name**: 2026-10-12 20:00

## 2026-10-12 — ticket: SaveManager's XML import branch always throws, X.xml2json is not a function
**Ticket**: `SaveManager.importEcore_click` feeds its XML branch through `prxml2json.xml2jsonobj` (`frontend/src/components/topbar/SaveManager.ts:98`, `:127`, `:134`), and that call always throws `X.xml2json is not a function`: `frontend/src/common/libraries/prj_xml2json.js:195-196` (`xml2jsonobj`, `xml2jsonstr`) call `X.xml2json`, a member `X` does not have; `xml2json` is a module-level function at `:178`. Reproduced twice in a browser probe on 2026-10-12 on base `0dd4028f6`. No caller of `importEcore_click` or `importEcore` exists in `src` outside `SaveManager.ts` itself (searched with a control: the same search finds the `importFromXML` callers), so no UI gesture reaches it; the UI's Ecore import goes through `EcoreService.importFromXML` (`ProjectEditor.tsx:940`, `ImportDropZone.tsx:80`), which works. Not fixed: outside the lane's scope.
**Priority**: medium
**Found in**: P-2026-10-12-2001
**Detail**: `~/.jjodel-lanes/P-2026-10-12-2001/probe-before-literal-feed.log`

## 2026-10-12 — fix(types): last 3 baseline typecheck errors cleared in data.ts, baseline at zero (P-2026-10-12-2001)
**Prompt**: `claude_2026-10-12_2001_prompt_typecheck_zero_s2_ecore_parser.md`, fast lane, one phase, director Juri (chat `C-2026-10-12-1955`), lane 2/3 of `chain-P-2026-10-12-2000` in the worktree `jjodel-tc0` on `fix/typecheck-baseline-zero`: the missing `DDataType` import and one cast in `api/data.ts`, a browser probe BEFORE and AFTER for the one runtime delta (the import binds to the module export instead of the window global), the chat's oracle on the emitted JavaScript.
**Files touched**: `315c62715`: `frontend/src/api/data.ts` (the `DDataType` import in the second `../joiner` import; `as Json[]` at line 1163). This commit: this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — every gate read as expected on its complete output, with its exit status: typecheck exit 2 with 3 errors before (TS2304 ×2 at `data.ts:899`, TS2322 at `:1163`) and exit 0 with none after; vitest 9 files red at import (the nine of §17), 9037 tests green in 361 files; build exit 0; check:docs 5/5; check:addonly and check:scripts exit 0. The AFTER probe passed every arm, exit 0.
**Out-of-scope changes**: no — three files, the three of the prompt's DOVE: `frontend/src/api/data.ts` (two sites), this inbox, the prompt's Status line.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — P8 derogated by the prompt: no human visual check; the one runtime delta is measured by a browser probe, `_tmp_tc0_probe.ts` through `lane-run probe`, port 3190, `EcoreService.importFromXML` (the UI's route), fresh page and project per arm. BEFORE and AFTER, exit 0: G0 pass (`window.DDataType` is the joiner export); E0a, E0b pass (no `DDataType` without the `ecore:EDataType`, exactly one `Money@DPackage` with it); E1 string equal; 0 page errors; console errors `init_dash` ×2 in both. Oracle: two differing lines, the import and the parentheses of line 1199; esbuild: one, the import.
**Notes**: P8 derogated by the prompt. E1 returned the same string BEFORE and AFTER: success=true, errors=[], one DDataType Money@DPackage. The chat redefined E1 (the prompt's prxml2json feed throws on the base; its Context named the wrong import route) and amended the oracle's expectation from one differing line to two (parentheses only). Ticket entry above: the dead XML branch of SaveManager.
**Prompt document name**: 2026-10-12 20:01

## 2026-10-13 — merge: fix/typecheck-baseline-zero into staging (P-2026-10-13-1023)
**Prompt**: `claude_2026-10-13_1023_prompt_merge_fix-typecheck-baseline-zero.md`, rendered by `lane-run merge` and run by a session, not direct (governance files on the branch, launch under `--governance-goahead`), director Juri (chat `C-2026-10-12-1955`): `fix/typecheck-baseline-zero` at `fe2efc098` into `staging` at `ed96d563c`, one `--no-ff` merge commit, merge base `38f0add16`, 10 commits on the branch side (the three lanes of `chain-P-2026-10-12-2000`), 1 on the trunk side (the prompt's own).
**Files touched**: merge `e4421dc62`, 19 files, all from the branch side: `AGENTS.md`, `CLAUDE.md`, `docs/HARNESS-DOCS.md`, `docs/decisions.md`, `docs/log-inbox/harness.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-12_2000_prompt_typecheck_zero_s1_type_only.md`, `docs/prompts/claude_2026-10-12_2001_prompt_typecheck_zero_s2_ecore_parser.md`, `docs/prompts/claude_2026-10-12_2002_prompt_typecheck_zero_s3_gate_at_zero.md`, `frontend/scripts/lane-templates/merge-into-trunk.md`, `frontend/scripts/lane-templates/trunk-into-branch.md`, `frontend/scripts/tsconfig.json`, `frontend/src/api/data.ts`, `frontend/src/common/Dummy.ts`, `frontend/src/components/Jodie/ChatMessages.tsx`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/forEndUser/Measurable.tsx`, `frontend/src/components/project/ProjectEditor.tsx`, `frontend/src/pages/components/Dashboard.tsx`. This commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e4421dc62`, in the foreground, each on its complete output with its exit status: typecheck exit 0, no `error TS` line (the trunk tip `ed96d563c` measured the 14 of the old baseline with the same command); typecheck:scripts exit 0; vitest 9037 tests green in 361 files, 0 failed, the nine files of §17 red at import, equal to the trunk tip and to `fe2efc098` (the branch adds no test); hooks 681 tests in 12 files, equal to both; build exit 0; check:docs 5/5 (the prompt says 4/4, the gate has five checks); check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no — 19 files in the merge, above five (rule 19, RC-11): the 19 the prompt measures on the branch side, listed above, and nothing on the trunk side beyond the prompt's own file. No other tree written: `jjodel-tc0` was only read, for the vitest count the prompt allows.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat `C-2026-10-12-1955`, unattended, on the merged tree `e4421dc62` through `lane-run probe` on port 3190 (nothing listened on 3001): the Ecore-import probe of P-2026-10-12-2001 (`_tmp_tc0_probe.ts`, MODE=after against the BEFORE state measured on the untouched code) 6/6 PASS, EXIT=0; the committed smoke `scripts/smoke/run.ts` 12 passed, 0 failed, 3 declared skips, VERDICT GREEN. Logs `probe-_tmp_tc0_probe.log` and `probe-_tmp_172_smoke.log` in `~/.jjodel-lanes/P-2026-10-13-1023/`.
**Notes**: Director of this line: Juri. The governance go-ahead was his (2026-10-13, his launch with `--governance-goahead` in chat `C-2026-10-12-1955`); the tool's fixed text names Alfonso. Rollback tag `pre-fix/typecheck-baseline-zero` on `ed96d563c` (RC-31), created by the chat. Union: none. Read against the Findings, confirmed by the chat: step 6 «typecheck 14» (0 is the pass), step 2 «must be empty» (the two files of the go-ahead). `8a8575ec0` is still owed to `alfonso-frontend-jjtl` (P15).
**Prompt document name**: 2026-10-13 10:23

## 2026-10-18 — fix(notifications): API_URL points at the renamed workers.dev host (P-2026-10-18-1145)
**Prompt**: `claude_2026-10-18_1145_prompt_notifications_worker_host.md`, fast lane (light tier), chat `C-2026-10-17-1518`, worktree `jjodel-w-notifurl` on `notif-url`: change the host of `API_URL` in the notifications widget after the Cloudflare workers.dev subdomain rename `alfonso-pierantonio` to `alfonso99`.
**Files touched**: `4e8bdbcc7`: `frontend/src/components/NotificationWidget/NotificationWidget.tsx` (line 22 host; one comment line above it). This commit: this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck exit 0 with no `error TS` (the prompt says «baseline 14»; CLAUDE.md §17 has had the baseline at zero since 2026-10-12, so 0 is the figure met), build exit 0 (only the chunk-size warning), no vitest file imports `NotificationWidget` (`grep -rl NotificationWidget src` finds `App.tsx` and the widget itself), none run.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — P8 in its RC-23 form derogated by the prompt; the widget's look does not change.
**Notes**: Step 2: `command grep -rn -m 5 "alfonso-pierantonio.workers.dev" frontend/src frontend/public` found only the widget line (exit 0, positive control on `workers.dev` in `types/jodie.ts:231` found), so no other hit. Step 3, `curl -sS -o /dev/null -w '%{http_code}'`: `https://jjodel-notifications.alfonso99.workers.dev` and `.../` both 200, body `{"posts":[...]}` as the widget expects; the old host gives 000 (no DNS). The widget fetches the bare `API_URL` (line 81), no other path.
**Prompt document name**: 2026-10-18 11:45

## 2026-10-18 — merge: notif-url into alfonso-frontend-jjtl (P-2026-10-18-1158)
**Prompt**: `claude_2026-10-18_1158_prompt_merge_notif-url.md`, a direct merge by `lane-run merge --direct`, no session: `notif-url` at `048b86a61` into `alfonso-frontend-jjtl`, merge base `1e9e616fa`, 2 commits on the branch side.
**Files touched**: merge `6268a9073`: 3 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-18_1145_prompt_notifications_worker_host.md`, `frontend/src/components/NotificationWidget/NotificationWidget.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6268a9073` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9225 tests in 376 files, 9 red at import, hooks 787; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no visible UI change: API_URL host only; new host answers 200 (curl by chat C-2026-10-17-1518 at 11:58); decided by the chat under RC-25
**Notes**: Rollback tag `pre-notif-url` on `3163b7557` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-18-1158/result.json`.
**Prompt document name**: 2026-10-18 11:58

## 2026-10-18 — discovery: AI proxy Worker back in the trunk, configurable proxy URL, dynamic model lists (P-2026-10-18-1146)
**Prompt**: `claude_2026-10-18_1146_prompt_discovery_ai_proxy_dynamic_models.md`, full lane, Phase 1 only (read-only), chat `C-2026-10-17-1518`, unattended (RC-21, RC-25), worktree `~/jjodel-w-aimodels` on `ai-models-discovery` at `1e9e616fa`.
**Files touched**: `docs/discovery/discovery_2026-10-18_ai_proxy_dynamic_models.md` (new), this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — no file under `frontend/` written; `~/jjodel-proxy` only read; network calls keyless only (CORS preflights and unauthenticated GETs to the three providers' models endpoints, and to the deployed Worker).
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (discovery, no code change)
**Notes**: Measured: only `testClaude` uses the Worker (Claude chat and Gemini go direct, `9220e286a`); all three `/models` endpoints are CORS-readable from the browser; the Worker accepts any origin containing `localhost` and hides its 403 behind CORS. Two decisions await Alfonso (direct vs Worker first for GET models; redeploy). Issue #54 unread: `gh` not authenticated. Detail in the report.
**Prompt document name**: 2026-10-18 11:46

## 2026-10-18 — feat: AI proxy Worker in the trunk with the origin fix and models routes; proxy URL from VITE_AI_PROXY_URL (P-2026-10-18-1146)
**Prompt**: Phase 2 of `claude_2026-10-18_1146_prompt_discovery_ai_proxy_dynamic_models.md`, slices (a) and (b) only, GO from chat `C-2026-10-17-1518` on Alfonso's «Ok alle raccomandazioni» (2026-10-18 12:10), same worktree and branch.
**Files touched**: `cfc266eac`: `cloudflare-worker/{.gitignore, README.md, package.json, package-lock.json, tsconfig.json, wrangler.toml, src/index.ts}` (new). `7d233651e`: `frontend/src/types/jodie.ts` (`getEndpoint`), `frontend/src/types/__tests__/aiProxyEndpoint.test.ts` (new), `cloudflare-worker/README.md`. This commit: `docs/CODEBASE-MAP.md`, this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — Worker: `tsc --noEmit` exit 0 (index.ts in `--listFiles`), `wrangler deploy --dry-run` exit 0, Node bench on the dry-run bundle with stubbed fetch 16/16, two mutations caught. Frontend: typecheck exit 0, build exit 0, vitest `aiProxyEndpoint.test.ts` 4/4 and `AIProviderService.test.ts` 16/16, two mutations caught; a build with the variable set inlines it. Deployed Worker not changed: redeploy is Alfonso's.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no UI change; dev now calls the production Worker for Claude's test, not exercised in a browser)
**Notes**: Twelve files, above five: the ones the GO names (rule 19). `docs/CODEBASE-MAP.md` moved from commit 1 to this docs commit, so docs and code stay apart (P13). The bench lived in /tmp, not committed: the Worker folder has no test runner. Gemini POST keeps forwarding `?key=` upstream as before; the new models route forwards `x-goog-api-key`. Slices (c), (d) open.
**Prompt document name**: 2026-10-18 11:46

## 2026-10-18 — merge: ai-models-discovery into alfonso-frontend-jjtl (P-2026-10-18-1226)
**Prompt**: `claude_2026-10-18_1226_prompt_merge_ai-models-discovery.md`, a direct merge by `lane-run merge --direct`, no session: `ai-models-discovery` at `c54fa14c5` into `alfonso-frontend-jjtl`, merge base `1e9e616fa`, 4 commits on the branch side.
**Files touched**: merge `67320b999`: 13 files from the branch side (`cloudflare-worker/.gitignore`, `cloudflare-worker/README.md`, `cloudflare-worker/package-lock.json`, `cloudflare-worker/package.json`, `cloudflare-worker/src/index.ts`, `cloudflare-worker/tsconfig.json`, `cloudflare-worker/wrangler.toml`, `docs/CODEBASE-MAP.md`, and 5 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `67320b999` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9229 tests in 377 files, 9 red at import, hooks 787; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no visible UI change: Worker source in cloudflare-worker/ (7 files, no node_modules) and getEndpoint now defaults to the production Worker in every mode; checked by chat C-2026-10-17-1518 under RC-25
**Notes**: Rollback tag `pre-ai-models-discovery` on `6d648354a` (RC-31). Union: `docs/log-inbox/maintenance.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-18-1226/result.json`.
**Prompt document name**: 2026-10-18 12:26

## 2026-10-18 — feat: dynamic model lists for Anthropic, OpenAI and Gemini; connection test as GET models (P-2026-10-18-1146)
**Prompt**: Phase 2 of `claude_2026-10-18_1146_prompt_discovery_ai_proxy_dynamic_models.md`, slices (c1), (c2) and (d), GO from chat `C-2026-10-17-1518` on Alfonso's «si procedi» (2026-10-18 14:35), worktree `~/jjodel-w-aimodels` on `ai-models-dynamic` at `a3ec93534`.
**Files touched**: `b8b2724de` (c1): `services/aiModelCatalog.ts` (new), `services/__tests__/aiModelCatalog.test.ts` (new), `types/jodie.ts`, `services/AIProviderService.ts`, `events/registry.ts`. `7044b6812` (c2): `common/ProviderModelSelector.tsx`, `common/ProviderModelSelector.scss`, `settings/AISettingsContent.tsx`, `Jodie/Jodie.tsx`, `services/AIProviderService.ts`, `services/aiModelCatalog.ts`, its test. `2a9ff5f02` (d): `aiModelCatalog.ts`, `AIProviderService.ts`, `types/jodie.ts`, both service tests. This commit: this inbox, the prompt's Status line. All under `frontend/src/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — after each slice typecheck exit 0, build exit 0, touched vitest green; at the end the full suite 9280 tests green in 370 files, red only the nine import-time files of CLAUDE.md §17. Mutation benches: 4 + 4 mutations caught (c1, d). Not measured: a real key against the three providers (none available to the lane).
**Out-of-scope changes**: yes — `events/registry.ts` (c1, the `MODELS_UPDATED` key the dispatch needs), `Jodie/Jodie.tsx` (c2, the capability re-read), named in the report §3.2 but not in the GO's slice lists.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — probe `_tmp_models_picker.ts` via lane-run probe on port 3197, fixture catalog, no key, 0 provider calls: 11/11; crops `~/.jjodel-lanes/P-2026-10-18-1146/models_picker_{collapsed,expanded}.png`, measures in `models_picker_measures.json`
**Notes**: Commit `2a9ff5f02` says aiModelCatalog.test.ts 30/30: the count is 28/28 (AIProviderService 18/18). First probe run hit :3000 through `states.ts` BASE_URL (SMOKE_URL unset); rerun with SMOKE_URL on 3197, fresh browser context, nothing persisted on 3000. Unavailable badge and static marker covered by tests, not by a crop.
**Prompt document name**: 2026-10-18 11:46

## 2026-10-18 — merge: ai-models-dynamic into alfonso-frontend-jjtl (P-2026-10-18-1457)
**Prompt**: `claude_2026-10-18_1457_prompt_merge_ai-models-dynamic.md`, a direct merge by `lane-run merge --direct`, no session: `ai-models-dynamic` at `abcff0f69` into `alfonso-frontend-jjtl`, merge base `a3ec93534`, 4 commits on the branch side.
**Files touched**: merge `fd9da9bef`: 12 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-18_1146_prompt_discovery_ai_proxy_dynamic_models.md`, `frontend/src/components/Jodie/Jodie.tsx`, `frontend/src/components/common/ProviderModelSelector.scss`, `frontend/src/components/common/ProviderModelSelector.tsx`, `frontend/src/components/settings/AISettingsContent.tsx`, `frontend/src/events/registry.ts`, `frontend/src/services/AIProviderService.ts`, and 4 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `fd9da9bef` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9280 tests in 379 files, 9 red at import, hooks 808; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Settings model picker: Alfonso checked the collapsed and expanded crops (2026-10-18 15:03, OK); DOM measures: main list and Show older row fixed, only the popover footer moves
**Notes**: Rollback tag `pre-ai-models-dynamic` on `a3ec93534` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-18-1457/result.json`.
**Prompt document name**: 2026-10-18 14:57
