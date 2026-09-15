# Task: JjScript Test Suite

## Obiettivo
Creare una test suite completa per tutti i comandi JjScript. Attualmente ci sono 0 test su ~19 comandi e ~60 file. Questa suite deve coprire ogni comando con almeno un test positivo e uno negativo.

## Setup
1. Leggi `CLAUDE.md` in root
2. Leggi `docs/claude-code-log.md`
3. Se esiste `docs/audit-jjscript-canvas-sync.md`, leggilo — contiene un inventario dei comandi

## Fase 1 — Inventario comandi

```bash
# Trova tutti i file del parser/executor JjScript
find src/ -path "*jjscript*" -o -path "*JjScript*" -o -path "*jj-script*" | grep -v node_modules

# Trova i comandi supportati
grep -rn "case\|command\|CommandType\|execute\|handler" src/*jjscript*/ src/*JjScript*/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null | head -80
```

Compila la lista completa dei comandi. Dall'ultimo audit dovrebbero essere circa 19:
- create class, create attribute, create reference, create enumeration, create operation, create literal, create containment
- delete, rename, set, move (se esistono)
- altri trovati nel codebase

Per OGNI comando annota:
- Il file che lo implementa
- I parametri che accetta
- Il tipo di risultato atteso

## Fase 2 — Setup test framework

Verifica quale test framework è configurato:
```bash
# Controlla package.json
grep -A5 '"test"\|"jest"\|"vitest"\|"mocha"' package.json

# Controlla config files
ls vitest.config.* jest.config.* 2>/dev/null
```

Se **nessun framework** è configurato:
- Installa Vitest (coerente con Vite): `npm install -D vitest`
- Aggiungi script in package.json: `"test": "vitest run", "test:watch": "vitest"`
- Crea `vitest.config.ts` minimale che estende la vite config esistente:
```typescript
import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig({
  ...viteConfig,
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

Se un framework è **già configurato**, usalo — non cambiare.

## Fase 3 — Crea i test

Crea i file di test nella stessa directory dei file sorgente (o in una directory `__tests__` adiacente se è la convenzione del progetto).

### Struttura dei test per ogni comando

```typescript
// Esempio per "create class"
import { describe, it, expect, beforeEach } from 'vitest'; // o il framework trovato

describe('JjScript: create class', () => {
  let context: /* tipo del contesto di esecuzione JjScript */;

  beforeEach(() => {
    // Setup: crea un progetto/metamodello vuoto minimale
    // Usa le API interne del codebase, NON mock everything
    // Cerca come i test esistenti (se ce ne sono) o come i componenti
    // creano un contesto JjScript
  });

  it('should create a class with the given name', () => {
    // Esegui: create class "Person"
    // Verifica: il metamodello contiene una classe "Person"
  });

  it('should create a class with attributes', () => {
    // Esegui: create class "Person" with attribute "name" type String
    // Verifica: la classe ha l'attributo
  });

  it('should reject duplicate class names', () => {
    // Esegui: create class "Person" due volte
    // Verifica: errore o comportamento documentato
  });

  it('should handle empty name gracefully', () => {
    // Esegui: create class ""
    // Verifica: errore, non crash
  });
});
```

### Priorità dei test

Per ogni comando, scrivi test in quest'ordine:
1. **Happy path** — il comando funziona con input valido
2. **Edge case** — nome vuoto, nome con spazi, nome duplicato
3. **Integrazione** — il comando modifica correttamente il modello (verifica che gli oggetti creati siano navigabili via LModel o DObject)

### Test di integrazione cross-comando

Dopo i test unitari per comando, aggiungi una suite di integrazione:

```typescript
describe('JjScript: integration', () => {
  it('should execute a full metamodel creation script', () => {
    // Script multi-comando:
    // create class "Person"
    // create attribute "name" in Person type String
    // create class "Address"
    // create reference "address" in Person type Address [0..1]
    // Verifica: metamodello completo e coerente
  });

  it('should handle script with errors gracefully', () => {
    // Script con un comando invalido in mezzo
    // Verifica: i comandi prima dell'errore sono stati eseguiti,
    // l'errore è segnalato, il modello è in stato consistente
  });
});
```

## Fase 4 — Capire le dipendenze del contesto

Questo è il punto più delicato. JjScript probabilmente ha bisogno di:
- Un progetto attivo (o un mock)
- Un metamodello in cui operare
- Forse un Redux store inizializzato

**Strategia**: cerca come JjScript viene invocato nel codice applicativo:
```bash
grep -rn "execute\|run\|eval" src/*jjscript*/ --include="*.ts" | head -20
grep -rn "JjScript\|jjscript" src/components/ --include="*.tsx" | head -20
```

Segui il call chain per capire cosa serve per costruire un contesto di test minimale.
- Se serve Redux: usa un store reale con `configureStore()` (non mock), popolato con un progetto vuoto
- Se serve LModel: crea un LModel minimale
- Se serve il DOM: vitest con jsdom lo fornisce

**NON mockare le API interne di Jjodel** — i test devono verificare il comportamento reale, non che i mock siano corretti.

## Fase 5 — Esegui i test

```bash
npm run test
```

- Tutti i test devono passare OPPURE
- I test che falliscono devono essere marcati `it.skip('reason: ...')` con una spiegazione chiara del perché (es. "richiede Redux store completo, da implementare")
- Il report deve indicare: N test totali, M passati, K skippati

## Fase 6 — Verifica build

```bash
npm run build
```

I test non devono rompere la build.

## Fase 7 — Log

```
## 2026-04-09 — feat: JjScript test suite
**Prompt**: crea test suite completa per tutti i comandi JjScript
**File toccati**: [lista file test creati] + package.json (se aggiunto vitest) + vitest.config.ts (se creato)
**Esito**: ✅ | ⚠️ | ❌
**Note**: [N] comandi trovati, [M] test scritti, [K] test skippati con motivo. Framework: [vitest/jest/altro]
```
