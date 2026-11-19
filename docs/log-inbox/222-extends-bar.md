## 2026-11-19 — fix(#222): Extends bar always shown, multi-select chips stay inside the box
**Prompt**: issue #222 — with more than one superclass the Extends chips spilled out of the field box; enhancement: keep the Extends bar active even when the metamodel has no dependencies
**Files touched**: `src/components/ui/JjSelect/JjSelect.tsx` (control height auto when multi, value-container padding), `src/components/editors/properties-with-tree-view.scss` (rail override: `height: auto` on a multi control), `src/components/editors/Info.tsx` (InheritanceSection no longer gated on `hasDependencies`, hint text), this entry
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — typecheck exit 0, build exit 0 (chunk-size warning only); no tests cover JjSelect or the Inheritance section, visual smoke not run
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — not run in this session; to check: a class with 5 superclasses in the rail, chips wrap inside the box, the hint and the cross-extend toggle below it
**Notes**: two fixed heights clipped the multi control: JjSelect `height: 36` inline and the rail's `.jj-field .jj-select > div:first-of-type { height: 30px !important }`. Both now yield to multi (`state.isMulti`; `:has(.jj-select__value-container--is-multi)`), single selects unchanged. The Extends options already list the metamodel's own packages (`LClass.get_validTargets`, `allSubPackages`), so the dependency gate only hid a working field; `hasDependencies` prop kept with a TODO: cleanup.
**Prompt document name**: — (user in chat: «risolvi la issue 222»)
