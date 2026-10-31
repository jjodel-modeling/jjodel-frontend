# Session 2026-10-31: hardware prototype bundle (chat C-2026-10-31-1328)

Written 2026-10-31 at 14:40 (Rome) by chat C-2026-10-31-1328 under `/lane auto`. Trunk `alfonso-frontend-jjtl`,
tip `5b19ebfc8`, untouched by this chat apart from this file. Input: a six-item bundle written while building a
model-driven chain for hardware controllers (two DSLs, a JjTL transformation, a generator printing nuXmv,
SystemVerilog and SVA), kept locally.

## State

- Items A (nested `-> feature { forall }` in the executor), B (nested materialization in the app) and F (Jjodie
  "reading 'match'") were already on the trunk (P-2026-10-30-1315, P-2026-10-30-1335, P-2026-10-30-1215): the bundle
  was measured on `3addb64`, 138 commits behind. Nothing ran for them.
- Six lanes ran, all `Outcome: done`, all on branches, none merged:

| Lane | Item | Branch (worktree) | Tip |
|---|---|---|---|
| P-2026-10-31-1340 | C, JjTL source collections resolved in expressions, rule alias in nested bodies, unresolved reads warned | `jjtl-expr-resolve` (`~/jjodel-w-jjtlexpr`) | `2d85e6ed0` |
| P-2026-10-31-1341 | D1, model origins for member reads inside `+` and `join` | `cg-origin-concat` (`~/jjodel-w-cgorigin`) | `fe8bb988e` |
| P-2026-10-31-1410 | D2, templates dispatched on the first argument's metaclass, `formatVersion` 1.1 for typed files | `cg-dispatch` (`~/jjodel-w-cgdispatch`, on `cg-origin-concat`) | `7dc35c8ec` |
| P-2026-10-31-1342 | E points 1, 2, 4: generator root follows template renames and deletes, names without gaps, export with drafts asks, preview disabled for a deleted metamodel | `gen-anomalies` (`~/jjodel-w-genanom`) | `e5fbd104d` |
| P-2026-10-31-1411 | E point 5: XMI import skips and counts unknown or abstract classes, fails when every root is skipped | `xmi-abstract` (`~/jjodel-w-xmiabs`) | `7857d5f62` |

- Gates reported green per lane (tsc, vitest of the module, build, check:docs). E point 3 (`temporal` stored as
  text) is not a bug (R-GEN-25). `check:codegen-lazy` fails in its "off" mode since `2046c17a3` (every `.env.*` sets
  `VITE_CODEGEN = true`): ticket in `docs/log-inbox/codegen.md` on `gen-anomalies`.

## Decisions taken (unattended)

- 1342 Phase 2 answers (RC-21, the lane's recommendations): root/entry stays stored and follows renames and deletes
  (R-GEN-33 unchanged); an entry naming no template stays an import error; export with unsaved drafts confirms and
  exports the saved list; no hint for text bodies that look like expressions; deleted metamodel disables the preview.
- 1411: skip and count rather than fail (an unknown wrapper root, previously a failure, is now skipped).
- Lanes' own: 1341 values untouched, origins recorded on the side; 1410 key format `name:Type`.

## Decisions awaiting Alfonso

1. Merges of the five branches into the trunk (order: `cg-origin-concat`, then `cg-dispatch`; the others are
   independent). Push.
2. 1340: pass `source` in `useJjtlParser` (brings `exists` to the app, moves every app JjTL expression to the JjEL
   parser); `let` bindings invisible in nested bodies, follow-up lane.
3. 1341: accept the amended rows 108-109 of `origin.test.ts`; literal operands of `+` stay opaque; update
   `jjel/SPEC.md:702`.
4. 1410: labels `expr(Ref)` instead of `expr:Ref`; typed files as major version 2 so a 1.0 reader refuses them.
5. 1342: keep retarget-to-root of file entries when their template is deleted. E point 6 (Ecore import with an
   nsURI already loaded: today it adds a second metamodel) held; recommended: refuse with a message naming the
   loaded metamodel.
6. Visual checks of the Templates tab for 1342 and 1410.

## Lessons

- Check the trunk against a bundle's base commit before splitting it into lanes: half of this one had landed.
- Three lanes stopped at the context ceiling before their closure; a short resume for the closure only was enough.
- The bridge dropped once (13:47-14:08); the lanes kept running.

## Update 2026-10-31 17:50

Alfonso answered «ok alle raccomandazioni» at 15:08. The chat checked the Templates tab of `cg-dispatch` and
`gen-anomalies` in the built-in browser (15:15, and again at 16:48 after the key-aware merge P-2026-10-31-1640).
All five branches are on the trunk, gates green on each merge (vitest 12373 at the last one):
P-2026-10-31-1508 `jjtl-expr-resolve`, 1539 `cg-origin-concat`, 1605 `cg-dispatch`, 1635 `xmi-abstract`, 1702
`gen-anomalies`. `gen-anomalies` first took the trunk by meaning (P-2026-10-31-1640: root and file entries follow
the template key `name:Type`); P-2026-10-31-1631 stopped on that conflict and is superseded. Trunk tip `e94541c13`,
180 commits ahead of origin at 17:26; push is Alfonso's.

Follow-up lanes from `e94541c13`, on branches, not merged:

| Lane | Branch | Result |
|---|---|---|
| P-2026-10-31-1710 | `jjtl-app-source` (`86d91287c`) | `let` variables reach nested bodies at any depth (done); the app parser switch stopped with a question: on the JjEL path `prompt`, `confirm`, `input` and a multi-line `if/else` after `:=` regress |
| P-2026-10-31-1711 | `ecore-nsuri` (`2fd5d83d8`) | an Ecore whose nsURI is already loaded is refused, nothing written |
| P-2026-10-31-1712 | `cg-spec-note` (`16bcd3432`) | SPEC 9.4 on origins through `+` and `join`; the stale-draft note shows only while the metamodel exists |

Awaiting Alfonso: merge of the three branches; the app parser switch (recommended: keep the parser as it is and open
a lane that makes `prompt`, `confirm`, `input` and multi-line `if/else` work on the JjEL path, then switch
`useJjtlParser` and `JjtlEditor.tsx` together; SPEC §13 example 5 goes with it); the nsURI message (recommended: say
only «delete», since renaming does not change the nsURI).
