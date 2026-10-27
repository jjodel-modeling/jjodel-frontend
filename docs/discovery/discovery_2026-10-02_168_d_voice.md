# Discovery 2026-10-02 — #168 D: a Jodie for the consumer (J7)

- Prompt-ID: `P-2026-10-02-2216` · prompt `docs/prompts/claude_2026-10-02_2216_prompt_168_d_voice.md`
- Session: `6bb119a9-257d-4efc-b237-ed754dc1991d` · tree `/Users/juridirocco/development/jjodel-168-voice`, branch `168-voice`, HEAD `4e2382f36`
- Executor: Anthropic Claude Opus 5.5 (session banner)
- Phase 1, read-only on tracked files. One probe, `frontend/scripts/smoke/_tmp_168_d_p0.ts` (untracked, `_tmp_*`), run twice by `lane-run probe` on **3048**. AI provider mocked by `ctx.route` (lane A's fake key), notifications API mocked to return one tip: **0 real calls**, 2 mock AI calls per run. Fixture: lane A's localStorage dump, copied to this session's scratchpad (`p0/`). Logs in `~/.jjodel-lanes/P-2026-10-02-2216/`.
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## 0. Answer in brief

**Measured on `4e2382f36`: in consumer mode, Jodie today is the developer's Jodie, item by item (§3).** The page shows the Quick tip. The window shows the pill «Jjodie / JjScript / JjEL» and the chip «M2 · ScenarioMM», which stays after a selection. The welcome says «metamodeling assistant», and the input carries `jjodie>`. Cmd+J, Ctrl+. and a backtick change the mode. `/help` describes the modes, and `/js` / `/jjel` switch to them. `create class X` produces the «Run» card with no AI call. A reply with a code block carries «Source» and «Test in console mode», and so does the «Now looking at» line. Without a key, the send button and «Configure a provider» in the header both open Settings on **Providers**, in consumer mode too. Two runs are byte-identical (§3.3), and that output is the Phase 2 developer reference.

**Design (§5):** every change sits behind `isConsumerMode()`, there is no new CSS (existing classes only) and no interface change. The text decisions go in one pure module, `Jodie/consumerVoice.ts` (focus label, greeting, help, slash routing, provider invitation), tested by the `node` bench. **9 code files, more than 5 (Rule 19), listed in §6 for the GO.** `JjodieWelcome.tsx` and `JjodieGreeting.tsx` are not touched: no file imports them (§4.6).

Beyond the prompt's list, found and included: the backtick mode switch (`ChatInput.tsx:377`), and «Test in console mode» under any reply that holds a code block (`ChatMessages.tsx:182`).

**Decisions taken (unattended):** none. **Decisions awaiting Alfonso (RC-26):** none. No critical-zone file, no exported interface changed, and the developer branch is unchanged.

**Questions:**
1. «Source» in consumer mode: only under notice lines, or under every message?
   Recommended: every message in consumer mode. It shows raw markdown, and the script C2 keeps in a closed «Details». One prop, no change to `types/jodie.ts`.
2. What does the header show in consumer mode?
   Recommended: the focus in the words of the chat line, `Scenario «Arco_0»` (only the type when there is no instance), with `bi-eye`. Nothing when there is no selection.
3. How does the greeting name the environment?
   Recommended: the project and the profile, «I'm your assistant for Probe_168_A (profile Edu).» The environment has no name of its own: `DEnvironmentConfig` has no `name` field.
4. Quick tips in consumer mode: the tips only, or the system notices as well?
   Recommended: the tips only (D4). System notices stay, and a tip is not marked as seen in consumer mode.
5. What do `/js`, `/jjel` and `/ask` do in consumer mode?
   Recommended: they are unknown commands («Unknown command: /js. Type /help …», no AI call). Only `/help` and `/clear` remain.
6. Where does the invitation to set up a provider go (D1)?
   Recommended: a line and a «Set up an AI provider» button in the empty-chat welcome, consumer mode only. It opens Settings on Providers, the measured path.
7. Developer → `&profile=` without a reload: does Jodie follow?
   Recommended: yes. It listens to `hashchange` and goes back to natural language, the same pattern as `Navbar.tsx:583-588`.
8. The «no scope» message of `handleJjScriptExecute` says «metamodel or model» to the consumer. Does it change?
   Recommended: yes. In consumer mode it reads «Select an element in the Configurator, then ask again.» It is rarely reachable (a type with no model).

---

## 1. Hypotheses and verdicts

| # | Hypothesis | Verdict | Evidence |
|---|-----------|---------|----------|
| H1 | In consumer mode Jodie shows the three modes and cycles them (Cmd+J, Ctrl+., backtick, `/js`, `/jjel`) | **holds** | measured: `con.pill` `["Jjodie","JjScript","JjEL"]`; glyph `jjscript>` after Meta+J and Ctrl+., `jjel>` after the backtick and after `/jjel` (§3.2) |
| H2 | A JjScript-shaped input produces the «Run» card in consumer mode, without the AI | **holds** | measured: `con.createClass` offer «This looks like a JjScript command / create class X / Run / Ask Jjodie», `ai: 0` |
| H3 | The welcome and the help speak in jargon | **holds** | measured: «Your metamodeling assistant», «Metamodel design patterns»; the help names JjScript, JjEL and the mode switches |
| H4 | The header shows «M2 · <metamodel>» in consumer mode, even after a selection | **holds** | measured: `con.chip` and `con.chipAfterSelect` `M2 · ScenarioMM`; read: `JodieHeader.tsx:86`, `:90` |
| H5 | The Quick tip is shown in consumer mode, and its text is not in the source | **holds** | measured: the mocked tip is painted in both modes; read: text served by `API_URL` (`NotificationWidget.tsx:21`), §4.7 |
| H6 | The «Now looking at» line carries «Source» | **holds** | measured: `con.noticeLine` `"Now looking at: Scenario «Scenario_0»\n\nSource"` |
| H7 | Without a provider the consumer can still reach the provider settings | **holds** | measured: `conNo.settings` `{open: true, active: "Providers"}` after a click on the send button; the header reads «Configure a provider» |
| H8 | `JjodieWelcome` / `JjodieGreeting` are what the consumer sees | **falsified** | read: no importer (§4.6), positive control in the same command |
| H9 | The «Executing (n/m)» toolbar can show raw JjScript to the consumer | **falsified as read** | read: `JjScriptEvents.EXECUTING` is dispatched only by `jjodie-integration/useMetamodelGeneration.ts:303` (M2 generation); `ScriptBlock` dispatches only `EXECUTION_END` |
| H10 | Everything fits behind `isConsumerMode()` without new CSS or a changed interface | **holds, as design** | read: the classes `.jodie-metamodel-indicator`, `.jodie-metamodel-name` (ellipsis), `.jodie-welcome p/ul/li` and `.jodie-promote-btn` exist (`JodieWindow.css:306`, `:326`, `:655-698`) |

## 2. Files read

`CLAUDE.md`; `docs/PROTOCOL.md` (whole); `docs/decisions.md` (Processo, RC-3..RC-32); `frontend/src/styles/CLAUDE.md`; `docs/discovery/discovery_2026-10-01_168_a_context.md` (whole); `docs/discovery/discovery_2026-10-01_168_m0_measures.md` (1-60); `docs/log-inbox/jodie-consumer.md` (whole); `frontend/scripts/smoke/README-probes.md` (whole); `docs/prompts/claude_2026-10-02_2215_prompt_168_c2_proposal.md` (whole, for the boundaries).
Code: `frontend/src/components/Jodie/Jodie.tsx`, `JodieWindow.tsx`, `JodieHeader.tsx`, `ChatInput.tsx`, `ChatMessages.tsx`, `MarkdownMessage.tsx`, `JjodieWelcome.tsx`, `JjodieGreeting.tsx`, `JodieMinimized.tsx`, `index.ts`, `console/languageRegistry.ts`, `console/types.ts` (whole); `frontend/src/components/NotificationWidget/NotificationWidget.tsx` (whole); `frontend/src/components/environment/consumerMode.ts` (whole), `consumerJodieContext.ts` (1-200); `frontend/src/contexts/SettingsModalContext.tsx` (whole); `frontend/src/components/common/AIDisclaimer.tsx` (whole); `frontend/src/types/jodie.ts` (840-925); `frontend/src/joiner/environmentConfig.ts` (1-140); `frontend/src/joiner/classes.ts` (3720-3790); `frontend/src/App.tsx` (150-195); `frontend/src/pages/components/Navbar.tsx` (575-612, 1990-2075, `consumer` lines); `frontend/src/pages/components/LeftBar.tsx` (272-300); `frontend/src/components/environment/ConfiguratorTab.tsx` (290-310); `frontend/src/components/common/ProviderModelSelector.tsx` (`compact`/`onNavigateToSettings` lines); `frontend/src/components/settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx` (100-175, class lines); `frontend/src/components/Jodie/JodieWindow.css` (selector windows above); `frontend/vitest.config.ts`. Partial reads are reported as windows.

Lane A probes, read only: `/Users/juridirocco/development/jjodel-168-context/frontend/scripts/smoke/_tmp_168_a_verify.ts` (1-200), lane A's fixture (`fixture.json`, the key list of `fixture-localStorage.json`).

## 3. Step 0 — measures

### 3.1 Method

`_tmp_168_d_p0.ts` seeds lane A's dump (project `Probe_168_A`, metamodel ScenarioMM, models `scen_a` / `scen_b`, profile Edu) once per context. It routes `AI.*` hosts to a mock reply that holds bold text and a fenced `jjscript` block, and it routes `jjodel-notifications…workers.dev` to `{posts: [{category: 'tip', message: 'PROBE_TIP: Press Ctrl-J …'}]}`. The four scenes are developer (with `scen_a` opened by `DockManager.open2`), consumer (`&profile=Edu`), and each of those without a provider (the `jjodie_provider_gpt` and `jjodel_provider_chat` keys left out of the seed). Real keys and clicks only (`Meta+j`, `Control+Period`, `Backquote`, Enter). The one exception is a selection-row click, which falls back to a DOM click if it is intercepted; in practice it was a real click (`con.selectClick: real`). The mode is read from the glyph `.jodie-code-prompt` (`${consoleMode}>`).

Instrument controls, all PASS in both runs: C1 developer Cmd+J moves the glyph `jjodie> → jjscript> → … → jjodie>`; C2 developer `create class X` gives the card with `ai: 0`; C3 developer question reaches the mock (`ai: 1`) and the reply has «Source»; C4 the mocked tip is painted; C5 developer without provider, the send button opens Settings; C6 zero page errors.

### 3.2 Results (run `p0`, 6/6 ALL GREEN, run `p0b` identical)

| Item | Developer | Consumer (today) |
|---|---|---|
| Quick tip | painted | **painted** |
| Header | `Jjodie / Select a model / Jjodie JjScript JjEL / M1 · scen_a` | `… / Jjodie JjScript JjEL / **M2 · ScenarioMM**` |
| Header after selecting `Scenario_0` | — | **M2 · ScenarioMM** |
| Welcome | «Hi, I'm Jjodie! / Your metamodeling assistant. …» (4 items) | **same** |
| Glyph / placeholder | `jjodie>` / empty | **`jjodie>`** / empty |
| Meta+J · Ctrl+. · backtick | `jjscript>` · `jjscript>` · `jjel>` | **same** |
| `/help` | «Jjodie console — modes … Slash commands … » + Source | **same** |
| `/js` · `/jjel` | `jjscript>` · `jjel>`, no line | **same** |
| `create class X` | card «This looks like a JjScript command», Run, Ask Jjodie, `ai: 0` | **same** |
| Question | mock reply, «Source», «Test in console mode», `ai: 1` | **same** |
| «Now looking at» line | — | `Now looking at: Scenario «Scenario_0»` + **Source** |
| No provider: header / send button | «Configure a provider» / `--no-provider`, «Configure an AI provider in Settings» | same |
| No provider: Enter on «hello» | no line | no line |
| No provider: click the send button | Settings open, **Providers** active | Settings open, **Providers** active |

### 3.3 Developer reference for Phase 2

The four records are in the scratchpad `p0/`: `d-p0-dev.json` (sha1 `f0a7019a`), `d-p0-dev-noprovider.json` (`9c80fca9`), `d-p0-con.json` (`98987d47`), `d-p0-con-noprovider.json` (`ebd357de`). The second run (`d-p0b-*`) is byte-identical on all four (`cmp`). Phase 2 re-runs the same probe on its code. The `dev` and `dev-noprovider` records must stay byte-identical, and the `con` records must change in the expected places and nowhere else.

Typecheck on `4e2382f36`: `npx tsc --noEmit` exit 2, complete output, **14** errors, the §17 set. One of them is `src/components/Jodie/ChatMessages.tsx(271,13) TS2322` (`CodeReplEntry`, not touched by the design).

## 4. Findings (read)

**4.1 Modes and shortcuts (`Jodie.tsx`).** Every user-facing switch goes through `setMode` (`:413` `const setMode = useCallback((next: ConsoleMode, via?: ConsoleModeSwitchVia) => {`), except two direct calls: `handleTestInCode` (`:471` `setConsoleMode('jjel');`) and `handleAskJjodie` (`:482`). The global listener is `:432-450`, with `:434` `const isCmdJ = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j';` and `:446`, which opens the window. Jodie does not re-render on a hash change: its state is local, and it reads the store with `store.getState()` (`:156`), not a subscription.

**4.2 Offer card and routing.** `:539` `if (consoleMode === 'jjscript') {` routes every input to JjScript. `:595` `if (jjscriptProvider.detect?.(content)) {` builds `jjscriptOffer` and returns before the AI. The card is rendered at `ChatMessages.tsx:83-119` (`:92` `This looks like a JjScript command`, `:101` `<span>Run</span>`).

**4.3 Help.** `:60-70` `CONSOLE_HELP_TEXT`, `:61` `'**Jjodie console — modes**'`, `:67` `'**Switch modes:** \`Cmd/Ctrl+J\` or \`Ctrl+.\` cycle · click the mode chip to pick.'`, appended by `handleHelpRequested` (`:488-497`).

**4.4 Input (`ChatInput.tsx`).** The glyph is at `:745` `{\`${consoleMode}>\`}`, with no placeholder (`:631` `const getPlaceholder = () => placeholder ?? '';`, and `JodieWindow` passes none). The meta commands are at `:303` `if (trimmed === '/js' || trimmed === '/jjel' || trimmed === '/ask' || trimmed === '/help') {`, repeated for Enter at `:426`. An unknown `/…` is at `:318` `if (consoleMode === 'jjodie' && trimmed.startsWith('/')) {` and gets the static line «Unknown command: …» (`Jodie.tsx:507`). The backtick is at `:377` `if (!isCode && e.key === '\`' && message === '') {`, followed by `onConsoleModeChange('jjel', 'backtick')`. The no-provider state is at `:644` and `:688-696` (title «Configure an AI provider in Settings», `onClick: handleOpenSettingsClick`).

**4.5 Header (`JodieHeader.tsx`).** The chip is computed at `:70` `const activeModel = getActiveModel() ?? Selectors.getActiveModel();`, falls back at `:86` `targetMetamodel = metamodels[0];` and sets the level at `:90`. It is rendered at `:209-234` (`:215` `<span className="jodie-metamodel-level">{context.level} · </span>`; `:229` `title="Open a project to use JjScript"`). The pill is at `:191-205` (`:200` `` title={`Switch to ${CONSOLE_MODE_LABELS[m]} (Cmd+J / Ctrl+.)`} ``), and the JjEL subrow at `:277-283`. The hook listens to the store and to `EDITOR_TYPE_CHANGE` (`:115`, `:132`), and does not listen to the Configurator's selection.

**4.6 Welcome.** The one the consumer sees is `ChatMessages.tsx:466-479` (`:471` `<h3>Hi, I'm Jjodie!</h3>`, `:472` `<p>Your metamodeling assistant. I can help you with:</p>`). `JjodieWelcome.tsx` and `JjodieGreeting.tsx` are not mounted: `command grep -rn 'JjodieWelcome\|JjodieGreeting' --include='*.tsx' --include='*.ts' --include='*.js' frontend/src` finds only their own lines, and `Jodie/index.ts` does not export them. The positive control, the same command on `MarkdownMessage`, finds `ChatMessages.tsx:9` and `:175`.

**4.7 Quick tips.** `NotificationWidget.tsx:21` `const API_URL = 'https://jjodel-notifications.alfonso-pierantonio.workers.dev';`; `:98` `const tips = useMemo(() => posts.filter(p => p.category === 'tip'), [posts]);`; render at `:226-251` (`:234` `<span>Quick Tip</span>`). It is mounted for every user (`App.tsx:176` `{user && <Try><NotificationWidget/></Try>}`). The text «Press Ctrl-J …» comes from the API: `command grep -rn 'Ctrl-J'` over `frontend/src` finds nothing, and in the same command the `NotificationWidget` pattern finds `App.tsx:46` and `:176`. A tip is marked as seen only by «Next» or by closing it (`:151-187`), so skipping it at render time leaves the developer's queue untouched. The `data-notification-visible` attribute (`:124`) has no reader in `frontend/src` (searched with `command grep -rn 'notification-visible' .`, which found only the 3 writes).

**4.8 «Source».** `MarkdownMessage.tsx:46` renders plain text when there is no markdown, and `:64-72` shows the toggle under any markdown message (`:71` `<span>{showSource ? 'Formatted' : 'Source'}</span>`). The consumer line is markdown on purpose: `Jodie.tsx:331` `` content: `*${line}*`, ``. «Source» swaps the whole rendered message for the raw text, including whatever C2's `CodeBlock` renders inside `MarkdownRenderer`.

**4.9 «Test in console mode».** `ChatMessages.tsx:79` `const promoteCodeBlock = !isUser && !isJjScript ? extractFirstCodeBlock(message.content) : null;`, button at `:182-191`. It shows under any reply with a fenced block, so under every C2 proposal in consumer mode unless it is gated.

**4.10 The no-scope message.** `ChatMessages.tsx:419-425`, `:423` `'Jjodie answered with no metamodel or model in focus, so this script has no scope to run in. Open the metamodel or model you want to change, then ask Jjodie again.'`. With lane A the consumer scope always resolves when the selection resolves a model (`Jodie.tsx:109`). It does not resolve when the type has no model of its metamodel (`modelsForType` empty).

**4.11 Provider and Settings.** `Jodie.tsx:794-796` `settingsModal?.openSettings('providers');`. The modal is mounted by the provider for the whole app (`SettingsModalContext.tsx:78` `<UnifiedSettingsModal`), with no consumer gate. The header's selector shows «Configure a provider» (`ProviderModelSelector.tsx:84`) and navigates to settings (`:105`). `JodieWindow.tsx:158` and `:287-292` already keep `isAlive` (`JodieConfig.hasEnabledProviders()`, refreshed on `AIEvents.SETTINGS_CHANGED`).

**4.12 What names the environment.** `DEnvironmentConfig` has `topLevelTypes` and `profiles`, and no `name` (`classes.ts:3720-3728`). `DProfile` has `name: string = '';` (`:3769`). The Configurator labels the profile `{profile.name || 'profile'}` (`ConfiguratorTab.tsx:303`). The fixture's project is named `Probe_168_A`.

**4.13 The selection, as lane A left it.** `describeConsumerSelection` (`consumerJodieContext.ts:155`) returns `{ key, typeName, instanceName }`, and `selectionNotice` (`:169`) gives «Now looking at: Scenario «Arco_0»». The Configurator writes the selection before it dispatches `EnvGenEvents.CONFIGURATOR_SELECTION_CHANGED`, so a listener reads it with `getConsumerSelection()`.

**4.14 Consumer pattern in the codebase.** `Navbar.tsx:583-589` and `LeftBar.tsx:280-289` keep a `hashchange` tick so that `isConsumerMode()` is re-evaluated without a reload. `Dock.tsx:269-271` follows the same idea.

## 5. The design

All of it sits behind `isConsumerMode()`. The developer branch runs the same code it runs today.

| Surface | Consumer | File |
|---|---|---|
| Mode | always natural language: `setMode` refuses any other mode; a `hashchange` tick resets to `jjodie` and re-renders (Q7) | `Jodie.tsx` |
| Cmd+J, Ctrl+. | the listener returns before `preventDefault`: no mode change, the window does not open | `Jodie.tsx` |
| Backtick | no switch, the character is typed | `ChatInput.tsx` |
| Slash commands | `consumerSlashCommand`: `/clear` and `/help` stay, every other `/…` is an unknown command (Q5) | `ChatInput.tsx`, `consumerVoice.ts` |
| `jjscript` routing and offer card | skipped: the input goes to the AI (`!isConsumerMode() && detect`) | `Jodie.tsx` |
| Help | `consumerHelpText()`: what you can ask (explain, change with your confirmation, check) and `/help` / `/clear`, with no modes | `Jodie.tsx`, `consumerVoice.ts` |
| Welcome | `consumerGreeting(project, profile)` in the existing classes (Q3); with no provider, `CONSUMER_PROVIDER_INVITE`, a line and a `jodie-promote-btn` button that opens Providers (Q6) | `ChatMessages.tsx`, `JodieWindow.tsx` (passes `onOpenSettings`, `providerMissing`), `consumerVoice.ts` |
| Header | no pill; the centre shows `consumerFocusLabel(describeConsumerSelection(...))` or nothing; listens to `CONFIGURATOR_SELECTION_CHANGED` and to the store (renames) (Q2) | `JodieHeader.tsx`, `consumerVoice.ts` |
| Glyph and placeholder | no `jjodie>`; placeholder `CONSUMER_INPUT_PLACEHOLDER` («Ask a question or describe a change») | `ChatInput.tsx`, `consumerVoice.ts` |
| «Source» | `MarkdownMessage` gains an optional prop `showSourceToggle` (default `true`); `ChatMessages` passes `false` in consumer mode (Q1) | `MarkdownMessage.tsx`, `ChatMessages.tsx` |
| «Test in console mode» | not rendered; `handleTestInCode` does nothing in consumer mode | `ChatMessages.tsx`, `Jodie.tsx` |
| No-scope message | `CONSUMER_NO_SCOPE` (Q8) | `ChatMessages.tsx`, `consumerVoice.ts` |
| Quick tip | not rendered in consumer mode and not marked as seen; system notices stay (Q4) | `NotificationWidget.tsx` |

If Q1 is answered «notices only», the fallback is a marker: an optional `notice?: true` on `ChatMessage` (`types/jodie.ts`, Rule 11), set at `Jodie.tsx:331`, and `ChatMessages` passes `showSourceToggle={!message.notice}`. That is one more file, and the help line would need the marker too.

`consumerVoice.ts` has zero imports, so the `node` bench can load it. It exports:

```ts
export function consumerFocusLabel(d: { typeName: string; instanceName: string | null } | null): { text: string; title: string } | null;
export function consumerGreeting(projectName?: string | null, profileName?: string | null): { title: string; intro: string; items: Array<{ icon: string; text: string }>; hint: string };
export function consumerHelpText(): string;
export function consumerSlashCommand(trimmed: string): 'clear' | 'help' | 'unknown' | null;
export const CONSUMER_INPUT_PLACEHOLDER: string;
export const CONSUMER_PROVIDER_INVITE: { text: string; action: string };
export const CONSUMER_NO_SCOPE: string;
```

Test `components/Jodie/__tests__/consumerVoice.test.ts` (the vitest `include` already covers `src/**/__tests__/**/*.test.ts`). It checks the label with an instance, with the type only, and null; the greeting with both names, without the profile name, and without anything; the help with `/help` and `/clear` and no mode or shortcut. A table of slash inputs checks that `/js`, `/jjel`, `/ask` and `/foo` are unknown, `/help` and `/clear` are themselves, and plain text is null. Every output of the module is checked against a jargon regex: `M1`, `M2`, `metaclass`, `instance`, `JjScript`, `JjEL`, `metamodel`. The mutation bench is in the commit body: label without the instance, greeting without the profile, `/js` let through, help with the modes line, no-scope message replaced by the developer's.

Probe for Phase 2: `_tmp_168_d_p0.ts` re-run, with its own `PROBE_TAG`. The `dev*` records must be byte-identical to §3.3. The `con*` records are checked item by item against the prompt's step 3: no pill; Meta+J, Ctrl+. and the backtick leave the mode and the window alone; `create class X` gives `ai: 1` and no card; the greeting and help pass the jargon regex; the header has no «M2 ·» and, after the selection, reads `Scenario «Scenario_0»`; no tip (with the developer's tip as the control in the same run); no «Source» under the line; with no provider, the invitation opens Providers.

## 6. Files of Phase 2 (Rule 19: 9 code files)

1. `frontend/src/components/Jodie/consumerVoice.ts` (new): the pure decisions of §5.
2. `frontend/src/components/Jodie/__tests__/consumerVoice.test.ts` (new): its test.
3. `frontend/src/components/Jodie/Jodie.tsx`: `hashchange` tick, `setMode` guard, Cmd+J and Ctrl+. inert, no `jjscript` routing and no offer card, consumer help, `handleTestInCode` guard.
4. `frontend/src/components/Jodie/JodieWindow.tsx`: passes `onOpenSettings` and `providerMissing={!isAlive}` to `ChatMessages`.
5. `frontend/src/components/Jodie/JodieHeader.tsx`: no pill, focus label, listener on the selection.
6. `frontend/src/components/Jodie/ChatInput.tsx`: no glyph, placeholder, no backtick switch, consumer slash routing.
7. `frontend/src/components/Jodie/ChatMessages.tsx`: consumer welcome with the invitation, no «Test in console mode», `showSourceToggle`, consumer no-scope message.
8. `frontend/src/components/Jodie/MarkdownMessage.tsx`: optional prop `showSourceToggle`.
9. `frontend/src/components/NotificationWidget/NotificationWidget.tsx`: no tip in consumer mode.

No CSS, no `types/jodie.ts` (unless Q1 is answered «notices only»), and nothing from C1 (`jjscript/**`, `defaultPrompts.ts`) or C2 (`MarkdownRenderer.tsx`, `ConsumerProposal.*`, `consumerProposal.ts`, `environment/**`, `registry.ts`). `JodieHeader` imports `EnvGenEvents` and `consumerJodieContext` without modifying them.

## 7. Dependencies and risks

- **C2** renders the proposal inside `MarkdownRenderer`, which sits inside `MarkdownMessage`. With Q1 as recommended, «Source» no longer swaps C2's proposal for the raw script in consumer mode. The files are disjoint, so the merge order is free. The help and the greeting say «with your confirmation», which holds for both `ScriptBlock`'s «Run» and C2's «Apply».
- **C1** writes the consumer section of the chat prompt. What the AI answers to `create class X` in consumer mode is C1's, not D's. D only guarantees that the input reaches the AI.
- **Developer identity** is measured against the §3.3 reference, not against a code diff. A drift in an unrelated area (the provider selector, the welcome) would show up as a difference in `dev*`. It must be explained, not absorbed.
- **The «Now looking at» line** still reaches the AI history as an assistant message (`Jodie.tsx:672` `chatState.messages.filter(isChatEntry)`). That is outside J7 and not changed here.
- **NotificationWidget** does not re-render on `hashchange`. With developer → consumer without a reload, a tip already open stays until its next render. That is accepted: a fresh load is the consumer path.
- **Environment:** vite on 3048 started and stopped cleanly twice. Two other trees are listening (3000, 3046) and were not touched.

## 8. Method notes

- The first command lines of the search for the welcome components failed in zsh (`no matches found: --include=*.tsx`: the glob was not quoted). The silence was the command's, not the subject's. It was repeated with quotes and with the `MarkdownMessage` control, and both results are reported in §4.6.
- The probe's mode reader is the glyph, not React state. C1 shows it moves on the developer path, so a consumer that does not move it is a measurement with signal behind it.
