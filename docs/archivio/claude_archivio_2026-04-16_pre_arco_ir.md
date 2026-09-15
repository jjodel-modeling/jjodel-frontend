# Archivio: snapshot 2026-04-16 (pre-arco IR)

Estratto da `contesto_progetto.md` il 2026-08-03 per alleggerire il cruscotto. Conservato integralmente. Superato dallo stato corrente; utile solo come traccia del ciclo JjEL / test / docs / paper.

## Stato corrente (al 2026-04-16)
Testing in preparazione al rilascio. Test C, D, E completati. Documentazione ristrutturata con sezione Languages. JjEL eval context esteso con accesso JjOM. Bug State.instances da fixare.

## Decisioni prese (2026-04-15)
- JjTL attribute mapping: `:=` primario, `->` alternativo
- JjTL guard: `where` non `when`
- JjEL stratificazione 3 livelli: built-in collections (L1), context variables data/node (L2), raw JjOM (L3)
- Feature utente senza `$` in JjEL: `p.name` non `p.$name`
- Enum in JjEL: `p.sex` restituisce "Male" direttamente, no `.value.name` (da verificare implementazione)
- `data` come escape hatch, `node` sempre esplicito, `view` escluso per ora
- Disambiguazione: feature utente ha priorita su proprieta JjOM built-in
- Implicit context (Fase 5) rinviato: `name` non funziona bare, serve `data.name`
- `JSON.parse(JSON.stringify(sourceModelData))` rimosso da ProjectEditor.tsx
- `get_token` in classes.ts reso silenzioso
- Documentazione: sezione "Languages" separata da "Reference"; Tutorials spostati dopo Reference

## Bug noti / Todo (al 2026-04-16)
- State.instances restituisce array vuoto [aperto]; causa: shallow copy eagerly al build time
- JjEL `classes.name` restituisce null invece di error su collection property access [aperto] (D4)
- Context menu: testo scuro su sfondo scuro [aperto]
- EditorV2 infinite loop (ReactFlow StoreUpdater): fix v3, sembra tenere [parzialmente risolto]
- Input uncontrolled->controlled in Info.tsx [aperto]
- Transformation editor: sidebar sinistra da rimuovere [aperto]
- Rimuovere logging di debug prima del rilascio [aperto]
- Implicit context (bare `name` nella Console) [rimandato, Fase 5]
- Enum value collapsing (p.sex -> "Male" senza .value.name) [da verificare]
- Text selection durante edge drag: fixato con `selectstart` event listener [risolto 2026-04-16]
- Flow editor: edge non tracciabile in certi casi [aperto]
- Broken link: getting-started/user-guide/dashboard [aperto]

## Prossimi passi (al 2026-04-16)
Fix State.instances; Test F (JjScript/Console); Fix D4; verificare enum value collapsing; fix cosmetici (context menu, transformation editor sidebar); rimuovere logging debug; eseguire prompt docs (enrich viewpoints/console/events, tutorial 5, fix links); integrare JjOM API nella docs utente; Fase 5 implicit context; investigare bug edge non tracciabile.

## Note documentazione / paper (al 2026-04-16)
jjodel-docs: sidebar ristrutturata (Getting Started, User Guide, Concepts, Languages, Reference, Tutorials, Installation, FAQ, Video), build 33 pagine. JjEL reference spostato in Languages, JjTL/JjScript reference creati, Languages Overview creato, EBNF pills aggiunte. Paper: esempi JjTL aggiornati a `:=`, sezione 2.13 "JjEL and the JjOM: Three-Level Abstraction" aggiunta. JjOM API estratta in `docs/jjom-api-extracted.md` (1803 righe, 29 costrutti), da integrare nella docs utente.
