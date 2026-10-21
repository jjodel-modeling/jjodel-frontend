# Hardware demonstrator S-F: the one-page README for the engineer, first version (docs)

Prompt-ID: P-2026-10-21-1821
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: fast (one new Markdown file)
Status: eseguito 2026-10-21 · lane fast · c46e71b53 · verifica visiva non applicabile (docs only)
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1430
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwreadme`, branch `hw-readme`, cut from `hw-demo` at the commit that adds this prompt; it merges back into `hw-demo`.
Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at the
end. Effort `high`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1821 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 40 minutes. Read only the files named below and the
functions you edit; send command output to files and read their tails. Commit as soon as the gates are green.

## COSA

Write slice **S-F** as the plan states it (`docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` §10.1, entry
«S-F — a one-page README for the engineer»), as a **first version** written before S-H: one page, in English,
`frontend/src/codegen/examples/hw-cpu/README.md`. The reader is a hardware design engineer new to metamodeling.

Cover, each from the committed files (read them, do not guess): what the notation is (the `HwDesign` metamodel and its
three viewpoints ISA, Datapath, Control); the CPU (8-bit accumulator, ten instructions, eleven control states,
Harvard ROM/RAM) and the program in ROM (7 × 6 into RAM[12]); how to open the project in Jjodel
(`frontend/public/examples/hw/hw-cpu.jjodel`), run the program with Play and read the result and the trace
(`hw-cpu.trace.json`, its line format); how the Verilog is generated (`expected/cpu.v`, `expected/tb.v`) and checked
against Verilator with `npm run oracle:hw`; the `.smv` export and the structural properties it generates (S-G1, S-G2),
with **model checking with nuXmv marked as planned** (`npm run mc:hw` does not exist yet); the hex-as-string rule (R6);
what is not covered (plan §5.3 limits, the derived-word limit, the open tickets that a demo shows: the live viewpoint
switch keeps old positions until the model tab is reopened).

Writing rules (CLAUDE.md and the project's docs rules): no em dashes; no filler openings; short sentences, active
voice, «you» for the reader; one H1, then H2/H3; minimal working commands in code blocks; say plainly what is not
done. No partner name, no mention of any company.

## DOVE

The README only. Nothing under `frontend/src` except it. Do not name the industrial partner.

## COME

Gates: `npm run check:docs`. Docs closure: the Status line; one entry in `docs/log-inbox/hw-notation.md` (§21.3
taxonomy, `Causa: —`, Notes at most 500 characters, «first version, to update after S-H»). `git add` by path,
`Model:` trailer. No push, no merge.
