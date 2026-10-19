# S4d cleanup: six prompts left `da eseguire`

Prompt-ID: P-2026-10-19-1022
Chat: C-2026-10-18-2220
Front: harness
Lane: fast (docs only: Status lines of existing prompts and one inbox entry)
Status: eseguito 2026-10-19 · lane s4d-sweep · docs only, 1 of 6 flipped (P-2026-10-15-1710), 4 parked, 1 failed · verifica visiva non applicabile
Depends: P-2026-10-19-0907
Corregge: none (hygiene sweep of signal S4d, report `docs/discovery/discovery_2026-10-18_harness_health_retrospective.md` §1.1 A4)
Request: Alfonso, 2026-10-19 10:18, in the project chat: «vai» to the S4d cleanup lane proposed at 09:23

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (the classification below is the discovery, and it is written into the entry); P8 does not apply, no UI.

Worktree: `~/jjodel-w-s4d`, branch `s4d-sweep`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-1022 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. Read `docs/decisions.md` and the logs with `offset`/`limit` or `rg`, never whole.

## Context (measured by the chat at 10:18)
The retrospective counts as stale a prompt still `da eseguire` more than a day after its lane folder has an `exit.txt`. The six of A4, with what the chat measured:

| Prompt-ID | File | Front | Lane exit, last Outcome | Last commit naming it |
|---|---|---|---|---|
| P-2026-10-10-0830 | `claude_2026-10-10_0830_fase2_nested_vertices_s0.md` | ? (no `Status:` line found by `^Status`) | 0, hard-stop | `676c05ce2` docs(discovery): nested vertices, D1 and D2 ratified |
| P-2026-10-11-1830 | `claude_2026-10-11_1830_prompt_mods_guard_rc46.md` | harness | 0, hard-stop | `7d6d3d39a` RC-46 mods guard discovery, Phase 1 |
| P-2026-10-11-2235 | `claude_2026-10-11_2235_prompt_insights_s1_rework_causes.md` | harness | 0, hard-stop | `56af77b88` merge: cluster-desc-refresh (P-2026-10-11-2328) |
| P-2026-10-12-0120 | `claude_2026-10-12_0120_prompt_jjel_multivalued_navigation.md` | maintenance | 0, hard-stop | `796839cc8` fix(jjel): multi-valued features navigate to arrays |
| P-2026-10-14-1955 | `claude_2026-10-14_1955_prompt_uml_class_object_fixture.md` | maintenance | 1, no Outcome line | `af48125ea` docs: add prompt |
| P-2026-10-15-1710 | `claude_2026-10-15_1710_prompt_da1_graphvertex_add_discovery.md` | release-3-2 | 0, hard-stop | `e45998ecd` D-A1 discovery entry |

Five of six ended in a hard stop, which under P4 and RC-20 usually means Phase 1 is done and the lane waits for a GO, not that it closed. So S4d may be counting parked lanes as closed: that is a finding about the signal, not only about the prompts. Verify it, do not assume it.

## COSA
1. For each of the six, classify from primary sources only (git log over all refs, the lane folder `~/.jjodel-lanes/<Prompt-ID>/` with `log.jsonl` read through `rg`/`tail`, inbox and log entries, later prompts that cite it in `Depends:` or `Corregge:`), into exactly one of:
   - **done**: the work it asked for is on the trunk (name the closing sha and whether a visual check was required and given, from the entry);
   - **done elsewhere**: superseded by a later prompt that carried the work (name it and its sha);
   - **parked**: Phase 1 hard stop or question, no later prompt carried the work, no GO given;
   - **failed**: the lane exited without an outcome and nothing carried the work.
2. Flip the `Status:` line only for **done** and **done elsewhere**, in the form already used on the trunk (`eseguito <date> · lane <kind> · <sha> · ...`, or `superato da P-... (<sha>)`). Copy the form from a recently flipped prompt; do not invent one. A **done** whose entry shows a visual check was required and not recorded is not flipped: classify it as parked with that reason.
3. Do not touch **parked** or **failed** prompts. Do not decide whether they are abandoned: that is the owning chat's call (RC-33), and for the harness ones it is Alfonso's chat. List them with what each needs (a GO, a rework prompt, an explicit abandonment) and the owning `Front:`.
4. P-2026-10-10-0830: find why `^Status` matched nothing (a missing header, a different spelling, an indented line). Report it; add a `Status:` line only if the file has none and the work is done.
5. On S4d itself: state, with counts, whether its rule ("lane exited") conflates parked with closed, and propose the corrected rule in one sentence (for example: stale means `exit.txt` with `Outcome: done` and no flip after 24 h; a hard stop older than N days is a separate, yellow «parked» count). Proposal only: no change to the retrospective script or report.

## DOVE
The `Status:` lines of the prompts classified done or done elsewhere (at most these six files, one line each), `docs/log-inbox/harness.md` (one entry), this prompt's Status line. Nothing else.

## Gates
`check:docs` after the commit.

## Commits (P13, RC-17), explicit pathspecs, no push
One commit: `docs: S4d sweep, Status of stale prompts classified and flipped (P-2026-10-19-1022)`, with the classification table in the body. The entry in `docs/log-inbox/harness.md` carries the table, the S4d finding of item 5, «Decisions taken (unattended)» and «Decisions awaiting Alfonso» (the parked harness prompts). Trailer `Model:` (P6).

## NON FARE
No change to any prompt body. No new prompts. No re-run of any lane. No edit of `decisions.md`, `PROTOCOL.md`, `CLAUDE.md`, the retrospective script or its report.

## HARD STOP
None planned: close with `Outcome: done`. `Outcome: question` only if a prompt cannot be classified from the sources.

## RIFERIMENTI
`docs/discovery/discovery_2026-10-18_harness_health_retrospective.md` §1.1 (A4), §3 (S4d), §7 (risk «Stale prompts»); `docs/PROTOCOL.md` P4, P13; `docs/decisions.md` RC-17, RC-20, RC-33.
