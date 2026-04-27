# Task: Ripristinare il ViewpointEditor (P1–P8) da git e ricablare il routing

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

## Contesto
Il ViewpointEditor redesign (ViewpointEditorRoot + ViewpointEditorPanel + 19 file di supporto) è stato rimosso nel commit `5999f50c6` del 2026-04-06 insieme all'Editor V3. Il codice funzionava correttamente — è stato rimosso come cleanup, non per bug.

Attualmente il routing in `TabDataMaker.tsx:41` usa `ViewpointWorkbench` (il vecchio editor). Dobbiamo:
1. Ripristinare i file rimossi da git
2. Sostituire `ViewpointWorkbench` con il nuovo editor nel routing

## Fase 1 — Ripristino file da git

```bash
# Lista esatta dei file rimossi
git show --stat 5999f50c6 | grep "panels/viewpoint-editor/"

# Ripristina TUTTI i file della directory panels/viewpoint-editor/
git checkout 5999f50c6~1 -- src/components/panels/viewpoint-editor/
```

Verifica che i file siano stati ripristinati:
```bash
ls -la src/components/panels/viewpoint-editor/
wc -l src/components/panels/viewpoint-editor/ViewpointEditorRoot.tsx
wc -l src/components/panels/viewpoint-editor/ViewpointEditorPanel.tsx
```

Dovrebbero esserci ~21 file, ViewpointEditorRoot.tsx ~411 righe, ViewpointEditorPanel.tsx ~170 righe.

## Fase 2 — Verifica import e dipendenze

Dopo il ripristino, verifica che tutti gli import interni siano risolvibili:

```bash
# Controlla se ci sono import rotti
npx tsc --noEmit 2>&1 | grep "viewpoint-editor" | head -30
```

Possibili problemi:
- Import verso file che sono stati rinominati/spostati dopo il 6 aprile
- Import verso l'event registry (ora centralizzato in `src/events/registry.ts`) — i file ripristinati potrebbero usare stringhe hardcoded per gli eventi
- Import verso token CSS legacy (ora migrati)

Per ogni import rotto:
- Se è un evento hardcoded → sostituisci con la costante dal registry (`import { JjodelEvents } from '@/events/registry'`)
- Se è un file spostato → aggiorna il path dell'import
- Se è un token CSS → aggiorna al nuovo token

## Fase 3 — Ricablare il routing

In `src/components/abstract/TabDataMaker.tsx`:

```bash
# Vedi lo stato attuale
sed -n '1,50p' src/components/abstract/TabDataMaker.tsx
```

Sostituisci:
- L'import di `ViewpointWorkbench` con l'import di `ViewpointEditorPanel` (o `ViewpointEditorRoot`, a seconda di quale è il wrapper esterno)
- L'istanziazione a riga ~41 dove viene creato il tab per il viewpoint

Il componente sostitutivo deve ricevere le stesse props (almeno l'ID del viewpoint). Verifica:

```bash
# Vedi le props che ViewpointWorkbench riceve
grep -A5 "ViewpointWorkbench" src/components/abstract/TabDataMaker.tsx

# Vedi le props che ViewpointEditorPanel/Root accetta
head -30 src/components/panels/viewpoint-editor/ViewpointEditorPanel.tsx
head -30 src/components/panels/viewpoint-editor/ViewpointEditorRoot.tsx
```

Se le props non matchano, crea un wrapper minimale che adatta le props.

## Fase 4 — Verifica anche gli altri entry point

Il vecchio editor potrebbe essere aperto anche da altri percorsi:

```bash
# Cerca tutti i riferimenti a ViewpointWorkbench
grep -rn "ViewpointWorkbench" src/ --include="*.tsx" --include="*.ts"

# Cerca anche DockManager.openViewpoint
grep -rn "openViewpoint" src/ --include="*.tsx" --include="*.ts"
```

Tutti i percorsi che aprono `ViewpointWorkbench` devono essere aggiornati per aprire il nuovo editor.

## Fase 5 — NON rimuovere ViewpointWorkbench

Lascia il file `ViewpointWorkbench.tsx` nel codebase. Rimuovi solo i suoi import/usi nei routing. Lo rimuoveremo in un cleanup separato dopo il rilascio.

## Fase 6 — Build e verifica

```bash
npm run build
```

Se ci sono errori TypeScript nei file ripristinati, fixali uno per uno. I fix dovrebbero essere solo:
- Path di import aggiornati
- Stringhe evento → costanti dal registry
- Token CSS legacy → nuovi token

NON modificare la logica o la struttura dei componenti ripristinati.

## Verifica funzionale

- Dalla dashboard progetto, clicca su un viewpoint → si apre il NUOVO editor
- Il tree delle views si popola
- Crea una nuova view con "+" → appare nel tree (questo era il bug fixato con useSelector)
- Seleziona una view → le sezioni (Predicate, Template, Style, etc.) si caricano
- Il pannello destro mostra GENERAL + BEHAVIOR
- Il canvas preview funziona quando si seleziona un modello

## Log

```
## 2026-04-10 — feat: ripristino ViewpointEditor redesign da git
**Prompt**: ripristinare 21 file da commit 5999f50c6~1, ricablare routing in TabDataMaker
**File toccati**: src/components/panels/viewpoint-editor/* (ripristinati), TabDataMaker.tsx (routing)
**Esito**: ✅ | ⚠️ | ❌
**Note**: [N file ripristinati, M import fixati, routing aggiornato da ViewpointWorkbench a ViewpointEditorPanel]
```
