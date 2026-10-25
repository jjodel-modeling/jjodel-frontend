# Session 2026-10-25 (evening): front instance-of, S3b closed on its branch

Chat C-2026-10-25-2159, from 21:59 to about 22:50 (Rome), `/lane auto` on Alfonso's «decidi tu». This chat now owns the
front `instance-of`; it supersedes the section of chat C-2026-10-21-1405 in `sessione_CORRENTE.md`. No scheduled
check of the old chat was still pending (checked with `list_triggers` at 22:00).

## State at the end

- Lane P-2026-10-21-1955 (S3b lane A) had died on 2026-10-21 at 20:33 on the weekly usage limit, with about 430 lines
  uncommitted in `~/jjodel-w-oi-s3b`. Kept as the base (chat's decision) and finished by a continuation lane.
- Branch `oi-s3b` (worktree `~/jjodel-w-oi-s3b`, on `oi-s3a`), closed, clean tree:
  - `6b17e7830` prompt P-2026-10-25-2205; `f454b12b7` feat(onto): S3b ghost and orphan rows (6 files, +433 -19);
  - `2a72213a4` prompt P-2026-10-25-2220; `cd69c6243` chore(probe): `onto-s3b-ghost-rows.ts`;
  - `f6bf690b7` docs(onto): assets `docs/discovery/assets/onto-s3b/` (4 light crops, measures), closing entry and two
    tickets in `docs/log-inbox/instance-of.md`, `Status: eseguito` on the 2205 prompt.
- Gates: typecheck 0, `instantiate.test.ts` 30/30, IR and nodes render tests 1455/1455, build 0. Probes: UML fixture
  32/32 (re-export), S3b 6/6, S2 21/21, S3a 8/8, undo-inline-edit 33/33, load average 2 to 6. Mutants M1..M4 all red.
- New UML export after R-OI-16: `~/jjodel-demo-exports/uml-s3b/uml-class-object.jjodel` (the old one in
  `~/jjodel-demo-exports/uml/` is untouched). No instance has a manual box: all ten 200x80, dune 200x135.5 and
  200x153.7 with the ghost row, which is fully inside the node. New S2 instances measure 200x136 and 200x99.
- Dev server for Alfonso's visual check on http://localhost:3005, started by this chat from `~/jjodel-w-oi-s3b`
  (vite, log `~/.jjodel-lanes/scratch-c2159/vite-3005.log`). Stop it after the visual GO.
- Tag 3.2.0 still absent. `oi-s2u`, `oi-s3a`, `oi-s3b` wait for it (S2u and S3a have Alfonso's GO of 2026-10-21 19:09;
  S3b needs its visual GO). No lane running, no scheduled check pending.

## Tickets proposed by S3b (low)

1. Opening a ghost row's editor (double click) adds an undo entry with nothing created: one extra, invisible Cmd+Z.
   Same family as the click-born write of the S3a ticket and discovery risk R4.
2. While the value is typed, the ghost row's feature name is ellipsized (`pa… = [300]`).
- The orphan row still shows no feature name (D7, by design); its tooltip is native and does not appear in headless
  crops (text in the measures file).

## Open

1. Visual GO on S3b at :3005, importing the new export (ghost row, typing, Enter, orphan marker).
2. Merges after 3.2.0, in order `oi-s2u`, `oi-s3a`, `oi-s3b`; push stays with Alfonso.
3. Next slices: editable real slot rows (later), S4 links (R-OI-8), S5 conformance O1..O8 (R-OI-11). S4 is not
   launched without Alfonso.
4. Carried over: S3a tickets; shallow undo merge outside groups (P-2026-10-21-0947); harness ticket jjodel-lanes #207;
   the instance-of generality question (second, non-UML client) noted by chat C-2026-10-20-0003.
5. `lane-run` still starts heavy lanes with effort `high` although the prompts declare `xhigh`.

## Lessons

- A lane killed by the usage limit leaves useful uncommitted work: a continuation prompt that reviews the diff against
  the plan is cheaper than a restart (lane A closed in 12 minutes).
- The commit hook refuses subjects over 72 characters and requires a `Model:` trailer: write prescribed subjects short.
- Probes that import a saved export do not see fixture changes until the export is regenerated: a fixture change in a
  lane implies a re-export step in the probe lane.
