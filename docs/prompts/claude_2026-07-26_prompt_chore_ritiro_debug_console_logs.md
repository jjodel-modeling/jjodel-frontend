# Prompt Claude Code — chore: ritiro dei log di debug runtime dalla console

**Data**: 2026-07-26
**Branch di lavoro**: confermare il branch attivo prima di iniziare (default di riferimento: `alfonso-frontend-jjtl`; se il WIP è altrove, fermarsi e chiedere).
**Tipo**: chore, basso rischio. Solo rimozioni di statement di logging. Nessuna modifica di logica. Nessun file critical-zone atteso.

## Contesto

La console stampa log di debug rumorosi a ogni render/interazione, per esempio:

```
[laneA:producer] Pointer1785064921911_USER_245 [{"x":272,"y":188},{"x":272,"y":145},{"x":240,"y":145},{"x":240,"y":102}]
```

Sono residui di sviluppo (sessione waypoints). Todo noto 2026-07-18: *"(bassa) Rimuovere i log di debug `[laneA:producer]` in EditorV2.tsx:940 (residuo sessione waypoints)."* Alfonso vuole via **tutti** i log di debug-trace di questo tipo, non solo quello a riga 940.

Obiettivo: console pulita in uso normale, senza toccare la logica né la gestione degli errori.

## COSA

### Fase 1 — discovery read-only (con report obbligatorio, hard stop)

1. `grep` globale su `src/` per `console.(log|debug|info)`; enumerare ogni occorrenza e classificarla in tre categorie:
   - **(a) da rimuovere** — dev-trace di debug: primo argomento stringa letterale che inizia con un tag fra parentesi quadre nella convenzione di trace, in particolare la famiglia lane produttore/consumatore (`[laneA:...]`, `[laneB:...]`, `[lane...]`) e analoghi trace stampati per render/interazione;
   - **(b) da tenere** — `console.error` / `console.warn` su path di errore reali, e qualunque log non-trace (notice utente, diagnostica intenzionale che l'app usa davvero);
   - **(c) ambigui** — non rimuovere, elencarli e girarli ad Alfonso.
2. **Report obbligatorio**: salvare il discovery report in `docs/discovery/` con nome `discovery_2026-07-26_debug_console_logs.md`. Contenuto minimo: obiettivo, pattern e file grepati (path completi), **inventario completo** in tabella (tag → `file:riga` → categoria a/b/c), rischi individuati, domande aperte per Alfonso. L'output volatile del terminale non basta: la Fase 1 non è completa finché il report non è scritto.
3. Prima di eliminare qualsiasi statement, leggere la funzione circostante e verificare che il log sia **puro**: se un argomento contiene un'espressione con side effect (es. `console.log(x = f())`, o un log che è l'unico ramo che esegue una chiamata necessaria), STOP e flaggarlo come categoria (c), non rimuoverlo.

### Fase 2 — rimozione scoped (solo dopo che la Fase 1 ha prodotto il report)

4. Rimuovere **solo** la categoria (a). Eliminare l'intero statement (e la sua riga); nessun'altra modifica, nessun refactor, nessun riordino di import, nessuna rinomina.
5. Se togliendo un log resta un blocco/guardia vuoto la cui unica ragione d'essere era quel log (es. `if (DEBUG) { console.log(...) }` con nient'altro dentro), rimuovere anche la guardia ora inerte; se c'è qualsiasi dubbio sul fatto che la guardia serva ad altro, lasciarla e flaggare in (c).
6. Preservare **verbatim** le categorie (b) e (c).

## Vincoli

- Toccare **solo** i file che contengono i log della categoria (a). Se sembra necessario altro, STOP e segnalare.
- Zero refactoring opportunistico; mai rinominare identificatori esistenti; interfacce TypeScript invariate. La diff deve essere fatta di sole cancellazioni di righe di log.
- **Critical-zone** (`useJjomSync.ts`, `portDistribution.ts`): se un dev-trace vive lì, **non** rimuoverlo in questo task; elencarlo in (c) e fermarsi per go-ahead esplicito.
- Non toccare `console.error` / `console.warn`.
- Gli snippet di console `[cd-ir...]` del testbed **non** stanno nel codebase (sono documenti di progetto): fuori scope, ignorarli.

## COME

- Pattern di partenza per il grep: `console\.(log|debug|info)\s*\(`, poi restringere a quelli tag-brackettati `console\.(log|debug|info)\s*\(\s*['"` + "`" + `]\[`, e in più una passata mirata su `\[lane`.
- Ancora nota da cui partire: `EditorV2.tsx` (famiglia `[laneA:producer]`, ~riga 940). Ma la famiglia può estendersi su `src/components/editor-v2/` e file vicini: il grep deve essere globale, non limitato a quel file.
- Edit puntuali (`str_replace`), uno statement alla volta.
- La rimozione non deve cambiare il control flow.

## Verifica (gate)

- `npm run build` senza errori (comando reale da `package.json`).
- Typecheck a baseline.
- Suite test verde (nessun test modificato).
- Verifica visiva/console la esegue **Alfonso**: hard-refresh su `http://localhost:3001/`, interagire con i nodi/waypoint e confermare che la console non stampa più i trace `[lane...]`, e che errori/warning legittimi restano.

## Output e chiusura

1. Discovery report scritto (obbligatorio) **prima** di ogni rimozione.
2. Gate build/typecheck/test verdi.
3. Entry in `docs/claude-code-log.md` (tipo `chore`) che cita questo documento prompt con data e ora.
4. Staging scoped per file (`git add <file specifici>`, mai `git add .`). Commit: `chore: remove runtime debug console logs (lane waypoints residue)`. **Nessun push** senza go-ahead.
5. HARD STOP. Nel report di chiusura: file toccati con una riga ciascuno, numero di log rimossi per file, elenco della categoria (c) ambigua lasciata in piedi, eventuali dev-trace trovati in critical-zone (non rimossi), scostamenti dal prompt motivati.

## RIFERIMENTI

- Todo 2026-07-18: rimozione `[laneA:producer]` in EditorV2.tsx ~940 (residuo waypoints).
- Esempio del log da rimuovere: `[laneA:producer] Pointer..._USER_245 [{"x":..,"y":..}, ...]`.
