# Prompt Claude Code: JjTL parser, nested object creation across lines

**Data**: 2026-09-04 18:50
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`, HEAD `5afc3ce4d`
**Modello / effort**: high
**Tipo**: fix, corsia breve (root cause già isolata). Una fase sola, con discovery report
sintetico obbligatorio prima della modifica.
**Critical zone**: no. Nessun file fuori da `frontend/src/jjtl/`.

Leggi `CLAUDE.md`, `frontend/src/jjtl/CLAUDE.md` e `docs/claude-code-log.md` prima di iniziare.

## 1. COSA

La creazione di oggetti annidata di JjTL funziona solo se `-> attr {` e `-> Class {` stanno
sulla stessa riga. La forma documentata in `SPEC.md` (§3.3, "Object creation") e in
`jjodel-docs/src/content/docs/languages/jjtl.md` è multiriga e oggi produce un AST sbagliato,
senza errori di parsing né di validazione: l'errore emerge solo a runtime, come warning
dell'executor, e gli oggetti annidati non vengono creati.

Caso riproducibile (progetto **SM2PN (docs)** su beta.jjodel.io, trasformazione
`StateMachine_to_PetriNet`):

```jjtl
Transition -> Transition {
    name := label

    -> inputArcs {
        -> Arc {
            source := source
            weight := 1
        }
    }
}
```

Esito attuale: `ObjectCreationAST.targetClass = "inputArcs"`, la Validate riporta 0 errori,
l'executor logga `Target class 'inputArcs' not found in target metamodel (object creation in
Transition). Mapping skipped.` Con `-> inputArcs { -> Arc {` sulla stessa riga tutto funziona
(7 mapping, 3 binding per Transition, archi creati con riferimenti risolti).

## 2. ROOT CAUSE (verificata sul codice, da confermare in discovery)

`frontend/src/jjtl/lexer/lexer.ts:162` emette token `NEWLINE`. In
`frontend/src/jjtl/parser/parser.ts`, `attributeMapping()` (riga ~249):

```ts
if (this.match(TokenType.LBRACE)) {
    if (this.check(TokenType.ARROW)) {
        objectCreation = this.objectCreation(targetAttribute);
    } else {
        // It's a nested mapping body
        const body = this.mappingBody();
        ...
        objectCreation = { type: 'ObjectCreation', targetClass: targetAttribute, ... };
    }
}
```

Dopo `{` non c'è `skipNewlines()`, quindi `check(ARROW)` vede il `NEWLINE` e cade nel ramo
"nested mapping body", che usa il nome dell'attributo come classe target. Il ramo alternativo
poi consuma `-> Arc { ... }` come attributeMapping interno, e il tutto passa senza errori.

Secondo punto, stesso metodo `objectCreation()` (riga ~429): dopo `this.mappingBody()` ci sono
due `consume(RBRACE)` consecutivi; con la forma multiriga fra la graffa interna e quella esterna
c'è un `NEWLINE`, quindi anche sistemato il primo punto il secondo `consume` fallirebbe. Serve
`skipNewlines()` fra i due.

## 3. DOVE

- `frontend/src/jjtl/parser/parser.ts`: `attributeMapping()` e `objectCreation()`. Solo questi
  due metodi.
- `frontend/src/jjtl/__tests__/parser-fixes.test.ts`: nuovi test (vedi §4). Se il file ha una
  struttura per cui i test di parsing del nested object creation stanno meglio in un file nuovo
  `nested-object-creation.test.ts`, va bene; dirlo nel report.
- `docs/claude-code-log.md`: entry a fine task.
- `docs/discovery/discovery_2026-09-04_jjtl_nested_object_creation.md`: report di discovery.

Non toccare lexer, executor, analyzer, SPEC, né l'editor Monaco.

## 4. COME

**Discovery (breve, read-only, report obbligatorio).** Confermare la root cause leggendo
`attributeMapping()`, `objectCreation()`, `mappingBody()` (in particolare come gestisce i
`NEWLINE`, riga ~372) e `skipNewlines()`. Rispondere nel report a tre domande:

1. Quale componente esegue la "Validate" del transformation editor (0 errori nel caso sopra) e
   perché non segnala una `targetClass` assente dal metamodello target. Solo diagnosi: la
   validazione semantica NON è in scope di questo fix, ma va annotata come todo se manca.
2. Se il ramo "nested mapping body" (`targetClass: targetAttribute`) ha un uso legittimo nella
   grammatica corrente o è codice raggiunto solo per questo bug. Cercare in `SPEC.md` e nei test
   esistenti un esempio di `-> attr { campo := ... }` senza `-> Class`.
3. Se `forAllMapping()` (riga ~483, "objectCreationDirect") ha lo stesso problema con i NEWLINE.

Il report va in `docs/discovery/discovery_2026-09-04_jjtl_nested_object_creation.md` con:
obiettivo, file letti (path completi), findings, rischi, domande aperte. Nessun hard stop dopo
il report: se la root cause è confermata, procedere alla modifica.

**Fix.** Modifica minima:

- In `attributeMapping()`, dopo `this.match(TokenType.LBRACE)` chiamare `this.skipNewlines()`
  prima di `this.check(TokenType.ARROW)`.
- In `objectCreation()`, chiamare `this.skipNewlines()` fra i due `consume(TokenType.RBRACE)`.
  Verificare che `mappingBody()` esca lasciando il cursore sulla `}` interna (dovrebbe già
  gestire i NEWLINE al suo interno); se non è così, `skipNewlines()` anche prima del primo
  `consume`.
- Se la discovery mostra che `forAllMapping()` ha lo stesso difetto, applicare la stessa
  correzione lì e dirlo nel log. Altrimenti non toccarlo.

Niente refactoring, niente rinomine, niente rimozione del ramo "nested mapping body" anche se
risultasse morto: si annota nel report e si decide in chat.

**Test.** Aggiungere test di parsing che coprano:

1. Forma su una riga: `-> inputArcs { -> Arc { source := source } }` produce
   `AttributeMapping.targetAttribute = "inputArcs"` e `objectCreation.targetClass = "Arc"`.
2. Forma multiriga (esattamente quella in §1, con righe vuote e indentazione): stesso AST della
   forma su una riga.
3. Forma multiriga con due creazioni consecutive nello stesso mapping (`inputArcs` e
   `outputArcs`): entrambe con `targetClass = "Arc"`.
4. Il body interno con più attributi su righe diverse (`source := source` e `weight := 1`)
   produce due `AttributeMapping`.

Far girare la suite `jjtl` per intero (`npx vitest run src/jjtl`, o il comando che il repo
usa) e `npm run build`. Nessun test esistente deve cambiare esito.

**Verifica manuale (Alfonso).** Su beta o localhost, progetto SM2PN (docs): incollare la forma
multiriga di §1, Validate, Execute; attesi 7 mapping, 0 warning nel Trace, archi presenti nel
modello generato.

## 5. RIFERIMENTI

- `frontend/src/jjtl/SPEC.md` §3.3, tabella "Object creation": `-> arcs { -> Arc { ... } }`.
- `frontend/src/jjtl/executor/executor.ts:566`: il warning che oggi maschera il bug.
- `frontend/src/jjtl/__tests__/parser-fixes.test.ts`: convenzioni dei test di parsing esistenti.
- jjodel-docs `src/content/docs/languages/jjtl.md`: esempi multiriga da mantenere validi.

## 6. Commit e log

Un solo commit, scope stretto: `git add` dei file elencati in §3, mai `git add .`.
Messaggio: `fix(jjtl): accept newlines inside nested object creation`.
Entry in `docs/claude-code-log.md` con data, tipo fix, file toccati, esito, e il nome di questo
documento: `claude_2026-09-04_1850_prompt_jjtl_nested_object_creation_newlines.md`.
