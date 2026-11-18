# Discovery 2026-11-15 — textual notation and code generation on by default in Advanced mode

- Prompt-ID: P-2026-11-15-1730, Phase 1 (read only)
- Prompt file: `docs/prompts/claude_2026-11-15_1730_prompt_advanced-default-text-codegen.md`
- Session id: not exposed to the session (`CLAUDE_SESSION_ID` unset)
- Tree: `~/jjodel-w-advanced-default`, branch `advanced-default-text-codegen`, HEAD `a5dfd4b4a` (clean)
- Executor: Opus 5.5 (`claude-opus-5-5`), effort xhigh
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the files.

## Objective

Map every reader of the codegen setting and say what changes under the rule of 3.2: with `VITE_CODEGEN=true`,
textual notation and code generation are available in Advanced mode unless the user stored `'false'`; hidden in
Basic; nothing changes with the flag off. Decide where Advanced mode is read without breaking the lazy gate.

## Hypotheses under test

1. **The setting module alone decides availability, so the change is one function.** Partly. `getCodegenEnabled`
   decides the key and the flag, but no reader combines it with Advanced mode except `codePillVisible` (finding F3);
   the Toolbar, ProjectEditor and LeftBar gates ignore the mode today (F2, F4, F5). Each needs the mode added.
2. **Advanced mode can be read inside `setting.ts` without breaking the lazy gate.** Holds for the gate, falsified as
   the right place. The gate only forbids modules under `src/codegen/` other than `setting.ts` (F8), so importing
   Redux would pass it; but the reactive source is the Redux root `state.advanced` (F9), and pulling the store into
   `setting.ts` would make `setting.test.ts` import the `joiner` barrel (the `window is not defined` gap of §17).
3. **Tests that assume off by default are only `setting.test.ts`.** Partly. Vitest: `setting.test.ts` (F11) and the
   source-text assertion of `textualPicker.test.ts` (F12). Two Playwright probes also assume a fresh context is off
   (F13).

## Files read (full paths)

- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/codegen/setting.ts` (whole, 126 lines)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/codegen/__tests__/setting.test.ts` (whole, 278 lines)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/components/editor-v2/Toolbar.tsx` (lines 120-135, 340-474; grep)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/components/editor-v2/EditorV2.tsx` (lines 680-700; grep)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/components/project/ProjectEditor.tsx` (lines 232-262; grep)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/pages/components/LeftBar.tsx` (lines 368-384, 560-590; grep)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/pages/settings/AdvancedSettings.tsx` (lines 1-40, 80-125)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/codegen/oracle/oracle.ts` (lines 350-368)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/hooks/useInterfaceMode.ts` (whole, 108 lines)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/pages/components/Navbar.tsx` (lines 926-950; grep at 986)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/pages/components/BottomBar.tsx` (lines 48-60)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/components/ModeSystem/LockedFeature.tsx` (lines 30-48)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/redux/store.tsx` (lines 210-218)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/scripts/gates/check-codegen-lazy.ts` (grep only, 250 lines)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/src/components/editor-v2/__tests__/textualPicker.test.ts` (lines 85-110)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/scripts/probe/codegen-*.ts`, `scripts/examples/build-codegen-examples.ts`, `scripts/smoke/states.ts` (grep only)
- `/Users/alfonso/jjodel-w-advanced-default/frontend/.env.development`, `.env.staging`, `.env.production` (grep `VITE_CODEGEN`)

## Findings

All read on HEAD `a5dfd4b4a`. "Read" means from the file; nothing was run in this phase but greps.

**F1 — the setting today (read).** `setting.ts:31-32`:
`if (import.meta.env.VITE_CODEGEN !== 'true') return false;` /
`return typeof localStorage !== 'undefined' && localStorage.getItem(CODEGEN_SETTING_KEY) === 'true';`.
Off with no key. The rule of 3.2 turns line 32 into "not `'false'`". The catch (`setting.ts:33-35`) returns false
on a throwing storage.

**F2 — Toolbar, the textual entry (read).** `Toolbar.tsx:351`: `const codegenEnabled = useCodegenEnabled() &&
CODEGEN_BUILD;`; the entry is pushed under `if (codegenEnabled) {` (`:454`) and the Data manager's hairline follows
it, `sep: !codegenEnabled,` (`:466`). No Advanced check: today the entry shows in Basic with the key `'true'`.
Change: `codegenEnabled` must also require Advanced. The same component already reads it later,
`const advancedMode = useSelector((state: any) => !!state.advanced);` (`:740`), one component from `:236` (grep of
top-level functions: `Toolbar` is the only one between 236 and 740), so a selector at `:351` or a move of `:740`
above it serves.

**F3 — EditorV2, the Code pill (read).** `EditorV2.tsx:690-691`: `const codegenEnabled = useCodegenEnabled();` and
`codePillVisible(codegenEnabled, !!state.advanced, ...)`. `codePillVisible` (`setting.ts:75-81`):
`if (!enabled) return false; if (advanced) return true;` then, in Basic, true when the metamodel holds `genTemplates`
or `genGenerators`. Under 3.2 Advanced already shows the pill with no templates; the Basic-with-templates branch is
what changes: "In Basic mode they stay hidden" turns it off (question Q1). The mount is
`{CODEGEN_BUILD && modelid && codePill && !isConsumerMode() && <CodegenSlot .../>}` (`EditorV2.tsx:5661`).

**F4 — ProjectEditor, GENERATORS of the project page (read).** `ProjectEditor.tsx:240`: `const codegenOn =
useCodegenEnabled();`; mount `{GeneratorsSection && codegenOn && !isConsumerMode() && (` (`:3076`). No mode check.
`ProjectEditor.tsx` does not import `useSelector` (grep -c: 0; positive control on LeftBar.tsx through the same
command: 5): Phase 2 adds the import.

**F5 — LeftBar, GENERATORS section and «New model from text» (read).** `LeftBar.tsx:376-377`: `const codegenOn =
useCodegenEnabled();` / `const showGenerators = codegenOn && !consumer;`; `codegenOn ? { ... title: 'New model from
text' ...} : undefined` (`:571-577`). No mode check: `command grep -n "advanced" LeftBar.tsx` returns nothing;
positive control, same tool and file, `codegenOn` returns `:376`, `:377`, `:571`. `useSelector` is imported (`:2`).

**F6 — Settings → Advanced, the switch (read).** `AdvancedSettings.tsx:89-108`, under `CODEGEN_BUILD &&`, group
`<label className="settings-label">Experimental</label>`, checkbox `checked={codegenEnabled}` from
`useCodegenEnabled()` (`:20`), `onChange={(e) => setCodegenEnabled(e.target.checked)}`, label «Code generation»,
description «Show the Code panel in the model editor: ...». The checkbox must show the user's choice, not the
effective availability: if `useCodegenEnabled` folded in the mode, a Basic user would see it unchecked and a click
would write `'true'`, a value with no new meaning. So the switch reads the key-and-flag value alone. The comment at
`:88` («Experimental (R-GEN-2): off by default») changes with it.

**F7 — oracle (read).** `oracle.ts:359-361`: `if (typeof window === 'undefined' || !getCodegenEnabled()) return;`
then installs `window.__jjodelOracle`, at module load (`:364`). `oracle.ts` is under `src/codegen/`, so it loads
only in a lazy chunk, reached after a UI gate that will require Advanced. With `getCodegenEnabled` meaning "flag on,
not turned off" the hook installs whenever the chunk loads; no code change needed. The probes write the key `'true'`
before load (F13), unaffected.

**F8 — the lazy gate (read).** `check-codegen-lazy.ts:50`: `const EAGER_ALLOWED = 'src/codegen/setting.ts';`,
`:89`: `const isGenerator = (path: string): boolean => path.startsWith(CODEGEN) && path !== EAGER_ALLOWED;`. It walks
the build output and forbids generator modules in the eager closure; it does not look at what `setting.ts` imports
from outside `src/codegen/`. It is a property of the build, independent of the runtime default: flipping the default
cannot turn it red as long as `setting.ts` imports nothing new under `src/codegen/`.

**F9 — where Advanced mode lives (read).** Two mirrors. Redux `advanced: boolean = false;` (`store.tsx:215`), written
by `SetRootFieldAction.new('advanced', ...)` at `Navbar.tsx:933`, `:947`, `:987`, `BottomBar.tsx:55`,
`ProfileSection.tsx:394`, `LockedFeature.tsx:41`; and localStorage `jjodel.interfaceMode`
(`useInterfaceMode.ts:17`), written beside Redux by Navbar, BottomBar and ProfileSection, but not by
`LockedFeature.tsx:41`. At boot `Navbar.tsx:986` (`if (!props.advanced && isAdvancedMode()) {`) lifts localStorage
into Redux. EditorV2 already chose Redux for the Simulation pill: `EditorV2.tsx:686-687`, «Redux `advanced`, not
isAdvancedMode(), which reads localStorage and is not reactive in this tab». Decision: read `state.advanced` in each
caller through `useSelector`, and keep `setting.ts` storage-only and Redux-free, with one pure combinator
(proposal below). That keeps the four cases executable in the node bench, with no store and no `joiner` import.

**F10 — Advanced is not a precondition of opening Settings → Advanced (read).** `AdvancedSettings` is mounted by
`UnifiedSettingsModal/sections/AdvancedSection.tsx:28` and `GlobalDrawer/SettingsDrawerContent.tsx:32`; no mode
guard was read at those sites (window read: the grep lines only). A Basic user can reach the switch; F6 holds.

**F11 — `setting.test.ts` expectations that change (read).** `:57-66` «is off with no key, and with every value but
"true"» (inverted: on with no key and with `''`, `'1'`, `'TRUE'`, `'yes'`; off with `'false'` only, per Q2);
`:68-73` «is off with no storage at all» (no storage becomes on, Q3); `:89-90` survives (`'false'` stays off);
`:123-127` renders `<span>false</span>` with no key (becomes true); `:129-156` expects `false` before
`setCodegenEnabled(true)` (`:145`) and after `setCodegenEnabled(false)` (`:155`), the first flips. `:265-277` (flag
off) survives as written. `codePillVisible` tests `:159-212` survive if its body is left as it is (Q1).

**F12 — `textualPicker.test.ts` pins the source (read).** `:100`:
`expect(TSX).toContain('const codegenEnabled = useCodegenEnabled() && CODEGEN_BUILD;');` and `:95` the
`if (codegenEnabled) {` guard. A source-text test; the Toolbar line changes, so the string changes. Per §5 a
source-text test is not extended; the four cases go to `setting.test.ts`, executed.

**F13 — probes that assume off by default (read, not run).** `codegen-panel.ts:5` «Phase off (fresh context,
Advanced mode, the setting never written)», and `codegen-examples.ts:5` «Fresh context, Advanced mode, the code
generation setting off» with `:207` checking that Settings «turns the setting on». Under 3.2 a fresh Advanced context
is on, and a click on a checked box turns it off. `codegen-check.ts:255`, `codegen-generator-tab.ts:435`,
`codegen-oracle.ts:252`, `codegen-leftbar.ts:171`, `build-codegen-examples.ts:183` write `'true'` and run seeded
Advanced (`seed(ctx, true)`, `states.ts:179`, `:189`): unaffected. `codegen-leftbar.ts:239-244` turns it off through
Settings and expects the section gone: unaffected.

**F14 — the flag (read).** `VITE_CODEGEN = true` in `.env.development:16`, `.env.production:19`, `.env.staging:15`.
Every reader keeps its `CODEGEN_BUILD` guard; with the flag off `getCodegenEnabled` returns false first
(`setting.ts:31`), so R-GEN-2's no-load clause is untouched.

## Proposal for Phase 2 (smallest change)

- `setting.ts`: `getCodegenEnabled` returns `flag on && key !== 'false'` (line 32 only), docs updated. New export
  `codegenAvailable(enabled: boolean, advanced: boolean): boolean` (`enabled && advanced`), pure.
- Toolbar `:351`, ProjectEditor `:240`, LeftBar `:376`: `codegenAvailable(useCodegenEnabled(), advanced)` with
  `advanced` from `useSelector((state: any) => !!state.advanced)`.
- EditorV2 `:691`: pass `codegenAvailable(codegenEnabled, !!state.advanced)` as the first argument of
  `codePillVisible` (Q1).
- AdvancedSettings: the checkbox keeps `useCodegenEnabled()` (the user's switch); group label «Experimental»
  replaced, description names textual notation and code generation (Q4).
- Tests: `setting.test.ts` inverted where F11 says, plus one describe with the four cases on `getCodegenEnabled` +
  `codegenAvailable` (flag off; Basic; Advanced with no key; Advanced with `'false'`); `textualPicker.test.ts:100`
  re-pinned.
- Files: 8 source and test files (`setting.ts`, `setting.test.ts`, `Toolbar.tsx`, `textualPicker.test.ts`,
  `EditorV2.tsx`, `ProjectEditor.tsx`, `LeftBar.tsx`, `AdvancedSettings.tsx`), plus the inbox log entry. Over the
  5-file threshold of Rule 19: the GO confirms the list.

## Dependencies and risks

- **R1, R-GEN-2 contradicted as written.** «behind a user-level experimental setting, off by default». The no-load
  clause holds (F14, F8); the default and the word "experimental" do not. A decisions row amending it is owed, docs
  only, not in the code commit (P13) (Q5).
- **R2, mirrors of Advanced diverge.** `LockedFeature.tsx:41` writes Redux only (F9). Reading Redux, as proposed, is
  right in this tab; a reload after an unlock from LockedFeature falls back to Basic. Pre-existing, not widened.
- **R3, existing `'false'` keys.** A user who turned the experimental switch on and then off holds `'false'` and
  stays off; one who never touched it is on. That is the rule, but a 3.1 user who toggled it once to try it will not
  see 3.2's default (accepted, by the rule's wording).
- **R4, the probes of F13** go red on their next run unless updated (Q6).
- **R5, the visual check** cannot be run by this lane on screen; it is owed to Alfonso on a probe port.

## Open questions

1. In Basic mode, a metamodel that holds `genTemplates`/`genGenerators` showed the Code pill (discovery §I.5, U4); hide it too? Recommended: hide it, per "in Basic they stay hidden", by gating the first argument of `codePillVisible` and leaving its body and tests untouched (Rule 9).
2. Which stored values turn it off: only `'false'`, or anything but `'true'`/absent? Recommended: only `'false'`, the value `setCodegenEnabled(false)` writes; any other value reads on.
3. No storage at all, and a storage that throws: on or off? Recommended: no storage reads on (nothing was turned off), a throwing storage stays off through the existing catch.
4. The Settings group label and text: Recommended: group «Code generation», checkbox «Textual notation and code generation», description «Show the textual notation and the Code panel in Advanced mode».
5. R-GEN-2 amendment row in `docs/decisions.md`: in this lane as a separate docs commit, or the chat's? Recommended: the chat writes it; this lane cites R-GEN-2 and this report in the commit body.
6. Update `scripts/probe/codegen-panel.ts` and `codegen-examples.ts` (off-by-default phases) in this lane? Recommended: yes, as declared scope expansion, writing `'false'` before load where a phase needs it off, without running them (port and runtime not owed here); else a ticket.
