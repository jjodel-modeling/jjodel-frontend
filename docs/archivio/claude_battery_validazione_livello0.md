# Batteria di verifica live: 11 check di conformance M1↔M2 (Livello 0)

**Origine**: sessione 2026-07-15/16. Prerequisiti: fix `01-10` (CHECK 4/5 raw, applicato) e `00-38` (rivalidazione edit profondi, **stato da confermare**: i lag osservati suggeriscono che non fosse attivo al primo giro).
**Esito atteso per ogni violazione**: badge sul nodo + popover col violationType + pill in toolbar + triangolo TreeView; alla correzione, spegnimento automatico entro ~1s.

## Esiti del primo giro (2026-07-16, eseguito da Alfonso)

| # | Check | Severity | Ricetta | Esito 1° giro |
|---|-------|----------|---------|---------------|
| 1 | Orphan object | error | `delete C` con istanze (C.3) | ✅ |
| 2 | Required attr mancante | error | lowerBound=1, istanza senza valore | ✅ con lag: aggiungendo l'attributo required a classe con istanze ESISTENTI il badge non esce; esce creando una nuova istanza (trigger M2-edit non copre: atteso risolto da 00-38) |
| 3 | Tipo attributo | warning | `index: EInt` con valore `'aaa'` | ❌ FAIL: mai segnalato, nemmeno post edit strutturale. Root cause: coercion dei mapper proxy (`get_value` converte al tipo dichiarato prima del check). Fix: prompt `2026-07-16 12-19` (lettura raw + predicato di tipo). Quinto membro della famiglia "proxy mente ai check" |
| 4 | Upper bound reference | error | 4 link poi stringere a 2..3 (B.8) | ✅ con lag (serve edit strutturale per vedere il badge → 00-38) |
| 5 | Lower bound reference | warning | r 2..3 con 1 link | ⛔ bloccato da BUG NUOVO: cancellare le istanze target lascia le reference pendenti (vedi sotto). Ricetta alternativa per il retest: cancellare i LINK, non le istanze |
| 6 | Reference pendente | error | delete raw del target | ✅ DI FATTO: il bug del #5 l'ha attivato involontariamente; popover corretto con 2× dangling_reference per-oggetto e pointer nel messaggio |
| 7 | Astratta istanziata | error | `abstract C` via JjScript con istanze | da testare |
| 8 | Tipo target reference | error | cambiare tipo di r con edge ancorati (B.12) | ✅ con lag (come #2) |
| 9 | Upper bound attributo | error | attr 2..3 con 4 valori | ✅ con lag ("non sempre subito") |
| 9b | Lower bound attributo | warning | attr 2..3 con 1 valore | ✅ con lag |
| 10 | Literal enum valido | warning | iniezione console | da testare |
| 11 | Unicità isID | error | stesso valore iD su 2 istanze | ✅ |

## Bug nuovo scoperto dalla batteria (non di validazione)

**Delete di istanze M1 lascia le reference entranti pendenti**: la delete canonica dovrebbe fare cascade su `pointedBy`, il path del canvas v2 evidentemente no (sospetto: rimozione raw). Il CHECK 6 l'ha catturato: difesa in profondità funzionante. RCA: prompt `2026-07-16 12-21 discovery-instance-delete-dangling-refs.md` (two-phase, read-only, hard stop).

## Prossimo giro (dopo 00-38 confermato + fix CHECK 3)

1. Retest dei lag: #2 (aggiunta attributo required a classe con istanze esistenti → badge SENZA nuova istanza), #4, #8, #9/9b immediati.
2. #3 con `'aaa'` su EInt → warning.
3. #5 con ricetta alternativa (rimozione link).
4. #7 (`abstract C` via JjScript) e #10 (iniezione console).
5. Controprova di spegnimento su ogni riga verde.
6. A batteria tutta verde: i due commit (`feat(conformance)`, `feat(validation-ui)`); la tabella diventa la base della pagina docs "Validation".

**Ricetta console per 3/10** (iniezione raw sul DValue): risolvere lo slot via `DValue.father === obj.id`, poi `LPointerTargetable.fromPointer(slot.id).values = ['<valore fuori norma>']`.
