# Memo: #166, il giro del Configurator (#186, #187, #188)

Data: 2026-10-14. Chat: `C-2026-10-14-1020`. Referto: `docs/discovery/discovery_2026-10-14_166_configurator_usability_plan.md`
(`da72802e7`), scritto dalla chat dopo la lettura delle tre sub-issue di @tmaog del 2026-10-12 e dei loro mockup.
Decide: Juri, in chat il 2026-10-14, quattro risposte alle domande del §8 del referto. Righe in `docs/decisions.md`:
R-CFG-1..4.

## Decisioni

1. **Lane harness (R-CFG-1).** **Diverge dal referto**, che raccomandava di lavorare direttamente in chat. Una lane
   per passo del §6: #187 (passi 1 e 2) e #186 Endpoints (passo 3) in parallelo, merge in `staging` in quest'ordine;
   #186 «Customize element» (passo 4) dopo le due. Juri dirige ogni lane.
2. **Pannello nuovo per il Configurator, Data Manager invariato (R-CFG-2).** Come raccomandato. Rovescia, per il
   solo Configurator, la scelta del 2026-09-28 di un solo pannello per i due host.
3. **Presentazione per ruolo su `DProfile` (R-CFG-3).** Come raccomandato: campo opzionale `typePresentation`, senza
   migrazione, con un vocabolario di widget proprio.
4. **Endpoints unico posto (R-CFG-4).** Come raccomandato: la voce della barra sinistra porta alla sezione, il
   wizard resta nel codice senza essere raggiungibile.

## Adottate dalla chat senza obiezioni (§7.1 del referto, nel digest di chiusura delle lane)

Save nell'intestazione del pannello accanto a Delete; il Configurator del developer usa lo stesso pannello; in
modalità consumer la barra in alto perde Save, l'etichetta dell'ultimo salvataggio e Basic/Advanced; «Manage
Profiles (Users)» e #188 aspettano #170; i limiti tipo `0..5` si leggono con le quattro etichette più il conteggio.

## Fuori da questo giro

#188 (proprietà delle istanze), «Manage Profiles (Users)» di #186: servono l'utente dietro un ruolo, che nessuna
entità registra oggi (§4.6 del referto), cioè #170. Permessi per campo e «il fruitore non può creare il modello che
manca» restano aperti in #166.
