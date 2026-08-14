# Memo di ratifica: attributo booleano obbligatorio inizializzato a `false`

**Data**: 2026-08-13
**Stato**: ratificata, implementata, verificata a schermo da Alfonso ("funziona tutto")
**Prompt di riferimento**: `claude/2026-08-13_0118_prompt_bool_required_default_false.md`

---

## La regola

Un attributo di tipo `EBoolean` con `lowerBound >= 1` porta `false` nello slot M1, mai lo slot vuoto. Un obbligatorio non ha stato "non impostato": se la molteplicità dice che il valore c'è sempre, il modello deve contenerlo.

La regola vale solo per `EBoolean` e solo a livello M1. `defaultValueLiteral` in M2 resta invariato, e gli altri primitivi restano come sono. Su `[0..1]` il vuoto resta legittimo e va difeso: è la differenza fra "non impostato" e "false", e sparisce solo dove la molteplicità la rende priva di senso.

## Dove vive

`LObject._forceConformity` in `LModelElement.tsx` per la nascita dello slot, più due override in `LAttribute` (`set_lowerBound`, `set_type`) per gli slot già creati e vuoti. Il predicato sta in un punto solo, `LAttribute.requiredBooleanInitialValues`, e riusa `U.initializeValue` invece di ripetere la stringa.

## Il fatto che ha spostato il fix

Un attributo booleano obbligatorio non nasce mai tale. Nasce `EString [0..1]` (`DAttribute.lowerBound = 0` è il default di campo, e i setter arrivano dopo nella catena `Constructors`), diventa booleano per cambio tipo o per inferenza dal nome, e diventa obbligatorio solo quando qualcuno alza la molteplicità. Per questo `Constructors.DStructuralFeature` sembra il punto giusto e non lo è: lì la condizione è falsa il 100% delle volte.

Conseguenza generale, buona da ricordare per gli altri difetti della stessa famiglia: nel modello Jjodel le proprietà di una feature si stabilizzano per transizioni successive, non alla nascita. Ogni regola formulata come "quando si crea X con la proprietà P" va tradotta in "quando P diventa vera su X".

## Debiti e cose non chiuse

**Il limite dichiarato**: `set_type` riconosce il passaggio a booleano solo quando l'UI passa un pointer. Il flusso principale lo fa (`canvasToJjom.ts:602`), ma `set_type` accetta anche nomi in chiaro; se ne arriva uno, l'aggancio non scatta e lo slot resta vuoto finché non si tocca la molteplicità. Documentato in un commento, non risolto, e non va risolto duplicando la tabella di alias di `set_type`.

**L'incoerenza di forma del valore, aperta**: l'inizializzazione produce la stringa `'false'` (`U.initializeValue`), l'editing da checkbox produce il booleano `false` (`Info.tsx:642`, `target.checked`). I lettori che passano da `U.fromBoolString` non se ne accorgono; un lettore che facesse `if (values[0])` leggerebbe true, perché `'false'` è truthy. La convivenza esisteva già prima di questo fix e questo fix non l'ha peggiorata, ma resta una voce a backlog: unificare la forma dei valori primitivi negli slot M1.

**Non estesa**: la tabella per gli altri primitivi con `[1]` (`EString` a `''`, i numerici a `0`) esiste in `U.initializeValue` ma non viene applicata all'inizializzazione degli slot. Scelta deliberata di scope, non dimenticanza. Da riprendere se emerge lo stesso difetto sui numerici.

## Nota su ObjectNode

`ObjectNode.tsx` esclude i required dai placeholder lazy con `if (lb > 0) continue`, commentato "required, not a lazy placeholder". L'assunto era falso prima del fix (un booleano `[1]` senza slot non compariva affatto) e diventa vero adesso. La riga non va toccata.
