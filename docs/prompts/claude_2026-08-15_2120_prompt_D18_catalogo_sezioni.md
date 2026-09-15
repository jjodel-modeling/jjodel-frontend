# Prompt D18 — Catalogo a sezioni nella modale Symbol

Data: 2026-08-15 21:20 · Serie: fronte forme, slice D18 (memo D14..D19)
Esecutore: sessione Cowork su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`
Protocollo: docs/PROTOCOL.md — clausole P1..P10 applicabili. Deroga: P8 non applicabile (smoke automatico non ancora implementato; resta lo smoke visivo di Alfonso).
Prerequisito: GO visivo su D15/D15a+b RICEVUTO (2026-08-15; commit `36a789a53`, `c45ccd5a5`, `bf7a2b59b`, `70c33827d`; entry di log `d3018e652`). Nessuno smoke pendente a inizio sessione.

## COSA

Attuare D18 sulla colonna catalogo della modale Symbol (`SymbolEditorModal`): la ricerca diventa il gesto primario in testa alla colonna; i recenti compaiono in testa dopo un'applicazione; i preset si raggruppano in sezioni per notazione con contatore e collasso; i chip di notazione sostituiscono la Select del filtro. La precedenza di riconoscimento ratificata (piattaforma, poi stencil, poi custom) per ora si esprime solo con i preset di piattaforma.

La sezione «Progetto» NON si crea: arriva con D17 insieme agli stencil (niente sezioni vuote, niente promesse morte). La tabella dati `notationCatalog.ts` NON si tocca nei contenuti (D1: il registry a codice resta com'e'); l'indicizzazione a sezioni e' derivata.

Fuori scope dichiarato: stencil, «Salva come stencil», «Copia da una view» (D17); «Nuova forma» (D19 chiusa); anteprima con misura reale D8 (slice dedicata); edge authoring; card nel rail e `VertexAuthoringPanel` (non si toccano).

## FASE 1 — Discovery read-only (OBBLIGATORIA, hard stop dopo)

Domande a cui il report deve rispondere, con path:riga:

1. Stato del picker dopo D15b (`SymbolCatalogPicker.tsx`, prop `variant='column'`): cosa serve per sezioni collassabili senza rompere il mount `disclosure` (che resta nel contratto).
2. **Dove vivono i «recenti»**: stato di sessione della modale (si azzera alla chiusura) o persistenza (dove? niente localStorage senza discussione). Proporre UNA scelta con trade-off; decide Alfonso all'hard stop.
3. `filterCatalog` e `CATALOG_NOTATIONS` (`notationCatalog.ts`): come derivare il raggruppamento e i contatori senza modificare la tabella dati; interazione ricerca ↔ sezioni (una sezione senza risultati si nasconde o mostra 0?, proposta motivata).
4. Pattern di collasso gia' esistenti nel codebase (disclosure, FormSection, sezioni del rail) per non inventarne uno nuovo; classi e token da riusare.
5. Collisioni: grep globale dei nomi nuovi previsti (componenti, classi SCSS, eventuali chiavi di stato) prima di crearli, con controllo positivo.

Report: `docs/discovery/discovery_<data>_d18_catalogo_sezioni.md` (verificare collisioni di nome nel giorno). Contenuto minimo come da P4. L'hard stop non e' completo finche' il report non e' scritto e committato. `viewpoint/authoring/` e' in critical zone (§3.1): Layer Impact Report in chat prima del diff di Fase 2, anche se nessun file di §3.2 e' toccato.

## FASE 2 — Implementazione (solo dopo analisi del report e go-ahead)

Perimetro atteso (da confermare in discovery, non vincolante sui nomi interni):

* `SymbolCatalogPicker.tsx`: sezioni per notazione (contatore, collasso), ricerca in testa, chip di notazione al posto della Select nella variante `column` (la variante `disclosure` resta funzionante).
* `SymbolEditorModal.tsx`: stato dei recenti (secondo la scelta del punto 2) alimentato dagli apply; nessun evento nuovo.
* `SymbolEditorModal.scss` (o SCSS del picker se emerge in discovery): stile di sezioni, chip e recenti. **L'altezza della modale resta FISSA** (`min(760px, 90vh)` × 1040): tutto scorre dentro la colonna.
* Eventuali test sui helper di raggruppamento derivato (puri, senza React).

Vincoli: design system (slate #334155, cyan solo focus/attivi/indicatori, label 11px, griglia 8px); UI in inglese; niente em dash nei testi; commenti in inglese; nessuna dipendenza nuova; nessun rename di identificatori esistenti; diff minima.

## COME (gate e disciplina di superficie)

* Gate nel container da `git archive HEAD frontend` + overlay dei soli file modificati (un tar del working tree falsa i gate: casing `settings/`). Baseline typecheck Linux: **14, elenco invariato**. Vitest: base **1216 passed / 0 failed** (piu' gli eventuali test nuovi; le 9 suite `window is not defined` che non collezionano sono note). Build **exit 0**; nota: una build lanciata subito dopo vitest puo' morire OOM (exit 137), rilanciarla da sola (eventualmente `NODE_OPTIONS=--max-old-space-size=4096`).
* sha256 device/container prima del commit. `git add <file espliciti>` e commit nella STESSA invocazione; sweep di TUTTI i `.git/*.lock` immediatamente prima di ogni comando git; `rm` non permesso sul mount (nomi nuovi in `_to_delete/`).
* Commit separati: discovery report prima o insieme alla Fase 2, mai untracked (P4).
* Hard stop dopo la Fase 2 per il GO visivo. Criteri minimi: (a) ricerca in testa alla colonna, subito attiva; (b) sezioni per notazione con contatore, collasso che persiste finche' la modale e' aperta; (c) recenti in testa dopo almeno un'applicazione, aggiornati agli apply successivi; (d) chip di notazione filtrano come oggi la Select; (e) semantica di apply INVARIATA (preset = valore, colore del bordo conservato, riconoscimento e chip di stato immutati); (f) modale ad altezza fissa, niente layout shift interno all'apertura o al collasso.
* Entry in `docs/claude-code-log.md` DOPO il GO (formato §21.2, `check:docs` coi quattro file alla radice del gate; noti: 8 errori preesistenti su entry del 14/8, non correggerli).

## RIFERIMENTI

* Memo: `docs/ratifiche/claude_2026-08-15_memo_ratifica_symbol_due_superfici_stencil.md` (§D18, §D16)
* Mockup: `docs/redesign/claude_2026-08-15_mockup_catalogo_stencil_nuova_forma.html` — SOLO per la parte D18 (ricerca, recenti, sezioni con contatori); stencil, sezione Progetto e «Nuova forma» NON si implementano. Contesto layout: `claude_2026-08-15_mockup_rail_e_modale_symbol.html`.
* Discovery: `discovery_2026-08-15_d15_hosting_authoring_modale.md`, `discovery_2026-08-15_d15b_layout_modale_due_pannelli.md`
* Codice: `viewpoint/authoring/SymbolCatalogPicker.tsx`, `SymbolEditorModal.tsx/.scss`, `viewpoint/ir/notationCatalog.ts`, `symbolRecognition.ts`
* Norme: CLAUDE.md (regole non negoziabili, §3.1/§3.2, §7, §8.6/§8.7, §17, §21), docs/PROTOCOL.md P1..P10
* Checkpoint: `docs/sessioni/claude_sessione_2026-08-15_5.md` (stato, vincoli di superficie, debiti)

## DEBITI IN CODA (non di questa slice, non farli senza richiesta)

Push dell'arco (~30 commit locali), rotazione log (41 entry attive, soglia 20, a repo fermo), pulizia `_to_delete/` (incluso `transfer/gate_2026-08-15_d15_163426.tar`, 87 MB), registro `docs/decisions.md` (serie D mai iscritta).
