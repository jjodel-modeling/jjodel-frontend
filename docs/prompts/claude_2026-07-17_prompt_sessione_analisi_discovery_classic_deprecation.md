# Prompt di sessione — Analisi del discovery report: deprecation classic editor e IR come contratto di EditorV2

**Data creazione**: 2026-07-17
**Prerequisito**: la discovery `claude/2026-07-17_prompt_discovery_classic_editor_deprecation_viewpoint_editorv2.md` (rev 5 integrazioni) è stata eseguita in Claude Code e il report esiste in `docs/discovery/discovery_2026-07-17_classic_editor_deprecation_viewpoint_v2.md`. **Allegare il report a questa chat** (il KB non lo contiene). Se la discovery non è ancora stata eseguita, fermarsi e dirlo.

---

## Contesto (autocontenuto)

Decisione strategica presa: rimuovere il classic editor (v1). Il classic è oggi l'unico interprete dei viewpoint sintattici (view = quadrupla predicato/jsxString/SCSS/opzioni); EditorV2 (flow) ha nodi React fissi e uno stub `ViewpointRenderer` inerte. Senza un sostituto, la sintassi concreta muore col suo interprete.

Direzione raccomandata nella sessione 2026-07-17 (chat), **da confermare o smentire con il report**: promuovere la **ViewpointIR** (spec `spec_2026-06-08_ir_schema_v1_1.md`) da formato intermedio della feature AI a **contratto della superficie di editing di EditorV2**. Punti qualificanti:

- **Opzione B** tra le tre discusse: A = portare la pipeline jsxString nel flow (scartata salvo sorprese: massimo lavoro, trascina il template engine fragile); B = EditorV2 interpreta l'IR, jsxString muore col classic, escape hatch rimandato esplicitamente; C = due binari IR + jsxString sandboxato (solo se i progetti persistiti contengono view custom arbitrarie diffuse).
- **Compile-to-render-plan obbligatorio**: all'attivazione del viewpoint si compilano accessor e predicati in closure, stili come classi CSS per view, risoluzione indicizzata per metaclasse, subscription derivate dal dependency set dichiarato dall'IR. Mai interpretare l'albero IR a ogni render.
- **Due piani, non uno**: render plan + interaction plan (palette derivata dalle view, connessione che scrive le reference che il rendering legge, drop di containment, edit in place dai field spec). La sintassi concreta è una superficie di editing bidirezionale; i widget classic (`Input`/`Edit`/`Select`/...) sono il contratto di scrittura esistente da eguagliare.
- **Due ruoli del viewpoint tenuti distinti**: selezione (editor-agnostica, si riusa) vs notazione (classic-bound, oggetto del piano).

Riferimenti KB per il quadro completo: `claude/sessione_2026-07-17.md` (decisioni, cronologia), `spec_2026-06-08_ir_schema_v1_1.md` (schema IR), `sessione_2026-06-08.md` (design originale IR + vincoli template engine), `claude/mockup_2026-07-17_ir_interpreter_v2.html` (mockup interattivo dell'interprete: vertex, graphVertex con containment, edge cross-boundary, collasso).

## Obiettivi della sessione

### 1. Verdetto sull'opzione B (prima cosa, dal report)
Leggere il report e rispondere con evidenze, area per area:
- **Area B (discriminatore principale)**: i progetti persistiti contengono solo view default/quasi-default (→ migrazione meccanica, B vince) o view custom arbitrarie (→ valutare C o lift best-effort)?
- **Area C**: quanto della risoluzione view→elemento e dello style è davvero editor-agnostico? Il write path dei widget è replicabile dall'interaction plan?
- **Area D**: costo reale dell'opzione A (gap dello stub) come termine di paragone; la mappa gesti→azioni di EditorV2 è parametrizzabile o va rifatta?
- **Area E**: i comportamenti senza equivalente flow (rendering E editing) sono coperti dallo schema IR o richiedono estensioni/dichiarazioni di fuori scope?
Output: **B confermata / B modificata / C** con rationale esplicito. Se il report contraddice la tesi, dirlo senza sconti.

### 2. Decisioni semantiche (con Alfonso, opzioni sul tavolo)
- Policy edge con endpoint non renderizzati: lift-to-ancestor (come nel mockup v2) vs soppressione vs comportamento attuale del classic (dal report). Decidere e verbalizzare.
- Risoluzione multi-match: adottare la semantica del classic (dal report) o sostituirla con regola esplicita (ordine/priorità dichiarata nell'IR)?
- Escape hatch jsxString: confermare il rinvio o riaprirlo (solo se Area B lo impone).
- Bypass del proxy L nel render path degli accessor compilati: sì/no/da spike.

### 3. Estensioni dello schema IR (v1.1 → v1.2)
Elencare i delta richiesti dal nuovo ruolo di contratto: flag di editabilità su label/field (+ tipo widget), sotto-schema interaction (palette, connessione, drop), routing edge, semantica del collasso dei graphVertex, eventuali campi emersi dal report. Solo elenco motivato in questa sessione; la spec v1.2 può essere un deliverable dedicato.

### 4. Piano a fasi
Bozza di sequenza (da adattare al report): spike interprete IR minimale dietro flag/viewpoint dedicato → default view rigenerate come IR → interaction plan → migration marker-based delle view classic → rimozione toggle e classicSlot → delete `graph/` + EdgeOverlay. Per ogni fase: scope, rischi, criterio di verifica visiva di Alfonso. Includere il **micro-benchmark performance** (500 nodi / 1000 edge: mount, latenza, re-render su mutazione) con baseline sul classic PRIMA di rimuoverlo, altrimenti il confronto si perde per sempre.

### 5. Primi prompt Claude Code
Generare il prompt della prima fase (verosimilmente lo spike dell'interprete: nuovo nodeType generico, render plan per il caso vertex semplice, zero editing). Regole solite: autocontenuto (COSA/DOVE/COME/RIFERIMENTI), MD, scope file stretto, two-phase se serve altra discovery (report in `docs/discovery/` col naming standard), hard stop documentati, log entry.

## Vincoli

- Critical zone: `useJjomSync.ts`, `portDistribution.ts` non si toccano; se il piano li interseca, LIR + go-ahead.
- Il filone validazione conformance ha commit pendenti nel working tree (vedi `claude/sessione_2026-07-16.md`): i prompt implementativi devono usare `git add <file specifici>`, mai `git add .`.
- Nessuna implementazione in questa chat: analisi, decisioni, piano, prompt.
- Checkpoint di sessione al ~60% di contesto o su keyword "checkpoint".
