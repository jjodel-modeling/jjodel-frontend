# Fix guard `computeIRSignature` — firma vuota con una sola vista IR

**Data**: 2026-07-22
**Tipo**: fix
**Priorità**: media (task piccolo e isolato, non critical-zone, no two-phase)
**Branch**: `alfonso-frontend-jjtl`

## COSA

In `computeIRSignature` esiste una guard che ritorna la stringa vuota `''` quando il numero di parti raccolte (`parts`) è `<= 1`, cioè quando il viewpoint attivo ha **zero o una sola vista IR**. Con una sola vista IR attiva, la firma calcolata resta sempre `''` e non cambia mai al variare dei campi authored (shape, border, fill, ecc.). Il risultato è che il meccanismo di re-render basato sulla firma non intercetta più le modifiche e la live preview del vertex authoring panel smette di aggiornarsi.

Questo è un bug diverso da quello diagnosticato e risolto in questa sessione (root cause CSS, non dispatch): qui la catena reattiva funziona, ma la guard sopprime la firma a monte quando c'è **una sola** vista IR nel viewpoint attivo. Va chiuso prima di iniziare Fase B2, altrimenti qualsiasi test o demo su un viewpoint con una sola vista IR mostrerebbe di nuovo una live preview "morta", facendo perdere tempo a ridiagnosticare un sintomo già capito.

## DOVE

`src/jjtl/irResolveCore.ts`, funzione `computeIRSignature`, guard intorno alla riga 65 nella versione nota all'inizio di questa sessione (`parts.length > 1`).

**Attenzione**: il path e il numero di riga sono quelli dell'ultimo stato noto prima delle modifiche di Fase B (ri-stratificazione box painting) fatte in questa stessa giornata. Confermare la posizione esatta con:

```
grep -rn "computeIRSignature" src/
```

prima di editare, perché la Fase B potrebbe aver spostato righe nello stesso file o in file limitrofi.

## COME

1. Individuare la funzione `computeIRSignature` e la guard che confronta `parts.length`.
2. Correggere la condizione in modo che:
   - **zero** viste IR nel viewpoint attivo → la firma resta `''` (comportamento invariato, corretto: non c'è nulla da firmare).
   - **una o più** viste IR nel viewpoint attivo → la firma viene calcolata normalmente a partire da `parts`, e può quindi cambiare quando cambiano i campi authored.
3. Non toccare il comportamento già corretto per il caso con 2+ viste IR.
4. Non rinominare `computeIRSignature` né alterarne la signature esterna: chi la chiama oggi non deve cambiare.
5. Verificare che il calcolo della firma nel caso "1 vista" sia deterministico e stabile (nessuna chiamata costosa ripetuta inutilmente, nessun side effect nuovo).
6. Build/typecheck: eseguire `npm run build` (o il comando di typecheck usato nel progetto) e confermare che il conteggio errori resti alla baseline nota (33) o segnalare esplicitamente eventuali variazioni.

## Verifica manuale (richiesta da Alfonso su localhost:3001, hard-refresh)

- Aprire un viewpoint che ha **una sola** vista IR attiva. Modificare un campo dal vertex authoring panel (es. shape, colore/spessore border, fill) e confermare che la live preview si aggiorna.
- Riverificare anche un viewpoint con **2+ viste IR** (caso già funzionante): il comportamento deve restare identico a prima, nessuna regressione.

## Scope

- Toccare solo `src/jjtl/irResolveCore.ts` (o il file reale dove risiede `computeIRSignature`, se il grep sopra indica un path diverso).
- Nessun refactoring opportunistico: non toccare altro codice nella stessa funzione/file oltre alla guard.
- `git add` solo del/dei file effettivamente modificati, mai `git add .`.

## Commit

Messaggio proposto: `fix: computeIRSignature no longer returns empty signature with a single IR view`

## Log

Aggiungere entry in `docs/claude-code-log.md` a fine task, formato standard:

```
## 2026-07-22 — fix: guard computeIRSignature con una sola vista IR
**Prompt**: fix guard che azzerava la firma IR quando il viewpoint ha una sola vista IR, rompendo la live preview del vertex authoring panel
**File toccati**: <path effettivo di irResolveCore.ts>
**Esito**: ✅/⚠️/❌
**Note**: (opzionale)
**Nome del documento prompt**: 2026-07-22_prompt_fix_computeIRSignature_guard.md
```

## Riferimenti

- Root cause e priorità individuate nel checkpoint di sessione `sessione_2026-07-22_2.md` (sezione "Bug nuovi / Todo").
- Non correlato al lavoro di ri-stratificazione CSS appena chiuso (Fase B): quel bug era di layering, questo è di logica della firma.
