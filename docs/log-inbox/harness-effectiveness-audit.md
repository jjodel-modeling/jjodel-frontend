## 2026-11-05 — docs: audit the effectiveness of the October harness changes
**Prompt**: User in chat: «puoi verificare se le modifiche apportate all'harness di jjodel siano state efficaci?». Read-only operational audit; report and this entry only.
**Files touched**: docs/discovery/discovery_2026-11-05_harness_effectiveness_audit.md; docs/log-inbox/harness-effectiveness-audit.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — documentation only; targeted hook tests 244/244; full hooks suite attempted but local listening is denied EPERM in the sandbox. No product build or full regression claim.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile — offline operational audit, no UI change
**Notes**: 99 before / 478 after directories: peak >=250k 55.6% to 1.5%, median peak 263480 to 155831; not causal savings. Architect files absent. check:agents/triggers pass. check:docs initially 5/5, 101 warnings; recheck 4/5, 102 warnings: concurrent hw-notation entry lacks Corregge/Causa; foreign file untouched. Broad hook run interrupted, exit 130; targeted 244/244. B8a remains absent.
**Prompt document name**: — (direct chat request)
