# Session 2026-11-07: textual syntax steps D, E, F (chat C-2026-11-03-1037)

Written 2026-11-07 at about 19:20 (Rome) by the chat, from the state of the Mac. It replaces the checkpoint of the same name that the earlier chat produced only as an attachment and never saved. Trunk `alfonso-frontend-jjtl`; front `codegen`, textual part. Mode `/lane auto` from 15:17.

## State

- On the trunk and pushed: F1a (merge 212f038f1, hand closure d817420e8), F1b and F1c in one merge (e59d6025e, closure c0ee2cc00), F1d (merge 99657324e, closure 44ecca1f1), E2b (merge e1318161, closure c3d0663ed).
- On the trunk, not closed: F1e, merge adf6c9629 (P-2026-11-07-1834). The instance-of chat launched its merge of oi-s3b in the same minute and `lane-run` gave it the same Prompt-ID: its merge is e5add4d95, and the lane folder ~/.jjodel-lanes/P-2026-11-07-1834/ now holds the oi-s3b merge (outcome blocked). F1e's gates and closure were lost with it. F1e's code is in the trunk; its Status flip and log entry for the merge are missing.
- Ready, not merged: D3c on textual-d3c-rules (~/jjodel-w-textd3c, docs 8e5e473f0), crops checked by the chat.
- The trunk's check:docs is red since 02269f010 (multi-tab chat, release 3.1.2, P-2026-11-07-1536): its log entry in docs/log-inbox/multi-tab.md has a free-text Corregge and a Causa outside the taxonomy. Every direct merge blocks on it until that chat fixes its entry.
- tolerant.test.ts (a timing bound, 1484 ms against 1000) is red under load and was still red alone at load 41 to 68.
- No lane of this chat running.

## Lanes of this session

| Prompt | What | Outcome |
|---|---|---|
| P-2026-11-07-1444 | F1b JjEL highlighting inside the islands | done, merged |
| P-2026-11-07-1522 | F1c JjEL syntax check as warnings | done, merged |
| P-2026-11-07-1622 | F1d completion inside an island | done, merged |
| P-2026-11-07-1635 | E2b canvas selection highlighted in the Text tab | done, merged |
| P-2026-11-07-1736 | F1e self.<f> name check | done, merged (closure missing) |
| P-2026-11-07-1838 | D3c user validation-rule problems as markers | done, not merged |
| 1519, 1617, 1733, 1821, 1834 | direct merges | see State |

## Decided unattended

- Crops of F1b, F1c, F1d, E2b, F1e, D3c checked by the chat (RC-23).
- F1c, F1d, F1e branched from the previous F lane's tip instead of the trunk, to run while the merges waited.
- One merge for F1b and F1c (the F1c branch contains F1b).
- F1a merge: one red (elementWaiterScope.test.ts timing) rerun alone twice, resolved.

## Candidate tickets

1. Any reprint of the Text tab (style switch included) calls setMarkers(null) and clears the JjEL warnings until the next edit (found by F1e).
2. A Text tab opened while canvas nodes are already selected shows no highlight until the selection changes (E2b).
3. D3c: rule markers disappear when a model change makes the last validation run out of date, until the next Validate (by design; worth a note).
4. lane-run merge gave the same Prompt-ID to two chats in the same minute (F1e and oi-s3b, P-2026-11-07-1834).

## Next

1. The multi-tab chat fixes its 3.1.2 log entry, so check:docs is green again.
2. Close the F1e merge by hand under a fresh note (its Prompt-ID folder belongs to the oi-s3b merge now), or leave it as is: Alfonso's call.
3. Merge D3c when check:docs is green and tolerant.test.ts passes alone at low load.
4. Then F2 (tracing, TEXTUAL_REVEAL), T8b after checking T8a, tickets D2d, C2f, #682, E3 low.

## Lessons for the harness

- Commit the prompt file before lane-run start; never leave ~/jjodel-release dirty; never sed docs/log-inbox/codegen.md file-wide.
- Never launch a merge before the source lane's exit.txt; one lane-run command per minute; at most two lanes of this chat; 5-min load below 40.
- A merge lane's Prompt-ID is the current minute: two chats merging in the same minute collide. Read the merge commit's subject, not only the lane folder, before acting on a merge result.
- Timing tests (elementWaiterScope, tolerant, traceMonitor, Chromium hooks) go red under load: rerun them alone before closing a merge by hand.
- Write prompts straight into an AppleScript string (no double quotes or backslashes) rather than base64: half the tokens.
- Crops: copy to a /tmp dir with an index.html, sips -Z 700, python3 http.server on 127.0.0.1:3199, built-in browser, one screenshot; crop full-page shots with sips -c before looking.
- A checkpoint lives in the repo, never only as a chat attachment.

## Update 2026-11-08 (00:20)

On Alfonso's «decidi tu» (2026-11-08 00:02) the chat closed the three open points and merged D3c. All pushed.

- check:docs green again: the multi-tab chat's 3.1.2 log entry had a free-text Corregge and a Causa outside the taxonomy; both set to the sentinel, the cause stays in the LIR the entry cites (d9187549d).
- F1e merge closed by hand (e91177c3b): outcome partial, Regressions unknown, Causa (g), because its gate summary was lost to the Prompt-ID collision.
- Ticket #720 on the harness front: lane-run merge gives the same Prompt-ID to two chats in the same minute (efd40eb55).
- D3c merged (cae331a7c, closure 8e57a1aef, card #718 closed).

Every lane of this round is now on the trunk: F1a, F1b, F1c, F1d, F1e, E2b, D3c. No lane running, no scheduled check left.

Next, on Alfonso's go: F2 (tracing, TEXTUAL_REVEAL), T8b after checking T8a, the tickets D2d, C2f, #682, E3 low, and the three candidate tickets above.
