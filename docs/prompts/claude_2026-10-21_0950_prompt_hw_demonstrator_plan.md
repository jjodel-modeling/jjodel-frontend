# Hardware notation demonstrator: plan of the example project (discovery)

Prompt-ID: P-2026-10-21-0950
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (new example project spanning metamodel, viewpoints, simulation roles, JjTL and code generation; Phase 1 read-only)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-0855
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, cut from `alfonso-frontend-jjtl` at the commit that adds this prompt.
Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at the end.
Heavy tier (RC-16), effort `xhigh`. Phase 1 only: it ends with a hard stop on the report; no product code is edited.

## Lane discipline

Every reply opens with `[P-2026-10-21-0950 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Four sessions of this front hit the AM-8
ceiling: use Explore subagents for wide reading, read only the functions you cite, send command output to files and
read their tails, and write the report in sections as you go so a ceiling stop never loses it.

## Context

The front `hw-notation` builds a demonstrator for an industrial research partner: a hardware design notation in
Jjodel whose models are simulated cycle by cycle and turned into Verilog, with Verilator as the external oracle. Since
2026-10-20 the trunk has everything underneath: bit-vector values in JjEL (R-BV-1..6), `word` domains in the simulator
with widths read per element (R-BV-7, R-BV-8), bit-vectors in code generation (R-BV-9), the operator oracle against
Verilator 5.052 (R-BV-10, `npm run oracle:bv`), and Verilator installed on this machine. What is missing is the
demonstrator project itself. This discovery plans it; the slices that follow build it.

The partner's principal engineer, new to metamodeling, drew a first metamodel in Jjodel. It is a metamodel of
Verilog 2001 syntax, not of a design: `Module` (name, `portNames: EString[0..*]`) contains `items: ModuleItem[0..*]`;
`ModuleItem` (abstract) has subclasses `ParameterDeclaration` (kind: ParamKind PARAMETER|LOCALPARAM, dataType: EString,
`parameterPorts`/`assignments` to `ParamAssignment` name, dataType, value: EString), `AlwaysConstruct` (kind: AlwaysKind
ALWAYS_COMB|ALWAYS_LATCH|ALWAYS_FF|ALWAYS, bodyText: EString, `eventControl` 0..1 to `EventControl` wildcard: EBool,
`terms` to `EventTerm` edge: EdgeKind NONE|POSEDGE|NEGEDGE, signal: EString), `PortDeclaration` (direction:
PortDirection INPUT|OUTPUT|INOUT, netType: NetOrVarType WIRE|REG|LOGIC, signed: EBool, names: EString[1..*],
`packedDimensions` to `Range` msb, lsb: EString), `NetDeclaration` (netType, signed, `variables` to `VarDeclId` name,
initializer: EString, with packed and unpacked `Range`s), `FunctionDeclaration` (name, automatic: EBool, bodyText:
EString, `ports` to `TfPort` direction, netType, names), `ModuleInstantiation` (moduleName: EString,
`parameterOverrides` to `ParamOverride` name, value; `instances` to `Instance` name, `connections` to `PortConnection`
port, expression: EString), `ContinuousAssign` (`assignments` to `Assignment` lvalue, expression: EString),
`GenerateConstruct` (`loops` to `LoopGenerate` init, condition, step; `ConditionalGenerate` condition, then/else
`GenerateBlock` label, with nested items), `GenvarDeclaration` (names). Behaviour lives in strings and every reference
is a name. The chat's plan is to use it as the **target** of the demonstrator, not as its notation, with references
made into references.

## Decisions taken by the chat (provisional, unattended; the discovery confirms or refutes each with evidence)

- D1. **Two metamodels in one project.** A design notation `HwDesign` (source) and the partner's Verilog metamodel
  `VerilogAst` (target), joined by a JjTL transformation `hw_to_verilog`, and Verilog text emitted by R-GEN templates
  from `VerilogAst`. If one project cannot hold two metamodels and a transformation between them, say what the
  codegen examples and JjTL do instead.
- D2. **`HwDesign` has three views:** ISA (instruction formats, fields with bit ranges, opcodes), datapath (components
  with typed ports of a declared width, wires between ports), control (an FSM whose states assert control signals,
  transitions guarded by opcode or flags). The control FSM simulates with the existing state-machine roles (STC);
  registers are stored attributes with a `word` domain whose width feature is the port or register `width`.
- D3. **`VerilogAst` changes are minimal and motivated one by one**: `PortConnection.port`,
  `ModuleInstantiation.moduleName` and `EventTerm.signal` become references; `Module.portNames` is removed (derivable);
  expressions stay strings because the transformation generates them. Each change goes in the report with its reason,
  for the engineer to read.
- D4. **The example design is an 8-bit multicycle CPU** with about ten instructions (load, store, add, sub, and,
  branch on zero, jump, load immediate, nop, halt), an accumulator or a four-register file, an ALU, a program
  counter, an instruction register and a memory, and a control FSM of about ten states. Small enough to read in two
  pages of Verilog; real enough for a hardware engineer.
- D5. **The end-to-end check:** the same program runs in the Jjodel simulator and, as generated Verilog with a
  generated testbench, in Verilator; a script compares the per-cycle register traces. It reuses the structure of
  `frontend/scripts/oracle/bv-verilator.mjs`.

## COSA

Answer, each with `file:line` and verbatim quotes, measured where possible:

1. How the existing examples are built and shipped: `frontend/src/codegen/examples/turnstile/` and
   `petri-producer-consumer/` (hand-written JSON or generated, by which script; how metamodel, model, viewpoints,
   simulation roles and templates are stored; how the app loads them), the gallery build (`build-gallery.ts`) and the
   UML fixture script `frontend/scripts/probe/uml-class-object-fixture.ts`. Recommend the cheapest reliable way to
   produce the demonstrator project as a committed, reproducible artifact (a build script is preferred to a hand-edited
   export).
2. D1: whether one project holds two metamodels, a model of each, a JjTL transformation between them and templates on
   the target; how JjTL is run on a project today (UI and API); whether JjTL can create references between target
   objects (needed for D3) and how traces are kept.
3. D2: what the simulator needs for a CPU: stored `word` attributes per component, actions that read wires as derived
   attributes, the control FSM driving datapath registers on a clock event. Write the smallest model fragment
   (register, ALU, mux, one control state) as it would be declared, and say which part the simulator cannot express
   today (for example memory as an array, a register file indexed by a field), with the smallest workaround.
4. D3: confirm or refute each metamodel change from the actual JjTL and template capabilities.
5. The code generation path: how an R-GEN template on `VerilogAst` emits text, how bit-vector constants print
   (`toVerilog`), how a testbench template would read the program and the expected trace; what the JS target needs to
   run the same CPU for the R-GEN-8 oracle, if anything.
6. D5: the trace format both sides can print per cycle, and the comparison script's inputs and outputs.
7. Risks for a live demonstration: performance on a model of this size, known canvas bugs on graphVertex or ports
   (`portDistribution`, handles), and anything in the critical zone the build would touch.

Then propose the slices (each with its files, tests, gates and an estimate of whether it fits one session under the
200k ceiling): for example S-A metamodel `HwDesign` with viewpoints and the CPU model, S-B simulation roles and a
running program, S-C `VerilogAst` revised plus JjTL `hw_to_verilog`, S-D Verilog templates and testbench, S-E trace
comparison with Verilator, S-F a one-page README of the demonstrator for the engineer.

## DOVE

Read anything. Write only `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` (mandatory: hypothesis
falsified, objective, files read with full paths, findings with `file:line` and quotes, one verdict per decision D1..D5
(confirmed, amended with the amendment written out, or refuted with evidence), the slice plan, risks, open questions,
and the closing «Decisions taken (unattended)» and «Decisions awaiting Alfonso» of RC-26). Scratch probes under
`frontend/.vite-cache/` (gitignored), not committed.

## COME

Baseline typecheck (expected 0). Answer by reading and small probes, never by editing product code. Commit the report
in one `docs:` commit (`git add` by path, `Model:` trailer), then hard stop. Do not name the industrial partner in any
file: the repository is public; call it «an industrial research partner».

## RIFERIMENTI

`docs/decisions.md` sections `## R-BV`, `## R-GEN`, `## R-SIM` (roles, R-SIM-16..20), `## R-LIB`;
`docs/discovery/discovery_2026-10-20_jjel_bitvector.md`; `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`;
`docs/spec/claude_spec_2026-09-13_computational_model.md`; `docs/jjtl/DEVELOPMENT-PLAN.md`; `frontend/src/jjel/SPEC.md` §7.5.
