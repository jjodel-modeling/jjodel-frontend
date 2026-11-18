# Session 2026-11-07 (3): front multi-tab, 3.1.2 release and L5

Chat C-2026-11-07-0425, /lane auto, from the 09:20 checkpoint (`sessione_2026-11-07_multi_tab_2.md`) to about 20:30.


## State

- Front `multi-tab`, owner this chat. R-MT-1..24 in `docs/decisions.md` (R-MT-20..23 added e71c6abdc; R-MT-24, «Open beside ▸ <viewpoint>», written by Alfonso from C-2026-11-07-1340, 247d6775e).
- On the trunk and pushed: layout-key fix (da2af3bf7), L4b (ee9d7dbba), L2 per-tab viewpoint plumbing with the `noUndo` focus write (02c2ff850, core change approved 10:06), L3 the three canvas doors take the tab's layout key (9c75afa97, critical zone).
- **3.1.2 released.** Fix-only patch on 3.1.1: `release/3.1.2-patch`, app check P-2026-11-07-1536 (3/3 x3, base shows the regression), crops OK by Alfonso 17:38, PR #210 merged by Alfonso into `dotnet-backend-integration` (ec4f2543e), tag `3.1.2` on ec4f2543e (a first tag on e080ab534, made before the merge, deleted and redone at 17:58). Trunk record 02269f010. PR #209 (81 commits, with #196) closed on Alfonso's choice at 15:32. `staging` keeps 3.1.2 and its `[3.1.2]` entry, reworded to describe the patch (4f567dd45).
- **L5 ready, not merged**: `multi-tab-l5` (`~/jjodel-w-mtl5`, code f2ddead3d, closure 73e6441fd). IR resolution follows the tab's viewpoint (Option A: the five files plus `EditorV2.tsx`, `ObjectNode.tsx`). Demo check: tab A 18 nodes, tab B 25 at every read, L3 pair 6/6, single tab unchanged, gates green. Crops OK by Alfonso 18:58. **Merge held**: other chats' trunk merges P-2026-11-07-1834 (oi-s3b, textual-f1e-names) and 1903 (title-probe) sit at Outcome: blocked with Status da eseguire; Alfonso asked at 19:22 to close them or waive the rule.
- L4 prompt drafted (chat's `/home/claude/l4.md`, Prompt-ID assigned at commit): one populate owner per model and registries cleared by the last instance (R-MT-17, discovery §3.2, §3.7), critical zone, go-ahead 04:23 and 18:33 «via». Launches after the L5 merge.
- Demo project `~/Downloads/jjodel-multitab-demo.jjodel` (Smart building, Apartment and Office, «Floor plan» and «Control wiring») with its `.md`.
- Scheduled poll of this chat every 30 min while the trunk is held. A new chat that takes the front deletes it first.
- Worktrees: `~/jjodel-w-mtl5` (until the merge). Retired: mtpatch, rel312, rel312p.

## Next

1. When the trunk frees: merge L5, push, retire `~/jjodel-w-mtl5`; launch L4 (code and gates), then its app check (measure §3.7 and §3.2 before and after).
2. L6 after L4: second tab on one model (tab-id helper, «Open in new tab ▸» and R-MT-24 «Open beside ▸», `openBeside` by tab id, fallback on false is the lane's recommendation; `closeTabsForEntity`, `Dock.tsx:378`, `Navbar.tsx:723`). Then L7.
3. Ticket from L5: `publishedChannelSlots` (`useIRContainment.ts:61`) is one module-level list for every IR canvas.
4. Known limit seen in the L5 crop: the side panel follows the last opened tab (`Dock.tsx:360`).
5. R-MT-23 still says branch from `origin/staging` and PR to `main`; an amendment line is offered to Alfonso.

## Lessons

- Before a tag, check the PR is merged: `gh pr view <n> --json state` first, then tag the merge commit.
- Crops in `~/.jjodel-lanes` are not readable from the cloud session without a folder grant; base64 through osascript is too large for the context. Ask Alfonso, or get the grant.
- Other chats' merges left at Outcome: blocked can hold the trunk for hours; ask Alfonso early rather than polling.
- Code-and-gates lanes still hit the context ceiling (1516); the continuation that only finishes gates, measures and closes (1730) ran in one go.

## Prompts of this part (outcome)

| Prompt | What | Outcome |
|---|---|---|
| P-2026-11-07-0935 | L2 focus write without an undo entry (`noUndo`) | ✅ merged with L2 |
| P-2026-11-07-1008 | patch check on the staging base | ✅ (superseded by the 3.1.1 base) |
| P-2026-11-07-1249, 1352 | L3 code and app check | ✅ merged 9c75afa97 |
| P-2026-11-07-1417, 1439 | demo project | ✅ (1417 at the ceiling, 1439 24/24) |
| P-2026-11-07-1516, 1730 | L5 code and app check | ✅ ready, merge held by the trunk |
| P-2026-11-07-1536 | 3.1.2 app check on the 3.1.1 base | ✅ PR #210, tag 3.1.2 |
| L4 | one populate owner per model | drafted, launches after the L5 merge |
