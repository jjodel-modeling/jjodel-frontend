## 2026-09-16 — feat: cornerRadius axis, rounded polygon painter and the Shape control (slice 3)
**Prompt**: `2026-09-15_1830_slice-3_corner-radius.md`, with the nine answers of
`2026-09-16_ack-slice-3_corner-radius.md` (commit `1f93c6a7e`). Two-phase: phase 1 report
`docs/discovery/discovery_2026-09-16_corner_radius_axis.md` (`b87ace74c`), GO given in the ACK.
**Files touched**: 12, in two commits, as the ACK ordered (slice 1 owned
`VertexAuthoringPanel.tsx` this round; its commit `aeb0c9134` landed first).
`8da572191`, 11 files: `irTypes.ts` (`ShapeSpec.cornerRadius?: number` + doc comment with the
ignore list), `irValidate.ts` (numeric guard beside padding), `shapeRegistry.ts`
(`honorsCornerRadius`, `authoredCornerRadius`, `baseCornerRadius`, `clampCornerRadius`,
`resolveCornerRadius`, `roundedPolygonPath`), `IRNodeContent.tsx` (`useCornerBox` +
`svgOutline(…, roundedD)` + inline radius), `SymbolPreview.tsx` (optional prop, tile ratio 0.7),
`SymbolBoxPreview.tsx` (optional prop, same painter), `SymbolEditorModal.tsx` (the only caller that
passes it), `DynamicHandles.tsx` (TODO only), plus `shapeRegistry.test.ts`, `irValidate.test.ts`,
`symbolRecognition.test.ts`. `b1abdc6f1`: `VertexAuthoringPanel.tsx` (Shape section only —
stepper, greyed base + Reset, three live glyphs, help text; `resetCornerRadius`). This entry in its
own commit.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. `npm run typecheck` exit 2, **33** `error TS` on full output, set identical to
the pre-change run (line-stripped `diff` exit 0), **0** in the 12 touched files, control
`Measurable` → 6. `npx vitest run` on the touched areas: **247 passed, 0 failed** over 10 files.
`npm run build` exit 0, only the pre-existing warnings (chunk size, sass deprecations, `bordr`).
Mutation bench, 8 mutations one at a time on committed files, each restored with `git checkout
HEAD --`: clamp /4→/2 (1 red), gate + circle (2), no half-edge clamp (2), `authoredCornerRadius`
accepts negatives (3), CSS radius unclamped (1), validator guard off (2), recognition reads the
radius (1), preset drops the radius (1). Unmutated baseline 86 green.
**Out-of-scope changes**: yes, declared and authorized by the ACK: `SymbolEditorModal.tsx`,
`irValidate.test.ts` and `symbolRecognition.test.ts` were not in the prompt's DOVE. 12 files: rule
19 threshold passed, list confirmed in the ACK (RC-11).
**Layer Impact Report**: produced — discovery report §5. CLAUDE.md §3.1 lists `viewpoint/ir/` and
`viewpoint/authoring/` as critical zone while the prompt said no critical-zone file was in scope;
the conflict was reported and the ACK settled it for CLAUDE.md.
**Smoke visivo**: passato — probe `scripts/smoke/_tmp_s3radius_verify.ts` (gitignored) on the live
dev server, **35/35 PASS, zero page errors**, plus four screenshots read by eye.
**Notes**: Reset first left the KEY holding `undefined` (`patchShape` spreads it in); the probe
caught it and it now goes through a rest/spread, the `omitForm` idiom — `'cornerRadius' in
ir.shape` is false after a Reset. Measured on canvas: absent leaves no inline radius (rect 4px,
rounded 10px), a persisted -5 draws as absent, circle stays 50%, rect r=20 on 198x40 clamps to
10px; polygons emit one path in a `0 0 w h` viewBox with ring, band and both double strokes on the
same `d`; the observer follows a resize and the viewBox is zoom-immune (scale 1→2). One run was
VOID (probe started while a build ran: the fixture never painted, ten FAILs about nothing); the
probe now waits longer and exits 2 instead of reporting them. Deviation from ACK 3: the observer
also runs on rect/rounded with a written radius, because ACK 4 asks for the same clamp there and
the clamp needs a box.
**Prompt document name**: 2026-09-15 18:30
