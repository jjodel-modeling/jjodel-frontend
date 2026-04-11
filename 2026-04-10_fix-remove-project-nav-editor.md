# Task: Rimuovere struttura progetto dalla sidebar sinistra del model editor

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

## Problema
Quando si apre un modello nell'editor (flow/classic), la sidebar sinistra mostra:
1. **INSTANCES** — palette con le metaclassi istanziabili (Person, Address, Student) ✅ CORRETTO
2. **COMPOSITION CHILDREN** — lista dei figli di composizione ✅ CORRETTO  
3. **Struttura progetto** — "Release Test" con Metamodels, Models, Transforms, Viewpoints, Docs ❌ DA RIMUOVERE

La struttura progetto è già visibile nella LeftBar globale (la barra stretta all'estrema sinistra). Mostrarla anche nella sidebar dell'editor è ridondante e ruba spazio alla palette.

## Diagnosi

```bash
# Trova il componente della sidebar sinistra dell'editor
grep -rn "INSTANCES\|COMPOSITION\|Release Test\|project.*structure\|LeftPanel\|SidePanel\|EditorSidebar" \
  src/components/editor-v2/ src/components/abstract/ --include="*.tsx" -l | head -10

# Cerca dove viene renderizzata la struttura progetto nell'editor
grep -rn "Metamodels\|Models\|Transforms\|Viewpoints\|Docs\|project.*nav\|ProjectNav\|StructureSection" \
  src/components/editor-v2/ src/components/abstract/ --include="*.tsx" | head -20

# Oppure cerca il componente che assembla la sidebar
grep -rn "sidebar\|left.*panel\|panel.*left" \
  src/components/editor-v2/EditorV2.tsx src/components/abstract/Dock.tsx --include="*.tsx" | head -20
```

## Fix
Trova il punto dove la struttura progetto (sezioni Structure, Behaviour, Other) viene renderizzata nella sidebar dell'editor e rimuovi quel blocco JSX. 

Mantieni:
- INSTANCES (palette metaclassi)
- COMPOSITION CHILDREN
- I tooltip/helper text in basso ("Drag to canvas", "Drop on node", etc.)

Rimuovi:
- La sezione con il nome del progetto ("Release Test")
- Structure (Metamodels, Models)
- Behaviour (Transforms)
- Viewpoints
- Other (Docs)

## Vincoli
- NON rimuovere il componente della struttura progetto — potrebbe essere usato altrove (es. nella dashboard)
- Rimuovi SOLO la sua invocazione nella sidebar dell'editor
- `npm run build` deve passare
- Aggiornare `docs/claude-code-log.md`

```
## 2026-04-10 — fix: rimuovi struttura progetto duplicata dalla sidebar model editor
**Prompt**: rimuovere sezioni Structure/Behaviour/Other dalla sidebar sinistra dell'editor modello
**File toccati**: [lista]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [dettagli]
```
