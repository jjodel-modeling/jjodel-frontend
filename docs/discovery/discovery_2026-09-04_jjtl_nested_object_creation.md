# Discovery — JjTL nested object creation across lines

**Data**: 2026-09-04
**Prompt**: `docs/prompts/claude_2026-09-04_1850_prompt_jjtl_nested_object_creation_newlines.md`
**Tipo**: corsia breve, discovery sintetica prima del fix (nessun hard stop richiesto dal prompt)
**Base**: branch `alfonso-frontend-jjtl`, HEAD pubblico `d32349614` (il prompt cita `5afc3ce4d`, non presente sul remote: si assume un HEAD locale non pushato con `parser.ts` invariato, da verificare al merge)

## Ipotesi da falsificare

La forma multiriga di object creation (`-> attr {` NEWLINE `-> Class {`) produce
`ObjectCreationAST.targetClass = attr` perché `attributeMapping()` non salta i
`NEWLINE` dopo la graffa aperta, e `objectCreation()` non li salta fra le due
graffe chiuse.

## Obiettivo

Confermare la root cause nel parser, rispondere alle tre domande del prompt
(chi valida, uso legittimo del ramo "nested mapping body", `forAllMapping()`),
poi applicare il fix minimo.

## File letti

- `frontend/src/jjtl/parser/parser.ts` (metodi `mappingBody()` 210-232, `attributeMapping()` 237-356, `objectCreation()` 429-447, `forAllMapping()` 483-524, `skipNewlines()` 1405)
- `frontend/src/jjtl/executor/executor.ts` (438-439, 515-595: `validateTargetClasses`)
- `frontend/src/jjtl/components/JjtlDevelopmentEnv.tsx` (245-249: `handleValidate`)
- `frontend/src/jjtl/SPEC.md` (§3.3 tabella "Object creation", esempio SM2PN righe 667-690)
- `frontend/src/jjtl/__tests__/parser-fixes.test.ts` (convenzioni dei test di parsing)
- `frontend/src/jjtl/CLAUDE.md`, `CLAUDE.md` (§6.4, §17, §21), `docs/PROTOCOL.md` (P4, P6, P9)
- `frontend/vitest.config.ts` (`environment: 'node'`)

## Findings

### F1. Root cause confermata (punto 1)

`parser.ts:255-269`, ramo `-> attr {` in `attributeMapping()`:

```ts
if (this.match(TokenType.LBRACE)) {
    // Check if it's object creation or inline body
    if (this.check(TokenType.ARROW)) {
        objectCreation = this.objectCreation(targetAttribute);
    } else {
        // It's a nested mapping body
        const body = this.mappingBody();
        this.consume(TokenType.RBRACE, "Expected '}'");
        objectCreation = { type: 'ObjectCreation', targetClass: targetAttribute, ... };
    }
}
```

Nessun `skipNewlines()` fra `match(LBRACE)` e `check(ARROW)`. Con la forma
multiriga il token corrente è `NEWLINE`, `check(ARROW)` è falso, e si entra nel
ramo "nested mapping body": `mappingBody()` salta i newline (riga 213), incontra
`-> Arc { ... }` e lo parsa come `attributeMapping` interno. Risultato: AST
sintatticamente valido con `targetClass = "inputArcs"` e un `AttributeMapping`
interno con `targetAttribute = "Arc"` e la sua `objectCreation`. Zero errori di
parsing.

### F2. Root cause confermata (punto 2)

`parser.ts:436-439`, `objectCreation()`:

```ts
const body = this.mappingBody();
this.consume(TokenType.RBRACE, "Expected '}'");
this.consume(TokenType.RBRACE, "Expected '}'");
```

`mappingBody()` chiama `skipNewlines()` dopo ogni item (riga 228) ed esce con il
cursore sulla `}` interna: il primo `consume` è corretto. Fra la `}` interna e
quella esterna, nella forma multiriga, c'è un `NEWLINE`: il secondo `consume`
fallirebbe con "Expected '}'". Serve `skipNewlines()` fra i due, non prima del
primo.

### F3. Chi esegue la "Validate" (domanda 1)

`JjtlDevelopmentEnv.tsx:245-249`:

```ts
const handleValidate = useCallback(() => {
    parse(code);
    setBottomPanelTab('problems');
    setIsBottomPanelCollapsed(false);
}, [code, parse]);
```

Validate è solo parsing: nessun controllo semantico contro il metamodello
target. La verifica delle classi target esiste, ma vive nell'executor
(`executor.ts:518 validateTargetClasses`, chiamato da `execute()` a riga 439) e
per una classe sconosciuta produce un **warning**, non un errore
(`executor.ts:565-570`), e mette il mapping in `unknownTargetClasses` così che
`executeMapping` lo salti (riga 803). Ecco perché il caso in esame passa la
Validate con 0 errori e fallisce silenziosamente a runtime.

**Todo (fuori scope)**: la Validate del transformation editor dovrebbe
eseguire anche la verifica delle classi target contro il metamodello, quando
questo è noto, e riportare la classe assente nel pannello Problems. La logica
è già scritta in `validateTargetClasses`; andrebbe estratta o resa invocabile
senza `execute()`.

### F4. Il ramo "nested mapping body" (domanda 2)

Ricerca in `SPEC.md` di `-> ident {` non seguito da `-> Class`: nessuna
occorrenza. Le forme documentate sono `Class -> Class {`, `-> attr { -> Class {`
e `forall x in coll -> Class {`. Ricerca nei test (`grep "\-> [a-z][a-zA-Z]* {"
__tests__`): nessuna occorrenza. Il ramo `targetClass: targetAttribute` non
corrisponde a nessuna sintassi documentata ed è raggiunto, allo stato attuale,
solo per il bug in F1: dopo il fix diventa raggiungibile soltanto con
`-> attr { campo := ... }` scritto esplicitamente, che non ha un significato
definito nella SPEC (crea un oggetto di classe `attr`).

Non rimosso, come richiesto dal prompt. Decisione da prendere in chat: farne
un errore di parsing esplicito ("Expected '->' Class after '-> attr {'"),
oppure documentarlo come sintassi abbreviata quando attributo e classe
coincidono.

### F5. `forAllMapping()` (domanda 3)

`parser.ts:501-507`: `-> Class {` è consumato in sequenza (`ARROW`,
`IDENTIFIER`, `LBRACE`), poi `mappingBody()`, poi un solo `consume(RBRACE)`.
`mappingBody()` esce sul `}`; non c'è una seconda graffa da chiudere: nessun
problema di `NEWLINE` a valle. Non toccato.

Nota a margine (non verificata, fuori scope): un `NEWLINE` **prima** di `->`
(`forall t in transitions` a capo `-> Place {`) dipende da come `expression()`
termina; nessuna delle forme in SPEC va a capo lì.

### F6. Stato della suite `jjtl` su HEAD (baseline)

`npx vitest run src/jjtl` su un worktree pulito a HEAD: 12 file, 7 falliti in
import con `ReferenceError: window is not defined`
(`monaco-editor/esm/vs/base/browser/window.js:14`, `environment: 'node'` in
`vitest.config.ts`), 102 test verdi / 0 falliti. Gli stessi 7 file rossi sono
già registrati come pre-esistenti nel log (entry del 2026-09-02).

## Fix applicato

- `attributeMapping()`: `this.skipNewlines()` dopo `this.match(TokenType.LBRACE)`, prima di `this.check(TokenType.ARROW)`.
- `objectCreation()`: `this.skipNewlines()` fra i due `consume(TokenType.RBRACE)`.
- `forAllMapping()`: invariato (F5).

## Test

Nuovo file `frontend/src/jjtl/__tests__/nested-object-creation.test.ts` (5 test):
forma su una riga, forma multiriga identica a quella del prompt, due creazioni
consecutive (`inputArcs`, `outputArcs`), body interno con due attributi su
righe diverse, e la negazione esplicita `targetClass !== "inputArcs"`.
File separato anziché `parser-fixes.test.ts`, che è organizzato per "Fix N"
sulla sintassi `:=` e sulle lambda.

Risultati dopo il fix: `npx vitest run src/jjtl` 13 file, gli stessi 7 rossi
pre-esistenti, 107 verdi / 0 falliti (102 + 5). `tsc --noEmit`: 14 errori, 0
sotto `src/jjtl/` (i 14 "scattered" della baseline di §17; i 19 di casing non
compaiono su filesystem case-sensitive). `npm run build`: exit 0 con il solo
avviso di chunk-size.

## Rischi

- Il cambio è locale al parser e allarga soltanto l'insieme dei programmi
  accettati: ogni input che prima passava dal ramo `check(ARROW)` continua a
  farlo; gli input che prima cadevano nel ramo "nested mapping body" per via di
  un `NEWLINE` ora vanno in `objectCreation()`, che è il comportamento
  documentato.
- Progetti salvati con la forma su una riga come workaround restano validi.

## Domande aperte

1. F4: sorte del ramo "nested mapping body" (errore esplicito o sintassi abbreviata documentata).
2. F3: portare `validateTargetClasses` dentro la Validate dell'editor.
3. Verifica manuale su beta/localhost (progetto SM2PN docs): attesi 7 mapping, 0 warning nel Trace, archi presenti.
