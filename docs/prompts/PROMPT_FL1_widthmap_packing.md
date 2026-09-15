# PROMPT — FL1: width map + packing del form auto-layout (modulo puro)

Implementa il registro tipo→width class e l'algoritmo di packing specificati da `docs/design/form-autolayout-spec.md` e da `Form Auto Layout.dc.html` (autoritativo per i casi mostrati). Contratto di contorno: `docs/design/design_handoff_instance_node/form-engine-contract.md`.

## Dove

- `frontend/src/jjform/` — modulo puro, zero import da store/D-graph/React (stesso vincolo di `shape.ts`: importabile sotto vitest senza barrel). File proposto: `jjform/layout.ts`.
- Input: la lista ordinata di feature della IRForm (attrs poi refs, ordine di dichiarazione — già così nel formModel). Output: per ogni campo `{ key, span: 3|6|12, widget: string }` più il raggruppamento in righe.

## Registro (aperto)

Mappa tipo → `{ span, widget }`, UNA definizione, risolta con la stessa ladder dei value renderer (tipo del metamodello → annotazione → parse sintattico — mai il solo nome del campo):

- `boolean`, `enum` con ≤3 literals → 3, toggle/segmented; `enum` >3 → 6, select
- `number` (int/float), `date`, `datetime`, `duration`, `color` → 3
- `string`, `@code`/expression, `@email`, `@url`, reference `upper: 1` → 6
- multivalore qualsiasi (`many: true`, attr o ref) → 6, chip input
- `text` multiline, richtext → 12
- `unknown` → 6, testo (di proposito, come `classifyAttrType`)

Il registro estende `shapeDraw.classifyAttrType` / `widgetForPrimitive` — non duplicarlo: la lista dei tipi si legge da lì (letta due volte, mai una terza — se serve la terza, estrai la costante condivisa).

## Packing (chiuso per scelta — non aggiungere opzioni)

1. Griglia a 12 colonne, fill greedy per riga, ordine di dichiarazione preservato.
2. L'ultimo **scalare** di una riga corta si estende a riempirla. I multivalore NON si estendono per posizione: partono a 6 e promuovono a 12 solo su overflow dei chip. Il modulo puro non misura pixel: espone `span` base e il flag `growsOnOverflow`; la promozione a runtime la fa il renderer (FL4) misurando il contenitore.
3. Le sezioni vengono dal metamodello (attrs, poi refs): il packing riparte a ogni sezione.
4. Nessuna width per-campo, mai. Le correzioni promuovono al metamodello come annotazione (stessa via dei renderer).

## Test attesi

- Ogni riga del registro: tipo → span+widget, incluso enum 3 vs 4 literals e `unknown`.
- Packing: la sequenza del fixture StateMachine (name string, kind enum3, isHistory bool, timeout int, depth int readOnly, entryAction @code, tags multi, outgoing multi-ref) produce le righe del prototipo: [name 6, kind 6], [bool 3, int 3, int 3, buco 3], [@code 6→stretch? NO: @code è scalare ultimo di riga → 12], [tags 6, outgoing 6].
- Stretch: scalare ultimo di riga corta si estende; multi in riga corta resta a 6 con `growsOnOverflow: true`.
- Ordine: permutare la dichiarazione permuta il layout, senza riordini "intelligenti".

## Fuori scope

Temi (FL2), widget nuovi (FL3), rendering e misura overflow (FL4).

## Coordinamento

Sessioni parallele su FL2 (temi) e FL3 (widget): file disgiunti (`layout.ts` vs `themes.ts` vs componenti widget). Committa con pathspec, log con la sola tua entry, protocollo del 2026-08-30.
