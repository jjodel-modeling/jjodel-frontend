# Simulation roles, handoff

Reference mockups for the Jjodel "Simulation roles" dialog. Rebuild them as React components in the Jjodel frontend. Do not ship these files.

## Files
- `Simulation Roles v2.dc.html`: overview. Screens 4a to 4f, plus the element-to-engine mapping and the icon list at the bottom.
- `Roles Modal.dc.html`: the roles dialog (3h). Preset data (State machine, Petri net P/T), Bound row, Data table, error state. Props: `preset` (sm | pn), `dataOpen`, `error`, `bound` (proposed | fallback), `profile`.
- `Role Kind Badge.dc.html`: role kind badge (class | ref | attr | value).
- `support.js`, `_ds/`: needed only to open the mockups in a browser. Serve the folder over HTTP (for example `npx serve .`) and open `Simulation Roles v2.dc.html`.

## Screens
- 4a First open: pick model kind (Control flow: State machine, Extended state machine, Flowchart; Petri net: Petri net P/T). No default; Continue disabled until a chip is picked.
- 4b State machine: required roles, then Optional, then derived and not used, all folded.
- 4c Petri net: Bound among required roles, helper text "Proposed 4: largest reachable marking, 9 markings explored" or fallback "Kept 2: exploration did not close".
- 4d Data open: declarations table; "Add attribute" in the sticky section header.
- 4e Error: derived role whose source is off; inline message; Apply disabled with problem count.
- 4f Dark.

## Constraints
- Jjodel design system tokens only; slate base #334155, cyan #0ea5e9; Bootstrap Icons 1.13.
- Fixed dialog size (640 x 600), body scrolls; no layout shift on fold, unfold or value change.
- No SMV or nuXmv wording or controls.

## To confirm with the engine before coding
- Bag key names (preset id, profile name, per-role mode, data declarations). The preset ids sm, esm, flowchart, pt are placeholders.
- A per-role "off" mode exists.
- Bound exploration output: proposed value, markings explored, closed or not.
- Rule: a derived role requires its source role.
- Whether Data applies to Petri net presets.
