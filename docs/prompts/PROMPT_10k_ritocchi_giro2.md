# PROMPT — Slice 10k: ritocchi visuali del manager, giro 2 (SERIALE)

Richiesta utente a schermo (01-09, screenshot su modello `sample-StateMachine`). Nove punti, solo superficie + copy; pattern 10h/10i: sonda before/after, asserzioni su computed style, screenshot nel referto. Referenza normativa per i punti 2-3: board `Manager Admin Form Bottom.dc.html` (progetto di design).

## I punti

1. **Checkbox della tabella fuori stile**: troppo grande, bordo spesso, spunta nera da form nativa. Portalo al DS: 16×16, radius 4px, bordo 1px slate-300 (`--color-border`), checked = riempimento slate-700 (`--color-accent`) con glifo bianco, focus ring 3px `--color-accent-subtle`. Stesso trattamento per il checkbox di testata (select-all) e per `ISHISTORY` in riga se è lo stesso componente — dichiara se non lo è.
2. **Titolo pagina fuori dalla card**: «State» + sottoriga stanno DENTRO la card della tabella; nel mockup il titolo è sul fondo desk, sopra la card. Sposta titolo+sottotitolo fuori; la card inizia dalla toolbar (filtro/segmented/Columns/Export).
3. **Header della card form in evidenza**: «Running · State» + Delete oggi galleggiano su bianco. Dai all'header banda propria: fondo `--color-bg-secondary` (slate-50), hairline sotto, padding della card, radius superiori raccordati. Come da board.
4. **NAME doppio**: la colonna attributo `name` mostra lo stesso valore della colonna fissa su ogni riga. Auto-nascondila quando coincide (è la semantica di `autoHiddenKeys` di 10i — dichiara se riusi quel canale); l'indicatore del pannello Columns la conta come auto-nascosta, non come scelta utente.
5. **`entryAction` a tutta larghezza**: sbilancia la riga con `timeout`. Cap alla larghezza (metà riga; se il layout è quello FL1, span 6) — dichiara la via.
6. **CHILDREN + ADD CONTAINED**: due sezioni per lo stesso `substates`. Unifica: una sezione CHILDREN con lo slot valori e la CTA «+ Add State» in linea; l'eyebrow ADD CONTAINED sparisce.
7. **Nodo owner nell'ego**: «Heater · owner» tocca l'arco col proprio box. Offset verticale sufficiente a staccare nodo ed etichetta dall'arco (misura il gap nel referto).
8. **Copy sottotitolo**: «Created from its container's form (Final, Initial, State, StateMachine)» → più diretto, es. «Contained in StateMachine» quando la metaclasse è contenuta; per le rootable la riga attuale può restare o semplificarsi — dichiara la scelta con il criterio.
9. **Passata slick complessiva**, SOLO con token DS (niente valori inventati): card su `--shadow-sm` con lift hover dove il DS lo prevede, radius 12px uniformi, hover di riga `--color-bg-hover`, transizioni 150ms ease-out sugli stati che oggi scattano secchi. Ogni delta dichiarato nel referto con token citato.

## Fuori scope

Il typo di dato `SUb1` (è contenuto utente), il motore, l'outline, ENG2/UX1 (parallele, altri perimetri), dark mode.

## Coordinamento

Seriale sul fronte manager. Contese possibili con ENG2/UX1: nessuna sui file (`instanceManagerTab.scss`, `InstanceManagerTab.tsx`, foglio ego — tuoi). Non regredire: 10i (uppercase/Columns), 10j (empty state, card 271px), DS3 (`&__draft-label` con colore dichiarato divergente). Committa con pathspec, entry di log in commit separato, screenshot before/after per punto nel referto.
