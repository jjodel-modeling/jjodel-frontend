# Discovery — Vocabolario delle stringhe `type` degli attributi (per `attributeTypeToLiteralKind`)

**Data**: 2026-07-22
**Fase**: B2b-i (layer abilitante Conditional/Predicate builder), punto 0 del prompt.
**Tipo**: read-only, propedeutica a `components/ui/PredicateBuilder/predicateDefaults.ts`.

## Obiettivo

Il comparatore Literal del `PredicateBuilder` (decisione ratificata (c): boolean + number + string)
suggerisce automaticamente il tipo del literal quando l'altro lato è un path risolvibile su un
attributo di tipo noto. Serve quindi sapere quali stringhe compaiono in
`PathBuilderFeatures.attributes[].type` per mapparle a `'boolean' | 'number' | 'string'`.

## File letti (con path)

- `frontend/src/components/ui/PathBuilder/PathBuilder.tsx:12-15` — `PathBuilderFeatures.attributes[].type: string`.
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts:58-64` — `MetaclassAttribute.type: string` con commento `// type name (e.g. 'EString')`.
- `frontend/src/components/editor-v2/hooks/useEditorMode.ts:360-387` — `resolveM1Info` popola `type` come `attr.type?.name ?? 'EString'` (sia per `attributes` che per `allAttributes`; il valore consumato dal pannello Fase B è `allAttributes` via `VertexAuthoringPanel.tsx:99-101`).
- `frontend/src/common/U.tsx:3322-3348` — `enum ShortAttribETypes` (vocabolario nativo jjodel dei datatype primitivi).
- `frontend/src/common/U.tsx:3351-3363` — `ShortAttribSuperTypes` (reticolo di widening numerico).
- `frontend/src/common/DV.tsx:1107-1117` — `valuecolormap` (bucket semantici usati altrove nella UI).
- `frontend/src/services/export/EcoreService.ts:705-729` — alias bare-name ↔ datatype Ecore usati in export.

## Findings — il mapping trovato

`type` è il `.name` del datatype dell'attributo. Le sorgenti sono due:

1. **Metamodelli nativi jjodel** → i nomi provengono dall'enum canonico `ShortAttribETypes`
   (U.tsx:3322): `EVoid, EChar, EString, EDate, EBoolean, EByte, EShort, EInt, ELong, EFloat, EDouble`.
2. **Metamodelli importati / round-trip Ecore** → oltre alle forme `E`-prefissate, il codebase
   usa forme bare/alias (EcoreService.ts:705): `String, Integer, int, Boolean, boolean, Float,
   Double, float, double, Long, Short, Byte, Char`.

Bucket → `LiteralKind`:

| LiteralKind | Stringhe `type` |
|-------------|-----------------|
| `boolean`   | `EBoolean`, `Boolean`, `boolean` |
| `number`    | `EByte, EShort, EInt, ELong, EFloat, EDouble` (nativi) + `EBigInteger, EBigDecimal` (Ecore std) + bare `Byte, Short, Int, Integer, int, Long, Float, Double, float, double, long, short, byte` |
| `string` (default) | `EString, EChar, EDate, EVoid` + qualunque nome non riconosciuto |

Nota semantica: `ShortAttribSuperTypes` (U.tsx:3356) mette `EBoolean` in fondo al reticolo di
widening numerico (`EBoolean → EByte → … → EDouble`); analogamente `valuecolormap` (DV.tsx:1107)
colora `EBoolean` con lo stesso "orange" dei numerici. **Questa è una convenzione di
coercizione/colore, non semantica del literal**: per l'editor Literal `EBoolean` è un `boolean`
(checkbox), non un numero. Il mapping sopra riflette la semantica utente, non il reticolo di
widening.

## Il vocabolario NON è chiuso

`type` è un nome libero: gli utenti definiscono `EEnum` e `EDataType` custom con nomi arbitrari
(es. `Color`, `Priority`, uno `EEnum` di dominio). Questi non sono enumerabili a priori.

**Decisione (coerente col vincolo del prompt "implementa comunque un fallback ragionevole")**:
`attributeTypeToLiteralKind` fa lookup esatto sui due set noti (boolean, number) e ricade su
`'string'` per tutto il resto — inclusi enum/datatype custom e i nomi non riconosciuti. È il
fallback più sicuro: un literal string editabile a mano copre qualunque valore, e il toggle manuale
path/literal (decisione (c)) resta la riserva quando il suggerimento non è pertinente.

## Dipendenze / rischi

- **Rischio basso**: il mapping è solo un *suggerimento* del kind quando si passa path→literal la
  prima volta; l'utente può sempre correggere il kind con il `Select` boolean/number/string. Un
  mismatch non è un bug, solo un default sub-ottimale.
- Nessuna dipendenza runtime: `attributeTypeToLiteralKind` è puro (stringa → stringa), vive in
  `ui/` e non importa nulla da editor-v2/redux/joiner.
- Coerenza col compilatore: `compilePredicate` (irCompile.ts:206-213) fa `eq/neq` con coercizione
  a stringa (`String(l) === String(r)`) e `lt/lte/gt/gte` con `Number(...)`. Il tipo del literal
  conta solo per rendere l'editing sensato (checkbox/number/text); non altera la semantica di
  confronto, che è coercitiva a valle.

## Domande aperte

Nessuna bloccante. Il vocabolario primitivo è chiuso (enum `ShortAttribETypes`); l'unica apertura
sono gli `EEnum`/`EDataType` custom, gestiti dal fallback `'string'` come sopra.
