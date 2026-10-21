# HW CPU: an 8-bit CPU as a Jjodel model, simulated, printed as Verilog, checked by Verilator

This example describes a small CPU as a model. Jjodel runs the model cycle by cycle, prints it as Verilog, and
Verilator runs the Verilog. The two runs print the same trace, cycle for cycle. You need no metamodeling background:
the metamodel plays the role of a schema for your design, and the model is the design.

First version, written before model checking (slice S-H) exists. Commands run from `frontend/`.

## The notation

The metamodel is `HwDesign`. Its classes:

| Concern | Classes |
|---|---|
| Instruction set | `Format`, `Field`, `Instruction` |
| Datapath | `Component` (abstract), `Register`, `Alu`, `Mux`, `Memory`, `Cell`, `Port`, `Wire` |
| Control | `State`, `InitialState`, `FinalState`, `Transition` |

The model `cpu` is one design seen through three viewpoints. Each one draws its own classes and hides the others:

- **ISA**: the format `oooo aaaa` (opcode in bits 7..4, operand in bits 3..0) and the ten instructions. Active when
  you open the project.
- **Datapath**: the registers, the ALU, the two muxes, the ROM and the RAM, their ports and the wires between them.
- **Control**: the finite-state machine that sequences the datapath.

The metamodel is bound to the **Extended state machine** profile. Each `Register` and each `Cell` carries a stored
word `value`, as wide as the element's own `width`. One control state is one clock cycle. A state's **exit actions**
are the register transfers of that cycle. All right-hand sides read the values before the clock edge, as in an
`always @(posedge clk)` block. A transition's guard tests the opcode and picks the next state.

## The CPU

An accumulator machine, Harvard style: 16 ROM cells hold the program, 16 RAM cells hold the data, 8 bits each.
Registers: `PC` (4 bits), `IR` (8), `ACC` (8), `Z` (1).

| Opcode | Instruction | Effect (`a` = operand) |
|---|---|---|
| 0 | `NOP` | nothing |
| 1 | `LDA a` | `ACC := RAM[a]`, sets `Z` |
| 2 | `STA a` | `RAM[a] := ACC` |
| 3 | `ADD a` | `ACC := ACC + RAM[a]`, sets `Z` |
| 4 | `SUB a` | `ACC := ACC - RAM[a]`, sets `Z` |
| 5 | `AND a` | `ACC := ACC and RAM[a]`, sets `Z` |
| 6 | `LDI a` | `ACC := a` (zero-extended), sets `Z` |
| 7 | `JZ a` | `PC := a` if `Z` is 1 |
| 8 | `JMP a` | `PC := a` |
| F | `HLT` | stop |

The control has eleven states: `FETCH` (initial: `IR := ROM[PC]`, `PC := PC + 1`), `DECODE` (no transfer), one
`EX_<op>` state per instruction that does work, and `HALT` (final). An instruction takes three cycles; `NOP` takes
two. The six undefined opcodes 9 to E leave `DECODE` by its `else` transition back to `FETCH`, so they act as `NOP`.

The program multiplies 7 by 6 by repeated addition and leaves the product in `RAM[12]`:

| Addr | Byte | Instruction | Meaning |
|---|---|---|---|
| 0, 1 | `61 2f` | `LDI 1`, `STA 15` | `RAM[15] := 1` |
| 2, 3 | `66 2e` | `LDI 6`, `STA 14` | counter `RAM[14] := 6` |
| 4, 5 | `67 2d` | `LDI 7`, `STA 13` | addend `RAM[13] := 7` |
| 6, 7 | `1e 7e` | `LDA 14`, `JZ 14` | loop: stop when the counter is 0 |
| 8, 9 | `4f 2e` | `SUB 15`, `STA 14` | counter minus 1 |
| 10 to 12 | `1c 3d 2c` | `LDA 12`, `ADD 13`, `STA 12` | product plus 7 |
| 13 | `86` | `JMP 6` | next turn |
| 14 | `f0` | `HLT` | |

At `HALT`, after 170 cycles, `RAM[12]` is `2a` (42), `RAM[13]` is `07`, `RAM[14]` is `00`, `RAM[15]` is `01`.

## Open and run it in Jjodel

1. **Import.** The file is `frontend/public/examples/hw/hw-cpu.jjodel` (the app serves it at
   `/examples/hw/hw-cpu.jjodel`). On the Projects page press **Import**, or use **File → Import Project**. The project
   appears as **HW CPU copy**.
2. **Open the model** `cpu`. Pick the viewpoint from the toolbar. After a switch, close the model's tab and reopen it
   (see the limits below).
3. **Run.** Open the **Simulation** panel, press **Reset**, then **Play**. Play steps until `HALT` (at most 1000
   steps).
4. **Read the result.** The model stores the run as the scenario **Multiply 7 by 6 into RAM[12]**. Its final
   condition, `ram_12.[value] == bits(8, '0x2a')`, holds at `HALT`. You can type the same text as a watch.

The same run is checked headless, without the browser, by `src/codegen/examples/hw-cpu/__tests__/hw-cpu.run.test.ts`.

## The trace

`hw-cpu.trace.json` holds the run, one line per cycle, `<cycle> <state> <PC> <IR> <ACC> <Z>`:

- `cycle` in decimal. Line 0 is the configuration Reset gives; line *k* is the state after *k* rising edges.
- `state` in decimal, the index in the file's `states` list: `FETCH` is 0, `DECODE` 1, `EX_LDA` 2 ... `HALT` 10.
- `PC`, `IR`, `ACC` in hex, no width prefix. `Z` in binary.

So `1 1 1 61 00 0` reads: after cycle 1 the CPU is in `DECODE`, `PC` is 1, `IR` holds `61` (`LDI 1`), `ACC` is 0.
The last line is `170 10 f f0 00 1`. The RAM is not in the trace.

## Generate the Verilog

The templates live in the model's metamodel, on the Verilog target. Two entries: `cpu` gives `expected/cpu.v`, the
module (`clk` in; `state`, `pc`, `ir`, `acc`, `z` out; the ROM filled from the program), and `tb` gives
`expected/tb.v`, the testbench. The testbench samples at the falling edge, prints the trace line with
`$display("%0d %0d %h %h %h %b", ...)`, and stops at `HALT` or at cycle 1000.

In the app: turn on the Code panel once (Settings → **Advanced** → **Experimental** → **Code generation**), press
**Code** in the model's editor, open **Output**, choose the entry `cpu` or `tb`, press **Generate**. Do not press
**Run** or **Check** on these entries: they run the text as JavaScript (open ticket).

Headless, the test compares the generated text with the committed files; `HW_CPU_WRITE=1` rewrites them:

```sh
npm run test -- src/codegen/examples/hw-cpu
```

## Check it against Verilator

```sh
npm run oracle:hw
```

You need `verilator` on your `PATH` (measured with 5.052). The script builds and runs `cpu.v` and `tb.v`, compares
each line with `hw-cpu.trace.json`, and writes `hw-cpu.verilator.trace`. On a mismatch it exits 1 and names the first
cycle and register that differ. The last run: 171 lines, 171 agree. The normal suite reads the committed Verilator
trace without Verilator. Its header holds the sha256 of `cpu.v` and `tb.v`, so editing either file without a new
`npm run oracle:hw` fails the suite.

## The `.smv` export (nuXmv input)

`src/model/simulation/smvExport.ts` turns the control and the stored words into one nuXmv module: `VAR state` over
the eleven states, one `unsigned word[N]` per register and cell, an enabling `DEFINE en_<t>` per transition, the
transfers as `next(x) := case ... esac`. It has no command in the app yet. The committed exports are
`src/model/simulation/__tests__/fixtures/hw-cpu.smv` and `hw-cpu-free-rom.smv` (`SMV_WRITE=1` on
`smvExport.test.ts` rewrites them). In the free-ROM variant each ROM byte is a `FROZENVAR`, so a property covers
every program.

The exporter writes the structural properties from the model; nobody writes them by hand:

- `no_deadlock`, `final_quiescent`, and `live_<state>` for each state that is not final;
- `returns_FETCH`: `G F (state = FETCH | final)`;
- `single_write_<t>`: a transition writes each register or cell at most once;
- `no_choice_<t>_<u>`: no two transitions out of `DECODE` enabled together;
- `in_range_...`: every memory address hits a cell.

The exporter proves some of them itself and says so in a comment on the line. The test evaluates every `INVARSPEC` on
each of the 170 cycles of the simulator's run. That is testing, not model checking.

**Model checking with nuXmv is planned (slice S-H), not done.** `npm run mc:hw` does not exist yet, and nuXmv is not
installed. S-H adds the run script and two domain properties: `PC` is constant after `HALT`, and the program halts
with its result.

## Write every constant as a string

In an action or a guard, write `bits(8, '0xff')`, never `0xff`. A bare hex literal is a parse error in an action and
silently becomes 0 elsewhere. The model follows this everywhere: guards read `bits(4, '0x2')`, and the ROM cells
store their bytes as strings (`init: '0x61'`).

## What is not covered

- **No arrays.** Memory is one `Cell` element per word.
- **No initial values from the model for stored words.** Hence the Harvard split: the ROM reads the frozen `init`
  string, and the RAM starts at 0.
- **No derived words.** A wire or an ALU output cannot be a named derived value. The expression is written inline
  in the exit action and repeated where two transfers need it: each `Z` transfer repeats the ALU expression.
- **The datapath is documentation.** The simulator and the Verilog read the control's transfers, not the ports and
  wires. Nothing checks that they agree.
- **One route only.** The Verilog comes from templates on `HwDesign`. The route through a Verilog metamodel and a
  transformation is planned, not built.
- **Open tickets you can hit in a demo:**
  - A viewpoint switch keeps the previous viewpoint's positions until you close and reopen the model's tab.
  - **Run** and **Check** in the Code panel treat a Verilog entry as JavaScript.
  - In Control, the guard labels of `dec_NOP` (`0x0`) and `dec_else` overlap.
  - If more than four transition ends share one side of a state, the extra transitions are not drawn. The shipped
    layout stays within four; moving states can break it.

The project file is built by `frontend/scripts/examples/build-hw-cpu.ts` from `hw-cpu.json`. Do not edit it by hand.
