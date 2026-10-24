# Discovery — refactoring operations that migrate instance data (extract superclass, pull up, move, rename)

- Prompt-ID: P-2026-10-24-2321 (`docs/prompts/claude_2026-10-24_2321_prompt_refactoring_operations_discovery.md`)
- Chat: C-2026-10-24-0020 · front `jjodie-ui` · lane discovery, read-only, hard stop
- Session: rfb-disc (the harness exposes no session id)
- Tree: `~/jjodel-w-jjp-rfb`, branch `jjp-rfb`, HEAD `6b71ac8d8` at start, clean
- Executor model: claude-opus-5-5 (Opus 5.5)
- Design reference: canvas board «Refactoring B · Refactoring operations that keep instance data»

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real
files. Every claim below is **read** (source read on `6b71ac8d8`) unless tagged **measured**; no run was made in
this phase (no dev server, no probe, per the prompt).

## 0. Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | Deleting an M2 attribute drops the slot values of every conforming model, and re-adding it on a superclass does not restore them. | **Holds** (§1.1, §1.2) |
| H2 | Renaming an M2 class or feature keeps the slot values. | **Holds** for the values (ids are stable); **partly** for the project: textual artifacts are not rewritten (§1.3) |
| H3 | Moving a feature or adding a superclass keeps the values. | **Partly**: a new superclass adds empty slots and keeps the old ones; a move through JjScript `move` most likely does not move the feature at all (§1.4, §1.5) |
| H4 | One JjScript command can carry the M2 change and the M1 migration in a single TRANSACTION without touching the critical zone. | **Falsified for "single TRANSACTION"**, **holds for "single undo step"** and for "no critical-zone file" (§2.2, §4) |
| H5 | R-JJD-6's undo group folds an M2 change and its M1 migration into one step. | **Holds** on the Apply path of the preview bar, with two caveats (§4) |

## 1. Co-evolution today

### 1.1 The D-layer cascade on delete

`frontend/src/common/Dummy.ts:249-253` — deleting an M2 feature deletes every DValue bound to it; deleting a
class orphans its objects:

```
case 'instanceof': // orphan DObject instances (C.3); delete other instanceof dependents (DValue slots)
    if (dObj.className === 'DObject')
        SetFieldAction.new(dObj.id, 'instanceof', '', '', true);  // orphan: clear instanceof, do not delete
    else
        lObj.delete();
```

`Dummy.ts:196-203` — an attribute typed by a deleted class falls back to EString; a reference typed by it is
deleted, cascading to its M1 slots:

```
case 'DParameter': case 'DAttribute': lObj.type = 'Pointer_ESTRING'; break;
case 'DReference':
    // incoming reference to a deleted class → delete it at M2.
    // cascades to its M1 DValue slots via case 'instanceof' (else branch, preserved by 2c).
    lObj.delete();
```

So: attribute or reference delete → values gone; class delete → objects kept but `instanceof` cleared, their
slots for the class's own features gone with the features.

### 1.2 The OrphanStore (the only value-preserving co-evolution)

`frontend/src/components/editor-v2/hooks/useOrphanFeatures.ts`:

- module-level, session-only, outside Redux (`:29-30` «session-local, lost on reload/unmount, immune to undo/redo
  state oscillation»; the map at `:60`);
- keyed by the **owning class id** plus name and type (`:62-64` ``return `${classId}::${attrName}::${attrType}`;``);
- attributes only (`:49-57`, `kind: 'attribute'`); references are never captured;
- filled only by `captureAttributeOrphanValues` (`:86`), whose single caller is the canvas path
  `canvasToJjom.ts:864` inside `syncRemoveAttribute` (`:854-873`);
- consumed by `tryRehydrate` (`:248-286`) when a tuple with the same `{classId, attrName, attrType}` appears,
  writing `SetFieldAction.new(dValueId, 'values', savedValues, '', false)` (`:276-282`) inside a
  `TRANSACTION('editor-v2 attribute co-evolution', …)` (`:323`).

Consequences, all read:

1. **Re-adding on a superclass never restores**: the key carries the old owner's id, the re-added attribute lives
   on another class, `orphanStore.get(key)` (`:261`) misses. This is exactly the failure the prompt describes.
2. **JjScript `delete` never captures.** `jjscript/executor/commands/delete.ts:144-149` calls
   `deleteCanvasVerticesForModel(elementId); element.delete();` and nothing else. Search:
   `command grep -rn 'Orphan' frontend/src/jjscript/executor` → empty; positive control through the same tool,
   `command grep -rln 'executeDelete' frontend/src/jjscript/executor` → 3 files (`executor.ts`, two tests).
3. Reference values, `isPointer=false` on the rehydrate write (`:280-281`), and the session-only lifetime make the
   OrphanStore unsuitable as the migration mechanism of a refactoring. It stays what it is: a safety net for the
   canvas delete/re-add gesture.

### 1.3 Rename

`useOrphanFeatures.ts:23-27`: «RENAME of an attribute is transparent: DAttribute.id is stable». M1 slots point at
the feature by id (`DValue.instanceof`), objects at the class by id (`DObject.instanceof`), so a rename of a class,
attribute or reference keeps every value. JjScript `rename` already exists and goes through the L-setter with the
M2 uniqueness check (`rename.ts:113-144`, «Perform rename through the L-layer setter, not a direct SetFieldAction»).

What a rename does **not** do: rewrite names held as text (JjEL constraints, JjTL transformations, view
`jsxString`, saved scripts). Search: `command grep -rln -i 'renameRefactor\|rewriteNameIn\|updateReferencesOnRename\|propagateRename\|onRename'`
over `frontend/src` → 8 files, all UI renames of palettes, transformations and megamodel nodes
(`EditorV2.tsx:5028`, `ProjectEditor.tsx:2877`, `:3068`, `TransformationsList.tsx:13`), none on M2 names.
Positive control, same tool: `checkM2NameUniqueness` → 3 files. This is a search over identifier names, not a
proof that no name rewriting exists under another name; it is reported as such.

### 1.4 A new superclass on the owner

`LModelElement.tsx:3519-3547` (`set_extends`) and `:3670-3675` (`impl_addExtend`) both run
`this._fixExtendInstances(c, list)` inside their TRANSACTION. `_fixExtendInstances` (`:3607-3640`), for every
subclass and every instance:

```
for (let added of deepFeatureAddedID) {
    if (allChildTypesId.includes(added)) continue;
    o.addValue(undefined, added, [], true);
}
for (let removed of deepFeatureRemovedID) {
    ...
    if (!lval.isMirage) continue;
    lval.delete();
}
```

So: adding a superclass gives every instance an **empty** slot for each inherited feature and keeps its own
slots; removing a superclass deletes only the still-empty (`isMirage`) inherited slots and keeps the filled ones
as slots whose feature is no longer in the class. Values are preserved, but nothing is merged: after
`Person extends NamedElement` with `name` on both, a Person instance carries two `name` slots, its own filled and
the inherited empty one. `_canExtend` checks homonymous **operations** only (`:3580` «attibuti omonimi string e
boolean non possono overridarsi», the check itself at `:3589-3591` reads `op.name`), so the shadowing is not
refused.

New features: `joiner/classes.ts:750-758` — adding a feature to a class creates an empty DValue on every instance
of the class and its subclasses (`_DValue.new3({name: undefined, instanceof: thiss.id, father: instanceObjPtr}, …)`).

### 1.5 Moving a feature

- **L-layer** `set_father` (`LModelElement.tsx:754-769`) moves the element: `father`, the old owner's collection
  `-=`, the new owner's `+=`. It touches no DValue. Since the feature id is stable, the existing slots of the old
  owner's instances keep their values, but nobody adds slots to the new owner's other instances or subclasses.
  For a pull-up into a superclass the old owner is a subclass, so its instances keep their values and the
  superclass's other subclasses get no slot (a later `_forceConformity` on load or a later extends would add an
  empty one).
- **JjScript `move`** (`commands/move.ts:90-92`) writes the raw field:
  `SetFieldAction.new(targetElement, 'parent', toElement.id, undefined, true);`. A raw SetFieldAction bypasses
  `set_parent`/`set_father` (`LModelElement.tsx:803-812`, which would write `father`), so `father` and the two
  `attributes`/`references` collections do not change. **Read, not executed**: most likely inert for M2 features;
  slice S0 measures it. `validateMove` accepts attribute/reference → class (`move.ts:152-171`).
- **Type and multiplicity**: `set_type` writes only `type` (`LModelElement.tsx:1545-1547`); `set_upperBound`
  writes `upperBound`, and `lowerBound` when needed (`:1598-1608`). Existing slot values are not converted or
  truncated: they stay, now non-conforming.

### 1.6 Summary of question 1

| M2 change | M1 values today |
|-----------|-----------------|
| delete attribute | lost; restorable only by a canvas delete + canvas/JjScript re-add on the **same class**, same name and type, same session |
| delete reference | lost, never restorable |
| delete class | objects kept, `instanceof` cleared, slots of its features lost |
| rename class/feature | kept (id-based); textual references not rewritten |
| move feature (L `set_father`) | kept on the old owner's instances; no slots added elsewhere |
| move feature (JjScript `move`) | probably no M2 change at all (to measure) |
| add superclass | kept, plus empty inherited slots (duplicates on homonyms) |
| remove superclass | kept if filled (dangling slot), empty ones deleted |
| change type / multiplicity | kept unchanged, possibly non-conforming |

## 2. JjScript: where a command family goes

### 2.1 The pipeline

- **Words**: `jjscript/reservedIdentifiers.ts:19-24` `JJSCRIPT_COMMAND_WORDS` (the one list; `types.ts:590`
  `COMMANDS = [...JJSCRIPT_COMMAND_WORDS]`). A new word is reserved, exact and lowercase, and the Jodie gate
  (`reservedIdentifierGate.ts`, `reservedIdentifiers.ts:7`) refuses it as an identifier.
- **AST**: `types.ts:42-64` `CommandType` union and one `…Args` interface per command (`:131` create, `:187`
  rename, …).
- **Parser**: `parser/parser.ts:190-196` (non-COMMAND tokens fall to JjEL `eval`), the switch from `:200`, one
  `parse…Command` per command; unknown → `throw` (`:258-259`).
- **Executor**: `executor/executor.ts:161-231`, one `case` per command, `await execute…(args, context)`; handlers
  live in `executor/commands/` and are re-exported by `commands/index.ts`.
- **Planner**: `executor/effectsPlanner.ts`, `planCommand` switch (`:877-…`), M2 planners `planM2Create` …
  `planM2Abstract` (`:694-864`). `EffectsPlan` (`:205-219`) has no field for M1 migrations or losses. Declared
  limit (`:43-44`): «`move`, `copy` and an M2 `remove` are `unsupported`; a `delete` lists the contained elements
  it cascades to but not the incoming links it clears». `planM2Delete` (`:823-835`) reports contained M2
  elements only, never M1 slots.
- **World**: `planWorld.ts:106-117` — on an M2 editor `buildPlanWorld` reads classes and the metamodel and
  returns with `elements: []`: the planner of an M2 script sees **no M1 data**. A refactoring planner needs a new
  read: the conforming models of the metamodel and, per feature, the slots that hold a value.

Proposed placement: one family under `jjscript/executor/commands/refactor/` (one file per operation plus a shared
`migrate.ts`), its pure planner in `jjscript/executor/refactorPlanner.ts` called from `planCommand`, the M1 census
added to `planWorld.ts` behind an option so the M1 editor's world is unchanged.

### 2.2 One TRANSACTION or one undo step

`redux/action/action.ts:207-226`: actions queue until the outermost `END`, and the comment at `:207` and
`:234` («NB: cannot call store.getState while inside») says reads inside a TRANSACTION see the pre-transaction
state. Two consequences for an extract or pull-up:

1. The slots auto-created by `classes.ts:758` and `_fixExtendInstances` are not in `idlookup` until the
   TRANSACTION ends, so their ids cannot be looked up to copy values into them in the same TRANSACTION.
2. The delete cascade (`Dummy.ts`) walks the committed `pointedBy`. Deleting `Role.name` in the same TRANSACTION
   that re-points or copies its slots acts on the old state: a slot re-pointed in the same TRANSACTION would still
   be deleted.

So the operation runs as **ordered steps, each its own TRANSACTION, with a settle between them** (the pattern
`PreviewBar.tsx:47-53` `flushPendingCommit` already uses), grouped into one undo step (§4). Rule 12 is not at
stake: the steps create M2 elements through the L-layer (`DClass`, features) and write `SetFieldAction`s on M1
slots; no `DVertex.new`/`DVoidEdge.new2/new3` is called, the canvas follows through `useJjomSync` as for any
JjScript `create`. No file of the §3.1 table needs to change: `jjscript/` is outside it, and the migration does
not need `canvasToJjom.ts` or `useOrphanFeatures.ts`.

### 2.3 M1 migration mechanism: copy, not re-point

Two ways to carry values from `Role.name` to the new `NamedElement.name`:

- **Copy** into the auto-created empty slot: `SetFieldAction` on `DValue.values` (what `tryRehydrate` does,
  `useOrphanFeatures.ts:276-282`), with the pointer flag for references, then delete the old feature (its
  slots die by cascade). Ordinary actions, no core change.
- **Re-point** the old slot's `instanceof` to the kept feature: `LValue.set_instanceof` is refused on purpose
  (`LModelElement.tsx:7527-7528`, `this.cannotSet("LValue.set instanceof")`), so this needs a raw
  `SetFieldAction` on a pointer field the L-layer forbids. Keeps DValue ids (and any edge whose `model` is the
  slot) but bypasses a deliberate guard.

Recommendation: copy (R-RFB-2 below). Open risk for both, **read, not traced**: a containment reference's
contained objects have the slot as `father` (`effectsPlanner.ts:93` «The slot that is its father, when it is a
contained instance»); copying the ids into the new slot without re-fathering the children, then deleting the old
slot, may cascade over the children. The migration must re-father contained objects before the delete; S0
measures what the cascade does.

## 3. The operations

For each: M2 change, M1 migration, loss cases, what the planner reports before Apply. "Census" means the per-model
count of instances and filled slots, read from every model conforming to the metamodel.

**3.1 `rename Person to Employee`** (exists, `rename.ts`)
- M2: name only. M1: none. Loss: none.
- Report: the textual occurrences of the old name in JjEL constraints, JjTL transformations, views and scripts of
  the project, as warnings (§1.3: nothing rewrites them).

**3.2 `pull up name from Person, Role`**
- Precondition: Person and Role share a direct superclass S, and S has no feature `name`; otherwise error, with
  `extract abstract superclass` suggested when there is none.
- M2: keep the first feature (Person.name) and `set_father` it to S; delete Role.name.
- M1: copy each Role instance's `name` values into its inherited slot (step order: move, settle, ensure slots on
  every instance of S and its subclasses — set_father adds none, §1.5 — settle, copy, settle, delete Role.name).
- Loss: none if the homonyms agree on type and multiplicity. Type mismatch → refuse. Multiplicity mismatch → the
  wider bound wins; report it. Other subclasses of S and concrete S instances gain an empty slot (not a loss;
  a `lowerBound ≥ 1` makes them non-conforming, reported).
- Report: per model, instances whose values move; new empty slots; conformance errors created.

**3.3 `extract abstract superclass NamedElement from Person, Role pull name`**
- M2: create abstract NamedElement in the common package (or the first class's package), `Person, Role extends
  NamedElement`, then 3.2 for each pulled feature.
- M1: as 3.2. Ordering matters: extend first gives duplicate homonymous slots (§1.4) that the copy then folds;
  pull first then extend avoids the duplicate on Person. Either works if the last step deletes the old features.
- Loss: as 3.2. Extra cases: a class that already extends another class X — NamedElement is added beside X
  (multiple `extends`) or inserted under X; report which. A name clash with an existing classifier → refuse
  (`checkM2NameUniqueness`).
- Report: the new class, the new generalizations, then 3.2's census.

**3.4 `move attribute a from A to B via r`**
- Precondition: `r` is a reference of A typed B (or a supertype of B), upper 1.
- M2: `set_father` a to B (through the L-setter, not the current `move`), slots on B's instances.
- M1: for each A instance, copy `a` into the B instance that `r` points at; then delete A's slots (cascade of the
  move is none, so the old slots must be deleted explicitly, or re-created as part of the delete of the old
  feature if the move is implemented as create-new + copy + delete-old).
- Loss: A instances with `r` empty (value has no destination); two A instances pointing at the same B with
  different values (one wins); `r` many-valued (refuse).
- Report: values moved, values lost by reason (no target, conflict), per model.

**3.5 `push down a from S to A`**
- M2: move `a` from S to subclass A (or copy to several named subclasses).
- M1: A's instances keep their slots (same id). Instances of S itself and of S's other subclasses lose theirs.
- Loss: **always possible**; this is the lossy inverse of pull-up.
- Report: per model, the instances and filled slots that will be dropped, with the values; Apply requires the
  explicit acknowledgment of R-RFB-4.

**3.6 `inline class C into A`**
- Precondition: A has a reference `r` to C with upper 1, ideally containment; C has no other incoming references
  and no subclasses (otherwise refuse or report).
- M2: copy C's features into A (names must not clash), delete `r` and C.
- M1: for each A instance, copy the values of the C instance in `r` into the new slots, then delete the C
  instances.
- Loss: C instances not reached by any A (orphans), C instances shared by two As, incoming references to C from
  other classes (deleted by the `Dummy.ts:199-203` cascade), C's subclasses' extra features.
- Report: all of the above, counted per model.

**3.7 `set multiplicity of a in A to 0..1`**
- M2: `set_lowerBound`/`set_upperBound`.
- M1: narrowing the upper bound truncates slots holding more values; raising the lower bound creates violations
  on empty slots (no loss).
- Loss: the truncated values (which ones are kept: first by order; report it).
- Report: slots that will be truncated with the dropped values, slots that will violate the new lower bound.

**3.8 Type change** (not in the mockup, but in the prompt's loss list)
- `set_type` converts nothing today (§1.5). A refactoring form would convert: widening (EInt → ELong/EString)
  lossless, narrowing (EString → EInt) loses non-parsable values. Report each value that does not convert.

## 4. Undo (R-JJD-6)

`redux/reducer/reducer.ts:1125-1159`: `beginUndoGroup` marks `statehistory[user].undoable.length`; while open,
every delta of that user is pushed unmerged (`:1269-1273`); `endUndoGroup` folds the entries since the mark with
`composeUndoDeltas` into one; a nested begin only counts (`:1137`). The group spans transactions and time, not a
single TRANSACTION, so a multi-step refactoring (§2.2) folds into **one undo step**, M2 and M1 together, as long
as it runs inside it. The Apply path does so: `PreviewBar.tsx:56-66` `applyAsOneStep` → `beginUndoGroup();
… await applyScript(preview); … await flushPendingCommit(); await sleep(SETTLE_MS); await flushPendingCommit();
endUndoGroup();`. The deltas are whole-state, so the M1 changes in models of other tabs fold into the same entry.

Caveats (read):
1. Writes that land after the final settle (a late `useJjomSync` reaction, the `useOrphanFeatures` effect) fall
   outside the group as their own entry. R-JJD-11/R-JJD-12 already dealt with one such case («Create element»).
2. The OrphanStore is outside Redux (`useOrphanFeatures.ts:29-30`): an undo does not restore or clear its entries.
   Irrelevant if refactorings do not use it (R-RFB-2).
3. Only the preview's Apply is grouped. Whether the script editor's or Jodie's direct Run also opens a group was
   not checked in this window (question 3).

## 5. Slice plan

| Slice | Content | Files | Risk | Parallel with |
|-------|---------|-------|------|---------------|
| S0 probe | Measure on the live app: JjScript `move attribute` (does `father` change?), the cascade over children of a containment slot, the two orders of extract (§3.3); read-only probe script | `frontend/scripts/probe/refactor-s0.ts` (new) | none | S1 |
| S1 planner core | Pure `refactorPlanner.ts`: operation → steps + M1 census + losses; `EffectsPlan` gains optional `migrations`/`losses`; M2 world gains the census of conforming models | `effectsPlanner.ts`, `planWorld.ts`, `refactorPlanner.ts` (new), tests | low (pure) | S0, S2a |
| S2a grammar | Words, AST, parser for the family | `reservedIdentifiers.ts`, `types.ts`, `parser/parser.ts`, parser tests | low; reserved words (R-RFB-1) | S1 |
| S2b rename + pull up + extract | Executors with stepwise TRANSACTIONs and settle, copy migration | `commands/refactor/{pullUp,extract,migrate}.ts` (new), `commands/index.ts`, `executor.ts`, tests | medium | S3 (UI) after S1's types |
| S3 UI | Migration and loss chips on the refactoring page / script card, Apply gated on acknowledgment | `ScriptCard.tsx`, `PreviewBar.tsx`, `previewApplyCheck.ts` (planned/real per metaclass must count DValue copies) | low-medium | S2b |
| S4 lossy ops | move via, push down, set multiplicity, inline | `commands/refactor/{moveVia,pushDown,multiplicity,inline}.ts` | high (data loss) | after S2b |
| S5 type change | conversion table and its losses | `commands/refactor/retype.ts` | medium | S4 |

Order by value and risk: rename warnings (already 90% there) → pull up → extract → set multiplicity → move via →
push down → inline → type change. S0, S1 and S2a can run in parallel; S2b needs S1 and S2a; S3 needs S1's types.
No slice touches a §3.1 file, so no Layer Impact Report is expected; S2b must still stop and report if the canvas
needs a hand (rule 20).

## 6. Questions

1. Should `push down`, `inline`, narrowing multiplicity and type change ship at all in the first release, or only
   the lossless three (rename, pull up, extract)?
2. Does a refactoring migrate every conforming model of the project, or only the models the user ticks?
3. Do Jodie's Run and the script editor's Run open an undo group, or only the preview's Apply?
4. Is a slot left behind by a removed superclass (§1.4, filled slot kept) a bug to fix or a feature to keep?

## Decisions taken (unattended)

- U1. No probe was run: the prompt makes the lane read-only with no dev server, so every claim is **read**; the
  three behaviours that matter most (JjScript `move` on a feature, the containment cascade, the extract order)
  are left to S0.
- U2. "One command in a single TRANSACTION" is answered as falsified by reading `action.ts:207-226`, without a
  bench; the plan builds on stepwise TRANSACTIONs inside one undo group.
- U3. The type change (§3.8) is added to the operation list because the prompt names it among the loss cases.
- U4. The report, the log entry and the prompt's Status go in one docs commit, as the prompt asks (the skill's
  "commit of its own" is read as "docs only, no code").

## Decisions awaiting Alfonso

- **R-RFB-1 — syntax.** Bare verbs as in the mockup (`extract`, `pull`, `push`, `inline` become reserved words,
  `rename`/`move`/`set` reused) vs one prefix word (`refactor pull up …`, one new reserved word).
  *Recommendation*: bare verbs, after S2a counts identifiers named `extract|pull|push|inline` in the bundled
  examples; fall back to the prefix if any is found.
- **R-RFB-2 — M1 migration mechanism.** Copy values into the new slots and delete the old feature, vs re-point
  `DValue.instanceof` through a raw SetFieldAction the L-layer refuses. *Recommendation*: copy; no guard bypassed,
  no core change.
- **R-RFB-3 — execution unit.** One refactoring = ordered steps, one TRANSACTION each with a settle, inside one
  R-JJD-6 undo group; never a single TRANSACTION. *Recommendation*: accept.
- **R-RFB-4 — lossy operations.** The planner lists every value that will be lost, per model, and Apply stays
  disabled until the user acknowledges the loss in the preview; no `force` keyword in the script.
  *Recommendation*: accept; lossless operations apply with no extra step.
- **R-RFB-5 — scope of migration.** Every model of the project conforming to the metamodel, listed in the plan.
  *Recommendation*: all conforming models, none skippable in the first release (question 2).
- **R-RFB-6 — existing `move`.** Leave the generic `move` as is (packages, classes) and give `move attribute …
  from … to … via …` its own parse path through `set_father`; the fix of the current `move` on features waits
  for S0's measurement. *Recommendation*: accept.
- **R-RFB-7 — textual references on rename.** Warn with the occurrences, do not rewrite.
  *Recommendation*: warn only in this front; a rewriting rename is its own discovery.
- **R-RFB-8 — first release.** rename warnings, pull up, extract, set multiplicity (with loss report) first;
  move via, push down, inline, type change after. *Recommendation*: accept.
