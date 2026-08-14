# Prompt Claude Code — J1: walker JjEL -> contratto IR, in modulo puro

**Data**: 2026-08-14 15:30
**Tipo**: feat. **Fase unica**, nessuna discovery: la discovery e' fatta e sta a
`docs/discovery/discovery_2026-08-14_jjel_come_linguaggio_espressioni_ir.md`.
**Branch**: `alfonso-frontend-jjtl`.
**Critical zone**: nessuna. Il modulo nuovo **non viene cablato** in questa slice: non entra
in nessun percorso vivo, non cambia un pixel, non cambia un byte di IR persistito.

Leggi `CLAUDE.md` prima di iniziare. Leggi le ultime entry di `docs/claude-code-log.md` e
`docs/decisions.md`. Leggi il discovery report citato sopra: le sezioni §2, §5 e §7 sono il
contesto di questa slice e non vanno ridiscusse.

## Contesto (misurato, non ridiscutere)

Il PathExpr dell'IR e' un sottoinsieme sintattico di JjEL per tutte le forme single-hop, con
AST isomorfo. `$name.value` in JjEL e' `MemberAccess(Identifier('$name'), 'value')`: il lexer
riconosce `$identificatore` come `DOLLAR_IDENT` (`jjel/lexer/lexer.ts:161-170`) e il parser
lo trasforma in un `IdentifierExpr` **il cui `name` include il dollaro**
(`jjel/parser/parser.ts:468-475`).

L'unica forma che JjEL non parsa e' il multi-hop legacy `$a.value.$b.value`, perche'
`postfix()` consuma solo `IDENTIFIER` dopo il punto (`parser.ts:341-342`). Non e' un problema
di questa slice: qui il walker deve solo **non pretendere** di gestirlo.

Le ratifiche che governano il modulo stanno nel memo `2026-08-14_memo_ratifica_jjel_linguaggio_ir.md`
(R-J2 profilo chiuso, R-J4 compatibilita' nel walker, R-J5 `getParent`, R-J6 diagnostica).

## Obiettivo

Un modulo puro che, data una stringa JjEL, produca **lo stesso contratto** che `compilePath`
produce oggi in `irCompile.ts:60-110`: un accessore compilato, l'elenco dei nomi di feature
letti, e la catena di hop per le dipendenze cross-object.

**Zero cablaggio.** `irCompile.ts` non si tocca in questa slice. Se durante il lavoro emerge
che serve toccarlo, fermati e segnala.

## COSA

### 1. Modulo nuovo

`frontend/src/components/editor-v2/viewpoint/ir/irJjelPath.ts`.

**Grep di collisione obbligatorio prima di crearlo**: sul nome del file e su ogni
identificatore esportato. Riporta l'esito nel log.

Puro per contratto, come `ir/pathExpr.ts` e `ir/edgeEndpoints.ts`: niente React, niente
Redux, niente import a runtime da `editor-v2`. Le uniche dipendenze ammesse sono il parser
JjEL (`frontend/src/jjel/parser`) e i tipi dell'IR, che si cancellano al build.

Esporta:

```typescript
export type JjelStep =
    | { kind: 'feature'; name: string; take: 'value' | 'values' | number }
    | { kind: 'parent' };

export interface CompiledJjelPath {
    fn: CompiledAccessor;              // stessa firma degli accessori di irCompile
    featureNames: string[];
    crossPaths: CompiledCrossPath[];   // vuoto per i path a un solo passo
    steps: JjelStep[];
}

export class JjelProfileError extends Error {}

export function compileJjelPath(src: string): CompiledJjelPath;
```

`CompiledAccessor` e `CompiledCrossPath` sono i tipi gia' definiti in `irTypes.ts`
(`:272-290`): **importali, non ridefinirli**. Se la loro forma non combacia con quel che serve,
fermati e segnala invece di allargarli.

### 2. Il profilo (R-J2)

Nodi AST accettati: `Identifier`, `MemberAccess`, `IndexAccess` con `index` di tipo
`Literal` e valore numerico intero.

Ogni altro tipo di nodo lancia `JjelProfileError` con un messaggio che **nomina il costrutto**
e dice che e' fuori dal profilo v1. Vale per `MethodCall`, `FunctionCall`, `ForAll`, `Exists`,
`IfThenElse`, `NullCoalesce`, `NullSafeMemberAccess`, `NullSafeMethodCall`, `Binary`, `Unary`,
`Lambda`, `WithDo`, `IsType`, `Implies`, `InterpolatedString`, `ArrayLiteral`, `ObjectLiteral`,
`Literal` in posizione di espressione.

Anche gli errori del parser JjEL (`parseExpression(src).errors`) diventano `JjelProfileError`,
con i messaggi del parser concatenati. Il chiamante ha un solo tipo di errore da intercettare.

### 3. La semantica dei passi

L'identificatore `parent` produce un passo `{kind: 'parent'}`. La regola di shadowing la
decide il `ReadCtx`, non il walker: qui `parent` e' sempre il contenitore.

Un identificatore che **inizia con `$`** e' la forma legacy: produce
`{kind:'feature', name: <senza dollaro>, take:'value'}` e, **solo su quel passo**, un
`.value` / `.values` successivo si applica come accessore invece di aprire un passo nuovo.
Su un passo non-legacy, `.value` e' una feature come le altre.

Marca il ramo legacy con un commento che dice che e' temporaneo e che muore con la migrazione
(R-J3, slice J4).

Il passo terminale deve essere una `feature`: un'espressione che finisce su `parent` lancia
`JjelProfileError`.

`IndexAccess` fissa il `take` del passo precedente al valore numerico. Un indice su un passo
`parent` lancia.

### 4. L'accessore

Identico nella struttura a quello di `compilePath`: i passi non terminali navigano a un id di
elemento, il terminale legge.

- passo `feature` non terminale: `ctx.getRef(id, name, take)`
- passo `parent` non terminale: `ctx.getParent(id)`
- terminale con `take === 'values'`: `ctx.getValues(id, name)`
- terminale con `take` numerico: `ctx.getValues(id, name)[take]`
- terminale altrimenti: `ctx.getValue(id, name)`
- un hop che ritorna `null` fa terminare l'accessore con `undefined`, senza lanciare

**`ReadCtx.getParent` non esiste ancora**: e' la slice J2. In questa slice dichiara il
requisito con un tipo locale che estende `ReadCtx` (per esempio `ReadCtxWithParent`) e usalo
nella firma dell'accessore. **Non aggiungere `getParent` a `irReadCtx.ts`**: e' fuori scope e
tocca due backend.

### 5. Le dipendenze

- `featureNames`: i nomi di ogni passo `feature`, nell'ordine, passi `parent` esclusi.
- `crossPaths`: se i passi sono due o piu', un solo `CompiledCrossPath` con `hops` uguale a
  tutti i passi tranne l'ultimo e `terminal` uguale all'ultimo. Se e' uno solo, array vuoto.

**Nota da riportare come commento nel modulo**: un `hops` che contiene un passo `parent` non
e' concretizzabile da `navigateRefHop`, che sa solo navigare reference. La concretizzazione
del ramo `parent` e' J2. Qui il dato si produce, non si consuma.

### 6. Test

`frontend/src/components/editor-v2/viewpoint/ir/__tests__/irJjelPath.test.ts`.

Copertura minima, con un `ReadCtx` finto e una fixture a quattro elementi (una Machine che
contiene due State, una Transition con `source`/`target`):

- forme idiomatiche: `name`, `source`, `states[0]`, `source.name`, `parent.name`,
  `source.parent.name`;
- forme legacy: `$name.value`, `$source.value`, `$states.values`, `$states.values[1]`, e la
  verifica esplicita che `$name.value` e `name` producano **gli stessi `steps`**;
- `featureNames` e `crossPaths` attesi su ognuna delle precedenti, `parent` escluso dai nomi;
- hop che muore: un path la cui prima reference e' vuota ritorna `undefined` e non lancia;
- profilo: `forall s in states : s.name`, `if x then 1 else 2`, `name.toUpper()`, `a ?? b`,
  `$a?.value`, `states[i]` con indice non letterale, e un'espressione che finisce su `parent`.
  Tutte lanciano `JjelProfileError` e il messaggio nomina il costrutto;
- input parziali da digitazione: `''`, `'a.'`, `'$'`. Devono lanciare `JjelProfileError`, mai
  un errore di altro tipo e mai un throw non intercettabile.

I test esistenti devono restare verdi **senza modifiche**. Se un test esistente va toccato,
fermati e segnala.

## DOVE (lista chiusa)

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/irJjelPath.ts` | nuovo |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irJjelPath.test.ts` | nuovo |
| `docs/claude-code-log.md` | entry a fine task |

Qualsiasi altro file: **STOP e segnala**. In particolare non toccare `irCompile.ts`,
`pathExpr.ts`, `irReadCtx.ts`, `irCrossDeps.ts`, `irTypes.ts`, `irValidate.ts`, i pannelli di
authoring, e nulla dentro `frontend/src/jjel/`.

## Fuori scope, esplicito

- Non cablare il modulo. Nessun chiamante nuovo.
- Non toccare JjEL, in nessun punto e per nessuna ragione. Se il parser sembra sbagliato,
  segnalalo nel log e fermati.
- Non allargare il profilo. Se una forma sembra utile e sta fuori, segnalala, non ammetterla.
- Non migrare nulla di persistito.
- Non aggiungere `getParent` a `irReadCtx.ts`.

## Gate

1. `npm run typecheck`: baseline invariata (33 dichiarata in CLAUDE.md §17), **conteggio su
   output integrale**, exit status registrato. Zero errori nei due file nuovi.
2. `npm run test` sui file di `viewpoint/`: verdi, inclusi i nuovi.
3. `npm run build`: exit 0.
4. `npm run check:agents` e `npm run check:docs` se tocchi un `CLAUDE.md` (non dovresti).
5. Grep di collisione su ogni identificatore nuovo, esito nel log.

## Verifica visiva

**Non applicabile**: il modulo non entra in nessun percorso di rendering. E' il senso della
slice.

## Riferimenti

- `docs/discovery/discovery_2026-08-14_jjel_come_linguaggio_espressioni_ir.md` (§2 la
  tabella del corpus, §5 le misure, §7 il contratto delle dipendenze)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts:60-110` (`compilePath`, il
  contratto da replicare)
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts:272-290` (`CompiledAccessor`,
  `CompiledCrossPath`)
- `frontend/src/components/editor-v2/viewpoint/ir/irReadCtx.ts:17-32` (`ReadCtx`) e
  `:70-85` (`navigateRefHop`)
- `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts` e `edgeEndpoints.ts` (il
  modello di modulo puro da seguire, commenti inclusi)
- `frontend/src/jjscript/executor/commands/eval.ts:766-784` (`resolveParentHandle`, la
  semantica di `parent` da replicare in J2)
- spike eseguibile allegato al memo: `spike_2026-08-14_jjel_walker.ts`. **Non e' codice da
  copiare**: e' la prova che il contratto regge, scritta fuori dal repo e senza i tipi veri.
