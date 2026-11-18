# Multilevel L1: codec, reader and check of the instantiation STC (potency roles, derived level)

Prompt-ID: P-2026-11-16-0232
Chat: C-2026-10-25-2159
Front: instance-of
Lane: full (pure model code, no browser; rule 19: six files, listed below)
Status: eseguito 2026-11-16 · lane full · 09404b07b
Request: https://claude.ai/code/session_01Qd8VK8yfvc2VwsVGG8qQ1S (Alfonso, 2026-11-16 02:00: «vai adesso in /lane auto ma non ti fermare e prosegui dritto dritto fino all'implementazione»; the discovery's recommended answers Q1..Q12 adopted unattended, RC-21)
Depends: P-2026-11-16-0205
Corregge: —
Protocollo: docs/PROTOCOL.md (clausole P1..P16 applicabili, tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-oi-ml`, branch `oi-multilevel`, its tip this prompt's `docs:` commit, whose parent is `a93e6cca6`
(the discovery report). Check `pwd`, the branch, `git log -2` and a clean `git status`; otherwise stop with `Outcome:
blocked`. Model and tier: heavy, effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-11-16-0232 · session <id>]`; final line `Outcome: done | hard-stop | question |
blocked`. Every question carries `Recommended: <one line>`. Time limit 80 minutes.

- Context economy: windows of at most 50 lines; never a whole diff or log. Commit the code as soon as its gates are
  green. At the ceiling, `handoff.md` in the lane folder and `Outcome: hard-stop`.
- Code and docs in separate commits (RC-13). Subjects at most 72 characters, `Model:` trailer. No push, no merge.
- Files (rule 19, confirmed here): `frontend/src/model/ontological/bindingCodec.ts`, `bindingReader.ts`,
  `bindingCheck.ts` and their three tests under `frontend/src/model/ontological/__tests__/`. Nothing else in `src/`.

## Source

`docs/discovery/discovery_2026-11-16_onto_multilevel_level_potency.md` §3.1, §4 (probe A and B), §5, §6 **L1**, §7.
Answers adopted (the chat, unattended, on Alfonso's 02:00 instruction):
- Q1: exact-level deep instantiation (DeepJava): a field with potency p becomes a slot exactly p levels below.
- Q2: the level is derived (depth of the type chain from 0 at the top); no `level` role.
- Q3: two plain id roles, `potency` and `featurePotency`, written after `featureSources` (probe A: byte-equal round trip
  of today's UML and DCN bags, and old-build compatibility).
- Q7: a field with potency below 1 or above its owner's potency never becomes a slot; a `potency` warning.
- Q12: `featurePotency` together with `featureSources` is a check defect until a front needs both.
- Default potency 1 reproduces R-OI-3 (two levels exactly as today).

## COSA

1. Codec: the two roles after `featureSources`, optional; byte-equal re-encode of the UML bag, the DCN bag and the DCN
   bag with foreign keys (pin their bytes in tests, from probe A's shapes).
2. Reader: `typeChain`, `ontoLevel` (derived), `clabjectPotency` (derived from the type; a root without a value
   unbounded; potency 0 not instantiable), `dueFeatures` (exact-level rule; with no `featurePotency` it equals
   `featureClosure`, so UML and DCN dormancy, R-DCN-3, are unchanged); `slotDiff` on `dueFeatures`; the potency gate in
   `instantiableClassifiers`; a type cycle terminates as data.
3. Check: the rules of §3.1 (role sorts, Q7 warning, Q12 defect, type-cycle).
4. Tests: probe B as vitest (results quoted in §3.1 and §3.4, the 0.24 ms figure need not be asserted); mutation bench,
   each red and reverted, to `~/.jjodel-lanes/P-2026-11-16-0232/bench.txt`: `p === k` → `p <= k`, default 1 → 0, the
   no-role guard dropped. Gates: typecheck 0; `npx vitest run src/model/ontological` plus `instantiate.test.ts`,
   `linkInstance.test.ts`, `classElement.test.ts`, `instantiationToProblems.test.ts`, `dcnToProblems.test.ts` (207 before,
   all green after). Code commit.
5. Docs commit: in `docs/decisions.md` the **R-OI-1 amendment line** (Alfonso 2026-11-16 01:53-02:00: the third level and
   beyond are in scope through the potency roles of the instantiation STC, which stays separate from the simulator's STC,
   no shared catalog), **R-OI-25** (the two roles, after `featureSources`; level derived), **R-OI-26** (exact-level rule;
   default 1 reproduces R-OI-3), **R-OI-27** (level = depth of the type chain from 0 at the top; type cycle is an error),
   **R-OI-28** (clabject potency derived; root unbounded; potency 0 not instantiable); 2026-11-16, provisional,
   decided by the chat on Alfonso's instruction, reversible: branch; `parseRows` reads them. One entry in
   `docs/log-inbox/instance-of.md` for P-2026-11-16-0205 and this lane (the adopted answers Q1..Q12); flip `Status:` of
   both prompts. `check:docs` green.

## HARD STOP

After the docs commit with `Outcome: done` and a clean tree.

## RIFERIMENTI

The discovery report above; `docs/decisions.md` R-OI-1, R-OI-3, R-OI-6, R-OI-13, R-DCN-1, R-DCN-3; CLAUDE.md rules 11, 19.
