# JjTL: `parent` on the elements of `data`

Prompt-ID: P-2026-11-18-2330
Chat: C-2026-11-18-1815
Front: maintenance
Status: da eseguire
Lane: full (JjTL executor semantics, no UI)
Depends: P-2026-11-18-1815 (merged on the trunk at a4f62729e)
Request: https://claude.ai/code/session_01DQt9R56QsDvvpmBV3SoYap (Alfonso, 2026-11-18 23:26: «vai con il ticket a bassa priorità su `.parent` per gli elementi letti da `data`»)
Branch: `jjtl-data-parent`, from the tip of `alfonso-frontend-jjtl`, own worktree `~/jjodel-w-jjtl-data-parent`
Model: default from `.claude/settings.json`; no subagents, no background tasks; one probe run per tool call; commit as soon as the gates are green

Two-phase. Phase 1 is read-only and ends with a saved discovery report. Phase 2 follows in cascade, in the same session, unless the report hits an item of the stop-and-ask list.

## COSA

Close the ticket of 2026-11-18 «JjTL data elements carry no parent getter» (`docs/log-inbox/maintenance.md`, found in P-2026-11-18-1815). After P-2026-11-18-1815, `x.parent` resolves on the current instance, an alias, a helper parameter, a `forall` element and a `{ __ref }` handle, but not on an element reached through `data` (`data.filter(t => t.className == "Family").first().parent`, `data.first().parent`), because `initializeContext` binds `data` as `shallowToJjelValue(sourceModel)`, the raw source array, and its elements never pass through `sourceView`.

Goal: every element of `data` (and of the root `source`, the same array, and of `instances` / `classes` when bound) reads `.parent` exactly as the current instance does, through the same `sourceContainerOf` / `defineParentGetter` of P-2026-11-18-1815, without mutating the input model.

## DOVE

Phase 2 may touch only:

- `frontend/src/jjtl/executor/executor.ts` (`initializeContext` and the smallest helper needed)
- `frontend/src/jjtl/SPEC.md` (§7.3, §7.4: what `data` holds)
- `frontend/src/jjtl/executor/__tests__/parent-and-helper-scope.test.ts` (new cases) or a new test file next to it
- `docs/claude-code-log.md` or `docs/log-inbox/maintenance.md` as the harness prescribes, the discovery report, this prompt's Status line

Anything else (the JjEL evaluator, `identity.ts`, the parser, ProjectEditor serialization, exported interfaces) is out of scope: stop and say so.

## COME

### Phase 1, discovery (read-only)

1. Reproduce the ticket on the trunk tip with a throwaway probe on the Families fixture of `source-object-identity.test.ts`, both parse paths: `data.filter(t => t.className == "Family").first().parent` for a Family (expected null: a root), `data.filter(t => t.className == "Member").first().parent.lastName` (expected the family name), a helper receiving a `data` element, a `forall` over `data.filter(...)`.
2. List every reader of the root bindings `data`, `source`, `instances`, `classes` in `executor.ts` and in the builtins it registers (`resolve`, the env builtins, called and lazy rules, `bindForAllElement`), and say for each whether it needs the raw object or tolerates a view (identity by id through `modelIdentityOf` / `asSourceElement`; trace keys by id).
3. Choose the binding: an array of views built once (`bindSourceValue` per element, cached in `sourceViews`), or a lazy alternative. Measure the cost on the largest fixture available (time to initialize and heap, before and after) and report the numbers.
4. Check the L-layer proxy path (`sourceModel` not an array) and say what changes there (expected: nothing).
5. Save the report to `docs/discovery/discovery_2026-11-18_jjtl_data_parent.md` (create the folder if missing), with `## 0. Answer in brief` first (P16), files read with full paths, probe results, the reader list, the measured cost, risks, «Decisions taken (unattended)» and «Decisions awaiting Alfonso». Commit it (docs only).

### Phase 2, implementation (in cascade)

1. Red tests first, both parse paths: the four probe cases of step 1; `data` elements still compare equal (`==`, `contains`) to the current instance and to `{ __ref }` handles; `resolve(data.filter(...).first(), "T")` still finds the rule target; `Object.keys` of a `data` element unchanged; the input model not mutated (no `parent` own property on the source objects after the run).
2. Implement; one code commit.
3. Update SPEC §7.3 and §7.4 in English, no em dashes.
4. Gates: `node scripts/run-quiet.mjs JJTL -- npx vitest run src/jjtl src/jjel` from `frontend/` (only the known `ai-prompt-sanitization` import failure allowed), `npm run typecheck` exit 0, `npm run build` exit 0. Run a mutation bench on the new code (remove the getter on `data` elements, the tests must go red) and record it in the commit message.
5. Closing docs commit: log entry (task) that names the ticket it closes, Status flip of this prompt.

## Stop and ask

- A reader of `data`, `source`, `instances` or `classes` needs the raw object and a view breaks it, with no fix inside the DOVE.
- The measured initialization cost on the largest fixture grows by more than 2x.
- An exported interface changes, or a file outside the DOVE is needed.

## Lane discipline

- `git add <specific files>` or `git commit -- <paths>` only; conventional commits in English, e.g. `fix(jjtl): parent on the elements of data (P-2026-11-18-2330)`.
- At the end replace `Status: da eseguire` with date, lane and shas, in the closing docs commit.
- Close with `Outcome: done | hard-stop | question | blocked`.

## RIFERIMENTI

- Ticket «JjTL data elements carry no parent getter», `docs/log-inbox/maintenance.md`
- `docs/discovery/discovery_2026-11-18_jjtl_parent_and_helper_scope.md` (§7.1, §8 risk 2, §10.4)
- `frontend/src/jjtl/executor/executor.ts`: `initializeContext`, `sourceView`, `sourceContainerOf`, `defineParentGetter`, `bindSourceValue`, `bindForAllElement`
- `frontend/src/jjtl/executor/__tests__/parent-and-helper-scope.test.ts`, `source-object-identity.test.ts`
- `frontend/src/jjtl/SPEC.md` §3.4, §4.2, §7.3, §7.4
