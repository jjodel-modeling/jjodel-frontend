# Discovery 2026-08-30 — S1a: dove passano ENTRAMBE le vie

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `7222b9a76`
**Prompt**: «S1a: una funzione di uniqueness per create e rename» (ratifica R-S1-1..4).
**Ipotesi che la discovery falsifica**: «il punto d'ingresso della create e' uno solo, e mettere
la regola li' copre tutte le vie senza degradare nulla».
**Esito**: **falsificata in parte.** Le create M1 passano da **due** creatori D
(`DObject.new` e `DObject.new3`), e metterci la regola dentro **romperebbe il caricamento**
(import, seeding, fixture): i duplicati preesistenti devono potersi aprire (vincolo del prompt).
Il punto d'ingresso che copre le vie di S1a senza toccare il caricamento e' il **primitivo di
create del layer L**, `LValue.get_addObject`. Le vie che restano fuori sono **esattamente quelle
che il prompt assegna a S1b**.

**File letti per intero**: `model/logicWrapper/nameUniqueness.ts`, `jjform/create.ts`,
`components/editor-v2/hooks/createDraw.ts`, `components/editor-v2/hooks/createAdapter.ts`,
`components/editor-v2/problems/UniquenessProblemSync.tsx`.
**Sezioni lette**: `LModelElement.tsx` 449-460, 725-740, 5536-5550, 5688-5715, 5873-5915,
5995-6060, 6229-6312, 6435-6450, 7019-7200; `joiner/classes.ts` 1454-1478.
**Strumento**: `command grep` (BSD grep 2.6.0-FreeBSD). Ogni assenza porta il proprio controllo
positivo, dichiarato in linea.

---

## 1. Il censimento dei creatori M1 — misurato, non assunto

`command grep -rn 'DObject\.new3' src` → **5 righe**, di cui 3 sono commenti in
`createAdapter.ts` (36, 54, 233). Le due chiamate vere:

| # | Sito | Chi ci arriva |
|---|---|---|
| 1 | `LModelElement.tsx:7135` (dentro `LValue.get_addObject`) | manager/2c (`createAdapter.applyCreate:234,238`), `ContextMenu.tsx:381,394`, drop classico `EditorV2.tsx:2372`, singleton `joiner/classes.ts:1006`, `examples/` |
| 2 | `LModelElement.tsx:6819` | `t2m` — ricostruzione da JSON, **non** una create d'utente |

`command grep -rn 'DObject\.new(' src` → 10 righe, 6 delle quali commenti. Le chiamate vere:
`jjscript/executor/commands/instance.ts:287`, `components/editor-v2/sync/canvasToJjom.ts:1387`
(`syncCreateObject`), `components/project/ProjectEditor.tsx:1750` (seeding differito),
`LModelElement.tsx:3742`. Controllo positivo della ricerca: lo stesso comando su
`DObject.new3` ritorna 5 righe non vuote; il filtro dei commenti e' stato fatto leggendo ogni
riga, non contando.

`command grep -rln '\.addObject(' src` → **13 file**, ~30 siti, tutti elencabili: nessuna via
di create M1 sfugge alle due colonne sopra.

## 2. Perche' la regola NON puo' stare in `DObject.new` / `new3`

Tre reperti, in ordine di gravita':

1. **Il caricamento userebbe la stessa porta.** `ProjectEditor.tsx:1750` crea gli oggetti del
   seeding con nome esplicito; l'import e i fixture passano dalle stesse due statiche. Un rifiuto
   li' significa «un modello con duplicati preesistenti non si apre», che e' il contrario del
   vincolo del prompt («si aprono, si leggono, si dichiarano al primo tocco»).
2. **L'auto-nome non e' calcolato sul namespace del core.**
   `DPointerTargetable.defaultname` (`joiner/classes.ts:1454-1478`) usa `lfather.childNames`.
   Per un **root** `LModel.get_children_idlist` (`:5540-5545`) ritorna `allSubObjects`, quindi
   coincide col namespace del core. Per un **nidificato** il padre e' la `DValue`, e **`LValue`
   non sovrascrive `get_children_idlist`**: eredita quello di `LModelElement` (`:727-729`), che
   ritorna le sole `annotations`. Controllo positivo: `command grep -n 'get_children_idlist'`
   ritorna 7 righe (727, 1961, 2424, 3129, 4756, 5540, 6439) e **nessuna** cade dentro `LValue`
   (che comincia a `:6603`). Quindi l'auto-nome di due oggetti nidificati nello **stesso slot** e'
   lo **stesso**, e una regola applicata all'auto-nome bloccherebbe la seconda `Add` di un
   containment. Il gate va quindi applicato al **nome esplicito**, prima che `new3` calcoli il
   default — ed e' un limite **dichiarato**, non chiuso (§5).
3. **`new3` e' un creatore in zona sync-adiacente.** §3.3: nessuna TRANSACTION esterna. Il gate
   sta **prima** della `TRANSACTION` di `:7134`, non dentro, e non aggiunge creatori.

## 3. Il punto d'ingresso scelto, e cosa copre

`LValue.get_addObject` (`LModelElement.tsx:7035`) e' definita **una volta** e serve **entrambi** i
ricevitori — `LModel.addObject` per una radice e `LValue.addObject` per un contenuto
(`createAdapter.ts:16-25` lo misura gia'). E' quindi il primitivo di create del layer L, e sta
nello **stesso file** di `LObject.set_name`: le due vie del prompt si incontrano li'.

Copre: manager/2c, ContextMenu, drop classico, singleton, `examples/`.
**Non** copre, e sono le vie che il prompt assegna a **S1b**: `jjscript` (`instance.ts`),
il seeding di `ProjectEditor`, `canvasToJjom.syncCreateObject`. Restano dichiarate, non chiuse.

## 4. La forma della funzione unica

`nameUniqueness.ts` oggi risolve il namespace da **un'istanza esistente** (`lobj.father`). Una
create non ha ancora l'istanza: ha il **padre prospettico**. Da qui la rifattorizzazione minima:

- `getNamespaceOf(father, excludeId?)` — il namespace a partire dal PADRE. E' il corpo che
  `getSiblingNamespace` gia' aveva, estratto: model → `allSubObjects`, `DValue` → gli `LObject`
  dello slot, fallback `LObject` → `subObjects`. Nessun ramo nuovo.
- `checkNameUniqueness({father, name, excludeId})` → `{ok, reason?, collidingWith?}` — **il
  verdetto unico**, nella forma che anticipa `WriteResult` di S2 senza implementarlo.
- `getSiblingNamespace`, `validateNameUniqueness`, `detectDuplicateNames` restano esportate con
  la firma di oggi e delegano: una sola implementazione, tre forme di chiamata.

`reason` porta **la stessa frase** che `set_name` costruisce oggi
(`Name "X" already used by <Type> "<Name>"`), cosi' il rename resta invariato **a schermo** pur
diventando consumatore.

## 5. Limiti dichiarati di S1a

- **L'auto-nome non e' gated** (§2.2). Una create senza nome esplicito puo' ancora produrre un
  duplicato in uno slot; il badge lo dichiara, come oggi. Chiuderlo vuol dire toccare
  `defaultname`, che serve anche M2 (`DClass`, `DPackage`, `DOperation`, …): fuori scope.
- **Tre vie di create restano fuori** (§3): sono S1b.
- **Il motore `jjform/create.ts` non guadagna la regola**: la sua validazione anticipata resta
  una **consumatrice** della lista che l'host risolve. Cio' che cambia e' che l'host
  (`createAdapter.draftContext`) smette di risolverla per-classe e la prende dal namespace del
  core. `createDraw.siblingNames` resta in file, non piu' la regola: dichiarato nel suo doc.

---

## 6. Addendum di Fase 2 — le sonde, e i due reperti che hanno cambiato la sonda

Sonda: `frontend/scripts/smoke/_tmp_s1a_verify.ts` (non committata, non parte di `npm run smoke`).
Il fixture RowViewSmoke non dichiara containment: la sonda **costruisce a runtime** sul
metamodello vivo `Thing` (astratta) con `Alpha`/`Beta` concrete e due containment su `AllNine`
(`mix: Thing`, `two: Alpha`), e lo dichiara invece di darlo per presente.

Esito: **ALL GREEN, 0 errori di pagina.**

| Criterio | Misura |
|---|---|
| CE-A — due classi diverse, **stesso** slot | create `Beta «ce_a»` dove vive `Alpha «ce_a»`: **rifiutata**, `objCount` 8 -> 8, `createdId null`. Rename di un `Beta` verso `«ce_a»`: **rifiutato**, il nome resta `ce_a_free`. **Verdetti identici.** |
| CE-B — stessa classe, **due** slot dello stesso owner | create `Alpha «ce_b»` in `mix` mentre `two` gia' lo porta: **accettata**, 10 -> 11. Rename verso `«ce_b»` dall'altro slot: **accettato**. **Verdetti identici.** |
| Caso divergente originale | create di un `Beta` **radice** col nome di una radice di altra classe (`Red`): **rifiutata**, 12 -> 12. Non piu' costruibile. |
| Badge `UniquenessProblemSync` | duplicato preesistente fabbricato bypassando i setter: il registro passa da `[conformance, conformance]` a `[conformance, conformance, duplicate-name]` e la voce nomina il nodo giusto. |
| Non-regressione del rename | il toast porta la frase di sempre, `Name "ce_a" already used by Object "ce_a"`. |
| Controlli negativi | la prima create nello slot **riesce** (8 nomi liberi passano), un nome libero passa nello stesso slot, e un rename verso un nome libero passa: una regola che rifiutasse tutto non darebbe questo verde. |

### 6.1 Due reperti che la sonda ha corretto su se stessa

- **Misurare a zero millisecondi misura la latenza, non il verdetto.** Le prime tre corse
  leggevano `objCount()` nella stessa `evaluate` della scrittura e vedevano `after === before` su
  create **riuscite** (`createdId` non nullo). La scrittura passa da una `TRANSACTION` e da Redux:
  la misura va presa dopo l'assestamento. Quattro «FAIL» della prima corsa erano questo.
- **Scrivere solo `DObject.name` non fabbrica un duplicato visibile.** `LObject.get_name`
  (`LModelElement.tsx:5969`) e' `$name.value || data.name || instanceof.name`: legge lo **slot
  d'identita' prima** del campo D, e ogni oggetto creato da `addObject({name})` porta lo slot
  popolato. Una `SetFieldAction` sul solo `name` lascia quindi il nome **letto** invariato, e il
  badge — correttamente — non si accende. Il duplicato preesistente va scritto su **entrambi** i
  lati, che e' la forma in cui il caricamento lo produce (XMI popola lo slot). E' anche la conferma
  che il gate della create confronta la stessa cosa che l'utente legge.

### 6.2 Gate

`npm run typecheck` **33 = baseline su output completo** (124 righe lette per intero), e nessuna
delle 33 righe nomina un file toccato. `npm run build` exit **0**, solo il chunk-warning.
`npx vitest run` **2093 passed / 0 failed** (+1 esatto: il test class-agnostic aggiunto), coi 9
file rotti all'import = baseline nota. `npm run smoke` **12 passed / 0 failed / 3 skipped,
VERDICT GREEN**, corsa quiescente (`moved: nothing`), un boot per stato.
