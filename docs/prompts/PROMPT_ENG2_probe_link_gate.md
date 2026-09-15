# PROMPT — ENG2: gate sulle sonde per il doppio append (micro, PARALLELO)

Discende da ENG1-B (`discovery_2026-09-01_eng1_containment_core.md` §B.6). Decisione presa (01-09): la coerenza di `setValueAtPosition` RESTA un contratto del chiamante (un indice proprio per gesto, o una sola `set_values`) — nessun verdetto nuovo, nessun tocco al core. Questa slice chiude l'unica riproduzione misurata, che era strumentale.

## Cosa fare

- Una `link` condivisa in `states.ts` (fixture delle sonde) che ASSERISCE la forma costruita invece di ricalcolare l'indice dallo store — il pattern è già documentato in `scripts/smoke/README-probes.md` §«Assert the setup, do not wait for it».
- Migra i posatori di containment delle sonde esistenti che usano la forma pericolosa (due append con indice ricalcolato); il referto 10g nota anche che le sonde 10c..10f posano con `SetFieldAction` grezza producendo modelli senza `father` — se la `link` può curare anche quello a costo nullo, fallo e dichiaralo; se no, solo nota.
- Il contratto del chiamante va PINNATO: una riga nel commento di `get_setValueAtPosition` (solo commento — il codice non si tocca) + il paragrafo nel README-probes.

## Test attesi

- La `link` su slot vuoto e su slot popolato produce `values` e `father` coerenti (l'orfano di A1 non è più costruibile con la fixture).
- Il caso A1 del referto ENG1 riprodotto CON la `link` → nessun orfano.

## Fuori scope

Ogni modifica a `LModelElement.tsx` e `action.ts` (la decisione è presa: niente verdetto, niente store vivo in `_clearValueAtPosition` — è la trappola dichiarata in §B.6), OQ-2/OQ-4 (restano aperte, si decidono con la slice guard se mai servirà).

## Coordinamento

Parallelo a UX1: perimetro fixture sonde + README, zero file condivisi. Pathspec, entry di log in commit separato.
