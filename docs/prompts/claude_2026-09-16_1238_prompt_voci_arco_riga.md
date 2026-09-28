# Create edge view and create row view: the two entries, after the host retake

Date: 2026-09-16 12:38 (Europe/Rome)
Type: feat (view creation)
Branch: `validation-skeleton` in `/Users/alfonso/jjodel`
Effort: xhigh
Two-phase: NO. Both preconditions of the previous prompt have been measured (report `dbfeb67ac`);
this slice implements the retaken decision. If the code contradicts the facts below, STOP.

## La ripresa della decisione

Precondition 1 failed, and better than expected: there is no plain reference row inside the node at
all. `ClassNode` renders references only as cross-metamodel ghost chips; an ordinary reference lives
on the canvas as its edge. An entry in the `ref` branch of the child menu would therefore have been
invisible in the ordinary case. The retake, decided on that measurement:

1. **The edge view entry goes on the reference edge menu** (`EditorV2.tsx:3357-3374`), which is
   reachable on a plain reference, already carries «Delete reference», and holds the `DReference` id
   as `edge.data.reference.id`. Right-clicking the arrow you want to give a notation to is also the
   gesture that explains itself.
2. **The row view entry proceeds alone in the `attr` branch of the child menu**, which is alive. Its
   limit is declared and not worked around: the rows exist only when `notation !== 'er'` and the
   body is shown (`notation !== 'compact'`), so in ER and compact notations there is no entry. Say
   it in the log entry. Adding a second host for those notations would multiply the hosts again and
   is not part of this slice.
3. **The two creator branches get written regardless**, because both hosts need them and they are
   the same two branches wherever the entries sit.

Precondition 2 passed: `newDefault` derives `appliableTo` from the seed's kind through
`appliableToForIRKind` (`view.tsx:181-188`), applied in the `new2` callback at `:514-517`. So
`DReference` gives `ir.kind: 'edge'` and `appliableTo: 'Edge'`, `DAttribute` gives `ir.kind: 'row'`
and `appliableTo: 'Field'`. Established mapping, nothing invented.

## COSA

`createViewInWorkbench` (`utils/lastViewpoint.ts:234`) gains the two missing branches of its switch,
mirroring `newDefault` and inventing nothing:

- `DReference`: the edge seed whose `metaclasses` is the OWNER class, read through `father` exactly
  as `newDefault` reads it (`view.tsx:478-491`), falling back to no metaclass when the owner does
  not resolve, as it already does. `appliableTo` from `appliableToForIRKind`.
- `DAttribute`: the row seed with no metaclass, which is how `newDefault` builds it (the author
  picks the metaclass later in `RowAuthoringPanel`). `appliableTo` from `appliableToForIRKind`.
- `oclCondition`: write exactly what `newDefault` writes for those two branches. If it writes none,
  write none. The two creators must be indistinguishable in their output.
- Prefer importing `appliableToForIRKind` over repeating its values. If the import raises a cycle in
  the build, fall back to the two literals with a comment naming the helper, and say so in the log.

Then the two entries, both gated on `hasCreatableViewpoint()` and both passing the resolved viewpoint
id as the 4th argument, resolved ONCE, exactly as the three entries fixed before them:

- «Create edge view» on the reference edge menu, beside «Delete reference».
- «Create row view» in the `attr` branch of the child menu, beside «Delete Attribute».

## DOVE

- `frontend/src/utils/lastViewpoint.ts` (the two branches)
- `frontend/src/components/editor-v2/EditorV2.tsx` (the two entries)
- `docs/log-inbox/views.md`, in its own commit

Out of scope: the ghost chip branch (a cross-metamodel reference keeps only «Delete reference» for
now), a row entry for the ER and compact notations, `newDefault` and its signature, the classic
`ContextMenu`, `resolveParentViewpoint` and its chain.

## Criteri di accettazione

1. Right-clicking a plain reference edge offers «Create edge view»; the created view has
   `ir.kind === 'edge'`, `appliableTo: 'Edge'`, its `metaclasses` is the owner class, and it lands in
   the active viewpoint.
2. Right-clicking an attribute row offers «Create row view»; the created view has `ir.kind === 'row'`,
   `appliableTo: 'Field'`, no metaclass, same viewpoint.
3. **The strong check**: each created view is field by field identical to what
   `DViewElement.newDefault(<that D element>)` produces in a probe, except id, name and father. That
   is what «mirroring `newDefault`» has to mean, and it is mechanical.
4. With no non-system viewpoint active both entries are disabled and create nothing.
5. The `ir` is in the CREATE payload, with the control that must fail when the `ir` is written
   afterwards (the same control shape as the `+` slice, since `TRANSACTION` is async).
6. `npm run typecheck` at the same 33 with none in the touched files, vitest green, build clean.

## Disciplina di corsia

Log entry in `docs/log-inbox/views.md`, never the active log. Assert the branch before writing, stage
only your own files one by one, never `git add .`, docs and code in separate commits.
