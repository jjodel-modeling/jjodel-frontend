# Sessione 2026-11-08/09: fronte dcn, slice 5

Chat C-2026-11-06-2159, owner del fronte `dcn`. Dal pomeriggio dell'8 (Alfonso: «via, ok con l'ordine», 16:04;
«Go su tutto», 18:21; «GO», 18:28) alle 4 del 9, in gran parte in lane auto. Tronco `alfonso-frontend-jjtl`.
Checkpoint precedente: `docs/sessioni/sessione_2026-11-08_dcn.md` (slice 1-4).

## Stato a fine sessione

- Slice 4 rifinita: L4.6 (etichetta Tick, input attivi solo se ammissibili, tooltip multivalore, argomenti in
  `withInputs`) e L4.7 (slot vuoti del drone riempiti, export rigenerati), merge `4a75388f7`.
- Slice 5 tutta nel tronco, in tre merge: `0a8e21f10` (scheda del run sotto il nodo, vista UML object sul drone),
  P-2026-11-09-0053 (snapshot come nuovo modello M1, pulsante «Save snapshot»), `42a62568a` (argomenti per nome,
  chip allo step back, vincoli di coerenza φ e ψ come hit dei watch). Gate verdi; vitest 15820 passati, solo i 3
  rossi noti all'import.
- Export in `~/jjodel-demo-exports/dcn/`: `dcn-drone.jjodel`, `dcn-drone-objects.jjodel` (vista UML object, ruoli DCN
  e ruoli di coerenza legati, tre vincoli: `speedLimit`, `lowBatteryPersistence`, `lowBatteryResponse`).
- Push del tronco: di Alfonso. Nessuna lane in corso.

## Decisioni

- R-DCN-25..28 (16:24): compartimenti per viewpoint, slot dormienti in grigio e icona dei monitor, snapshot come
  nuovo M1, φ e ψ come watch, γ dopo.
- R-DCN-29..32 (18:21, «Go su tutto» sulle raccomandazioni della discovery della slice 5): la resa del run è una
  scheda sotto il nodo (non nel box, niente zona critica); lo snapshot copia tutto il modello; k conta i passi
  committati; nessuna nuova dipendenza di test per il pannello. Go-ahead critico per la scrittura dello snapshot.
- Semantica dei pattern (dalla chat, dal SoSyM §3.1 esempi 1-2 e Definizione 5): BoundedPersistence violata alla
  k+1-esima occorrenza consecutiva; BoundedResponse richiede la risposta in [i, i+k]; un trigger aperto a fine
  traccia è pendente, non violato.
- Decisioni non presidiate della chat: copia della disposizione dei vertici nello snapshot (la griglia di default
  copriva le righe di dji); `sourceId` opzionale per l'abbinamento esatto dei vertici; riempimento «off» dei ruoli
  di coerenza in `profileCodec.ts` per i profili DCN già salvati; aggiornamento del test `simRolesDraft` (16
  opzionali); riga `getSimDcnNode` nel mock di `irActivityRender.test.ts`; fixture del drone che riapplica i link di
  contenimento persi. Il percorso sbagliato nel prompt della lane 7 era un errore della chat.

## Prompt (lane) della slice 5

| Lane | Cosa | Esito |
|---|---|---|
| P-2026-11-08-1742 | discovery slice 5 (report completato dalla chat) | ✅ |
| 1829, 1905 | stato della scheda, `getSimDcnNode` | ✅ |
| 1939 | vista UML object sul drone | ✅ |
| 2042 | scheda del run | ✅ |
| 2124 | piano dello snapshot | ✅ |
| 2157, 2216, 2320, 2355 | scrittura dello snapshot (critica, LIR) | ✅ |
| P-2026-11-09-0017 | pulsante «Save snapshot» | ✅ |
| 0055 | argomenti per nome, chip allo step back | ✅ |
| 0124, 0237, 0259, 0320 | ruoli, fixture, valutazione, collegamento della coerenza | ✅ |

## Ticket

1. Alta: una scrittura di contenimento (`syncCreateCompositionLink`) si perde circa una volta per costruzione della
   fixture (5 run su 5 il 2026-11-08 sera, anche su HEAD non modificata). Discovery proposta, in attesa del sì di
   Alfonso.
2. Media: il Play non avanza mai un run DCN (ogni transizione ha un trigger); lo stop su un hit arriva solo da un
   passo premuto o dall'orologio.
3. Bassa: la riga dell'hit del pannello legge il passo vivo sotto lo slider (anche Petri).
4. Bassa: un profilo DCN salvato prima dei ruoli di coerenza risulta «modificato».
5. Bassa: `SimInspector.tsx:415` chiama `markingChips` senza la rete (nessuna chip su un run DCN).
6. Bassa: il template di riga della vista object mostra solo `values[0]` di uno slot multivalore.
7. Template di merge di `lane-run`: il reset del passo 6 punta al commit sbagliato (visto tre volte).
8. `generalizationClosure` copiata in tre moduli.
9. φ e ψ dello stesso vincolo falliti nello stesso passo danno un solo hit `pointwise`.

## Prossimi passi

1. Provare sul 3001 `dcn-drone-objects.jjodel`: scheda del run, «Save snapshot», `rampUp` oltre `vmax` per vedere
   l'hit `speedLimit@dji`.
2. Decisioni di Alfonso: discovery sulla scrittura persa; lane 11 (W1 sulle espressioni dei vincoli, `problems/`,
   zona critica).
3. Batch Random per la stima di γ; slice 6 (W5 per enumerazione, esportatore nuXmv).
