# Ratifiche Fase B2b — Conditional/Predicate builder

Data: 2026-07-22. Continuazione di `sessione_2026-07-22_3.md` e `ratifiche_2026-07-21_authoring_slice1.md`. Copre le tre decisioni aperte su B2b (poste da Alfonso a fine sessione precedente) e l'architettura concreta, grounded leggendo il codice reale del repo (non solo il design remoto) via accesso diretto al repo locale di Alfonso.

## Verifica di apertura sessione (stato reale del repo, non solo il checkpoint)

- **B2a**: file di codice già `git add`-ati ma **mai committati**; `docs/claude-code-log.md` ha due entry pendenti inserite nel punto sbagliato del file (in testa invece che in fondo, ordine cronologico da correggere). Generato prompt di chiusura: `claude/2026-07-22_prompt_faseB2a_commit_finale_e_recuperi.md`.
- **Discovery mount-chain di `VertexAuthoringPanel`**: confermato mai salvato su file (né in git history né in working tree). Recupero incluso nello stesso prompt di chiusura.
- **Fix guard `computeIRSignature`** (`irResolveCore.ts:65`, `parts.length > 1 ? ... : ''`): confermato ancora presente, mai applicato. Prompt già pronto da sessione precedente (`claude/2026-07-22_prompt_fix_computeIRSignature_guard.md`), resta prioritario prima di merge-are B2b.
- Nel working tree sono presenti anche artefatti di un filone di lavoro diverso e non correlato (CSS box layering, color swatch, shape CSS — sessioni `_2`/`_3` parallele), lasciati intenzionalmente intatti e fuori perimetro dai prompt generati.

## Decisioni ratificate (AskUserQuestion)

- **(a) Rules**: SOLO `{ when, then, else? }` in B2b. `{ rules: [...], default? }` resta estensione additiva futura, non implementata ora. Se un valore letto è già in forma `rules`, l'editor lo mostra come chip read-only e lo preserva verbatim (stessa disciplina Q3 di B2a).
- **(b) Siti Conditional**: TUTTI E SEI abilitati in B2b-ii — `shape.form`, `shape.fill`, `label.visible`, `badge.icon`, `badge.visible`, `fieldCompartment.visible`. Motivazione: una volta generico `ConditionalEditor<T>`, cablare un sito in più è a basso costo marginale (solo il `renderValue` cambia), ed evita lo stato ibrido "alcuni Conditional editabili, altri no" che confonderebbe in UI.
- **(c) Tipi Literal nei confronti**: boolean + number + string, con suggerimento automatico del widget/tipo quando l'altro lato del confronto è un path risolvibile su un attributo di tipo noto (via `PathBuilderFeatures`/`MetaclassInfo`), toggle manuale di riserva quando non risolvibile.

## Architettura (grounded su irTypes.ts / irCompile.ts reali, non sul design doc remoto)

- Schema confermato identico a quanto riportato nel checkpoint precedente: `Predicate` (and/or/not/6 comparatori/exists/empty/isKind/literal), `Literal` (`{kind:'string'|'number'|'boolean', value}`), `Conditional<T>` (T | when/then/else | rules/default).
- Semantica compilatore rilevante: `else` assente ricade sul fallback di campo già esistente (non serve seedare un valore placeholder); `eq/neq` fanno fallback a confronto stringa, `lt/lte/gt/gte` forzano `Number(...)` (da cui l'importanza del tipo Literal numerico); path vuoto/malformato è uno stato transitorio invalido atteso (si affida a `validateIR`, non serve una validazione parallela).
- `ConditionalEditor<T>` generico (toggle Fixed/Conditional, render-prop `renderValue` per il widget del valore, checkbox opzionale per il ramo else) + `PredicateBuilder` ricorsivo (Select piatto a 13 opzioni sul kind, `ListEditor<Predicate>` riusato per i figli di and/or, `OperandEditor` interno per i lati path-o-literal dei confronti). Factory `forPredicateKind` mirror di `FieldSegmentEditor`'s `forKind`.
- **Decisione architetturale presa in autonomia (flaggata a Alfonso, non ancora esplicitamente confermata)**: `ConditionalEditor`/`PredicateBuilder` vivono in `components/ui/` ma fanno `import type` di `Predicate`/`Literal`/`Conditional<T>` da `irTypes.ts`, invece di ridefinire tipi piatti locali come fa `PathBuilder` con `PathBuilderFeatures`. Motivazione: sono tipi-dato puri erasi a compile time; ridefinire a mano un union discriminato a 7 varianti rischia drift quando lo schema evolve (es. arrivo di `rules`). Reversibile, isolata a 2 file se Alfonso preferisce il pattern flat-types per coerenza con `PathBuilder`.
- **Split in due prompt** (mirror del pattern Fase A/Fase B già usato per lo slice-1): **B2b-i** = layer abilitante puro (`ConditionalEditor`, `PredicateBuilder`, `OperandEditor`, `predicateDefaults.ts` + test unitari), gate non-visivo, zero wiring nel pannello. **B2b-ii** = cablaggio nei 6 siti + tab Advanced attiva + HARD STOP visivo, prompt generato solo dopo che B2b-i è verde.

## Documenti generati

- `claude/2026-07-22_prompt_faseB2a_commit_finale_e_recuperi.md` — chiusura B2a (commit + fix ordine log + discovery report mount-chain retroattivo).
- `claude/2026-07-22_prompt_faseB2b-i_conditional_predicate_enabling_layer.md` — layer abilitante B2b-i, come da architettura sopra.

## Prossimi passi

1. Alfonso fa eseguire il prompt di chiusura B2a a Code.
2. In parallelo o subito dopo: fix guard `computeIRSignature` (prompt già pronto, non ancora eseguito).
3. Eseguire B2b-i, verificare i gate (typecheck/vitest/build), confermare la scoperta del vocabolario tipi attributo nel discovery report.
4. Solo dopo B2b-i verde: generare il prompt B2b-ii (wiring nei 6 siti + verifica visiva), usando come fixture i due badge Conditional già pronti nel testbed "IR Test Bed" (`isInitial`/`isFinal`).
5. Alfonso può respingere/correggere la decisione sul `import type` prima che B2b-ii venga generato, se preferisce tipi piatti locali.
