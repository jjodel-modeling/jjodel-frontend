# Session 2026-11-04: Auto layout crash and the ELK open race (chat C-2026-11-03-2317)

Follows sessione_2026-11-04_jjtl_canvas.md, on Alfonso's ok of 14:41. Bridge lost from 16:47 to 21:29. No hand run; no push by this chat.

## On the trunk

- `2f61d24d6`: R-JTG-21, 22 ratified, 22 rewritten, comment at `Toolbar.tsx:1250`.
- `c79e1a1ca`: above 1,000 estimated dummies ELK uses BRANDES_KOEPF, toolbar and open-time; a toast if the toolbar layout fails. Cause: NETWORK_SIMPLEX overflows or freezes on many dummies (3,600 dummies 27 s, about 4,300 RangeError, a ring of 88 past 300 s). Below the budget 35 canvases equal within 0.00008 px, toolbar path only. Largest demo estimate: 6.
- `2fb262606`: the open-time callback waits until the open has settled (critical zone, go-ahead 14:41), deadline 10 s. b6_5: one ELK call on 191 nodes, 190 edges in 5 of 5; before mostly on 1 node. Undo 0 to 1 in all 17 finished runs. 7 gallery projects, 17 diagrams: same first drawing. 14,036 tests, 3 red at import.

## Figures

Production b10_8, 5 counted runs, load 7.5 to 14.4, before the trunk merge: same view in all, translate(414,-63515) zoom 0.5, 21 nodes on screen, 2,559 of 2,559 at fit, longest task 1,359-1,662 ms, long-task total 8.0-10.3 s. Decision time on dev 4.7-6.7 s, before 3.5-4.1 s. Not rerun after the trunk merge with the staging realign (chat C-2026-11-04-1615).

## Residual

A size write or a click during the wait counts as user work: no layout. A populate held in its 150 ms window waits until the deadline. A first run hung 600 s after a dozen hot reloads, not seen again in 7. Layout width of the 200-class ring varies between runs. BRANDES_KOEPF drawing above the budget unreviewed; fit shows 2 to 15 of 200 classes at minimum zoom 0.5. Re-layout watcher `EditorV2.tsx:4210` uncapped.

## Open questions

1. Lower minimum zoom for fit. 2. Look at BRANDES_KOEPF on one model. 3. Budget 1,000. 4. Ticket for the ring width. 5. Deadline 10 s. 6. Retire `jjodel-w-rowscomment`, `elkrange`, `elkrace`.
