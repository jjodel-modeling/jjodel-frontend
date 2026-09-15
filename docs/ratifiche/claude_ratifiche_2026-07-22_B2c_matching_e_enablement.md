# Ratifiche 2026-07-22 — B2c: matching top-level IR ed enablement

Decisioni prese da Alfonso in chat di progetto, a valle del discovery report
`docs/discovery/discovery_2026-07-22_ir_view_enablement_entrypoint.md`
(punti 1-4 confermati; punto 5 smentito: la inverse migration esiste,
`VersionFixer 2.225 -> 2.226`, ma emette solo wildcard `'*'`).

## D-B2c-1 — Superficie di editing: tab Advanced del pannello IR

I campi di matching top-level (`metaclasses`, `predicate`, `priority`,
`exclusive`) si editano nel tab Advanced di `VertexAuthoringPanel`, oggi inerte.
Motivazione: costo minimo (`PredicateBuilder` consuma esattamente
`irTypes.Predicate`; `features`/`featuresHint`/`classNames` già in scope nel
pannello; manca solo il wrapper optional sul predicate), e semantica pulita:
Basic = come appare la view, Advanced = quando si applica. Scartata l'opzione
"Apply-To IR-aware": avrebbe prodotto un tab bimodale con metà campi morti per
le view IR. Apply-To resta puramente classico.

## D-B2c-2 — Split in due slice, editor prima

B2c-i = Matching section nel tab Advanced (prompt generato:
`2026-07-22_prompt_faseB2c-i_matching_section_advanced.md`).
B2c-ii = entry-point di enablement UI che converte una view classica in IR,
risolvendo `appliableToClasses` (puntatori a classi) in nomi per
`ir.metaclasses`; la copia non esiste da nessuna parte nel repo proprio perché
è una risoluzione id→nome, non una copia di campo. Prompt B2c-ii da generare a
B2c-i chiusa, stesso pattern i/ii di B2b.

## D-B2c-3 — Migration wildcard invariata

`VersionFixer 2.225 -> 2.226` resta a `metaclasses: '*'`: è semanticamente
corretta (la view classica di default si applicava a tutto) e l'alternativa
tocca critical zone per un beneficio che l'editor di B2c-i rende superfluo (chi
vuole specificità edita la view migrata; la divergenza dalla factory, rischio
R1, è comportamento voluto: la view smette di essere delegata al render nativo
e passa all'interprete IR).

## D-B2c-4 — Cleanup scaffolding dev: chore separato, dopo B2c

`__irviewProbe.ts` (+ riga in `index.tsx`) e la superficie parallela ir-1.0 in
`ai/viewpointIR/` (seconda dichiarazione di `Predicate` nel repo) si ritirano
con un prompt `chore:` piccolo e indipendente a B2c chiusa. Non bloccano nulla
ora, ma sono una trappola per le discovery future.

## Note

- `exclusive` viene esposto in B2c-i con hint onesto sul limite corrente
  (`getIRIndex` salta `exclusive === false`: le view decorative non sono ancora
  renderizzate). Scelta del co-designer, flaggata e non contestata.
- Rischio documentato nel prompt B2c-i: cambiare `metaclasses` non invalida i
  path già scritti nei predicate/Conditional; i path non risolvibili falliscono
  silenziosamente a runtime (no match). Nessuna validazione aggiunta per ora.
- Fixture "IR Test Bed"/"IR State": stato di progetto salvato hand-authored
  (probabilmente seedato con `__jjodelInstallIRDemo` e poi editato), nessun
  seed-of-truth in sorgente. I gate visivi continuano a usarla; se una fase
  futura dipende dalla sua forma esatta, va ispezionata in app.
