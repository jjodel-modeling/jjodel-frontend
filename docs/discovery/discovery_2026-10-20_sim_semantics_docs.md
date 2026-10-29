# Discovery: simulation and semantics documentation (P-2026-10-20-0015, P-2026-10-20-0035)

Date: 2026-10-20. Branch `sim-docs`, cut from trunk `425187033`. Documentation only: no code, test, spec,
memo or `docs/decisions.md` change.

The read phase ran in lane P-2026-10-20-0015, which stopped on the AM-8 context ceiling before writing any
file; its handoff is `~/.jjodel-lanes/P-2026-10-20-0015/handoff.md` (outside the repo). Lane
P-2026-10-20-0035 wrote this report and the two pages from that handoff, and re-measured the citations
marked "spot-checked" below on the branch tip `f7d8cf72e`.

## Hypothesis

"The spec plus the R-SIM rows describe the trunk behaviour."

Verdict: **largely true, with twelve findings.** The R-SIM rows, read with their inline amendments, match the
code on every point the pages state, except the four items listed under "Decisions awaiting Alfonso". The
spec `docs/spec/claude_spec_2026-09-13_computational_model.md` is behind the rows in six places (F1 to F7):
where they disagree the pages follow the code and the rows, and the disagreement is recorded here, not fixed
in the spec.

## Files read

Authority order as set by the prompt: code, then `docs/decisions.md` (R-SIM, Superate), then the spec, then
the memos.

- Core, read in full: `frontend/src/model/simulation/netTypes.ts`, `netStep.ts`, `netCompile.ts`,
  `guardEvaluator.ts`, `actionEvaluator.ts`, `subsetChecker.ts`, `stcChecks.ts`, `simProfiles.ts`,
  `profileCodec.ts`, `roleCatalog.ts`, `scenarioCodec.ts`, `watchCodec.ts`, `watchEvaluator.ts`,
  `boardCodec.ts`, `boardOutputs.ts`, `derivedEvaluator.ts`, `stateAttributesCodec.ts`.
- JjEL: `frontend/src/jjel/stateReserved.ts`, `frontend/src/jjel/evaluator/evaluator.ts` (`and`/`or` at
  356-360, state error at 1015), `frontend/src/jjel/lexer/lexer.ts` (105, 153).
- Panel (through the explorer subagent): `frontend/src/components/editor-v2/sim/simBridge.ts`,
  `SimulationPanel.tsx`, `SimRolesModal.tsx`, `simRoleStatus.ts`, `simRunState.ts`, `SimTimeline.tsx`,
  `SimInputDialog.tsx`, `SimInspector.tsx`, `SimWatchesModal.tsx`, `simScenarios.ts`, `simCoverage.ts`,
  `SimCanvasLayer.tsx`, `simHideEvents.ts`, `simBoardClock.ts`, `simBoardDevices.tsx`, `SimBoardEditor.tsx`,
  `simBoardFace.ts`; `frontend/src/components/editors/Info.tsx` (346); `frontend/src/components/editor-v2/EditorV2.tsx` (5028);
  `frontend/src/components/help/HelpDrawer.tsx` (8-11).
- Rows and texts: `docs/decisions.md` series R-SIM (R-SIM-1 to R-SIM-146) and `## Superate` (6312-6331);
  `docs/spec/claude_spec_2026-09-13_computational_model.md`;
  `docs/ratifiche/claude_2026-10-10_memo_proposta_event_attributes.md`.
- Conventions: the seven pages under `docs/help/{panels,reference,tutorials}/`.

Spot-checked by P-2026-10-20-0035 on `f7d8cf72e`: `netStep.ts` 76-89, 142-151, 194, 200, 216, 222-224, 231,
283-284, 299-300, 340-351; `netTypes.ts` 27-30, 232-234, 343-353, 366; `netCompile.ts` 41-45, 160-164,
351-355, 488-491, 509-510, 534-537, 571-575; `simProfiles.ts` 12-13, 21, 35-37; `profileCodec.ts` 20, 92;
`simBridge.ts` 555-560, 707, 1399-1408, 1547-1557, 1577-1580; `subsetChecker.ts` 27-35; `stateReserved.ts`
18, 22; `guardEvaluator.ts` 62; `stcChecks.ts` 270-273; `actionEvaluator.ts` 81-86; `scenarioCodec.ts`
69-73; `watchEvaluator.ts` 15-16; `boardCodec.ts` 129-131; `simRunState.ts` 128-134; `roleCatalog.ts`
24-33; `SimulationPanel.tsx` 1285, 1292, 1317; `simBoardClock.ts` 193. All matched the handoff.

## Claim table

Paths abbreviate `frontend/src/model/simulation/` as `sim/` and `frontend/src/components/editor-v2/sim/` as
`ui/`.

| Behaviour stated in the docs | Source | Code evidence | Verdict |
|---|---|---|---|
| Five run statuses | R-SIM-29 | `sim/netTypes.ts:366` `export type NetRunStatus = 'Not started' \| 'Running' \| 'Terminated' \| 'Deadlock' \| 'Halted';` | matches |
| Status order: halt, terminated, any input with a candidate, else deadlock | R-SIM-29 | `sim/netStep.ts:345-346` `if (halt !== null) return 'Halted'; if (terminated(net, cfg.state)) return 'Terminated';` | matches |
| Panel shows `Running` when some press would ask an input | R-SIM-88 | `ui/simBridge.ts:1407-1408` `if (status !== 'Deadlock') return status; return [null, ...run.alphabet].some(e => inputAsks(run, e).length > 0) ? 'Running' : status;` | differs from R-SIM-29 text (A4) |
| Termination: all marked places Terminal, or any Activity final marked | R-SIM-27, R-SIM-53 | `sim/netStep.ts:77-79` `// R-SIM-53: a marked activity final ends the run, whatever else is marked.` | matches |
| Terminated configuration has no candidates | R-SIM-27 | `sim/netStep.ts:194` `if (terminated(net, state)) return { event, terminated: true, candidates: [], evaluated: [] };` | matches |
| Progress constraint: none only when no candidate | R-SIM-7 | `sim/netStep.ts:223` `return selector === null ? cs.candidates.length === 0 : cs.candidates.some(c => c.transition === selector);` | matches |
| Inhibitor blocks at `tokens >= weight` | R-SIM-24 | `sim/netStep.ts:200` `const blocker = t.inhibitors.find(a => tokens(state, a.place) >= a.weight);` | matches |
| Unsafe firing listed as a candidate, flagged | R-SIM-23 | `sim/netStep.ts:216` `found.push({ transition: t.id, unsafe: fireMarking(net, state.marking, t).unsafe });` | matches |
| Unsafe firing halts, no saturation | R-SIM-23 | `sim/netStep.ts:284` `if (unsafe) return halted({ kind: 'unsafe', place: unsafe.place, value: unsafe.value, bound: net.bound });` | matches |
| Bound: integer at least 1, default 1 | R-SIM-23 | `sim/netCompile.ts:44` `return Number.isInteger(n) && n >= 1 ? n : null;` | matches |
| Initial marking outside 0..k: defect, place empty | R-SIM-28 | `sim/netCompile.ts:534-535` `if (typeof raw !== 'number' \|\| !Number.isInteger(raw) \|\| raw < 0 \|\| raw > stc.bound) { defects.push({ element: p, code: 'initial-over-bound', ...` | matches |
| Net defect codes | R-SIM-31 | `sim/netTypes.ts:233-234` `\| 'no-target' \| 'no-source' \| 'not-a-place' \| 'pseudo-chain' \| 'pseudo-open' \| 'bad-arc' \| 'bad-weight' \| 'else-twice' \| 'else-position' \| 'initial-over-bound';` | matches |
| `else` siblings: same preset with weights, same triggers | R-SIM-25, R-SIM-64 | `sim/netCompile.ts:161-163` `const pre = [...t.preset].map(a => \`${a.place}*${a.weight}\`).sort().join(','); const trig = [...new Set(t.triggers)].sort().join(',');` | matches |
| `else` on a fused transition only on the choice edge | R-SIM-84 | `sim/netCompile.ts:353` `defects.push({ element: stray.id, code: 'else-position', ...` | matches |
| `else` with no sibling: Reset defect, stays true | R-SIM-87 | `sim/stcChecks.ts:272` `return { reason: 'else-alone', detail: 'else with no sibling: ... so it is always true', ...` | matches |
| Guard conjunction: defect wins, then false; no site is true | R-SIM-17, R-SIM-90 | `sim/netStep.ts:142` `/** The conjunction of the guard sites: a defect wins, then false; no site is true (R-SIM-17). */` | matches |
| Absent guard is true | R-SIM-17 | `sim/guardEvaluator.ts:62` `if (text.trim() === '') return { source: text, expr: null, diagnostics: [], defect: null };` | matches |
| Guard defect removes the transition, never halts | (R-SIM-145 reserved, not ratified) | `sim/netStep.ts:146` `if (g.kind === 'defect') return g;` (the candidate loop skips non-true outcomes) | matches today's code; R-SIM-145 not documented as current |
| Guard roots `self`, `event`, `model`, `node` | R-SIM-18, R-SIM-42 | `jjel/stateReserved.ts:18` `roots: Object.freeze(['self', 'event', 'model', 'node']) as readonly string[],` | matches; spec §5.1 differs (F2) |
| `marked`, `tokens` read-only and reserved | R-SIM-30 | `jjel/stateReserved.ts:22` `readOnlyAttributes: Object.freeze(['marked', 'tokens']) as readonly string[],` | matches |
| Subset checker is syntactic | spec §5.4 | `sim/subsetChecker.ts:28` `Syntactic: no receiver types.` | differs from spec §5.4, §9 (F5) |
| Semantic assignment cannot read `node` | R-SIM-18 | `sim/actionEvaluator.ts:84` `defect: 'E-NODE: \`node\` is presentation state: a semantic assignment cannot read it (R-SIM-18).',` | matches |
| Double assignment: halt at run time | R-SIM-17 | `sim/netStep.ts:300` `if (written.has(key)) return halted({ kind: 'double-assignment', element: a.element, attr: a.attr });` | matches |
| Double assignment: Reset defect when targets are known | R-SIM-17, R-SIM-70 | `ui/simBridge.ts:556-558` `if (targets.has(written)) { out.push({ element: t.id, role: 'action', reason: 'double-assignment', ...` | matches; spec §5.3 "at authoring time" differs (F3) |
| Halt reasons | R-SIM-29, R-SIM-70, R-SIM-73, R-SIM-75, R-SIM-88 | `sim/netTypes.ts:343-353` kinds `unsafe`, `domain`, `double-assignment`, `action-defect`, `undeclared`, `derived`, `read-only` | matches |
| Domains boolean, range of integers, enum | R-SIM-19 | `sim/netTypes.ts:28-30` `\| { readonly kind: 'boolean' } \| { readonly kind: 'range'; readonly min: number; readonly max: number } \| { readonly kind: 'enum'; ... }` | matches; spec §3.2 "0..n" differs (F6) |
| Range check: integer, bounds included | R-SIM-19 | `sim/netStep.ts:231` `case 'range': return typeof value === 'number' && Number.isInteger(value) && value >= domain.min && value <= domain.max;` | matches |
| Declaration defects reported, not enforced | R-SIM-68, R-SIM-71 | `sim/netCompile.ts:509-510` `A defective declaration still applies where it can: the defects are reported, not enforced.` | matches |
| Initial value out of domain is reported and still applied | spec §3.2 | `sim/netCompile.ts:491` `defect('initial', ...)`; `:575` `values.set(decl.name, decl.initial);` | differs from spec §3.2 (A2) |
| Reset refused on incomplete roles | R-SIM-48, R-SIM-56 | `ui/simBridge.ts:707` `if (!stc) return { kind: 'refused', reason: 'The simulation roles are incomplete.' };` | matches |
| Roles: 28 ids in six groups | R-SIM-47, R-SIM-52 | `sim/roleCatalog.ts:24-25` `export const ROLE_IDS = [ 'node', 'initial', 'initialMarking', 'terminal', ...` | matches |
| Eight system profiles | R-SIM-47, R-SIM-54 | `sim/simProfiles.ts:36` `'petri', 'flowchart', 'stateMachine', 'extendedStateMachine', 'dfa', 'nfa', 'moore', 'mealy',` | matches |
| Profile constraints are identifiers only | R-SIM-49 | `sim/simProfiles.ts:12-13` `Constraints are identifiers only here; they become the rules of a generated validation viewpoint in a later lane (R-SIM-49).` | not implemented (A1) |
| Play stop order | R-SIM-100, R-SIM-101 | `ui/simBridge.ts:1550-1551` `if (status === 'Terminated' \|\| status === 'Deadlock' \|\| status === 'Halted') return { kind: 'stop', reason: status }; if (steps >= policy.k) return { kind: 'stop', reason: 'limit' };` | matches |
| Play policy default Ask, k = 100, max 1000 | R-SIM-100 | `ui/simRunState.ts:128` `export const DEFAULT_SIM_POLICY: SimPolicy = { choices: 'ask', k: 100 };` | matches |
| Kept configurations: last 1000 | R-SIM-106 | `ui/simRunState.ts:134` `export const SIM_KEEP_CONFIGS = 1000;` | matches |
| Reset and Stop always enabled | R-SIM-29, R-SIM-138 | `ui/SimulationPanel.tsx:1285` `<button type="button" className="sim-panel__btn" title="Reset" onClick={onReset}>` | matches R-SIM-29 as amended by R-SIM-138 (F10) |
| Watches level-triggered, read after the press | R-SIM-137 | `ui/simBridge.ts:1578-1580` `Never before the press, so the configuration Play starts from never stops it, and a breakpoint still true stops it again one step later (level-triggered).` | matches |
| A watch defect is never a run error | R-SIM-137 | `sim/watchEvaluator.ts:15-16` `A defect is shown on the watch, never a run error and never a hit.` | matches |
| Clock period 100..60000 ms, default 1000 | R-SIM-122 | `sim/boardCodec.ts:129-131` `CLOCK_PERIOD_MIN = 100; CLOCK_PERIOD_MAX = 60000; CLOCK_PERIOD_DEFAULT = 1000;` | matches |
| Idle clock tick is no step | R-SIM-136 | `ui/simBoardClock.ts:193` `// R-SIM-136: a tick nobody listens to equals no tick: nothing pressed, no step, counted idle.` | matches |
| Scenario `expect` stored and checked | R-SIM-139 | `sim/scenarioCodec.ts:72` `readonly expect?: string;` | matches; no UI sets it (A3) |
| No `.smv` exporter | spec §8, R-SIM-102 | `grep -rn 'MODULE main' frontend/src` empty; positive control `export function netRunStatus` found at `sim/netStep.ts:340` | not implemented (F11) |

## Roles and profiles as the code defines them

**Roles** (`sim/roleCatalog.ts:24-33`), 28 ids in six groups: general (node, initial, initialMarking,
terminal, accepting, activityFinal, bound), control flow (transition, ownedTransitions, source, nextState,
fork, join), Petri (arc, arcSource, arcTarget, arcWeight, inhibitorArc), events (trigger, event,
eventIdentifier), data (guard, action, entry, exit, stateAttributes), output (stateOutput,
transitionOutput). Guard, action, entry and exit are multi-valued (`:152,156,160,164`). Event has no key of
its own: it is derived from the declared type of Trigger (R-SIM-38).

**Profiles** (`sim/simProfiles.ts:35-37`, rows `:139-169`):

| Profile | Extra active roles | Constraints (declared only) |
|---|---|---|
| Petri net (P/T) | arcWeight, inhibitorArc, bound, terminal, guard | none |
| Flowchart / Activity | guard, terminal, activityFinal, fork, join, action, entry, stateAttributes | none |
| State machine | trigger, eventIdentifier, guard, terminal | singleToken |
| Extended state machine | trigger, eventIdentifier, guard, terminal, action, entry, exit, stateAttributes | singleToken |
| DFA | trigger, eventIdentifier, accepting (both required) | singleToken, noEpsilon, deterministic |
| NFA | trigger, eventIdentifier, accepting (both required) | singleToken |
| Moore machine | trigger, eventIdentifier, stateOutput (both required) | singleToken, noEpsilon, deterministic |
| Mealy machine | trigger, eventIdentifier, transitionOutput (both required) | singleToken, noEpsilon, deterministic |

Control-flow profiles derive Bound 1 and Initial marking "1 on Initial" (`:97-100`); the Petri group is off
with the reason "Compiled from control flow" (`:121`). The dialog's first-open picker lists only State
machine, Extended state machine, Flowchart and Petri net (`ui/SimRolesModal.tsx:115-122`); the other four are
reached through the header profile select.

**STC readiness** (`sim/netCompile.ts:85-115`): Petri needs node, transition, arc, arcSource, arcTarget,
initialMarking; control flow needs nextState, ownedTransitions or source, initial or initialMarking.

## The five run states

`Not started`, `Running`, `Terminated`, `Deadlock`, `Halted` (`sim/netTypes.ts:366`), computed by
`netRunStatus` (`sim/netStep.ts:340-351`) and shown by the panel through `runStatus`
(`ui/simBridge.ts:1404-1408`), which differs on inputs (A4).

## Defect codes

- Net (compile) defects: `no-target`, `no-source`, `not-a-place`, `pseudo-chain`, `pseudo-open`, `bad-arc`,
  `bad-weight`, `else-twice`, `else-position`, `initial-over-bound` (`sim/netTypes.ts:232-234`).
- Declaration defects: `key`, `record`, `initial`, `no-domain`, `bounds`, `reserved`, `metaclass`,
  `two-spaces`, `twice`, `exclusive`, `parse`, `subset`, `event`, `cycle`, `derived`, `input`
  (`sim/netTypes.ts:60-66`).
- Reset (compile) defect reasons shown in the panel: `parse-error`, `subset`, `undeclared`, `locality`,
  `double-assignment`, `declaration`, `read-only`, `unresolved`, `value`, `else-alone`, `event`,
  `event-feature` (`ui/simBridge.ts:400-401`).
- Guard outcomes: `parse-error`, `subset`, `no-handle`, `exception`, `absent-identifier`, `non-boolean`
  (`sim/guardEvaluator.ts:88-112`).
- Subset codes: errors `E-NODE`, `E-DATA`, `E-SHADOW`, `E-EAGER`, `E-NOELSE`, `E-FORALL`, `E-VALUE`,
  `E-WITH`, `E-CALL`; warnings `W-NULLCMP`, `W-TRUTHY`, `W-IS`; not-verifiable `T-DECIMAL`, `T-DIV`,
  `T-MOD`, `T-METHOD` (`sim/subsetChecker.ts:44-47`).
- Halt reasons: `unsafe`, `domain`, `double-assignment`, `action-defect`, `undeclared`, `derived`,
  `read-only` (`sim/netTypes.ts:343-353`).

## Conventions of docs/help/

The seven existing pages under `docs/help/{panels,reference,tutorials}/` have no frontmatter, an H1 title,
H2 sections, blockquote notes (`> More documentation coming soon.`) and kebab-case file names. No index file
exists in `docs/help/`, so no index line was added. The app's `HelpDrawer.tsx:8-11` fetches
`/docs/help/<path>` from `public/`, so nothing in the app reads `docs/help/` directly.

## Findings (divergences, recorded, not fixed)

- **F1.** Spec §7 still says "An event is admitted as input only in a stable configuration"
  (run-to-completion). R-SIM-20 removed it and the code has no stability check
  (`sim/netStep.ts:358-368`, `structuralInputs`). The spec header's amendment list omits R-SIM-20.
- **F2.** Spec §5.1 "Three roots: self, the state, the current event" and §9 step 2 are superseded by
  R-SIM-18: roots `self`, `event`, `model`, `node`, state through `.[x]` (`jjel/stateReserved.ts:18`).
- **F3.** Spec §5.3 says a double assignment is "reported at authoring time". The code reports it at Reset
  only when the targets fold (`ui/simBridge.ts:555-560`), otherwise halts at run time
  (`sim/netStep.ts:299-300`).
- **F4.** Spec §6 "explicit priority where declared" is not implemented. The policy is Ask or Random, on ε
  lists only (`ui/simBridge.ts:1547-1556`, R-SIM-101 A3).
- **F5.** Spec §5.4 and §9 speak of a subset checker "with receiver types". The checker is syntactic
  (`sim/subsetChecker.ts:27-35`).
- **F6.** Spec §3.2 "bounded integer 0..n": the code's range is any integers min..max (`sim/netTypes.ts:29`,
  `sim/netStep.ts:231`).
- **F7.** Spec §3.3 laws are not implemented; the spec itself was amended "Laws stay out of step 3". See A1.
- **F8.** Stale code comments say "Not wired yet" (`sim/netTypes.ts:4-6`, `sim/netStep.ts:23`,
  `sim/guardEvaluator.ts:21`). The core is wired by `startRun` (`ui/simBridge.ts:698-768`). Comment only.
- **F9.** A2, A3, A4 below.
- **F10.** R-SIM-29 says the panel disables all buttons in Terminated, Deadlock and Halted. Reset and Stop are
  always on (`ui/SimulationPanel.tsx:1285,1317`) and Step back is on after step 1 in any status (`:1292`),
  as the later R-SIM-138 states. Matches as amended.
- **F11.** No `.smv` exporter: `grep -rn 'MODULE main'` over `frontend/src` is empty, with the positive
  control above. The files mentioning smv render nuXmv-style lines in the UI or emit subset diagnostics.
- **F12.** No R-SIM row sits in `## Superate` (`docs/decisions.md:6312-6331`): supersessions are inline
  amendments. R-SIM-9 by 28; R-SIM-12 and R-SIM-16 on the M2 side by 38; R-SIM-14's `state` root by 18;
  R-SIM-35 by 100 and 101; R-SIM-58's example by 96; R-SIM-82's marking line by 104; R-SIM-92's Output line
  by 104; R-SIM-97's gate by 99 (the `simEnabled` toggle, not the Semantic type select); R-SIM-122(3) by 136;
  R-SIM-140's Clear by 146(5); R-SIM-126's Pulse LED colour by 131; R-SIM-31(1) else-alone by 87; R-SIM-54's
  Petri Guard row amended 2026-09-27; R-SIM-63's halt slot two lines. The pages document only the amended
  forms.

## Decisions taken (unattended)

1. **Page format.** Starlight frontmatter (`title`, `description`, `sidebar.order`: guide 1, semantics 2), no
   H1 because Starlight renders the title, H2 and H3 only, admonitions as plain blockquotes with a bold lead.
   This departs from the H1 of the existing pages so that the pages can move to the jjodel-docs site
   unchanged, as the prompt asks; the blockquote keeps the existing `>` convention. Directory
   `docs/help/simulation/`.
2. **Screenshot placeholders.** The prompt's placeholder form `<!-- TODO: screenshot — ... -->` contains an em
   dash. The guide uses it verbatim, as P-2026-10-20-0035 allows ("no em dashes except inside the standard
   TODO screenshot placeholder"). The rest of both pages has none.
3. **Worked example.** A vending machine on the Extended state machine profile, because the State machine
   profile has no state attributes. `insert_coin(amount)` becomes three Event instances `coin10`, `coin20`,
   `coin50` of one Event class with an `amount` attribute, as in the R-SIM-144 memo
   (`claude_2026-10-10_memo_proposta_event_attributes.md:12,20-23`): free parameters are not supported.
4. **Watch and watches.** The compact panel's "Watch" rows are pinned attributes (R-SIM-104); the watches of
   R-SIM-137 are called "Invariants and breakpoints" in the UI (`ui/SimInspector.tsx:29-30`). The guide uses
   the UI words and keeps the two apart.
5. **R-SIM-145.** Not documented as current. The semantics page states today's behaviour (a guard defect
   removes its transition) and names R-SIM-145 as reserved.
6. **The four items below** are documented as the code behaves, per the project chat's decisions A1 to A4
   recorded in P-2026-10-20-0035.
7. **Lane inbox.** `docs/log-inbox/simulation.md`.

## Decisions awaiting Alfonso

- **A1. Profile constraints are declared, never enforced.** `singleToken`, `noEpsilon` and `deterministic`
  (`sim/simProfiles.ts:21`) are only validated as known strings (`sim/profileCodec.ts:20,92`). A DFA's
  determinism is not checked. The pages say so. Recommended: open the R-SIM-49 validation-viewpoint lane.
- **A2. An initial value outside its domain still applies.** `compileNet` reports the declaration defect
  `initial` (`sim/netCompile.ts:490-491`) and sets the value anyway (`:571-575`); spec §3.2 says a value
  outside the domain is "never a state that propagates". The pages document the code. Decision owed: should
  Reset refuse the run instead? Recommended: decide it in a decisions lane, since the spec and the code
  disagree.
- **A3. A scenario's `expect` has no UI.** The codec carries `expect?` (`sim/scenarioCodec.ts:69-73`) and
  replay checks it (`ui/simScenarios.ts:24-26,143-152`), but `recordScenario` never sets it and no control
  edits it. The guide says "not settable from the UI today". Recommended: a small UI lane, or leave it.
- **A4. The panel status differs from R-SIM-29 on inputs.** `runStatus` turns a core `Deadlock` into
  `Running` when some press would ask an input (`ui/simBridge.ts:1399-1408`), as R-SIM-88 justifies but
  R-SIM-29 does not say. The pages document the panel behaviour. Recommended: add one amendment line to
  R-SIM-29 in a decisions lane; this lane does not write it.
