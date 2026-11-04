# Auto layout crashes on 200 classes; the settled view varies between runs

Prompt-ID: P-2026-11-04-1443
Chat: C-2026-11-03-2317
Front: hw-notation
Status: da eseguire
Lane: full (root cause first; Alfonso's ok of 2026-11-04 14:41, high priority)
Depends: none
Worktree: ~/jjodel-w-elkrange, branch elk-rangeerror
Request: none (Alfonso's ok of 2026-11-04 14:41)

Run pwd, git branch --show-current, git status --short: that worktree and branch, clean, otherwise stop with Outcome: blocked. Every reply opens with [P-2026-11-04-1443 · session <id>]. Final line Outcome: done | hard-stop | question | blocked. No subagents, no background tasks. One probe run per tool call, uptime before timing runs. Summary lines only. Commit each green step, before probes. A question with one recommendation carries a line Recommended: <one line>. A probe is not a hand run. Do not merge. The repo is public: name no partner company.

## COSA

1. The toolbar Auto layout on a metamodel of 200 classes and 400 references throws RangeError: Maximum call stack size exceeded inside ELK (ticket in docs/log-inbox/hw-notation.md, P-2026-11-04-1012; probe and fixture in ~/.jjodel-lanes/P-2026-11-04-1012/probe/). First confirm it on the true trunk code path, with route A's threshold in place and with it disabled. Find the root cause: which input and which recursion (graph shape, cycles, hierarchy, a layout option). Find the smallest graph that fails. Fix it if the fix is outside the critical zone (useJjomSync.ts, portDistribution.ts), test first; otherwise stop with Outcome: question. The user must get a working layout, or a clear message and no crash if the size really exceeds what ELK can do. Once it runs, check what could not be checked before: fit view after a pan, and layout after the mount-all wait of route A.
2. The settled view of b10_8 varies between runs: zoom 1 with 4 nodes in one, zoom 0.5 with 21 in others (P-2026-11-04-1204). Find out why, by counting fit calls and their inputs over at least four runs, from the probe. If it is a race in EditorV2.tsx, fix it, test first. In the critical zone: stop with Outcome: question.

## DOVE

frontend/src/components/editor-v2/utils/elkLayout.ts, EditorV2.tsx, their tests, docs/discovery/discovery_2026-11-04_elk_rangeerror.md (goal, files read with full paths, findings marked measured or read, risks, open questions), docs/log-inbox/hw-notation.md, the Status line. No CLAUDE.md 3.2 file.

## COME

Gates: tsc, full vitest (3 files red at import are the baseline), build, check:docs. Crops before and after, read with the Read tool, saying what differs. Close with «Decisions taken (unattended)», «Decisions awaiting Alfonso».
