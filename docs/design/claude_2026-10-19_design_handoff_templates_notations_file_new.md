# Templates, Notations and File › New: design handoff

Audience: the Jjodel Development project chat (architect). Not a Claude Code prompt: the chat turns it into prompts with its own Prompt-ID, Chat, Depends, Request and Lane headers.
Origin: design session of 2026-10-18/19 outside the project, on the Design canvas "Jjodel Templates page" (https://claude.ai/artifact/GCXrh7p8hMyh6AvFjHUyWW). All mockups are there; artboard names are given below.
Release: 3.2, consistent with R-LIB-7 (project gallery and Templates page in 3.2).
Related decisions: the R-LIB series (library catalog `docs/library/catalog.json`, sealed notations, no exit from a sealed notation to an editable project, R-LIB-8 seal guard in the reducer).

Status of the content: Alfonso approved the direction of every section below during the session (Templates layout, preview style D, level filter, Notations page outside Templates, New model dialog, File › New menu with Basic and Advanced variants). Concrete values marked **[proposal]** were chosen by the designer and are not ratified: register them as provisional.

---

## 1. Scope

1. Templates page redesign (artboard "Templates (revised)").
2. Card previews in the editor-canvas style (artboard "Card preview variants", variant D).
3. A new Notations catalog page for the sealed notations (artboard "Notations catalog").
4. A New model dialog (artboard "New model dialog").
5. File › New submenu, Basic and Advanced (artboard "File › New menu, Basic and Advanced").

Out of scope: Collections (section 8), dark theme (D-UI-15), any change to the seal semantics, Jjodie-generated syntax, code generation.

---

## 2. Templates page

### 2.1 Problems in the current page (3.1, `#/templates`)

- The H1 "Templates" is followed by a section also titled "Templates".
- The difference between Templates and Examples is never stated.
- Every card shows the same generic icon, so the card does not show what is inside.
- Seven identical dark primary "Clone to my workspace" buttons are the heaviest element on the page.
- Mono ids (`families-persons@1`, `petri-producer-consumer@1`) wrap onto two lines.
- The content sits in a narrow fixed column on wide screens, which leaves Shapes alone on a second row.
- The sidebar still shows the Private, Public and Collaborative filters, which do not apply here, and "Templates" has no visible active state.
- The quick tip "Right-click on elements for more options" is out of context on this page.

### 2.2 Target layout

- **Header.** H1 "Templates" at 30px/700. Lead text under it at 16px slate-600: "Starter projects you clone into your workspace. The clone is yours: the original never changes." A labelled search field sits on the right ("Search templates", placeholder "Name or concept").
- **Start here panel.** "New to Jjodel? Start here" with a numbered path that links to the card anchors **[proposal]**: Library, Shapes, StateMachine, Families and Persons, Turnstile.
- **Filters.** Two rows of chips, each with an uppercase eyebrow label:
  - Concept: All, Containment, Inheritance, References, Enumerations, Validation, Transformation, Code generation.
  - Level: All levels, Beginner, Intermediate, Advanced. Each level chip has a colour dot that matches its card badge and a live count.
  - The two filters combine with AND. A level chip whose count is 0 under the current concept is drawn dashed and grey.
  - "Clear filters" appears when any filter is active. The empty state says "No template matches this concept at this level." and repeats the Clear filters button.
- **Sections.**
  - "Starters": "A metamodel and a sample model to build on. Nothing else attached."
  - "Worked examples": "Complete projects with code generation templates, ready to run."
  - Each section hides when the filters leave it empty.
- **Grid.** `repeat(auto-fill, minmax(300px, 1fr))` with a 20px gap, and a max content width of 1200px.

### 2.3 Card anatomy (top to bottom)

1. **Preview.** 136px high, editor-canvas style (section 3).
2. **Title row.** Title at 16px/600, with the level badge on the right **[proposal colours]**:
   - Beginner: green-700 on green-100.
   - Intermediate: blue-700 on blue-100.
   - Advanced: violet-700 on violet-100.
3. **Counts.** Entity badges from the categorical palette, M (metamodel, `#534ab7` on `#eeedfe`) and m (model, `#854f0b` on `#faeeda`), followed by "1 metamodel", "2 models" and so on.
4. **Description.** One or two sentences at 14px.
5. **Callout (optional).** An amber note for intentional content. StateMachine: "Contains one validation error on purpose. Find it and fix it."
6. **Concept tags.** 12px, slate-100 background, 4px radius.
7. **Footer.**
   - Id in IBM Plex Mono 12px. **Shown only in Advanced mode** (in the mockup this is the tweak `showIds`).
   - "Preview" as a ghost button.
   - "Clone" as a secondary button (white, slate-300 border, copy icon). It is no longer a dark primary button.

Copy change **[proposal]**, Families and Persons: "Source and target of the classic Families2Persons transformation, with a model of each. The transformation is yours to write."

### 2.4 Sidebar on this page

- Hide FILTERS (Private, Public, Collaborative).
- Give the active item an active state: slate-100 fill, 600 weight, a 3px inset bar in slate-700, and `aria-current="page"`.
- BROWSE becomes: Templates, Notations, Collections (hidden until section 8 lands), Explore.

### 2.5 Catalog fields this needs

The catalog entry of each template or example needs:

- `kind` (`template` | `example`)
- `level` (`beginner` | `intermediate` | `advanced`)
- `concepts[]`
- `description`
- optional `callout`
- `preview` (asset reference, section 3)

Metamodel and model counts are derived, never written by hand.

Level and concept assignments in the mockup **[proposal]**:

| id | kind | level | concepts |
|---|---|---|---|
| library@1 | template | beginner | containment, inheritance, references |
| shapes@1 | template | beginner | inheritance |
| graph@1 | template | beginner | references |
| state-machine@1 | template | intermediate | enumerations, containment, validation |
| families-persons@1 | template | intermediate | transformation, containment, inheritance |
| turnstile@1 | example | intermediate | code generation |
| petri-producer-consumer@1 | example | advanced | code generation, references |

The concept lists were inferred from the card descriptions, not from the metamodels. Verify them against the real content.

---

## 3. Card previews

- **Style (variant D, chosen by Alfonso).** Dot grid (`radial-gradient(#e2e8f0 1px, transparent 1px)`, 12px) on white. Nodes are white, 8px radius, slate-300 hairline, with the name in 600 weight. Edges are slate-500 at 1.2px. Containment uses a filled diamond, inheritance a hollow triangle. Enums use the amber pair. An abstract class has a dashed border and the subtitle "abstract". A class with a validation error gets a red-500 border and the subtitle "1 error". There is no selection highlight on previews.
- **Source, recommended.** A snapshot of the real diagram, captured when a template version is published and stored with the catalog entry, so the preview always matches what the user gets after the clone. The `@n` version suffix is the regeneration trigger.
- **Not recommended for now.** Runtime rendering on page load: it is costly, and auto layout at 260×100 is poor above roughly six classes.
- **Later.** A "thumbnail" viewpoint owned by the template, which is a natural fit for Jjodel.
- **Fallback, variant C.** For large metamodels (threshold **[proposal]**: more than 8 classes), show a structure list instead of a diagram: class badge, name, one key relation per row.
- **Examples.** For Turnstile and Producer-consumer the preview shows the model in its notation, not the metamodel.

The SVGs in the mockup are hand-drawn and illustrative: class names and relations are invented. Discovery must find how to render a viewpoint to SVG offscreen for the snapshot.

---

## 4. Notations page

Sealed notations must not appear on the Templates page: the Templates contract is "clone and own", and the sealed contract is "use, never open". The Notations page is a catalog under BROWSE.

- **Header.** H1 "Notations". Lead text: "Built-in notations, ready to model with. A new model opens in the model editor with the notation's concrete syntax. The notation itself stays fixed." A side panel reads: "Want to define your own language? Templates give you a metamodel you own and can change." with a link to Templates.
- **Groups [proposal].**
  - "Behaviour and process": State machine, Petri net, Flowchart / Activity, BPMN.
  - "Structure and data": Entity-relationship (Chen), UML class diagram.
  - "Goals and ideas": Goal model (i*), Mind map.
  - DCN is added later, as R-LIB already states.
- **Card.**
  - Preview of a sample *model* in the notation, in the style of section 3.
  - Title, then a "Built-in" chip with a lock icon.
  - One-line description.
  - Footer: "Details" (ghost) and "New model" (secondary). There is no Clone.
- **User-facing term.** "Built-in". The word "sealed" stays internal.
- **Open point.** The BPMN card carries a link "See how it's built" to the BPMN complete example in the gallery. This is not an exit from the seal (they are two distinct artifacts), but it must be checked against the spirit of R-LIB before shipping. See Q1.

---

## 5. New model dialog

- **Modal.** 1000×720 at 16px radius. Title "New model", subtitle "Choose what the model conforms to.", close button labelled "Close".
- **Tabs.** "Built-in notation" and "Metamodel in this project". The second tab covers the main Jjodel use case.
- **Notation tab.**
  - A 4-column grid of tiles. Each tile has a mini preview and a name. The selected tile gets a 2px slate-700 border and a 3px slate ring.
  - The right panel (320px) shows the name, the Built-in chip and the description.
  - Below that, a note: "The model opens in the model editor with this notation. The notation itself is fixed: to define your own language, start from a template."
  - Fields: "Model name" (default `Untitled <Notation> model`) and "Project" (select).
- **Footer.** Cancel (secondary) and Create model (primary, slate gradient).
- **Entry points.** File › New › Model › Browse notations…, and New model on a Notations card. On a card, the dialog opens with that notation preselected.
- **Undefined.** The behaviour when the dialog opens outside a project. See Q2.

---

## 6. File › New menu

Both variants live under File, and the dialog stays the path for browsing.

**Basic**

```
New ›
    Project…
    ─────────
    Model ›
        State machine
        Petri net
        Flowchart / Activity
        BPMN
        ─────────
        Entity-relationship (Chen)
        UML class diagram
        ─────────
        Goal model (i*)
        Mind map
        ─────────
        Browse notations…
    ─────────
    From template…
```

**Advanced**

```
New ›
    Project…
    ─────────
    Metamodel
    Model ›
        CONFORMING TO            (section label)
        [M] <metamodels of the current project>
        ─────────
        BUILT-IN NOTATIONS       (section label)
        <same list and separators as Basic>
        ─────────
        Browse notations…
    Viewpoint
    Transformation
    ─────────
    From template…
```

Rules:

- **No fourth cascade level.** "Conforming to" is a section label inside the Model submenu, not a submenu of its own.
- **Long metamodel lists.** Above 5 metamodels **[proposal]**, list the most recent ones plus "More…". "More…" opens the dialog on the "Metamodel in this project" tab.
- **Order.** The notations appear in the same order and with the same separators as the Notations page.
- **Ellipsis.** Only items that open a dialog get one (Project…, Browse notations…, From template…, More…). Items that create the element immediately have none.
- **Outside a project.** Metamodel, Viewpoint and Transformation are disabled. Model › <notation> creates a container project, or asks. See Q2.
- **Other File items.** Open…, Import… and Export… in the mockup are placeholders: keep the real items of the current File menu.

---

## 7. Accessibility and tokens

- Every chip and tile is a real `<button>` with `aria-pressed`. Filter rows use `role="group"` with an `aria-label`.
- The dialog has `role="dialog"`, `aria-modal`, `aria-labelledby`, and tabs with `role="tab"` and `aria-selected`.
- Every preview SVG is `aria-hidden`.
- Every input has a `<label>`.
- Focus is shown as `outline: 2px solid #475569; outline-offset: 2px`.
- Use the existing design-system tokens only, with no new hex values. Exception: the level colours are new and need tokens; add them to `tokens/entities.css` or wherever the categorical palette lives.

---

## 8. Collections (deferred, not for this release unless Alfonso says otherwise)

This records the direction that was discussed, so it is not lost.

- A collection is a curated set of projects with a name and an owner.
- Two kinds:
  - External corpora such as the ATL Zoo: import once, pinned to a commit, with source, commit and licence carried on every item, also after a clone.
  - User collections, for example a teacher grouping the projects of a course.
- In Templates a collection appears as one card. That card opens its own page, with search and auto-derived concepts and no levels.
- ATL Zoo specifics:
  - It needs a reliable Ecore importer.
  - ATL transformations arrive as non-executable text, and the card must say so.
  - Each item carries an import status ("imported", "imported with warnings", "failed").
- Check the overlap with Explore before building.

---

## 9. Proposed decisions (register as provisional in the R-LIB series)

1. Sealed notations get their own Notations page and the New model flow, and never appear on the Templates page.
2. The user-facing term for sealed notations is "Built-in".
3. The Templates page has two sections, Starters and Worked examples, each with a one-line contract.
4. Clone becomes a secondary button with a Preview companion.
5. Template ids are shown only in Advanced mode.
6. Card previews use the editor-canvas style (variant D), sourced from a snapshot taken at publish time; variant C is the fallback above a size threshold.
7. Concept and level filters combine with AND, with live counts and a dashed zero state.
8. File › New gets the Basic and Advanced structure of section 6, with no fourth cascade level.
9. Catalog entries gain the fields `kind`, `level`, `concepts[]`, `callout` and `preview`.

## 10. Awaiting Alfonso (closed list)

- **Q1.** May a Built-in notation card link to the corresponding gallery example ("See how it's built")?
- **Q2.** Outside a project, does New › Model › <notation> create a container project silently, create it with a confirmation, or stay disabled?
- **Q3.** Ratify the level and concept assignments in 2.5, and the Start here order.
- **Q4.** Is Collections in or out of 3.2?

## 11. Suggested lanes (the chat decides after discovery)

- **L-A, discovery (read-only).** Locate:
  - the Templates page component, sidebar and quick-tip trigger;
  - the File menu definition;
  - where the catalog is read;
  - whether a viewpoint can be rendered to SVG offscreen for snapshots.
- **L-B.** Templates page, catalog fields and filters (sections 2 and 7).
- **L-C.** Preview snapshot pipeline (section 3). This depends on the L-A finding about offscreen rendering.
- **L-D.** Notations page and New model dialog (sections 4 and 5).
- **L-E.** File › New menu (section 6). This depends on L-D for the dialog entry point.

L-B and L-D look parallelizable, but only if discovery confirms disjoint file sets. Visual checks follow the artboards on the canvas, in the light theme only.