# Censimento delle view legacy sui progetti reali

**Data**: 2026-08-04, aggiornato dopo S1
**Metodo**: eseguito in sola lettura nella sessione browser di Alfonso (modalità offline,
`U.isOffline() === true`), sui progetti in `localStorage['projects']`.
**Corpus**: 80 progetti salvati, di cui 64 con stato non vuoto. Nessuna scrittura.

## Perché è servito

Il primo censimento del 2026-08-04 ha misurato `frontend/src/examples/`, quattro blob che
nessun file del repo importa (grep su tutto il repo: zero importatori; in UI Templates
renderizza vuoto ed Explore è "coming soon"). Quei numeri non descrivono progetti reali. Questo
documento li sostituisce.

## Nota di metodo

Due avvertenze sulla misura.

1. **Il decompressore.** `U.decompressState` usa `async-lz-string`, che chiama `wait()` cioè
   `setTimeout(resolve, 0)` dentro il ciclo. Su un progetto da 48 KB non ha terminato entro 45
   secondi nel contesto di esecuzione usato. Riscritto un decompressore `lz-string` sincrono,
   formato identico: **61 ms**, output verificato. Il divario è probabilmente amplificato dal
   contesto isolato, ma la libreria fa yield per simbolo e quella funzione sta sul percorso di
   caricamento di ogni progetto. Vedi bug aperti.
2. **Il predicato è replicato, non invocato.** Il conteggio trascrive `isKnownDefault` invece
   di chiamare il codice della migration, quindi c'è un rischio di divergenza. Le due clausole
   di uguaglianza sui template interi (`DEFAULT_VIEW_JSX_STRING`,
   `DEFAULT_VIEW_JSX_V2_3_LEGACY`) sono state omesse perché praticamente coperte dagli
   `includes`. I numeri del terzo ramo vanno quindi letti come **limite superiore**.

## Prima di S1

| Misura | Valore |
|---|---|
| Progetti con stato | 64 su 80 |
| `DViewElement` totali | 1680, con `jsxString` 1550 |
| già con `ir` / già flaggate | 49 / 60 |
| secchio 1 (riceve `ir`) | 44 |
| secchio 2 (marker value) | 22 |
| **secchio 3 (marcate legacy)** | **1315** |
| secchio 5 (default riconosciuta) | 60 |
| template distinti nel secchio 3 | 50, di cui 27 unici |

I template più frequenti del secchio 3 non erano notazione autorata: edge view delle relazioni
standard (`Association` 195, `Aggregation`, `Composition`, `Extension` 62 ciascuna), view di
sintassi astratta `/* -- Jjodel Abstract Syntax Specification vX.Y -- */` in tre versioni
storiche, `edgePoint` 62, overlay degli anchor 61, placeholder `void model-less` 61. Tutte view
che Jjodel genera da sé.

## Dopo S1

S1 ha esteso `isKnownDefault` con cinque clausole nuove
(`utils/defaultViewTemplate.ts:174-189`): `CLASSIC_EDGE_RELATION_MARKER`,
`JJODEL_ABSTRACT_SYNTAX_MARKER`, `CLASSIC_EDGEPOINT_VIEW_MARKER`,
`CLASSIC_ANCHOR_OVERLAY_MARKER`, `CLASSIC_VOID_VIEW_MARKER`.

| Misura | Prima | Dopo |
|---|---|---|
| secchio 3 | 1315 | **86** |
| secchio 5 | 60 | **1289** |
| template distinti nel residuo | 50 | 25 |

Riduzione del 93%. Tutte e cinque le clausole nuove scattano, nessuna è morta: sintassi
astratta 664, edge relation 381, edgePoint 62, anchor 61, void 61.

## Il residuo, e la sesta clausola che manca

Delle 86 rimaste, **61 sono un solo template**, anch'esso una default del tool: la view di
overlay degli errori di validazione, `<section className="overlap">` con un commento di
sviluppo su `usageDeclarations` e `onDataUpdate`, che termina con
`<div className="error-message">{errors.separator(<br/>)}</div>`. Non è coperta da
`CLASSIC_ANCHOR_OVERLAY_MARKER`, che intercetta l'altra view di anchor.

Frammento marker proposto: **`errors.separator(`**. È una chiamata specifica di quel template,
improbabile in notazione autorata, e stabile se il commento venisse riscritto.

Con quella clausola il residuo scende a **25 view su 1550, cioè l'1,6%**, e sono quasi tutte a
occorrenza singola: `od-node`, `od-attr`, header custom, una `root model` con `grid-paper`.
Quello è il bacino plausibile della notazione realmente autorata, ed è abbastanza piccolo da
guardarsi a mano una per una.

## Aperto

- Quante delle 25 residue siano davvero autorate: si decide guardandole.
- I 60 progetti già flaggati per errore non vengono ripuliti da S1, perché la guardia di
  idempotenza li salta. La bonifica è una decisione non presa.
- `state.version` è un oggetto `{n, date, conversionList}`, non uno scalare: la distribuzione
  per versione di schema non è stata estratta.
