# Design input: "Simulation roles" modal (Claude Design, 2026-09-25)

Status: design input only, not a prompt to execute. Produced by Alfonso with Claude Design to reduce
the cognitive load of the Simulation modal. Only the UI part is authoritative; the semantic model,
the SMV generator and the deliverables below were placeholders. Reconciliation with R-SIM-1..46:
`docs/ratifiche/claude_2026-09-25_1759_memo_simulation_roles_profiles.md`.

---

## Task: implement the "Simulation roles" modal (light version) in Jjodel

### Context
Jjodel is a web-based MDE platform (React + TypeScript). There is an existing
"Simulation" modal that binds simulation roles to elements of the current
metamodel through a long flat form of ~20 selects. Replace it with the design below.
First, read the existing modal, the metamodel API (classes, attributes, references,
multiplicities, supertypes) and the design tokens in `src/styles/tokens/`.
Use the existing Button, IconButton, Badge, Input and EntityBadge components and
Bootstrap Icons. No new colors: slate neutrals, entity palette for type badges,
semantic amber/green only for warnings/ok, sky #0ea5e9 for focus rings.

### Semantic model (implement as pure TS, separate from UI)
One semantic core: bounded P/T Petri nets. Every preset is a restriction of it.
Preset tree:
- pn: Petri net (P/T)
  - sm: State machine (1-safe; arcs derived from references)
    - Acceptor: dfa, nfa     (use Terminal = accepting)
    - Transducer: moore, mealy (use Output)

Role groups and roles (expected kind in brackets):
- General: Node [class], Initial [class], Initial marking [attr], Terminal [class],
  Bound [int], Transition [class], Guard [attr]
- Control flow: Owned transitions [ref], Source [ref], Next state [ref], Fork [class], Join [class]
- Petri net: Arc [class], Arc source [ref], Arc target [ref], Arc weight [attr], Inhibitor arc [class]
- Events: Event [class], Trigger [ref], Event identifier [attr]
- Output: State output [attr], Transition output [attr]

Each role, for the chosen preset, has a mode: `edit | derived | off`.
- pn: Control flow roles off ("Replaced by explicit arcs"; Fork/Join: "Transition with several output/input arcs"); Output off.
- Every non-pn preset: Bound=1 (fixed), Initial marking="1 on Initial", Arc=implicit,
  Arc source ← Owned transitions, Arc target ← Next state, Arc weight=1 are all derived; Inhibitor arc off.
- dfa/nfa/moore/mealy: Guard, Fork, Join off.
- moore: State output edit, Transition output off, Terminal off.
- mealy: Transition output edit, State output off.
- sm, dfa, nfa: Output off.

Required roles (they drive "checkable"):
- pn: Node, Transition, Arc, Arc source, Arc target, Bound
- sm: Node, Initial, Transition, Owned transitions, Next state
- dfa/nfa: sm + Terminal, Event, Trigger
- moore: sm + State output
- mealy: sm + Event, Trigger, Transition output

Compatibility check per binding (type + owner + multiplicity, supertypes allowed with a warning):
- ok | warn(reason) | incompatible(reason).
- Example: in a DFA, Next state requires a reference Transition → State with multiplicity 0..1.
  A 0..* reference is a warn "Several successors: NFA only" (ok under nfa).
  A reference to a supertype of State is a warn "Supertype of State: filters to State".
- Also: NFA simulation mode `allBranches | askUser` (simulation only).

SMV generator for nuXmv (pure function: preset + bindings → lines with a
`-- role: binding` comment and a warn flag):
- Automata/SM: enum `state`, IVAR `event`, INIT from Initial, ASSIGN next(state) via case
  (NFA: set-valued successors), DEFINE accept/terminal or out (Moore on state, Mealy on state & event).
- Petri net: `m : array 0..N of 0..Bound`, IVAR `fire`, enabling DEFINEs, TRANS with
  token consumption/production using weights, inhibitor arcs.
- Checkable = all required roles bound; "with warnings" if any warn; otherwise "Not checkable" listing the missing roles.

### UI
Step 1: first open, when no preset is stored:
- Question "What kind of model is this?" with 3 cards: Automaton (chips DFA/NFA/Moore/Mealy),
  State machine, Petri net. Footer: preset description · Cancel · Continue.

Step 2: main modal, 640px wide:
- Header: "Simulation roles", then a compact preset dropdown ("DFA · Acceptor ▾", tree menu
  with non-selectable Acceptor/Transducer headings), then the checkable Badge
  (success / warning), an "SMV" toggle button and a close IconButton.
- A line "N of M roles matched by name · Undo". On first open, auto-run match-by-name
  and bind only compatible candidates.
- "Required (n)": always visible. Each row: label (150px) · EntityBadge of the expected kind
  (type name in a tooltip) · binding field. The field shows the value in IBM Plex Mono and, on the right,
  ⚠ only when warn, plus a chevron. Tooltip = compatibility reason.
- "Optional (n)": collapsed by default.
- A final collapsed row "X derived by <preset> · Y not used" with a lock icon. When expanded,
  compact list: derived → mono value · note; off → grey label · reason.
- Binding dropdown: filter input, "Compatible · Owner → Target" candidates
  (path in mono, "Type [mult]" on the right, ⚠ with reason when warn, ✓ on the selected one),
  a note "N incompatible hidden", and "Expression…" (path/OCL; stub OK).
- SMV toggle: widens the modal to 1000px and adds a 340px right panel (SMV preview, read-only,
  mono 11.5px, amber background on warn/unbound lines, Copy and Export .smv buttons).
- Footer: left Reset · Match by name · "…" menu (Generate validation viewpoint);
  right Cancel (secondary) · Apply (primary).

### Behaviour
- Changing preset re-evaluates modes, required roles, compatibility and SMV without losing bindings.
- Apply persists preset + bindings (+ NFA mode) on the metamodel.
  Cancel discards. Reset clears the bindings.
- Keyboard: dropdowns navigable with arrows/Enter/Esc; focus ring as in the design tokens.

### Deliverables
1. `simulation/semantics.ts`: presets, modes, required roles, compatibility check.
2. `simulation/smv.ts`: SMV generator.
3. Unit tests for both (mode table per preset, the compatibility cases above,
   SMV snapshot per preset).
4. The UI components, which replace the old modal.

Ask me before changing the persistence format of existing projects.
