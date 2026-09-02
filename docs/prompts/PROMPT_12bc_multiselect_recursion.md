# PROMPT — Slice 12b/12c: multi-selezione e ricorsione inline nel manager

Implementa le due regole restanti del motore form, specificate da `CRUD Manager Simulation.dc.html` (Turni 12b, 12c) e dal contratto `docs/design/design_handoff_instance_node/form-engine-contract.md` (sezione 5, regole ratificate). Una slice sola: condividono formModel e superfici. Il design HTML è la referenza autoritativa.

## 12b — Multi-selezione

- Selezione multipla di righe in tabella (stesso `cls`); la form mostra i campi comuni.
- **Valori Mixed dichiarati**: campo con valori discordi mostra lo stato Mixed esplicito (non vuoto, non il primo valore); una scrittura lo applica a TUTTE le selezionate; un campo non toccato resta com'è per ciascuna.
- **Identità mai bulk**: `name` (e ogni campo che partecipa all'uniqueness tra siblings) è escluso dalla scrittura multipla — assente dalla form multi, non disabilitato, con riga di motivo (idioma Regola 1).
- Delete multipla: un preflight solo, unione dei referrer (12d), con i verdetti per l'insieme.

## 12c — Ricorsione inline

- Un child contenuto si edita **inline a 1 livello** dentro la form del padre; dal secondo livello in poi, **drill-in** (la form naviga al child, breadcrumb per risalire).
- Il drill-in riusa la stessa IRForm — nessuna form parallela (stesso principio di 2c).
- **Qui il filtro containment-loop diventa vivo** (R-2C-3: l'edit di uno slot di containment è uno dei due percorsi che lo raggiungono): i candidati di uno slot di containment in edit passano dal filtro per-istanza in `createDraw` (o dove 2c l'ha collocato — verificalo, non assumerlo). Test per contrasto obbligatorio: candidato che chiude il ciclo assente, lecito offerto — stavolta su percorso raggiungibile.

## Vincoli dalle misure precedenti

- Scritture con la dilazione giusta: `addObject` e la delete differita usano `U.UpdatingTimer` (R-FORM-11) — le scritture bulk di 12b, emesse in un tick, devono rispettare lo stesso ordine (misura prima: la perdita di valore trovata in 12d veniva esattamente da lì).
- Multivalore: buco, non accorciamento (`clearSlotValue`, misura 2b).
- Motore in `jjform/` zero import; divisione `*Draw`/`*Adapter` mantenuta.

## Test attesi

- Mixed: due istanze con `kind` diverso → Mixed dichiarato; scrittura → entrambe; campo non toccato invariato.
- Identità: `name` assente dalla multi-form con motivo; uniqueness resta valida dopo scritture bulk.
- Ricorsione: livello 1 inline, livello 2 drill-in con breadcrumb; round-trip dei valori a ogni livello.
- Containment-loop: per contrasto, su percorso vivo.
- Delete multipla: preflight unico, unione referrer corretta.

## Fuori scope

Outline 10b, diagramma 13a, valutazione dei derived.

## Coordinamento

Due sessioni parallele: R-STR-6 (canvas, `ObjectNode`/render path) e scss orfani (`nestedView.scss` + `ViewData`). Pathspec, entry di log in commit separato.
