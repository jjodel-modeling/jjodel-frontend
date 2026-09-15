# Discovery 2026-08-16 — I due viewpoint di sistema: `Default` e `Default Validation`

**Fase**: 1 (read-only). Nessun file di codice toccato.
**Domanda di partenza (Alfonso)**: «ha ancora senso portarci dietro i viewpoint Default e Default validation?»
**Albero analizzato**: working tree locale, branch `alfonso-frontend-jjtl`, HEAD `3726d315d`.
Working tree con una sola modifica non committata (`frontend/src/components/editor-v2/viewpoint/ir/useContentSize.ts`), fuori dal perimetro di questa discovery.
**Ambiente delle ricerche**: VM del bridge, `type grep` = `/usr/bin/grep` (GNU grep, non il wrapper ugrep della shell di Claude Code). Ogni asserzione di assenza qui sotto e' accompagnata dal controllo positivo che la sostiene (R-RAIL-28).

---

## 1. Obiettivo

Stabilire, sul codice reale e non sulla memoria di sessione:

1. che cosa fanno oggi i due viewpoint seminati all'init dello store;
2. quali sono i loro punti di aggancio nel codice, e quali di questi sono portanti;
3. se le loro funzioni sono coperte da sottosistemi piu' recenti;
4. che cosa costerebbe rimuoverli, e quali domande restano aperte per Alfonso.

## 2. File letti

Percorsi relativi a `frontend/src/`.

| File | Perche' |
|------|---------|
| `redux/store.tsx` (righe 300-520) | Seed dei due viewpoint e delle 23 view di default |
| `common/Defaults.ts` (righe 1-105) | Registri `views`, `viewpoints`, mappe derivate, `check()` |
| `redux/reducer/reducer.ts` (righe 1090-1115) | Bootstrap di `defaultViewPointsMap` / `defaultViewsMap` |
| `redux/selectors/selectors.ts` (righe 545-575) | Cascata di match, gradino `VP_Default` |
| `redux/VersionFixer.tsx` (righe 145-160, 995-1060) | Reiniezione dei default mancanti; migrazione inversa 2.225 -> 2.226 |
| `joiner/classes.ts` (righe 1181, 2899, 2924, 3314-3335, 3410-3460, 3976-4052) | `LProject.viewpoints`, `activeViewpoint`, scoring e `stackViews` |
| `view/viewElement/view.tsx` (righe 311-312, 543, 594, 844, 1835-1885) | Gate di cancellazione, `updateDefaultView`, carry-over IR |
| `components/abstract/tabs/EditorSwitch.tsx` | Stato dello spegnimento del canvas classico (Fase 5a) |
| `components/editor-v2/EditorV2.tsx` (righe 67-68, 3925-3935) | Mount dei producer di problemi |
| `components/editor-v2/problems/` (intera cartella) | Sottosistema di validazione corrente |
| `model/conformance/ConformanceValidator.ts`, `ConformanceTypes.ts` | Regole di conformita' oggi attive |
| `model/logicWrapper/nameUniqueness.ts` (riferimento) | Unicita' dei nomi |
| `components/megamodel/MegamodelView.tsx` (righe 138-145) | Esclusione dei due viewpoint dalla lista |
| `redux/defaults/views.ts` (intestazione) | Le 23 view di default citate da R-IRN-1 |
| `docs/decisions.md` (serie R-IRN, righe 614-650), `docs/claude-code-log.md` (ultime entry) | Contesto normativo |

---

## 3. Findings

### F1. `Default Validation` contiene tre view, ed e' un circuito chiuso

Seminato in `redux/store.tsx:324` con `isValidation = true`, `isExclusiveView = false`. Contiene esattamente tre `DViewElement`, tutte create in `makeDefaultGraphViews`:

- `Generic error view` (`Pointer_ViewOverlay`, `store.tsx:362`): overlay decorativo, la sua `jsCondition` accende l'overlay quando `node.state` contiene chiavi con prefisso `error_` valorizzate;
- `Naming error view` (`Pointer_ViewCheckName`, `store.tsx:409`): view invisibile, `onDataUpdate` scrive `node.state.error_naming`;
- `Lowerbound error view` (`Pointer_ViewLowerbound`, `store.tsx:427`): view invisibile su `appliableToClasses = ['DValue']`, `onDataUpdate` scrive `node.state.error_lowerbound`.

Il segnale `error_*` non ha alcun consumatore fuori da queste tre view. Grep completa su `error_` in `frontend/src` (esclusi `examples/`): 19 occorrenze, di cui 11 sono template di tipo in `redux/action/action.ts` (`'_error_'`, `'_am_typeerror_'`), 2 sono `DV.error_string` (identificatore diverso), 1 e' una chiave React in `Dashboard.tsx`, e le restanti 5 sono le righe 363, 370, 371, 424, 442 di `store.tsx`, cioe' le tre view stesse. Exit status 0, conteggio preso sull'output completo e non su una finestra.

### F2. Le tre view di validazione sono inerti a runtime

Il canvas classico e' spento. `components/abstract/tabs/EditorSwitch.tsx:42` dichiara il prop `children` («Legacy classic editor JSX») **ignorato dallo spegnimento del classico, Fase 5a**; le righe 123-127 documentano la decisione B del 2026-07-17: le modalita' classic e split non sono piu' raggiungibili. `joiner/components.tsx:8` registra la rimozione di `GraphsContainer`. `components/editors/views/data/TemplateData.tsx:57` dichiara che una view senza `ir` «has no interpreter left».

L'overlay di errore puo' raggiungere lo schermo solo attraverso lo stack delle view decorative (`stackViews`, calcolato in `joiner/classes.ts:4033-4052` e consumato da `model/dataStructure/GraphDataElements.tsx:909`, `view/viewElement/view.tsx:594`, `redux/selectors/selectors.ts:620`). **`components/editor-v2/` non contiene nessuna occorrenza di `stackViews` ne' di `.state.error`** (grep exit 1 su quella cartella). Controllo positivo sulla stessa cartella e con lo stesso comando: `NodeProblemIndicator` da' 5 occorrenze, quindi la ricerca raggiunge il soggetto.

Conseguenza: le tre view non vengono ne' valutate ne' rese. Sono record persistiti che non producono comportamento.

### F3. Copertura funzionale: il lowerbound e' coperto, il controllo lessicale del nome no

Questa e' la correzione piu' importante rispetto all'analisi fatta in chat prima della discovery.

`model/conformance/ConformanceValidator.ts` produce violazioni tipizzate in `ConformanceTypes.ts`, tra cui `multiplicity_below_min`, `attr_multiplicity_below_min`, `multiplicity_upper_exceeded`, `attr_multiplicity_upper_exceeded`, `attribute_type_mismatch`, `abstract_instantiation`, `reference_target_type_mismatch`, `duplicate_id_value`, riferimenti pendenti. Sono agganciati al canvas e al tree da `components/editor-v2/problems/ConformanceProblemSync.tsx` (montato in `EditorV2.tsx:3931`), con doppia registrazione DObject/DVertex. `UniquenessProblemSync.tsx` (montato a `EditorV2.tsx:3930`) rispecchia le violazioni di unicita' dei nomi da `model/logicWrapper/nameUniqueness.ts`. Il registro conosce due specie: `NodeProblemKind = 'duplicate-name' | 'conformance'` (`problems/registry.ts:28`).

Mappatura:

- **Lowerbound**: coperto. La `Lowerbound error view` calcola `data.lowerBound - valuesLength` su `DValue`; e' esattamente `multiplicity_below_min` / `attr_multiplicity_below_min`, calcolato sul modello invece che come effetto collaterale di un render.
- **Naming, parte unicita'**: coperto da `UniquenessProblemSync` + `nameUniqueness.ts`.
- **Naming, parte lessicale**: NON coperto. La `Naming error view` verifica tre cose che nessun altro verifica: nome vuoto, primo carattere in `[\p{L}_$]`, e insieme dei caratteri ammessi (lettere, cifre, spazi, apostrofi, `$_`). Grep su `p{L}` in tutto `frontend/src` esclusi `examples/`: due sole occorrenze, entrambe in `store.tsx` (righe 422 e 423). Controllo positivo con la stessa forma di ricerca: la stringa `must be named` compare a `store.tsx:421`, quindi la ricerca funziona.

Quindi il viewpoint di validazione non e' interamente superato sul piano delle regole: e' superato su una regola e mezza su due, e la mezza rimanente e' comunque **inerte** per F2. Oggi un modello con un oggetto senza nome, o con un nome che comincia per cifra, non viene segnalato da nessuna parte.

### F4. `Default` non e' un viewpoint, e' il pavimento della risoluzione

`Pointer_ViewPointDefault` compare 7 volte in `frontend/src` (esclusi `examples/`), e almeno tre sono portanti:

- `redux/selectors/selectors.ts:557`: `dvp.id === 'Pointer_ViewPointDefault'` assegna `ViewEClassMatch.VP_Default`, cioe' il gradino di fallback della cascata di match. Senza quel gradino, un elemento privo di view nel viewpoint attivo cade su `VP_MISMATCH`. Nota: qui il confronto e' su una **stringa letterale**, non su `Defaults.Pointer_ViewPointDefault`.
- `redux/reducer/reducer.ts:1104`: il bootstrap di `defaultViewPointsMap` e `defaultViewsMap` e' condizionato sull'esistenza di quel puntatore come oggetto.
- `redux/store.tsx:327`: `Log.exDev` fallisce se il primo viewpoint creato non e' `Defaults.viewpoints[0]`.

Ospita inoltre la view `Fallback` (`Pointer_ViewFallback`), l'intera famiglia `DefaultViews` (model, package, class, enum, attribute, reference, operation, parameter, literal, object, singleton, value, anchor) e sei edge view (Association, Dependency, Inheritance, Aggregation, Composition, piu' una senza nome). `Defaults.views` conta 23 puntatori, coerente con le «23 view di default per progetto» di R-IRN-1.

La domanda sensata su `Default` non e' se tenerlo ma **se debba continuare a comparire in lista come pari grado dei viewpoint autorati**. Oggi:

- `LProject.viewpoints` (`joiner/classes.ts:3324`) prepone `Defaults.viewpoints` a quelli del progetto, quindi entrambi i viewpoint di sistema compaiono ovunque si legga quella lista;
- `components/megamodel/MegamodelView.tsx:143` li esclude **per nome**, e su tre varianti: `vp.name === 'Default' || vp.name === 'Validation default' || vp.name === 'Default Validation'`. Le tre varianti sono la traccia di rinomine storiche. Un utente che chiama «Default» un proprio viewpoint sparisce dal megamodel senza errore. Il puntatore esiste ed e' stabile: il confronto dovrebbe essere su quello;
- `view/viewElement/view.tsx:543`: `Defaults.check(id)` vera implica non cancellabile e non degradabile a decorazione. Quindi oggi l'utente **non puo'** cancellare ne' `Default` ne' `Default Validation`.

### F5. Rimuovere `Default Validation` e' contenuto ma non gratis

Punti di aggancio, tutti verificati sul tree locale:

1. `common/Defaults.ts:31` — `viewpoints = ["Pointer_ViewPointDefault", "Pointer_ViewPointValidation"]`. **Nessuna occorrenza di `viewpoints[1]` in tutto `frontend/src`** (grep exit 1; controllo positivo: `Defaults.viewpoints` da' 12 occorrenze, tutte con indice `[0]` oppure per spread/includes/reduce). Togliere il secondo elemento e' quindi contenuto.
2. `common/Defaults.ts:26-29 e 70-73` — i tre puntatori view e i quattro costanti statici.
3. `redux/store.tsx:324-327 e 362-443` — creazione del viewpoint e delle tre view, piu' la firma a due parametri di `makeDefaultGraphViews`.
4. `redux/VersionFixer.tsx:149-154` — reinietta in `idlookup` qualunque default mancante. Dopo la rimozione dai registri, i record non verrebbero piu' reiniettati: **restano pero' nei progetti gia' salvati** come record inerti, a meno di una migrazione che li purghi.
5. `view/viewElement/view.tsx:1861` — `updateDefaultView` rigenera i default trovati nei progetti caricati; smetterebbe di rigenerare questi tre.
6. `redux/VersionFixer.tsx:1009-1052` — la migrazione inversa 2.225 -> 2.226 marca `irLegacyClassic` tutto cio' che non riconosce come default generato dal tool. Il commento in `utils/defaultViewTemplate.ts:166-169` dichiara **esplicitamente** che `DV.semanticErrorOverlay` non e' coperta dai marker: «Deliberately NOT covered [...] `overlap` alone is too generic to qualify as a marker». La stessa nota e' ribadita a riga 185, dove `CLASSIC_ANCHOR_OVERLAY_MARKER` e' agganciato alla className interna dell'anchor proprio per non passare dal wrapper `overlap`. Le tre view di validazione finiscono quindi nel ramo legacy in ogni progetto salvato, e alimentano il rumore del censimento (1315 view su 1550) e la bonifica dei 60 progetti flaggati per errore, che R-IRN-2 dichiara prerequisito della slice 3.

Effetto collaterale da dichiarare: dopo la rimozione dai registri, un eventuale viewpoint di validazione **conservato** in un progetto vecchio smette di soddisfare `Defaults.check`, quindi diventa cancellabile ed editabile dall'utente (`view.tsx:543`). Probabilmente desiderabile, ma e' un cambio di comportamento su progetti esistenti e va deciso, non subito.

### F6. Osservazione incidentale, fuori perimetro

`redux/defaults/views.ts:23` contiene `import { vi } from 'vitest';` in un file di produzione. Non risulta usato nel resto dell'intestazione letta. Segnalato e non toccato (regola 1 e regola 9).

---

## 4. Dipendenze e rischi

| Rischio | Dove | Mitigazione |
|---------|------|-------------|
| Perdita del gradino di fallback | `selectors.ts:557` | Non toccare `Pointer_ViewPointDefault`. Se mai si volesse rinominare, il confronto e' su stringa letterale e non sulla costante: due punti da tenere allineati |
| Progetti salvati che contengono i 4 record | `VersionFixer` | Migrazione condizionata: purgare solo se il record e' identico al seed, conservare se l'autore lo ha modificato |
| Un viewpoint conservato diventa cancellabile | `view.tsx:543` via `Defaults.check` | Decisione esplicita di Alfonso, da mettere a registro |
| Regressione silenziosa sulla lista viewpoint | `classes.ts:3324` e `3449` | Il filtro di `3448-3449` sta in un getter di `LProject` (children/subElements), non nel percorso di salvataggio: da verificare separatamente prima di scrivere la migrazione |
| Perdita definitiva del controllo lessicale del nome | F3 | Oggi e' gia' perso di fatto (F2). Rimuoverlo lo rende esplicito. Se la regola serve, va riscritta come regola di conformita', non recuperata come view |

**Zona critica**: `VersionFixer.tsx` e' in `CLAUDE.md` §3.1. Una migrazione richiede Layer Impact Report e go-ahead (§3.2, regola 5). `common/Defaults.ts` e `redux/store.tsx` sono core: regola 5 si applica anche a loro.

---

## 5. Domande aperte per Alfonso

1. **Il controllo lessicale del nome serve ancora?** Se si', va riscritto come regola in `ConformanceValidator` (e sarebbe una `NodeProblemKind` nuova, oppure un nuovo `violationType` sotto `conformance`). Se no, si dichiara ritirato a registro. Oggi non e' ne' l'uno ne' l'altro: e' codice che c'e' e non gira.
2. **Che cosa fare dei progetti salvati**: migrazione condizionata (purga solo l'intatto), oppure lasciare i record inerti e limitarsi a smettere di seminarli nei progetti nuovi? La seconda e' a costo quasi zero ma lascia divergenza permanente tra progetti vecchi e nuovi.
3. **`Default` resta visibile in lista?** Proposta: riclassificarlo da viewpoint a layer di sistema, escluso dalle liste utente per puntatore e non per nome, e con l'esclusione fatta in un solo posto invece che in `MegamodelView`.
4. **Il confronto per nome in `MegamodelView.tsx:143` si sistema in questa fetta o in una sua?** E' un bug indipendente (un viewpoint utente chiamato «Default» sparisce dal megamodel) e sarebbe una fetta di due righe.
5. **Sigla di ratifica**: le decisioni qui sopra appartengono alla serie R-IRN o aprono una serie nuova? Il tema tocca R-IRN-1 (le 23 view di default restano senza `ir` per progetto) e R-IRN-2 (la bonifica dei 60 progetti).

---

## 6. Stato

Fase 1 chiusa con questo report. **Nessuna implementazione senza go-ahead**: lo scope tocca core (`common/Defaults.ts`, `redux/store.tsx`) e zona critica (`redux/VersionFixer.tsx`), quindi servono go-ahead esplicito e Layer Impact Report prima di qualsiasi diff.
