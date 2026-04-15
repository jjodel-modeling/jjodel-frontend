# Task: Event Registry Centralizzato

## Obiettivo
Creare un registry tipizzato per tutti i custom DOM events del codebase, poi sostituire tutte le stringhe hardcoded con le costanti del registry. Zero nuovi eventi — solo centralizzazione dell'esistente.

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`

## Fase 1 — Inventario automatico

```bash
# Trova TUTTI i custom events (dispatch + listen)
grep -rn "dispatchEvent\|addEventListener\|removeEventListener\|CustomEvent" src/ \
  --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test." > /tmp/events-raw.txt

# Estrai i nomi degli eventi
grep -oP "'[a-zA-Z:_-]+'" /tmp/events-raw.txt | sort -u > /tmp/event-names.txt
grep -oP '"[a-zA-Z:_-]+"' /tmp/events-raw.txt | sort -u >> /tmp/event-names.txt

cat /tmp/event-names.txt | sort -u
```

Conta gli eventi trovati. Se sono meno di 20 o più di 60, qualcosa è strano — verifica manualmente.

## Fase 2 — Crea il registry

Crea `src/events/registry.ts`:

```typescript
/**
 * Centralized registry for all custom DOM events in Jjodel.
 * 
 * Usage:
 *   import { JjodelEvents } from '@/events/registry';
 *   document.dispatchEvent(new CustomEvent(JjodelEvents.VIEW_CREATED, { detail: ... }));
 *   document.addEventListener(JjodelEvents.VIEW_CREATED, handler);
 * 
 * RULE: Never use raw event name strings. Always use constants from this registry.
 */

// Raggruppa per dominio funzionale basandoti sui prefissi trovati nell'inventario.
// Esempio di struttura (adatta ai nomi reali trovati):

export const JjodelEvents = {
  // Viewpoint & View lifecycle
  VIEW_CREATED: 'jjodel:viewCreated',
  // ... altri
} as const;

export const JjScriptEvents = {
  // JjScript execution
  // ...
} as const;

export const AIEvents = {
  // Jjodie / AI
  // ...
} as const;

// Se ci sono eventi che non rientrano in nessun gruppo, crea un gruppo "General" o "UI"

// Type helper per i listener
export type JjodelEventName = 
  | typeof JjodelEvents[keyof typeof JjodelEvents]
  | typeof JjScriptEvents[keyof typeof JjScriptEvents]
  | typeof AIEvents[keyof typeof AIEvents];
```

**Regole per il raggruppamento:**
- Guarda i prefissi (`jjodel:`, `jjscript:`, `ai:`, ecc.)
- Se non c'è prefisso, guarda il file dove viene usato per capire il dominio
- Ogni costante deve avere un nome SCREAMING_SNAKE_CASE che riflette l'evento
- Il valore stringa deve essere IDENTICO a quello trovato nel codebase (zero rename)

## Fase 3 — Sostituisci le stringhe hardcoded

Per OGNI occorrenza trovata nella Fase 1:

1. Aggiungi l'import: `import { JjodelEvents } from '@/events/registry';` (o il gruppo appropriato)
2. Sostituisci la stringa con la costante: `'jjodel:viewCreated'` → `JjodelEvents.VIEW_CREATED`
3. NON cambiare nient'altro nella riga — solo la stringa → costante

**Attenzione:**
- Se un file usa più eventi di gruppi diversi, importa tutti i gruppi necessari
- Se un evento è usato in un `case` di uno switch, la sostituzione è identica
- Se un evento è costruito dinamicamente (es. template literal), NON sostituirlo — segnalalo nel report

## Fase 4 — Verifica

```bash
# Deve compilare
npm run build

# Verifica zero stringhe residue (escluso il registry stesso)
grep -rn "dispatchEvent\|addEventListener\|removeEventListener" src/ \
  --include="*.ts" --include="*.tsx" | grep -v "registry.ts" | grep -v node_modules | \
  grep -oP "'[a-zA-Z:_-]+'" | sort -u

# Se questa lista NON è vuota, ci sono eventi non migrati → completare
```

## Fase 5 — Log

```
## 2026-04-09 — refactor: centralized event registry
**Prompt**: crea registry tipizzato per tutti i custom DOM events, sostituisci stringhe hardcoded
**File toccati**: src/events/registry.ts (NUOVO) + [lista file modificati]
**Esito**: ✅ | ⚠️ | ❌
**Note**: [N] eventi trovati, [M] file modificati, [K] eventi dinamici non migrabili
```
