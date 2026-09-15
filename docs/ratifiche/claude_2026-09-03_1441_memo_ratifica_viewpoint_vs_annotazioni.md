# Memo di ratifica: viewpoint vs annotazioni per il Data Manager (serie R-VP)

**Data**: 2026-09-03 (pomeriggio, R-VP-1..7; sera, R-VP-8..13)
**Branch**: `alfonso-frontend-jjtl`, HEAD di riferimento `d32349614` (pomeriggio), `4392bc30e` (sera)
**Report di riferimento**: `docs/discovery/discovery_2026-09-03_rvp_slice1_manager_section.md` (per R-VP-9..13)
**Ratifica**: a voce da Alfonso in chat («d'accordo» per 1..7, «per adesso va bene questo» per 8, GO per 9..13)

## Il problema

Gli aspetti visuali del Data Manager (colonne, ordine dei campi, renderer, label) vivevano in
parte nelle annotazioni `jjodel/*` del metamodello (`unit`, `min`, `max`, `renderer`, `multiline`)
e in parte nel viewpoint (preset). Alfonso ha chiesto se non dovessero stare in qualcosa di simile
a un viewpoint, e in un secondo momento se il manager meritasse un viewpoint dedicato.

## Decisioni

**R-VP-1, criterio di collocazione.** Nel metamodello va ciò che cambia significato o validità dei
dati; nel viewpoint ciò che cambia solo come i dati vengono mostrati o editati. Il criterio è
semantico, non visuale.

**R-VP-2, destinazione delle cinque chiavi.** `unit`, `min`, `max` diventano attributi di un tipo
scalare raffinato (intenzione del 30/8, es. `Temperature = EInt in [-50, 150] unit "°C"`);
`renderer`, `multiline` vanno nel viewpoint, nella libreria di row view condivisa.

**R-VP-3, nessun viewpoint del manager.** I suoi aspetti visuali sono una sezione della stessa view
per classe, additiva su ir-1.3 nello stile del `FormSpec`. Un viewpoint separato comprerebbe solo
la selezione indipendente canvas/manager e costerebbe una regola di risoluzione in più, la
divergenza dei renderer tra le due superfici e una seconda mappa classe → view.

**R-VP-4, il viewpoint è override, mai prerequisito.** Il manager funziona col default derivato
dal tipo quando la sezione non c'è.

**R-VP-5, ladder a tre gradini** (viewpoint, tipo, default). Il gradino annotazione sparisce per
cancellazione, senza convertitore: Alfonso ha dichiarato che nessun progetto usa le `jjodel/*` a
parte i suoi di prova. Il todo sul round trip `.ecore` si chiude per sottrazione.

**R-VP-6, encoding annotazione congelato.** Nessuna nuova chiave `jjodel/*`, nemmeno per la coda
«not yet designed»; un prompt che ne avesse bisogno si ferma e colloca secondo R-VP-1.

**R-VP-7, nessun vincolo di major.** Sezione manager additiva; tipi raffinati con bump di
`DState.version.n` come per TextStyle; rimozione senza migrazione. «3.0» è la release marcata nei
docs, una scelta di comunicazione.

**Emendamento alla regola FL** («il metamodello decide il layout della form»): resta «nessuna
larghezza per campo, mai»; cade «le correzioni promuovono al metamodello come annotazioni». Una
correzione promuove al tipo se semantica, al viewpoint se presentazionale.

**R-VP-8, perimetro della customizzazione.** Riaperta e riconfermata R-VP-3. Customizzare la form
del manager significa scegliere quali campi, in che ordine, in quali sezioni, con quale renderer e
quale label; non significa disegnare la griglia. La customizzazione a runtime dell'utente finale
resta fuori dall'IR (le `ColumnOverrides` di sessione del manager esistono già e restano lì).
Forma scelta: override per host dentro lo stesso `FormSpec`, non `FormSpec` nominati (slice
futura). Il base `FormSpec` si estende con `order`, `labels`, `hidden`; «scegliere quali campi»
passa per `hidden` esplicito, mai per omissione, così R-FRM-1 (i compartimenti ordinano e
intitolano, non filtrano) resta intatta.

**R-VP-9, il rung 0 del manager è una slice a sé.** La discovery ha falsificato l'ipotesi che il
renderer di colonna del manager passi da `FormSpec.widgets`: `instanceTable.ts` passa alla ladder
il solo `rendererOverride` (annotazione), mai `viewRenderer`. Quindi `hosts.manager.widgets` vale
per la form del drawer soltanto, dichiarato nel tipo. Portare il rung 0 alla tabella (con la view
risolta per classe come parametro, `instanceTable.ts` resta puro) è la slice 1b, con la sua
verifica visiva.

**R-VP-10, `ManagerSpec` è solo `columns`.** Nel manager non esiste ordinamento: `sort` sarebbe una
funzionalità nuova (ordinatore, header, stato), non un default da dichiarare, e non entra.
`columns` ordina e porta in testa; le colonne non citate seguono nell'ordine di oggi e restano
visibili. Nascondere resta il canale unico di sessione (`InstanceManagerTab.tsx:1527`).

**R-VP-11, quale view porta `manager`.** Le colonne sono per metaclasse, le view si risolvono per
oggetto. Si considerano solo le view senza `predicate`, per specificità decrescente come
`resolveIRView`; una view con predicato che porta `manager` viene ignorata con un `console.warn`
una volta sola. Lettura dall'indice (`index.byMetaclass`), senza passare da `irCompile` e
`CompiledView`: non c'è nulla da compilare.

**R-VP-12, il nome è `hosts`, non `surfaces`.** `VertexViewIR.surface` (Q5, R-FORM-3, valori
`form | diagram`) è già ratificata e definitiva (R-B9). Per gli host della form (rail, nodo-form,
manager) il codice usa già la parola «host» (`FormTheme`, `useIRFormView.ts:6`): la chiave è
`FormSpec.hosts?: { manager?: FormHostOverride }`, con `FormHostOverride = Partial<Omit<FormSpec,
'hosts'>>`. Nessuna collisione: `hosts` compare solo in commenti, `FormHostOverride` a zero.

**R-VP-13, `order` ordina dentro il gruppo.** `buildFormSections` partiziona per gruppo
strutturale (attributi, reference, children) e i filtri preservano l'ordine in ingresso: `order`
riordina `visible` prima di `buildFormSections`, dentro la sezione che il tipo assegna al campo; non
sposta di sezione, non toglie nessuno; i non citati seguono i citati nell'ordine di oggi.

## Alternative scartate

Viewpoint dedicato (R-VP-3); `FormSpec` nominati e plurali (rimandati); `sort` nel `ManagerSpec`
(R-VP-10); `renderers` nel `ManagerSpec` come seconda mappa (R-VP-9); `surfaces` come nome
(R-VP-12); `order` globale con sezioni ricalcolate (R-VP-13); migrazione delle `jjodel/*` (R-VP-5).

## Debiti registrati, non da fare ora

`pruneForm` (`FormAuthoringBody.tsx:126-131`) non pota `hosts: {}`, `order: []`, `hidden: []`: va
fatto quando arriva l'authoring UI di queste chiavi. Il rung 0 del manager (slice 1b). L'addendum
FormSpec del 28/8 e `form-engine-contract.md` da allineare dopo il commit 2.

## Prossimo passo

Fase 2 della slice 1: `docs/prompts/claude_2026-09-03_2320_go_rvp_slice1_fase2.md`.
