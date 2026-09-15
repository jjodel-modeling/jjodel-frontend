# PROMPT FL7 — nodo owner nell'ego-diagramma (micro-slice, PARALLELA a 10b)

Protocollo: `docs/PROTOCOL.md` — clausole P1..P10 applicabili.
Ricevuto: 2026-08-31. Eseguito: 2026-08-31 20:30–21:15.

> Nota di path: il prompt ricevuto citava `docs/prompt/`. Quella directory non
> esiste (misurato: `ls docs/prompt` esce 1, `ls docs/prompts` esce 0). I prompt
> stanno in `docs/prompts/`, ed e' qui che questo documento e' archiviato.

---

## Il prompt, come ricevuto

Decisione utente 31-08: l'ego-diagramma della riga espandibile aggiunge il nodo
owner (il padre di containment), come mostrato dalla board `13a Diagramma
Embedded.dc.html` opzione 1a (illustrativa; queste regole sono normative). Oggi
`egoNeighborhood.ts` rende solo incoming/outgoing.

**Cosa cambia**

- `egoNeighborhood.ts`: il risultato guadagna `owner: NodeRef | null` (il padre di
  containment; la radice modello NON e' un nodo — istanza rootable → `owner: null`).
  Il conteggio del footer non cambia: l'owner non e' un incoming.
- `EgoDiagram`: l'owner rende sopra-a-sinistra del soggetto, card come i vicini ma
  con sottoetichetta «owner» (9px slate-400) e collegamento senza freccia (linea
  `#cbd5e1`, nessun marker — e' containment, non un ref). Click = selezione, come
  ogni nodo.
- Precedenza id invariata («un nodo per id, l'uscente vince»): se l'owner e' anche
  un vicino, rende una volta sola nel ruolo di vicino, e la linea di containment
  punta a quel nodo.
- Fallback lista testuale (FL6): guadagna il gruppo «owner» in testa, stesso click.

**Test attesi**

- Running (owner `Region_main`): owner valorizzato, footer invariato; rootable →
  `owner: null` e nessun gruppo owner nel fallback.
- Owner che e' anche vicino → un solo nodo (mutazione: senza precedenza, doppio
  nodo = test rosso).
- Click sull'owner seleziona l'id giusto (via `egoAction`, come i vicini).

**Fuori scope**: vista Diagram 13a/1b (rimandata), 2+ hop, qualunque modifica a
layout/temi/widget della form.

**Coordinamento**: parallela a 10b (outline). File tuoi: `egoNeighborhood.ts`,
`EgoDiagram.tsx`, il suo foglio, i loro test. NON toccare: l'innesto del pannello
outline, la tabella, la form. Il mount dell'ego nella riga espandibile e' tuo solo
se la firma delle prop cambia — se cambia, dichiaralo nel referto. Committa con
pathspec, log con la sola tua entry, protocollo del 2026-08-30.

---

## Le due domande poste prima di scrivere, e le risposte

Fase 1 read-only chiusa con `docs/discovery/discovery_2026-08-31_fl7_ego_owner.md`,
poi hard stop. Due punti non decidibili da chi esegue:

1. **Il fallback testuale contro «non toccare la tabella».** `EgoList` vive dentro
   `InstanceManagerTab.tsx`, che il prompt elenca fra i file da non toccare e che la
   sessione 10b stava lavorando nello stesso momento. → **Farlo, in un commit
   separato**, cosi' che la collisione resti una riga sola invece di un blocco.
2. **L'owner che e' anche vicino.** «La linea di containment punta a quel nodo»,
   ma quel nodo ha gia' la sua freccia di riferimento verso il soggetto, con gli
   stessi due estremi. → **Nessuna seconda linea**: `ego.owner` nomina comunque quel
   nodo (identita' di oggetto, `side` di vicino, chiave di contenimento nelle sue
   `featureKeys`), e scatola, sottoetichetta e linea esistono solo per
   `owner.side === 'owner'`.

## Due clausole che si sono rivelate diverse da come erano scritte

- **`Region_main` non esiste nel codice**: e' un nome della board 13a. Nella fixture
  reale (`Heater`, la stessa dal primo giorno di FL5) l'owner di `Running` e'
  `Heater`, via `states`. I test sono scritti su quella.
- **La firma delle prop NON cambia**, quindi il mount nella riga espandibile e'
  rimasto fuori dal perimetro come il prompt prescrive. L'owner era gia' dentro
  `EgoInput`: `egoInputOf` passa `referencedBy` verbatim, contenimento incluso e
  marcato, e il modulo lo scartava un rigo sotto.

## Esito

✅ completed. Tre commit, tutti con pathspec. Referto:
`docs/discovery/discovery_2026-08-31_fl7_ego_owner.md`.
