# Prompt: trunk defects found while shooting the book's screenshots

Prompt-ID: P-2026-11-15-1010
Chat: C-2026-11-15-1010
Front: maintenance
Lane: full, two phases (Phase 1 discovery read-only with a saved report and a hard stop; Phase 2 the fixes, after the chat's GO)
Status: da eseguire
Request: Alfonso, chat of 2026-11-15 17:25: "I due difetti: sono fixati?" after the app-run check of the book's VERIFY markers
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-book-defects`, branch `book-screenshot-defects`, cut from `alfonso-frontend-jjtl` at the commit
that adds this prompt. Model and tier as pinned (RC-16), effort `xhigh`. Before anything else run `pwd`,
`git branch --show-current`, `git log -1` and `git status`; if they differ from this header, stop. Every reply opens with `[P-2026-11-15-1010 · session <id>]` and
ends with an `Outcome:` line.

## COSA

While the screenshots of the Jjodel book were being taken on `localhost:3000` (build 9567, trunk `97de6d1fb`),
the following defects showed up. Each one is described as it was observed; none has been investigated in the
code yet. Phase 1 confirms or rejects each, finds the root cause, and proposes a fix. Phase 2 fixes only the
ones Alfonso approves.

1. **JjEL: a `[0..*]` feature with one element is not a collection.** Resolved on the trunk by the merge of
   `jjel-multivalued` (`b3b51157b`, 2026-11-15); Phase 1 only confirms it on the current tip. In JjEL mode of the Console, with the
   state `Green` of the reference traffic light selected (it owns one transition, `toYellow`):
   `self.ownedTransitions` returns `toYellow`; `self.ownedTransitions.size` gives "Property size not found on
   object."; `self.ownedTransitions.size()` gives "Unknown method 'size' for type Object". The book
   (Ch7, Ch17, appendix) treats a many-valued feature as a collection whatever its length. Expected: a
   collection of length 1, `size` = 1.
2. **Retyping an object in place loses its slots.** Setting `instanceof` of the `State` object `Red` to the new
   subclass `InitialState` (`LObject.instanceof = <DClass>`) leaves `Red` with no `ownedTransitions` value and
   drops its owned transition `toGreen` from the model (7 objects become 6). A later
   `create instance of Transition "toGreen" in Red.ownedTransitions` fails with
   "Container 'Red.ownedTransitions' is not ready yet". Expected: inherited features keep their values
   when the new class is a subclass of the old one.
3. **"Type: Hidden" does not hide the type in the header.** In the View Designer, Structure tab of a vertex
   view on `State`, setting the name's type display to Hidden still shows `Red : State` in the header. The
   type disappears only when the label source in Symbol → Text is changed from `qualifiedName` to `name`.
4. **An orphan edge stays after Undo, and is saved.** In the metamodel editor, *Add reference* on `State`
   followed by Undo removes the `DReference` but not its `DEdge`: the self-loop stays on the canvas, survives a
   reload, and is saved with the project. Observed in the store: `DEdge Pointer1794708000981_USER_25` with
   `model` pointing to a missing element, `start` and `end` on `State`; a second orphan edge,
   `Pointer1794707954175_USER_23`, has `model` undefined between `State` and `NamedElement`. Expected: Undo of
   a feature removes the edges whose model is that feature; loading a project drops edges whose model is
   missing.
5. **The viewpoint filter of a model leaks into the metamodel's tree.** With a model open under the
   *Traffic Light* viewpoint, opening the metamodel tab shows "filter: Traffic Light on StateMachine,
   N excluded" in its Tree View.
6. **Toolbar overlap at 1280 px.** At a 1280 × 800 viewport, in the model editor with the right panel open,
   the toolbar controls overlap (the "LAYOUT" label truncates to "LAY…", the viewpoint selector to "Traf…")
   and the validation results dialog is cut on the right.
7. **Stale texts.** The "Advanced Mode Enabled" dialog still mentions JSX templates and the OCL Console. The
   status bar shows `v3.1.1` on the 3.2 trunk.
8. **JjScript creates a transition at the top level, and conformance accepts it.** On the reference traffic
   light, `create instance of Transition "stray"` in the JjScript mode of the Console succeeds and puts the
   transition at the root of the model; the status bar keeps saying "conforms to StateMachine". The palette of
   the model editor offers no transition at the top level, because `Transition` is reachable only through the
   containment `ownedTransitions`. Expected: the two agree, either JjScript refuses the root instance or
   conformance reports it.
9. **The `opposite` option of `create reference` is parsed and dropped.** `create reference package in Class
   type Package [0..1] opposite classes` succeeds, but the new `DReference` has no `opposite` (checked in the
   store; `jjscript/executor/commands/create.ts` never reads `options.opposite`, which only
   `executor/dependencies.ts` sees). Expected: the opposite is set on both references, or the command says
   it ignores the option.

## DOVE

Read only in Phase 1. Likely places, to be confirmed by search: `src/jjel/` (collection semantics of
many-valued features, item 1), `src/jjscript/executor/commands/create.ts` and the conformance check (items 8 and 9), `src/joiner/` and `LObject.set_instanceof` (retyping), the View Designer structure and
symbol panels under `src/components/editor-v2/`, the undo path of edges, the Tree View filter, `Toolbar.tsx`,
the Advanced mode dialog, and where the version string is built.

## COME

Phase 1, read only. For each item: reproduce it (a probe on a free port, never 3000, 3001 or 3003; the
reference project is `author/examples/traffic-light.jjodel` in `~/jjodel-book-w-book32`, readable), find the
root cause with file and line, and propose the smallest fix. Save the report as
`docs/discovery/discovery_2026-11-15_book_screenshot_defects.md`: objective, files read with full paths,
findings per item (confirmed or not, root cause, proposed fix, risk), open questions for Alfonso. Item 2 may
touch the critical zone: if it does, add a Layer Impact Report. Then hard stop with `Outcome: hard-stop`.

Phase 2, only after GO, in the order 9, 8, then the others: one commit per item, `fix(<area>): ...`, `git add` by file name, gates green, log
entry in `docs/claude-code-log.md`.

## RIFERIMENTI

- `CLAUDE.md`, `docs/PROTOCOL.md`, `architecture-invariants` (critical zone).
- Book chapters that depend on these items: Ch5 (`part2/ch05-getting-started.tex`), Ch8 (`part2/ch-syntax.tex`),
  Ch14 (`part2/ch07-computational-model.tex`), Ch17 (`part3/ch14-jjodie.tex`) in `~/jjodel-book-w-book32`.
