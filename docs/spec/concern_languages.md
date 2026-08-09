# Concern: `languages`

**Ultimo aggiornamento**: 2026-05-04
**Fonte primaria**: `jjodel_book_v1.0.pdf` (79 pp, May 2026)
**Owner editoriale**: Alfonso (decisioni di design), Claude (scrittura/audit)

---

## Scope

Riguarda i cinque linguaggi della famiglia Jj, la loro sintassi, semantica, le decisioni di design e lo stato di implementazione. La famiglia, secondo la topologia mappata il 2026-05-03, è:

```
JjOM (foundation, fuori scope)
  ↑
JjEL (sync, pure)        JjModal (async, effectful)
  ↑                          ↑
JjTL (declarative)       JjScript (imperative)
  └──── JjLet (let-binding glue) ────┘
```

**Fuori scope**: il JjOM (concern proprio), gli editor che ospitano questi linguaggi (Transformation Editor, Code mode della Console; concern `language-editors`), la console come prodotto (`jodie-console`), l'integrazione AI che genera codice in questi linguaggi (`ai-integration`), la documentazione utente pubblica (`documentation-site`).

---

## Current state

**JjEL** (Jjodel Expression Language). Linguaggio sincrono, puro, set-theoretic. È il più maturo dei cinque. Implementato end-to-end (lexer, parser recursive descent, evaluator, autocomplete con tre provider, metadata di built-in, levenshtein typo suggestions). Aggiunte recenti consolidate (post 16 aprile, ora nel book):

- 7 property strutturali sulle classi a Level 1 (`isAbstract`, `isInterface`, `isFinal`, `isSingleton`, `isRootable`, `isPartial`, `allowCrossExtend`).
- Meta-properties `instanceOf` (canonical camelCase) con alias retrocompat `instanceof`, e `className` (M2→M3, ritorna stringa).
- Calling convention duale per zero-arg builtin: `coll.size` ≡ `coll.size()`. Forma senza paren idiomatica.
- API duale `jjelEval` (silenziosa) e `jjelEvalWithDiagnostics` (warning su undefined, OCL-isms, suggerimenti Levenshtein adattivi).
- Pedagogical errors per OCL-isms (`->`, `Set{}`, `oclIsTypeOf`/`oclIsKindOf`/`oclAsType`/`oclIsUndefined`).
- `self` alias di `data` in Code mode, simmetrico (entrambi assenti senza selezione, entrambi presenti con).

**JjModal**. Linguaggio primitivo asincrono per interazione utente (modal: input/confirm/select). Capitolo proprio nel book (Ch 4). Implementato. Embedded in JjTL e JjScript, non in JjEL standalone.

**JjTL** (Jjodel Transformation Language). Host declarativo. `:=` come sintassi primaria di binding (`->` come arrow syntax alternativa); guardie con `where` (mai `when`); multiplicity `[int..int|*]` esplicita; helper con signature `helper name(p: T) -> R { body }`. Two-pass execution model **confermato** (Pass 1 match/create/trace, Pass 2 bind con `resolve()`); `resolve()` implementato come `FunctionCallExpr` JjEL. Trasformazioni eseguibili end-to-end, con tracing.

**JjScript**. Host imperativo per manipolazione M1 dalla chat. Grammar canonica `create instance of <Class> "<name>"` (con `of` obbligatoria, fix 2026-05-01). 19 comandi documentati nel book Ch 6. Embedda JjEL e JjModal.

**JjLet**. Linguaggio di let-binding condiviso fra i due host async (JjTL e JjScript). Full presentation in book §5.x, cross-reference in §6.x. **Non** vive in JjEL standalone (JjEL è sync).

**Maturity ranking** (decrescente): JjEL > JjTL > JjScript > JjModal > JjLet.

---

## Active decisions

### Identità di JjEL

- **Non OCL-compatible**: né per sintassi (`.` non `->`), né per costrutti (no `Set{}`/`Sequence{}`/`Bag{}`, no `oclIsTypeOf`), né per filosofia (`forall` come comprehension set-theoretic, non come quantificatore booleano). Decisione esplicita post discussione di design.
- **Three-level abstraction sopra JjOM**: Level 1 collezioni built-in (`classes`, `attributes`, `references`, `packages`, `enumerations`, `instances`) e nomi di classe; Level 2 context vars (`data`, `node`, `self`); Level 3 raw API con prefisso `$`. Feature utente ha priorità su proprietà JjOM built-in (es. una feature `parent` definita dall'utente nasconde l'eContainer).
- **Estendere JjEL, non aprire JS**. Ogni espressione JS è asset perso (non si traduce, non si rilegge); ogni espressione JjEL si capitalizza nel codebase utenti. Il flavor JS in Code mode resta visibile ma indefinitamente disabilitato.
- **Sintassi delle comprehension**: lambda con `=>` (decisione 22 marzo, LL(1) parseability); `forall x in S [such that P] [: expr]` in 4 forme; `exists x in S such that P` o `exists x in S | P`; built-in collection methods con lambda `coll.method(x => expr)`. Niente `let` in JjEL standalone.

### JjTL

- `:=` sintassi primaria di binding; `->` accettata come alternativa, non promossa.
- `where` per guardie, non `when`.
- Two-pass execution: Pass 1 crea istanze e popola trace; Pass 2 valuta bindings con `resolve()` per cross-type. `resolve()` è sintatticamente un `FunctionCallExpr` JjEL.
- Multiplicity stretta `[int..(int|*)]`, niente `[*]` permissivo nella UI grammar (parser ancora tollerante per retrocompatibilità).
- Single-source mapping: `SourceClass -> TargetClass` (parser più permissivo, UI documenta single-source).
- Helper body delimitato da `{ }`, return type separato da `->`. Forma canonica: `helper f(s: T) -> R { body }`.
- Generatore mapping→JjTL non emette `resolve(...)` esplicito: la cross-type resolution è sempre delegata all'executor.

### JjScript

- `create instance of <Class>` con `of` obbligatoria (decisione 2026-05-01, opzione A: parser stretto, no doppia forma). Allineato a Jjodie generation.
- 19 comandi (book Ch 6, App D).

### JjLet, JjModal, embedding

- JjLet vive in entrambi i due host async (JjTL e JjScript). Non in JjEL standalone.
- JjModal embedded in JjTL e JjScript. Non in JjEL standalone (JjEL è sync).
- Pattern di documentazione embedding consolidato: "Where X appears / The async hop / Hazards".

### Roadmap data-driven

- Stage 8 di JjEL: closure transitiva, opzione γ (primitiva `closure(fn)` + zucchero `descendants`/`ancestors`). Fissata, non implementata.
- Pedagogical errors strategy: il linguaggio resta strict, l'error reporting educa.

---

## Known gaps

### Bug confermati (test JjEL v1, da fixare con prompt mirati)

- `self.className` ritorna valore inatteso (D8).
- `self.ownedTransitions` su selezione classe ritorna null (G4).
- String `concat` non implementata (R7); da chiarire se aggiungerla o rimuoverla dalla batteria.
- Number method dual form rotta sui number (`3.5.floor` ritorna null, `3.5.floor()` ok). Inconsistenza con la decisione "calling convention duale".
- `parent` come eContainer: implementazione "in progress" su approccio B (stored `_containerId`); M1 ritorna `ownedTransition` invece di `Transition`.
- `State.instances` ritorna array vuoto (Fase 3 JjEL eval context, prompt esistente).
- `classes.name` ritorna null invece di error su collection property access (D4).

### Limiti dichiarati

- Test battery v1 era basata su sintassi OCL (errore della batteria, non del linguaggio); v2 da scrivere con sintassi corretta.
- JjScript `executeLet` non dispatcha sub-comandi (workaround nel system prompt M1: forma `create instance ...; set ...` invece di `let alice = create instance ...`).
- Bug latente parser JjEL: `parse()` non valida EOF, accetta token spuri.
- `wrapSelectedElement` triggera ECore serialization loop su modelli M1 con cicli leciti (rumore in DevTools, valore ritornato comunque corretto). MEDIUM priority.
- Levenshtein duplicato in 6 posti del codebase, candidato a consolidamento.

### Pianificato, non implementato

- **JjEL Stage 8**: closure transitiva, primitiva `closure(fn)` + zucchero `descendants`/`ancestors`.
- **JjEL Stage 9**: derived properties / runtime state per casi che la closure non copre (es. stati attivi in activity diagram).
- **JjTL → ATL/ETL**: traduzione da JjTL come intermediate representation. Strategica.
- **Static type checking** JjEL/JjTL: assente.
- **Helper system di JjTL**: espansione (parametri, tipo di ritorno enforced).

### Decisioni in tensione (da rivedere)

- **`allowCrossExtend` (UI/JjEL) vs `allowCrossReference` (D-layer)**: mapping inline con commento. Debito tecnico tracciato.
- **Spec review per OCL-isms residui** negli esempi del book/docs (cercare `->`, `oclIsTypeOf`, ecc. in posizioni che non siano confronto).

---

## Cross-references

### Documentazione canonica

| Risorsa | Dove |
|---|---|
| Reference completa, semantica, design rationale | `jjodel_book_v1.0.pdf` |
| Foundations (JjOM + Language Stack) | Book Ch 1-2 |
| JjEL | Book Ch 3 (semantica), App A (grammar EBNF), App B (built-ins) |
| JjModal | Book Ch 4 |
| JjTL | Book Ch 5, App C (tokens) |
| JjScript | Book Ch 6, App D (grammar EBNF) |
| Comparative analysis (ATL/ETL/JjTL) | Book Ch 7 |
| Open issues, future work | Book Ch 8 |
| Glossario | Book back matter |
| User-facing docs | `docs.jjodel.io/languages/{overview,jjel,jjtl,jjscript}` |

### Codebase (frontend)

| Sotto-sistema | Path |
|---|---|
| JjEL | `frontend/src/jjel/{lexer,parser,evaluator,autocomplete,metadata,util}/` |
| JjEL diagnostic API | `frontend/src/jjel/evaluator/evaluator.ts` (`jjelEval`, `jjelEvalWithDiagnostics`) |
| JjEL context builder | `frontend/src/components/Jodie/jodieJjelContext.ts` (Jodie wrapper) e `frontend/src/jjscript/executor/commands/eval.ts:175-191` (core) |
| JjScript | `frontend/src/jjscript/{lexer,parser,executor,autocomplete}/` |
| JjTL parser ed executor | `frontend/src/jjtl/` |
| JjTL mapping generator | `frontend/src/jjtl/views/SuggestedMappingsPanel.tsx` (`formatAttrMapping`) |
| Built-in metadata JjEL | `frontend/src/jjel/metadata/builtins.ts` (138 entries + 7 structural + 2 meta) |
| L-layer / DObject | `frontend/src/model/logicWrapper/LModelElement.tsx` |

### Concerns correlati

- **`jjom-architecture`**: il foundation D-layer + L-layer su cui i linguaggi navigano (Level 1-3).
- **`language-editors`**: Transformation Editor, Code mode di Jodie, autocomplete UI, in-app help futuro.
- **`jodie-console`**: l'host che esegue JjEL/JS in Code mode e dispatcha JjScript.
- **`ai-integration`**: i system prompt che istruiscono Jjodie a generare JjTL/JjScript validi.
- **`documentation-site`**: la versione user-facing dei reference (sidebar Languages).

### Provenance delle decisioni recenti

| Decisione | Sessione |
|---|---|
| Stratificazione 3 livelli, `:=` primario, `where` non `when` | `sessione_2026-04-16` (consolidamento) |
| Cross-type resolution, two-pass JjTL, `parent` approccio B | `sessione_2026-04-17` |
| Sintattica generator mapping→JjTL (resolve, helper body, return type) | `sessione_2026-04-22` |
| Grammar UI Transformation Editor allineata canonica | `sessione_2026-04-24` |
| Console unificata Chat/Code, JjEL polish (stadi 1-6.10), forma duale, OCL-isms | `sessione_2026-04-27` |
| Grammar `of` obbligatoria, sync gap classic↔flow | `sessione_2026-05-01` |
| Two-pass JjTL formalizzato nel paper, book v1.0 | `sessione_2026-05-03` |

### Test e batterie

- `jjel_jjom_test_battery.md` (v1, 187 test in 26 sezioni A-Z, eseguita parzialmente, sintassi OCL da correggere). v2 da scrivere.
- Esempio canonico end-to-end: trasformazione State Machine → Petri Net (`sessione_2026-04-17`).

---

## Note sul template

Validazione del template su `languages`: le 5 sezioni reggono. Una nota:

- **Active decisions vs Known gaps**: la riga di confine è "il codice/docs già rispetta questa scelta?". Se sì, va in Active. Se è scelta presa ma non ancora implementata (es. Stage 8), va in Known gaps come "pianificato, non implementato". Questo evita che Active decisions diventi un wishlist.
- **Cross-references**: la struttura tabellare a 4 blocchi (doc canonica, codebase, concerns correlati, provenance sessioni) è riusabile per gli altri concerns. Per concerns con meno provenienza (es. `marketing-site`), i blocchi vuoti si omettono.
- **Maturity ranking**: utile in Current state per concerns con sotto-componenti multipli. Non sempre applicabile.
