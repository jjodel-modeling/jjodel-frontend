# PROMPT — Discovery: la via (A) di get_type — il padre nella finestra transitoria

Residuo dichiarato dalla slice seed DReference (30-08, §8.5): la via (B) ha sistemato il seed nel costruttore D (`Defaults.Pointer_EOBJECT` sul rifiuto), ma `LTypedElement.get_type` gradino 3 (`LModelElement.tsx:~1407`) rimette IL PADRE per ogni `data.type` falsy — inclusa la finestra transitoria del parser Ecore, dove `type === undefined` è il contratto. Rischio dichiarato «non misurabile da sonda» allora; questo discovery lo delimita. Zero fix.

## Domande

1. **Chi legge `.type` durante la finestra?** Il parser costruisce con undefined e riempie dopo (field-write): tra i due istanti, quali consumatori possono leggere (render, validazione, sync, export)? Traccia i percorsi, con la misura dove possibile (import di un .ecore vero con le sonde — il convertitore è raggiungibile da xml2jsonobj, referto DTypedElement §8).
2. **Cosa mostrano/decidono col padre?** Per ogni lettore raggiunto: il valore sbagliato produce un render sbagliato, una decisione sbagliata, o niente (sovrascritto prima di ogni uso)?
3. **Il gradino 3 serve ancora?** Con il seed (B) nel costruttore, quali chiamanti arrivano a get_type con `data.type` falsy fuori dalla finestra del parser? Censimento; se è vuoto fuori-finestra, la proposta è delimitare il gradino al solo caso parser (o rimuoverlo), con l'evidenza.

## Vincoli

Zero modifiche. Referto (data+slug), proposta di fix con costo/rischio, la ratifica è del design. Sonde `_tmp_*` non committate — e ora la regola gitignore è globale.

## Coordinamento

S4 in volo su `jjform`/`editor-v2/hooks` — questo discovery legge `LModelElement.tsx`/parser: nessuna scrittura, nessun conflitto. Gate a 3 valori. Pathspec, entry di log nello stesso minuto.
