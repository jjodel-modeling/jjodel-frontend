# Discovery — i nomi di tipo qualificati nel parser (`create ... type`, `returns`)

Data: 2026-09-14
Prompt: `docs/prompts/claude_2026-09-14_1731_prompt_lane_g_parser_qualified_type.md`
Ramo: `validation-skeleton`, HEAD `d79f994c9`
Fase: 1 (sola lettura; nessun sorgente modificato)

## 1. Obiettivo

La corsia C (`3e3ab691a`) ha portato la risoluzione dei tipi su `resolveTypeTarget`, che
accetta un `Metamodel::Nome` qualificato. Il percorso qualificato pero' e' raggiungibile
end-to-end solo da `set`: nella famiglia `create` il parser muore prima. Stabilire cosa
ritorna davvero `expectIdentifierOrQualified`, cosa accetta `parseTypeReference`, se
`qualifiedNameToString` produce esattamente la stringa che quest'ultima si aspetta, e se
il fix sta tutto dentro `parser.ts`.

## 2. File letti (percorsi completi)

- `frontend/src/jjscript/parser/parser.ts` (imports 1-30; `parseCreateCommand` 261-295;
  `parseCreateOptions` 340-410; `expectIdentifierOrQualified` 1257-1268)
- `frontend/src/jjscript/parser/grammar.ts` (`parseQualifiedName` 28-57,
  `qualifiedNameToString` 62-68, `parseTypeReference` 203-244)
- `frontend/src/jjscript/__tests__/parser.test.ts` (110-175, il blocco sui tipi)
- `frontend/src/jjscript/__tests__/grammar.test.ts` (197-262, `parseTypeReference`)
- `frontend/src/jjscript/index.ts` (ri-export di `parseTypeReference`)

Probe eseguita e rimossa (`__tests__/zz_probeG.test.ts`, non committata): tutti i numeri
di §3 e §4 vengono da quella esecuzione, non da lettura.

## 3. Il difetto, misurato

`parser.ts:352` e `:404`:

```ts
options.type       = parseTypeReference(this.expectIdentifierOrQualified('type name') as string);
options.returnType = parseTypeReference(this.expectIdentifierOrQualified('return type') as string);
```

`expectIdentifierOrQualified` (parser.ts:1257-1268) ha tipo di ritorno
`string | QualifiedName`, e ritorna **l'oggetto** quando il token e' `QUALIFIED_NAME`:

```ts
if (token.type === 'QUALIFIED_NAME') { this.advance(); return parseQualifiedName(token.value); }
if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') { this.advance(); return token.value; }
```

Il lexer emette proprio quel token: misurato,
`create attribute age in Person type MM::Mood` tokenizza come
`… KEYWORD:type, QUALIFIED_NAME:MM::Mood, EOF`.

`parseTypeReference(raw: string)` (grammar.ts:203) apre con `if (!raw || raw.trim() === '')`.
Un oggetto non ha `.trim`: `TypeError`, che il parser converte in errore di parse. Il
`as string` e' un cast che copre esattamente il caso che rompe — non c'e' errore di
compilazione perche' il cast lo silenzia.

### 3.1 Cosa parsa e cosa no, oggi

| riga | esito |
|---|---|
| `create attribute age in Person type MM::Mood` | **errore**: `raw.trim is not a function` |
| `create operation op in Person returns MM::Result` | **errore**, stesso messaggio |
| `create parameter p in Shape::draw type MM::Person` | **errore**, stesso messaggio |
| `create reference r in A type MM::Person` | **errore**, stesso messaggio |
| `create attribute a in Person type Shape.draw` | **errore**, stesso messaggio (il token dotted e' anch'esso `QUALIFIED_NAME`) |
| `create attribute age in Person type Mood` | ok — `{kind:'class', name:{segments:['Mood'], raw:'Mood'}}` |
| `create attribute age in Person type int` | ok — `{kind:'primitive', type:'Integer'}` |
| `create operation op in Person returns Result` | ok — `{kind:'class', …}` |
| `create operation op in Person returns int` | ok — `{kind:'primitive', type:'Integer'}` |

Quindi: **ogni** clausola di tipo della famiglia `create` rifiuta la forma qualificata, e
nessuna forma non qualificata e' coinvolta.

## 4. Il round-trip e' esatto — quindi la forma piccola basta

`qualifiedNameToString` (grammar.ts:62-68) fa `segments.join('::')` piu' `'.' + member`.
`parseQualifiedName` (grammar.ts:28-57) fa l'inverso: stacca un eventuale `.member`
finale se e' un identificatore valido senza `::`, poi splitta su `::` scartando i segmenti
vuoti.

Misurato su tutte le forme che il lexer puo' produrre per una clausola di tipo:

| input | `qualifiedNameToString(parseQualifiedName(x))` | |
|---|---|---|
| `MM::Mood` | `MM::Mood` | OK |
| `Mood` | `Mood` | OK |
| `A::B::C` | `A::B::C` | OK |
| `MM::Mood.foo` | `MM::Mood.foo` | OK |
| `Shape.draw` | `Shape.draw` | OK |
| `domain::Person` | `domain::Person` | OK |

Nessuna perdita. E il valore che `parseTypeReference` costruirebbe dalla stringa e'
**identico** all'oggetto che `expectIdentifierOrQualified` aveva gia' in mano:

```
parseTypeReference('MM::Mood')
  -> { kind: 'class', name: { segments: ['MM','Mood'], raw: 'MM::Mood' } }
```

Serializzare e ri-parsare e' quindi un giro a vuoto **esatto**, non una conversione con
approssimazione. La seconda forma prevista dal prompt (allargare la firma di
`parseTypeReference` a `QualifiedName | string`) non serve: non c'e' informazione da
salvare.

## 5. Nessun chiamante dipende dal comportamento attuale

`parseTypeReference` (`command grep -rn parseTypeReference frontend/src`, 23 righe):

- `parser.ts:352`, `:404` — i due siti da correggere.
- `grammar.ts:214` — la ricorsione sul tipo elemento di una collezione; riceve
  `collectionMatch[2]`, una stringa dalla regex. Non toccata.
- `__tests__/grammar.test.ts` — 11 chiamate, tutte con stringhe letterali. Fra queste
  **`parseTypeReference('domain::Person')` (riga 226) e' gia' verde**: il ramo stringa con
  `::` funziona ed e' gia' vincolato da un test. E' il ramo che il fix rende raggiungibile
  dal parser.
- `index.ts:26` — ri-export pubblico, firma invariata.
- `executor/commands/create.ts:43, 97` — due commenti, nessuna chiamata.

`expectIdentifierOrQualified` ha tre chiamanti: i due da correggere e `parser.ts:277`
(nome dell'elemento in `create`), che l'unione **la gestisce gia'** — righe 291-292,
`typeof name === 'string' ? … : …`. Nessun altro sito con lo stesso difetto.

`create.ts` non entra nel fix: il parser produce la stessa `TypeReference` che l'executor
gia' consuma. Il perimetro del prompt regge.

## 6. Bench

`frontend/vite.config.ts`, `environment: 'node'`. `parser/parser.ts` e `parser/grammar.ts`
sono **importabili**: la probe di §3 e §4 li ha importati ed eseguiti. Non hanno il
problema di `create.ts`/`set.ts` (monaco via il barrel `joiner`, `window is not defined`).
I test della Fase 2 sono quindi test di comportamento veri, non asserzioni sul testo.

## 7. Rilievi non richiesti

- **Le collezioni non arrivano mai al parser.** `type List<String>` parsa come
  `{kind:'class', name:{segments:['List'], raw:'List'}}`: il lexer spezza `List<String>` e
  `parseCreateOptions` consuma solo `List`. Il ramo collezione di `parseTypeReference`
  (grammar.ts:211-221) e' quindi raggiungibile solo da chiamate dirette, cioe' da
  `grammar.test.ts`. Pre-esistente, fuori perimetro, non toccato.
- **`type Shape.draw`** oggi e' lo stesso errore, e il fix lo fa parsare come
  `{segments:['Shape'], member:'draw'}`. E' l'estensione naturale della stessa correzione,
  non un caso a parte: il token e' `QUALIFIED_NAME` per la stessa ragione.

## 8. Rischi

- **R1 — nessuno sui nomi non qualificati.** Il ramo `IDENTIFIER`/`KEYWORD` di
  `expectIdentifierOrQualified` ritorna gia' una stringa, che passa a
  `parseTypeReference` invariata. Il fix aggiunge solo la conversione dell'altro ramo.
- **R2 — superficie nuova a valle.** Rendere parsabile `type MM::Mood` fa arrivare
  all'executor input che prima non ci arrivava mai. E' esattamente cio' che la corsia C ha
  preparato (`resolveTypeTarget` risolve il qualificato, test unitari verdi), ma la
  verifica end-to-end resta manuale: `create.ts` non e' importabile in bench.
- **R3 — `import` nuovo.** `qualifiedNameToString` non e' oggi importato in `parser.ts`;
  va aggiunto all'import esistente da `./grammar`. E' completamento normale del file
  modificato, non allargamento di perimetro.

## 9. Esito del gate

Il fix e' localizzato in `parser.ts` (due righe piu' un import), non tocca `create.ts`,
non cambia la firma di `parseTypeReference` e lascia il ramo stringa letteralmente
intatto. Il gate condizionale **passa**: si procede alla Fase 2 con la forma piccola,
cioe' serializzare con `qualifiedNameToString`.

---

## 10. Addendum — Fase 2 (stesso giro)

Commit `2a1619653`, 2 file. Forma adottata: la **piccola**, serializzare prima di chiamare.
La firma di `parseTypeReference` non e' toccata.

| file | cosa cambia |
|---|---|
| `parser/parser.ts` | nuovo metodo privato `expectTypeNameString(what)` (`:1258`), che chiama `expectIdentifierOrQualified` e serializza con `qualifiedNameToString` il solo ramo oggetto; i due siti `:353` (`type`) e `:405` (`returns`) lo usano al posto del cast `as string`; `qualifiedNameToString` aggiunto all'import esistente da `./grammar` |
| `__tests__/parser.test.ts` | blocco `qualified type names — type and returns`, 7 test (73 → 80) |

Il ramo `IDENTIFIER`/`KEYWORD` continua a passare la sua stringa invariata: nessuna
differenza per un nome non qualificato, ed e' quello che i tre test di controllo fissano.

### 10.1 Cosa parsa adesso

| riga | prima | dopo |
|---|---|---|
| `create attribute age in Person type MM::Mood` | errore `raw.trim is not a function` | `{kind:'class', name:{segments:['MM','Mood'], raw:'MM::Mood'}}` |
| `create operation op in Person returns MM::Result` | idem | `{segments:['MM','Result']}` |
| `create reference r in A type MM::Person` | idem | `{segments:['MM','Person']}` |
| `create parameter p in Shape::draw type MM::Person` | idem | `{segments:['MM','Person']}` |
| `create attribute x in Person type A::B::C` | idem | `{segments:['A','B','C']}` |
| `type Mood`, `type int`, `returns Result`, `returns int` | ok | **identici** (test di controllo) |

### 10.2 Gate eseguiti

- `npm run typecheck`: exit 2, **33** righe `error TS` su output completo — la baseline di
  CLAUDE.md §17. **0** in `parser/parser.ts` e **0** in `__tests__/parser.test.ts`,
  contate una per una. Controllo positivo con segnale sullo stesso output: `src/` → 69.
- `npx vitest run src/jjscript/__tests__/parser.test.ts src/jjscript/__tests__/grammar.test.ts`:
  **170 passati, 0 falliti**. `grammar.test.ts` comprende
  `parseTypeReference('domain::Person')`, il test che gia' vincolava il ramo stringa e che
  resta verde.
- `npx vitest run src/jjscript`: **333 passati** (erano 326), 9 file verdi su 10. Il decimo,
  `__tests__/context-binding.test.ts`, fallisce all'import con `window is not defined`
  (monaco via il barrel `joiner`). **Misurato pre-esistente su questo HEAD**: ripristinati
  i due file da `git show HEAD:<path>`, rieseguito, stesso `ReferenceError`; poi rimessi a
  posto da copia, `diff` a zero su entrambi, indice mai toccato (§6.4).
- `npm run build`: exit 0, solo il warning di chunk-size gia' noto.

### 10.3 Cosa resta

- La verifica end-to-end `parser → executor → modello` resta manuale: `create.ts` non e'
  importabile in bench (corsia C, referto §6). I test di questo giro si fermano all'AST.
- Le collezioni (§7) restano irraggiungibili dal parser. Non toccate.
