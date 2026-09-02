# PROMPT — FL4: integrazione auto-layout nel form renderer (DOPO FL1+FL2+FL3)

Cuci i tre moduli nel renderer della IRForm: layout da FL1 (`jjform/layout.ts`), tema da FL2 (`jjform/themes.ts`), widget dal registro di FL3. Referenza visiva: `Form Auto Layout.dc.html`; collocazione della form: `Manager Admin Form Bottom.dc.html` (pannello sotto la tabella, header con Save/Discard/Delete e badge "Unsaved changes").

## Cosa cambia

- Il renderer della form (quello di 2a/2c — precedenza al motore, R-2B-2) smette di rendere una lista verticale label+campo e monta la griglia a 12 colonne prodotta da `layout.ts`, con la resa dei 3 campi tema da `themes.ts`.
- Overflow dei multi: `growsOnOverflow` → misura a runtime (larghezza dei chip vs contenitore a 6 colonne; `ResizeObserver` o misura al render) → promozione a 12. Isteresi minima: promuovi su overflow, non retrocedere a ogni keystroke.
- I widget si risolvono per nome dal registro di FL3; tipo non coperto → fallback testo (`unknown`, di proposito).
- Nessuna width per-campo e nessuna opzione di layout nella UI: l'unica scelta utente è il preset tema (select nel tab Style del viewpoint, campi in cascata).

## Test attesi

- Il fixture StateMachine rende le righe attese dal prototipo nei 4 preset (snapshot leggeri o assert su span/ordine, non pixel).
- Overflow: 7 tags → il campo promuove a 12; rimozione dei chip sotto soglia non fa flip-flop al keystroke.
- ReadOnly/derived: la cella non offre scrittura (deviazione 3 della shape).
- La form del draft di create (2c) e la edit usano lo stesso layout — nessuna form parallela.

## Fuori scope

Ego-diagramma del neighborhood nella riga espandibile (slice separata, referenza in `Manager Admin Form Bottom.dc.html`), outline 10b, canvas 1b.

## Coordinamento

Parte SOLO a FL1+FL2+FL3 mergiati. Sessione singola, committa con pathspec, log con la sola tua entry.
