# Discovery — #168 B (J5), il profilo vale anche quando Jodie esegue

**Prompt-ID**: P-2026-10-01-2302 (`docs/prompts/claude_2026-10-01_2302_prompt_168_b_guard.md`)
**Sessione**: c2d50bbb-8ffd-433d-8d3a-2abbb23bf5d0 (da `~/.jjodel-lanes/P-2026-10-01-2302/session.txt`)
**Tree**: `/Users/juridirocco/development/jjodel-168-guard`, branch `168-guard` @ `8961023e1`
**Esecutore**: Anthropic Claude Opus 5.5
**Stato**: Fase 1, sola lettura sul codice. Il referto è un insieme di ipotesi con evidenze, non un
riferimento definitivo: chi lo usa a valle rilegge i file reali.

## 0. Answer in brief

- Tutti i punti d'ingresso vivi passano da `JjScriptExecutor.executeAST` (`executor.ts:97`), e anche i
  corpi di `block`, `let` e `forall` vi rientrano (`executor.ts:249`, `let.ts:55`, `forall.ts:91`).
  Un solo controllo lì, dopo l'attesa delle dipendenze e prima dello `switch`, li copre tutti.
- Il disegno regge con quattro deviazioni. La principale: il profilo si legge **nell'esecutore**, dal
  vivo (`activeProfileId()`), non da un campo `ExecutionContext.profileId` scritto da
  `JjScriptService.execute`. `JjodieAPIImpl.ts:194` chiama `executeCommand` scavalcando il servizio:
  oggi nessuno importa quel modulo (misurato), ma un campo impostato dal servizio lascerebbe scoperto
  ogni chiamante diretto, presente o futuro. Così `types.ts` e `JjScriptService.ts` restano intatti
  (niente Rule 11), e i file di codice sono 3, non 5.
- Classificazione dello `switch`: in lettura `list`, `show`, `help`, `validate`, `eval` (nessuna
  chiamata di scrittura, con controllo positivo, §3.2); in scrittura tutto il resto; `block`, `let`,
  `forall` sono contenitori che rientrano nel dispatch.
- In developer mode (nessun `?profile=`) il controllo esce prima di risolvere qualunque cosa:
  l'esecuzione resta byte per byte quella di oggi.
- Il modulo puro `permissionGuard.ts` importa solo `joiner/environmentConfig.ts` (zero import), quindi
  gira sul banco `node` come `scopeGuard.ts`.

Domande, ciascuna con la sua raccomandazione:

1. Da dove legge il profilo l'esecutore?
   Recommended: `activeProfileId()` dal vivo in `executeAST`, nessun campo su `ExecutionContext`; `types.ts` e `JjScriptService.ts` non si toccano.
2. `?profile=` presente ma il profilo non si risolve (il guasto del triage #157, `resolveTypePermission(null)` = `edit`)?
   Recommended: rifiutare ogni scrittura con `PROFILE_NOT_FOUND`; i comandi di lettura passano.
3. Istanza o classe che il controllo non riesce a risolvere (assente, ambigua, annidata)?
   Recommended: rifiutare con `PROFILE_UNRESOLVED` e la frase dell'handler, così un cambio della risoluzione in `instance.ts` (J4) fallisce chiuso.
4. `findMetaclassByName` è privata in `instance.ts` (`:81`), che non si modifica: come si trova la classe di `create instance of X`?
   Recommended: un walker puro in `permissionGuard.ts` che restituisce tutte le classi col nome esatto; devono essere tutte `edit`.
5. `block` (`do … end`) in consumer?
   Recommended: consentito come contenitore; ogni figlio passa dal controllo.
6. `list`/`show`/`eval`/`validate` possono nominare istanze di tipi `hidden`; `delete` a cascata e un link di contenimento toccano figli o bersagli `read`.
   Recommended: fuori da J5, come oggi nel Configurator; due ticket per J2 e J4 (con la misura M0 sul contenimento).
7. Ordine rispetto a `checkBoundScope`?
   Recommended: prima del controllo di scope e dopo l'attesa delle dipendenze, così in consumer parla per primo il messaggio del profilo.

Decisions awaiting Alfonso (lista di RC-26): nessuna. Nessun file di §3.1, nessuna interfaccia
esportata cambiata (con la raccomandazione 1), nessuna cancellazione.

## 1. Ipotesi sotto verifica

| # | Ipotesi | Esito |
|---|---------|-------|
| H1 | Un controllo prima del dispatch in `executeAST` copre ogni punto d'ingresso | **Regge** (§3.1) |
| H2 | `list`, `show`, `help`, `eval`, `validate` non scrivono il modello | **Regge** per il modello (§3.2); `clear` scrive solo la cronologia dell'esecutore |
| H3 | Il profilo può arrivare come `ExecutionContext.profileId` scritto da `JjScriptService.execute` | **Parzialmente falsificata**: copre i chiamanti vivi, non `executeCommand` diretto (§3.3) |
| H4 | L'adattatore può riusare la risoluzione dei nomi esportata dagli handler | **Parzialmente falsificata**: le istanze sì, la classe per nome no (§3.4) |
| H5 | Un rifiuto per comando non interrompe in silenzio lo script | **Regge** (§3.6) |
| H6 | Il permesso è della classe esatta dell'istanza, come nel Configurator | **Regge** (§3.5) |

## 2. File letti

Per intero: `CLAUDE.md`, `docs/PROTOCOL.md`, `frontend/src/jjscript/CLAUDE.md`,
`frontend/src/jjscript/executor/executor.ts`, `frontend/src/jjscript/executor/scopeGuard.ts`,
`frontend/src/jjscript/services/JjScriptService.ts`, `frontend/src/joiner/environmentConfig.ts`,
`frontend/src/components/environment/consumerMode.ts`, `frontend/src/jjscript/executor/commands/instance.ts`,
`frontend/src/jjscript/executor/commands/undoredo.ts`.

Per finestre (righe indicate): `docs/decisions.md` 1-272 (Processo, RC-3..RC-32) più grep su
`environment|jodie|profil`; `docs/claude-code-log.md` 1-80; `frontend/scripts/smoke/README-probes.md`
1-120 più titoli 120-357; `frontend/src/jjscript/types.ts` 36-335 e 440-598;
`frontend/src/jjscript/executor/commands/create.ts` 215-275; `set.ts` 25-60; `delete.ts` 25-50;
`rename.ts` 30-62; `let.ts` 30-70; `forall.ts` 60-100; `validate.ts` 1-80;
`frontend/src/jjscript/executor/utils.ts` 165-210; `frontend/src/jjscript/executor/resolvers.ts` 380-420,
505-530; `frontend/src/jjel/evaluator/evaluator.ts` 720-800;
`frontend/src/components/Jodie/ChatMessages.tsx` 395-470;
`frontend/src/components/Jodie/console/providers/jjscriptProvider.ts` 1-40;
`frontend/src/jjscript/components/ScriptBlock.tsx` 460-528;
`frontend/src/jjscript/components/ScriptExecutionWindow.tsx` 252-275;
`frontend/src/jjscript/components/JjScriptConsole.tsx` 30-70;
`frontend/src/jodie-integration/JjodieAPIImpl.ts` 150-240;
`frontend/src/components/environment/ConfiguratorTab.tsx` 1-100, 160-205;
`frontend/src/components/abstract/tabs/InstanceDetail.tsx` 20-60, 240-256, 330-352;
`docs/discovery/2026-06-12_jjscript_m1_coverage.md` (gap list, righe 138-166);
`docs/prompts/claude_2026-10-01_2301_prompt_168_a_context.md` e `_2300_prompt_168_m0_measures.md` (DOVE).

Non letti: `docs/discovery/discovery_2026-09-14_jjodie_scope_fix_targets.md` (il modello da seguire è
`scopeGuard.ts`, letto per intero); il resto di `docs/decisions.md` (righe 273-4395, serie di dominio).

## 3. Findings

### 3.1 Punti d'ingresso (H1, read + grep)

Ricerca: `command grep -rn -E '\b(executeCommand|executeBatch|executeScript|getExecutor|new JjScriptExecutor|JjScriptService\.execute|\.executeAST)\('`
su `frontend/src` (esclusi i test), poi una seconda sugli **import**, che ha trovato l'alias che la
prima non vedeva (`executeCommand as jjScriptExecuteCommand`).

| Ingresso | Dove | Arriva a `executeAST`? | Vivo? |
|----------|------|------------------------|-------|
| `JjScriptExecutor.execute` | `executor.ts:90` «`return this.executeAST(parseResult.ast);`» | sì | sì |
| `executeCommand` | `executor.ts:372-373` (`getExecutor(...)` poi `executor.execute(input)`) | sì | sì |
| `executeBatch` / `executeScript` | `executor.ts:390,396`; `:421` | sì | nessun chiamante fuori da `executor.ts` (grep sopra) |
| `JjScriptService.execute` | `JjScriptService.ts:60` «`executeCommand(command, projectId, modelId, targetMetamodelId, level, !!scope)`» | sì | sì |
| «Applica» di Jodie (ScriptBlock) | `ChatMessages.tsx:437` «`await JjScriptService.execute(command, scope)`» | sì | sì |
| Console di Jodie | `jjscriptProvider.ts:21` «`await JjScriptService.execute(input)`» | sì | sì |
| `JjScriptConsole` | `JjScriptConsole.tsx:51` «`executeCommand(command, projectId, modelId)`» | sì | non montata: nessun `JjScriptConsole` fuori da `jjscript/` |
| `ScriptExecutionWindow` | `ScriptExecutionWindow.tsx:256` «`await onExecute([command], target.id)`» (callback del chiamante) | dipende dal chiamante | non montata fuori da `jjscript/` |
| `JjodieAPIImpl.executeCommand` | `JjodieAPIImpl.ts:8` alias; `:194` «`await jjScriptExecuteCommand(command, projectId, modelId, targetMetamodelId)`» | sì, **senza** il servizio | nessun import di `jjodie-integration` fuori dalla cartella: i 3 file che lo nominano lo fanno in commento |
| `block` | `executor.ts:249` «`lastResult = await this.executeAST(cmd, context);`» | sì, per figlio | sì |
| `let` | `let.ts:54-55` «`const executor = getExecutor();` / `return executor.executeAST(resolvedBody, letContext);`» | sì | sì |
| `forall` | `forall.ts:72,91` «`const result = await executor.executeAST(resolvedBody, childContext);`» | sì, per elemento | sì |

Gli handler di `commands/` non hanno chiamanti diretti fuori da `executor.ts` e dai test (grep di
`executeLet|executeForAll|executeEval\(`: solo `executor.ts:192,195,198` e le definizioni).

**Raccomandazione.** Il controllo va in `executeAST`, dopo `waitForDependencies` (`executor.ts:106-118`)
e prima del controllo di scope (`executor.ts:123`). Dopo l'attesa per due ragioni: il controllo e
l'handler devono vedere lo stesso stato, e `resolveInstanceHandle` ha un effetto collaterale
(`instance.ts:194` «`unregisterHandle(handle);      // stale (deleted) → clean up, fall through`»).
Chiamato prima dell'attesa, potrebbe cancellare un handle il cui oggetto non è ancora nel negozio. Tra
il ritorno del controllo e la risoluzione dell'handler non c'è nessun `await`: `executeSet` →
`executeSetInstance` → `resolveInstanceHandle` (`set.ts:49-50`, `instance.ts:644-645`) gira nello
stesso tick, quindi le due risoluzioni coincidono. Costo: un comando rifiutato aspetta al massimo
`MAX_WAIT_MS = 500` (`elementWaiter.ts:18`) prima del rifiuto, come già fa `checkBoundScope`.

### 3.2 Lo `switch` di `executeAST`, lettura o scrittura (H2, read + grep, misurato su `8961023e1`)

Ricerca di scrittura: `command grep -c -E 'SetFieldAction|TRANSACTION|\.new\(|\.delete\(|DeleteElementAction|\.value *= |\.values *= '`
per file. Controllo positivo, stesso comando e stessa regex (più `executeCreate\(|addChild`) sugli
handler di scrittura: `create` 24, `delete` 17, `copy` 43, `remove` 6, `move` 4, `set` 4,
`extends` 3, `abstract` 2, `rename` 2, `add` 1. Sugli handler candidati: `list` 0, `show` 0,
`help` 0, `validate` 0, `eval` 0. Su tutto `frontend/src/jjel` (stessa regex, `-rc`): zero righe,
`grep` exit 1.

| Ramo | Riga | Classe | Evidenza |
|------|------|--------|----------|
| `create` | `executor.ts:143` | scrittura | `create.ts:234-236` instance → `executeCreateInstance` (`DObject.new`); altrimenti M2 |
| `delete` | `:146` | scrittura | `delete.ts:47` «`if (args.elementType === 'instance' \|\| context.level === 'M1') {`» |
| `rename` | `:149` | scrittura | `rename.ts:59`, stessa forma |
| `set` | `:152` | scrittura | `set.ts:49` «`if (context.level === 'M1') {`» → `executeSetInstance` |
| `add`, `remove`, `move`, `copy` | `:155-166` | scrittura (M2) | conteggi sopra |
| `list` | `:167` | lettura | 0 chiamate di scrittura; importa `resolvers`, `grammar`, `utils` |
| `show` | `:170` | lettura | 0 |
| `help` | `:173` | lettura | testo statico; le uniche `=` sono esempi (`help.ts:244-245`) |
| `undo`, `redo` | `:176-181` | scrittura per costruzione | esegue le chiusure di `undoStack`; l'unico `push` è nel redo (`undoredo.ts:87`), quindi oggi è inerte |
| `clear` | `:182` | non il modello | `clear.ts:23` «`context.history = [];`»; il disegno lo rifiuta comunque |
| `validate` | `:185` | lettura | 0; `resolveElement` + `validateElement` locale |
| `extends`, `abstract` | `:188`, `:200` | scrittura (M2) | conteggi sopra |
| `eval` | `:191` | lettura | 0; JjEL chiama solo funzioni JjEL: `evaluator.ts:776-777` «`const methodValue = obj[method];` / `if (isJjelFunction(methodValue)) {`» |
| `let`, `forall` | `:194`, `:197` | contenitore | rientrano in `executeAST` (§3.1); il disegno li rifiuta |
| `block` | `:203` | contenitore | `executor.ts:249`; si ferma al primo errore (`:253`) e lo riporta (`:263`) |
| `default` | `:206-212` | già rifiutato | `UNKNOWN_COMMAND`; misurato col parser vero: `export` e `import` non arrivano nemmeno qui («Unknown command: export») |

Lettura del modello non vuol dire lettura senza conseguenze: `list`/`show`/`eval`/`validate` possono
nominare istanze di tipi `hidden`. Non è un criterio di J5 (domanda 6).

### 3.3 Da dove viene il profilo (H3, read)

`consumerMode.ts:13` «`export function activeProfileId(): string | null {`», `:15` «`return U.getHashParam('profile');`».
Il Configurator lo legge allo stesso modo (`ConfiguratorTab.tsx:57-58`, «`return U.getHashParam('profile');`») e risolve il profilo con
`findProfile(idlookup, profileId)` (`:82`).

Il campo `ExecutionContext.profileId` del disegno sarebbe scritto solo da `JjScriptService.execute`.
I due chiamanti vivi passano di lì, ma `executeCommand` è esportato (`jjscript/index.ts:40`, e default a `:130-131`) e
`JjodieAPIImpl.ts:194` lo chiama senza il servizio. Un campo del contesto protegge chi lo imposta, la
lettura nell'esecutore protegge ogni chiamante. Si propaga anche ai figli senza lavoro: `let` e
`forall` copiano il contesto (`let.ts:39-42` «`...context,`»), ma la lettura dal vivo non ne ha
bisogno.

`executor.ts` può importare `activeProfileId`: `jjscript` dipende già da `components/` (`utils.ts:8`
«`import DockManager from '../../components/abstract/DockManager';`»). La lane A non modifica
`consumerMode.ts`: il suo DOVE (`claude_2026-10-01_2301_prompt_168_a_context.md:128-135`) elenca
`registry.ts`, `ConfiguratorTab.tsx`, `Jodie.tsx` e un modulo nuovo; `consumerMode.ts` vi compare
solo come riferimento (`:170`). Il controllo di RC-22 regge.

Profilo nell'URL ma non risolto: `resolveTypePermission(null, …)` restituisce `'edit'`
(`environmentConfig.ts:80` «`if (!profile) return DEFAULT_TYPE_PERMISSION;`»). È il guasto che il
triage #157 ha trovato dietro quattro sintomi (log del 2026-09-28). Il controllo deve distinguere
«nessun profilo» (developer) da «profilo assente» (consumer rotto): domanda 2.

### 3.4 Risoluzione dei nomi nell'adattatore (H4, read + parser misurato)

AST misurati col parser vero (`npx tsx` su uno script nello scratchpad, fuori dal tree):

- `create instance of Competency "c1"` → `{elementType:'instance', name:'Competency', options:{defaultValue:{kind:'string',value:'c1'}}}`
- `set c1.name = "x"` → `{target:{segments:['c1'],raw:'c1.name'}, property:'name', value:{kind:'string'}}`
- `set c1.owner = p1` → `value:{segments:['p1'],raw:'p1'}`; `= "p1"` → `{kind:'string'}`; `= null` → `{kind:'null'}`
- `delete instance c1` → `elementType:'instance'`; `delete c1` → nessun `elementType` (all'M1 va comunque all'istanza)

Esportati e riusabili: `resolveTargetModel` (`instance.ts:60`), `findInstanceByName` (`:117`),
`resolveInstanceHandle` (`:189`). Il nome dell'istanza si deriva come l'handler,
`instance.ts:445,545,644` «`const instanceName = args.target.segments.join('::') || args.target.raw;`»,
e il bersaglio del link come `:796-798` (`lit.value` per una stringa, `.raw` per un nome).

**Deviazione 1.** La classe per nome non è esportata: `findMetaclassByName` (`instance.ts:81`) è
privata. Il risolutore pubblico `findClassInMetamodel` (`resolvers.ts:385-393`) confronta in
minuscolo (`cls?.name?.toLowerCase() === nameLower`), mentre l'handler confronta esatto
(`instance.ts:92` «`if (c?.name === className) return c as LClass;`»), quindi potrebbe controllare
una classe diversa da quella che l'handler crea. Proposta: un walker puro con gli stessi contenitori
dell'handler (`classes`, `subpackages`/`subPackages`, `packages`) che restituisce **tutte** le classi
col nome esatto, tutte da verificare. Così l'ordine di visita dell'handler non conta, e il walker è
testabile sul banco (domanda 4).

**Deviazione 2.** Riferimento o attributo: anche `classifyMetaclassProperty` è privata
(`instance.ts:232`). L'adattatore legge `allReferences ?? references` della classe dell'istanza per
nome, la stessa lettura di `:236-237`, e controlla il bersaglio solo per un riferimento con valore non
`null`.

**Deviazione 3.** Non risolto vuol dire rifiutato (domanda 3). Oggi la risoluzione del controllo e
quella dell'handler coincidono (stessa funzione, stesso tick), quindi lasciar passare un nome non
risolto sarebbe innocuo. Ma `instance.ts` lo cambierà J4 (G4/G7: istanze annidate, nomi qualificati):
se l'handler imparasse a trovare un'istanza che il controllo non trova, quell'istanza verrebbe scritta
senza controllo. Fallire chiusi rende la divergenza visibile.

### 3.5 Il permesso è della classe esatta (H6, read)

`InstanceDetail.tsx:251-252` («`const permOfInstance = …`», «`permOfClass(id ? idlookup?.[id]?.instanceof : null);`»)
e `:474` «`const canDelete = !!openDelete && permOfInstance(subjectId) === 'edit';`». Il Configurator
non guarda né i figli che una cancellazione si porta via né i supertipi. L'adattatore legge
`idlookup[id].instanceof`, la stessa lettura. La cancellazione a cascata (`instance.ts:495`
«`(lObject as any).delete();`», commento a `:489` «Canonical cascade delete») e lo spostamento di un bersaglio di
contenimento sono lacune condivise col Configurator, non introdotte qui (domanda 6).

### 3.6 Il rifiuto non è silenzioso (H5, read)

Un comando che ritorna `success: false` in ScriptBlock mette in pausa lo script con il dialogo e il
pulsante Skip (`ScriptBlock.tsx:482-521`: `:510` «`setExecutionState('paused');`», `:509` «Show error dialog
with Skip option»). Il messaggio arriva dall'errore dell'esecutore (`errorFromResult(result, …)`, `:485`;
`ChatMessages.tsx:445` passa `errors: result.errors`). `block` si ferma al primo figlio fallito e lo
dice (`executor.ts:263` «`Block: failed at command ${total}/…`»). La forma del rifiuto copia quella di
`checkBoundScope` (`executor.ts:128-134`). Come l'interfaccia mostra i rifiuti è di J4.

## 4. Piano per la Fase 2 (con le raccomandazioni)

**File di codice (3, invece di 5):** `executor/permissionGuard.ts` (nuovo, puro),
`executor/__tests__/permissionGuard.test.ts` (nuovo), `executor/executor.ts` (aggancio). Con la
raccomandazione 1, `types.ts` e `JjScriptService.ts` non si toccano.

**Modulo puro.** `checkCommandPermission(cmd, env)` → `PermissionRefusal | null`, dove
`env = { profileId, profile }` e `cmd` porta `command`, `level`, `elementType`, le classi candidate
di una create (`{id, name}[]`), la classe del soggetto o il motivo per cui non si è risolto, la classe
del bersaglio di un link o il suo motivo. Più `metaclassesNamed(metamodel, name)`, il walker della
deviazione 1. Importa `resolveTypePermission` da `joiner/environmentConfig.ts` e nient'altro a runtime.

**Politica** (solo con `profileId` non nullo):

| Comando | Livello | Regola | Codice del rifiuto |
|---------|---------|--------|--------------------|
| `list`, `show`, `help`, `eval`, `validate` | qualunque | consentito | — |
| `block` | qualunque | consentito; ogni figlio è controllato | — |
| qualunque altro, profilo non risolto | qualunque | rifiutato | `PROFILE_NOT_FOUND` |
| `create` instance | M1 | ogni classe col nome esatto è `edit`; nessuna classe → `PROFILE_UNRESOLVED` | `PROFILE_TYPE_LOCKED` |
| `set`, `rename`, `delete` (senza `elementType` o `instance`) | M1 | classe esatta dell'istanza `edit`; non risolta o ambigua → `PROFILE_UNRESOLVED` | `PROFILE_TYPE_LOCKED` |
| `set` su riferimento con valore non `null` | M1 | in più, classe del bersaglio non `hidden`; non risolto → `PROFILE_UNRESOLVED` | `PROFILE_HIDDEN_TARGET` |
| `create`/`delete`/`rename` con `elementType` M2 | M1 | rifiutato | `PROFILE_LANGUAGE_LOCKED` |
| `create`, `set`, `delete`, `rename` | non M1 | rifiutato (con `elementType` instance: `PROFILE_UNRESOLVED`, «nessun modello in primo piano») | `PROFILE_LANGUAGE_LOCKED` |
| `add`, `remove`, `move`, `copy`, `extends`, `abstract` | qualunque | rifiutato | `PROFILE_LANGUAGE_LOCKED` |
| `let`, `forall`, `undo`, `redo`, `clear`, sconosciuto | qualunque | rifiutato | `PROFILE_COMMAND_LOCKED` |

I codici `PROFILE_*` non esistono oggi in `frontend/src` (grep `'PROFILE_|PERMISSION_`: l'unica
occorrenza è `PERMISSION_OPTIONS` in `ProfilesStep.tsx:29`, un'altra cosa).

Messaggi (inglese, col nome del tipo): «You can't create Competency elements in this environment.»,
«You can't change …», «You can't delete …», «You can't link to … elements in this environment.»,
«This environment doesn't allow changing the language itself.», «'forall' isn't available in this
environment.», «This environment's profile can't be found, so changes are turned off.».

**Test e banco.** Tabella comando × permesso (`edit`, `read`, `hidden`, nessun profilo, profilo non
risolto). Mutazioni: `read` trattato come `edit`; tolto il controllo su `set`; comandi sconosciuti
consentiti; bersaglio `hidden` ignorato; più due mie: profilo non risolto trattato come developer, e
solo la prima classe omonima controllata. Gap dichiarato in anticipo: l'adattatore in `executor.ts`
non si importa sul banco (`window is not defined` dal barrel `joiner`), quindi la sua parte (la
lettura dell'URL, la risoluzione, l'aggancio prima dello `switch`) la copre solo la sonda in browser.

**Sonda (porta 3043).** Basata in sola lettura su `_tmp_157_r5_verify.ts` e `_tmp_157_158_globals.ts`
del tree principale (esistono, verificato con `ls`); la porta 3043 è libera (`lsof` exit 1).

## 5. Rischi

- **Developer mode intatto.** Con `activeProfileId()` nullo il controllo esce prima dell'adattatore:
  nessuna `resolveInstanceHandle` in più, nessun effetto sul registro degli handle.
- **Dipendenze tra lane.** `instance.ts` cambierà con J4: la deviazione 3 fa fallire chiuso il caso in
  cui le due risoluzioni divergono. `consumerMode.ts` è importato, non toccato. La entry nell'inbox
  condivisa si unisce per unione.
- **Severità.** Il controllo è frontend come tutto #157 (D1, soft gate): impedisce a Jodie e alla
  console di scrivere ciò che il profilo vieta, non è controllo d'accesso.
- **`clear` rifiutato** dal disegno: innocuo per il modello (§3.2). Se dà fastidio nella console
  consumer, si può spostare tra i consentiti in un secondo momento.

## 6. Decisions taken (unattended)

Nessuna: le sette domande del §0 aspettano la risposta del GO.

## 7. Decisions awaiting Alfonso

Nessuna della lista di RC-26.
