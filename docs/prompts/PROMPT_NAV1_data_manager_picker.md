# PROMPT — NAV1: «Data manager» nel picker delle sintassi + tab header (DISCOVERY-FIRST sul routing)

Decisione presa (01-09, mock su board `Manager Admin Form Bottom.dc.html`): il manager entra nel selettore delle viste come **«Data manager»** — è una proiezione del modello come le sintassi concrete; il picker è già il punto dove si sceglie «come guardo il modello». Naming ratificato: NON «CRUD», NON «Tabular/Form syntax». Sentence case.

## Le due superfici (dallo screenshot utente, toolbar del modello)

1. **Il select con l'occhio** (`bi-eye` + «Abstract syntax», bordo cyan): oggi elenca Abstract syntax + le sintassi concrete/viewpoint. Aggiungi la voce «Data manager» IN CODA, dopo un separatore se il controllo li supporta: le sintassi restano raggruppate, il manager chiude come vista operativa. Icona di voce (se le voci ne portano): `bi-table`.
2. **La tab nell'header del modello** (la barra con «Test CRUD», il chip `model_1`, il «+»): selezionare «Data manager» deve portare alla stessa vista raggiungibile da lì. Prima misura come si apre oggi il manager (quale azione monta `InstanceManagerTab`) e riusa QUELLA via — il picker non monta niente di suo, delega.

## Discovery prima del codice (Regola 15 vale doppio qui)

- Trova il componente del select (grep su «Abstract syntax» in `src`), il suo vocabolario (enum? lista di viewpoint?) e chi consuma la scelta. Se il vocabolario è «solo viewpoint», «Data manager» è una voce sintetica: dichiara come la distingui (sentinella, non un viewpoint finto nel grafo D).
- Verifica la simmetria: scegliere Data manager dal picker e aprire il tab dall'header devono convergere sullo stesso stato (stesso tab riusato se già aperto, non un secondo montaggio).
- Tornare a una sintassi dal picker mentre il manager è attivo: comportamento simmetrico, dichiara cosa succede al tab (resta aperto in background — non chiuderlo).
- Se il picker vive in un componente condiviso col canvas che porta assunzioni «solo sintassi» (es. scrive sempre un viewpoint attivo), fermati e riporta con le opzioni — non forzare la sentinella dentro `state.viewpoint`.

## Riferimento visuale

Mock sulla board `Manager Admin Form Bottom.dc.html` (rail «Syntax»): voce selezionata con evidenza cyan da selezione (`#ecfeff` + barra `#0891b2`), icona `bi-table`. Nella toolbar il pattern resta quello del select esistente — non inventare un controllo nuovo.

## Test attesi

- Il picker elenca le sintassi + Data manager; scelta → manager visibile; scelta di una sintassi → canvas torna, tab manager non distrutto.
- Simmetria picker/tab header (stesso stato, nessun doppio montaggio).
- Non-regressione: vocabolario e comportamento del picker per le sole sintassi identici al before.

## Fuori scope

Il manager stesso (10k in volo sul suo perimetro — NON toccare `InstanceManagerTab.tsx`/`.scss`; se la delega richiede un cambio lì, fermati e riporta), il rail di navigazione del mock (era illustrativo), persistenza della scelta oltre quella che il picker già ha.

## Coordinamento

SERIALE dopo 10k se il montaggio del tab richiede ritocchi; altrimenti parallelo (perimetri: toolbar/picker + routing). Pathspec; entry di log SEMPRE per pathspec esplicito (`git commit -- docs/claude-code-log.md`) — §6.1 ha colpito due volte il 01-09. Rotazione P9 se il log è ancora sopra 40 a corsie ferme.
