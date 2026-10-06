# Section: chat C-2026-10-04-0935 (Cowork, events hidden during a simulation run, lane auto)

Written 2026-10-04 about 15:30 (Rome). Replaces only this chat's section.

## State

Trunk `alfonso-frontend-jjtl` at `6704563a8` or later, not pushed (push is Alfonso's call). Landed by this chat: lane P-2026-10-04-0935 (branch `sim-hide-events`, session `d718633c`, fast, tier heavy): code `8d0021987`, closure `94722697c`. The trunk had moved (`5557a714b`, object-as-edge delete, also in `EditorV2.tsx`), so the direct merge was refused and the branch took the trunk first: P-2026-10-04-1213 (`c53a5a8d1`, no conflict, gates at baselines, closure `452b810ac`). Direct merge P-2026-10-04-1456 `b3fe55c5d`, eight gates green (vitest 7305), closed `ec99e8e5b`, tag `pre-sim-hide-events` on `5b4d6c887`. Chat C-2026-10-04-1126 merged `sim-io-clock` right after (`6704563a8`); merges went one at a time as Alfonso asked. The CHANGELOG `[Unreleased]` is that chat's task. Worktree `~/jjodel-w-simhide` and branch removed (`-D` after checking ancestry; `-d` checked against `~/jjodel`'s HEAD on `validation-skeleton`).

## Feature as built

While the run state is Running, Terminated, Deadlock or Halted, event instances (role `simEvent`, `isKindOf`) and every edge incident to them reach React Flow hidden (`sim/simHideEvents.ts`, wired in `EditorV2.tsx`). Without a run or without an event role the arrays are today's, same references. View-only: no model, layout or undo write; no critical-zone file. Hidden nodes stay invisible obstacles for edge routing (`UnifiedEdge.tsx`), so other edges do not reroute into the freed space; the one path change left is a line-jump hop that disappears where an edge crossed a hidden one. Probe 309/309 on the four demo scenes, the PEST-derived statechart and a hand-made variant; 16 tests red before; mutation 13/16 (three equivalent).

## Process notes

The lane hit the 90-minute limit after its code commit and before its closure; resumed with a GO for the closure only. Alfonso gave the visual GO on the crops; the chat could not view them (the bridge returns images as base64 text only), so RC-23 rested on the probe figures. The lane also produced dark crops, not needed since D-UI-15.

## Tickets

The `osascript` bridge timed out on about half of the calls on 2026-10-04 morning, read-only ones included (4 minutes each); worth a look before the demo. A refused direct merge (P-2026-10-04-1133) leaves its Prompt-ID unused.

## Prompts of this chat

P-2026-10-04-0935 ✅ merged; P-2026-10-04-1213 (take trunk) ✅ done; P-2026-10-04-1456 (merge, direct) ✅ closed.
