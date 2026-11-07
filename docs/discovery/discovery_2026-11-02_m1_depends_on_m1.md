# Discovery: can an M1 model depend on another M1 model

Prompt-ID: P-2026-11-02-2021 · Chat: C-2026-11-02-1541 · Front: hw-notation · Date: 2026-11-02
Read-only. Probes in `~/.jjodel-lanes/P-2026-11-02-2021/probe/` (outside the repo, run with `lane-run probe`, ports
3217 to 3219); no product code touched. Answers question 4 of §9 of `discovery_2026-11-02_jjtl_generic_transformation.md`, which
decides C0 there and the cross-model reference of `discovery_2026-11-02_textual_notation_for_templates.md` (§4).

## 0. Answer in brief

Yes. An M1 can depend on another M1 **today, in the UI, and it survives save and reopen**. What is missing for C0 is
**one small change** in the Execute path: it reads the source objects without the cross option, so the reference to
the Library is serialised and then lost.

1. **Gesture.** The Info panel of a model has a "Dependencies" section with a multiselect "Depends from models"
   (`Info.tsx:523-537`). Driven for real: open `Brief` from the project tree, pick `Library` in that select, and
   `Brief.__raw.dependencies` reads `["Library"]`. Under it is the assignment `lmodel.dependencies = [ids]`
   (`Info.tsx:533`; `LModelElement.tsx:5252` leaves the default setter). The option list is every other `DModel` of the
   project, metamodels included (`["Mm","Library","Tgt"]` for `Brief`): nothing restricts it to M1 models or to ones that
   conform to the same metamodel.
2. **Reference and getters.** Yes, with the dependency declared. `Doc d1` in Brief takes `uses = i1` (an `Item` of
   Library) through `setValueAtPosition(0, id, {isPtr: true})`; the slot's L `values` resolves it to `i1` whose model is
   Library. Reading `Brief`: `allSubObjects` = [d1] (cross option off), `crossObjects` = [d1, i1],
   `allCrossSubObjects` = [i1, d1], `dependencies` = `allDependencies` = [Library]. `Library` itself sees nothing of
   Brief. The write does not need the dependency: it also succeeded **before** it was declared (the raw slot held
   `i1`), so the model does not guard the order.
3. **Save and reopen.** Intact. `ProjectsApi.save` (version 1.1, 13,208 characters of state), a page reload, the
   project opened again by id: `Brief.dependencies` = [Library], the slot still holds the pointer to `i1`
   (`i1@Library`), and every getter of item 2 reads the same.
4. **Delete and cycle.** *Delete the Library* (`model.delete()`, the call of `handleDeleteModel`): Library and `i1` go,
   `Brief.dependencies` becomes `[]` and the slot `uses` becomes `[]`, with no error and no message: the reference
   disappears silently. *Cycle* Brief <-> Library: accepted, no hang, no error. `allDependencies` of Brief then lists
   Brief itself ([Library, Brief]), and `crossObjects` repeats the model's own objects ([d1, i1, d1]);
   `allCrossSubObjects` stays deduplicated. A model that depends on itself is also accepted by the assignment (the UI
   list excludes it).
5. **Execute today.** Serialised, then lost. `ProjectEditor.tsx:1463-1464` reads `allSubObjects`, so only `d1` reaches
   the executor; `d1.uses` is serialised as `{__ref: <pointer of i1>}` (`wrapIfRef`, `:1398-1405`), and `i1` is not in the
   source set. The executor reports `Unresolved reference: ... points to an element no rule maps: it resolved to null
   (rule 'Doc -> TDoc', source element 'd1')` and the output `TDoc d1` has **no `uses` slot**. Adding an `Item -> TItem`
   rule changes nothing: Library objects are never source objects.

**For C0: works as is for the platform, needs a small change for Execute.** Name it: take the source objects from the
cross accessor, `allCrossSubObjects`, at `ProjectEditor.tsx:1463-1464` (the Execute path already filters nulls and
builds `_containerId` per object). Not measured here, so C0's lane must: that the `{__ref}` then resolves to the
`TItem` created for `i1` (A0 binds by identity, so it should), and the two points of §5.

## 1. Method

One real project per probe in a throwaway offline profile, 1440 x 900 viewport, own dev server. Metamodel `Mm` (`Item`;
`Doc` with `uses : Item [*]`), models `Brief` (object `d1 : Doc`) and `Library` (object `i1 : Item`), built through the
L-layer functions the Navbar itself uses (`createM2`, `createM1`, `DObject.new`). Probe 1 (Q1 to Q4, Q5 source data),
probe 2 (the gesture through the UI, then Execute through the real dialog with two programs), probe 3 (fresh L reads
for the cycle). A first read of the cycle in probe 1 gave `Library.allDependencies = []`: that was the probe reading a
stale proxy captured before the write, not the platform (CLAUDE.md §9 on stale mirrors); probe 3 re-read with fresh
proxies and is the one reported.

## 2. Q1: the gesture

`Info.model()` (`Info.tsx:488-543`) builds the options from `Selectors.getAll(DModel, ...)` minus the model itself,
and writes `l.dependencies = <selected ids>` on change. In probe 2 the page text contained "Depends from models" after a
click on `Brief` in the tree; the select was clicked, `Library` chosen, and the raw `dependencies` of Brief read
`["Library"]` (the probe's fallback to the API assignment did not fire: `how: "ui"`). The assignment form is the call to
name if a lane wants to do it without the UI.

## 3. Q2: reference and getters

| accessor on Brief | no dependency | dependency declared |
|---|---|---|
| `dependencies` / `allDependencies` | [] / [] | [Library] / [Library] |
| `objects` | [d1] | [d1] |
| `crossObjects` (`:5727`) | [d1] | [d1, i1] |
| `allSubObjects` (`:5862`) | [d1] | [d1] |
| `allCrossSubObjects` (`:5860`) | [d1] | [i1, d1] |

`_getallSub` with the cross flag admits an object whose model id is the model's own or one of `allDependencies`
(`:5882`); `get_allDependencies` closes transitively through `U.iterateChildProperties`, which keeps an already-parsed
set (`U.tsx:2707-2726`), which is why a cycle terminates. `get_objects` with the cross flag appends
`allDependencies.flatMap(dep => dep.objects)` to the model's own list without deduplicating (`:5730`), which is the
repeat of `d1` under a cycle. The generic editor allows cross-model targets when `dependencies.length > 0` (`:7184`,
`allowCrossRef`, then `m2.crossClasses`); read, not driven.

## 4. Q3 to Q5: measured as in §0

Delete: the slot and the dependency are cleaned together, which is consistent with the generic mechanism that deletes
every pointer to a removed element (`_jjdependencies`, `joiner/classes.ts:2168-2217`); read, not traced. Execute: probe 2,
program E1 (`Doc -> TDoc { name := name  uses := uses }`) and E2 (the same plus `Item -> TItem { name := name }`), source
`Brief`, target `Tgt` (`TItem`; `TDoc` with `uses : TItem [*]`): both `completed`, one warning each as quoted in §0, the
output model has `d1 : TDoc` with an empty slot list. The source-model select of the dialog offers both `Brief` and
`Library`, so a user can already run a transformation on a Library on its own.

## 5. Not measured

1. **A Library of another metamodel than the Brief's.** Both models here conform to `Mm`. In the hardware case the
   library will probably have its own metamodel; the reference type then lives in a model that `Brief`'s metamodel must
   itself depend on (`allowCrossRef` reads `m2.crossClasses`). Whether a reference typed across two metamodels can be
   written and survives was not run.
2. **Export.** Save and reopen was through the project store only. Ecore/XMI/JSON export and import of a model with a
   dependency were not run.
3. **C0 itself.** With `allCrossSubObjects` the executor would also receive Library objects whose class is matched by
   name against the rules; a Library `Item` would then be mapped by an `Item` rule whenever one exists. That is the
   wanted behaviour for C0, but it was not run.

## 6. Observations for the owner of the platform (none is a ticket yet)

- Removing the Library removes the reference with no signal (item 4).
- The dependency picker offers metamodels and unrelated models; a cycle and a self-dependency are accepted.
- `crossObjects` can repeat objects (cycle, self-dependency); `allCrossSubObjects` does not.
