# DOC2 — censimento dei numeri normativi stantii

Data: 2026-09-02. Branch `alfonso-frontend-jjtl`. Corsia DOC2, punto 3.

## Ipotesi che il censimento falsifica

«Il `1000ms` del docstring di `useLayoutAutosave.ts` era l'unico numero normativo
rimasto indietro dopo SAVE2.» Falsificata: ne esistono altri, e uno e' la stessa
affermazione ricopiata in un secondo file.

## Comando

In shell interattiva `grep` e' `ugrep --ignore-files` e `--include` non filtra
(CLAUDE.md §5): il censimento e' girato con `command grep`, che qui risolve a BSD
grep 2.6.0-FreeBSD.

```
command grep -nE '[0-9]+ ?(ms|millisecond|secondi|minuti|s\b)|[0-9]{3,}' \
  docs/PROTOCOL.md \
  frontend/src/api/persistance/projects.ts \
  frontend/src/components/editor-v2/hooks/useLayoutAutosave.ts \
  frontend/src/components/editor-v2/hooks/createAdapter.ts \
  frontend/src/components/editor-v2/sync/canvasToJjom.ts \
  frontend/src/redux/reducer/reducer.ts \
  frontend/src/components/editor-v2/hooks/useJjomSync.ts \
  | command grep -E '^\S+:[0-9]+: *(//|\*|#|[A-Za-z].*—)'

command grep -nE '\b(3147|3207|1000 ?ms|1000ms|450 ?ms|300 ?ms|15 ?s|120 ?s)\b' <stessi file> docs/decisions.md

command grep -nE '\b[0-9]+ (test|tests|entry|entries|file|files|voci|occorrenze)\b|baseline.*[0-9]{2}|soglia (di )?[0-9]+|\b3[0-9]{3}\b' \
  docs/PROTOCOL.md docs/decisions.md
```

**Rettifica di perimetro.** Il prompt cita `reducer.ts`: il file e'
`frontend/src/redux/reducer/reducer.ts`, non `frontend/src/redux/reducer.ts`
(quest'ultimo non esiste). Rettifica di percorso, non di soggetto.

## Ritrovamenti

Tutti verificati **dopo** l'edit del punto 1. Nessuno corretto: questa e' una lista.

### Stantii — il valore scritto non e' il valore reale

1. **`frontend/src/api/persistance/projects.ts:105`** — scritto: «fires 1000ms
   after a gesture (`useLayoutAutosave.ts`)». Reale: idle 15 s
   (`AUTOSAVE_DEBOUNCE_MS`, `useLayoutAutosave.ts:71`) con tetto 120 s
   (`AUTOSAVE_MAX_WAIT_MS`, `:84`), da SAVE2 `4bc765e85`. **E' lo stesso difetto
   del punto 1, ricopiato in un secondo file**: la ragione per cui il punto 1 non
   riscrive il numero ma punta alla costante.

2. **`docs/log-inbox/view1.md:13`** e
   **`docs/discovery/discovery_2026-09-02_view1_create_manager_vertice.md:154`** —
   scritto: `vitest` 3147 verdi. Reale misurato a HEAD `518aa6f31`:
   **3207 passed / 0 failed**, 129 file passati su 138, 9 file che non si
   raccolgono (`window is not defined` all'import, pre-esistenti). Scarto **60**,
   non 9: i 9 dichiarati da SAVE2 erano i propri test nuovi, il resto e' arretrato
   di altre corsie. I due documenti sono referti gia' committati e restano
   verbatim; il numero da citare nei prompt futuri e' 3207, misurato.

3. **`CLAUDE.md:14`** e **`CLAUDE.md:102`** — scritto: «docs/PROTOCOL.md (P1..P9)».
   Reale: `P10` esiste dal 2026-08-15, e DOC2 aggiunge `P11`. Il range era gia'
   stantio prima di questo giro. **Non corretto qui**: `CLAUDE.md` e' perimetro
   DOC1, e il punto 1 dichiara hard stop su qualunque motivo di toccarlo.
   `docs/PROTOCOL.md:11` e' invece aggiornato a `P1..P11` da questo giro, perche'
   e' la riga che DOC2 rende falsa.

### Verificati corretti — nessuna azione

4. **`450ms`** (`useLayoutAutosave.ts:24`, `projects.ts:105`,
   `docs/decisions.md:1111`, `:1808`) — **corretto**. `isRelevantChangeCheck`
   (`redux/reducer/reducer.ts:1274`) calcola `mergeTolerance = U.UpdatingTimer*1.5`
   e confronta a `:1278`; `U.UpdatingTimer = 300` (`common/U.tsx:176`), quindi
   450 ms. Anche il riferimento `reducer.ts:1278` di `projects.ts:106` e' esatto,
   modulo il percorso (`redux/reducer/reducer.ts`).

5. **`300ms`** (`projects.ts:194`) — corretto, `U.UpdatingTimer` a `common/U.tsx:176`.

6. **baseline `33`** (`docs/decisions.md:16`, `CLAUDE.md` §17) — corretto:
   `npx tsc --noEmit` su output **completo** a HEAD conta 33 `error TS`.

7. **soglia 40 entry** (`docs/PROTOCOL.md:91`) — coerente: `check:docs` conta 10
   entry attive, sotto soglia.

8. **soglia 5 file** (`docs/PROTOCOL.md:59`, regola 19, `docs/decisions.md:42`) —
   coerente fra i tre siti.

## Conteggio

Tre voci stantie (1, 2, 3), su cinque verificate corrette. Sotto la soglia di dieci
del prompt: non serve una corsia sua. La voce 1 e' l'unica dentro il perimetro di
correzione di un giro futuro; le voci 2 vivono in referti gia' committati, che si
tengono verbatim.
