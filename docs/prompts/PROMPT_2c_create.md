# PROMPT — Slice 2c: create di istanze nell'Instance Manager

Implementa la create di istanze nel manager CRUD, specificata da `CRUD Manager Simulation.dc.html` e dal contratto `docs/design/design_handoff_instance_node/form-engine-contract.md` (versione allineata 2026-08-30 — leggila prima: sezioni 5 «Eventi astratti» e punto aperto 6). Il design HTML è la referenza autoritativa per copy, spaziature e stati.

## Dove

- Tab del progetto introdotto in 2a (lista per metaclasse + IRForm ospitata) e tabella di 2b (`instanceTable`, colonne per-attributo, «referenced by»). Nessuna superficie nuova.
- Adapter: `shapeAdapter.ts` / `shapeDraw.ts` — **mantieni la divisione** (R-2B-3: il barrel del joiner importa monaco → `window` a import time; `shapeDraw` è la metà senza import e i test vivono lì). Stesso vincolo per ogni file nuovo: se deve essere importabile sotto vitest, zero import dal barrel.
- `jjform/` resta type-only (zero import, come `jjel/`): se la slice fa nascere logica pura di create (validazione draft, uniqueness), può entrarci; l'applicazione al D-graph sta nell'adapter.

## Due vie di create (Turno 10: containment crea / reference seleziona)

1. **Rootable dal catalogo**: sulle metaclassi con `root: true` la lista offre `New <Metaclass>`. Le non-rootable non offrono il bottone — assente, non disabilitato, con la riga di motivo a fondo lista (stesso idioma della Regola 1 del Livello 2: «Created from its container's form»).
2. **Contenute dalla form del padre**: ogni child-slot della form (chiave `children` della shape) offre Add, con limite da `upper` (`upper !== -1` e conteggio pieno → Add assente + motivo). La create apre il draft inline nel contesto del padre.

**Avvertimento Q8 (a registro):** il catalogo è la sede della create rootable *per questa slice*; la scelta fra catalogo e outline va rifatta col peso giusto in 10b. Non cablare la provenienza del gesto nel motore: l'evento è lo stesso `create(cls, ownerId|null, childKey|null, draft)` da entrambe le vie.

## Draft transazionale (12a)

- La create è **transazionale**: draft non ancora nel modello, Commit/Cancel espliciti. Nessuna istanza fantasma nello store prima del commit.
- Required da cardinalità (`lower >= 1`): il commit è bloccato finché i required non sono validi, con l'errore dichiarato per campo (formModel: `error` non-null, `valid: false`).
- **Uniqueness del nome tra siblings** stesso `cls` + `owner` (12a): validata nel draft, messaggio che nomina il conflitto.
- Il draft usa la stessa IRForm/renderer della edit (precedenza al motore, R-2B-2) — niente form parallela.

## Filtro containment-loop (punto aperto 6 → questa slice)

`LValue.get_validTargets` scarta i candidati che chiuderebbero un ciclo di contenimento leggendo la catena dei padri dell'**istanza**. La shape non lo porta (assente, non approssimato — per design). Qui la domanda diventa concreta: nel draft di una create contenuta, i candidati dei ref del draft e i child-slot offerti devono passare dal filtro per-istanza. Collocazione attesa: adapter (ha l'istanza in mano), non motore, non shape. Dichiara nel contratto dove è finito e perché.

## Test attesi

- Rootable: metaclasse `root: true` offre New; non-rootable no, con motivo; commit crea con `owner: null`.
- Contenuta: Add per child-slot; `upper` pieno → Add assente + motivo; commit scrive `owner` e `children[childKey]` coerenti (invariante della sezione 2 del contratto).
- Transazionalità: Cancel non lascia tracce nello store; commit bloccato su required mancante e su nome duplicato tra siblings, con errori per campo.
- Containment-loop: un candidato che chiuderebbe un ciclo non è offerto, e il test lo prova per contrasto con un candidato lecito.
- Round-trip: l'istanza creata appare nella tabella 2b con le colonne per-attributo giuste e «referenced by» a `—`.

## Fuori scope

Delete (12d), multi-selezione (12b), outline 10b, diagramma embedded 13a, la VALUTAZIONE dei derived.

## Coordinamento

Una sessione parallela lavora su `api/data.ts` (parseDAnnotation) e sul censimento NestedView. Committa con pathspec, non toccare il suo index, log con la sola tua entry (stesso protocollo del 2026-08-30).
