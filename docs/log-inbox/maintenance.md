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

## 2026-10-21 — fix(editor-v2): intrinsic measure cache with inherited-CSS invalidation (P-2026-10-21-1535)
**Prompt**: `claude_2026-10-21_1535_prompt_intrinsic_cache_commit.md`, continuation of P-2026-10-21-1240 and P-2026-10-21-1355 (both stopped at the time limit): two more runs of the new build and one of the base under the load gate, acceptance on medians, the code commit and the closure.
**Files touched**: `1a54325f2`: `frontend/src/components/editor-v2/viewpoint/ir/intrinsicMeasureCache.ts` (new), `viewpoint/ir/useContentSize.ts`, `viewpoint/ir/__tests__/intrinsicMeasureCache.test.ts` (new), `frontend/scripts/probe/large-model-click-profile.ts`; this commit: this entry and the Status of the prompts 1240, 1355 and 1535.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: unknown: node sizes string-equal and stale 0 on every production run, typecheck exit 0 and build passed on the merged tree `5bc4d4f69` plus the change; vitest from 1355 on the pre-merge tree only, no human visual check
**Out-of-scope changes**: no
**Layer Impact Report**: produced (P-2026-10-21-1240, `docs/lir/lir_2026-10-21_intrinsic_cache.md`, `e42b8e120`)
**Smoke visivo**: non applicabile (production probe only, table in the body of `1a54325f2`)
**Notes**: Absolute thresholds missed on medians: ring p50 87 (85), move p95 120 (100); 86/120 with new-5 replacing new-4, spiked to load 151. They came from one ablation run, not a median: cause (a). Chat ACK relaxed them to relative: -26 %/-26 % vs same-window base (at least 15 %), drag -75 % (at least 50 %). Sizes sha1 de0b0609592d on 8 runs, control 41 vs 0. Runs: `~/.jjodel-lanes/P-2026-10-21-1535/handoff.md`.
**Prompt document name**: 2026-10-21 15:35

## 2026-10-21 — merge: perf-round3 into alfonso-frontend-jjtl (P-2026-10-21-1753)
**Prompt**: `claude_2026-10-21_1753_prompt_merge_perf-round3.md`, a direct merge by `lane-run merge --direct`, no session: `perf-round3` at `23c49ad70` into `alfonso-frontend-jjtl`, merge base `d46ad0632`, 5 commits on the branch side.
**Files touched**: merge `460d77437`: 9 files from the branch side (`docs/lir/lir_2026-10-21_intrinsic_cache.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-10-21_1240_prompt_intrinsic_cache.md`, `docs/prompts/claude_2026-10-21_1355_prompt_intrinsic_cache_finish.md`, `docs/prompts/claude_2026-10-21_1535_prompt_intrinsic_cache_commit.md`, `frontend/scripts/probe/large-model-click-profile.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/intrinsicMeasureCache.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/intrinsicMeasureCache.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `460d77437` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 11522 tests in 401 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Built-in browser (dev, zoom 60%), Jjodel harness after merge 460d77437: BPMN 48 nodes 42 edges; selection click 0.4 s of long tasks (145/129/121), ring in 745 ms by rAF polling under dev load; drag of about 80 px 0.69 s of long tasks including the drop, dragged back; node sizes unchanged on screen
**Notes**: Rollback tag `pre-perf-round3-P-2026-10-21-1753` on `b0a5ec435` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-21-1753/result.json`.
**Prompt document name**: 2026-10-21 17:53

## 2026-10-30 — ticket: JjTL: a transformation run is many undo steps, not one
**Ticket**: A JjTL transformation run in the app writes the output model through several deferred steps (STEP 6c addObject per level, then the attribute timer). Each write is its own undo entry, so undoing a run takes many steps and can stop half-way with a partial output model.

Expected: one transformation run is one undo step.

Found by P-2026-10-30-1440 (report docs/discovery/discovery_2026-10-30_jjtl_nested_materialization.md, section 8, Q7); left out of scope by decision of Alfonso 2026-10-30.
**Priority**: low
**Found in**: P-2026-10-30-1440

## 2026-10-30 — ticket: Rename via the $name slot bypasses the R-S1-2 same-name guard
**Ticket**: R-S1-2 refuses a second child with the same explicit name in one containment slot at creation (addObject). A rename written through the child $name slot afterwards is not checked: the P-2026-10-30-1335/1440 probe produced two same-named siblings in one slot with no toast and no refusal.

R-S1-6 (2026-10-30) makes the JjTL output deliberately use this path for nested objects, so the fix must keep that exception: decide whether set_name through the $name slot should run the R-S1-2 verdict for user gestures and JjScript, and how the transformation path opts out.

Measured in docs/discovery/discovery_2026-10-30_jjtl_nested_materialization.md.
**Priority**: medium
**Found in**: P-2026-10-30-1440

## 2026-11-02 — ticket: Opening a large model with no viewpoint lands the canvas on an empty area
**Ticket**: Opening the harness model (`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`, 407 nodes) with no viewpoint lands the canvas on an empty area: `translate(~-1224, -9802) scale(0.5)` in most runs, `(-1197, -1107)` in others, on trunk `4383c2572` and on the branch of P-2026-11-02-0020 alike. No node is in view at open; the user sees an empty canvas and must zoom out or fit by hand. Found by P-2026-11-02-0020 (DOM check and the click-profile probe, which reports `visible nodes in the target pane 0` and cannot click or drag).

Expected: opening a model fits the view to its nodes (or restores a saved viewport that contains nodes). The viewport at open should be deterministic for the same file.
**Priority**: medium
**Found in**: P-2026-11-02-0020

## 2026-11-02 — perf(editor-v2): conditional onlyRenderVisibleElements (P-2026-11-02-0225)
**Prompt**: Close P-2026-11-02-0020 from its handoff: rerun typecheck and the colocated test, commit the code with explicit pathspec, write this entry and the two Status lines uncommitted (RC-17), delete the temp DOM probe and the trunk worktree. Alfonso accepted on 2026-11-02 02:20 the open time and his hand measurement of 2026-10-31 for the no-viewpoint case.
**Files touched**: 36694dbfb: frontend/src/components/editor-v2/EditorV2.tsx (import, useMemo `onlyRenderVisible`, prop on `<ReactFlow>`), NEW frontend/src/components/editor-v2/onlyRenderVisible.ts, NEW frontend/src/components/editor-v2/__tests__/onlyRenderVisible.test.ts. Uncommitted: this entry, Status lines of docs/prompts/claude_2026-11-02_0020_prompt_only_visible_conditional.md and claude_2026-11-02_0225_prompt_only_visible_conditional_closure.md.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (RC-23, built-in browser, 2026-11-02 02:55, dev server of only-visible-conditional; Alfonso GO 06:46)
**Notes**: Partial: no-viewpoint drag unmeasured, the probe viewport opens on an empty area on both builds, so no node is clicked; a probe change, its own lane. Causa (g): smoke run 1 timed out on page.goto on a cold server, run 2 green. New module is the pure-predicate seam of 0020 item 2 (EditorV2 does not import in the bench). Handoff said 13 tests; the tree holds 12, byte-identical to handoff.diff. Supersedes branch only-visible-wip, prompts P-2026-11-01-0040..2335.
**Prompt document name**: 2026-11-02 02:25

**Ticket** (evidence, from the 0020 handoff). Timing, CLICK_PROD=1 CLICK_STEPS=open,drag CLICK_NODES=1, trunk and branch interleaved, load gate 1-min < 16, wallMs, three runs each:

| case | step | trunk | branch | median trunk / branch |
|------|------|-------|--------|-----------------------|
| no viewpoint | open | 17735 17849 17602 | 6009 6060 5974 | 17735 / 6009 |
| BPMN | open | 5209 5297 5459 | 5149 5133 5558 | 5297 / 5149 |
| BPMN | drag | 4709 4827 5261 | 4701 4690 5282 | 4827 / 4701 |

Gates on 0020: typecheck exit 0; build exit 0; vitest 468 files passed, 9 failed (the known window-is-not-defined nine), 12659 tests passed; smoke 12 passed, 3 skipped (run 2); bpmn-lanes probe pass=12 fail=0. Rerun here: typecheck exit 0, colocated test 12/12. Mutation bench 11, 10 killed; m10 (dropping the `checked` dedupe) survives, cost only. DOM checks (prod previews 3092 branch, 3093 trunk): open viewport nondeterministic on both builds; no viewpoint at translate(~-1224,-9802) scale(0.5): branch 0 nodes, 104 edges (99 crossing, none zero-length), trunk 407 nodes, 0 in view, 97 edges crossing; minimap 407 = 407; BPMN 48 nodes 42 edges on both; console errors only `init_dash` on both. Not done: the zoom-in edge pick, covered by the 0-node case.

**Timing, no viewpoint, drag** (P-2026-11-02-0233, probe 604f578ed). CLICK_PROD=1 CLICK_VP=- CLICK_FIT=1 CLICK_STEPS=open,drag CLICK_NODES=1, prod previews (trunk = merge base 4383c2572, branch = 9217e9185), interleaved, 1-min load 2.06-3.61, three runs each. Viewport on all six runs x 124, y -9862, zoom 0.5 (minZoom clamp, centred on the node nearest the bbox centre); drag from the same point (437,569) on the same object `dRC_13`. wallMs includes the settle; act = the mouse sequence; LT = long-task sum and longest task in the drag step (the probe has no hitch measure of its own, the longest task stands in).

| step | trunk | branch | median trunk / branch |
|------|-------|--------|-----------------------|
| open wallMs | 18463 18046 18393 | 6020 6016 6939 | 18393 / 6020 |
| drag wallMs | 5991 6114 6099 | 3713 3709 3726 | 6099 / 3713 |
| drag act ms | 2967 3107 3081 | 704 703 719 | 3081 / 704 |
| drag LT sum | 1033 1821 2640 | 58 234 119 | 1821 / 119 |
| drag longest LT | 270 270 275 | 58 60 60 | 270 / 60 |

## 2026-11-02 — merge: only-visible-conditional into alfonso-frontend-jjtl (P-2026-11-02-0656)
**Prompt**: Bring `only-visible-conditional` at bfb6ee654 (conditional onlyRenderVisibleElements 36694dbfb, CLICK_FIT probe 604f578ed) into the trunk `alfonso-frontend-jjtl` with one --no-ff merge commit of the explicit sha (RC-14); union resolution of this inbox.
**Files touched**: merge commit 7a4094009 (`frontend/src/components/editor-v2/EditorV2.tsx`, `onlyRenderVisible.ts`, `__tests__/onlyRenderVisible.test.ts`, `frontend/scripts/probe/large-model-click-profile.ts`, the branch's three prompts, this inbox); `docs/prompts/claude_2026-11-02_0656_prompt_merge_only-visible-conditional.md` Status line; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, RC-23, 2026-11-02 02:55 on the branch; Alfonso GO 06:46)
**Notes**: Gates on 7a4094009: typecheck and typecheck:scripts exit 0; vitest 482 files (473 passed, the 9 known import failures), 12754 tests = trunk 12742 + 12; hook tests 21 files, 967 = trunk; build exit 0; check:docs 5/5; check:agents, check:scripts, check:addonly PASS. Union in this inbox: the trunk's empty-viewport ticket first, then the branch's 0225 entry. No rollback tag (not in the prompt); lane board untouched.
**Prompt document name**: 2026-11-02 06:56

## 2026-11-02 — feat(jjtl): forall over several variables (P-2026-11-02-1331)
**Prompt**: Execute P-2026-10-31-1741 (superseded) with R-FA-1 and R-FA-7: JjTL `forall q, r in xs` and `forall q in xs, r in ys`, mixable, cartesian product first variable outermost, flat in the feature; a later collection reads an earlier variable; check the JjEL route. Two-phase in one session.
**Files touched**: bd135bd57 `docs/discovery/discovery_2026-11-02_jjtl_forall_multivar.md`; 482936ee5 `frontend/src/jjtl/parser/parser.ts`, `types/ast.ts`, `executor/executor.ts`, `executor/__tests__/forall-multivar.test.ts`, `parser/__tests__/forall-multivar.test.ts`; 0845044e3 `frontend/src/jjtl/SPEC.md`
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Seven files, all named by the prompt or its acceptance. `bindings?` is an optional field of ForAllMappingAST, read only in jjtl. JjEL route: the collection parser has no object literal (F5); records bound by let lost their ref getters in fromJjelValue, fixed in the executor (bindForAllElement). Gates: tsc 0 errors; vitest src/jjtl src/jjel 910 passed, the same 7 window failures before and after; build exit 0. node_modules: temporary symlink, removed.
**Prompt document name**: 2026-11-02 13:31

## 2026-11-02 — merge: jjtl-forall-multivar into alfonso-frontend-jjtl (P-2026-11-02-1404)
**Prompt**: `claude_2026-11-02_1404_prompt_merge_jjtl-forall-multivar.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-forall-multivar` at `fc3bfee2a` into `alfonso-frontend-jjtl`, merge base `17beac16c`, 4 commits on the branch side.
**Files touched**: merge `100889e0c`: 9 files from the branch side (`docs/discovery/discovery_2026-11-02_jjtl_forall_multivar.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-02_1331_prompt_jjtl_forall_multivar.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/executor/__tests__/forall-multivar.test.ts`, `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/__tests__/forall-multivar.test.ts`, `frontend/src/jjtl/parser/parser.ts`, and 1 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `100889e0c` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12843 tests in 486 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: parser and executor only, no UI change: visual check not applicable; merge gates green (12843 tests, 9 red at import, build exit 0)
**Notes**: Rollback tag `pre-jjtl-forall-multivar` on `8913bf878` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-1404/result.json`.
**Prompt document name**: 2026-11-02 14:04

## 2026-11-02 — feat(jjel): forall and exists over several variables (P-2026-11-02-1410)
**Prompt**: Close P-2026-11-02-1330 (hard-stop at the context ceiling, RC-51) from its handoff: decisions F1 `flatten`, F2 parse error, E-VALUE record rule adopted by the chat; add `forall x, y in |` and `forall x in A, y in |` to the `after-forall-in` autocomplete context with a test; SPEC.md grammar and §5.1.1; gates, code commit, log, Status flips, symlink removal.
**Files touched**: fd13ba517 (13 files: `frontend/src/jjel/parser/parser.ts`, `SPEC.md`, `autocomplete/context.ts`, `autocomplete/providers/identifier.ts`, `autocomplete/util/boundVariables.ts` new, `__tests__/forallMultivar.test.ts` new; `frontend/src/model/simulation/subsetChecker.ts`; tests of codegen printer, templateCompletion, jjscript parser, guardEvaluator, subsetChecker, validationEvaluator); Status lines of the 1330 and 1410 prompts; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 13 files, above five: the consumer fix in subsetChecker.ts (E-FORALL on a top flatten over ForAll, record projection not E-VALUE) and the provider were outside the parser. Gates: tsc exit 0; vitest jjel/jjscript/jjtl/codegen/validation/simulation 5096 tests passed, 8 suites the known window import failures; build exit 0. Context branch killed by a mutation (1 fail). Regressions unknown: the 3001 autocomplete check is the chat's, after the merge. Temporary node_modules symlink removed.
**Prompt document name**: 2026-11-02 14:10

## 2026-11-02 — merge: jjel-forall-multivar into alfonso-frontend-jjtl (P-2026-11-02-1511)
**Prompt**: `claude_2026-11-02_1511_prompt_merge_jjel-forall-multivar.md`, a direct merge by `lane-run merge --direct`, closed by hand by the chat because the worker ended blocked and `lane-run go` did not apply.
**Files touched**: merge `bf4b33e74`, the files of the branch side.
**Outcome**: ⚠️ partial: merged, one gate red in the worker
**Corregge**: —
**Causa**: —
**Regressions**: unknown. vitest 12886 tests, 4 failed, all in `codegen/engine/__tests__/defaultText.test.ts` and `codegen/textual/__tests__/textual.test.ts` (generation errors). Same run: 3 of the 4 red before the merge, 0 on the branch. The two files alone on the trunk, twice, load average 13: 23 of 23 green. Intermittent; the 2000 ms generation budget (R-GEN-28) under a full run is a hypothesis, the error text was not captured. Other gates green.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: on 3001, from the served modules: eight expressions as R-FA, both parse errors, three autocomplete contexts `after-forall-in`. The suggestion list in the console UI was not exercised.
**Notes**: Rollback tag `pre-jjel-forall-multivar` on `a122f5463`. Worker: `~/.jjodel-lanes/P-2026-11-02-1511/result.json`.
**Prompt document name**: 2026-11-02 15:11

## 2026-11-02 — feat(jjscript): forall...do over several variables (P-2026-11-02-1332)
**Prompt**: R-FA-7 in JjScript: `forall a, b in S ... do` and `forall x in A, y in x.f ... do` desugared by the parser to nested ForAllArgs, filter on the innermost; tests, one Jjodie prompt line.
**Files touched**: df3455a9d (4 files: `frontend/src/jjscript/parser/parser.ts`, `__tests__/parser.test.ts`, `executor/__tests__/forallMultivar.test.ts` new, `frontend/src/constants/defaultPrompts.ts`); Status of the 1332 prompt; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Executor, planner, guard, validator unchanged (planner: `unsupported: forall`, pinned by a test). Undo is the Run's group, not run end to end (executor does not import in the bench). `x, y in S` reading x is a regex parse error (a lambda rebinding x is a false positive). `rename b to b.name + _dup` does not parse (rename takes a name token, pre-existing). Gates: tsc 0, vitest 1425 passed (context-binding the known failure), build 0. Mutation: bindingContinues=false kills 5.
**Prompt document name**: 2026-11-02 13:32

## 2026-11-02 — merge: jjscript-forall-multivar into alfonso-frontend-jjtl (P-2026-11-02-1701)
**Prompt**: `claude_2026-11-02_1701_prompt_merge_jjscript-forall-multivar.md`, a direct merge by `lane-run merge --direct`, no session: `jjscript-forall-multivar` at `1d415bd5d` into `alfonso-frontend-jjtl`, merge base `767d350a3`, 2 commits on the branch side.
**Files touched**: merge `838ea1449`: 6 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-02_1332_prompt_jjscript_forall_multivar.md`, `frontend/src/constants/defaultPrompts.ts`, `frontend/src/jjscript/__tests__/parser.test.ts`, `frontend/src/jjscript/executor/__tests__/forallMultivar.test.ts`, `frontend/src/jjscript/parser/parser.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `838ea1449` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 12899 tests in 488 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: on 3001 from the served JjScript parser: both multi-variable spellings parse to nested forall, a repeated name is a parse error. No command was run on a model in the UI; merge gates green
**Notes**: Rollback tag `pre-jjscript-forall-multivar` on `767d350a3` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-1701/result.json`.
**Prompt document name**: 2026-11-02 17:01

## 2026-11-02 — ticket: Abstract-syntax viewport is not restored after a reload
**Ticket**: With no viewpoint (abstract syntax), reloading the page and reopening a model does not restore its stored viewport, while under a viewpoint (BPMN on the harness model) it does. Found by P-2026-11-02-0646 (discovery `docs/discovery/discovery_2026-11-02_open_viewport_empty.md`, §5.3 and open question 4), on HEAD `246edb1bc`: under BPMN the initial transform equals the stored `jjodel.viewport.<model>.<viewpoint>` value and no fit runs; without a viewpoint the key `jjodel.viewport.<model>.__abstract__` is present but the initial transform is the identity and a fresh fit runs.

Expected: the abstract-syntax viewport is restored on reopen like the viewpoint ones (the restore site is around `EditorV2.tsx:609`). Kept out of the #419 fix on purpose.
**Priority**: low
**Found in**: P-2026-11-02-0646

## 2026-11-02 — ticket: Toolbar auto layout blocks the page for minutes on a 407-node model
**Ticket**: On the harness model (`~/jjodel-papers/2026-sosym-harness-models/jjodel/jjodel.harness.project.jjodel`, 407 nodes, no viewpoint), the toolbar's full auto layout (button `title="Auto layout"`, `Toolbar.tsx:1042-1050`, handler `handleToolbarAutoLayout` in `EditorV2.tsx`) blocks the main thread for about 391 s before its fit runs. Observed by P-2026-11-02-1856 while probing the fit fallback of ticket #419 (the probe needed a 600 s wait); not measured on the trunk, so it is not known whether the cost is the same there.

Expected: measure it on the trunk first (open, auto layout, time to the fit, longest task, where the time goes: ELK layout, port distribution, React commit). A layout that takes minutes should at least run off the main thread or show progress and be cancellable.
**Priority**: medium
**Found in**: P-2026-11-02-1856

## 2026-11-02 — feat(jjscript): rename to a JjEL expression (P-2026-11-02-2030)
**Prompt**: R-FA-9: `rename ... to/as <expression>`; a single name followed by the end of the command stays literal, anything else is JjEL evaluated per execution with the forall variables and let bindings; errors carry expression and value; tests, help, one prompt line.
**Files touched**: bd161d1a9 (discovery `docs/discovery/discovery_2026-11-02_jjscript_rename_expression.md`); 62522c9bf (7 files: `frontend/src/jjscript/parser/parser.ts`, `types.ts`, `executor/commands/rename.ts`, `executor/effectsPlanner.ts`, `executor/commands/help.ts`, `executor/__tests__/renameExpression.test.ts` new, `frontend/src/constants/defaultPrompts.ts`); Status of the 2030 prompt; this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 7 files, all named by the prompt (effectsPlanner because it would plan a rename to the source text). R-FA-9 deviation: a single name before a trailing `in` stays literal (defaultPrompts.ts:147 form). Old `to "A_" + c.name` silently renamed to `A_` (F1). Gates: tsc 0, vitest jjscript+jjel 1448 passed (context-binding the known failure), build 0. Temp node_modules symlink, removed. Details: the discovery report.
**Prompt document name**: 2026-11-02 20:30

## 2026-11-02 — ticket: forall rename of same-named elements fails as ambiguous
**Ticket**: `executeForAll` substitutes the iteration variable in the body by the element's name (`forall.ts:79-82`), and the command resolves that name again. With two classes of one name in a metamodel, `resolveTargetInProject` returns `ambiguousWith` (measured on `e5e60dca4`), so `forall a, b in classes such that a != b and a.name == b.name do rename b to b.name + "_dup"` refuses every pair with `AMBIGUOUS_TARGET`, whatever the new name. Expected: the body acts on the iterated element (substitute by id, or pass the element through the context).
**Priority**: medium
**Found in**: P-2026-11-02-2030
**Detail**: docs/discovery/discovery_2026-11-02_jjscript_rename_expression.md

## 2026-11-02 — fix(editor-v2): an open fit that frames no node pans onto one (P-2026-11-02-1856)
**Prompt**: `claude_2026-11-02_1856_prompt_open_viewport_fix.md`, full lane, Phase 2 of P-2026-11-02-0646 on the GO of 2026-11-02 18:26 (Q1 the two auto-layout fits, Q2 a restored viewport with no node in view, Q3 anchor nearest the box centre, Q5 commit the probe). Closes ticket #419; the abstract-syntax restore stays ticket #440.
**Files touched**: `55e4d2703`: `frontend/src/components/editor-v2/openViewport.ts` (new), `frontend/src/components/editor-v2/__tests__/openViewport.test.ts` (new), `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/scripts/probe/open-viewport.ts` (new). Closure commit (RC-17): this inbox, the Status lines of the prompts P-2026-11-02-0646 and P-2026-11-02-1856.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato: chat, RC-23, 2026-11-02 ~19:55, built-in browser, dev server from open-viewport-empty, harness fixture, fresh profile, pane 822x644: no viewpoint first open shows nodes in view (2 at that pane) and stores the corrected viewport; BPMN after reload opens at (-1440.5, -1173, 0.5) with 9 nodes in view, as on the trunk with the same pane; no console errors. GO Alfonso 2026-11-02 20:20.
**Notes**: No viewpoint now opens at (-160.75, -10106.75, 0.5), 21 nodes in view, same over 3 fresh opens; BPMN unchanged (-1197.5, -1107, 0.5); reload, stored-empty, toolbar layout in view; 0 empty frames between fit and fallback, counter control 54/54. Bench 14 tests, 3 mutations killed. bpmn-lanes 12/12, smoke GREEN, typecheck 0, build ok. First full vitest had a 10th red (textual.test.ts R-TXT-21 (10)) under load: green alone and on the rerun.
**Prompt document name**: 2026-11-02 18:56

**Ticket** (P-2026-11-02-1856): the toolbar's full auto layout on the harness model with no viewpoint (407 nodes) holds the main thread about 391 s before its fit (probe `open-viewport.ts`, toolbar scenario, load under 6); measured on this branch only, not on the base, and the layout code is untouched here.

## 2026-11-02 — merge: open-viewport-empty takes alfonso-frontend-jjtl (P-2026-11-02-2028)
**Prompt**: `claude_2026-11-02_2028_prompt_open-viewport-empty_take_trunk.md`, full lane: bring the trunk at the explicit sha e5e60dca4 into open-viewport-empty with one --no-ff merge commit (RC-14), union for the inboxes; stopped at step 2 on the EditorV2.tsx conflict, resumed on the chat's authorization (RC-21, Alfonso GO 20:20) to keep both import lines.
**Files touched**: merge commit 91033dfc9 (the trunk's 127 files; resolved by hand: `docs/log-inbox/maintenance.md` by union, `frontend/src/components/editor-v2/EditorV2.tsx` the import hunk only); closure commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, GO 2026-11-02 on the merge tree; the chat runs the combined-tree visual check before the trunk merge)
**Notes**: Trunk tip moved to 4d1d32b8b (docs only, R-TXT-29); e5e60dca4 merged. Gates on 91033dfc9: typecheck and typecheck:scripts exit 0; vitest 492 files, 483 passed + the known 9, 12957 = trunk 12943 + 14; hooks 967 = trunk (a first run red on a laneBoard 10 s timeout, run beside the build, green alone); build exit 0; check:docs 5/5; check:scripts, check:addonly PASS. Full read of EditorV2.tsx by an explorer subagent.
**Prompt document name**: 2026-11-02 20:28

## 2026-11-02 — merge: open-viewport-empty into alfonso-frontend-jjtl (P-2026-11-02-2112)
**Prompt**: `claude_2026-11-02_2112_prompt_merge_open-viewport-empty.md`, full lane: bring open-viewport-empty at the explicit sha b319e15a2 into the trunk with one --no-ff merge commit (RC-14), union for the inbox conflict; stopped at step 7 for the chat's smoke, resumed on the GO (Alfonso GO 20:20).
**Files touched**: merge commit ebe3bd548 (the branch's 9 files; resolved by hand: `docs/log-inbox/maintenance.md` by union, base then trunk tail then branch tail); closure commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat, RC-23 on the combined tree, same code as ebe3bd548; GO 2026-11-02)
**Notes**: Trunk tip moved to 02586b29b (docs only, R-TXT-30); R-TXT-30 control counted 1 from the trunk, 0 on the branch. Gates on ebe3bd548: typecheck, typecheck:scripts exit 0; vitest 12988 = trunk 12974 + 14, the known 9 red at import; hooks 967 = trunk; build exit 0; check:docs 5/5; check:agents, check:scripts, check:addonly PASS. Trunk runs red on load timeouts (textual.test.ts 2000 ms, one laneRun 15 s), green alone.
**Prompt document name**: 2026-11-02 21:12

## 2026-11-02 — merge: jjscript-rename-expression into alfonso-frontend-jjtl (P-2026-11-02-2045)
**Prompt**: `claude_2026-11-02_2045_prompt_merge_jjscript-rename-expression.md`, a direct merge, closed by hand by the chat because the worker ended blocked.
**Files touched**: merge `43350d3cd`, the files of the branch side.
**Outcome**: ⚠️ partial: merged, one gate red in the worker
**Corregge**: —
**Causa**: —
**Regressions**: unknown, none attributed. vitest 12966 tests, 6 failed: 4 in `codegen/engine/__tests__/defaultText.test.ts` and `codegen/textual/__tests__/textual.test.ts`, 2 in `scripts/gates/__tests__/traceMonitor.test.ts`; 0 before the merge. The next merge, P-2026-11-02-2057, on a tree containing this one: 12974 tests, 0 failed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: on 3001 from the served parser: expression and literal forms parse as R-FA-9. The command was not run on a model.
**Notes**: Ticket, load-sensitive tests: the two codegen files alone gave 23 of 23 green at load 13, and 4 and 6 failures in two runs at load 140, generation errors. Hypotheses, not measured: the 2000 ms generation budget (R-GEN-28) and the `spawnSync` of `traceMonitor.test.ts` returning a null status under load. With parallel lanes they can block a direct merge at random. Rollback tag `pre-jjscript-rename-expression`.
**Prompt document name**: 2026-11-02 20:45

## 2026-11-02 — discovery: forall body by element id, stopped before Phase 2 (P-2026-11-02-2105)
**Prompt**: a `forall` body acts on the iterated element, not on its name (ticket «forall rename of same-named elements fails as ambiguous»); two-phase in one session.
**Files touched**: 4d28b4868 (`docs/discovery/discovery_2026-11-02_jjscript_forall_element_by_id.md`); Status line of the 2105 prompt; this entry
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Phase 1 only: report 4d28b4868 (probe, F1-F7, four questions; Phase 2 needed commands/eval.ts and commands/instance.ts, outside the DOVE list). The session hit the context ceiling (RC-51) before this entry; entry and Status were written by P-2026-11-02-2140 from its handoff.md. Phase 2 is P-2026-11-02-2140.
**Prompt document name**: 2026-11-02 21:05

## 2026-11-02 — feat(jjscript): forall body acts on the element by id (P-2026-11-02-2140)
**Prompt**: Phase 2 of P-2026-11-02-2105 with the chat's answers (R-FA-10): an `id` on the M2 shells, `instance.ts` and `eval.ts` in scope (7 files), `c.attr` fixed, identity on targets only as `QualifiedName.elementId`; both duplicates examples tested; the id neither persisted nor written back.
**Files touched**: 733ae10c0 (`frontend/src/jjscript/types.ts`, `executor/resolvers.ts`, `executor/executor.ts`, `executor/commands/forall.ts`, `executor/commands/instance.ts`, `executor/commands/eval.ts`, `executor/__tests__/forallById.test.ts` new); Status lines of 2105 and 2140; this entry and the 2105 one
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: `elementId` only on a `target`, denotes segments[0]; an id miss is a miss. Also substituted: `c.x` and `set c.p` (F4); an outer-bound target is not re-read by an inner variable. No existing test changed (vitest 4066 passed, context-binding the known failure); codegen untouched. Not executed here: the guard wiring in executor.ts and the M1 delete/set sites (no node import); undo. Gates: tsc 0, build 0. Temp node_modules symlink, removed.
**Prompt document name**: 2026-11-02 21:40

## 2026-11-02 — merge: jjscript-forall-by-id into alfonso-frontend-jjtl (P-2026-11-02-2222)
**Prompt**: `claude_2026-11-02_2222_prompt_merge_jjscript-forall-by-id.md`, a direct merge, closed by hand by the chat because the worker ended blocked.
**Files touched**: merge `371a3dfe2`, the files of the branch side.
**Outcome**: ⚠️ partial: merged, one gate red in the worker
**Corregge**: —
**Causa**: —
**Regressions**: unknown. vitest 13054 tests, 3 failed, in `defaultText.test.ts` and `textual.test.ts`, the load-sensitive tests of the ticket in P-2026-11-02-2045. The same two files alone on the merge, three runs at load 4: 23 of 23. These tests build no element through `commands/eval.ts`; read, not measured.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: not run. The `a != b` behaviour in the app (`NAME_CONFLICT` or both `Foo_dup`) stays unmeasured.
**Notes**: Rollback tag `pre-jjscript-forall-by-id`.
**Prompt document name**: 2026-11-02 22:22

## 2026-11-02 — test: codegen and trace-monitor tests get a load-proof time budget (P-2026-11-02-2250)
**Prompt**: `claude_2026-11-02_2250_prompt_load_sensitive_tests.md`: tests that fail under load, `defaultText.test.ts`, `textual.test.ts` (via `spec.ts`) and the CLI tests of `traceMonitor.test.ts`.
**Files touched**: `frontend/src/codegen/engine/__tests__/defaultText.test.ts`, `frontend/src/codegen/textual/__tests__/spec.ts`, `frontend/src/jjscript/executor/__tests__/unsetDefaultLiteral.test.ts`, `frontend/scripts/gates/__tests__/traceMonitor.test.ts`. Tests only; `text.ts` and the 2000 ms of R-GEN-28 untouched.
**Outcome**: ⚠️ partial: fix committed and gates green; the third verification was cut by the chat
**Corregge**: —
**Causa**: (g)
**Regressions**: no. tsc 0, typecheck:scripts 0, `vitest run src/codegen scripts/gates` 60 files, 2906 tests green, no load.
**Out-of-scope changes**: no. `unsetDefaultLiteral.test.ts` is the one other test of the same shape (default-text generator, default budget); it never failed.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Codegen: at 40 CPU hogs, 8 tests stopped with `Generation stopped after 2000 ms: template 'block' was still running` (R-GEN-28), so time; fix `{ timeMs: 60_000 }` via `limits`. CLI: at 500 hogs `spawnSync` gave ETIMEDOUT, SIGTERM, status null; timeout now 90 s. Codegen green 3 runs at 40 hogs; CLI green in 1 run at 500 hogs, the other 2 cut by the chat (shared Mac). Detail in the report.
**Prompt document name**: 2026-11-02 22:50

## 2026-11-02 — merge: codegen-tests-budget into alfonso-frontend-jjtl (P-2026-11-02-2330)
**Prompt**: `claude_2026-11-02_2330_prompt_merge_codegen-tests-budget.md`, a direct merge by `lane-run merge --direct`, no session: `codegen-tests-budget` at `e13326d89` into `alfonso-frontend-jjtl`, merge base `8a2490c20`, 3 commits on the branch side.
**Files touched**: merge `7536db524`: 6 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-02_2250_prompt_load_sensitive_tests.md`, `frontend/scripts/gates/__tests__/traceMonitor.test.ts`, `frontend/src/codegen/engine/__tests__/defaultText.test.ts`, `frontend/src/codegen/textual/__tests__/spec.ts`, `frontend/src/jjscript/executor/__tests__/unsetDefaultLiteral.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7536db524` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13060 tests in 496 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: tests only, no UI change: visual check not applicable; merge gates green (13060 tests, 0 failed, 9 red at import, build exit 0)
**Notes**: Lesson: a prompt that asks for load states a cap below load 20. P-2026-11-02-2250 gave none, its lane ran 500 hogs, load 600 for about 20 minutes on the shared Mac; gates of other lanes between 22:50 and 23:10 may be falsely red. Rollback tag `pre-codegen-tests-budget` on `52e49d05c` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-2330/result.json`.
**Prompt document name**: 2026-11-02 23:30

## 2026-11-02 — feat(jjtl): JjEL parses a forall collection the legacy parser cannot (P-2026-11-02-2345)
**Prompt**: `claude_2026-11-02_2345_prompt_jjtl_forall_collection_jjel.md`: with the source text, a forall collection such as `requesters.flatMap(... { hi: q, lo: r })` is parsed by JjEL up to `such`, `->` and the binding comma (R-FA-5), so it no longer fails with `Expected expression`; no test expectation changes.
**Files touched**: `9c0ac6c3d`: `frontend/src/jjtl/parser/parser.ts` (new `forAllCollection`), `frontend/src/jjtl/parser/__tests__/forall-multivar.test.ts` (+4), `frontend/src/jjtl/executor/__tests__/forall-multivar.test.ts` (+3), `frontend/src/jjtl/SPEC.md` (one line); this commit: this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. tsc exit 0; vitest src/jjtl src/jjel 998 passed, 7 files red at import (window is not defined, the known list); build exit 0; check:docs exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Legacy first, JjEL on fallback: the legacy result stays when it stops at a forall stop token, otherwise backtrack (errors truncated) to JjEL. Bench: JjEL always fails 2 AST assertions of parser forall-multivar and parity fixture tests#107; reverting the call site kills the 6 new tests. useJjtlParser already passes source. node_modules symlinked to ~/jjodel/frontend/node_modules (untracked, as every lane worktree).
**Prompt document name**: 2026-11-02 23:45

**Ticket** (P-2026-11-02-2345): under JjEL the collection of parity fixture `tests#107` evaluates differently at run time (`range() takes integers, got null`), so JjEL-always for forall collections is not run-time equivalent today. Still legacy-only with source: the messages of `alert`/`notify` and the statement-level `prompt`/`confirm`/`input` arguments (parser.ts alertStatement, notifyStatement, promptExpression, confirmExpression, inputExpression).

## 2026-11-03 — merge: jjtl-forall-collection-jjel into alfonso-frontend-jjtl (P-2026-11-02-2357)
**Prompt**: `claude_2026-11-02_2357_prompt_merge_jjtl-forall-collection-jjel.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-forall-collection-jjel` at `b4378e231` into `alfonso-frontend-jjtl`, merge base `54fbfa71e`, 4 commits on the branch side.
**Files touched**: merge `98d34c9c4`: 6 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-02_2345_prompt_jjtl_forall_collection_jjel.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/executor/__tests__/forall-multivar.test.ts`, `frontend/src/jjtl/parser/__tests__/forall-multivar.test.ts`, `frontend/src/jjtl/parser/parser.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `98d34c9c4` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13067 tests in 496 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: parser only, no UI change: visual check not applicable; merge gates green (13067 tests, 0 failed, 9 red at import)
**Notes**: Rollback tag `pre-jjtl-forall-collection-jjel` on `54fbfa71e` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-02-2357/result.json`.
**Prompt document name**: 2026-11-02 23:57

## 2026-11-03 — fix(jjscript): four JjScript console defects (P-2026-11-03-0000)
**Prompt**: `claude_2026-11-03_0000_prompt_jjscript_console_defects.md`, lane full, auto: four defects seen on 3001 in the JjScript console (`create package` crash on `cname`, `create class X in P` with no P reporting success, `eval` refusing lambdas and strings, a `let` value cut at a `forall`'s `in`). Two phases in one session, one commit per defect, order 2, 1, 3, 4.
**Files touched**: discovery `9ff3f733b` (`docs/discovery/discovery_2026-11-03_jjscript_console_defects.md`); defect 2 `2decd2160` and defect 1 `b9c45587a` (`frontend/src/jjscript/executor/commands/create.ts`); defect 3 `c3fcb4e0a` and defect 4 `217b931da` (`frontend/src/jjscript/parser/parser.ts`); tests in all four (`frontend/src/jjscript/executor/__tests__/consoleDefects.test.ts`, new), `frontend/src/jjscript/__tests__/parserTermination.test.ts` in `c3fcb4e0a`; this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `217b931da`: `npx tsc --noEmit` exit 0; `npx vitest run src/jjscript src/jjel` 1487+ tests green, 1 file red at import (`context-binding.test.ts`, the known `window is not defined`); `npm run build` exit 0; `npm run check:docs` run at the close.
**Out-of-scope changes**: no. Seven files across the lane (RC-11), all in the declared scope: `create.ts`, `parser.ts`, the two test files, the discovery report, this inbox, the prompt file.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Causes: `createPackage` omitted the `fatherType` that `Constructors.DPackage` reads; a named parent resolved nowhere fell through to `DClass.new` with no father; `eval` joined token values with spaces; `forall` lexes as COMMAND, unseen by the `let` value collector. `parserTermination.test.ts` pinned the dropped quotes of `eval "a end b"` and now expects them kept. `node_modules` via a temporary symlink, removed at the close (P14).
**Prompt document name**: 2026-11-03 00:00

## 2026-11-03 — ticket: Info.tsx creates a package without fatherType
**Ticket**: `frontend/src/components/editors/Info.tsx:384` calls `DPackage.new('NewPackage', '', '', parentId, true)` with no `fatherType`; `Constructors.DPackage` (`joiner/classes.ts:996-997`) reads `fatherType.cname` whenever there is a father, the crash fixed in JjScript `create package` by `b9c45587a`. Not reproduced in the UI.
**Priority**: medium
**Found in**: P-2026-11-03-0000
**Detail**: docs/discovery/discovery_2026-11-03_jjscript_console_defects.md

## 2026-11-03 — merge: jjscript-console-defects into alfonso-frontend-jjtl (P-2026-11-03-0020)
**Prompt**: `claude_2026-11-03_0020_prompt_merge_jjscript-console-defects.md`, a direct merge by `lane-run merge --direct`, no session: `jjscript-console-defects` at `fe85c80cb` into `alfonso-frontend-jjtl`, merge base `34b82af49`, 7 commits on the branch side.
**Files touched**: merge `5b186217f`: 7 files from the branch side (`docs/discovery/discovery_2026-11-03_jjscript_console_defects.md`, `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-03_0000_prompt_jjscript_console_defects.md`, `frontend/src/jjscript/__tests__/parserTermination.test.ts`, `frontend/src/jjscript/executor/__tests__/consoleDefects.test.ts`, `frontend/src/jjscript/executor/commands/create.ts`, `frontend/src/jjscript/parser/parser.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `5b186217f` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13145 tests in 498 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: on 3001 in a throwaway project, JjScript console: create package P1, create class Foo in P1 (appears in classes), create class X in Missing refused, eval with a lambda and with a string, let with an unparenthesized forall a, b reading x.size = 4: all as expected. Merge gates green (13145 tests, 0 failed, 9 red at import)
**Notes**: Rollback tag `pre-jjscript-console-defects` on `e1b35c188` (RC-31). Union: `docs/log-inbox/maintenance.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-0020/result.json`.
**Prompt document name**: 2026-11-03 00:20

## 2026-11-03 — fix(jjscript): forall summary counts leaf commands; Info.tsx package fatherType (P-2026-11-03-1015)
**Prompt**: `claude_2026-11-03_1015_prompt_forall_summary_and_info_package.md`, lane fast, unattended: (1) a multi-variable `forall` summary counted outer iterations (`2/2` for one rename): count the leaf commands; (2) `Info.tsx` called `DPackage.new` without the father's type, the defect `b9c45587a` fixed in `create.ts`. One commit per fix.
**Files touched**: fix 1 `9373d1fa7`: `frontend/src/jjscript/executor/commands/forall.ts`, `frontend/src/jjscript/executor/__tests__/forallMultivar.test.ts`; fix 2 `72d1b3cf2`: `frontend/src/components/editors/Info.tsx`; this commit: this entry. Status of the prompt file not flipped: the `status-flip` skill is user-invocable only.
**Outcome**: ✅ completed
**Corregge**: 2026-11-02 13:32
**Causa**: (a)
**Regressions**: no. Gates on `72d1b3cf2`: `npx tsc --noEmit` exit 0; `npx vitest run src/jjscript` 949 tests green, 1 file red at import (`context-binding.test.ts`, `window is not defined`); `npm run build` exit 0; `npm run check:docs` run at the close.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Fix 1: a body result that is a forall summary adds its leaf counts; any other result is one leaf, so one-variable messages are unchanged. `data.total/successCount/errorCount` are now leaf counts; `data.results` stays one entry per outer iteration, read only by `forallById.test.ts:179`. Mutation bench (aggregation removed) kills 4 tests. Fix 2: father is always the metamodel, so `DModel`; no node-importable home for a test, checked by reading `classes.ts:577-591,996-997` and typecheck.
**Prompt document name**: 2026-11-03 10:15

## 2026-11-03 — merge: jjscript-forall-summary into alfonso-frontend-jjtl (P-2026-11-03-1041)
**Prompt**: `claude_2026-11-03_1041_prompt_merge_jjscript-forall-summary.md`, a direct merge by `lane-run merge --direct`, no session: `jjscript-forall-summary` at `7fd560341` into `alfonso-frontend-jjtl`, merge base `6b4f96183`, 6 commits on the branch side.
**Files touched**: merge `16c38c9e0`: 5 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-03_1015_prompt_forall_summary_and_info_package.md`, `frontend/src/components/editors/Info.tsx`, `frontend/src/jjscript/executor/__tests__/forallMultivar.test.ts`, `frontend/src/jjscript/executor/commands/forall.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `16c38c9e0` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13234 tests in 502 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: forall summary and Info.tsx: covered by unit tests and by the merge gates (13234 tests, 0 failed, 9 red at import); not repeated in the app
**Notes**: Rollback tag `pre-jjscript-forall-summary` on `fa9e886cb` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1041/result.json`.
**Prompt document name**: 2026-11-03 10:41

## 2026-11-03 — discovery: JjTL forall collection under JjEL only, stopped before Phase 2 (P-2026-11-03-1016)
**Prompt**: `claude_2026-11-03_1016_prompt_jjtl_collection_jjel_only.md`: find out why JjEL-always for a forall collection breaks AST assertions and parity fixture `tests#107`; make JjEL the only parser only if the cause is a small local fix that changes no run-time result.
**Files touched**: `1300be2cc` (`docs/discovery/discovery_2026-11-03_jjtl_collection_jjel_only.md`); this commit: this entry and the Status line of the 1016 prompt.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no. No code changed; tsc exit 0; vitest src/jjtl src/jjel 1048 passed, 7 files red at import (the known list); build exit 0; check:docs exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Phase 1 only. The two paths agree on the AST and on `range(null)`. The executor differs: a legacy builtin `FunctionCall` throws (executor.ts:2859-2863, outside the try), so the mapping fails, while a JjelExpression warns and yields null (2881-2886). Probe P2, with that path aligned: parity 145/145, and only 3 AST-shape assertions red. Each fix changes `tests#107`, which is a stop. Causa (c): the 2345 ticket put the cause in parsing. Detail in the report.
**Prompt document name**: 2026-11-03 10:16

## 2026-11-03 — merge: jjtl-collection-jjel-only into alfonso-frontend-jjtl (P-2026-11-03-1053)
**Prompt**: direct merge of the discovery of P-2026-11-03-1016, docs only, closed by hand by the chat because the worker ended blocked.
**Files touched**: merge `d8773e4cd`, docs only.
**Outcome**: ⚠️ partial: merged, one gate red in the worker
**Corregge**: —
**Causa**: —
**Regressions**: no: the merge changes no code. vitest 13234 tests, 1 failed: `scripts/hooks/__tests__/laneBoard.test.ts:665`, `expected null to be +0`, a spawned process with a null status. The file alone at load 3: 95 passed, 0 failed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: not applicable, docs only.
**Notes**: Ticket: the load-sensitive tests of P-2026-11-02-2250 are not the whole class: this one has the same shape as `traceMonitor`, unmeasured here. Open question from 1016: a failing builtin in JjTL, error or warning with null; waits for Alfonso.
**Prompt document name**: 2026-11-03 10:53

## 2026-11-03 — fix(jjtl): a failing builtin is an error on both paths; JjEL alone parses a forall collection (P-2026-11-03-1135)
**Prompt**: `claude_2026-11-03_1135_prompt_jjtl_builtin_error_jjel_collection.md`: apply R-FA-11 (a builtin that fails inside a JjTL expression stops the mapping with an error on every path) and drop the legacy-first fallback of P-2026-11-02-2345 for a forall collection when the source text is present.
**Files touched**: `9afbe4376`: `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/parser.ts`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/parser/__tests__/forall-multivar.test.ts`, `frontend/src/jjtl/executor/__tests__/builtin-error.test.ts` (new); this commit: this entry and the Status line of the 1135 prompt.
**Outcome**: ✅ completed
**Corregge**: 2026-11-03 10:16 (the stopped Phase 2 of P-2026-11-03-1016)
**Causa**: (f)
**Regressions**: no. tsc exit 0; vitest src/jjtl src/jjel 1055 passed, 0 failed, 7 files red at import (the known list); build exit 0; parity 145/145, `tests#107` an error on both paths.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Builtins registered on the run context are wrapped (JjtlEvaluationContext) to throw JjtlBuiltinError; evaluateExpression names the outermost expression and rethrows on both paths. Unchanged: `Function 'f' is not defined`, failing methods. Measured: in a `where` guard the run stops (`Execution failed`). Legacy locates a binary expression at its operator, so the column differs by path there. Mutation bench: parser revert killed by the new multivar test.
**Prompt document name**: 2026-11-03 11:35

## 2026-11-03 — merge: jjtl-collection-jjel-only into alfonso-frontend-jjtl (P-2026-11-03-1148)
**Prompt**: `claude_2026-11-03_1148_prompt_merge_jjtl-collection-jjel-only.md`, a direct merge by `lane-run merge --direct`, no session: `jjtl-collection-jjel-only` at `03967006a` into `alfonso-frontend-jjtl`, merge base `9e72593b7`, 3 commits on the branch side.
**Files touched**: merge `e226a7625`: 7 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-03_1135_prompt_jjtl_builtin_error_jjel_collection.md`, `frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/executor/__tests__/builtin-error.test.ts`, `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/__tests__/forall-multivar.test.ts`, `frontend/src/jjtl/parser/parser.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `e226a7625` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 13241 tests in 503 files, 9 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: JjTL parser and executor, no UI change: not run in the app; merge gates green (13241 tests, 0 failed, 9 red at import)
**Notes**: Rollback tag `pre-jjtl-collection-jjel-only-P-2026-11-03-1148` on `9e72593b7` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-03-1148/result.json`.
**Prompt document name**: 2026-11-03 11:48

## 2026-11-04 — merge: origin/staging b619c8300 into staging-realign (P-2026-11-04-1640)
**Prompt**: `claude_2026-11-04_1640_prompt_staging_realign.md`: merge staging `b619c8300` into `staging-realign` with one `--no-ff` merge, resolve the four measured conflicts, carry `8d5b5a1fe` into `services/ai`, look for silent breakages and the Worker's callers. No push, no trunk merge.
**Files touched**: merge `f59fc2371` (81 staging commits); by hand: `docs/decisions.md`, `docs/harness/fronts.json`, `frontend/src/services/ai/AnthropicCompatibleProvider.ts`, `frontend/src/services/ai/OpenAICompatibleProvider.ts`, `frontend/src/services/ai/__tests__/requestShaping.test.ts`; deleted `AIProviderService.ts` and its test. Docs: `docs/discovery/discovery_2026-11-04_staging_realign.md`, this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — typecheck 0, build 0, check:docs 5/5, check:agents PASS; vitest before the commit, same tree: 13978 passed, 32 red all `bashGuard` from `MERGE_HEAD`, 160/160 after it. The full re-run after the commit was killed twice at 600 s, load 228.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (no sync or D-L file touched by hand)
**Smoke visivo**: non applicabile (no UI change by hand; build only)
**Notes**: No R- id collision (only R-GEN-18 differs, trunk-only edit). Bench: staging's send() fails 4 of the 5 ported tests. No runtime caller of jjodel-ai-proxy left. npm ci (lockfile differs), no symlink. Detail in the report.
**Prompt document name**: 2026-11-04 16:40

## 2026-11-11 — discovery: IR coverage of the view properties panel (P-2026-11-11-1925)
**Prompt**: `claude_2026-11-11_1925_prompt_ir_view_panel_coverage.md`, full lane, discovery only with hard stop, read-only on code: for every IR field a view can carry (vertex, graphVertex, edge, row), does the view properties panel read and write it, or only the Source tab; inventory, drift, orphans, totals, Phase 2 slices, questions
**Files touched**: `419b31657`: `docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md` (new); this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_1925_prompt_ir_view_panel_coverage.md` (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (docs only, no code touched)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: 157 rows: 82 covered, 38 partial, 21 missing, 15 out of scope by decision, 1 in progress (gV frame, P-2026-11-11-1110). Ran over three sessions (two context-ceiling continuations). A zsh sweep with an unquoted multi-file variable failed silently in continuation 1 and was rerun with an array. v1.2 incorporates v1.1 by reference; the v1.1 base drift is in report §3. Ten questions in the report.
**Prompt document name**: 2026-11-11 19:25

**Ticket** (data loss, read at `bb7821a10`): `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx:64` rebuilds a literal segment as `{ kind: 'literal', text }` and drops a persisted `literal.style` on any edit of the text; the gV cornerRadius control overwrites a persisted Conditional on first edit (`GraphVertexAuthoringPanel.tsx:325-333`, `shapeRegistry.ts:467-468`). Slice S0 of the report.

## 2026-11-11 — fix: IR view panel S0, literal style and gV corner radius data loss (P-2026-11-11-2025)
**Prompt**: `claude_2026-11-11_2025_prompt_ir_panel_s0_data_loss.md`, fast lane, slice S0 of the IR view panel coverage audit (R-IPC-7): the literal segment text edit drops a persisted `style`; the graphVertex corner radius stepper reads a persisted Conditional as default and overwrites it
**Files touched**: `999ea5d5a`: `authoring/FieldSegmentEditor.tsx`, `authoring/GraphVertexAuthoringPanel.tsx`, `authoring/__tests__/fieldSegmentEditor.test.ts`, `authoring/__tests__/graphVertexCornerRadius.test.ts` (new); this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2025_prompt_ir_panel_s0_data_loss.md` (Status)
**Outcome**: ✅ completed
**Corregge**: 2026-10-10 11:56
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Literal: `applyLiteralText` spreads the segment; forKind left as is (a kind switch resets by design). gV: the vertex panel's ConditionalEditor mount with rulesTable, writers unchanged, graphVertexAuthoring.ts untouched. Negative control: Input wiring test fails on the old line (1 failed, 14 passed). Node bench has no DOM: mount tests are SSR with spies on view.ir and the writers. Corregge: gV S4 (stepper); the literal loss dates from C2, P-2026-09-30-0150. No gV smoke scene.
**Prompt document name**: 2026-11-11 20:25

## 2026-11-11 — merge: ir-panel-s0 into alfonso-frontend-jjtl (P-2026-11-11-2028)
**Prompt**: `claude_2026-11-11_2028_prompt_merge_ir-panel-s0.md`, a direct merge by `lane-run merge --direct`, no session: `ir-panel-s0` at `8de50544e` into `alfonso-frontend-jjtl`, merge base `6c77a7bce`, 3 commits on the branch side.
**Files touched**: merge `919c9e2e0`: 6 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2025_prompt_ir_panel_s0_data_loss.md`, `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/GraphVertexAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/fieldSegmentEditor.test.ts`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/graphVertexCornerRadius.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `919c9e2e0` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16089 tests in 611 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Gates green on the merge tip. Chat visual check not run: no graphVertex scene in the smoke harness and 3001 down; the change is covered by tests (literal style kept, conditional corner radius not overwritten, negative control fails on the old line). Alfonso visual GO owed on localhost:3000: graphVertex Appearance tab, conditional radius shows chip in Basic and rules in Advanced.
**Notes**: Rollback tag `pre-ir-panel-s0` on `191a97892` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-11-2028/result.json`.
**Prompt document name**: 2026-11-11 20:28

## 2026-11-11 — feat: IR view panel S1a, vertex visible, entry, bar thickness, exclude, literal style (P-2026-11-11-2035)
**Prompt**: `claude_2026-11-11_2035_prompt_ir_panel_s1a.md`, fast lane, slice S1 of the IR view panel coverage audit (R-IPC-11): controls for audit rows V-12 vertex `visible`, V-21 `shape.entry`, V-22 `shape.barThickness`, V-48 compartment `source.exclude` (and `withCompartmentSource` keeping it), V-53 literal segment `style`; UI only
**Files touched**: `043b9cc02`: `authoring/VertexAuthoringPanel.tsx`, `authoring/FieldCompartmentListEditor.tsx`, `authoring/FieldSegmentEditor.tsx`, `authoring/__tests__/irPanelS1a.test.ts` (new), `authoring/__tests__/panelSections.test.ts` (vertex snapshot gains Visibility); this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2035_prompt_ir_panel_s1a.md` (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (seven files across two commits, all in the declared scope)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Gates: typecheck 0, build, authoring 384/384, unit 16105 passed, 3 known import failures, 2 timing budgets red under load and green alone (126/126). Negative control: entry reset writing `undefined` fails 2 of 21. Bar thickness shows on a bar, a Conditional form, or a set value. Literal TextStyleField without features (no optional prop added to FieldSegmentEditorProps). No smoke scene for the vertex panel.
**Prompt document name**: 2026-11-11 20:35

## 2026-11-11 — merge: ir-panel-s1a into alfonso-frontend-jjtl (P-2026-11-11-2054)
**Prompt**: `claude_2026-11-11_2054_prompt_merge_ir-panel-s1a.md`, a direct merge by `lane-run merge --direct`, no session: `ir-panel-s1a` at `3c406f850` into `alfonso-frontend-jjtl`, merge base `dc2126f5d`, 3 commits on the branch side.
**Files touched**: merge `6ab5d35bb`: 7 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2035_prompt_ir_panel_s1a.md`, `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/FieldSegmentEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/irPanelS1a.test.ts`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/panelSections.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6ab5d35bb` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16110 tests in 612 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Gates green on the merge tip. No smoke scene for the vertex panel; covered by irPanelS1a tests with negative control. Alfonso visual GO owed on localhost:3000: vertex view Structure/Appearance, rows visible, entry, bar thickness, compartment exclude, literal segment style.
**Notes**: Rollback tag `pre-ir-panel-s1a` on `dc2126f5d` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-11-2054/result.json`.
**Prompt document name**: 2026-11-11 20:54

## 2026-11-11 — feat: IR view panel S1b, edge curve, label template, label style (P-2026-11-11-2036)
**Prompt**: `claude_2026-11-11_2036_prompt_ir_panel_s1b.md`, fast lane, slice S1 of the IR view panel coverage audit (R-IPC-11): controls in the edge panel for `edge.curve` (E-19, R-VP-22), `edge.labels.template` (E-22) and `edge.labels.style` (E-23, R-VP-20); UI only
**Files touched**: `5d9cc9ea6`: `authoring/EdgeAuthoringPanel.tsx`, `authoring/__tests__/edgeCurveLabelControls.test.ts` (new); this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2036_prompt_ir_panel_s1b.md` (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Curve: Select from VALID_CURVE_VALUES, empty option drops the key. Template: ListEditor + TextSourceEditor; last segment removed drops the key (validator refuses empty). Style: TextStyleField. Both via setLabelsKey (spread, labels dropped when empty). Tests SSR, writes seen through a withMetaclassPins spy; negative control (labels rebuilt from {}) fails 7/15. Full suite: tolerant.test.ts timing guard 1295>1000 ms under load, green alone (64/64). No IR edge scene in the smoke harness.
**Prompt document name**: 2026-11-11 20:36

## 2026-11-11 — merge: ir-panel-s1b into alfonso-frontend-jjtl (P-2026-11-11-2101)
**Prompt**: `claude_2026-11-11_2101_prompt_merge_ir-panel-s1b.md`, a direct merge by `lane-run merge --direct`, no session: `ir-panel-s1b` at `18397b4d0` into `alfonso-frontend-jjtl`, merge base `dc2126f5d`, 3 commits on the branch side.
**Files touched**: merge `f33239a6d`: 4 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2036_prompt_ir_panel_s1b.md`, `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeCurveLabelControls.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f33239a6d` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16125 tests in 613 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Gates green on the merge tip. No IR edge view scene in the smoke harness; covered by edgeCurveLabelControls tests with negative control. Alfonso visual GO owed on localhost:3000: edge view, curve control, label template list, label style.
**Notes**: Rollback tag `pre-ir-panel-s1b` on `c50d9e689` (RC-31). Union: `docs/log-inbox/maintenance.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-11-2101/result.json`.
**Prompt document name**: 2026-11-11 21:01

## 2026-11-11 — feat: IR view panel S1c, letter spacing and case in TextStyleEditor (P-2026-11-11-2037)
**Prompt**: `claude_2026-11-11_2037_prompt_ir_panel_s1c.md`, fast lane, slice S1 row X3 of the IR view panel coverage audit (R-IPC-11): `TextStyle.letterSpacing` and `TextStyle.textTransform` had no control in `TextStyleEditor`
**Files touched**: `f4c06dcc2`: `authoring/TextStyleEditor.tsx`, `authoring/__tests__/textStyleScalarAxes.test.ts` (new); this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2037_prompt_ir_panel_s1c.md` (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Rows Spacing (em, step 0.01) and Case (Default/Uppercase/Lowercase/None) after Color, same row classes, no ƒx: both keys are plain scalars in irTypes. Writes through setAxis. TextStyleField untouched (holds no axis list). Tests call the hook-free editor and fire the row onChange. Negative control: Case onChange rebuilding the style, 3 failed / 10 passed. Gates: typecheck 0, authoring 376/376, unit 16099 passed + 3 known import failures, build. No smoke scene with a TextStyle popover.
**Prompt document name**: 2026-11-11 20:37

## 2026-11-11 — merge: ir-panel-s1c into alfonso-frontend-jjtl (P-2026-11-11-2109)
**Prompt**: `claude_2026-11-11_2109_prompt_merge_ir-panel-s1c.md`, a direct merge by `lane-run merge --direct`, no session: `ir-panel-s1c` at `2516db6ac` into `alfonso-frontend-jjtl`, merge base `dc2126f5d`, 3 commits on the branch side.
**Files touched**: merge `d520c2923`: 4 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2037_prompt_ir_panel_s1c.md`, `frontend/src/components/editor-v2/viewpoint/authoring/TextStyleEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/textStyleScalarAxes.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d520c2923` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16138 tests in 614 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Gates green on the merge tip. No smoke scene opens a TextStyle popover; covered by textStyleScalarAxes tests. Alfonso visual GO owed on localhost:3000: TextStyle popover, letter spacing and case rows.
**Notes**: Rollback tag `pre-ir-panel-s1c` on `33c98dcc4` (RC-31). Union: `docs/log-inbox/maintenance.md`. Worker and gates: `~/.jjodel-lanes/P-2026-11-11-2109/result.json`.
**Prompt document name**: 2026-11-11 21:09

## 2026-11-11 — feat: IR view panel S2, rules table on the remaining Conditional controls (P-2026-11-11-2120)
**Prompt**: `claude_2026-11-11_2120_prompt_ir_panel_s2.md`, fast lane, slice S2 of the IR view panel coverage audit (R-IPC-11): pass `rulesTable` on every Conditional control that showed a saved `rules` value as the read-only chip (V-28/G-30, V-32, V-34, V-56, X3, G-12, E-13..17, R-10), and offer row `visible` from absent; UI only
**Files touched**: `941649249`: `authoring/LabelEntryEditor.tsx`, `authoring/BadgeListEditor.tsx`, `authoring/FieldCompartmentListEditor.tsx`, `authoring/TextStyleEditor.tsx`, `authoring/GraphVertexAuthoringPanel.tsx`, `authoring/EdgeAuthoringPanel.tsx`, `authoring/RowAuthoringPanel.tsx`, `authoring/__tests__/irPanelS2.test.ts` (new); this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2120_prompt_ir_panel_s2.md` (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (ten files across two commits, above five, all in the declared scope: the eight code files listed by the prompt, the inbox and the prompt Status)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: All 16 mounts covered, none left (step 2). Child editors pass only valueNoun: subjectName is optional, falls back to 'instance', no interface change. Row visible: always shown, withRowVisible (undefined drops the key), Reset when set. Negative control: rulesTable dropped from badge icon, 1 failed / 23 passed. Gates: typecheck 0, authoring 436/436, unit 16159 passed + 3 known import failures, build. No smoke scene. Vertex V-12 visible (S1a) also lacks rulesTable: out of scope.
**Prompt document name**: 2026-11-11 21:20

## 2026-11-11 — merge: ir-panel-s2 into alfonso-frontend-jjtl (P-2026-11-11-2128)
**Prompt**: `claude_2026-11-11_2128_prompt_merge_ir-panel-s2.md`, a direct merge by `lane-run merge --direct`, no session: `ir-panel-s2` at `8c1b5bb48` into `alfonso-frontend-jjtl`, merge base `c5a07acc9`, 3 commits on the branch side.
**Files touched**: merge `7c51baec4`: 10 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2120_prompt_ir_panel_s2.md`, `frontend/src/components/editor-v2/viewpoint/authoring/BadgeListEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/FieldCompartmentListEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/GraphVertexAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/LabelEntryEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx`, and 2 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7c51baec4` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16162 tests in 615 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Gates green on the merge tip. No smoke scenes for these editors; covered by irPanelS2 tests with negative control. Alfonso visual GO owed on localhost:3000: rules table in Advanced on label, badge and compartment visible, badge icon, TextStyle axes, graphVertex visible, edge line and ends; row visible can be added when absent.
**Notes**: Rollback tag `pre-ir-panel-s2` on `c5a07acc9` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-11-2128/result.json`.
**Prompt document name**: 2026-11-11 21:28

## 2026-11-11 — feat: IR view panel S3, edge label, placement, waypoints, caption (P-2026-11-11-2140)
**Prompt**: `claude_2026-11-11_2140_prompt_ir_panel_s3.md`, fast lane, slice S3 of the IR view panel coverage audit (R-IPC-11): edge view `label` (E-10), `edge.labels.placement` (E-21), `edge.persistWaypoints` (E-26), expression-source `caption` in TextSourceEditor, and three `irValidate` checks (placement, persistWaypoints, caption)
**Files touched**: `16639fa43`: `ir/irValidate.ts`, `ir/__tests__/irS3Keys.test.ts` (new), `authoring/EdgeAuthoringPanel.tsx`, `authoring/TextSourceEditor.tsx`, `authoring/__tests__/irPanelS3.test.ts` (new), `authoring/__tests__/panelSections.test.ts`; this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2140_prompt_ir_panel_s3.md` (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (eight files across two commits, above five, all in the declared scope: the three code files, tests in `authoring/__tests__` and beside the irValidate tests, the inbox and the prompt Status; `panelSections.test.ts` edge snapshot gains the new General section)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Step 1: validateIR is authoring-only (panels, creation seed); the render never calls it, so sibling severity (ok: false) takes no saved view off the canvas. View label drops the key when emptied (vertex keeps ''). Placement menu: above, below; Auto is the empty option. Negative control: persistWaypoints reset writing undefined, 1 failed / 20 passed. Gates: typecheck 0, unit 16191 passed + 3 known import failures, build. No smoke scene with an IR edge view.
**Prompt document name**: 2026-11-11 21:40

## 2026-11-11 — merge: ir-panel-s3 into alfonso-frontend-jjtl (P-2026-11-11-2148)
**Prompt**: `claude_2026-11-11_2148_prompt_merge_ir-panel-s3.md`, a direct merge by `lane-run merge --direct`, no session: `ir-panel-s3` at `e21bb3d52` into `alfonso-frontend-jjtl`, merge base `99f62d9c8`, 3 commits on the branch side.
**Files touched**: merge `7397be79f`: 8 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2140_prompt_ir_panel_s3.md`, `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/TextSourceEditor.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/irPanelS3.test.ts`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/panelSections.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irS3Keys.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `7397be79f` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16194 tests in 617 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Gates green on the merge tip. No IR edge view scene in the smoke harness; covered by irPanelS3 and irS3Keys tests with negative control. validateIR runs only at authoring, so the new checks cannot take a saved view off the canvas. Alfonso visual GO owed on localhost:3000: edge view General section label, label placement select, Save the layout toggle, caption field on an expression text source.
**Notes**: Rollback tag `pre-ir-panel-s3` on `99f62d9c8` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-11-2148/result.json`.
**Prompt document name**: 2026-11-11 21:48

## 2026-11-11 — feat: IR view panel S4a, graphVertex shape keys, badges, compartments (P-2026-11-11-2315)
**Prompt**: `claude_2026-11-11_2315_prompt_ir_panel_s4a.md`, fast lane, slice S4 of the IR view panel coverage audit (R-IPC-11): graphVertex parity for `shape.padding`, `marker`, `entry`, `barThickness`, `text`, `badges` and `fieldCompartments` (G-19..G-24, G-33), UI only
**Files touched**: `719be490a`: `authoring/GraphVertexAuthoringPanel.tsx`, `authoring/__tests__/irPanelS4a.test.ts` (new), `authoring/__tests__/panelSections.test.ts`; this commit: `docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2315_prompt_ir_panel_s4a.md` (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Mounts mirror the vertex panel's (Padding Advanced only, compartments behind structureCapabilities). Resets drop the key by rest/spread, also the last badge or compartment removed (the vertex panel keeps [] and writes key: undefined there; not touched). graphVertexAuthoring.ts untouched. Negative control: reset writing key: undefined, 7 failed / 6 passed. Gates: typecheck 0, authoring 475/475, unit 16209 + 3 known import failures, build 0. No graphVertex smoke scene.
**Prompt document name**: 2026-11-11 23:15

## 2026-11-11 — merge: ir-panel-s4a into alfonso-frontend-jjtl (P-2026-11-11-2321)
**Prompt**: `claude_2026-11-11_2321_prompt_merge_ir-panel-s4a.md`, a direct merge by `lane-run merge --direct`, no session: `ir-panel-s4a` at `a0567c6fc` into `alfonso-frontend-jjtl`, merge base `2d05fdcee`, 3 commits on the branch side.
**Files touched**: merge `52a92fca1`: 5 files from the branch side (`docs/log-inbox/maintenance.md`, `docs/prompts/claude_2026-11-11_2315_prompt_ir_panel_s4a.md`, `frontend/src/components/editor-v2/viewpoint/authoring/GraphVertexAuthoringPanel.tsx`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/irPanelS4a.test.ts`, `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/panelSections.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `52a92fca1` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16212 tests in 618 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Gates green on the merge tip. No graphVertex panel scene in the smoke harness; covered by irPanelS4a tests with negative control. Alfonso visual GO owed on localhost:3000: graphVertex Appearance padding, marker with rules table, entry, bar thickness, text style, badges, field compartments.
**Notes**: Rollback tag `pre-ir-panel-s4a` on `2d05fdcee` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-11-2321/result.json`.
**Prompt document name**: 2026-11-11 23:21
