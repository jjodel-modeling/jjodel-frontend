# Prompt Claude Code, 2026-08-24 00:50: adapter `2.227 -> 2.228`, la seconda grafia della sentinella

**Fase**: 2, implementazione scoped. **Zona critica**: no. **Branch**: `alfonso-frontend-jjtl`.
**Base**: dopo il commit della Fase 1b (`claude_2026-08-24_0040_prompt_layout_fase1b_storesize_runtime.md`),
non in parallelo: stesso albero.
**Protocollo**: `docs/PROTOCOL.md` P1..P10. **Decisioni**: `R-IRN-20` (l'adapter riscrive solo i
puntatori di sistema, mai gli id utente), `R-IRN-27`, `R-IRN-19` (la purga dei puntatori è di
`2.229`, non di questo prompt).

## Il fatto

`discovery_2026-08-24_layout_d1_d8_d10.md` §9.3: il codice conosce una sola grafia del viewpoint di
sistema, `Pointer_ViewPointDefault` (`Defaults.ts`, `Defaults.viewpoints`). I progetti demo spediti
con l'app in `frontend/src/examples/**` (`first`, `second`, `sequence`, `statechartplus`,
`conflictsimulation`) portano `Pointer_DefaultViewPoint`, che `Defaults.isSystemViewpoint`
(`Defaults.ts:105-107`) non riconosce. L'adapter `2.227 -> 2.228` (`VersionFixer.tsx:1188-1208`)
quindi **non** riporta a `null` l'`activeViewpoint` di quei progetti: restano con un viewpoint attivo
che non è né utente né riconosciuto come sistema.

## Cosa fare, e solo questo

In `frontend/src/redux/VersionFixer.tsx`, dentro `['2.227 -> 2.228']`, la condizione

```ts
if (!Defaults.isSystemViewpoint(e.activeViewpoint)) continue;
```

diventa: salta se **non** è un viewpoint di sistema **e non** è la grafia legacy
`'Pointer_DefaultViewPoint'`. La stringa legacy vive come costante locale al file, con un commento
di due righe che cita §9.3 e dice che la grafia non esiste nel codice dal [misura la data con
`git log -S"Pointer_DefaultViewPoint" --oneline | tail -1`, e scrivila]. **Non toccare `Defaults.ts`**:
la grafia legacy non diventa un viewpoint di sistema, viene solo normalizzata via dal campo che
l'adapter già possiede. I record `DViewPoint` con quell'id e i puntatori che li citano **non si
toccano**: sono la purga di `R-IRN-19`, `2.229`.

Test, in `frontend/src/redux/__tests__/versionfixer_2228_migration.test.ts`, due `it` in coda al
`describe` esistente: la grafia legacy viene riportata a `null`; un id utente che contiene la
sottostringa non viene toccato (controllo positivo).

## Gate e commit

`npm run test` (1323 + N + 2), `npm run typecheck` diff vuoto, `npm run build` exit 0. Un commit,
due file: `fix(versionfixer): normalize the legacy default-viewpoint spelling in 2.227 -> 2.228`.
Entry di log. **Hard stop**: la verifica a schermo è di Alfonso (aprire `second` o `sequence` dagli
esempi, guardare che il selettore stia su «Abstract syntax» e che la riga del VersionFixer compaia
in console una volta).

## Riferimenti

- `docs/discovery/discovery_2026-08-24_layout_d1_d8_d10.md` §9.3
- `frontend/src/redux/VersionFixer.tsx:1177-1208`
- `frontend/src/common/Defaults.ts:105-107`
- `frontend/src/redux/__tests__/versionfixer_2228_migration.test.ts:60-130`
- `docs/decisions.md`: `R-IRN-19`, `R-IRN-20`, `R-IRN-27`
