# Ratifiche UX — Authoring tipografia (TextStyle ir-1.3)

**Data**: 2026-07-27
**Decisore**: Alfonso
**Contesto**: `claude/spec_2026-07-27_ir_textstyle_addendum.md` (§6 authoring, §8 fasatura TS1/TS2/TS3). Ratifica il *come* impacchettare il `TextStyleEditor` a livello UI, non lo schema IR (già ratificato).
**Trigger della discussione**: pannello proprietà IR che si ingolfa con i controlli font; proposta di Alfonso di raggruppare la tipografia dietro un controllo compatto stile Elementor (popover "Body Font").

## Decisione 1 — Pattern: trigger + popover, NON tab dedicato

Il `TextStyleEditor` (§6) non vive come tab di pari livello a Basic/Advanced né come sezione inline espansa. Vive dietro un **campo compatto** (`TextStyleField`): una riga con riassunto live dello stile che, al click, apre il `TextStyleEditor` in **popover overlay assoluto**.

Rationale:
- **Contestualità**: la tipografia è per-elemento (label vertice, riga, edge-label), non uno stato globale del pannello. Un tab di pari livello sarebbe scollegato dall'atto "sto editando *questa* label".
- **Ortogonalità**: Basic/Advanced è un asse di profondità (semplice vs power-user). Typography è un raggruppamento di controlli coesi. Sono dimensioni diverse; non vanno sovrapposte.
- **No layout shift**: il design system vieta il reflow al cambio stato. Il popover è overlay assoluto (portal/absolute), non un accordion che spinge giù il resto del pannello. Come il popover "Body Font" di Elementor, che appare in overlay.
- **Riuso**: lo stesso `TextStyleField` + `TextStyleEditor` si riusa nei quattro punti della spec §6 (LabelEntryEditor, editor compartimento, editor row view, EdgeAuthoringPanel), risolvendo l'ingolfamento in tutti e quattro, non solo nel pannello osservato.

Conseguenze di design:
- Il **chip di riassunto** mostra lo stato reale: "Default / ereditato" finché nulla è autorato (assente = default della superficie, es. label top/center = weight 600), poi solo i delta autorati. Per un asse condizionale, un glifo "condizione" al posto del valore letterale. Non inventare un valore concreto quando lo stile è assente (differenza dall'immagine Elementor, che mostra sempre un valore).
- Il popover ospita il **toggle per-asse** condizionale (§6): la vera differenza da Elementor, che non ha condizionalità. Rischio altezza quando un asse va in modalità condizionale nel side panel stretto: popover-first, con fallback al path modale esistente per l'editor condizionale del singolo asse se l'altezza diventa scomoda.

## Decisione 2 — Assi: solo i 5 ratificati ir-1.3, NON il set esteso di Elementor

Il `TextStyleEditor` rende esattamente i 5 assi ratificati: `fontFamily` (enum sans/mono, select a 2 valori, non ricerca libera), `fontSize` (px, no em/rem), `fontWeight`, `fontStyle`, `color`.

Fuori scope v1 (presenti nell'immagine Elementor ma NON in ir-1.3):
- line-height, letter-spacing;
- text-transform (aa/Aa/AA), text-decoration (underline/strike);
- font-size per breakpoint responsive (concetto web, non esiste per le view Jjodel);
- selettore unità px/em/rem;
- font-family con ricerca libera (da noi enum a 2 valori).

Rationale: aggiungerli sarebbe dead-write in UI (assi senza render/sizing corrispondente) e violerebbe il vincolo anti-dead-write della spec §10. Ogni asse in più tocca render, content-hug e schema IR: è un **addendum di spec separato**, da ratificare esplicitamente, non un'estensione silenziosa del componente perché l'immagine di riferimento la mostra.

## Aggiornamento post-discovery (2026-07-27, discovery Fase 1)

La discovery `docs/discovery/discovery_2026-07-27_ts1_textstyle_label.md` ha rivelato che **TS1 era già implementato e committato** (`e2368cad7`), ma con authoring **inline** (blocco "Stile" con checkbox + ConditionalEditor in `LabelEntryEditor:99-102`), non col pattern trigger+popover ratificato. Primitiva, compile, render, sizing e token `--font-mono` sono già a posto e verificati a schermo; il misuratore a font fisso anticipato **non esiste** (content-hug CSS/DOM-driven), quindi nessun fix di `nodeSizing.ts` e nessun Layer Impact Report.

Di conseguenza TS1 residuo = **refactor UX** (inline → trigger+popover), non greenfield. Cinque decisioni ratificate per la Fase 2 (prompt `claude/2026-07-27_prompt_fase2_textstyle_field_popover.md`):

1. **Refactor sopra `e2368cad7`**, non reimplementazione: tipi/compile/render/sizing/token intoccati.
2. **`TextStyleEditor` = corpo del popover, core per-asse invariato**; `TextStyleField` è il nuovo wrapper. Si preserva il collasso a `undefined` (round-trip di persistenza già funzionante). Niente fallback inline duplicato.
3. **Popover via portal a `document.body`** (pattern `NodeProblemOverlay`), non absolute in-place: robustezza contro il clipping da `overflow` del pannello (CLAUDE.md §15.2). Posizione via `getBoundingClientRect`, max-height clampata + scroll interno, flip sopra se poco spazio, chiude su outside-click/Esc/scroll.
4. **Summary rule**: 0 assi → "Default" muted; altrimenti solo gli assi autorati in ordine family · size · weight · style, swatch colore in coda; asse condizionale → glifo condizione al posto del literal; riga singola con ellipsis.
5. **Posizione invariata**: trigger resta ultima sezione di `LabelEntryEditor`, non accorpato con Source.

Classi CSS del field/popover namespaced `jj-textstyle-*` (mai riusare `.edge-type-popup`). Solo `TextStyleField` è un nome libero; tutti gli altri identificatori TextStyle sono già occupati da `e2368cad7`.

## Aggiornamento — redesign per-asse (2026-07-27, Fase 2b)

Alfonso ha giudicato il corpo del popover (checkbox per asse + segmentato "Fisso/Condizionale" per riga) poco professionale. Ratificato il redesign della sola UI per-asse di `TextStyleEditor`, semantica IR invariata. Mockup approvato: colonna "Proposta" di `textstyle_popover_mockup.html`. Prompt: `claude/2026-07-27_prompt_fase2b_textstyle_editor_redesign.md`.

Decisioni:
1. **Via le checkbox e il segmentato per-riga.** Controlli sempre visibili; lo stato "non impostato" vive dentro ogni controllo come opzione/placeholder **"Default"**. Font/Peso/Stile = Select con prima voce "Default"; Dimensione = NumberInput con placeholder "Default" (svuotabile); Colore = ColorPicker con stato "Default" (nessun colore reale forzato).
2. **Semantica invariata**: "Default" su un asse = chiave rimossa; tutti a Default = `style` → `undefined`. Si riusa lo stesso collasso già presente (era il path della checkbox spenta); nessun nuovo write path.
3. **Condizionalità = icona `ƒx` per riga, posseduta da `TextStyleEditor`.** Stato derivato dal valore (`isConditionalValue`). Nello stato normale (fisso/Default) **non** si monta `ConditionalEditor`: solo il controllo semplice (è qui che nasce l'aspetto pulito). `ƒx` accesa → la riga espande l'editor condizionale (riuso di `ConditionalEditor` con `renderValue` = controllo semplice).
4. **`components/ui/ConditionalEditor` non si tocca** (condiviso): se il suo switch interno non è nascondibile via prop, resta visibile solo nell'area espansa; hard stop se il layout pulito richiedesse di modificarlo.
5. **Bug collaterale**: un secondo `Select` "Sans" a tutta larghezza sotto la card Tipografia. Da identificare: se è il trigger di `TextStyleField` reso come select, va corretto in summary compatto; se duplicato, rimosso; se estraneo, lasciato e riportato.
