# Simulation and semantics documentation

Prompt-ID: P-2026-10-20-0015
Chat: C-2026-10-20-0004
Front: simulator
Lane: full (more than three files; synthesis across spec, decisions and code)
Depends: none
Request: none (typed in the project chat; Alfonso's words kept locally in request.md)
Status: eseguito 2026-10-20 · lane sim-docs · 45b575dcf

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: the two-phase hard stop (P4/P16) does not apply: the lane writes documentation only, on its own branch, and the discovery report below is still mandatory and comes first (motive: no code, no persisted data, fully reversible before merge).

Worktree: `~/jjodel-w-simdocs`, branch `sim-docs`, cut from trunk `425187033`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-20-0015 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi)

The simulator has grown from 2026-09-13 to 2026-10-10 through about 146 R-SIM rows, one normative spec and many lanes, but it has no documentation for its users. Alfonso needs two documents: a user guide that tells a modeller how to make a metamodel simulable and how to run a model, and a semantics reference that states precisely what a step does. The MDE lecture at the end of October and the SoSyM/TOSEM work on STC both depend on a written account that matches the code on the trunk today.

Sources, in order of authority for what the simulator does NOW:
1. the code: `frontend/src/model/simulation/` (pure core) and `frontend/src/components/editor-v2/sim/` (panel, I/O board, roles modal);
2. `docs/decisions.md`, series R-SIM (including the **Superate** section: a superseded row must not be documented as current);
3. `docs/spec/claude_spec_2026-09-13_computational_model.md` and its amendments by R-SIM rows;
4. ratification memos in `docs/ratifiche/` whose slug mentions sim, petri, event, board, clock, watch, coverage, scenario, roles.

Where 2-4 disagree with 1, the code wins, and the disagreement goes into the report as a finding (not silently fixed in the docs).

## COSA

### Step 1: discovery report (first, mandatory)
Write `docs/discovery/discovery_2026-10-20_sim_semantics_docs.md` with, per P4: the hypothesis being tested ("the spec plus the R-SIM rows describe the trunk behaviour"), files read with full paths, then a **claim table**: one row per behaviour the docs will state, with the source row (R-SIM-n or spec §), the code evidence (`file:line`, verbatim excerpt of at most two lines), and a verdict (matches / differs / not implemented). Also: the current set of roles and profiles as the code defines them, the five run states, the defect codes the compiler emits, and the existing conventions of `docs/help/` (frontmatter, headings, admonitions, file naming). Close with "Decisions taken (unattended)" and "Decisions awaiting Alfonso".

### Step 2: the two documents
In `docs/help/simulation/` (create it if missing; follow the conventions found in `docs/help/`, otherwise Starlight frontmatter `title`, `description`, `sidebar.order`, so the pages can move to the jjodel-docs site unchanged):

1. `simulation-guide.md`, user guide. From an empty metamodel to a running model: what a simulation type class (STC) is, the Simulation roles modal and its profiles (flowchart/activity, state machine, DFA/NFA, Moore/Mealy, Petri net and the others the code defines), events and triggers, guards and actions (`Expression`, `Action`, `:=`), state attributes (`.[x]`, `node.[x]`, model-level state), the simulation panel on a model (Reset, step, Play, Choices Ask/Random, step back, slider, trace), the five run states and what each button does in them, the I/O board and front panel (devices, Clock), watches, scenarios, coverage. Each section: what it is, how you use it, its limits. One worked example carried through the page (a small state machine with one event attribute, e.g. a vending machine with `insert_coin(amount)`), described in prose and steps, not screenshots: use `<!-- TODO: screenshot — <description> -->` placeholders where an image would help.

2. `simulation-semantics.md`, semantics reference. Configuration (M fixed, state σ, event); marking with domain 0..k and `simBound`, the "unsafe" halt; the Petri core (transitions with weighted preset and postset), and how flowcharts, statecharts, fork/join, decision blocks with `else`, inhibitors compile onto it; enabledness, the step with its two inputs (event, selector) and the progress constraint; discard and quiescence; guards (read-only JjEL subset, absent guard = true, `event.a`) and actions (parallel assignment on the previous state, atomic, double assignment as defect); state attribute domains (boolean, enum, range only); termination, deadlock and halt; what is excluded by construction (time and do-activity, dynamic structure, true concurrency, deferral; the Clock is an environment device, not model time); the nuXmv vocabulary mapping (FROZENVAR/VAR/IVAR/DEFINE/TRANS/ASSIGN) as a table, stating plainly that the .smv exporter is not implemented. Each normative statement cites its R-SIM row in parentheses so a reader can trace it.

Both pages in English, following the project writing rules: no em dashes, no filler openings, active voice, short paragraphs, at most two admonitions per page, no H4. State limits and unimplemented parts as such. R-SIM-145 is reserved and not ratified: do not document the "guard error halts the run" rule as current; describe today's behaviour from the code.

### Step 3: index and closure
Add one line per page to `docs/help/` index if one exists. Log entry in `docs/log-inbox/<lane>.md` (P9), Status flip, one docs commit with explicit pathspec. No visual check is due: close in the same session and exit with `Outcome: done`.

## HARD STOP
- A claim the docs need cannot be settled from code or decisions: write it as a "Decisions awaiting Alfonso" item with a recommendation, document the code behaviour, keep going. Stop only if more than five such items accumulate.
- Any need to touch a file outside `docs/`: stop.

## NON FARE
- No change to code, tests, `docs/decisions.md`, the spec or any memo. Found divergences go to the report only.
- No document under `docs/spec/` and no new R- row.
- No content copied from the SoSyM draft or anything outside the repo.
- No push.

## RIFERIMENTI
- `docs/spec/claude_spec_2026-09-13_computational_model.md`
- `docs/decisions.md` (R-SIM series and Superate)
- `docs/ratifiche/claude_2026-10-10_memo_proposta_event_attributes.md`
- `frontend/src/model/simulation/`, `frontend/src/components/editor-v2/sim/`
- `CLAUDE.md` §21.2 (log entry format), `docs/HARNESS-DOCS.md` §4.2 (discovery report)
