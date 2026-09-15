# Prompt D15 — Ri-hosting dell'authoring del simbolo: modale + card leggera nel rail

**Data**: 2026-08-15 16:15 · **Serie**: fronte forme, slice D15 (memo D14..D19)
**Esecutore**: sessione Cowork su `/Users/alfonso/jjodel`, branch `alfonso-frontend-jjtl`
**Prerequisito**: GO visivo di Alfonso sul chip D14 (commit `901ebadee`). Se il GO non c'e' ancora,
chiederlo prima di toccare codice; se il chip fallisce lo smoke, questa slice non parte.

## COSA

Attuare D15: l'anatomia del simbolo (form, marker, assi del bordo, fill, text style, oggi dentro
`VertexAuthoringPanel`) si sposta in una **modale**; nel rail resta una **card leggera** con il
riconoscimento (D14, gia' implementato in `symbolRecognition.ts`), gli assi conservati (colore del
bordo) e il bottone di lancio. La sintassi astratta NON si tocca. La semantica di scrittura resta
**live**, senza apply/cancel. Riferimento visivo approvato:
`docs/redesign/claude_2026-08-15_mockup_rail_e_modale_symbol.html` (frame B e scena modale).

Fuori scope dichiarato di questa slice: il catalogo a sezioni (D18), gli stencil (D17),
`EdgeAuthoringPanel` (stesso trattamento, slice successiva: annotarlo nel report, non farlo).
«Nuova forma» NON esiste (D19 chiusa).

## FASE 1 — Discovery read-only (OBBLIGATORIA, hard stop dopo)

Domande a cui il report deve rispondere, con path:riga:

1. **Chi ospita `VertexAuthoringPanel` oggi**: componente padre, dove sta nel layout (rail? dock?),
   ciclo di vita di `draft`/`patch` (quando si scrive verso l'IR, cosa succede alla chiusura).
2. **Il pattern modale canonico** (§8.7 CLAUDE.md): leggere `ImportSummaryModal.tsx` e il registry
   eventi (`events/registry.ts`). L'apertura della modale passa da un evento del registry, MAI da
   stringa hardcoded.
3. **Cosa deve restare nella card leggera**: quali props/stato servono al riconoscimento e al
   lancio; cosa serve alla modale per montare lo STESSO pannello senza fork (vincolo Editor V3:
   stesso componente ri-ospitato, nessun secondo mondo editoriale, nessun evento nuovo oltre al
   lancio).
4. **Collisioni di nomi**: grep globale dei nomi nuovi previsti (componente modale, classi SCSS,
   evento) prima di crearli.
5. **Z-index e overlay esistenti**: dove vivono le altre modali/toast, per non inventare uno
   stacking context nuovo.

**Report**: `docs/discovery/discovery_<data>_d15_hosting_authoring_modale.md` (verificare
collisioni di nome nel giorno). Contenuto minimo: obiettivo, file letti con path, findings,
rischi, domande per Alfonso. L'hard stop non e' completo finche' il report non e' scritto e
committato. `viewpoint/authoring/` e' in critical zone (§3.1): **Layer Impact Report in chat prima
del diff di Fase 2**, anche se nessun file di §3.2 e' toccato.

## FASE 2 — Implementazione (solo dopo analisi del report e go-ahead)

Perimetro atteso (da confermare in discovery, non vincolante sui nomi interni):
- Nuovo componente modale in `viewpoint/authoring/` che ri-ospita il contenuto del pannello.
- Card leggera nel punto dove oggi rende il pannello: riconoscimento (riusare `recognizeSymbol`),
  swatch colore, bottone «Apri editor simbolo» (btn primario slate, mai cyan come sfondo).
- Evento di apertura nel registry eventi.
- SCSS nuovo con nomi verificati; nessun rename di identificatori esistenti; diff minima.

Vincoli di stile: design system (slate #334155, cyan solo focus/attivi, label 11px, griglia 8px);
UI in inglese; niente em dash nei testi; commenti in inglese; nessuna dipendenza nuova.

## COME (gate e disciplina di superficie)

- Gate nel container **da `git archive HEAD frontend`** + overlay dei soli file modificati (un tar
  del working tree falsa i gate: casing `settings/`). Baseline typecheck Linux: **14**, elenco
  invariato. Vitest: base **1216**, zero failed nei file toccati. Build exit 0.
- sha256 device/container prima del commit. `git add <file espliciti>` e commit nella STESSA
  invocazione; sweep dei lock immediatamente prima; `rm` non permesso sul mount (nomi nuovi in
  `_to_delete/transfer/`).
- Commit separati: discovery report prima o insieme alla Fase 2, mai untracked (P4).
- Hard stop dopo la Fase 2 per il GO visivo. Criteri minimi: (a) la card leggera mostra
  riconoscimento e colore, il pannello pieno non e' piu' nel rail; (b) il bottone apre la modale
  col pannello funzionante; (c) un edit nella modale si vede subito sul canvas (semantica live);
  (d) Esc e X chiudono senza perdere nulla; (e) sintassi astratta invariata pixel per pixel;
  (f) niente layout shift nel rail all'apertura.
- Entry in `docs/claude-code-log.md` DOPO il GO (formato §21.2, `check:docs` sui quattro file alla
  radice del gate; noto: 8 errori preesistenti su entry del 14/8, non correggerli).

## RIFERIMENTI

- Memo: `docs/ratifiche/claude_2026-08-15_memo_ratifica_symbol_due_superfici_stencil.md`
- Mockup: `docs/redesign/claude_2026-08-15_mockup_rail_e_modale_symbol.html` (+ catalogo v2 per
  contesto, NON per questa slice)
- Discovery D14: `docs/discovery/discovery_2026-08-15_riconoscimento_strutturale.md`
- Codice: `viewpoint/ir/symbolRecognition.ts`, `viewpoint/ir/notationCatalog.ts`,
  `viewpoint/authoring/VertexAuthoringPanel.tsx` (sezione Symbol ~riga 334)
- Norme: CLAUDE.md (regole non negoziabili, §3.1/§3.2, §8.6/§8.7, §17), docs/PROTOCOL.md P1..P10
- Checkpoint: `docs/sessioni/claude_sessione_2026-08-15_4.md` (stato, smoke pendenti, vincoli)

## SMOKE PENDENTI DA SBLOCCARE A INIZIO SESSIONE

1. Chip D14 (criteri nel checkpoint _4). 2. Picker a catalogo (criteri nel checkpoint _2, mai
dichiarato eseguito). Chiedere il GO su entrambi prima della Fase 2.
