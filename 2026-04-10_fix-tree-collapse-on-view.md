# Task: Auto-collapse Tree View quando una view è selezionata

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

## Problema
Quando una view viene selezionata nel Tree View, ViewData si renderizza nel `properties-panel-container` (la parte fluid del layout). Ma il Tree View occupa 260px fissi, lasciando solo ~240px per ViewData — troppo stretto per i Monaco editor (Template, Style).

## Fix
In `PropertiesWithTreeView.tsx`: quando `_lastSelected.view` è truthy (l'utente ha selezionato una view o un viewpoint nel Tree View), il Tree View deve collassarsi automaticamente, dando a ViewData tutta la larghezza del pannello destro.

Quando l'utente clicca "Back" in ViewData (che chiama `clearSelection`, svuotando `_lastSelected`), il Tree View torna visibile.

### Implementazione

```typescript
// In PropertiesWithTreeView, leggi _lastSelected.view dal Redux store
// Se è truthy → forza il tree collapsed
// Se diventa falsy → ripristina lo stato precedente del tree

// Pseudocodice:
const viewSelected = !!props.view; // da mapStateToProps, leggendo state._lastSelected?.view

// Usa viewSelected per sovrascrivere isTreeViewVisible:
const effectiveTreeVisible = viewSelected ? false : isTreeViewVisible;
```

Applica `effectiveTreeVisible` al className (`tree-visible` / `tree-hidden`) e al rendering condizionale del tree container.

**NON** modificare lo stato interno `isTreeViewVisible` — la sovrascrittura deve essere temporanea. Quando l'utente deseleziona la view, il tree deve tornare allo stato che aveva prima.

## Vincoli
- Modifica solo `PropertiesWithTreeView.tsx`
- Se `_lastSelected.view` non è già nelle props di PropertiesWithTreeView, aggiungilo nel mapStateToProps
- Non toccare Info.tsx, ViewData, o il Tree View
- `npm run build` deve passare
- Rimuovi il console.log diagnostico aggiunto in precedenza in Info.tsx (riga `if (mode === 'tab') console.log(...)`)
- Aggiornare `docs/claude-code-log.md`

## Verifica
- Click su una view nel Tree View → Tree View scompare, ViewData occupa tutta la larghezza → sub-tab visibili e usabili
- Click su Template → Monaco editor ha larghezza ragionevole
- Click "Back" / deseleziona → Tree View riappare
- Click su una classe nel canvas → Tree View riappare (clearSelection)
- Toggle manuale del Tree View funziona ancora quando nessuna view è selezionata

```
## 2026-04-10 — fix: auto-collapse tree when view selected for full-width ViewData
**Prompt**: Tree View si collassa quando _lastSelected.view è truthy, ripristina quando falsy
**File toccati**: [lista]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [dettagli]
```
