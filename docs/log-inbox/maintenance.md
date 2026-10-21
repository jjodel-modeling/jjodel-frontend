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
## 2026-10-18 — feat(auth): editorial layout for sign in, register and password reset (P-2026-10-18-1500)
**Prompt**: `claude_2026-10-18_1500_prompt_login_redesign.md`, full lane, two phases in cascade, worktree `jjodel-w-login` on `login-redesign`: design D2 for the auth page (header, intro column + form card, dark footer), behaviour of the three views unchanged.
**Files touched**: `b8a12dc99` and fix `a42694244` (chat's visual check): `frontend/src/pages/Auth.tsx`, `frontend/src/pages/auth.scss`. Closure commit: `docs/discovery/discovery_2026-10-18_auth_page_redesign.md`, this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — typecheck exit 0, build exit 0, no test touches the auth page; full vitest 12 files red, the nine of §17 plus laneRun, laneRunDirect, laneRunRouting (`Unknown file extension ".ts"` on `scripts/gates/decisions-query.ts`), red on the tip `87feac64a` too. Login, register and reset submits not exercised against the API.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: OK — chat, RC-23, 2026-10-18 16:20, built-in browser on :3010, 1440x900 login/register/reset and 390x844 register: layout as D2, intro and card top-aligned, labels match titles; lane's own headless probe on port 3010, 3 views × 4 sizes, no horizontal scroll, 0 page errors (report, Phase 2 results)
**Notes**: Header logo is `logo-light-150.png` (Navbar's dark wordmark): `jjodel.png` is white and was invisible on the new header, prompt context item 2 does not hold. Register lead line «Fields marked * are required» omitted: the `*` appears only after a failed submit. Fix `a42694244`: grid top-aligned, buttons Sign in/Create account/Send reset link (chat overrode decision 3). Addendum: fix `7af2695b3` after merge `60db4fad7`, one centered 1200px box for header, grid and footer (report).
**Prompt document name**: 2026-10-18 15:00

## 2026-10-18 — feat(auth): compact register view, legal links, no newsletter opt-in (P-2026-10-18-1720)
**Prompt**: `claude_2026-10-18_1720_prompt_register_compact.md`, fast lane, worktree `jjodel-w-register` on `register-compact`: register view in two columns without page scroll at 1440x900, Terms and Privacy links, newsletter opt-in removed.
**Files touched**: `1d17792d9`: `frontend/src/pages/Auth.tsx`, `frontend/src/pages/auth.scss`. Left uncommitted for the chat's closure commit: `docs/discovery/discovery_2026-10-18_auth_page_redesign.md` (section «Register compact»), this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — typecheck exit 0, build exit 0; no test touches the auth page; register/login/reset submits not exercised against the API, and `NewsletterEnabled` is now absent from the register payload instead of `false`.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — lane probe only (headless, port 3011): register fits at 1440x900, 1280x800, 1920x1080 (scrollHeight = viewport), no horizontal scroll, 0 page errors on 12 loads; chat's visual check pending, dev server left on 3011
**Notes**: Grid column is `minmax(280px, 1fr)` rather than `1fr` (intro would be 124px at 1100px); identical to the spec from 1256px up. Session ran on Sonnet 5.5 (banner), not the Opus 5.5 pin; the commit trailer says so.
**Prompt document name**: 2026-10-18 17:20

## 2026-10-19 — fix(menu): debug and empty Tools entries out, small-metamodel guard on Polymetric View, Help 404 out (P-2026-10-19-1745)
**Prompt**: `claude_2026-10-19_1745_prompt_main_menu_cleanup.md`, fast lane, worktree `jjodel-w-menuclean` on `menu-cleanup`: remove debug menu entries and the disabled Tools items, drop `(beta)` from Polymetric View and guard it below 10 metaclasses, remove dead Help links.
**Files touched**: `2794a2537`: `frontend/src/pages/components/Navbar.tsx`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/polymetric/polymetricMetrics.ts`. Docs commit: this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — typecheck exit 0, build exit 0, smoke GREEN 12/0/3 skip, 5 Navbar-mentioning test files 66/66; menu and guard not exercised in a browser by the lane.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — chat's RC-23 checklist pending on dev server 3112 (PID 79798 in `~/.jjodel-lanes/P-2026-10-19-1745/dev.pid`)
**Notes**: Decisions taken (unattended): guard in EditorV2's OPEN_POLYMETRIC handler, metamodel target only (model target renders objects, no metaclass count); count via new `countPolymetricMetaclasses` mirroring `extractMetamodelMetrics`' `lModel.classes`; reuses `ConfirmDialog`, variant info. Help: only Video Tutorials removed, 8 remaining URLs 200 at 17:48. dev.pid holds the listener, not the npm wrapper.
**Prompt document name**: 2026-10-19 17:45

## 2026-10-19 — merge: menu-cleanup into alfonso-frontend-jjtl (P-2026-10-19-1806)
**Prompt**: `claude_2026-10-19_1806_prompt_merge_menu-cleanup.md`, a direct merge by `lane-run merge --direct`, no session: `menu-cleanup` at `ae0c814c9` into `alfonso-frontend-jjtl`, merge base `19a52a30a`, 2 commits on the branch side.
**Files touched**: merge `5a082c73a`: 5 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-19_1745_prompt_main_menu_cleanup.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/polymetric/polymetricMetrics.ts`, `frontend/src/pages/components/Navbar.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `5a082c73a` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9415 tests in 384 files, 9 red at import, hooks 936; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: RC-23 by the chat on the branch dev server 3112 (offline project, empty metamodel, Advanced): View without Debug Mode, Tools opens on Configure Environment with no leading divisor, Polymetric View without beta, Analyze without Debug loops, Help without Video Tutorials; Small metamodel ConfirmDialog shown, Open anyway opens the view, Cancel closes both; console only the pre-existing init_dash. Merge gates all green.
**Notes**: Rollback tag `pre-menu-cleanup` on `36f94e3fb` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-19-1806/result.json`.
**Prompt document name**: 2026-10-19 18:06

## 2026-10-20 — chore(jjscript): remove TEMP-DISCOVERY timing logs (P-2026-10-20-0032)
**Prompt**: `claude_2026-10-20_0032_prompt_jjscript_timing_logs.md`, fast lane, one phase, chat `C-2026-10-20-0003`, worktree `jjodel-w-timinglogs` on `jjscript-timing-logs`: remove the `TEMP-DISCOVERY` instrumentation (`performance.now()` timers, `(this as any)._t*` fields, two `[JjScript-TIMING]` console.log calls) from the executor and ScriptBlock, against CLAUDE.md §2.
**Files touched**: `ee21998fd`: `frontend/src/jjscript/executor/executor.ts` (15 lines deleted), `frontend/src/jjscript/components/ScriptBlock.tsx` (3 lines deleted). This commit: this inbox, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck exit 0, no `error TS`; vitest on `src/jjscript` 734 tests green in 27 files, 1 file red at import (`context-binding.test.ts`, `window is not defined`, the known one of §17); build exit 0; `rg 'TEMP-DISCOVERY|JjScript-TIMING|_tParse|_tLast|_waitMs|_applyMs|_iterStart|_tTotal' frontend/src` exit 1, no match.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — P8 derogated by the prompt: no visible change, the gates and the empty grep are the check.
**Notes**: Deletions only; every other statement and its order kept, the timers wrapped no real work. The first edit on `executor.ts` was blocked once by the rule-trigger hook until `frontend/src/jjscript/CLAUDE.md` was read, then retried unchanged. No unattended decisions taken. check:docs result in the closing report.
**Prompt document name**: 2026-10-20 00:32

## 2026-10-20 — merge: jjscript-timing-logs into alfonso-frontend-jjtl (P-2026-10-20-0046)
**Prompt**: `claude_2026-10-20_0046_prompt_merge_jjscript-timing-logs.md`, a direct merge by `lane-run merge --direct`, no session: `jjscript-timing-logs` at `1d5975fbb` into `alfonso-frontend-jjtl`, merge base `b91d9bb1a`, 3 commits on the branch side.
**Files touched**: merge `a5622549a`: 4 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-20_0032_prompt_jjscript_timing_logs.md`, `frontend/src/jjscript/components/ScriptBlock.tsx`, `frontend/src/jjscript/executor/executor.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `a5622549a` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9436 tests in 384 files, 9 red at import, hooks 952; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: gates only, all green (typecheck 0, vitest 9436 with the 9 known import reds, build 0, checks 0); no UI change, temporary TEMP-DISCOVERY timing logs removed
**Notes**: Rollback tag `pre-jjscript-timing-logs` on `84221a8fc` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-20-0046/result.json`.
**Prompt document name**: 2026-10-20 00:46

## 2026-10-20 — fix(editor): build References target lists only when the section is open (P-2026-10-20-1955)
**Prompt**: `claude_2026-10-20_1955_prompt_info_refs_lazy_finish.md`, continuation of the ceiling-stopped P-2026-10-20-1830 (RC-51): review the uncommitted fix, add an opt-in probe step counting `validTargets*` calls on opening «References», run the gates, the m1 check and the before/after medians, commit, remove the temporary `node_modules` symlink, close.
**Files touched**: `e392e7c68`: `frontend/src/components/editors/Info.tsx`, `frontend/src/components/editors/InfoReferenceSlots.tsx` (new), `frontend/src/components/editors/__tests__/infoReferenceSlots.test.ts` (new), `frontend/scripts/probe/large-model-click-profile.ts` (`CLICK_OPEN_REFS=1`); this commit: this entry and the Status lines of the 1830 and 1955 prompts. Phase 1 of 1830: `fd84e7202` (probe), `3c7dc32f9` (report).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — the visual check is the chat's after the merge
**Notes**: Medians r1-r3, long-task sum: Activity 6805 -> 1196 ms, gateway 1254 -> 1312 ms. Gates: typecheck 0, vitest 9449 tests with the 9 known import reds, build 0. m2 killed by the unit test. Gap: m1 (body evaluated eagerly) and the closed-section case are not unit-tested, Info.tsx does not import in vitest (monaco via joiner); covered by the probe counter only, run by hand: fix 3 calls on click and 4 on open, m1 7 and 0. Regressions unknown until the visual check.
**Prompt document name**: 2026-10-20 19:55

**Ticket** (deferred root cause, core, needs discussion): `LModelElement.fullname` walks the model in O(n) (≈ 14-18 ms a read on 407 objects) and `LValue.get_validTargets` reads it once per option, so opening «References» still costs ≈ 2.9 s for 4 slots on the Activity, and every other `validTargetsJSX` reader pays the same. Phase 1 of P-2026-10-20-1830 went out as two commits, not one, because bash-guard holds P13; `InfoReferenceSlots.tsx` was outside 1830's first scope and was added by the chat's ACK. Evidence: `docs/discovery/discovery_2026-10-20_large_model_click_profile.md` §4.3, §7.

## 2026-10-20 — merge: perf-click-profile into alfonso-frontend-jjtl (P-2026-10-20-2020)
**Prompt**: `claude_2026-10-20_2020_prompt_merge_perf-click-profile.md`, a direct merge by `lane-run merge --direct`, no session: `perf-click-profile` at `7299b9e6b` into `alfonso-frontend-jjtl`, merge base `9d74b12f7`, 5 commits on the branch side.
**Files touched**: merge `bfab138ba`: 8 files from the branch side (`docs/discovery/discovery_2026-10-20_large_model_click_profile.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-20_1830_prompt_large_model_click_profile.md`, `docs/prompts/claude_2026-10-20_1955_prompt_info_refs_lazy_finish.md`, `frontend/scripts/probe/large-model-click-profile.ts`, `frontend/src/components/editors/Info.tsx`, `frontend/src/components/editors/InfoReferenceSlots.tsx`, `frontend/src/components/editors/__tests__/infoReferenceSlots.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `bfab138ba` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9449 tests in 385 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Built-in browser, Jjodel harness, BPMN viewpoint after merge bfab138ba: selection click on Activity write the Phase 2 prompt 2.2 s of long tasks (was 1.6 + 17.4 s in the same browser), on write the ratification memo 3.0 s (was up to 58.7 s); References closed builds no lists; opened it shows 4 slots (performer, lanes, inputs, outputs), 7 selects with their targets, in 2.4 s
**Notes**: Rollback tag `pre-perf-click-profile` on `06610a866` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-20-2020/result.json`.
**Prompt document name**: 2026-10-20 20:20

## 2026-10-21 — merge: perf-slow-round2 into alfonso-frontend-jjtl (P-2026-10-21-0013)
**Prompt**: `claude_2026-10-21_0013_prompt_merge_perf-slow-round2.md`, a direct merge by `lane-run merge --direct`, no session: `perf-slow-round2` at `e9bc60d16` into `alfonso-frontend-jjtl`, merge base `fb35595fa`, 2 commits on the branch side.
**Files touched**: merge `5c462acac`: 2 files from the branch side (`docs/discovery/discovery_2026-10-20_large_model_slowness_round2.md`, `frontend/scripts/probe/large-model-click-profile.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `5c462acac` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9599 tests in 389 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs and probe only, no product code; merge gates green
**Notes**: Rollback tag `pre-perf-slow-round2` on `37b4150b8` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-0013/result.json`.
**Prompt document name**: 2026-10-21 00:13

## 2026-10-21 — fix(model): LModel.name without the $name scan, duplicate names in O(n) (P-2026-10-21-0030)
**Prompt**: `claude_2026-10-21_0030_prompt_core_name_scans.md`, full lane (core `src/model/`, Phase 1 waived by Alfonso), worktree `~/jjodel-w-corenames` on `core-name-scans`, session `007d87b7`: fixes 4 and 2 of `discovery_2026-10-20_large_model_slowness_round2.md` §5, LIR first, probe acceptance.
**Files touched**: `712f66020`: `docs/lir/lir_2026-10-21_core_name_scans.md`. `b16e1ad57`: `frontend/src/model/logicWrapper/LModelElement.tsx` (`LModel.get_name`), `frontend/src/model/logicWrapper/nameUniqueness.ts` (`detectDuplicateNames`), `frontend/src/model/__tests__/m1DuplicateNames.test.ts` (new). This commit: this entry, the prompt's Status line.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: unknown. Probe steps green, in-page check equal on M1 and M2 models, 9 new tests and the uniqueness suites green; the badges are not checked on screen until the chat's visual check after the merge.
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile (verifica della chat dopo il merge)
**Notes**: Dev medians r1-r3: commit 2479 -> 1088 ms, target <= 900 missed because today's baseline is 2479 against the discovery's 1990 (detectDuplicateNames inclusive 1257 -> 86 ms); References 2184 ms task -> none; fullname 409 -> 2 name reads; clicks not worse (interleaved control r4/r5). Mutations m1-m3 killed; m1 only in page (LModelElement.tsx does not load under vitest). Second cause (a): an absolute target on a drifting baseline. Detail in the commit body of `b16e1ad57`.
**Prompt document name**: 2026-10-21 00:30

## 2026-10-21 — merge: core-name-scans into alfonso-frontend-jjtl (P-2026-10-21-0149)
**Prompt**: `claude_2026-10-21_0149_prompt_merge_core-name-scans.md`, a direct merge by `lane-run merge --direct`, no session: `core-name-scans` at `466971410` into `alfonso-frontend-jjtl`, merge base `6a4cc3116`, 3 commits on the branch side.
**Files touched**: merge `2e9a4dd6c`: 6 files from the branch side (`docs/lir/lir_2026-10-21_core_name_scans.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-21_0030_prompt_core_name_scans.md`, `frontend/src/model/__tests__/m1DuplicateNames.test.ts`, `frontend/src/model/logicWrapper/LModelElement.tsx`, `frontend/src/model/logicWrapper/nameUniqueness.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2e9a4dd6c` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9668 tests in 392 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Built-in browser, Jjodel harness BPMN after merge 2e9a4dd6c: 48 nodes 42 edges; selection click 1.5 s of long tasks (was 2.2); rename of Role architect committed in 1.3 s (was about 2 s), reverted; References of architect opened with 16 selects (2 slots, 18 to 42 options) and no long task (was 2.4 s); model name shown in the status bar
**Notes**: Rollback tag `pre-core-name-scans` on `2a8fd6bdc` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-0149/result.json`.
**Prompt document name**: 2026-10-21 01:49

## 2026-10-21 — fix(editor-v2): useJjomSync re-transforms only changed vertices (P-2026-10-21-0335)
**Prompt**: `claude_2026-10-21_0335_prompt_jjomsync_incremental_finish.md`, full lane (critical zone, `useJjomSync.ts`), continuation of P-2026-10-21-0155 after its context-ceiling stop (RC-51), from its `handoff.md`: probe acceptance in three dev runs, the `Date.now()` and anti-bounce benches, the code commit and the closure.
**Files touched**: `242a82bcd`: `frontend/src/components/editor-v2/hooks/useJjomSync.ts`, `frontend/src/components/editor-v2/sync/vertexSnapshot.ts` (new), `frontend/src/components/editor-v2/sync/__tests__/vertexSnapshot.test.ts` (new), `frontend/src/redux/reducer/__tests__/reducerCopyOnWrite.test.ts`. This commit: this inbox, the Status lines of P-2026-10-21-0035, P-2026-10-21-0155 and P-2026-10-21-0335.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates and probe show none: typecheck 0 error TS; build ok; vitest 384 files passed, 9 known red at import, 9708 tests, criticalZone 70/70 with the go-ahead variable unset; BPMN 48 nodes 42 edges; the audit's one standing stale row is identical on HEAD's `useJjomSync.ts`. The visual check is the chat's and still pending.
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile (the visual check is the chat's, pending)
**Notes**: Drag median 1661 ms, 421 name reads per drag, open, clicks, commit and viewpoint switch all below the report baseline. `Date.now()` restored: 16 sync runs per drag against 1, no change in reads or time. Removing the anti-bounce re-run is caught by no instrument (gap). `frontend/scripts/probe/_tmp_*` is not gitignored, so the temporary probe lived in `scripts/smoke/` and was deleted. Measurements and the mutation table are in the body of `242a82bcd`.
**Prompt document name**: 2026-10-21 03:35

## 2026-10-21 — ticket: M2 attribute rename leaves M1 nodes stale under a viewpoint
**Ticket**: Under the «Harness / Authority» viewpoint, renaming the M2 attribute behind a slot (`name` → `name_r`) leaves 3 object nodes showing the old feature name 3 s later, while a fresh `jjomVertexToRFNode` shows the new one. Abstract syntax refreshes the same row (0 stale of 407). The count is identical with HEAD's `useJjomSync.ts`, so it predates P-2026-10-21-0155 and the hash's `slotFeatureName` term does not reach these nodes. The node data under a viewpoint probably comes from a path other than the sync's re-transform (not measured).
**Priority**: low
**Found in**: P-2026-10-21-0335
**Detail**: `~/.jjodel-lanes/P-2026-10-21-0335/probe-_tmp_audit0335.log` (labels jjs-fin-tmp-auth and jjs-fin-tmp-auth-head)

## 2026-10-21 — merge: jjomsync-incremental into alfonso-frontend-jjtl (P-2026-10-21-0416)
**Prompt**: `claude_2026-10-21_0416_prompt_merge_jjomsync-incremental.md`, a direct merge by `lane-run merge --direct`, no session: `jjomsync-incremental` at `d2d18b2d5` into `alfonso-frontend-jjtl`, merge base `487dacb74`, 7 commits on the branch side.
**Files touched**: merge `d9ea6a486`: 11 files from the branch side (`docs/discovery/discovery_2026-10-21_jjomsync_incremental.md`, `docs/lir/lir_2026-10-21_jjomsync_incremental.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-21_0035_prompt_jjomsync_incremental.md`, `docs/prompts/claude_2026-10-21_0155_prompt_jjomsync_incremental_fix.md`, `docs/prompts/claude_2026-10-21_0335_prompt_jjomsync_incremental_finish.md`, `frontend/scripts/probe/large-model-click-profile.ts`, `frontend/src/components/editor-v2/hooks/useJjomSync.ts`, and 3 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d9ea6a486` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9708 tests in 393 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Built-in browser, Jjodel harness BPMN after merge d9ea6a486: 48 nodes 42 edges on open; selection click 1.2 s of long tasks (2.2 s before the night fixes on the same browser); drag of the Activity write the Phase 2 prompt by about 80 px with real mouse moves 2.2 s of long tasks including the drop, position written, dragged back, 48/42 unchanged. Rename and stale-node checks rely on the lane audit (0 stale in abstract syntax).
**Notes**: Rollback tag `pre-jjomsync-incremental` on `487dacb74` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-0416/result.json`.
**Prompt document name**: 2026-10-21 04:16

## 2026-10-21 — ticket: Layout autosave flush on pagehide cannot finish on large projects
**Ticket**: On a large project (Jjodel harness, 407 objects, 6.7 MB JSON before compression) the layout autosave takes 4.4 to 5.9 s wall: async-lz-string yields with setTimeout(0) every 10,000 input characters, 672 yields on this project. The `pagehide` and `visibilitychange` flush (`layoutAutosaveScheduler.ts:81-85`) calls the same asynchronous save, assuming the localStorage write arrives because it is synchronous; but the write comes after the 672 yields, so on a project this size a gesture made in the last 15 s before the tab closes is very likely lost. The «Unsaved changes» prompt is the only safety net. Read from the code by lane P-2026-10-21-0905 (round 3 report §3.1), not reproduced. Candidate fixes: a synchronous emergency path on pagehide (uncompressed JSON under a separate key, migrated on next load), or a shorter yield interval only for the flush. Persistence layer: needs Alfonso's decision on the on-disk shape.
**Priority**: medium
**Found in**: P-2026-10-21-0905

## 2026-10-21 — fix(editor-v2): fitViewOptions without a body style read per render (P-2026-10-21-1115)
**Prompt**: `claude_2026-10-21_1115_prompt_intrinsic_batch_finish.md`, full lane (critical zone, `viewpoint/ir/`), continuation of P-2026-10-21-1010 after its context-ceiling stop (RC-51), from its `handoff.md`: build, probe acceptance of the batched intrinsic measure and the cached inset, MiniMap decision, commits. Fix 1 missed its acceptance; the lane stopped with a question and the chat's ACK chose: commit the inset alone, drop the batch, the content-key cache to a new lane.
**Files touched**: `365f9ca9a`: `frontend/src/components/editor-v2/viewportInset.ts`, `frontend/src/components/editor-v2/__tests__/viewportInset.test.ts` (new), `frontend/src/components/editor-v2/EditorV2.tsx`. `1f9d718fd`: `frontend/scripts/probe/large-model-click-profile.ts` (`CLICK_LAYOUTS`). Reverted to the cut sha `2c4331c68`, no net change: `viewpoint/ir/useContentSize.ts` and its three hook benches; `intrinsicMeasureBatch.ts` and its test deleted before commit. This commit: this inbox, the Status lines of P-2026-10-21-0905, P-2026-10-21-1010 and P-2026-10-21-1115.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: unknown. Gates and probe show none: typecheck 0 error TS; build ok; vitest full 388 files passed, 10 failed (the 9 known at import and criticalZone, 70/70 with the go-ahead variable unset), 11423 tests passed; BPMN 48 nodes 42 edges, node sizes string-equal to the base in every run. The visual check is the chat's and still pending.
**Out-of-scope changes**: no. Eight files across three commits, all in the prompt's DOVE: the four code files above, this inbox, three prompt files.
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile (the visual check is the chat's, pending)
**Notes**: Inset: getPropertyValue 74/56/52/152 ms to 8-15/0/0/0; vp long tasks 1082 to 830 in a same-window pair at load 7. The batch was measured and dropped: drag measure self time 315 to 228-263 ms only, layouts per burst 135 to 1, drag long tasks median 1433, acceptance missed. MiniMap step skipped: load never at most 8 in 11:45-12:00 (second cause (g)). Numbers: `~/.jjodel-lanes/P-2026-10-21-1115/measurements.md`; batch: `batch.diff` there.
**Prompt document name**: 2026-10-21 11:15

## 2026-10-21 — merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1232)
**Prompt**: `claude_2026-10-21_1232_prompt_merge_perf-round3.md`, a direct merge by `lane-run merge --direct`, no session: `perf-round3` at `c06a8cd6d` into `alfonso-frontend-jjtl`, merge base `cce5ce378`, 8 commits on the branch side.
**Files touched**: merge `74b80d710`: 10 files from the branch side (`docs/discovery/discovery_2026-10-21_large_model_round3.md`, `docs/lir/lir_2026-10-21_intrinsic_batch_inset.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-21_0905_prompt_large_model_slowness_round3.md`, `docs/prompts/claude_2026-10-21_1010_prompt_intrinsic_batch_inset.md`, `docs/prompts/claude_2026-10-21_1115_prompt_intrinsic_batch_finish.md`, `frontend/scripts/probe/large-model-click-profile.ts`, `frontend/src/components/editor-v2/EditorV2.tsx`, and 2 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `74b80d710` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11427 tests in 398 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Built-in browser (dev, other lanes running), Jjodel harness after merge 74b80d710: BPMN 48 nodes 42 edges; selection click 1.0 s of long tasks; viewpoint switch to Authority 1.3 s, back to BPMN 2.4 s (viewpoint of 48 nodes with containers); no regression visible, inset read gone from the render per the lane probe
**Notes**: Rollback tag `pre-perf-round3` on `0ff5e64c9` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1232/result.json`.
**Prompt document name**: 2026-10-21 12:32
