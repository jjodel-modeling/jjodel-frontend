# Session 2026-11-08 (4): front multi-tab, L5, L4 and L6 on the trunk

Written 2026-11-08 at about 13:35 (Rome). Replaces this chat's section of 2026-11-07 20:30. Checkpoint in the repo: `docs/sessioni/sessione_2026-11-08_multi_tab_4.md`.

## State

- Front `multi-tab`, owner this chat. R-MT-1..25 in `docs/decisions.md` (R-MT-25, 9fddde148: the second tab opens from the M1 model row of the Tree View only; «Open beside» falls back to a new tab; tabs after the first are `<modelId>~tab<N>`).
- On the trunk and pushed: the layout-key fix, L2, L3, L4b, and since 2026-11-08 **L5** (IR resolution by the tab's viewpoint, merge 46554f772), **L4** (one populate owner per model, registries cleared by the last instance, critical zone, merge 0046f604a), **L6** (second tab on one model, «Open in new tab ▸» and «Open beside ▸», merge bc4b137cd, closure 4dd7f8b2a). Multi-tab is usable on M1 models.
- 3.1.2 released and tagged on ec4f2543e (PR #210).
- No lane of this chat running, no scheduled check pending. All worktrees of the front retired.

## Measured

- L4 (Families.ecore, two tabs): a class added with both tabs open made 2 vertices before the fix, 1 after; closing one tab no longer wipes the other's registries; the duplicate M2 edge of discovery §3.7 did not reproduce even before the fix.
- L6 (demo project): Open in new tab A/B/A 3 runs, each tab its own node set; one vertex with two tabs; delete closes every tab; Open beside paints the right panel (CSS rule in `ScriptTab.scss`, 7f8e8c0fb) 3/3; single tab unchanged.

## Left

1. L6b, beside layout only: side panels cover the left canvas (289 px visible), right panel capped at 710 px by `style.scss:1055`, toolbar labels overlap in both panes, app bar does not list the right tab, the maximized fallback opens the tab in a hidden panel (mouse cannot reach it).
2. L7: selection highlight in every tab (R-MT-2).
3. Tickets: the console reads the tab id as a model id; the sync registries have no model key (the last tab of model N clears an open tab on model M); `publishedChannelSlots` (`useIRContainment.ts:61`) shared by every IR canvas; no second tab on a metamodel; Refactoring on the demo finds no M1 target (`projectTargetCandidates`); the merge template's reset sha names the commit before the prompt commit.
4. R-MT-23 still says branch from `origin/staging` and PR to `main`; amendment line offered.

## Lessons

- Prompt-ID collisions happen within the same minute: check `~/.jjodel-lanes/P-…` right before `lane-run start`, renumber with its own commit.
- `lane-run merge` refuses when a code file changed on both sides: run `--trunk-into` from the branch worktree first (RC-14), twice in this session.
- Crops are unreadable from the cloud without the folder grant: ask Alfonso before every critical-zone merge.
- A blocked merge of another chat can hold the trunk for hours; ask Alfonso early. He waived the rule at 00:03 («procedi tu con i merge evitando problemi»).
