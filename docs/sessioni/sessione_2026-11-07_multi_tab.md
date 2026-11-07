# Section: chat C-2026-11-06-2333 (front multi-tab, several tabs on models with distinct viewpoints, R-MT)

Written 2026-11-07 at about 04:00 (Rome), at the end of a `/lane auto` night. New section; replaces only this section.
Checkpoint in the repo: `docs/sessioni/sessione_2026-11-07_multi_tab.md`.

## State

- Front `multi-tab` open (milestone 19 on jjodel-lanes, `docs/harness/fronts.json`, owner this chat), inbox
  `docs/log-inbox/multi-tab.md`.
- On the trunk: R-MT-1..19 (2..4 ratified by Alfonso 2026-11-06 23:38 «Le tre risposte vanno bene»; the others
  provisional, unattended); discovery `docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md` (merge 0d48b6eb0);
  lane L1 merged (04b782a5b, closure 275486660): a model tab no longer rewrites the viewpoint and the saved preference of
  the other open tabs. L0b report merging at 03:51 (P-2026-11-07-0351, docs only).
- **Regression found, live since 3.1.0** (L0b, `docs/discovery/discovery_2026-11-07_layout_switch_after_242a82bcd.md`):
  switching between two exclusive viewpoints leaves the nodes at the previous viewpoint's positions (0/3 on the trunk,
  3/3 on the parent of `242a82bcd`, three runs each); a reload repairs it. Cause: the incremental sync has no layout key
  in its dependencies. Fix in `useJjomSync.ts`, critical zone: waits for Alfonso (phone push sent 01:30).
- No lane running, no scheduled check of this chat after this section. Worktrees to retire with his yes:
  `~/jjodel-w-multitab`, `~/jjodel-w-mtl1`, `~/jjodel-w-mtl0b` and their branches.

## Awaiting Alfonso

1. Go-ahead for the critical-zone fix of the layout switch (R-MT-19), and whether it also ships as a 3.2.x patch
   (recommended: yes).
2. Veto window on R-MT-1 and R-MT-5..19, in particular R-MT-9 (gesture «Open in new tab ▸ viewpoint»), R-MT-12
   (simulator panel unchanged in every tab), R-MT-15 (one undo stack per user across tabs).
3. Go-ahead for L3 and L4 (critical zone) when their turn comes; L2 (plumbing, not critical zone) can open after the
   veto window.
4. Push of the trunk; retiring the three worktrees.

## Lane plan (discovery §7)

L1 done; L0b done (regression confirmed). Next: the layout-key fix (critical zone), L2 per-tab viewpoint plumbing, L3
three canvas doors (critical zone), L5 IR resolution with explicit viewpoint, L4 populate owner and registries (critical
zone), L4b problem producers, L6 the second tab and its gesture, L7 selection highlight; L8 and L9 conditional.

## Lessons

- Both discovery lanes and L0b stopped at the context ceiling; L0b's measurements were complete, so the chat wrote the
  report from the handoff and the lane's JSON instead of opening a continuation under load 84.
- A direct merge blocked by a red gate rolls the trunk back to its tag: never commit on the trunk while another chat's
  merge runs or sits blocked.
- Two branches each adding an entry to a new front inbox trip `check:addonly` at merge (the separator of one entry is
  read as a rewrite of the other): align the inbox with the trunk on the branch before the merge.
- Timing-budget tests (`languageService`, `outline`, `tolerant`) fail above load ~80 and pass alone; rerun them alone
  before relaunching a merge.
