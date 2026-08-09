# Verbale di verifica visiva — Task 1.3, pin di identità della metaclasse

**Data**: 2026-08-05, sera
**Esito**: ✅ GO al commit `feat: pin the authoring metaclass by identity in the IR`
**Metodo**: verifica congiunta Alfonso (UI, tab proprio) + Claude (ispezione dello store persistito via browser, tab separato in sola lettura). Progetto di test: "Class Diagram" (`Pointer1784894082274_USER_79`), 4 metamodelli, 21 view IR a fine verifica.

## Deviazioni dal piano a 5 punti, decise su delega ("decidi tu", vincolo di convergenza)

Criterio applicato: la verifica visiva copre ciò che i test unitari non possono vedere, non ripete in browser ciò che è già dimostrato a unit.

- **Punto 3 (progetto migrato)**: chiuso con la copertura unit (`V_mig_pinned`: default migrato + pin → stesso hash, la delega resta). Costruire artificialmente un progetto migrato avrebbe testato la costruzione del caso, non la feature. **Verifica differita** alla prima apertura naturale di un progetto migrato reale; rischio residuo: che la migration reale scriva nell'IR qualcosa di imprevisto.
- **Punto 4 (progetto a un metamodello)**: declassato a non bloccante. Comportamento di default, coperto dal test 6 e indirettamente dal punto 2.

## Punto 1 — scrittura e lettura del pin: VERDE, in forma più forte del previsto

Setup: le due classi omonime `Event` (State Machine, 0 feature) ed `Event` (State Machine 2) erano indistinguibili per feature; aggiunto `payload` alla seconda per rendere il test discriminante. Durante l'edit la classe di SM2 è stata rinominata in `Event3` (vedi osservazioni), poi rinominata di nuovo `Event`; il rename di ritorno non era ancora persistito al momento della misura.

Misurato sullo store persistito:

1. **Scrittura congiunta**: la view nuova (`View for Event`, kind row) porta `metaclasses: ["Event3"]` e `authoringMetaclassPins: {Event3: Pointer1785685527398_USER_200}` nello stesso IR salvato.
2. **Identità corretta**: il pointer è la classe di State Machine 2 (quella con `payload`), non l'omonima di State Machine (`Pointer1785106850866_USER_234`).
3. **No-backfill**: 21 view IR nel progetto, una sola con pin (la nuova). Le 20 preesistenti intatte.

**Prova forte, non pianificata**: al momento della verifica la lista nomi diceva `Event3`, nome che non corrispondeva più a nessuna classe. Il match per nome non poteva quindi risolvere nulla; il chip nel pannello mostrava "Event" (nome corrente della classe) e il PathBuilder offriva `payload`. L'unica catena in grado di produrre questo risultato è il pin per identità. Confermato da Alfonso che il chip è comparso senza ri-selezione manuale.

## Punto 2 — view preesistenti senza pin (gradino 2): VERDE

`IR Class v4` (nessun pin, `appliableToClasses` popolato): il PathBuilder offre le feature corrette di `Class`. Le view già autorate non hanno perso la disambiguazione.

## Punto 5 — console: VERDE su baseline

Baseline al load: tre errori preesistenti (`[JSX Parse Error]`, `[View Error]`, `error jsxparse`), timestamp del caricamento, precedenti a ogni azione sul pin; più tre warning innocui (polyfill, 2 future flag React Router). Nessun rosso nuovo osservato dopo la creazione della view con pin.

## Osservazioni raccolte durante la verifica (backlog, non bloccanti)

1. **Warning di ambiguità con testo pre-1.3**: il messaggio "il picker usa quella a cui è applicata questa view" descrive la risoluzione via `appliableToClasses`; ora il primo gradino è il pin. Una stringa. **Entra nella slice di recupero.**
2. **Rename silenzioso `Event` → `Event3`** durante un normale edit della classe: possibile insidia UX nel flusso di edit (auto-suffisso o simile), da capire. Inoltre il rename non aggiorna i riferimenti per nome nelle view (qui innocuo, ma è la stessa famiglia del debito "path non invalidati al cambio metaclasse").
3. **Freeze della seconda istanza sullo stesso progetto**: un secondo tab sullo stesso progetto, inizialmente funzionante, si è congelato su uno script lungo mentre il primo tab editava. Possibile prima manifestazione concreta di R-9 (isolamento per modello dei singleton di sessione). Firma da ricordare per quando R-9 si affronta.
4. **Vincolo latente del no-backfill, per il prompt di 1.4**: sulle view mai toccate la disambiguazione continua a venire da `appliableToClasses` (gradino 2). 1.4 rimuove il **controllo**, non il campo: se il campo venisse rimosso, la mitigazione sparirebbe in silenzio su tutto il parco view.

## Nota di processo

Il commit `49c32c134` (WIP sui capi) è atterrato **senza** la micro-slice 2.1 e senza C-1..C-4, perché i documenti di ratifica non sono leggibili da Claude Code (vivono nel knowledge base, non nel repo). Conto reale: C-2, C-3, C-4 non fatte; C-1 non verificata. La slice di recupero (`claude/2026-08-05_prompt_recupero_capi_2_1_C1_C4.md`) porta il testo delle condizioni **inline** per questa ragione.
