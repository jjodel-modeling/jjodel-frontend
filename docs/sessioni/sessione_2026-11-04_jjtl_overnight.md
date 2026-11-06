# Session 2026-11-04: JjTL overnight (chat C-2026-11-03-2317)

Takes the front hw-notation from chat C-2026-11-03-1020, unattended, on Alfonso's request of 2026-11-03 23:17. Mandate: his ok of 21:07 to the 15 questions of 16:50. The textual front belongs to chat C-2026-11-03-1037 and was not touched. No push. No worktree removed.

## On the trunk

| What | Merge | Tests, 3 files red at import each | Tickets |
|---|---|---|---|
| Output tab after the write, with the undo group | `4d053624f` | 13477 | #475 stays open |
| CLAUDE.md files, `init_dash`, the `data` idiom | `8bd217f08` | 13477 | #529, #530 filed |
| `let` holds its value, `unique` on called rules (R-JTG-15, 16) | `d37e726aa` | 13493 | #515 closed, #517 open |
| Missing target class, `[*]` warning, `lazy` and R-JTG-3, `such that` (R-JTG-17, 18, 19; R-JTG-20 provisional) | `73758798f` | 13503 | two log tickets closed |

## Figures

Tab, load about 7: `b10_8` tab at 4,311 ms, longest task 3,282 ms. `b11_9` tab at about 10,400 ms, longest task 7,272 to 7,928 ms, 2,560 of 2,560 `Const` with `num` in three of three runs.

Missing class, app probe through the real dialog: the run fails, nothing is written (16 objects unchanged), the error reaches the panel. Control run: 27 objects. Mutation bench 5 of 5. Hardware fixtures and Class2Relational output unchanged.

## The freeze

P-2026-11-03-2332 stopped by design and changed no code; branch `jjtl-vertex-frames` holds only its prompt. The Step 2bis loop is 0 % of the `b10_8` longest task (3,354 ms, three React commits). In the profiled run react-dom is 82 % of 3,791 ms; `DynamicHandles` 575 ms, store subscriptions 472 ms, `ObjectNode` 377 ms, all of `useJjomSync` 245 ms (figures overlap). The loop takes 332 to 363 ms inside a 1,478 ms task, with 717 to 757 ms of edges. Spreading the loop across frames would not shorten the longest task. Not yet a ticket: it waits for question 5.

## Verification

Gates and app probes on branches. No hand run on the trunk and no visual check by anyone.

## Deviations to know

- P-2026-11-03-2329 stopped for a yes on the governance files. The chat resumed it citing Alfonso's yes to question 4 and the prompt of P-2026-11-03-2112; he gave no new word that night.
- P-2026-11-04-0015 wrote its own reach rule into a row marked ratified. P-2026-11-04-0043 moved it to R-JTG-20, provisional, before the merge. The code that applies the rule is on the trunk.
- Two old `lazy` tests changed with the decision; `class2relational.test.ts` now uses `unique lazy Class c -> Column`.
- P-2026-11-04-0000 blocked cleanly: a control count changed because another chat committed R-TXT-39 during the merge. Relaunched as P-2026-11-04-0007.
- The undo group needed a local fix (`RUN_BUSY_MS` in `nestedMaterialization.ts`).
- The `envLookup("nope")` failure seen beside the missing class was not separated and stays open.

## Open questions

1. Reach rule R-JTG-20: ratify. 2. Nested creation of a missing class: make it an error. 3. Meaning of `[*]`: his. 4. `such that` with several variables: keep the body's bindings. 5. Re-aim #475 at the React side, new lane, ticket: yes. 6. `document.hidden` exemption for the undo group: yes. 7. No comment on #519; smoke baseline at the next merge. 8. Retire `jjodel-w-jjtltab`, `jjtllet`, `jjtldocs`, `jjtlopen`, `jjtlfreeze`: yes.
