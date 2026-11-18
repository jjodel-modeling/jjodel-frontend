# DCN L2.1: `featureSources` in the ontological binding, dormant slots in the feature closure

Prompt-ID: P-2026-11-06-2300
Chat: C-2026-11-06-2159
Front: dcn
Status: eseguito 2026-11-06 · lane dcn · d51def3e7 · bench 24/24 killed · verifica visiva non applicabile (RC-17)
Lane: full (changes exported interfaces additively; Phase 1 already done by P-2026-11-06-2240/2250, this prompt carries the GO for Phase 2)
Depends: R-DCN-3, R-DCN-9, R-DCN-10, R-DCN-17, R-DCN-20; discovery docs/discovery/discovery_2026-11-06_dcn_foundations.md §1
Worktree: ~/jjodel-dcn, branch dcn, at this prompt's commit (no node_modules: create the P14 symlink to ~/jjodel/frontend/node_modules, remove it at the end)
Request: https://claude.ai/code/session_01DQt9R4H8ma8MFTYqMZbPso (Alfonso 2026-11-06 22:54 «si» on Q1..Q13)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: Rule 19 (five files) is exceeded by one test file, `bindingCheck.test.ts` (motivo: the new check needs its own cases; no source file is added).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Commit as soon as gates are green. Every reply opens with [P-2026-11-06-2300 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Every question with a recommendation carries it in one line: `Recommended: <one line>`. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD; never cat a test or build log.

## Contesto (non rifare l'analisi)

Read the discovery §1.2, §1.3, §1.4 and nothing else of it. Every R-OI surface (synthesis, Sync slots, ghost and orphan rows, `instantiation` problems, materialize) reads `featureClosure` and `slotDiff` of `frontend/src/model/ontological/bindingReader.ts`; these three files are S1 and byte-identical on the trunk and the `oi-*` branches. A DCN dynamic class is reached from its static class by containment (`StaticClass.viewpoints`, then `Viewpoint.classes`), not by generalization, and owns its attributes as `Property` under a reference of its own (R-DCN-10). Today its attributes are outside the closure, so their slots are orphan. The fix is one optional binding role; the consumers inherit it with no edit.

## COSA

(1) `bindingCodec.ts`: an optional `featureSources?: { path: string[] }[]` on `OntoBinding`, each `path` a non-empty list of M2 reference ids, decoded and encoded; a malformed entry is refused the way the codec refuses other malformed roles; unknown keys keep surviving byte for byte. A record without `featureSources` encodes exactly as today.
(2) `bindingReader.ts`: `featureClosure` applies every source path from every classifier of the generalization closure (R-DCN-17): follow each hop with `view.referenceTargets`, the targets of the last hop are features. Source features come after own and inherited features, each once, in a deterministic order. Additively on `FeatureClosure`: `dormantOwner?: Record<string, string>`, from each source feature to the element reached by the next-to-last hop (the dynamic class). `slotDiff` is unchanged in code; a slot of a source feature is covered, a missing one is `missing`. Without `featureSources` the result is identical to today, field for field (`dormantOwner` absent, not empty).
(3) `bindingCheck.ts`: each hop of a path is a reference of the metamodel and the type of hop i owns (or inherits) hop i+1; the last hop's type conforms to the type `definingFeature` points to. Diagnostics in the style of the existing checks.
(4) Tests first, in `__tests__/bindingCodec.test.ts`, `bindingReader.test.ts`, `bindingCheck.test.ts`: round trip with and without sources; a closure with a two-hop source and a generalization (the source applies on the general too); parity on the existing cases (no `featureSources` means the same closure and no `dormantOwner`); a slot of a source feature not orphan, a missing one reported missing; each check failure. Then the mutation bench on the three source files, as P5 asks.
(5) Gates: typecheck at the baseline of CLAUDE.md §17, vitest of `model/ontological/` and the full run at its baseline, `npm run build`, `npm run check:docs`. One code commit (the three sources and the three tests), then the log entry in docs/log-inbox/dcn.md and the Status flip in one docs commit (no visual check is owed: RC-17 lets the lane close itself).

## HARD STOP

Any need to touch a file outside the six of COSA, or any consumer on the `oi-*` branches, is a stop with Outcome: question.

## NON FARE

No edits outside `frontend/src/model/ontological/` and its tests, the log inbox and this prompt's Status. No VersionFixer step (the codec has none, bindingCodec.ts:12-14). No push, no merge. Public repo: name no partner company.

## DOVE

`frontend/src/model/ontological/bindingCodec.ts`, `bindingReader.ts`, `bindingCheck.ts`, `__tests__/bindingCodec.test.ts`, `__tests__/bindingReader.test.ts`, `__tests__/bindingCheck.test.ts`.

## RIFERIMENTI

docs/decisions.md R-DCN-3, R-DCN-10, R-DCN-17, R-DCN-20, R-OI-13; docs/spec/claude_spec_2026-11-06_dcn_metamodel_simulation.md §4; docs/discovery/discovery_2026-11-06_dcn_foundations.md §1.
