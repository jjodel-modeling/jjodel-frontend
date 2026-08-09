# Kickoff prossima sessione — design system di piattaforma

Incolla questo come primo messaggio della chat nuova.

---

Riprendiamo il filone del design system di piattaforma. Leggi in quest'ordine e fermati: `claude/sessione_2026-08-05_3.md`, `claude/ratifiche_2026-08-05_design_system_piattaforma.md`, `claude/ratifiche_2026-08-05_2_slice0_checkbox.md`. Se serve il dettaglio del design della property card: `claude/2026-08-05_design_property_card_sintassi_astratta.md`. Non serve altro per partire.

## Stato dei tre filoni

**Design system di piattaforma**: strategia, perimetro e dieci decisioni (DS-1..DS-10) ratificate. Slice 0 chiusa con un commit. Niente altro implementato.

**Property card della sintassi astratta**: mockup v2 consegnato, un solo controllo ratificato (il segmented in rilievo). La struttura a quattro sezioni resta proposta.

**Arco tab IR**: sospeso e intatto, con WIP non committato su `EdgeAuthoringPanel.tsx`. Vedi `claude/2026-08-05_kickoff_prossima_sessione.md`, che resta valido. Le sue superfici sono zona congelata per il design system.

## Prima cosa da fare

Il `chore` di rimozione del codice morto (DS-3). Toglie di mezzo circa un terzo di tutto cio' che viene dopo: i booleani scendono da 14 implementazioni a 9, le select da 9 a 5. Rischio quasi nullo, perche' per definizione hanno zero call site. Il prompt non e' ancora scritto.

Restano fuori dal `chore` e in attesa di una decisione di prodotto: `ExportImageMenu`, `ExportImportMenu`, `ProviderSelector` (due copie). Sono feature scritte e mai cablate, non duplicati.

## Ordine gia' deciso

1. `chore` di rimozione del codice morto.
2. Emendamenti a `CLAUDE.md`: §7.1 colore acceso (cyan) e scala spacing, §7.2 conteggio dei residui `--accent` (ne dichiara uno, ne esistono 31 in 7 file), regola anti drift, riferimento alla vetrina. Va **prima** delle migrazioni, non alla fine: da li' in poi ogni feature nuova nasce conforme.
3. Segmented piu' vetrina, insieme.
4. Slice sui controlli booleani, che assorbe `style.scss:221`, i diciannove override difensivi e le righe rimaste dedotte.
5. Select, disclosure, header, spacing, poi tipografia, poi colore.

## Vincoli da non violare

- **Perimetro: tre superfici.** `#/allProjects`, `#/project`, le modali. Diciassette pagine su ventuno sono morte: misurarle o migrarle e' lavoro che nessuno vede.
- **I conteggi del censimento sono su `src/` intero**, quindi sono un limite superiore. Ogni slice riproietta i propri numeri sulle tre superfici vive prima di partire (DS-10).
- **Zona congelata**: cio' che l'arco tab IR sta toccando, incluse le classi `.view-editor-tab*`, che non si rinominano.
- **Una primitiva per volta.** Mai due in lavorazione insieme.
- **Il gate visivo sta prima di ogni migrazione** che dipenda da un verdetto sulla resa. La slice 0 e' partita da una diagnosi sbagliata proprio perche' la resa era stata dedotta dal CSS invece che guardata.
- Working tree non pulito: ogni `git add` e' per file espliciti, mai `git add .`.

## Cosa non rifare

Queste sono misurate e ripeterle brucia contesto senza aggiungere niente:

- Il perimetro vivo: tre superfici, diciassette pagine morte su ventuno, elenco completo nel censimento §1 e §14.
- I numeri del debito: 14 booleani, 9 select piu' 8 combo, 11 disclosure, 12 segmented a mano, 631 `<button>` nudi contro 39 `ui/Button`, 4 scale di spacing, 3 vocabolari tipografici.
- `forEndUser/` e' fuori perimetro: nessuna pipeline viva legge il `jsxString` (misura del 4 agosto).
- `ui/Checkbox` ha zero call site ed e' immune al difetto delle native, perche' rende un `<button role="checkbox">`.
- Le tre vetrine esistenti: `TokenPreview` su `#/test-tokens` funzionante, `FormExample` orfano, Storybook assente.

## Domande ancora aperte

- Sulla property card: cos'e' la barra `NODE` in fondo a ogni card, se `DAttribute` ha un default value, se `DReference` ha una `opposite`, e se lo screenshot della metaclasse era in modalita' Advanced (da cui dipende se `INHERITANCE` senza `Extends` sia un bug o una scelta).
- Se il commit `383170dc0` "Template tab read-only" chiuda il bug ad alta priorita' del tab Template ingannevole: in tal caso va tolto dai bug aperti di `contesto_progetto.md`.
- Cablare o ritirare le tre feature mai cablate.
