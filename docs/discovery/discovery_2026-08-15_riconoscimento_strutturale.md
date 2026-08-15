# Discovery: riconoscimento strutturale del simbolo (D14)

**Data**: 2026-08-15. **Autore**: chat Cowork, lettura diretta del working tree (HEAD `683e61ad7`).
**Natura**: discovery mirata pre-implementazione, breve per costruzione.

## Obiettivo

Definire la relazione di equivalenza del riconoscimento (D14) leggendo il codice che la implica,
prima di scrivere `symbolRecognition.ts`.

## File letti

- `frontend/src/components/editor-v2/viewpoint/ir/notationCatalog.ts` (integrale, 148 righe)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (ShapeSpec, Conditional, righe 60-135)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (righe 300-360 e import)

## Findings

1. **La relazione e' gia' scritta, implicitamente, in `applyPresetToShape`** (notationCatalog.ts:110):
   `form` sempre scritto (scalare, sostituisce un conditional); `border.style`/`width` sempre scritti
   con default solid/1; il COLORE del bordo conservato; `marker` scritto o RIMOSSO (assenza nel
   preset = richiesta di assenza); `fill` scritto solo se dichiarato. Il riconoscimento e' l'inverso:
   conta cio' che il preset scrive, ignora cio' che conserva.
2. **Il catalogo e' molti-a-molti PER COSTRUZIONE** (dichiarato nella testata del file): sei gruppi
   di ambiguita' reali: {start-event, place}, {task, state}, {final-state, marked-place},
   {choice, decision, relationship}, {use-case, attribute}, {process, entity}. Quindi il
   riconoscimento restituisce un INSIEME, e «un nome solo» sarebbe una menzogna di interfaccia.
3. **«Modificato da X» non e' derivabile senza memoria**: Start event ed End event coincidono su
   (form, marker) e differiscono solo sulla width del bordo; il nearest-match e' mal definito.
   Lo stato «modificato» puo' esistere solo come stato di sessione del picker (slice D15).
4. **`Conditional<T>` e' scalare oppure oggetto** ({when,then} o {rules}): per gli assi del
   riconoscimento (tutti primitivi) il test «e' un oggetto» basta a distinguere. Un asse
   condizionale fallisce solo i confronti in cui conta: un fill condizionale su un preset che non
   dichiara fill e' ignorato, coerente con il fatto che l'applicazione lo conserverebbe.
5. **Convenzione `''` = assente** per marker e fill (stessa convenzione di CompiledView).
6. **Punto d'aggancio UI**: la FormSection «Symbol» in VertexAuthoringPanel.tsx:334, sopra il
   picker. `draft.shape` e' la ShapeSpec corrente; nessun hook necessario (36 confronti per render).

## Rischi

- Un preset futuro che crea un gruppo di ambiguita' nuovo passerebbe inosservato: il test asserisce
  la lista completa dei gruppi, cosi' la coincidenza nuova rompe il test e diventa una scelta
  dichiarata.
- Gli stencil di progetto (D17) estenderanno l'insieme di confronto: la funzione prende il catalogo
  come costante oggi; quando arrivano gli stencil, il parametro diventa esplicito.

## Domande aperte

Nessuna bloccante. La resa del chip (etichetta prima + coda) e' quella approvata nei mockup.
