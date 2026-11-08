# Discovery: the «expression» role catalog as the first plugin, with textual projection of expression subtrees

Prompt-ID: P-2026-11-08-2310
Chat: C-2026-11-01-1434
Front: plugins
Lane: full (Phase 1 read-only discovery; no Phase 2 in this prompt)
Status: da eseguire
Request: https://claude.ai/code/session_01DQt9R32KVprpjZZCfe6Sbp

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-exprcat`, branch `expression-catalog`, cut from `alfonso-frontend-jjtl` at the commit that adds this
prompt. Model and tier as pinned (RC-16), effort `xhigh`. Read-only on product code: the only files you write are the
report, the draft decision rows inside it, and gitignored probes.

## Lane discipline

Every reply opens with `[P-2026-11-08-2310 · session <id>]`; final message ends with `Outcome: done | hard-stop |
question | blocked`; one `Recommended:` line per question. Time limit 90 minutes. Context discipline: grep and read the
parts you need, never cat whole large files or logs; write the report before the soft ceiling (RC-51). Load gate before
any browser measurement: `uptime`, 1-minute load ≤ 16. No push, no merge.

## Why (Alfonso, 2026-11-08 23:01-23:04)

The DDR4 controller brief from the Micron work
(`~/Downloads/micron-proto/out/dram/jjodel/ddr4_closed_v.xmi`, md5 `42019bebff2a826aaf49682b8ae248ac`) has 4269
elements, depth 19; 3910 (92 %) are expression-tree nodes (`IntParam`, `Ref`, `IntMax`, `IntDiv`, `IntAdd`, `Eq`,
`Conj`, `Ite`, ... joined by `left`/`right`, 1192 each). Without a viewpoint every subexpression is a canvas node and the
editor is unusable. Alfonso's decisions:

1. Expression subtrees must not be canvas nodes. A viewpoint shows the design elements as nodes and prints each
   expression subtree as text inside the node that owns it (read-only projection first, expand a subtree into nodes on
   demand, editing via a parser later and tied to the textual front R-TXT).
2. No single expression language for all metamodels. Instead a small catalog of expression roles (binary infix operator
   with symbol, precedence and associativity; unary; literal; reference printed by the target's name; call; conditional;
   ...) that a viewpoint binds metaclasses to, and a generic printer with minimal parentheses. A per-metaclass template is
   the escape hatch for what the roles do not cover.
3. The catalog is born as the first concrete case of the plugin mechanism (front `plugins`, R-PLG), not as a viewpoint
   feature to be generalised later. The chat's thesis (2026-10-31): a plugin declares a catalog of roles (a small abstract
   metamodel) and supplies a behaviour that interprets any concrete model bound to it, the same shape as the simulator's
   role binding (STC) and instance-of's `ontoBindings` (R-OI).
4. For the hardware brief metamodel the printed syntax must be the same as the kernel's own text view, so that whoever
   works with Micron reads the same thing in both tools: `~/Downloads/micron-proto/docs/brief-text.md`,
   `docs/syncrtl-text.md`, and `tools/kernel/brief_view.py` (its docstring says the Brief text view of «decision 34», a
   JjGen template, is the one that belongs in Jjodel).

## COSA (Phase 1, read-only)

1. Inventory, with `file:line` and verbatim quotes: the R-PLG rows in `docs/decisions.md` and the plugin discovery that
   produced them; the simulator's role catalog and binding (R-SIM, STC); `ontoBindings` (R-OI); the codegen templates and
   JjGen (R-GEN) and whether a per-metaclass template can be evaluated at render time; the textual viewpoint work
   (`docs/discovery/discovery_2026-11-01_textual_viewpoint.md`, R-TXT); how an IR viewpoint renders a node's text today
   and where a computed label would plug in (R-IRN, R-VP); viewpoint derivation, for the automatic binding.
2. The reference syntax: read `brief-text.md`, `syncrtl-text.md` and `brief_view.py` and list, per kernel metaclass of
   the brief metamodel, the printed form (infix symbol, precedence, associativity, call form, special constructs such as
   `for c in ...`, `@name`, `{param}`, `ceil(a / b)`, the `D1, D2` naming of repeated subexpressions). Say which ones fit
   plain roles and which need the template escape hatch. Locate «decision 34» and its JjGen template if it exists.
3. Measure the problem once, on the trunk build: import the metamodel and `ddr4_closed_v.xmi` (find how the Micron
   prototype imports them into Jjodel; `tools/kernel/build_ecore.py`, `make_models.sh`), open the model with no viewpoint
   and record nodes, edges, time to first paint and whether it ever settles (give up after 5 minutes and say so). Then
   count the nodes the projection would leave (elements that are not expression nodes) and the longest printed formula.
   Full profiling stays with ticket #452; do not do it here.
4. Design proposal:
   - the catalog «expression» as a plugin: roles and their parameters, how a viewpoint (or a project) declares the
     binding, where it is stored and how it travels with the metamodel (R-VAL-10 precedent);
   - the generic printer (precedence climbing, minimal parentheses, associativity), the template escape hatch, and how
     repeated subexpressions are named if the kernel view does that;
   - the canvas side: which nodes disappear, how the owner shows the text, expand/collapse of a subtree into nodes, what
     selection and validation errors on a folded node map to;
   - automatic binding: the structural heuristics (two containments to a common abstract supertype is a binary operator,
     one value attribute is a literal, ...) and what is left for the user or Jjodie;
   - the binding for the brief metamodel that reproduces the kernel text view, as a concrete table;
   - critical zone and layer impact (CLAUDE.md §3), exported interfaces, new dependencies (none expected);
   - slices in order, each one shippable and visually checkable; the first slice should make the DDR4 model usable.
5. Draft decision rows `R-EXP-1..n` (not written into `docs/decisions.md`: only in the report, for Alfonso to ratify), and
   the questions only Alfonso can answer, each with a recommendation.

Report: `docs/discovery/discovery_2026-11-08_expression_catalog.md` (sections per P4), committed with pathspec. Exit
`Outcome: hard-stop`.

## HARD STOP

End of Phase 1. No product code, no `docs/decisions.md` edit, no change in `~/Downloads/micron-proto`.

## RIFERIMENTI

`docs/decisions.md` (R-PLG, R-SIM, R-OI, R-GEN, R-TXT, R-IRN, R-VP, R-VAL-10); ticket #452 (auto layout freeze);
`~/Downloads/micron-proto/docs/brief-kernel.md`, `brief-text.md`, `syncrtl-text.md`, `tools/kernel/brief_view.py`,
`tools/kernel/kxmi.py`.
