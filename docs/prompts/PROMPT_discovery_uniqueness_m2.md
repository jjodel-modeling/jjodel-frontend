# PROMPT — Discovery: l'unicità dei nomi a M2

Perimetro dichiarato fuori da S1 (censimento consumatori, §non fatto): «l'unicità M2 (`joiner/classes.ts:2166`, su `father.children`) non è censita». S1a/S1b hanno unificato M1; M2 (classi, feature, enum dentro un metamodello) ha la sua regola, mai misurata. Zero fix.

## Domande

1. **Qual è la regola M2 oggi, e dove vive?** `classes.ts:2166` e ogni altro sito: namespace (package? classe? metamodello?), quando scatta (create? rename? mai?), e se create e rename concordano — la domanda di S1, rifatta a M2.
2. **I consumatori**: chi risolve per nome a M2 (jjscript `create class/attribute`, import Ecore, `getByName2` — che DTypedElement ha appena riparato —, l'outline del rail)? Per ciascuno: assume unicità? Su quale pool?
3. **La divergenza esiste anche qui?** Il contro-esempio di S1 (create che produce ciò che rename rifiuterebbe): costruibile a M2? Misuralo con una sonda, per contrasto.
4. **defaultname a M2**: S1a ha dichiarato che `defaultname` serve anche M2 — l'auto-name può produrre duplicati M2? (Il badge `UniquenessProblemSync` copre M2 o solo M1?)

## Vincoli

Zero modifiche. Referto con la matrice consumatori (la forma del censimento S1 è il precedente), proposta di slice se serve, ratifica al design.

## Coordinamento

S4 in volo (`jjform`/`editor-v2/hooks`), discovery get_type possibile in parallelo (entrambi leggono il core: nessuna scrittura, nessun conflitto d'index — ma se entrambi committano referti, §6.1 sul log). Gate a 3 valori. Pathspec, entry nello stesso minuto.
