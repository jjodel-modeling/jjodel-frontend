# Lane B2: Jjodie writes into the scope it showed (implementation)

Date: 2026-09-14 17:30
Type: fix, two-phase (Phase 1 discovery already exists; this adds a targeted confirming discovery + a hard checkpoint before Phase 2)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh

## Context and decision

Phase 1 discovery is done: `docs/discovery/discovery_2026-09-14_jjodie_metamodel_scope.md`. Read it in full first. Its finding: the Jjodie action executor (`JjodieActionExecutor`, `jjodie-integration/`) is dead code with no importer. The live write path is JjScript: `JjScriptService.execute`, reached from the Run block, the "input is already JjScript" offer, and JjScript mode. The defect survives in three forms:

- V1: no active artifact, the fallback picks `metamodels[0]`.
- V2 (TOCTOU): the scope is read at the Run click, not when the context shown to the model was built. Ask with B active, switch to A, click Run, the write lands in A.
- V3: the name exists only in another metamodel; the project-wide fallback finds it and writes there silently. The model can know that name from RAG fragments, which are project-wide and unqualified.

Decision taken in the project chat (2026-09-14): the write scope must equal the scope shown to the model. Implement option S (scope bound to the message and carried to Run), plus qualified names in the RAG context, plus V1 turned from a silent fallback into an explicit error. Do not implement option Q's model-qualification-only path. This lane does not touch or remove the dead executor; that is a separate lane.

## Parallel-lane discipline (applies to the whole prompt)

Other Claude Code sessions may run in this tree. Their uncommitted files are expected; never touch, stash, checkout or revert them. Never switch branch.

- Before any write, assert `git rev-parse --abbrev-ref HEAD` prints `validation-skeleton`. Otherwise stop and report.
- Read `CLAUDE.md` and `docs/claude-code-log.md` first.
- Stage only the files this prompt names, `git add <path>`. Never `git add .`, `-A`, `-u`.
- If a CLAUDE.md rule forces regenerating an artifact (for example §17 → `AGENTS.md`), that artifact is inside this lane's scope: stage it in the same commit and note it in the log. Do not let the strict file scope force a rule violation; widen to exactly that artifact.
- `docs/claude-code-log.md` is shared. Write your entry only at the very end, before the docs commit; stage it only if `git diff docs/claude-code-log.md` shows your entry alone.
- Cherry-pick to `alfonso-frontend-jjtl` is not part of this prompt.
- Gates: `tsc --noEmit` total (baseline 33 at `26d04febc`, other lanes may move it), 0 in each touched source, positive control with signal; the relevant `vitest` suite; build.

## Phase 1: targeted confirming discovery (read-only, report mandatory)

The 327-line report describes the shape. Confirm the exact edit points before touching anything, because Jjodie files are in `services/`, not `ai/`, and file names in the report must be re-checked against the tree. With `grep -rn` establish and record `file:line` for:

1. Where the metamodel scope is read at Run time (the S "read at click" site).
2. Where the context shown to the model is built (which metamodel, which class names, whether qualified) and where the message object lives, so a scope can be attached to it and survive until Run. Candidates from the report: `Jodie.tsx` / `jjodieProvider.ts`, `types/jodie.ts` (message type), `ChatMessages.tsx`.
3. The V1 fallback (`metamodels[0]` or equivalent) on the live path, in `create.ts` / `utils.ts` / `JjScriptService.ts`.
4. The RAG context construction (`JjodieRagService.ts`): where class names are emitted, to make them qualified `Metamodel::Name`.
5. How `create.ts` resolves a name today when it is absent from the active metamodel (the project-wide step where A1 fires), so the "out of scope = error or require qualification" rule can be placed precisely.
6. Whether an explicit `Metamodel::Name` in the user's/model's JjScript already resolves to that metamodel regardless of the active scope (it should, via `selectTarget`/`PROJECT_COLLECTIONS`). Confirm, because the escape hatch for a deliberate cross-metamodel write depends on it.

Save `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md` (objective, files read with full paths, the six answers with evidence, risks, open questions).

Hard checkpoint. Stop after the report and report in chat the six `file:line` sets and any surprise, before Phase 2. This is a behavior-changing area; do not proceed to implementation without a go-ahead.

## Phase 2: implementation (only after go-ahead)

Target behavior:

- The scope is captured when the context is built for a message, stored on the message (optional field on the message type, so old messages stay valid), and used at Run time instead of re-reading the current active artifact. This closes V2.
- V1: if no scope can be determined (no active artifact at build time and none on the message), the action is an explicit error with a clear message, not a write into `metamodels[0]`. No silent pick.
- Name resolution for a Jjodie-originated action resolves within the bound scope first. If the bare name is absent from that scope, do not silently fall through to a project-wide write: either error ("`Person` is not in `B`; qualify as `Metamodel::Person` to target another metamodel") or, if the name is plural across metamodels, raise the existing A1 ambiguity via `ambiguityMessage`. This closes V3. An explicit `Metamodel::Name` in the script still resolves to that metamodel (the deliberate escape hatch, confirmed in Phase 1 Q6).
- RAG context: class names emitted to the model are qualified `Metamodel::Name`. This is the cheap, useful half of option Q, so the model sees the grafie that resolve.
- No new dependency. No renaming of existing identifiers. Optional-only additions to TypeScript interfaces. Do not touch `resolvers.ts` beyond calling existing exports; the resolution rules live there already (`selectTarget`, `resolveTypeTarget`, `ambiguityMessage`, `QUALIFY_ADVICE`).

Tests: add behavior tests where the file is importable in the bench (`environment: 'node'`). `JjodieRagService.ts` qualification is likely unit-testable in isolation; the scope-on-message plumbing through `.tsx` is not (`window`). For the non-importable parts, do not add source-text tests; state the gap in the log entry. The scope-equals-shown rule and the out-of-scope-is-error rule, where they route through `resolvers.ts`, are covered by `resolvers.test.ts`; extend it if a new routing is introduced.

Commits, each with explicit paths, in order:
1. `fix: Jjodie writes into the scope shown to the model` (code + tests)
2. `docs: discovery report on Jjodie scope-fix targets` (the Phase 1 report, if not already committed in Phase 1; commit the report at the hard checkpoint instead, and skip this)
3. `docs: log entry for lane B2`

Report in chat: the message-type change, the V1 error site, the out-of-scope rule as implemented (error vs A1, and where), the RAG qualification diff, test counts, gates. Visual verification by Alfonso follows: the V1/V2/V3 scenarios in the report, plus the deliberate `Metamodel::Name` escape hatch.

## RIFERIMENTI

- `docs/discovery/discovery_2026-09-14_jjodie_metamodel_scope.md` (Phase 1, the six §5 questions)
- `docs/discovery/discovery_2026-09-11_name_resolution_scope.md` (inventory)
- Lane A1 (`a52dfe5f3`) for `ambiguityMessage` / `QUALIFY_ADVICE`; lane C (`3e3ab691a`) for `resolveTypeTarget`
- Decisions 2026-09-11 (`::`, one ambiguity rule) and 2026-09-14 (write scope == shown scope; live path only; dead code removed separately)
- `CLAUDE.md`: minimal diff, no renaming, log never amended, critical-zone discipline
