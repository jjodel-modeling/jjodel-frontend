# Prompt: discovery, deriving a viewpoint (concrete syntax) from a metamodel into the view IR

Prompt-ID: P-2026-09-29-0111
Chat: C-2026-09-28-1936
Lane: discovery (read-only; the view IR, the viewpoint store, the Symbol Editor, the simulation role binding). Tier: heavy.
Status: eseguito 2026-09-29 · lane discovery viewpoint-derivation · report docs/discovery/discovery_2026-09-29_viewpoint_derivation.md · hard-stop, two decisions and three questions for Alfonso in §0

Worktree: `~/jjodel-w-viewgen`, branch `viewpoint-derivation` (cut by the chat from `alfonso-frontend-jjtl` at `174f6c58a`, `frontend/node_modules` symlinked as P14 allows), a fresh session started by `lane-run`. Before anything else: `pwd` is `/Users/alfonso/jjodel-w-viewgen`, branch `viewpoint-derivation`, `git log -1` is the docs commit that added this prompt; if any differs, stop with `Outcome: blocked` and say which.

## COSA

Alfonso, 2026-09-29: can Jjodel generate the concrete syntax of a metamodel automatically, possibly with Jjodie? The chat's reading, discussed with him: a view is a JSON document in the view IR (example below); a deterministic derivation turns the metamodel, plus the simulation role binding when there is one, into a new viewpoint made of IR documents (one per concrete metaclass, vertices and edges); Jjodie, as a second and separate step, proposes JSON patches on those documents for what the structure cannot decide (the form of a role-less class from its name, which attributes to show, icons, colours), validated by the IR schema and accepted one by one.

Example of a view document, as Alfonso showed it:

```json
{ "irVersion": "ir-1.2", "kind": "vertex", "metaclasses": ["InputOutputNode"], "priority": 0, "exclusive": true,
  "label": "View for InputOutputNode",
  "shape": { "form": "parallelogram", "fill": "#bee7f9", "cornerRadius": 8,
             "border": { "color": "var(--color-inode-border)", "width": 0, "style": "solid" }, "labels": [] },
  "fieldCompartments": [ { "id": "attributes", "source": { "from": "attributes" },
      "rowFormat": { "segments": [ { "kind": "name" }, { "kind": "literal", "text": " = " }, { "kind": "value" } ] },
      "separator": true } ],
  "authoringMetaclassPins": { "InputOutputNode": "Pointer1790622317649_USER_40" } }
```

Goal: the facts to decide whether the deterministic derivation (Phase 2, no Jjodie yet) can be built now as an additive feature, and its plan.

## DOVE (read-only)

- The view IR: its schema or types, its versions (`ir-1.2`), the resolver that matches views to metaclasses (priority, exclusive, pins, R-MCID), the edge kind and its fields; the files under `frontend/src` that define and validate it (grep `irVersion`, `fieldCompartments`, `authoringMetaclassPins`).
- How a viewpoint is created, stored, activated and undone today; whether a viewpoint can be created programmatically as a batch of IR documents in one undo step.
- The Symbol Editor (rules table, families) and how it reads and writes the same IR.
- The simulation role binding (`roleCatalog.ts`, `profileBinder.ts`, the role bag) as a source of forms: Node, Initial, Terminal, Fork, Join, Decision, Transition with Source and Next state, Place, the Petri transition.
- Jjodie (`frontend/src/ai/`): how it is called today and whether it could return IR patches (read only; no call to a model in this lane).
- Report: `docs/discovery/discovery_2026-09-29_viewpoint_derivation.md` (naming per `CLAUDE.md`), opening with `## 0. Answer in brief`, at most 40 lines. The only file this lane writes, plus this prompt's Status and a log entry in `docs/log-inbox/` (the inbox that fits; say which).

## COME

1. Read `CLAUDE.md` (§6, the discovery rules, critical zone), `docs/PROTOCOL.md` P16, RC-20, RC-21, RC-33, the R-MCID rows and the Symbol Editor rows in `docs/decisions.md`.
2. Answer with [M]/[R] evidence and file:line: (a) the table of IR fields, each marked deterministic (structure), deterministic (roles), or Jjodie, with the rule; (b) the priority computed from the hierarchy depth so that a subclass view beats its superclass; (c) colours as CSS tokens only, and which tokens exist; (d) how a class is recognised as an edge (a Transition role, or two non-containment references into one hierarchy) and the edge IR it becomes; (e) provenance for regeneration: can the IR carry an optional field (per view or per field) saying which rule generated it, additively, so that a regeneration overwrites only generated fields; (f) the entry point: a command that creates a new viewpoint, never touching the default one or existing views; (g) quality: how to compare generated views with hand-written ones for the same languages (which existing projects have hand-written viewpoints to compare against).
3. Measure, with gitignored `_tmp_*` scripts under `npx tsx` (no dev server): run a prototype derivation on the four demo metamodels (`/Users/alfonso/jjodel-demo-exports/*.json`, read only) and validate the documents against the IR schema; report how many fields per view are filled deterministically.
4. `Recommended:` on feasibility before the MODELS freeze (2026-10-01 evening) as an additive feature that does not change the demo scenes, and the Phase 2 file list. Name any point that is Alfonso's decision (for example a non-additive IR change, or the critical zone).
5. Do not write product code. One docs commit (report, log entry, Status). Stop with `Outcome: hard-stop` (or `question`), the sha and §0.

Never: `git add .`, `-A`, `-u`, `git stash`, `git reset --hard`, `git checkout -- .`, `git clean`, `--no-verify`, push, writes outside this worktree, a critical-zone file, a call to an AI model.

## RIFERIMENTI

- `docs/decisions.md` R-MCID-1, R-MCID-2, the Symbol Editor 1b rows; the roles of the simulation (R-SIM-89, R-SIM-90).
