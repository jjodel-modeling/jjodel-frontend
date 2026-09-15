# Discovery — `generateUniqueModelName` vs `uniqueModelName`

Date: 2026-09-14
Prompt: `docs/prompts/claude_2026-09-14_1632_prompt_lane_d_unique_model_name_delegation.md`
Base: `26d04febc` on `validation-skeleton`
Scope: read-only comparison, then the delegation it authorizes.

## 1. The two implementations

| | `generateUniqueModelName` | `uniqueModelName` |
|---|---|---|
| Where | `components/project/ProjectEditor.tsx:1359`, a local `const` inside the component body | `model/nameLookup.ts:78`, exported, zero imports |
| Signature | `(baseName: string, existingNames: string[]): string` | `(requested: string, taken: string[]): string` |
| Callers | one, `ProjectEditor.tsx:1630` (target model of a JjTL transformation) | `DModel.new`, `new2`, `new3` (`LModelElement.tsx:4987/4998/5012`), the static `DPointerTargetable.uniqueModelName` (`joiner/classes.ts:1509`) |

Correction to the prompt: `generateUniqueModelName` is **not exported**. It is a closure-local
`const` with one call site in the same file. The name and the signature stay as they are anyway.

## 2. Point 1 — the pool of taken names

Neither function derives its pool: **both take it as a parameter**. The pool is decided by the
caller.

- `DModel.new/new2/new3` pass `Selectors.getAll(DModel, ...).map(d => d.name)`: every DModel,
  metamodels and M1 models together, the same pool `LModel.set_name` compares against.
- `ProjectEditor.tsx:1612-1627` builds `existingNames` as: every `idlookup` entry with
  `className === 'DModel'` and a truthy `name` (fresh from the store), plus `models` and
  `metamodels` from component state as a fallback, deduplicated, falsy names dropped.

So the transformation caller passes all DModel names plus a fallback that can only add names
already created but not yet re-rendered. That is a superset of the `DModel.new` pool by
construction, and in any case the caller is not touched by this lane: delegating changes the
function that consumes the pool, not the pool.

Consequence already true before this lane and unchanged by it: `uniqueOutputName` then goes
into `DModel.new` (`ProjectEditor.tsx:1703`), which applies `uniqueModelName` again against its
own pool. A name already free in the superset is free in the subset, so the second pass returns
it unchanged.

→ The prompt's first branch applies: **delegate**.

## 3. Point 2 — the suffix format

Identical, token for token:

- same escape regex `/[.*+?^${}()|[\]\\]/g`;
- same pattern `^<escaped> \((\d+)\)$` (one space, parentheses, decimal);
- same scan for the **highest** existing `(n)`, return `max + 1`, starting from `(1)` when none;
- **gaps are not reused**: `['A', 'A (7)']` → `A (8)` in both (covered by
  `nameLookup.test.ts`, «riparte dal massimo esistente, non dal conteggio»);
- exact-case comparison (`includes`, no lowercasing) in both.

## 4. Point 3 — a base name that already ends with `(n)`

Identical: the base is taken literally, the pattern is anchored on the full escaped base, so
`'A (1)'` with `['A', 'A (1)']` gives `A (1) (1)` in both. No stripping of an existing suffix
on either side (covered by «un nome che gia' finisce in (n) e' base di se stesso»).

## 5. Differences, all on inputs where the old copy throws or is unreachable

`uniqueModelName` has three guards `generateUniqueModelName` lacks:

1. `if (!requested) return requested;` — old copy: `''` is never in `existingNames` (the caller
   filters falsy names), so it also returns `''`. Same answer.
2. `!Array.isArray(taken)` → return `requested` — old copy would throw on `.includes`. The
   caller always passes an array literal. Unreachable.
3. `typeof name === 'string'` before `.match` — old copy would throw `name.match is not a
   function` if a DModel carried a truthy non-string `name` **and** the requested name were
   taken. New copy skips that entry. The only observable difference is a crash that no longer
   happens on a malformed state.

No input on which both return a value and the values differ.

## 6. Residual, not in scope

The doc comments of `nameLookup.ts:67` and `joiner/classes.ts:1494` still say the scheme «is the
one `generateUniqueModelName` already applies». After delegation the direction is inverted
(`generateUniqueModelName` applies `uniqueModelName`'s scheme). Both files are outside this lane
(`nameLookup.ts` explicitly read-only); the comment stays true as a statement about the scheme
and can be adjusted by a later lane that touches those files.

## 7. Change

`ProjectEditor.tsx`: one import of `uniqueModelName` from `../../model/nameLookup`, the body of
`generateUniqueModelName` replaced by `return uniqueModelName(baseName, existingNames);`, JSDoc
adjusted to say it delegates. Call site untouched.
