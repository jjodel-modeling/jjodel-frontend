# Prompt Claude Code, 2026-08-22 17:05: layout per viewpoint, D1..D8 e D10

**Fase**: 1, **read only**. Nessuna riga di codice, nessuna proposta di progetto, nessuna scelta di sede.
**Zona critica**: no (lettura sola). **Branch**: `alfonso-frontend-jjtl`. **Base**: `d0f4bf5fb` o successivo.
**Protocollo**: `docs/PROTOCOL.md` P1..P10, **deroga dichiarata su P8** (fase read only, nessuna
modifica, nessuno smoke).
**Decisioni che governano**: `R-LAY-1..10` in `docs/decisions.md`, `R-E/E-1` (report già esistente:
addendum in coda, non riscrivere), `R-RAIL-28` (ogni asserzione di assenza porta il controllo
positivo nella stessa invocazione).

**Nota sulla provenienza, da leggere prima del resto.** Questo file è stato **ricostruito il
2026-08-23** dal registro e dalla discovery, perché il prompt originale del 22 alle 17:05 era stato
consegnato in chat e mai messo a terra. È il file che
`docs/claude-code-log.md` (entry «2026-08-22 — docs: D1..D8 non eseguite, arresto al passo zero») e
`docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md` §1114 citano come «prompt del
2026-08-22 17:05». Il passo zero, i vincoli e le otto domande D1..D8 sono ricostruiti fedelmente
dalle sezioni §5 e §B.7 della discovery, che le enumera. **D10 non è ricostruibile**: vedi la sezione
apposita, che è un blocco e non un dettaglio.

---

## Passo zero, obbligatorio

Prima di qualunque lettura di codice:

```
command grep -c "R-LAY" docs/decisions.md
command grep -c "R-IRN" docs/decisions.md
```

La seconda è il **controllo positivo, nella stessa invocazione**: deve tornare 57. Se la prima torna
**0**, fermati: la serie non è a registro e questo prompt non ha le sue premesse. Scrivi una riga nel
report e restituisci il controllo.

**Stato atteso al 2026-08-23**: la prima torna **11** (le dieci righe più una citazione), la serie è
entrata con `d0f4bf5fb`. Il passo zero passa. Se non passa, qualcosa è stato riscritto e vale
l'arresto.

Poi **leggi le dieci righe `R-LAY-1..10` dal file**, non dal riassunto di questo prompt, e leggi
`docs/ratifiche/claude_2026-08-22_memo_ratifica_layout_per_viewpoint.md`. Se l'addendum §8 del memo
è ancora dichiarato lacunoso, **dillo nel report** e non trattare come noto ciò che quella sezione
avrebbe dovuto contenere.

---

## Obiettivo

Stabilire, **misurando**, dove sta oggi il layout dei model element, chi lo legge, chi lo scrive, e
quanto costerebbe indicizzarlo per viewpoint. Le tre sessioni precedenti si sono fermate su D0, su
Q0 e su D9: nessuna di esse ha eseguito D1..D8. Il gate D9 è ora **chiuso** da `R-LAY-6` (la chiave è
l'id del viewpoint esclusivo attivo, non l'insieme di ciò che rende) e da `R-LAY-8` (solo i viewpoint
esclusivi hanno un record). D1..D8 hanno finalmente un bersaglio.

**Vietato in questa fase**: scegliere la sede del record. Le tre candidate (mappa sulla sede attuale,
tabella a livello progetto, dizionario su `DViewPoint`) si decidono in chat sui dati che produci.
Se un finding rende una delle tre impossibile, **dillo come finding**, non come raccomandazione.

---

## Le domande

### D1 — La sede attuale

Dove stanno oggi posizione e taglia sul D layer, e **stanno insieme o separate**? Path e righe
esatte. Interessa in particolare se il campo sia sul vertice, sul view element o altrove, e se la
persistenza passi dallo stesso campo per entrambe.

### D2 — L'asse per view esiste già?

**Misura, non citazione.** Tre documenti (2026-07-19 §3.6, 2026-08-03 §247, 2026-08-17 §502)
concordano nel dire che il `DGraph` è per modello e che `DVertex.graph` è `Pointer<DGraph>`, quindi
che il vertice non si forka per viewpoint. La discovery del 22 dichiara esplicitamente che **sono
citazioni di documenti, non misure**, e chiede di non trattarle come risposta a D2.

Misura la molteplicità reale dei graph element per view, con controllo positivo nella stessa forma di
comando. Se l'asse non esiste, la domanda «quale campo indicizzare» diventa «quale asse creare», che
è lavoro di un ordine di grandezza diverso: è il finding che cambia il fronte.

### D3 — I lettori

Censimento dei lettori di posizione e taglia. Path, riga, e per ciascuno se legga il D layer o un
derivato di sessione.

### D4 — Gli scrittori

Censimento degli scrittori. **Punto di partenza obbligato**: `handleAutoLayout`
(`frontend/src/components/editor-v2/EditorV2.tsx`), emerso incidentalmente nell'addendum di Fase
1bis e non previsto dal prompt originale. **Attenzione al numero di riga**: la discovery lo cita a
`:3262`, ma al 2026-08-23 la dichiarazione (`const handleAutoLayout = useCallback(...)`) è alla riga
**3249**. Fidati del nome, non del numero. Interessa in particolare se esista **un percorso di
scrittura fuori dai censiti**: la domanda non è rispondibile finché il censimento non esiste, quindi
il censimento viene prima.

Agli atti da §6 Q3: `syncIREdgeLayoutToJjom`
(`frontend/src/components/editor-v2/sync/canvasToJjom.ts:122`) scrive dentro `TRANSACTION` (riga 130)
ma riguarda il layout degli **edge sintetici**, non la posizione dei nodi. Verifica se la distinzione
regge.

### D5 — La metà persistita della taglia

Taglia scelta dall'umano, flag `isResized`, e il filtro su `resizing !== undefined`. `R-LAY-4`
dichiara che la taglia derivata dal contenuto non raggiunge il D layer
(`frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts:82-89`, path verificato): **verificalo**, perché la ratifica ci poggia sopra.

### D6 — Gli edge

Che layout persistito esiste sugli edge oltre a `irEdgeLayout`, e qual è la natura di `Eroute`.
Ricorda che `R-LAY-3` **non tocca** la decisione del 2026-07-19 su `irEdgeLayout` e `irCollapsed`:
quelli restano condivisi fra viewpoint. Interessa sapere se questa asimmetria (nodi per viewpoint,
edge condivisi) produca uno stato incoerente osservabile.

### D7 — Versione e migrazione

Versione corrente di `DState.version.n` e forma che prenderebbe la migrazione. Attenzione: `2.228` è
in corso e non ancora spedita (`R-IRN-19`, `R-IRN-20`). Non proporre un numero di versione: misura
quello corrente e descrivi la forma.

### D8 — Il costo in stato

Il fattore moltiplicativo sullo stato persistito, **misurato su un progetto reale**, non stimato. Non
è un rischio teorico: la persistenza passa da `localStorage` con `compressToUTF16`. Se ti serve un
progetto e non ce l'hai, dillo e fermati su questa sola domanda invece di stimare.

### D10 — DA COMPLETARE, non eseguire

**Il testo di D10 non è ricostruibile.** Il log e la discovery la citano («D1..D8 più D10») senza
enunciarla, e nessun altro documento del repo la contiene.

Finché questa sezione resta così, **D10 non si esegue e non si inventa**. Esegui D1..D8, riporta nel
report che D10 è priva di enunciato, e restituisci il controllo su quella sola domanda. Chi ha
l'enunciato (Alfonso) lo incolla qui, e D10 riparte da sola.

---

## Vincoli

- **Read only.** Zero file di codice modificati. Nessuna sonda che scrive. Se una misura richiede di
  eseguire qualcosa, eseguilo in uno scratchpad di sessione e dichiaralo, lasciando il repo intatto
  (precedente: la sonda `node --experimental-strip-types` dell'entry del 2026-08-18).
- **Nessuna scelta di sede, nessuno schema, nessun progetto.** L'output è misura.
- **Ogni asserzione di assenza porta il controllo positivo nella stessa invocazione**, con glob
  quotati (`R-RAIL-28`). Un `grep` che torna zero senza controllo positivo non è un finding: è un
  comando non verificato.
- **Gradi di certezza espliciti.** Distingui «misurato», «tracciato a codice non eseguito» e
  «citazione di documento». La discovery precedente ha sbagliato proprio qui su D2 e lo dichiara.
- **Discovery report obbligatorio.** Il file esiste già:
  `docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md`. Per `R-E/E-1` **non riscriverlo**:
  leggilo per intero, confronta punto per punto, e aggiungi **in coda un addendum** con le sole cose
  non coperte. L'hard stop non è completo finché l'addendum non è scritto.
- **Entry di log** in `docs/claude-code-log.md` a fine task, con `Prompt document name`:
  `2026-08-22 17:05`. Il log è a 44 entry attive contro soglia 40: la rotazione è dovuta ma **non si
  fa in questo task**, si fa a repo fermo con prompt suo.
- **Hard stop** al termine dell'addendum. L'analisi avviene in chat, a partire dal report salvato.

---

## Riferimenti

- `docs/decisions.md`, righe 1675-1693 (`R-LAY-1..10`)
- `docs/ratifiche/claude_2026-08-22_memo_ratifica_layout_per_viewpoint.md` (§8 dichiarato lacunoso)
- `docs/discovery/discovery_2026-08-22_layout_per_viewpoint.md`, §5 e §B.7 (che cosa resta ignoto),
  §B.4 e §B.6 (attivazione contro resa), §A.3 (l'asimmetria taglia/posizione)
- `docs/ratifiche/claude_ratifiche_2026-08-03_state_actions_events.md`, R-2 (intatta; è la riga 28 a
  essere ritirata da `R-LAY-3`)
- `docs/prompts/claude_2026-08-18_1656_prompt_2228_fase2.md`, slice 2 (la dipendenza di `R-LAY-7` e
  il perimetro in cui `R-LAY-10` va sciolta)
