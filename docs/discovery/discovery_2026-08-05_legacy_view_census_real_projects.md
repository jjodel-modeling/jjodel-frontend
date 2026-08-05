# Censimento delle view legacy sui progetti reali salvati

**Data**: 2026-08-04 (aggiornato dopo S1)
**Tipo**: misura read-only, eseguita in chat di progetto, non da Claude Code.
**Corpus**: i progetti in `localStorage['projects']` della sessione di sviluppo, modalita
offline (`U.isOffline() === true`): 80 progetti salvati, 64 con stato non vuoto.

Questo documento e la base di evidenza citata dai commenti della migration
`2.225 -> 2.226` in `frontend/src/redux/VersionFixer.tsx`.

## Perche e servito

Il censimento precedente (`discovery_2026-08-04_legacy_viewpoint_census.md`) misurava
`frontend/src/examples/`. Verifica successiva: quei quattro blob non sono importati da
nessun file del repo (grep su tutto il repo, zero importatori; in UI Templates renderizza
vuoto ed Explore e "coming soon"). Sono codice morto, quindi quei numeri non descrivono
progetti reali. Questo documento li sostituisce.

## Note di metodo

1. **Decompressore.** `U.decompressState` usa `async-lz-string`, che chiama `wait()` cioe
   `setTimeout(resolve, 0)` dentro il ciclo di decompressione. Su un progetto da 48 KB non
   ha terminato entro 45 secondi nel contesto di esecuzione usato per la misura. Con un
   decompressore `lz-string` sincrono, formato identico, lo stesso progetto si decomprime
   in 61 ms con output verificato. Il divario e probabilmente amplificato dal contesto
   isolato in cui girava lo script, ma la libreria fa yield per simbolo e quella funzione
   sta sul percorso di caricamento di ogni progetto. Da misurare pulito dentro la pagina.
2. **Il predicato e replicato, non invocato.** Il conteggio trascrive `isKnownDefault`
   invece di chiamare il codice della migration: c'e un rischio di divergenza. Le due
   clausole di uguaglianza sui template interi sono state omesse perche di fatto coperte
   dagli `includes`. I numeri del terzo ramo sono quindi un limite superiore.

## Prima di S1

| Misura | Valore |
|---|---|
| Progetti con stato | 64 su 80 |
| `DViewElement` totali | 1680, con `jsxString` 1550 |
| gia con `ir` / gia flaggate | 49 / 60 |
| secchio 1 (riceve `ir`) | 44 |
| secchio 2 (marker value) | 22 |
| secchio 3 (marcate legacy) | 1315 |
| secchio 5 (default riconosciuta) | 60 |
| template distinti nel secchio 3 | 50, di cui 27 unici |

I template piu frequenti del secchio 3 non erano notazione autorata: edge view delle
relazioni standard (Association 195, Aggregation / Composition / Extension 62 ciascuna),
view di sintassi astratta `Jjodel Abstract Syntax Specification` in tre versioni storiche,
`edgePoint` 62, overlay degli anchor 61, placeholder `void model-less` 61. Sono tutte view
che il tool genera da se.

## Dopo S1

S1 ha esteso `isKnownDefault` con cinque clausole
(`frontend/src/utils/defaultViewTemplate.ts:174-189`).

| Misura | Prima | Dopo |
|---|---|---|
| secchio 3 | 1315 | 86 |
| secchio 5 | 60 | 1289 |
| template distinti nel residuo | 50 | 25 |

Riduzione del 93%. Tutte e cinque le clausole scattano: sintassi astratta 664, edge
relation 381, edgePoint 62, anchor 61, void 61. Nessuna e morta.

## Residuo, e la sesta clausola mancante

Delle 86 rimaste, 61 sono un solo template, anch'esso una default del tool: la view di
overlay degli errori di validazione, `<section className="overlap">` con commento di
sviluppo su `usageDeclarations` e `onDataUpdate`, che termina con
`<div className="error-message">{errors.separator(<br/>)}</div>`. Non e coperta da
`CLASSIC_ANCHOR_OVERLAY_MARKER`, che intercetta un'altra view che condivide la classe
`overlap`.

Frammento marker proposto: `errors.separator(`.

Con quella clausola il residuo scende a 25 view su 1550, cioe l'1,6%, quasi tutte a
occorrenza singola (`od-node`, `od-attr`, header custom, una `root model` con
`grid-paper`). Quello e il bacino plausibile della notazione realmente autorata, ed e
abbastanza piccolo da esaminarsi a mano.

## Aperto

- Quante delle 25 residue siano davvero autorate: si decide guardandole.
- I 60 progetti gia flaggati per errore non vengono ripuliti da S1: la guardia di
  idempotenza li salta. La bonifica e una decisione non presa.
- `state.version` e un oggetto `{n, date, conversionList}`, non uno scalare: la
  distribuzione per versione di schema non e stata estratta.
