# Discovery — JjTL helper body across lines

**Data**: 2026-09-06
**Prompt**: `docs/prompts/claude_2026-09-06_1500_prompt_jjtl_helper_body_newlines.md`
**Tipo**: corsia breve, discovery sintetica prima del fix
**Base**: branch `alfonso-frontend-jjtl`, sopra il fix del 2026-09-04 (`a4355b365`, nested object creation)

## Ipotesi da falsificare

Il testo dell'helper è corretto e l'errore "Expected expression" sulla `{` viene dal parser interno di espressioni, usato perché l'app non passa il sorgente a `JjtlParser`.

## Obiettivo

Individuare quale strada del parser esegue l'app, riprodurre l'errore sul parser reale, e scegliere il fix con il rischio minore.

## File letti

- `frontend/src/jjtl/parser/parser.ts` (`helper()` 570-605, `parseJjELExpression()` 625-700, `expression()`/`ifThenElse()` 771-795, `skipNewlines()` 1405, `parse()` export 1472)
- `frontend/src/jjtl/editor/JjtlEditor.tsx` (50-80, `parseContent`)
- `frontend/src/jjtl/hooks/useJjtlParser.ts` (40-70, `parseSource`)
- `frontend/src/jjtl/executor/astBridge.ts` (25, 168-175: gestione di `JjelExpression`)
- `frontend/src/jjtl/SPEC.md` (§3.4 helper, §13.2 esempio `mapType`)
- `frontend/src/jjel/SPEC.md` (§5.5 `if/then/else`, grammatica 141)

## Findings

### F1. L'app usa sempre il parser interno di espressioni

`parser.ts:1472`:

```ts
export function parse(tokens: Token[], source?: string): ParserResult {
    const parser = new JjtlParser(tokens, source);
```

`JjtlEditor.tsx:57` e `useJjtlParser.ts:61`: `const parserResult = parse(lexerResult.tokens);`, senza sorgente. In tutti i rami condizionati da `this.source !== undefined` (guardie `where`, `:=`, `let`, helper) l'app prende quindi il ramo `this.expression()`. La delega a JjEL (`parseJjELExpression`, introdotta l'11 marzo con "JjTL Step 2") è esercitata solo dai test che costruiscono `new JjtlParser(tokens, src)`.

### F2. `helper()` non salta i NEWLINE

`parser.ts:588-593`:

```ts
const body = this.source !== undefined
    ? this.parseJjELExpression([TokenType.RBRACE])
    : this.expression();

this.consume(TokenType.RBRACE, "Expected '}'");
```

Dopo la `{` il token corrente è `NEWLINE`; `expression()` → `ifThenElse()` → ... → `primary()` fallisce con "Expected expression", riportato sulla posizione della `{` (colonna 43 nel caso segnalato). È lo stesso errore per `formatLabel` della SPEC §3.4 (`prefix + '_' + name.snakeCase()` su riga separata): nessun helper multiriga ha mai parsato nell'app.

### F3. `ifThenElse()` non tollera un NEWLINE prima di `else`

`parser.ts:778-780`: `if (this.match(TokenType.ELSE))`. Con `else` su una riga nuova il `NEWLINE` interrompe il condizionale; il chiamante (`helper()`) trova `NEWLINE` invece di `}` e fallisce con "Expected '}'". Misurato con la graffa aperta sulla stessa riga dell'`if`: errore a 5:63.

### F4. Misura sul parser reale (prima del fix)

Script vitest temporaneo, quattro casi, senza sorgente: `inlineAll` (tutto su una riga) 0 errori; `inlineOpenMultiBody` "5:63 Expected '}'"; `simpleMultiline` (SPEC §3.4) "5:32 Expected expression"; `specExample` (SPEC §13.2) "5:44 Expected expression". Con sorgente, il caso segnalato: 0 errori, AST `IfThenElse` annidato.

### F5. Perché non passare il sorgente

`astBridge.ts:168` gestisce il wrapper `JjelExpression`, quindi l'executor reggerebbe il cambio. Ma il cambio dei due call site sposta sul parser JjEL tutte le espressioni `:=`, le guardie `where` e i `let` dell'app, con differenze di grammatica reali (JjEL ha `implies`, `with...do`, precedenze proprie, e `parseJjELExpression` ricostruisce il testo dai token con regole proprie di boundary). È il fix corretto in prospettiva, ma va valutato con una discovery a due fasi e una prova sui progetti esistenti. Fuori scope; decisione aperta.

## Fix applicato

- `helper()`: `skipNewlines()` dopo `consume(LBRACE)` e dopo il corpo, prima di `consume(RBRACE)`.
- `ifThenElse()`: `if (this.isElseAfterNewlines()) this.skipNewlines();` prima di `match(ELSE)`.
- `isElseAfterNewlines()`: lookahead sui token, senza consumare. Un `NEWLINE` non seguito da `else` continua a terminare l'espressione `:=` (test dedicato).

## Test

`frontend/src/jjtl/__tests__/helper-multiline.test.ts`, 9 test: tre forme documentate su entrambe le strade (`describe.each`), più tre sul parser interno (forma dell'AST, `NEWLINE` che termina un `:=` senza `else`, `:=` con `else` a capo).

Dopo il fix: `npx vitest run src/jjtl` 14 file, i soliti 7 rossi in import (`window is not defined`, pre-esistenti), 116 verdi / 0 falliti (107 + 9). `tsc --noEmit` e `npm run build`: vedi entry di log.

## Rischi

- `isElseAfterNewlines()` allarga l'insieme dei programmi accettati solo quando un `else` segue dei newline: in un mapping body una riga che inizia con `else` non era mai valida prima, quindi nessun input accettato cambia significato.
- `skipNewlines()` in coda a `helper()` con la delega JjEL: `parseJjELExpression` si ferma sul `}` di profondità zero, i newline sono già stati consumati; la chiamata è un no-op.
- Progetti con helper su una riga restano validi (test `inlineAll` implicito nel caso "with source" e nel test 2 di ieri).

## Domande aperte

1. F5: passare `source` nei due call site (delega JjEL su tutta l'app), con discovery in due fasi.
2. `if cond` a capo `then`: non documentato, non gestito.
3. Debug residuo in `attributeMapping()` (`console.warn` sul LEGACY PATH, righe 337-338): stampa in console a ogni parse legacy; fuori scope, da rimuovere in un giro di cleanup.
