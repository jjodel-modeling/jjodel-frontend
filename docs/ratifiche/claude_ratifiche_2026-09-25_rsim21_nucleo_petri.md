# Ratifica 2026-09-25: nucleo di Petri del motore di simulazione (R-SIM-21..26)

**Data**: 2026-09-25. **Ramo**: `alfonso-frontend-jjtl`. **Commit di riferimento**: `1b0fa52df`.
**Fonte**: `docs/sessioni/sessione_2026-09-24.md`, paragrafo «Semantica, discussa e non ancora
ratificata». **Righe**: `docs/decisions.md`, «Ratifiche 2026-09-25: nucleo di Petri».

## Decisione

Il nucleo del motore passa dall'arco di un grafo di controllo alla transizione di Petri con preset e
postset (R-SIM-21). Flowchart e statechart diventano casi particolari; fork e join diventano
istruzioni di compilazione con ruoli facoltativi (R-SIM-22). Il marking è a naturali limitati da un
k dichiarato nella STC, default 1, con errore «unsafe» oltre k, e gli archi hanno pesi (R-SIM-23).
Gli inibitori sono guardie su un accessore di sola lettura del marking (R-SIM-24). I costrutti di
flowchart si riducono a guardia con `else`, scelta esterna come politica del selettore, fork/join
(R-SIM-25). La terminazione è una proprietà del marking (R-SIM-26), con tre punti lasciati aperti.

## Razionale

Il vincolo dichiarato dal 2026-09-12 è restare vicini alla semantica di nuXmv. Un marking limitato ha
un dominio finito e si traduce direttamente in `VAR` dell'esportatore; un nucleo unico rende
flowchart, statechart e reti la stessa cosa per il motore e per l'esportatore, invece di tre
semantiche da tenere allineate. L'interleaving di R-SIM-7 non cambia: uno scatto per passo è già la
semantica a sequenze di firing. Tenere la scelta esterna nel selettore lascia le guardie pure, che è
la condizione per esportarle.

## Alternative scartate

OR-join alla BPMN: la sua abilitazione dipende da cosa può ancora arrivare, una proprietà non locale
del marking. Reti non limitate: nessuna codifica finita. Reti colorate e temporizzate: fuori dal
perimetro del sesto passo. Token sugli archi per l'AND-join: il preset di più posti esprime la stessa
sincronizzazione senza un secondo tipo di stato.

## Aperto

Forma del predicato di terminazione; destino del ruolo `Terminal`; distinzione fra terminazione e
deadlock; forma dell'accessore del marking. Si chiudono nella discovery del passo 3 e si ratificano
a parte.

## Prossimo passo

Discovery del passo 3 sul ramo `simulation-engine` in `~/jjodel-sim`, con queste righe come vincolo.
