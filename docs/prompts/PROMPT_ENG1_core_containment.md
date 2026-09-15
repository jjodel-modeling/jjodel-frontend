# PROMPT — ENG1: due difetti del core sul containment (PARALLELO a 10j-chiusura)

Entrambi misurati e dichiarati fuori perimetro dal referto 10g (`discovery_2026-08-31_10g_outline_doppi.md` §3 e §6) — leggilo prima. File: `model/logicWrapper/LModelElement.tsx` (core → §5 CLAUDE.md: censimento consumer prima di ogni cambio di comportamento).

## A. `set_containment` rifiuta e restituisce `true` (fix)

`LReference.set_containment` (~:4004-4060): sul ramo auto-composizione (`father === type`) logga il warning e `return true` — il chiamante non ha modo di sapere che la scrittura non è avvenuta. La shape di `substates` (State→State) è vittima nota.

- Censisci i chiamanti che leggono il ritorno (il referto 2026-07-27 `containment_single_container_guard` mappa i consumer di massa) — se nessuno lo legge, il fix è `return false` secco; se qualcuno lo legge, dichiara chi e cosa cambia.
- Decisione di merito NON tua: il rifiuto stesso resta (una self-composition è legittimamente bloccata); cambia solo la verità del ritorno.
- Test: chiamata rifiutata → ritorno falsy + warning presente; chiamata legittima → ritorno truthy e scrittura avvenuta.

## B. Orfano da doppio append in `setValueAtPosition` (DISCOVERY-FIRST)

Fixture 10g: due append consecutivi su `Cooler.states` hanno lasciato lo slot a `["Broken"]` con `Off.father` ancora puntato lì. La causa nel core NON è stata cercata (§6). Prima referto, poi — solo se il fix è locale e a blast radius dichiarato — la correzione; altrimenti il referto chiude la slice e la correzione diventa prompt a sé.

- Punto di partenza: `get_setValueAtPosition` + auto-move (~:7433-7532), `_clearValueAtPosition` (~:7409-7432), mappa nel referto 2026-07-27.
- Riproduci in unit test il doppio append prima di toccare qualunque cosa.
- Nota dal referto: le sonde 10c..10f posano containment con `SetFieldAction` grezza (modelli senza `father`) — non usarle come riproduzione.

## Fuori scope

La sweep dell'outline (10g, corretta, non toccarla), il guard single-container (decisione aperta OQ-4 del 2026-07-27, non deciderla qui), ogni superficie manager.

## Coordinamento

Parallelo alla chiusura 10j (manager) e a eventuali micro su scss: zero file condivisi (`LModelElement.tsx` + test core sono tuoi). Committa con pathspec, A e B in commit separati, entry di log in commit a sé. Gate: typecheck baseline 33, vitest verde, build exit 0; mutazioni sulla suite nuova.
