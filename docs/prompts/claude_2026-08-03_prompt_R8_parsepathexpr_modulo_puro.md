# Prompt Claude Code — R8: `parsePathExpr` in modulo puro, convergenza dei tre parser

**Data**: 2026-08-03 17:10
**Tipo**: refactor. **Fase unica**, nessuna discovery: i punti sono gia' localizzati dal report.
**Branch**: `alfonso-frontend-jjtl`. **Critical zone**: nessuna. `irCompile.ts` non e' critical zone ma e' il cuore dell'interprete: la diff deve essere di puro spostamento.

Leggi `CLAUDE.md` prima di iniziare. Leggi `docs/claude-code-log.md` per il contesto recente.

## Contesto (dalla discovery 2026-08-03, non ridiscutere)

`docs/discovery/discovery_2026-08-03_state_actions_events.md` §6.3 e §7.3 hanno registrato il rischio **R8**: nel codebase esistono **tre parser indipendenti dello stesso linguaggio** `PathExpr`.

| Parser | `file:riga` | Esportato | Copertura |
|---|---|---|---|
| `parsePathExpr` | `irCompile.ts:47-74` | **no** | canonico: multi-hop, `featureNames`, `steps` con `take` |
| `parseExpr` | `PathBuilder.tsx:29-37` | no (locale) | **single-hop soltanto**, regex propria |
| regex inline in `resolvePathLiteralType` | `PredicateBuilder.tsx:57` | no | **solo il primo identificatore** |

Costanti correlate, oggi private a `irCompile.ts`: `FORBIDDEN_PATH` (`:37`), `STEP_RE` (`:39`), il tipo `ParsedPath` (`:41-45`).

Conseguenza: ogni estensione della grammatica ne tocca tre e puo' divergere in due, in modo silenzioso. La ratifica R-5 del 2026-08-03 prevede un secondo prefisso nel linguaggio delle espressioni; questa slice e' il **prerequisito** che va chiuso prima, e paga anche il micro-debito `isUsableEndpointExpr` registrato il 2026-08-02 (guardia sui capi edge che vive nel pannello e nel test come letterale rispecchiato).

## Obiettivo e vincolo dominante

**Zero cambiamenti di comportamento.** Questa e' una riorganizzazione: stesso parsing, stessi errori, stessi messaggi, stessi input accettati e rifiutati, in tutti e tre i siti. Se durante il lavoro emerge che unificare cambierebbe un comportamento osservabile, **fermati e segnala** invece di procedere.

In particolare, e in modo non negoziabile: **`PathBuilder` resta single-hop**. Il suo `parseExpr` accetta oggi solo `$feature[.value|.values|.values[N]]` e su multi-hop ritorna `{feature: ''}`. Convergere sul parser condiviso significa usare lo stesso codice di parsing e poi **applicare sopra un gate single-hop**, non allargare l'authoring al multi-hop. Lo stesso vale per `PredicateBuilder`, documentato come *"Single-hop only (mirrors PathBuilder's authoring scope)"* (`PredicateBuilder.tsx:51`). Allargare l'authoring e' una decisione di Alfonso e non fa parte di questa slice.

## COSA

### 1. Modulo nuovo

`frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts`.

**Grep di collisione obbligatorio prima di crearlo**: sul nome del file e su ogni identificatore esportato.

Ci si spostano, **verbatim**, da `irCompile.ts`:

- `FORBIDDEN_PATH` (`:37`)
- `STEP_RE` (`:39`)
- il tipo `ParsedPath` (`:41-45`)
- `parsePathExpr` (`:47-74`)

Tutti esportati. Nessuna riscrittura della logica, nessun cambio di firma, nessun cambio dei messaggi di errore lanciati (`:48-49`, `:56`, `:63`, `:66`, `:72`): sono usati da `validateIR` (`irValidate.ts:16-25`), che riusa il compilatore come validatore, quindi un messaggio diverso cambia cio' che l'utente legge nel pannello.

In aggiunta, **una sola funzione nuova**: un predicato o helper che risponda a "questa espressione e' single-hop?", derivato da `ParsedPath` invece che da una regex. Serve ai due widget di authoring. Nome da scegliere dopo grep di collisione. Deve essere puro e senza dipendenze da React o Redux, come tutto il modulo.

### 2. `irCompile.ts`

Rimuove le quattro entita' spostate e le importa dal modulo nuovo. Se `ParsedPath` o `parsePathExpr` sono usati altrove nel file oltre a `compilePath` (`:111-148`), verifica ogni sito.

**Nient'altro cambia in questo file.** Non toccare `compilePath`, `compileOperand`, `compilePredicate`, `compileConditional`, `compileTextSource`, le cache (`:273`, `:402`, `:454`), `irHash`, ne' la raccolta di `featureNames` nel `dependencySet` (`:60`, `:160`, `:292`, `:363`).

### 3. `PathBuilder.tsx`

`parseExpr` (`:29-37`) si appoggia al parser condiviso.

Comportamento da preservare esattamente:
- input single-hop valido: stessi `{feature, take, index}` di oggi;
- input multi-hop: stesso risultato di oggi (`{feature: ''}` o equivalente), **non** un parse riuscito;
- input invalido: stesso risultato di oggi, e nessuna eccezione che sfugga al componente. `parsePathExpr` **lancia** su input invalido mentre la regex attuale ritorna semplicemente un match nullo: la conversione va gestita, o il widget inizia a crashare su digitazione parziale. **Questo e' il punto piu' delicato dell'intera slice**: l'utente digita carattere per carattere, quindi il parser vede continuamente stringhe incomplete.

Non cambiare la UI, le prop, i nomi delle classi CSS.

### 4. `PredicateBuilder.tsx`

`resolvePathLiteralType` (`:52-63`) e la regex inline (`:57`) si appoggiano al parser condiviso, con le stesse tre garanzie del punto 3. Stessa nota sulle eccezioni su input parziale.

### 5. Test

Nuovo file di test per il modulo estratto, che oggi non e' testabile direttamente perche' `parsePathExpr` non e' esportato (e' testato solo di riflesso via `compileView`).

Copertura minima:
- single-hop nelle tre forme: `$f`, `$f.value`, `$f.values`, `$f.values[0]`;
- multi-hop concatenato, con `featureNames` nell'ordine corretto;
- ognuno dei costrutti vietati da `FORBIDDEN_PATH` (`?.`, `??`, `?`, `:`, `(`, `)`): lancia;
- step malformato rifiutato da `STEP_RE`;
- input parziali tipici della digitazione: `$`, `$f.`, `$f.val`, stringa vuota. **Questi fissano il contratto che i due widget richiedono**: quale forma di risposta arriva al chiamante.
- il predicato single-hop nuovo: vero sui single-hop, falso sui multi-hop.

I test esistenti del modulo IR devono restare verdi **senza modifiche**. Se un test esistente va toccato, e' il segnale che il comportamento e' cambiato: fermati e segnala.

## DOVE (lista chiusa)

| File | Intervento |
|---|---|
| `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts` | nuovo, contenuto spostato verbatim + un helper |
| `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` | rimozione delle quattro entita', import dal modulo |
| `frontend/src/components/ui/PathBuilder/PathBuilder.tsx` | `parseExpr` sul parser condiviso, single-hop preservato |
| `frontend/src/components/ui/PredicateBuilder/PredicateBuilder.tsx` | `resolvePathLiteralType` idem |
| `frontend/src/components/editor-v2/viewpoint/ir/__tests__/` | file di test nuovo |

Qualsiasi altro file: STOP e segnala. In particolare **non toccare** `irTypes.ts`, `irResolveCore.ts`, `irReadCtx.ts`, `irValidate.ts`, i pannelli di authoring.

## Fuori scope, esplicito

- Non estendere la grammatica. Nessun prefisso nuovo, nessun operatore nuovo. Quella e' la slice successiva e dipende da questa.
- Non allargare l'authoring al multi-hop.
- Non toccare `isUsableEndpointExpr` nel pannello edge: il micro-debito si chiude in una slice a parte, una volta che questo modulo esiste.
- Non unificare i messaggi di errore ne' "migliorarli".

## Gate automatici

1. `npx tsc --noEmit`: stesso set di errori della baseline, diff vuoto.
2. `npx vitest run`: tutti verdi, inclusi i test IR esistenti **non modificati**.
3. `npm run build`: exit 0.
4. Grep di collisione su ogni identificatore nuovo, riportato nel log.

## Verifica visiva (la esegue Alfonso, hard stop prima del commit)

1. `PathBuilder` in una label del pannello IR: digito un path carattere per carattere. Nessun crash, nessun errore in console, il feedback e' identico a prima.
2. Path valido selezionato dal picker: il canvas rende come prima.
3. `PredicateBuilder` in un Conditional: costruisco un predicato su una feature, il comportamento e' identico.
4. Pannello edge, capi di una object-as-edge: `PathBuilder` sulle sole reference funziona come prima, guardia sulla forma array inclusa.
5. View IR esistente aperta e chiusa senza modifiche: nessuna scrittura spuria, il canvas non cambia.

## Chiusura

Un solo commit dopo la conferma visiva: `refactor: extract PathExpr parser into a pure module shared by authoring widgets`. Entry in `docs/claude-code-log.md` con tipo `refactor` e il nome di questo documento prompt:

```
**Nome del documento prompt**: 2026-08-03 17:10 prompt_R8_parsepathexpr_modulo_puro
```

Nessun push senza go-ahead.
