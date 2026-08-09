# Kickoff prossima sessione (Jjodel, chat di progetto)

> Da incollare come primo messaggio in una chat nuova del progetto "Jjodel Development".

---

Leggi `claude/sessione_2026-07-29_2.md` e `claude/2026-07-30_prompt_B5_mode_toggle_to_navbar.md` nel knowledge base, poi partiamo.

**Dove siamo.** Fase floating chiusa e verificata (F5 incluso, C9 corretta: niente `pointer-events:none` sul wrapper, mai reintrodurlo). Fase 2B progressive disclosure completa sul vertex: sezioni FormSection, toggle unico nell'header della card su `useInterfaceMode`, `allowConditional` con chip read-only, skin del mockup applicata e fixata (B4 + B4-fix). La skin è governata dalla replica HTML `properties-card-mockup-replica.html`: ogni futura iterazione estetica si fa lì (valori letterali), mai con descrizioni in prosa nei prompt.

**Attenzione git**: a fine sessione scorsa erano locali non pushati: union narrowing, B1, B2, B3, B4, B4-fix. **Primo comando: verifica `git log origin/alfonso-frontend-jjtl..HEAD` e pusha.** WIP TextStyle concorrente possibile nel working tree: mai `git add .`.

**Primo lavoro: B5** (prompt già pronto in KB). Il toggle Basic/Advanced migra dalla card Properties al Navbar: un solo writer visibile, nessun residuo di modalità nella card, comportamento B2/B3 invariato. È two-phase: Fase 1 discovery read-only con report OBBLIGATORIO in `docs/discovery/discovery_2026-07-30_navbar_interface_mode.md`, hard stop, analisi in chat, poi Fase 2 solo su go-ahead. La Fase 1 verifica anche lo stato reale della serie B nel log.

**Poi, in ordine.**

1. Fase INSTANCES / rail sinistro: ultimo grosso pezzo del redesign pannelli. Strutturalmente diverso dal lato destro: quel gruppo ospita le tab canvas. Serve discovery dedicata.
2. Backlog, quando capita: dual-canvas (riuso concettuale di split per due modelli affiancati); orfani split (`LayoutMode`, `style.scss:1042`, handler Navbar mai cablati); `groups.editors` in Dock.tsx; language sweep Edge/Row/Matching; token orfani.

**Cose da tenere presenti, imparate a caro prezzo.**

- La verifica visiva si fa su **localhost:3000** con hard refresh: la porta 3001 può servire una build stale e far sembrare "che non cambi niente".
- Le checkbox reali NON sono `button[role=checkbox]`: tab Style = `input.checkbox` nativo nascosto in label; authoring IR = componente a CSS module. Ogni skin futura parte dal componente reale (grep degli import), non da selettori ipotizzati.
- `props-section__title` (pannello class) e FormSection (authoring) sono componenti diversi: non stilarli con la stessa regola.
- L'authoring IR è visibile solo su view non-jsxString: per le verifiche serve una view IR-enabled.
- Quando "lo stile non arriva", la diagnosi giusta è runtime (DOM + stili computati nel browser), non un altro giro di prompt.

**Modo di lavorare.** Invariato: two-phase con report in `docs/discovery/`; prompt autocontenuti MD (COSA/DOVE/COME/RIFERIMENTI); `git add` per path espliciti; hard stop tra i commit; su "decidi tu" scelta impegnata con rationale. Per l'estetica: prima la replica HTML, poi il prompt coi valori.
