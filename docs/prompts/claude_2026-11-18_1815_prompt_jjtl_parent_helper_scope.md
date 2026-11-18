# JjTL: `parent` as a property of source objects, lexical scope for helpers

Prompt-ID: P-2026-11-18-1815
Chat: C-2026-11-18-1815
Front: maintenance
Status: da eseguire
Lane: full (language semantics change in the JjTL executor)
Depends: none
Request: https://claude.ai/code/session_01DQt9R56QsDvvpmBV3SoYap (Alfonso, 2026-11-18 18:03-18:12: a helper reading m.parent.mother == m returns false while the same test works as a guard; «procedi»)
Branch: `jjtl-parent-scope`, from the tip of `alfonso-frontend-jjtl`, own worktree `~/jjodel-w-jjtl-parent`
Model: default from `.claude/settings.json`; no subagents, no background tasks; one probe run per tool call

Two-phase. Phase 1 is read-only and ends with a saved discovery report and a hard stop. Phase 2 follows in cascade only if the report raises no item from the stop-and-ask list below.

## COSA

Alfonso found that this helper always returns false on the Families2Persons gallery case:

```jjtl
helper isFemale(m : Member) -> Boolean {
   m.parent.mother == m
}
Member m -> Female where isFemale(m) { fullName := firstName }
```

while `helper isFemale(m : Member) -> Boolean { true }` works, and `parent.mother == self` works as a rule guard.

Reading of the code by the project chat (not yet confirmed by a run, confirm it first):

1. `parent` is not a property of source objects. `createInstanceContext` (`frontend/src/jjtl/executor/executor.ts`, around line 2945) binds the bare name `parent` for the current source instance only, from its `_containerId`. A serialized Member has `_containerId` and no `parent` field, so `m.parent` reads a missing property: null, then `null.mother`, then `false`. The same holds in a guard: `self.parent` or `alias.parent` should be null there too; only the bare name works.
2. Helpers are dynamically scoped. `createHelperFunction` evaluates the body in `ctx.child(params)`, where `ctx` is the caller's context, so the caller's `parent`, `self`, `source`, alias and instance attributes are visible inside the body. `parent.mother == m` inside the helper works by accident, only when the argument is the rule's own instance. SPEC §3.4 says each helper sees its own parameters only.

Goal after Phase 2:

- A. `x.parent` yields the container of any source object `x` (current instance, alias, helper parameter, `forall` element, handle of a `{ __ref }`), with the same resolution order `createInstanceContext` uses today: a user feature named `parent` wins; then `_containerId`; then `father` / `eContainer` / `owner`. The bare name `parent` keeps working unchanged.
- B. A helper body sees its parameters, the builtins and helpers, and `data`, nothing from the caller's instance context.

## DOVE

Phase 2 may touch only:

- `frontend/src/jjtl/executor/executor.ts` (`createInstanceContext`, `sourceView`, `liftSourceRefs`, `createHelperFunction`, and the smallest helper needed to share the container lookup)
- `frontend/src/jjtl/SPEC.md` (§3.4 scoping, §7.3 context binding, §4.2 the `parent` sentence)
- new test file `frontend/src/jjtl/executor/__tests__/parent-and-helper-scope.test.ts`
- `docs/claude-code-log.md`, the discovery report, this prompt's Status line

Anything else (the JjEL evaluator in `frontend/src/jjel/`, `identity.ts`, the parser, ProjectEditor serialization) is out of scope: if the fix needs it, stop and say so.

## COME

### Phase 1, discovery (read-only)

1. Confirm both readings with a probe test (not committed in Phase 1, or committed as the first red test if you prefer, stating which): reuse the SOURCE and TARGET of `frontend/src/jjtl/executor/__tests__/source-object-identity.test.ts` and run, on both parse paths (legacy, JjEL delegation): guard `parent.mother == m`; guard `m.parent.mother == m`; helper with `m.parent.mother == m`; helper with bare `parent.mother == m`; helper `true`. Report the Female set and warnings of each.
2. Measure who depends on dynamic scope: every helper in the JjTL tests, fixtures, gallery templates and `docs/` examples whose body reads a name that is neither a parameter, a builtin, a helper nor `data`. List them with path and line.
3. Establish where `data` is bound today (instance context or root `evalContext`) and what a helper sees when called from a `let`, a `forall`, a called rule, a lazy rule.
4. For goal A, decide where the `parent` getter goes so that it survives `shallowToJjelValue`, stays out of key walks (non-enumerable, like the getters of `liftSourceRefs`), does not loop on cycles (`member.parent.daughters[0].parent`), and keeps `==` deciding by id (`modelIdentityOf`). Check the cache in `sourceViews` and `sourceRefHandles`: views today are the object itself when nothing changed (`changed ? view : obj`).
5. Save the report to `docs/discovery/discovery_2026-11-18_jjtl_parent_and_helper_scope.md` (create `docs/discovery/` if missing). Minimum content: objective, files read with full paths, probe results, the dynamic-scope dependency list, the proposed change for A and B, risks, questions for Alfonso, and the two sections «Decisions taken (unattended)» and «Decisions awaiting Alfonso».

Hard stop after the report is written and committed (docs only).

### Phase 2, implementation

1. Red tests first in `parent-and-helper-scope.test.ts`, both parse paths: the Families split through a helper using `m.parent`; `self.parent` and alias `.parent` in a guard; `.parent` on a `forall` element and on a `{ __ref }` handle; a user feature named `parent` still wins; a helper reading `self` or an instance attribute no longer sees the caller's (expected result decided in the report); the bare `parent` guard of `source-object-identity.test.ts` unchanged.
2. Implement A, then B, as two commits.
3. Update SPEC §3.4, §4.2, §7.3 in English, no em dashes.
4. Gates: the whole JjTL and JjEL suites green (`npx vitest run src/jjtl src/jjel` from `frontend/`), `npm run build` clean. Commit as soon as the gates are green.

## Stop and ask

- Any helper in the gallery templates or shipped examples that breaks under B: list them and stop before B (A may land alone).
- The fix for A needs a change in `frontend/src/jjel/` or in ProjectEditor serialization.
- An exported interface changes.

## Lane discipline

- `git add <specific files>` only; conventional commits in English, one line, e.g. `fix(jjtl): parent as a property of source objects (P-2026-11-18-1815)` and `fix(jjtl): lexical scope for helper bodies (P-2026-11-18-1815)`.
- Entry in `docs/claude-code-log.md` at the end, in the standard format.
- At the end replace `Status: da eseguire` in this file with date, lane and shas, in the same docs-only commit as the log entry.
- Close with `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- `frontend/src/jjtl/SPEC.md` §3.4, §4.2, §5.3.1, §7.3
- `frontend/src/jjtl/executor/executor.ts`: `createInstanceContext`, `sourceView`, `liftSourceRefs`, `bindSourceValue`, `createHelperFunction`, `registerHelpers`
- `frontend/src/jjtl/executor/__tests__/source-object-identity.test.ts` (Families fixture, P-2026-11-17-2219)
- `frontend/src/jjel/evaluator/identity.ts` (read only)
