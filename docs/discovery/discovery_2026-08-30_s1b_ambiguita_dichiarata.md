# Discovery 2026-08-30 — S1b: cosa resta da dichiarare, e cosa e' gia' dichiarato

**Data**: 2026-08-30
**Branch**: `alfonso-frontend-jjtl`. Misure prese a HEAD `7222b9a76`; a chiusura della Fase 1 HEAD
e' `f32c5a4d3` (S1a atterrata) — le righe citate sono state **rimisurate** su quel commit e sono
invariate, perche' S1a non tocca nessuno dei nove file di questa slice.
**Prompt**: «S1b: l'ambiguita' dichiarata nei consumatori della risoluzione per nome»
(ratifica R-S1-3), `docs/prompts/` — il documento **non e' depositato nel repo**: il prompt e'
arrivato in chat dopo che la ricerca del file nominato (`PROMPT_s1b_ambiguita_dichiarata.md`) e'
uscita a vuoto con controllo positivo (`find` sullo stesso pattern ritorna
`discovery_2026-08-30_s1_uniqueness_consumatori.md`, quindi la ricerca aveva segnale).

**Ipotesi che questa discovery falsifica**: «i quattro punti del perimetro sono quattro lavori da
fare, e stanno tutti dentro i tre file nominati».

**Esito**: **falsificata su entrambi i lati.** Uno dei quattro e' **gia' implementato** e ha gia'
il suo test; e due dei tre file nominati non bastano — la firma che il prompt impone su
`findInstanceByName` rompe un consumatore fuori perimetro, e «nominare i candidati» nel ramo JjEL
attraversa `jjel/`, che il prompt non nomina. Zero diff di sorgente.

**File letti per intero**: `jjscript/executor/commands/instance.ts` (754 righe),
`jjscript/__tests__/handleRegistry.test.ts`.
**Sezioni lette**: `jjscript/executor/commands/eval.ts` 90-250, 300-347;
`jjscript/executor/elementWaiter.ts` 60-125; `jjscript/__tests__/elementWaiter.test.ts` 105-125;
`jjel/evaluator/evaluator.ts` 218-255; `jjel/evaluator/context.ts` 140-175, 199-215;
`components/project/ProjectEditor.tsx` 1370-1400, 1860-1990;
`model/logicWrapper/LModelElement.tsx` 5560-5565.
**Strumento**: `command grep` (BSD grep 2.6.0-FreeBSD), mai il wrapper `ugrep --ignore-files`.
Ogni asserzione di assenza porta il proprio controllo positivo, dichiarato in linea.

---

## 1. La verifica del censimento su HEAD

Il prompt dichiara una deriva (`resolveInstanceHandle` a `:122`) e chiede di tenere il censimento
`discovery_2026-08-30_s1_uniqueness_consumatori.md` §2 come elenco autoritativo. Rimisurato su
`7222b9a76`, uno per uno:

| # | Consumatore | Riga nel censimento | Riga su HEAD | Stato |
|---|---|---|---|---|
| 1 | `findInstanceByName` | `instance.ts:108-110` | `:108-110` | invariata |
| 2 | `resolveInstanceHandle` | `:129` | **`:122`** | deriva confermata dal prompt |
| 2 | call site `delete` | `:372` | `:372` | invariata |
| 2 | call site `rename` | `:461` | `:461` | invariata |
| 2 | call site `set` | `:547` | `:547` | invariata |
| 2 | call site `set …ref = X` | `:692` | `:692` | invariata |
| 3 | binding «nudo» JjEL | `eval.ts:321-341` | **`:321-344`** | +3 righe (la chiave `AMBIGUOUS_INSTANCES_KEY` a `:344`) |
| 4 | `Class.Name` qualificato | `eval.ts:215-225` | `:215-226` | invariata nella sostanza |
| 5 | seeding differito | `ProjectEditor.tsx:1888, 1929, 1956` | `:1888, :1929, :1956` | tutte e tre esatte |

Una sola citazione del censimento e' quindi da correggere oltre a quella gia' nel prompt: il
binding nudo occupa `321-344`, non `321-341`.

---

## 2. Il reperto che cambia il diff: il punto 3 del perimetro e' gia' fatto

Il prompt chiede, per il binding «nudo»: «su ambiguita' il binding non si crea, l'errore di
valutazione nomina i candidati — la forma e' il ramo che `buildEvalContext` ha gia'».

Misurato, `buildEvalContext` non ha solo *la forma*: ha **il ramo, la mappa, il threading verso
l'evaluator, l'avviso e il test**.

```
jjscript/executor/commands/eval.ts:330-341
    for (const [nm, a] of instancesByName) {
        if (a.length === 1) {
            if (!(nm in variables)) variables[nm] = a[0];
        } else {
            let sampleClass: string | null = null;
            try {
                const io = (a[0] as any)?.instanceOf;
                if (io && typeof io.name === 'string') sampleClass = io.name;
            } catch { /* skip */ }
            ambiguousInstances.set(nm, { count: a.length, sampleClass });
        }
    }
```

```
jjscript/executor/commands/eval.ts:344
    (variables as Record<string, any>)[AMBIGUOUS_INSTANCES_KEY] = ambiguousInstances;
```

```
jjel/evaluator/evaluator.ts:236-245
                if (!seen) {
                    sink.push({
                        kind: 'ambiguous-instance',
                        identifier: expr.name,
                        count: ambig.count,
                        sampleClass: ambig.sampleClass,
                        suggestion: null,
                    });
                }
                return null;
```

E il test esiste gia': `jjel/__tests__/ambiguous-instance.test.ts`, che copre l'avviso, il caso
non-ambiguo (controllo negativo, `:58`) e il lift della mappa nel contesto.

**Il delta reale del punto 3 e' una sola cosa**: oggi l'avviso porta `count` + `sampleClass`, non
**i candidati**. «L'errore nomina i candidati» e' quindi un arricchimento di
`AmbiguousInstanceInfo` e della variante `'ambiguous-instance'` di `JjelWarning` — cioe' tocca
`jjel/evaluator/context.ts:152-161` e `:172-175`, `jjel/evaluator/evaluator.ts:236-245` e la
dichiarazione gemella in `types/jodie.ts:932-937`. **Nessuno dei tre e' nel perimetro del prompt**,
e sono un layer diverso da jjscript (Regola 20).

Il punto 4 (`Class.Name`) e' invece **davvero da fare**, ed e' un rifiuto oggi *deliberato e
documentato*:

```
jjscript/executor/commands/eval.ts:213-214 (commento)
        // isAbstract/...). Ambiguous-within-class names are left unbound (the
        // standard property-not-found applies — not recorded in the ambiguity map).
```
```
jjscript/executor/commands/eval.ts:222-226
        for (const [nm, a] of directByName) {
            if (a.length !== 1) continue;   // ambiguous within class -> unbound
            if (nm in classObj) continue;   // structural key wins
            classObj[nm] = a[0];
        }
```

«Stesso trattamento sull'asse owner» significa registrare anche questa ambiguita' invece di farla
cadere nel `property-not-found` generico — e registrarla richiede la stessa estensione di `jjel/`
del punto 3, piu' una chiave che sappia dire `Class.Name` e non solo `Name`.

---

## 3. La firma che il prompt impone rompe un consumatore fuori perimetro

Decisione 1 del prompt: «`findInstanceByName` diventa il lookup grezzo che ritorna la lista».

Censimento dei consumatori (`command grep -rn 'findInstanceByName' src`, 12 righe di cui 4
commenti e 4 in test):

| Sito | Uso | Effetto del cambio di firma |
|---|---|---|
| `instance.ts:129` (dentro `resolveInstanceHandle`) | `return findInstanceByName(model, handle)` | riscritto comunque dalla slice |
| `instance.ts:475` (conflitto di rename) | `const conflict = …; if (conflict && conflict.id !== lObject.id)` | va riscritto su lista |
| **`elementWaiter.ts:115`** | `if (findInstanceByName(m1Model, instanceName)) return false;` | **ROTTO IN SILENZIO** |
| `elementWaiter.test.ts:114-118` | `.toEqual({…})`, `.toBeNull()` ×2 | da aggiornare |
| `handleRegistry.test.ts:75` | `.toBeNull()` | da aggiornare |

Il terzo e' il pericoloso, e non da' errore di compilazione:

```
jjscript/executor/elementWaiter.ts:113-116
        if (m1Model) {
            const instanceName = dep.name.segments.join('::') || dep.name.raw;
            if (findInstanceByName(m1Model, instanceName)) return false; // resolved
        }
```

`[]` e' **truthy**. Con la firma a lista, ogni dipendenza M1 risulterebbe risolta al primo poll,
`waitForDependencies` uscirebbe subito e i comandi partirebbero prima che l'istanza esista — il
difetto opposto a quello che il waiter esiste per coprire. La traduzione corretta e'
`.length > 0`, una riga, in un file che **il perimetro del prompt non nomina**.

## 3.1 L'ambiguita' in jjscript esiste solo sul ramo di fallback

Da non perdere, perche' delimita cosa il verdetto deve coprire: `resolveInstanceHandle` consulta
**prima** il registro di handle, che e' per-id e per-run.

```
jjscript/executor/commands/instance.ts:123-129
    const id = getHandleId(handle);
    if (id) {
        const obj = LPointerTargetable.fromPointer(id) as any;
        if (obj && obj.id) return obj; // registry wins: id-based, race-free
        unregisterHandle(handle);      // stale (deleted) → clean up, fall through
    }
    return findInstanceByName(model, handle);
```

Lo scenario 6 di `handleRegistry.test.ts:158-166` e' esattamente il caso di omonimia e **non e'
ambiguo per costruzione**: un `x` pre-esistente e un `x` creato dallo script convivono, e il
registro vince. Quindi il verdetto a tre esiti nasce ambiguo **solo** quando l'handle non e'
registrato, cioe' per le istanze che pre-esistevano allo script — che e' precisamente il caso che
il censimento §2.1 descrive. Il ramo `ok` da registro non deve nemmeno costruire la lista.

---

## 4. Il seeding di `ProjectEditor` non e' un percorso di load

Il prompt lo descrive come «al load non blocca … il modello si apre». Misurato, le tre righe non
girano mai al caricamento di un progetto: stanno dentro `handleExecuteTransformation`
(`ProjectEditor.tsx:1391`), il callback di **esecuzione di una trasformazione JjTL**, protetto da
`isExecutingTransformation` (`:1375`, `:1397-1401`) e chiuso da un dispatch di
`SystemEvents.JJTL_EXECUTION_RESULT` (`:1982`).

```
components/project/ProjectEditor.tsx:1391-1395
        const handleExecuteTransformation = async (
            sourceModelId: string,
            outputModelName: string,
            ast: TransformationAST
        ): Promise<ExecutionResult | void> => {
```

Conseguenza: il vincolo «i duplicati preesistenti si aprono sempre» e' soddisfatto **per
costruzione** su questo sito — nessun progetto salvato passa di qui. Il comportamento chiesto
(non scrivere il puntatore, dichiarare) resta giusto e diventa piu' facile da concedere, perche'
non c'e' un percorso di apertura da proteggere. La riga che scrive e' `:1962`:

```
components/project/ProjectEditor.tsx:1956-1962
                                                const targetLObj = objects.find((o: LObject) => o.name === targetName);
                                                if (!targetLObj) { … continue; }
                                                const targetRealId = targetLObj.id;
                                                feature.setValueAtPosition(ri, targetRealId, { isPtr: true });
```

`:1888` e `:1929` risolvono l'oggetto **su cui** scrivere (ambiguo ⇒ si scriverebbe sull'oggetto
sbagliato); `:1956` risolve il **bersaglio** di un puntatore (ambiguo ⇒ si punterebbe altrove).
Tutti e tre su `lModel.objects`.

---

## 5. Il «path di containment» non disambigua in jjscript

Ultimo punto del perimetro: «i path di containment dei candidati (il disambiguatore naturale)».
Vale per meta' della slice, e va misurato prima di scrivere la copy.

```
model/logicWrapper/LModelElement.tsx:5561-5564
    protected get_objects(context: Context, includeCrossReferences: boolean = false): this['objects'] {
        let ret: LObject[] = context.data.objects.map((pointer) => LPointerTargetable.from(pointer));
```

`LModel.objects` e' `data.objects`, cioe' **le sole radici di un solo modello**. Due candidati
omonimi trovati da `findInstanceByName` hanno percio' **lo stesso** path di containment (il
modello), e stamparlo non distingue nulla: il disambiguatore reale li' e' la **metaclasse**
(piu' l'id come ultima risorsa).

Dove il path funziona davvero e' il ramo JjEL, il cui pool e' `allSubObjects` di **ogni** modello
M1 (`eval.ts:106-111`): li' i candidati stanno a profondita' e sotto owner diversi, e il path e'
esattamente cio' che li separa.

La copy va quindi decisa per meta': metaclasse nel ramo jjscript, path nel ramo JjEL. Scrivere
«path» in entrambi produrrebbe, in `delete X`, due righe identiche sotto a «which one?».

---

## 6. Perimetro reale, con cosa cambia in ciascun file

Nove file, contro i tre nominati. Regola 19: elencati prima del diff, non dopo.

**Sorgente — dentro il perimetro dichiarato**

1. `jjscript/executor/commands/instance.ts` — `findInstanceByName` torna la lista; nuovo verdetto
   a tre esiti in `resolveInstanceHandle` (`:122`); i quattro call site (`:372, :461, :547, :692`)
   riportano `reason` + `candidates` nella propria copy; il conflitto di rename (`:475`) riscritto
   su lista.
2. `jjscript/executor/commands/eval.ts` — `Class.Name` (`:222-226`) registra l'ambiguita' invece
   di lasciarla cadere; il binding nudo (`:330-341`) arricchito coi candidati. **Il ramo che non
   lega esiste gia' e non si tocca.**
3. `components/project/ProjectEditor.tsx` — `:1888`, `:1929`, `:1956` non scrivono su ambiguita' e
   la dichiarano; `:1962` resta non eseguita in quel caso.

**Sorgente — fuori dal perimetro dichiarato, e perche'**

4. `jjscript/executor/elementWaiter.ts` — **una riga** (`:115`), forzata dalla firma a lista
   imposta dalla decisione 1. Senza, difetto silenzioso (§3).
5. `jjel/evaluator/context.ts` — `AmbiguousInstanceInfo` e la variante `'ambiguous-instance'`
   guadagnano i candidati. **Solo se** si vuole «l'errore nomina i candidati» (§2).
6. `jjel/evaluator/evaluator.ts` — `:236-245` passa i candidati all'avviso. Stessa condizione.
7. `types/jodie.ts` — `:932-937`, la dichiarazione gemella della stessa variante. Stessa
   condizione.

**Test**

8. `jjscript/__tests__/handleRegistry.test.ts` (`:75` sulla nuova firma; nuovi casi ambigui),
   `jjscript/__tests__/elementWaiter.test.ts` (`:114-118`), e i nuovi casi per il verdetto.
   `jjel/__tests__/ambiguous-instance.test.ts` da estendere solo se si fa 5-7.

**Documenti**

9. `docs/decisions.md` (la ratifica che questa slice applica), questo referto,
   `docs/claude-code-log.md`.

---

## 7. Domande aperte — le tre che cambiano il diff

1. **`jjel/` entra o no?** «L'errore di valutazione nomina i candidati» non e' realizzabile dentro
   i tre file nominati: la forma dell'avviso vive in `jjel/evaluator/context.ts` +
   `evaluator.ts` + `types/jodie.ts`. Le opzioni sono (a) estendere il perimetro a quei tre e
   nominare i candidati davvero; (b) tenere `jjel/` fuori e lasciare l'avviso com'e'
   (`count` + `sampleClass`), limitando il punto 3 alla registrazione di `Class.Name`, che sta
   tutta in `eval.ts`. Non la decido io: e' Regola 20.
2. **La copy dei candidati in jjscript** — confermi metaclasse invece di path, dato §5? Forma
   proposta, asciutta e in inglese:
   `Ambiguous instance name 'X': 2 candidates — Config (Pointer…123), AllNine (Pointer…456). Rename one, or address it from the canvas.`
3. **`elementWaiter.ts:115`** — lo includo (una riga) o preferisci che `findInstanceByName`
   mantenga la firma singolare e la lista arrivi da una funzione nuova accanto? La prima segue la
   lettera della decisione 1; la seconda lascia il waiter e i suoi test intatti. La prima e' la
   piu' onesta, e la dichiaro qui invece di farla scivolare nel diff.

---

## 8. Limiti di questa misura

- **Sola lettura.** Nessuna sonda a runtime: il `delete X` ambiguo del censimento §2.1 e i due
  rami di `eval.ts` sono **letti**, non eseguiti. Le sonde sono il criterio della Fase 2 e non
  sono state scritte.
- **Il ramo `set X.attr` non e' stato distinto da `set X.ref`** dal punto di vista del rischio:
  entrambi passano da `:547`/`:692` e ricevono lo stesso trattamento, ma solo il secondo scrive un
  puntatore verso un oggetto risolto per nome. Se la ratifica volesse trattarli diversamente,
  questo referto non porta la misura per deciderlo.
- **`getByPath`/`getByFullPath` non ricontrollati**: il censimento li lascia non classificati e
  questa slice non li tocca.
- **HEAD si e' mosso durante la Fase 1**: S1a e' atterrata come `f32c5a4d3` (sei file:
  `nameUniqueness.ts`, `LModelElement.tsx`, `createAdapter.ts`, `createDraw.ts`,
  `jjform/create.ts`, `jjform/__tests__/create.test.ts`) mentre questo referto veniva scritto, e
  con lei la ritaratura della baseline smoke (`b2ffb9163`, `cfdacb9a4`). **Zero intersezione** con
  i nove file di §6, verificata con `comm -12` fra `git diff --name-only` e la lista: insieme
  vuoto. Le quattro righe portanti (`instance.ts:108`, `:122`, `elementWaiter.ts:115`,
  `eval.ts:223`) sono state rilette su `f32c5a4d3`: identiche.
- **`docs/decisions.md` e' modificato e non committato** da un'altra sessione a quest'ora: la
  ratifica di questa slice non ci va scritta finche' non si e' fermato (metodo §6.1 se conteso).

---

## 9. Esito della Fase 2 (aggiunto a valle dell'implementazione)

Le tre domande di §7 sono state decise dal design e cablate cosi':

1. **`jjel/` resta fuori** (Regola 20). Conseguenza misurata e non prevista dal prompt: il punto
   «binding nudo» si sarebbe ridotto a registrare `Class.Name` nella mappa di ambiguita', e quella
   sarebbe stata una **scrittura morta**. L'unico lettore della mappa e' `evaluator.ts:231`, sul
   ramo **Identifier**; il ramo di accesso a proprieta' (`:513-538`, letto per intero) emette
   `property-not-found` con suggerimento Levenshtein e **non consulta mai**
   `ctx.ambiguousInstances`. Inoltre ogni nome che rende `Class.Name` ambiguo e' **gia'** nella
   mappa sotto il nome nudo: `instances` (`eval.ts:194-205`) e' un sottoinsieme del pool su cui
   `instancesByName` (`:321-328`) e' costruita, quindi due istanze dirette omonime implicano
   `instancesByName.get(nm).length >= 2` e la registrazione a `:339`. Non c'e' niente da
   aggiungere che qualcuno legga. **Zero diff in `eval.ts`**: il test atteso «`Class.Name`
   ambiguo: registrato, non piu' muto» non e' soddisfacibile dentro il perimetro, perche' «non
   muto» vive nel lettore. Passa alla micro-slice `jjel/`.
2. **Copy con la metaclasse**, come misurato in §5. Un solo costruttore (`describeAmbiguity`).
3. **`elementWaiter.ts:115` e' entrato**, una riga, col suo test che **fissa la trappola**
   (`Boolean([]) === true` accanto a `[].length > 0 === false`), perche' un difetto che non da'
   errore di compilazione va pinnato o torna.

**Sigla.** Il prompt chiamava questa ratifica «R-S1-3»; nel frattempo S1a ha committato R-S1-3 con
un altro significato. La ratifica di questa slice e' **R-S1-5** in `docs/decisions.md`, e i
riferimenti nel sorgente sono stati allineati.

**Cancelli.** `npm run typecheck` **33 = baseline su output completo** (l'unica riga che nomina un
file toccato e' `ProjectEditor.tsx(220,67)`, pre-esistente e gia' nella lista dei 33 di CLAUDE.md
§17); `npx vitest run` **2100 passed / 0 failed**, **+7 esatti** (5 in `handleRegistry.test.ts`,
2 in `elementWaiter.test.ts`, contati con `git show HEAD:` prima e dopo), coi 9 file rotti
all'import = baseline nota — fra cui `context-binding.test.ts`, che fallisce su
`monaco-editor/.../window.js:14 ReferenceError: window is not defined`, non per questa slice;
`npm run build` exit **0** col solo chunk-warning.

**Smoke.** Prima corsa **VOID** — la sessione parallela S2 ha salvato `IRForm.tsx`,
`IRFormField.tsx`, `deleteAdapter.ts`, `multiAdapter.ts` dentro la finestra, nominati dal blocco
RUN VALIDITY; nessuno dei quattro e' di questa slice. Ripetuta su albero fermo:
**GREEN, 12 passed / 0 failed / 3 skipped, `moved: nothing`, un boot per stato.**

**Sonda dedicata** `_tmp_s1b_verify.ts`, **11/11 ALL GREEN, zero errori di pagina**. Guida il
**modulo vero** importato dal sorgente vivo (`import('/src/jjscript/executor/commands/instance.ts')`,
che il dev server Vite trasforma): nessun mock, store vivo, proxy L veri. Reperto d'ambiente da non
riscoprire: tsx compila con `keepNames` di esbuild, che riscrive ogni funzione con nome in
`__name(fn, "…")`; quell'helper non esiste nel browser, quindi ogni `page.evaluate` che contenga
una arrow assegnata a una const muore con `ReferenceError: __name is not defined` **prima** della
prima riga della sonda. Lo shim e' un `addInitScript` che definisce `__name` come identita'.

Cosa la sonda misura, in ordine:

- il fixture dei duplicati costruito **come si presentano al caricamento** — `SetFieldAction` su
  `data.name`, che non passa da `set_name` e quindi non incontra la guardia di R-S1-2 — e
  verificato omonimo **sul proxy** (`get_name`), non solo nel D: `AllNine` non dichiara `name`,
  quindi `$name.value` non copre `data.name`. Scelta misurata, non assunta;
- verdetto ambiguo: `ok=false`, nessun `value`, **2** candidati, copy che nomina `AllNine (…)`;
- **`delete CLK` ambiguo: rifiuta e non cancella nulla** — `DObject` 10 -> 10, entrambi vivi,
  `code: AMBIGUOUS_INSTANCE`;
- **`set CLK.widthPx` ambiguo: rifiuta e non scrive** — nessuno dei due slot si muove;
- **contrasto**, che e' la parte che rende il punto sopra una misura e non un'assenza: dopo aver
  disambiguato, lo **stesso** `set` passa e scrive (`[] -> [42]`). Senza questo, «non scrive»
  sarebbe stato verificato contro uno slot gia' vuoto;
- **contrasto** sul nome unico: resta risolto esattamente come prima.
