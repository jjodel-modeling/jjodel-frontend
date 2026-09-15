# Commit B5 (two-phase) — Toggle Basic/Advanced dalla card Properties al Navbar

**Tipo:** relocation UI, discovery-lite + 1 commit.
**Data prompt:** 2026-07-30
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** high
**Precondizione:** B1, B2, B3 committati; stato di B4 (skin) da accertare in Fase 1. Working tree con possibile WIP TextStyle concorrente: **mai `git add .`**.

> **Ratifiche 2026-07-30** (in chat; sostituiscono il punto "UN solo toggle, nell'header della card" di Fase 2B v2):
> (a) il toggle globale Basic/Advanced vive nell'header dell'applicazione (Navbar), non nella card Properties. Motivo: commuta una modalità dell'intera app (localStorage `jjodel.interfaceMode`, statico `U.interfaceMode`, riconciliazione Redux nel Navbar) e la disclosure arriverà anche ad altri pannelli; un controllo globale dentro una card comunica uno scope sbagliato.
> (b) Forma: segmented Basic|Advanced in stile mockup, adattato alla palette reale del Navbar. Se nel Navbar esiste già un controllo advanced visibile, il segmented lo sostituisce: **un solo writer visibile**.
> (c) Nella card non resta alcun residuo di modalità: niente hint, niente chip, niente secondo toggle.
>
> Il comportamento B2/B3 (gating Compartments/Badges/Matching, `allowConditional`, chip read-only) NON cambia: legge la modalità globale ed è indipendente da dove sta il writer UI.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Contraddizioni: segnala e fermati.
- **Critical-zone:** non toccare `EditorV2.tsx`, `useJjomSync.ts`, `portDistribution.ts`, `sync/*`.
- `PropertiesWithTreeView.tsx` si può toccare SOLO nell'header della card (rimozione del segmented). Non toccare overlay, resize, accordion, inset, gating della pill.
- `hooks/useInterfaceMode.ts` in sola lettura: il meccanismo non si modifica, si consuma.
- `git add` scoped per path espliciti. Mai `git add .`.
- Zero refactoring opportunistico, mai rinominare identificatori esistenti.
- **Prima di ogni nuovo identificatore** (classe CSS, prop, chiave): `grep -r` globale per collisioni.
- Hard stop dopo la Fase 1 (report) e dopo il commit di Fase 2 (verifica visiva di Alfonso su `localhost:3000`).

## 1. Fase 1 — Discovery read-only

Nessuna modifica a file sorgente in questa fase.

1. **Stato della serie B**: `git log --oneline -15`. Verifica quali commit B sono presenti (`refactor(panels): wrap vertex authoring groups...`, `feat(panels): move disclosure toggle...`, `feat(panels): gate conditional editing...`, `style(panels): apply mockup skin...`). Se B2 non risulta committato, fermati e segnala: questo prompt presuppone il segmented nell'header della card.
2. **Censimento del meccanismo**: `grep -rn` su `interfaceMode`, `INTERFACE_MODE_CHANGE`, `U.interfaceMode`, `state.advanced` in `src/`. Elenca TUTTI i lettori e i writer con path:riga. Riporta l'API esatta del hook (cosa ritorna, come si scrive la modalità).
3. **Il Navbar oggi**: individua il componente della barra superiore dell'app (quello che riconcilia Redux `state.advanced` con la modalità). Riporta: path esatto, struttura JSX dell'header (cluster sinistro/centro/destro), classi SCSS e file proprietario degli stili, palette di sfondo (chiaro o scuro), ed eventuale controllo UI già esistente per la modalità (switch, voce di menu, altro): dov'è, com'è fatto, se è visibile all'utente finale.
4. **Visibilità del Navbar per vista**: verifica se il Navbar è reso identico su tutte le viste (editor, summary, documentation, dashboard di progetto) o cambia forma. Il toggle sarà sempre visibile; se il Navbar cambia per vista, riporta dove e come.
5. **Il segmented nella card**: individua nel card header il markup del segmented B2 (più eventuale skin B4), gli handler, le classi SCSS dedicate. Verifica con grep che nessun selettore o test dipenda dalla PRESENZA del segmented nella riga del titolo (es. selettori posizionali sui figli della riga).
6. **Report OBBLIGATORIO** in `docs/discovery/discovery_2026-07-30_navbar_interface_mode.md`: obiettivo, file letti (path completi), findings dei punti 1-5 con riferimenti path:riga, proposta di collocazione del segmented nel Navbar (con motivazione sullo spazio reale), rischi, domande aperte per Alfonso. L'hard stop non è completo finché il report non è scritto.

**HARD STOP.** L'analisi avviene in chat sul report salvato. La Fase 2 parte solo dopo go-ahead esplicito.

## 2. Fase 2 — Implementazione (solo dopo go-ahead)

UN commit.

### 2.1 Navbar: il segmented entra

- Aggiungi il segmented Basic|Advanced nel punto proposto dal report (orientativamente nel cluster destro dei controlli globali, salvo indicazione diversa in analisi).
- **Wiring**: legge e scrive SOLO attraverso `useInterfaceMode`. Non scrivere `state.advanced` direttamente, non aggiungere un secondo listener di riconciliazione (il Navbar già riconcilia), non introdurre stato locale di modalità.
- **Se esiste già un controllo advanced visibile nel Navbar**: rimuovi il vecchio controllo UI conservando intatta la logica di riconciliazione. Se il controllo esistente sta dentro un menu, rimuovi la voce solo se è un puro duplicato del toggle; in caso di dubbio riporta e lascia.
- Il toggle è sempre visibile, in tutte le viste in cui il Navbar è reso.

### 2.2 Card Properties: il segmented esce

- Rimuovi dal card header (riga del titolo) il markup del segmented e il suo wiring locale. La riga resta con titolo PROPERTIES e le affordance esistenti (pin, collapse, ecc.): nessun'altra modifica a breadcrumb, chip VIEW, tab bar.
- Rimuovi le regole SCSS del segmented SOLO se scoped alla card e senza altri consumatori (grep prima). Conserva border-bottom e spaziatura della riga.
- Se la riga del titolo risultasse visivamente squilibrata dopo la rimozione, riporta la cosa come punto aperto: non inventare riempitivi.

### 2.3 Stile del segmented nel Navbar

- Geometria e tipografia del segmented B2/B4: track radius 10px padding 3px, pillola attiva radius 8px con ombra leggera, testo 13px weight 600.
- Colori adattati alla palette reale del Navbar rilevata in Fase 1. Su fondo chiaro: track `#f1f5f9`, pillola bianca, attivo `#1e293b`, inattivo `#94a3b8` (valori B4). Su fondo scuro: proponi nel report una variante coerente coi token slate del progetto prima di implementare.
- Classi CSS nuove (es. `.jj-navbar-mode-toggle`, nome definitivo dopo grep di collisione), nel file SCSS proprietario degli stili del Navbar. NON riusare le classi del segmented della card se sono scoped sotto la radice della card.

### 2.4 Cosa NON fare

- Non toccare il comportamento B2/B3: gating sezioni, `allowConditional`, chip read-only, fallback dalla vista matching restano identici.
- Non toccare overlay floating (resize, accordion, inset, pill), `Dock.tsx`, SCSS del dock, Edge/Row.
- Non modificare `useInterfaceMode` né la riconciliazione Redux.
- Non lasciare due writer visibili (card + Navbar, o Navbar + vecchio controllo).
- Non rinominare classi esistenti. Mai `git add .`.

## 3. Verifica

- `npm run build` verde; `npm run typecheck` a baseline (Δ0).
- Visiva: segmented nel Navbar in entrambe le modalità; card senza toggle e header integro; commutare dal Navbar aggiorna la card live (Compartments/Badges/Matching compaiono e spariscono); reload conserva la modalità; dalla vista matching, passare a Basic ripiega sulla visuale senza errori; Edge e Row invariati.
- Navbar controllato su tutte le viste (editor, summary, documentation, dashboard) e a larghezze ridotte: niente wrap o overflow dei controlli.

## 4. Chiusura

- Entry in `docs/claude-code-log.md` (tipo `feat`): file toccati, esito, writer/lettori censiti, eventuale vecchio controllo Navbar rimosso o lasciato.
- Commit: `feat(navbar): move basic/advanced toggle from properties card to navbar`.
- **Hard stop**: verifica visiva di Alfonso.
- Riporta in chat: differenze residue, punti aperti, cosa è stato fatto del controllo Navbar preesistente.

## 5. Riferimenti

- `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md`, Parte B: `useInterfaceMode` (localStorage `jjodel.interfaceMode`, evento `INTERFACE_MODE_CHANGE`, statico `U.interfaceMode`, Redux `state.advanced` riconciliato nel Navbar).
- Prompt `2026-07-29_prompt_fase2B_progressive_disclosure.md` (v2), sezione 3: wiring del segmented B2 e semantica del toggle.
- Prompt `2026-07-30_prompt_B4_oneshot_mockup_skin.md`, sezione 2 "Header riga 1": valori esatti del segmented (track, pillola, tipografia).
- Ratifiche 2026-07-30 in testa a questo prompt: (a) toggle nell'header dell'app; (b) segmented stile mockup, un solo writer visibile; (c) nessun residuo di modalità nella card.
