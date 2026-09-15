# Review: barra 1.5, i cinque tab su una object-as-edge (Transition2)

**Data**: 2026-08-06 13:49
**Fonte**: cinque screenshot post `fd92b3d1c` + `e15eb5081`, modalità Advanced attiva, view `Transition2` (natura object, viewpoint "State MAchine 2").
**Scopo**: analisi critica per uniformità, usabilità e coerenza di stile.
**Rapporto con la voce 5**: nessun punto di questa review blocca il GO; la checklist a 12 punti resta invariata. Gli aggiustamenti proposti sono lavoro successivo, con la destinazione indicata per ciascuno.

## Quadro d'insieme

La partizione funziona e si legge: cinque tab al primo colpo d'occhio, matrice per kind rispettata (l'edge mostra la sua Appearance di linea e terminazioni, non quella di forma del vertex), messaggi che nominano i tab per i salti cross-tab (il wildcard rimanda a Structure, Structure spiega la natura derivata), copy onesta e specifica nei helper (la prima metaclasse che risolve il PathBuilder, i capi scritti insieme, i waypoint che tornano con Manhattan). L'impianto R-A/R-B/R-H regge alla vista.

I problemi trovati sono di tre nature: un bug di persistenza (routing come stringa vuota, sezione dedicata), il costo visibile di due scelte già ratificate (lingua mista R-4, doppio father R-H) che ora stanno in vetrina e vanno calendarizzate, e una serie di difformità minori di stile che convergono quasi tutte nella stessa pass.

## Applies to

1. **Viewpoint e Parent view mostrano lo stesso valore**, uno sotto l'altro, in testa al primo tab. È la ricollocazione verbatim decisa con R-H, col bug del doppio writer intatto: la scelta era giusta, ma lo screenshot mostra il suo costo. Due select adiacenti, identici nel valore e indistinguibili nello scopo, sono la prima cosa che l'autore vede aprendo il pannello. Il fix di `father` era un todo registrato: ora è UI di prima schermata. Da alzare di priorità (slice dedicata, serve design: un controllo solo, o setter custom con affordance esplicita di riparenting).
2. **Due sistemi di aiuto convivono**: i tre campi ricollocati portano le icone ⓘ di InfoData (più l'asterisco di required su Name), i campi nativi del pannello usano helper text inline. Conseguenza attesa del verbatim; da armonizzare nella pass di uniformità (o helper inline anche per il trio, o accettare il misto fino all'unificazione dei pannelli, ma dichiarandolo).
3. **Gerarchia visiva del blocco Matching**: "Matching" (titolo di sezione), "Metaclasse dell'oggetto" (sottotitolo) e "Tutte le metaclassi (*)" (label del toggle) sono tre righe di testo impilate prima del primo controllo, a peso tipografico quasi uguale. Due delle tre si possono fondere.
4. **La metaclasse in lista ("Transition2" con ×) è resa più grande dei titoli di sezione**: un valore dati che pesa visivamente più di "Matching" inverte la gerarchia. Da portare allo stile di list-item o chip del design system.
5. **Priorità mostra uno stepper vuoto**: "vince la priorità più alta" implica che un numero effettivo esista sempre; mostrare il default effettivo (placeholder o valore) invece del campo vuoto.
6. Positivo: l'helper del wildcard ("con il wildcard non finisce in nessun bucket del resolver e non produce nulla. La natura si cambia nel tab Structure") è esattamente il messaggio cross-tab di R-B, al posto giusto.

## Structure

1. Contenuto corretto per la natura object: Natura più Capi, con la nota dei capi scritti insieme in fondo (C-1..C-3 al posto giusto). L'helper "La natura non è un campo dell'IR: la view è di tipo object finché entrambi i capi sono impostati" dice la verità architetturale; unica riserva il lessico "IR" esposto all'utente, da rivedere nella pass di lingua.
2. **I campi `$source.value` e `$target.value` sembrano input editabili** (bordo e fondo bianco identici agli input veri). Se sono la preview del PathExpr composto dai due select sopra, vanno resi visivamente read-only (token del DS); se sono un escape editabile per esperti, va chiarito come si riconcilia con i select. Da verificare l'intento prima di toccare.
3. Nota di squilibrio, conseguenza registrata di Q2: per la natura reference questo tab si riduce quasi al solo select di Natura (la reference vive col matching in Applies to). Accettabile in v1; da rivisitare quando i pannelli si unificano.

## Appearance

1. **Fixed/Conditional su Colore, Spessore e Tratto ma non su Routing e Terminazioni**: asimmetria corretta perché guidata dai dati (lo schema non ha varianti Conditional per routing e terminazioni), ma da conoscere per non "correggerla" per errore.
2. **Il Routing mostra il placeholder "Select..."** quando il campo è assente. Il valore effettivo però esiste sempre: assente ≡ Manhattan (R-B9). Il placeholder nasconde la verità e invita a una scrittura inutile. Micro-fix: placeholder "Manhattan (default)", mantenendo la semantica di non scrivere finché l'autore non tocca.
3. **Lo stepper di Spessore è difforme da quello di Priorità**: qui un contenitore alto e bordato, in Applies to una pill compatta. Stesso controllo logico, due vesti. Unificare sulla compatta.
4. Terminazioni con "None" / "Open arrow": coerente; è la superficie che E-mark sostituirà col registro marker (congelata, nessun intervento ora).

## Text

1. Tab magro per costruzione (per l'edge la mappa R-5 prevede la sola label center; crescerà con E-lab). Va bene in v1.
2. **"Label" (titolo di sezione) seguito da "Label al centro" (label del toggle)** è una sezione a figlio unico che quasi ripete se stessa: fondere in una riga sola.
3. **I due select ("Intrinsic property", "name") sono privi di label di campo**: il significato si inferisce ma non si legge. Da sistemare nella pass di lingua/uniformità (dove quelle stringhe cambiano comunque).

## Source

1. Read-only, monospace, JSON leggibile: fa il suo mestiere. Advanced-only da confermare a video (punto 6 della checklist).
2. **Il pin della 1.3 è finalmente visibile**: `authoringMetaclassPins` compare in Source con il pointer risolto. Q3 lamentava che il pin non avesse UI; Source è la sua finestra de facto, ed è la collocazione giusta per un metadato di authoring. Nessun'altra UI necessaria.
3. **La convenzione del drop della chiave funziona a metà nello stesso oggetto**: `terminations` omette `sourceEnd` (None non scritto, corretto), ma `routing` è persistito come `""`. Vedi bug sotto.
4. In prospettiva (1.6/3.6): Source è la sede già ratificata da R-2 per dichiarare il conflitto `cssIsGlobal`; oggi mostra il solo `ir`, coerente con lo scope della 1.5.

## Bug nuovo: `routing` persistito come stringa vuota

**Evidenza**: il Source di una view il cui Select Routing mostra ancora il placeholder (mai toccato dall'autore) contiene `"routing": ""`.

**Perché è un bug**: viola due regole insieme. La convenzione del drop della chiave (campo non autorato ≡ assente, come fa `terminations` nello stesso oggetto) e il vocabolario chiuso di R-B9 (`orthogonal|straight|curved`, senza VersionFixer sulle view salvate): `""` è un quarto valore che entra in persistenza. Oggi non si vede a video perché il renderer cade sul ramo ortogonale per esclusione, e `validateIR` presumibilmente non lo rifiuta (coerente con la sua lassità nota sugli ibridi); ma è sporcizia che si accumula su ogni view toccata dal pannello e una mina per una futura validazione più stretta.

**Colpevole da individuare con grep** (l'evidenza dallo screenshot è il valore persistito, non il writer): i candidati sono l'inizializzazione del draft nel pannello (un controlled Select richiede una stringa, e `''` finisce serializzato al primo commit di qualsiasi altro campo) o il percorso di scrittura di E-route. Da verificare anche se questo produce dirty spurii.

**Fix proposto**: al commit del draft, drop della chiave quando il valore è `''` (normalizzazione ad assente), più il placeholder "Manhattan (default)" del punto Appearance 2. Micro-slice di corsia veloce (RC-3), un file o due, con grep preventivo sul writer. Non blocca la voce 5.

## Aggiustamenti proposti, in ordine di priorità

1. **[bug, micro-slice corsia veloce]** Drop della chiave `routing` su `''` più placeholder "Manhattan (default)". Prima occasione utile dopo la voce 5.
2. **[uniformità, micro-fix]** Il blocco intro "IR Edge view authoring" più paragrafo esplicativo compare identico su tutti e cinque i tab: su Appearance, Text e Source è rumore che spiega la semantica object-as-edge mentre scegli un colore. Tenerlo solo dove informa (Structure, al limite Applies to), o ridurlo a tooltip sull'header del pannello. Il titolo "IR ... authoring" espone lessico interno: candidarlo alla rimozione.
3. **[pass dedicata, da calendarizzare]** La pass di lingua R-4 (stringhe interne in inglese) sale di urgenza ora che la superficie mista è l'UI di default: dentro la stessa pass entrano le label mancanti dei select di Text, "Select...", la fusione delle sezioni a figlio unico (Label/Label al centro; Metaclasse dell'oggetto/Tutte le metaclassi) e l'armonizzazione ⓘ/helper.
4. **[design, slice dedicata]** Fix del doppio writer di `father`: da todo registrato a prima schermata del pannello. Serve una decisione di design prima del codice (un controllo unico, o due con semantica esplicita e setter custom); sblocca anche la breadcrumb rinviata.
5. **[DS, bassa]** Stepper unificato (Spessore come Priorità); chip/list-item per le metaclassi; gerarchia tipografica titolo di sezione vs label di campo, oggi quasi indistinguibili.
6. **[verifica breve]** Intento dei campi PathExpr dei capi (preview read-only o escape editabile) e resa coerente; default effettivo mostrato in Priorità.

## Cosa non toccare (ratificato, o congelato altrove)

Il doppio father resta com'è finché non c'è la slice di design (R-H lo ha ricollocato apposta col bug intatto). Niente badge per-tab (R-B). Niente traduzioni spot fuori dalla pass R-4. Structure magro sulla natura reference è la conseguenza accettata di Q2. Text magro cresce con E-lab (congelata). Terminazioni le sostituisce E-mark (congelata).

## Rapporto con la voce 5

La checklist a 12 punti non cambia. Durante lo stesso giro, senza estenderla formalmente, vale la pena uno sguardo a: la striscia d'errore di pannello (nessuno screenshot la mostra perché la view è valida), il gating in Basic dei segmented Fixed/Conditional e l'assenza di Source in Basic (punto 6 già in checklist).
