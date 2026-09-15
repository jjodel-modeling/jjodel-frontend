# Prompt Claude Code — Chore: ritiro scaffolding dev ir-1.0 (ai/viewpointIR + probe)

**Data**: 2026-07-23
**Tipo**: chore (rimozione codice morto, decisione D-B2c-4 ratificata)
**Prerequisito**: B2c-ii committata (con entry di log, dopo l'amend)

## COSA

Ritirare la superficie parallela ir-1.0, morta e fonte di confusione per le discovery future (contiene la seconda dichiarazione di `Predicate` del repo). Ratificato come chore separato post-B2c (`ratifiche_2026-07-22_B2c_matching_e_enablement.md`, D-B2c-4); censita in `discovery_2026-07-22_ir_view_enablement_entrypoint.md` §4 (punto 4) e §7 (R5).

Scope della rimozione, già verificato in chat sul repo (2026-07-23):

1. **Cartella intera** `frontend/src/ai/viewpointIR/` (3 file: `types.ts`, `IRView.tsx`, `__irviewProbe.ts`).
2. **`frontend/src/index.tsx`**: la riga `import "./ai/viewpointIR/__irviewProbe";` (riga ~8) e il blocco di commento THROWAWAY che la precede (righe ~4-7), che si autodichiara "Remove this line with the probe".
3. **`frontend/src/joiner/components.tsx`**: la riga ~16 `export {IRView} from "../ai/viewpointIR/IRView";`. Nessun file del repo importa `IRView` dal joiner (verificato con grep; gli hit residui su "IRView" sono `resolveIRView`/`useIRView`/`IRViewResolution`/`IRViewpointIndex`, tutti dell'IR canonico ir-1.2, da NON toccare).

**NON toccare**: `frontend/src/components/editor-v2/viewpoint/ir/**` (IR canonico ir-1.2, incluso `irDemoFixture.ts` che resta come helper dev utile), tutto il resto di `frontend/src/ai/` (client AI Jjodie), qualunque altro file.

## DOVE

| File | Azione |
|------|--------|
| `frontend/src/ai/viewpointIR/types.ts` | **DELETE** |
| `frontend/src/ai/viewpointIR/IRView.tsx` | **DELETE** |
| `frontend/src/ai/viewpointIR/__irviewProbe.ts` | **DELETE** |
| `frontend/src/index.tsx` | rimozione import + commento THROWAWAY |
| `frontend/src/joiner/components.tsx` | rimozione re-export riga ~16 |
| `docs/claude-code-log.md` | entry standard, STESSO commit |

## COME

### 0. Verifica di sicurezza (pre-rimozione, hard requirement)

`grep -rn "viewpointIR" frontend/src --include="*.ts" --include="*.tsx"` deve restituire SOLO occorrenze dentro `frontend/src/ai/viewpointIR/` più i due punti di aggancio elencati sopra (`index.tsx`, `joiner/components.tsx`). Idem `grep -rn "__seedIRViewProbe" frontend/src` (solo dentro la cartella + eventuale commento in index.tsx).

**Se emerge anche un solo importer in più**: STOP immediato, nessuna rimozione, report della discrepanza in un discovery report (`docs/discovery/discovery_2026-07-23_ir10_scaffolding_importers.md`) e domanda in chat. I findings attesi sono già documentati nella discovery committata (`4612a3241`), quindi se il grep combacia NON serve un nuovo report.

### 1. Rimozione

`git rm` dei 3 file; edit puntuali su `index.tsx` (leggere prima le prime ~15 righe per rimuovere il blocco esatto, commento incluso, senza toccare gli altri import) e su `joiner/components.tsx` (solo la riga del re-export, senza riordinare nulla).

### 2. Note

- `window.__seedIRViewProbe` sparisce dalla console dev: atteso, era throwaway dichiarato.
- `window.__jjodelInstallIRDemo` (da `irDemoFixture.ts`, IR canonico) deve continuare a esistere: se sparisce, qualcosa è stato rimosso di troppo.
- Il commento in `index.tsx` cita una catena `joiner -> ExecuteOnRead -> components -> IRView -> side-effect import`: dopo la rimozione del re-export dal joiner la catena non esiste più per costruzione; se durante l'edit emergono altri riferimenti a quella catena, segnalarli, non "sistemarli".

## Gate automatici (tutti; nessun gate visivo bloccante, ma vedi sotto)

1. `tsc`: stesso set di errori della baseline (33, diff vuoto).
2. `vitest`: tutti verdi (inclusi i test IR canonici in `editor-v2/viewpoint/ir/__tests__/`).
3. `npm run build`: exit 0 (solo chunk-warning preesistente).
4. Grep post-rimozione: `grep -rn "viewpointIR\|__seedIRViewProbe" frontend/src` = 0 hit.

## Verifica leggera di Alfonso (non hard stop, ma prima del commit)

App avviata: boot senza errori console; canvas invariato (view classiche e IR renderizzano come prima); in console `window.__jjodelInstallIRDemo` esiste ancora, `window.__seedIRViewProbe` è undefined.

## Commit

```
git add frontend/src/index.tsx frontend/src/joiner/components.tsx docs/claude-code-log.md
git rm frontend/src/ai/viewpointIR/types.ts frontend/src/ai/viewpointIR/IRView.tsx frontend/src/ai/viewpointIR/__irviewProbe.ts
git commit -m "chore: retire dev IR scaffolding (ir-1.0 probe and parallel schema in ai/viewpointIR)"
```

Mai `git add .` / `git add -A`. Nessun push. Entry di log nel formato standard, stesso commit (tipo chore, con nota che chiude D-B2c-4 e R5 della discovery enablement).
