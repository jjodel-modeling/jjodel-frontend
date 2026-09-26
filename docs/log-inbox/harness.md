# log-inbox — lane «harness»

Entries written by the harness lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-25 — chore(dev): let the Vite dependency scan parse decorators (P-2026-09-25-1820)
**Prompt**: `claude_2026-09-25_1820_prompt_vite_dep_scan.md`, fast lane, single phase on `vite-dep-scan` in `~/jjodel-vite`, one hard stop (Alfonso's check on 3005). The ticket of P-2026-09-25-1500: on a cold start the dependency scan fails on `MTM.tsx:27` importing `Nearley`, nothing is pre-bundled and the first page load reloads once.
**Files touched**: report `59701d5f0`: `docs/discovery/discovery_2026-09-25_vite_dep_scan.md` (new). Code `8a4335402`: `frontend/vite.config.ts` (`optimizeDeps.esbuildOptions.tsconfigRaw`; `optimizeDeps.include` + `util` and three nodePolyfills shims). Docs, this commit: this entry, two tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-25 15:00 (ticket: the Vite dependency scan fails on every cold start)
**Causa**: (g)
**Regressions**: no. Cold start before: scan error, 58 deps found at runtime, `reloading`, 3 navigations; after: no scan error, 64 pre-bundled at startup, 0 discovered, no reload, one document load; warm restart: no rescan, `_metadata.json` byte-identical. Gates on `8a4335402`: typecheck 14, the §17 set; build exit 0, `dist/` md5-identical to a HEAD-config build (3494 files); vitest 4629 passed, 0 failed, the same 9 red at import; `check:docs` 4/4.
**Out-of-scope changes**: no — one config file as declared; the `include` ids go beyond the prompt's candidates but stay in it, accepted at the hard stop. Report and config in two commits instead of one, per P13, accepted.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso on 3005, private window: a healthy project opens, one page load, no automatic reload, app as on 3001)
**Notes**: Cause: an esbuild 0.27.7 bug, not missing decorators: legacy decorators + `@dec export class X` naming `X` + a direct eval emit `export { _X }` with no alias. `U.tsx` has the same broken export, but only in the scan, which no longer uses legacy decorators, so this fix covers it: no ticket. Temporary symlink `frontend/node_modules` created and removed. Detail: the report, §2-§4.
**Prompt document name**: 2026-09-25 18:20

## 2026-09-25 — ticket: re-check the Vite scan override at the next esbuild upgrade
**Ticket**: `frontend/vite.config.ts` turns `experimentalDecorators` off for the dependency scan (`optimizeDeps.esbuildOptions.tsconfigRaw`) to dodge an esbuild 0.27.7 bug. At the next esbuild upgrade, run the three-ingredient minimal repro (legacy decorators; `@dec export class A { static f(s){ eval(s); return A; } }`; transform emits `export { _A }` instead of `export { A }`) and drop the override if it now emits `export { A }`.
**Priority**: low
**Found in**: P-2026-09-25-1820
**Detail**: docs/discovery/discovery_2026-09-25_vite_dep_scan.md (§2.2)

## 2026-09-25 — ticket: narrow optimizeDeps.entries to index.html and clean up public/
**Ticket**: The Vite dependency scan uses the default entries glob and reads `test.html`, `public/index.html` and 17 ace demo pages under `public/webjars/ace/1.3.3/`. Narrow `optimizeDeps.entries` to `index.html`, together with a cleanup of those 17 ace demo pages from `public/`.
**Priority**: low
**Found in**: P-2026-09-25-1820
**Detail**: docs/discovery/discovery_2026-09-25_vite_dep_scan.md (§1, §6)

## 2026-09-26 — chore(dev): allow the shared node_modules in the Vite serving list (P-2026-09-26-1335)
**Prompt**: `claude_2026-09-26_1335_prompt_bootstrap_icons_font.md`, fast lane, single phase on `icons-font` in `~/jjodel-icons`, one hard stop (Alfonso's check on 3005). On every worktree dev server the Bootstrap Icons font returned 403 and the icons rendered as empty squares: the P14 `node_modules` symlink makes Vite serve the font from its real path under `~/jjodel`, outside the default `server.fs.allow`.
**Files touched**: report `ad64eaa34`: `docs/discovery/discovery_2026-09-26_bootstrap_icons_font_403.md` (new). Code `b1ba29157`: `frontend/vite.config.ts` (`server.fs.allow` = `searchForWorkspaceRoot(__dirname)` + the real `node_modules`, guarded `realpathSync`). Docs, this commit: this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: 2026-09-26 11:00 (observation of chat C-2026-09-26-1100: Bootstrap icons as empty squares on 3001, font 403 there, 200 on 3000)
**Causa**: (g)
**Regressions**: no. On 3005 the font went from 403 to 200 `font/woff2`; the controls `/@fs/.../jjodel/frontend/package.json` and `/@fs/etc/hosts` stayed 403. Gates on `b1ba29157`: typecheck 14, the §17 set; typecheck:scripts exit 0; build exit 0, same 51 warning lines, `dist/` md5-identical to a HEAD-config build (3494 files); vitest 4818 passed, 0 failed, the same 9 red at import; `check:docs` 4/4.
**Out-of-scope changes**: no — one config file as declared. Report and config in two commits instead of one, per P13.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso on 3005, private window, 2026-09-26: the Bootstrap icons render)
**Notes**: Mechanism: Vite realpaths resolved modules but not the allow entries; the CSS passes via safeModulePaths, its url() font does not. ~/jjodel unaffected: its real node_modules is inside its root. Code commit first made as 5a890a0df and amended at the ACK to add the name check to its body; tree identical. Vitest 4818 measured on 9290c17be. Temporary symlink frontend/node_modules created and removed. Detail: the report, §2-§4.
**Prompt document name**: 2026-09-26 13:35
**Ticket** (priority low, not a slot). `frontend/vite.config.ts` is type-checked by no gate (`tsconfig.json` includes `src` only). A manual `tsc` on it reports one TS2769, `css.preprocessorOptions.scss` (`api`, `includePaths`) not assignable to `SassPreprocessorOptions`, identical on the HEAD config and after this fix (report §4).

## 2026-09-26 — feat(harness): P16 orchestrated lanes and the lane-run launcher (P-2026-09-26-1640)
**Prompt**: `claude_2026-09-26_1640_prompt_harness_orchestrated_lanes.md`, full lane (more than 3 files), two phases on the trunk in `~/jjodel-release`. RC-20..24 turned into normative text (P16; P8 and P13 amended; HARNESS-DOCS §4.1 and §7) and into `frontend/scripts/lane-run.mjs`, the chat's launcher (start, resume, status).
**Files touched**: report `9878f7cc6`: `docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md` (new). Docs `f6ad47d46`: `docs/PROTOCOL.md` (1.6), `docs/HARNESS-DOCS.md` (1.5). Code `e00392612`: `frontend/scripts/lane-run.mjs` (new), `frontend/scripts/hooks/__tests__/laneRun.test.ts` (new, 17 cases). Docs, this commit: this entry, two tickets, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Hook tests 220 passed, 0 failed (baseline 203); `check:docs` 4/4 with 5 warnings, as the baseline; `check:scripts` PASS on 27 files (baseline 25); the `status-flip` and `discovery-report` extractions byte-identical to HEAD's; Check A untouched. Mutation bench on `lane-run.mjs`: 24 of 25 at round 1 (M12, weak fixture), 25 of 25 at round 2; the table is in the body of `e00392612`.
**Out-of-scope changes**: no. Six files, all in DOVE, listed at the GO (RC-11). The entry goes to this inbox, not to `docs/claude-code-log.md` as the prompt wrote: ratified answer 1 (the active log sits at 40 entries).
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Precondition: HEAD was 80a9eb9fd, not the prompt commit d0f040002 (two svg-only commits after it); the merge P-2026-09-26-1615 then ran with commits paused, and Phase 1 started on df9d7a5e0 at Alfonso's word. Eleven Phase 1 answers ratified as recommended (RC-21, report §12), a twelfth on the M12 survivor. Commit type feat(harness) chosen: the prompt named none. The BPMN figure labels two Status flips; P13 and §7 keep the one of RC-17.
**Prompt document name**: 2026-09-26 16:40

## 2026-09-26 — ticket: merge P-2026-09-25-1022 before the first orchestrated launch
**Ticket**: BLOCKING for the first orchestrated launch: no `claude -p` session in bypassPermissions runs on a branch that does not carry the push deny. `harness-bypass` (`cd5eb9eb5`, closure `f3a014e4d`) holds the push deny under bypass in `bash-guard.mjs` and the `claude-opus-5-5` pin (RC-16, RC-19). Neither `alfonso-frontend-jjtl` nor `simulation-engine` has it; both pin `claude-opus-5`. Measured 2026-09-26: under `-p` in bypass mode the settings `ask` on `git commit*` did not hold, so the one on `git push*` would not either (inferred, no push attempted). Merge it into the trunk and the simulator branch first.
**Priority**: high
**Found in**: P-2026-09-26-1640
**Detail**: docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md (§7)

## 2026-09-26 — ticket: CLAUDE.md still cites P1..P15
**Ticket**: `CLAUDE.md:14` and `CLAUDE.md:108` say `P1..P15`, while `docs/PROTOCOL.md` 1.6 has P16. Outside the perimeter of P-2026-09-26-1640 (a fix regenerates `AGENTS.md`). Update both to `P1..P16`, then `npm run gen:agents` and `npm run check:agents`.
**Priority**: low
**Found in**: P-2026-09-26-1640
**Detail**: docs/discovery/discovery_2026-09-26_orchestrated_lanes_harness.md (§4)

## 2026-09-25 — feat(harness): hook gates off ask under bypass, Opus 5.5 pin (P-2026-09-25-1022)
**Prompt**: `claude_2026-09-25_1022_prompt_harness_bypass_gates.md`, two-phase, on `harness-bypass` in `~/jjodel-gate`. Phase 1 report `ddee7a09e` (`docs/discovery/discovery_2026-09-25_harness_bypass_gates.md`). GO with four rulings: `docs/HARNESS-DOCS.md` rows 381-382 join the closure commit; `status-flip` loses the lone-commit path; the bypass deny covers the whole 3.2 trigger, with one test for a creator outside the six and one for `SetFieldAction` in `sync/`; `settings.local.json` of this worktree deleted after the gates. `bubble` stays `ask`.
**Files touched**: code `cd5eb9eb5`: `.claude/settings.json`, `.claude/skills/status-flip/SKILL.md`, `frontend/scripts/hooks/critical-zone.mjs`, `bash-guard.mjs`, `__tests__/criticalZone.test.ts`, `__tests__/bashGuard.test.ts`. Docs: the Phase 1 report `ddee7a09e`; this closure commit: `docs/HARNESS-DOCS.md`, the prompt file (Status), this inbox. Untracked, no commit: `.claude/settings.local.json` deleted.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `cd5eb9eb5`: `npx vitest run scripts/hooks` 233 passed (203 + 30), the 203 old tests unchanged; `check:docs` 4/4; `check:agents` green; `typecheck:scripts` exit 0; `check:scripts` pass. Mutation bench through `HOOKS_DIR`: 18 of 18 killed, listed in the body of `cd5eb9eb5`; control, an unmutated copy through the same path, 233 passed.
**Out-of-scope changes**: yes — `docs/HARNESS-DOCS.md` was outside the prompt's DOVE and joined by the GO, as DOVE provides; 10 files over the lane (6 code, 4 docs), above the P6 five, all declared in the prompt, the report or the GO. Nothing else.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — harness lane, nothing reaches the UI.
**Notes**: The `bypassPermissions` value on a hook's stdin is read from the docs and the 2.1.282 binary, not captured: capturing it needs a logging hook, which the prompt forbids (report §1.5). Gates ran through a temporary `node_modules` symlink (P14), removed at the end. The deny list refused an `rm -rf` of a bench copy, as designed; the copy stayed in the scratchpad.
**Prompt document name**: 2026-09-25 10:22

**Ticket** (opened, not fixed here). The `log-entry` skill, rule 6, says to commit the inbox alone; RC-17 and P13 put the inbox entry in the lane's closure commit with the Status line. This lane followed the GO and P13. `.claude/skills/log-entry/SKILL.md` needs the same change `status-flip` got here, in a lane that holds it.

## 2026-09-26 — merge: bypass gates and Opus 5.5 pin into the trunk (P-2026-09-26-2245)
**Prompt**: `claude_2026-09-26_2245_prompt_merge_harness_bypass.md`, `Lane: full (merge, harness settings and hooks)`, single phase on the trunk in `~/jjodel-release`, hard stop before `~/jjodel-sim`. Merge `f3a014e4d` (`harness-bypass`, P-2026-09-25-1022) with `--no-ff`. Closes on the trunk the BLOCKING ticket `merge P-2026-09-25-1022 before the first orchestrated launch` (found in P-2026-09-26-1640) with the merge `9cd3e632b`.
**Files touched**: merge `9cd3e632b`: the ten files of `afaea8756..f3a014e4d` (`.claude/settings.json`, `.claude/skills/status-flip/SKILL.md`, `docs/HARNESS-DOCS.md`, the 1022 report and prompt, `docs/log-inbox/harness.md`, `bash-guard.mjs`, `critical-zone.mjs` and their two tests); one hand edit, the inbox as a union (trunk's 71 lines, then the 1022 entry, 15 lines added). This commit: this entry, the prompt's Status line.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. On `9cd3e632b`: typecheck 14, the §17 set; typecheck:scripts 0; hook tests 250 passed (220 + 30, stated before), `laneRun.test.ts` 17; vitest 4884 passed (4854 + 30, stated before), 0 failed, the same 9 red at import; build 0; `check:docs` 4/4, 5 warnings; `check:agents` green; `check:scripts` 27 files, 0 probes. Probes: push denied in bypass, silent in default; critical zone denied in bypass, ask in default; skill extractions byte-identical to HEAD's.
**Out-of-scope changes**: no — ten files in the merge, the ten named in step 2 of the prompt; the one hand edit is the inbox union the prompt allows.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Step 5 named `editor-v2/sync/useJjomSync.ts`, which does not exist; probed `editor-v2/hooks/useJjomSync.ts`, the 3.2 file (the literal path: no output, correctly). The range `afaea8756..b8dc0edae^` omits `b8dc0edae`; the merge body lists 121 commits. log-entry rule 6 not followed: P13 and the prompt put this entry with the Status line. The `simulation-engine` half of the ticket is step 9, after Alfonso's OK.
**Prompt document name**: 2026-09-26 22:45
