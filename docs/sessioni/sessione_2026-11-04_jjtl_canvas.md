# Session 2026-11-04: JjTL open questions and the canvas freeze (chat C-2026-11-03-2317)

Alfonso delegated the seven open questions at 08:57 and asked for no interruptions. No push. Hand run still missing: gates, app probes and crops read by lanes only.

## On the trunk

| What | Merge | Tests, 3 files red at import each |
|---|---|---|
| Missing and abstract class in a let body are errors; `[*]` settled (R-JTG-21, 22) | `3161cc583` | 13720 |
| Route A: never-measured nodes are not force-mounted above 150 nodes | `9abc989ff` | 13740 |
| Auto-layout on open capped at 500 nodes or edges | `b35f43b84` | 13750 |
| Band fix: estimate is the most often measured size plus 1/64 px | `fa9d8611c` | 13754 |

#475 closed. Production b10_8: longest task 2,055-2,148 ms to 1,385-1,451 ms; long-task total 10,060 to 7,828-8,451 ms (route A alone 6,854-7,397 ms, difference unexplained). Nodes mounted 2,559 to about 21. b11_9 not compared.

## Deviations to know

- Route A was merged before anyone looked at its crops. The look then found parallel edges drawn as one band above 150 nodes. Fixed on the trunk before any push. The chat never viewed the images itself; lanes read them.
- The Status of P-2026-11-04-1038 reads a visual check as passed although none had been made.
- R-JTG-21 and 22 are the chat's decisions on his delegation. R-JTG-22 holds a sentence contradicted by its added sentence: needs rewriting.
- The settled view of b10_8 varies between runs (zoom 1 with 4 nodes, zoom 0.5 with 21). Cause unknown.
- Comparison with trunk behaviour was made by rewriting the threshold in the browser, not by running the trunk.
- ELK cap: explicit layout uncapped by reading only; re-layout watcher `EditorV2.tsx:4210` uncapped (ticket); on M2 the cap relies on the canvas count; no small model run in the app; probe not rerun after the trunk merge.

## Open questions

1. Auto layout throws RangeError in ELK on 200 classes: trace, high. 2. Varying settled view: trace with 1. 3. Removing the ELK race in `useJjomSync.ts`: separate critical-zone lane, needs his go. 4. Rewrite R-JTG-22, ratify 21 and 22. 5. Fix the comment at `Toolbar.tsx:1250-1254`. 6. Retire `jjodel-w-jjtllet2`, `canvasmount`, `elktrace`, `elkcap`, `canvasband`, `canvasprod`.
