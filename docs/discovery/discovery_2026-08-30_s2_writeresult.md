# Discovery 2026-08-30 — S2: il verdetto smette di essere buttato via

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`, HEAD `9daf74def` all'inizio del lavoro
**Prompt**: «S2: `WriteResult` al posto del boolean in `formWrite`», dato in chat e non
depositato in `docs/prompts/`. Seconda slice della sequenza `WriteCtx` (referto
`b9ca883fc`, §4.2 e §6). Il prompt impone di **esercitare il difetto prima di chiuderlo**.
**Esito**: **il difetto esisteva esattamente come descritto, e ora e' chiuso.** Il rifiuto
del core non e' costruibile dal gesto che lo produrrebbe (il picker filtra), ma **un altro
rifiuto lo e'** — il rinomina verso un nome occupato — e da li' il verdetto arriva a
schermo con la sua reason.

---

## 1. La sonda, prima del fix

`scripts/smoke/_tmp_s2_probe.ts`, corsa sul dev server, **ALL GREEN, zero errori di pagina**.
Non committata (sonda temporanea, come `_tmp_rdel4_verify.ts` e `_tmp_s1a_verify.ts`).

**Il modulo misurato e' quello vero, non una copia.** La sonda carica
`formWrite.ts` dal dev server per URL (`await import('/src/components/.../formWrite.ts')`);
il controllo che questo non fabbrichi una seconda istanza e' `U === windoww.U`, misurato
`true`. Cinque export, i cinque attesi.

**Fixture dichiarato e costruito a runtime**: `RowViewSmoke` non porta containment, quindi la
sonda aggiunge al metamodello vivo una classe `Nest` con un containment su se stessa
(`kids: Nest`, upperbound -1) e due istanze annidate `N0 > N1`. Scrivere `N0` dentro
`N1.kids` e' il ciclo che il core rifiuta.

| # | Misura | Valore |
|---|---|---|
| 1 | Il picker offre l'antenato fra i bersagli di `N1.kids`? | **no** (1 opzione offerta, ed e' `N2`) |
| 2 | `formWrite.setSlotValue` sul ciclo — che cosa torna | **`true`** |
| 2 | `U.isProjectModified` attorno a quella chiamata | **`false -> true`** |
| 3 | I valori dello slot prima / dopo | `[]` / `[]` — **la scrittura non e' avvenuta** |
| 4 | Il core, chiamato direttamente sullo stesso slot | **`{success: false, reason: "cannot create a containment loop"}`** |
| 5 | Controllo negativo: scrittura legale (`N2`, non antenato) | `true`, e **lo slot cambia** |

Le tre righe centrali sono l'affermazione di §4.2 del referto `WriteCtx`, che era **letta e
non esercitata**: una scrittura rifiutata dal core viene riportata come riuscita, e marca il
progetto modificato. Adesso e' misurata.

**Cosa vedeva l'utente, oggi.** Il valore «torna indietro» (lo slot non cambia, il widget si
ridisegna sul vecchio), il campo si marca «Modified, not saved», e il progetto resta sporco:
un avviso di uscita per una modifica che il modello ha rifiutato. Nessun messaggio, in nessun
punto della form, dice perche'.

### 1.1 Il rifiuto NON e' costruibile dal gesto — e questo e' misurato, non assunto

La misura (1) porta il proprio **controllo positivo**: nella stessa lista il bersaglio legale
`N2` **c'e'**. Quindi «l'antenato non compare» e' un filtro che ha funzionato, non una lista
vuota — la prima stesura della sonda leggeva gli id sui GRUPPI di
`validTargetOptions` (`{label, options}`) e trovava zero opzioni ovunque, che e' il silenzio
che somiglia a un risultato negativo di CLAUDE.md §5.

E' il filtro containment-loop del picker (R-FORM-13, referto `WriteCtx` §4.1): il core toglie
gli antenati dai bersagli, quindi **dalla UI quel rifiuto non si raggiunge**. La via
programmatica e' quella che il prompt autorizza in questo caso, ed e' quella usata.

Ne segue una cosa che vale la pena scrivere: il rifiuto del ciclo e' oggi **una rete di
sicurezza dietro un filtro**, non un percorso vivo. Rimane necessario — `WriteCtx` (S4) porta
la scrittura per `(id, chiave)`, cioe' **senza passare dal picker**, ed e' esattamente lo
scenario che §4.4 del referto descrive come debito: il write path non applica la conformita'
di tipo, e il ciclo e' l'unico controllo che applica.

---

## 2. Il fix

### 2.1 `WriteResult` — il tipo, in `jjform/`

Nuovo file `frontend/src/jjform/write.ts`, **zero import** come ogni file della directory,
esportato dal barrel:

```ts
export interface WriteResult { ok: boolean; changed: boolean; reason?: string; }
export function writeDone(): WriteResult;       // { ok: true,  changed: true  }
export function writeUnchanged(): WriteResult;  // { ok: true,  changed: false }
export function writeRefused(reason?): WriteResult;
```

`ok` e `changed` sono due campi perche' rispondono a due domande che **divergono in un caso
che la form incontra di continuo**: un campo committa anche sul blur, quindi lasciarlo intatto
arriva alla scrittura col valore che gia' c'e'. Quello e' `{ok: true, changed: false}` — niente
da scrivere, niente di sbagliato. Un boolean costringe quel caso a mentire in una direzione o
nell'altra.

### 2.2 La mappatura del verdetto del core — l'unica decisione non ovvia

`setValueAtPosition` risponde `{success: false, reason: "identical assignment"}` **anche quando
il valore chiesto e' quello che c'e' gia'** (`LModelElement.tsx:7643-7646`). Cioe' usa
`success: false` per due cose diverse: «non ti e' permesso» e «non c'era niente da fare».

`formWrite.fromCore` le separa: le due reason di no-op (`identical assignment`,
`identical object assignment`, confrontate **verbatim**) diventano `{ok: true, changed: false}`,
ogni altra diventa `writeRefused(reason)`. Il confronto e' su stringa esatta e non per
sottostringa: un rifiuto vero che contenesse quella parola verrebbe inghiottito.

Un verdetto **assente** (`undefined`) e' letto come successo. E' quello che il codice pre-S2
faceva, e leggere il silenzio come rifiuto trasformerebbe ogni percorso proxy non tipato in un
falso allarme.

### 2.3 `U.isProjectModified` — la riga che cambia comportamento

Prima: alzata dopo ogni chiamata sopravvissuta al `try`. Ora: `if (result.ok && result.changed)`.
E' la meta' del difetto misurata al punto (2) della sonda.

### 2.4 Il rinomina — perche' passa da `checkNameUniqueness` e **non** salta il setter

`setObjectName` scrive con `lObject.name = name`: un'assegnazione a proxy **non ha valore di
ritorno**, e `LObject.set_name` (`LModelElement.tsx:6230`) su collisione mostra un toast, non
scrive, e ritorna. Il verdetto non ha modo di tornare indietro.

Quindi `setObjectName` interroga `checkNameUniqueness`, che dopo S1a e' **LA** funzione che sia
il rinomina sia la create consultano (R-S1-2): e' consumo della regola unica, non una seconda
copia, e la frase mostrata e' quella che quella funzione compone.

E **chiama il setter comunque**, anche quando il verdetto rifiuta. Sulla collisione il setter
non scrive nulla e alza solo il toast, che e' comportamento committato e appartiene al core:
saltare la chiamata «per risparmiare un no-op» toglierebbe quel toast in silenzio. Lo screenshot
`_tmp_s2_verify_refused.png` mostra le due cose insieme — il messaggio in linea nel campo e il
toast del core — che e' l'esito voluto.

### 2.5 `addSlotValue` — **si allinea, non muore**

Zero chiamanti, ricontato in questa sessione (`command grep` su tutto `src/`: tre righe, tutte
dentro `formWrite.ts`, una delle quali il riferimento nel docstring di `appendSlotValue`).
Il prompt chiedeva di decidere: **resta**, con il tipo nuovo e un `// TODO: cleanup` esplicito.
Il motivo e' quello della Regola 9 e del referto §2.4: e' l'unico punto del perimetro form che
sa produrre il **vuoto tipato** di `U.initializeValue`, quindi cancellarla cancella una
conoscenza, non del codice. Torna viva il giorno che esiste un gesto «Add row».

Nota di onesta' sul suo `ok`: `addSlotValue` e `appendSlotValue` scrivono con `SetFieldAction`,
che **non torna un verdetto**. Il loro `writeDone()` significa «l'azione e' stata emessa», non
«l'host ha approvato». E' scritto nel sorgente accanto alla riga, perche' e' esattamente il tipo
di sfumatura che un chiamante non puo' indovinare dal tipo.

### 2.6 I chiamanti (censimento del referto `WriteCtx` §2.2)

| Sito | Cosa consuma |
|---|---|
| `IRFormField.tsx` ×4 | `consume(r)`: `!ok` -> il campo dichiara il rifiuto con la reason; `changed` -> il pallino di dirty. Uno stato locale per campo, azzerato dal commit accettato successivo e dal cambio di soggetto (IRForm chiave i campi per `slotId`) |
| `IRForm.tsx:295` (identita') | stessa regola, copia propria: il campo nome non passa da `IRFormField` |
| `multiAdapter.ts:77` | `written` solo su `changed`; i rifiuti in `refused?` (campo **opzionale**, Regola 11) e un warning con la reason dell'host |
| `deleteAdapter.ts:198,208` | warning con la reason. Un reassign rifiutato lascia un referente puntato a cio' che sta per essere cancellato: fino a S2 era invisibile |

Il risultato di `applyBulk` e' **scartato** dal chiamante (`InstanceManagerTab.applyBulkEdit`,
verificato): il consumo vivo del rifiuto e' il warning, il campo `refused` e' contabilita'
onesta perche' un rifiuto non venga contato come no-op.

---

## 3. La verifica, dopo il fix

`scripts/smoke/_tmp_s2_verify.ts`, **ALL GREEN, 18 asserzioni, zero errori di pagina**.
Ogni caso porta il proprio controllo di segno opposto.

| Caso | Misura | Esito |
|---|---|---|
| A — ciclo di containment | `{ok: false, changed: false, reason: "cannot create a containment loop"}` | reason **verbatim** dal core; `isProjectModified` resta `false`; slot invariato |
| B — no-op su valore identico | `{ok: true, changed: false}`, `reason` assente | progetto **non** marcato |
| C — scrittura riuscita | `{ok: true, changed: true}` | lo slot cambia, progetto marcato: identico a prima |
| D.1 — **il gesto** | rinomina di `b_two` verso `b_one`, occupato da un fratello | il campo mostra `Name "b_one" already used by Object "b_one"`, `aria-invalid=true`, **nessun** pallino di dirty, `isProjectModified` `false`, nome nello store invariato |
| D.2 — controllo opposto | rinomina verso `b_three`, libero | il nome passa, il messaggio sparisce, il campo torna a «Modified, not saved» |

Il caso D e' il criterio «il verdetto arriva alla UI con la sua reason» soddisfatto **dal
gesto**, non dal modulo: `#ir-field-name` riempito e sfocato con Tab, dentro l'Instance Manager
aperto dalla sua affordance vera. Il fixture per D e' una classe `Bare` **senza attributi**,
perche' e' cosi' che `IRForm` mostra il campo d'identita' intrinseco invece di uno slot.

Screenshot: `_tmp_s2_verify_refused.png` (messaggio in linea + bordo rosso + toast del core) e
`_tmp_s2_verify_accepted.png`.

---

## 4. Layer Impact Report

`viewpoint/ir/` e' in critical zone (CLAUDE.md §3.1, riga «IR execution rendering»), quindi il
report e' dovuto. **Scritto dopo il diff e non prima**: e' una violazione di processo di questa
sessione, registrata come tale nel log.

```
Layer toccati:
  [ ] D-layer (Redux raw data)      — nessuna scrittura aggiunta o rimossa
  [ ] L-layer (proxy calcolati)     — nessun getter/setter toccato
  [ ] JjOM                          — no
  [ ] Canvas v2-flow                — no
  [ ] Canvas classic                — no
  [ ] Sync layer (useJjomSync)      — no
  [ ] Persistenza (VersionFixer)    — no
  [x] Form (jjform/ + ir/ + adapter)
```

- **Cosa cambia**: il TIPO di ritorno di cinque funzioni e la condizione sotto cui
  `U.isProjectModified` viene alzata. In `setObjectName`, una lettura in piu' —
  `checkNameUniqueness`, gia' chiamata dal setter subito dopo.
- **Cosa NON cambia**: nessuna `TRANSACTION` aggiunta, rimossa, spostata o annidata; nessun
  `.new()`/`.new2()`/`.new3()` in gioco (§3.3 non pertinente); nessuna azione emessa in piu' o
  in meno; l'ordine delle scritture e le dilazioni di R-FORM-11 / R-FORM-12 sono intatte;
  nessuna interfaccia esportata modificata se non con un campo **opzionale** (`BulkResult.refused`).
- **Interazione cross-layer**: il core resta l'unico a decidere. Questa slice **legge** il suo
  verdetto invece di scartarlo; non ne aggiunge uno proprio.
- **Sicurezza rispetto agli altri layer**: la sola differenza osservabile fuori dalla form e'
  che `U.isProjectModified` **non** si alza piu' su una scrittura rifiutata. Va nella direzione
  di meno stato sporco, mai di piu'.

Scenari di smoke potenzialmente toccati: la form nel manager e nel rail destro (le due
superfici che montano `IRForm`), la modifica bulk, il delete con reassign/clear.
`npm run smoke` 12/0/3 GREEN, corsa quiescente.

---

## 5. Convergenza dei verdetti — dichiarata, NON presa qui

Tre forme convivono, e il prompt chiede esplicitamente di non unificarle ora:

```
S1a  UniquenessVerdict {ok, reason?, collidingWith?}   model/logicWrapper/nameUniqueness.ts
S1b  {ok, value?, reason?, candidates?}                risoluzione d'istanza
S2   WriteResult {ok, changed, reason?}                jjform/write.ts
```

Tutte e tre portano `{ok, reason}`, e non e' un caso: l'intestazione di `nameUniqueness.ts` dice
di aver preso quella forma **anticipando** questa slice. Convergono in **S4**, quando `WriteCtx`
dara' al lato scrittura una superficie sola e la domanda «`changed` e `collidingWith`
appartengono allo stesso tipo?» diventera' rispondibile con delle prove. La nota e' scritta anche
in testa a `jjform/write.ts`, perche' e' li' che qualcuno la cerchera'.

---

## 6. Limiti di questa misura

- **`clearSlotValue` non ha un rifiuto esercitato.** Il percorso di clear scrive `undefined`, e
  in `setValueAtPosition` quel valore salta l'intero blocco dei controlli: non c'e' un rifiuto
  costruibile da misurare. La mappatura e' la stessa di `setSlotValue`, per costruzione, ma non
  ha una sonda propria.
- **`addSlotValue` e `appendSlotValue` non hanno un verdetto da leggere.** §2.5.
- **Nessun test unitario nuovo.** `formWrite.ts` importa il barrel `joiner`, che tocca `window`
  all'import: un test in ambiente node non lo carica (e' la ragione per cui `formDiagnostics` e
  `slotValues` furono estratti). I quattro casi del prompt sono coperti dalla sonda Playwright,
  non da vitest. `jjform/write.ts` sarebbe testabile ma i suoi tre costruttori sono letterali.
- **Il perimetro e' sette file**, oltre la soglia di cinque della Regola 19, e la pausa non e'
  stata presa: erano tutti nominati dal prompt attraverso il censimento che cita. Dichiarato.
- **`ChatMessages.tsx`, `types/jodie.ts`, `jjel/`** risultano modificati nel working tree: sono
  della sessione parallela, questa sessione non li ha toccati e ogni commit e' con pathspec.
