# Prompt — JjTL parser, helper body across lines

**Nome del documento prompt**: 2026-09-06 15:00
**Repo**: `jjodel-frontend`, branch `alfonso-frontend-jjtl`
**Modello / effort**: high
**Tipo**: fix, corsia breve (root cause già isolata e misurata). Una fase sola, discovery report sintetico obbligatorio. Critical zone: no. Nessun file fuori da `frontend/src/jjtl/`.
**Eseguito da**: Claude (sessione cloud + bridge), 2026-09-06, su decisione di Alfonso ("decidi tu come procedere con i rischi minori").

## 1. COSA

Un `helper` con il corpo su righe separate non parsa mai nell'app, nemmeno nella forma documentata in `SPEC.md` §3.4 (`formatLabel`) e §13.2 (`mapType` con catena `if / else if / else`). Monaco sottolinea la `{` di apertura con "Expected expression"; la Validate riporta lo stesso errore. Caso segnalato:

```jjtl
helper translateType(t: Type) -> SqlType {
    if t == "String" then "VARCHAR"
    else if t == "Integer" then "INTEGER"
    else "BOOLEAN"
}
```

L'unica forma che passa è tutto su una riga.

## 2. ROOT CAUSE (misurata)

`JjtlParser` ha due strade per le espressioni: con il sorgente (`new JjtlParser(tokens, source)`) delega a JjEL via `parseJjELExpression`; senza, usa il parser di espressioni interno (`this.expression()`). L'app non passa mai il sorgente: `frontend/src/jjtl/editor/JjtlEditor.tsx:57` e `frontend/src/jjtl/hooks/useJjtlParser.ts:61` chiamano `parse(lexerResult.tokens)`. Quindi ogni helper passa dal parser interno.

In `helper()` (`parser/parser.ts`, ~riga 588), dopo `consume(LBRACE)` si chiama subito `this.expression()`: il token corrente è `NEWLINE`, `primary()` fallisce con "Expected expression". Anche aprendo la graffa sulla stessa riga dell'`if`, l'a capo prima di `else` interrompe `ifThenElse()` (che fa `match(ELSE)` senza saltare i newline) e il `consume(RBRACE)` successivo fallisce con "Expected '}'".

Misura sul parser reale (clone, vitest): con sorgente il caso in §1 parsa pulito; senza sorgente fallisce, e fallisce anche `formatLabel` della SPEC.

## 3. DECISIONE

Fix stretto nel parser interno, non il cambio dei call site. Passare `source` ai due call site attiverebbe la delega JjEL per tutte le espressioni `:=` e `where` dell'app: comportamento diverso su tutto il transformation editor, da valutare con discovery in due fasi e prova sui progetti esistenti. Resta annotato come decisione aperta.

## 4. DOVE

- `frontend/src/jjtl/parser/parser.ts`: `helper()`, `ifThenElse()`, nuovo metodo privato `isElseAfterNewlines()` accanto a `skipNewlines()`.
- `frontend/src/jjtl/__tests__/helper-multiline.test.ts`: nuovo.
- `docs/discovery/discovery_2026-09-06_jjtl_helper_body_newlines.md`: report.
- `docs/claude-code-log.md`: entry.

Non toccare `JjtlEditor.tsx`, `useJjtlParser.ts`, lexer, executor, SPEC.

## 5. COME

- `helper()`: `skipNewlines()` dopo `consume(LBRACE)` e dopo il corpo, prima di `consume(RBRACE)`. Vale per entrambe le strade (con la delega JjEL i newline in coda erano già assorbiti da `parseJjELExpression`, la chiamata è innocua).
- `ifThenElse()`: prima di `match(ELSE)`, se il prossimo token non-`NEWLINE` è `ELSE`, saltare i newline. Lookahead puro (`isElseAfterNewlines()`), nessun consumo: un `NEWLINE` non seguito da `else` continua a terminare l'espressione `:=`.
- Nessun cambio a `then`: la forma `if cond` a capo `then` non è documentata.

## 6. TEST

`helper-multiline.test.ts`, per entrambe le strade (`describe.each` con e senza sorgente): helper semplice su riga separata (SPEC §3.4), catena `if / else if / else` una per riga (SPEC §13.2), helper seguito da un mapping che lo chiama. Solo parser interno: forma dell'AST (tre foglie annidate), un `NEWLINE` termina ancora un `:=` senza `else`, un `:=` con `else` a capo continua.

Gate: `npx vitest run src/jjtl` (nessun esito esistente cambia), `tsc --noEmit` (0 errori sotto `src/jjtl/`), `npm run build`.

## 7. VERIFICA MANUALE (Alfonso)

Sull'app: incollare l'helper di §1, la sottolineatura sulla `{` sparisce, Validate 0 errori; con `else` su riga separata anche dentro un `:=`. Un progetto con helper su una riga resta valido.

## 8. COMMIT

Due commit (CLAUDE.md §6.4, docs e codice separati):
`fix(jjtl): accept newlines in helper bodies and before else`
`docs(jjtl): discovery report, prompt and log entry for helper body fix`
