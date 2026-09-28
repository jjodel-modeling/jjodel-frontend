# services/export — Ecore / XMI I/O working rules

Loaded only when working under `frontend/src/services/export/`. Moved verbatim out of the
root `CLAUDE.md` (§14) on 2026-09-19 (P-2026-09-18-1930 Phase 3).

---

## 14. Ecore / XMI I/O

Importers and exporters for Ecore (.ecore) and XMI (.xmi) formats.

**Service files**:
- `frontend/src/services/export/EcoreService.ts`
- `frontend/src/services/export/XMIService.ts`

**Tests**: `frontend/src/services/export/__tests__/ecore-io.test.ts` (36 tests).

**Fixtures**: `frontend/src/__tests__/fixtures/xmi-m1/`.

**Naming convention**: `Pointer_<UPPER>` for primitive type IDs (e.g., `Pointer_ESTRING`) distinguishes canonical from user-defined types.

**Round-trip discipline**: Ecore export uses `pkg.__raw.uri` (D-layer) for byte-identical nsURI. See §3.7.
