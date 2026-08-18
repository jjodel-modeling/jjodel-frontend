# Discovery 2026-08-18 (3): il corpus persistito, e che cosa le due migrazioni condividono davvero

**Data**: 2026-08-18, pomeriggio.
**Branch**: `alfonso-frontend-jjtl` @ `eb14a614c`, working tree pulito (unico untracked di rilievo:
`docs/sessioni/claude_sessione_2026-08-18_2.md`, quindi il checkpoint precedente e' stato copiato nel
repo ma non committato).
**Tipo**: discovery read-only, eseguita da Cowork con la cartella del repo connessa al bridge.
Nessun file di codice toccato.
**Zona critica coinvolta**: `frontend/src/redux/VersionFixer.tsx`. Qualunque Fase 2 su questo file
richiede Layer Impact Report e go-ahead esplicito.

---

## 1. Obiettivo

`contesto_progetto.md` prescrive, come prerequisito del fronte `activeViewpoint` a 0..1, una discovery
read-only sul corpus persistito che serva insieme quel fronte e il ritiro del seed, con questa
motivazione: «le due migrazioni leggono lo stesso corpus e passano entrambe da VersionFixer; farne
una sola costa meno e rischia meno di farne due».

Questa discovery verifica la premessa e risponde a tre domande:

1. Dove vive il corpus, in che forma, e chi lo puo' misurare.
2. Che cosa fa davvero VersionFixer al momento del caricamento, e dove si innesterebbero le due
   migrazioni.
3. Che cosa cambia, concretamente, portando `activeViewpoint` a 0..1 e ritirando il seed.

---

## 2. File letti

Normativi e base di evidenza precedente:

- `docs/decisions.md`, sezione «Serie R-IRN» (righe 649-779)
- `docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md`
- `docs/discovery/discovery_2026-08-05_legacy_view_census_real_projects.md`

Codice:

- `frontend/src/redux/VersionFixer.tsx` (1257 righe; lette 32-160, 407-1200 in diagonale, 1199-1257)
- `frontend/src/components/topbar/SaveManager.ts` (1-110)
- `frontend/src/api/persistance/projects.ts` (95-125, 190-280, 320-360)
- `frontend/src/utils/versionUtils.ts` (intero)
- `frontend/src/common/Defaults.ts` (intero)
- `frontend/src/redux/reducer/reducer.ts` (1090-1125)
- `frontend/src/redux/store.tsx` (155-165, 240-260, 355-432)
- `frontend/src/redux/defaults/views.ts` (indice dei siti di creazione)
- `frontend/src/joiner/classes.ts` (1172-1190, 1225-1245, 2890-2930, 3300-3365, 3705-3712)
- `frontend/src/view/viewElement/view.tsx` (330-395, 895-915, 1890-1945)
- `frontend/src/utils/lastViewpoint.ts` (110-215)
- `frontend/src/redux/selectors/selectors.ts` (520-565)
- Censimento dei lettori di `activeViewpoint`: `grep -rn 'activeViewpoint' frontend/src --include=*.ts
  --include=*.tsx`, 11 siti di consumo piu' le dichiarazioni.

---

## 3. Findings

### F1. Il corpus non sta nel repo, e le due popolazioni sono gia' state confuse una volta

Il corpus reale e' la chiave `projects` di `localStorage`, letta e scritta dalla classe `Offline` in
`frontend/src/api/persistance/projects.ts:202-280`: un array di `DProject`, ciascuno con il campo
`state` compresso (`U.compressedState` in scrittura a `projects.ts:109`, `U.decompressState` in
lettura a `pages/Project.tsx:50` e `reducer.ts:1564`). L'ultima misura nota, del 2026-08-04, contava
80 progetti di cui 64 con stato non vuoto: non l'ho rimisurata oggi, perche' vive nel browser di
Alfonso e non nel repo.

`frontend/src/examples/` e' invece codice morto. Lo dichiara
`discovery_2026-08-05_legacy_view_census_real_projects.md`, che sostituisce esplicitamente il
censimento precedente proprio perche' quei blob non hanno importatori nel repo. **Riverificato oggi**
con `grep -rn "from ['\"].*examples" --include=*.ts --include=*.tsx frontend/src | grep -v
'^frontend/src/examples/'`: zero risultati. `examples/index.ts` importa quattro blob ed esporta la
classe `stateExamples`, che nessun altro file importa. Il termine `statechartplus` compare fuori da
`examples/` in due soli punti, entrambi commenti: `components/editor-v2/Toolbar.tsx:214` e il commento
di `Defaults.isSystemViewpoint`.

Qui c'e' una tensione da segnalare. R-IRN-9 porta come base di misura «quattro view autorate
parcheggiate dentro `Default` in `examples/statechartplus.ts`» e i numeri 39 subViews / 35 di sistema
/ 4 autorate, ripetuti nel commento di `Defaults.isSystemViewpoint`. Sono misure su un file morto.
**Questo non invalida R-IRN-9**, la cui scelta di fondo (predicato sul namespace del puntatore, non
allowlist) regge a maggior ragione se il corpus vero non e' stato guardato; ma quelle cifre non
descrivono i progetti reali, e non vanno riusate come baseline. Le due misure citate come «fatte in
chat il 2026-08-18» e quella «su un progetto creato dalla UI» sono l'evidenza buona.

**Conseguenza operativa**: nessuna delle due migrazioni si puo' dimensionare da qui. Serve una misura
in pagina prima di scrivere codice, e va fatta una volta sola per entrambi i fronti.

### F2. La migrazione e' pigra e per progetto, non e' una bonifica del corpus

`SaveManager.load` (`SaveManager.ts:41-58`) chiama `VersionFixer.update(save)` alla riga 56 e poi
`LoadAction.new(save)`. Il flusso e': si apre un progetto, il suo stato viene migrato in memoria, e
finisce su disco solo se l'utente poi salva (`ProjectsApi.save`, che ricomprime lo stato corrente).

Ne segue un fatto che cambia la pianificazione di R-IRN-2: **la «bonifica dei sessanta progetti» non
e' una cosa che una migration fa**. Una migration bonifica il progetto che stai aprendo, adesso. Per
toccare sessanta progetti servono sessanta aperture piu' sessanta salvataggi, oppure un passaggio
bulk fuori da VersionFixer che decomprima, applichi la stessa funzione pura, ricomprima e riscriva
`localStorage['projects']`. Sono due meccanismi diversi con due profili di rischio diversi, e finora
sono stati nominati come se fossero lo stesso.

Sul resto, la premessa di `contesto_progetto.md` e' **confermata**: entrambi i fronti passano dallo
stesso punto, con la stessa forma (trasformazione pura `DState -> DState` prima di `LoadAction`,
niente azioni Redux, niente L-proxy, idempotente), e possono condividere una sola passata. La catena
arriva oggi a `2.226 -> 2.227` (`VersionFixer.tsx:1067`); il prossimo gradino e' `2.227 -> 2.228`.

### F3. Il rubinetto del seed non e' `Defaults.views`, e' il loop di coda di `VersionFixer.update`

Dopo la catena degli adapter, `VersionFixer.update` esegue due cose non versionate
(`VersionFixer.tsx:136-155`):

1. rigenera le view di default **non toccate** dei progetti aperti, chiamando
   `LViewElement.updateDefaultView` su ogni `DViewElement`/`DViewPoint` con
   `version !== highestVersion && !clonedCounter` (righe 136-146);
2. **inietta** in `idlookup` ogni id presente in `Defaults.defaultViewsMap` e
   `Defaults.defaultViewPointsMap` che il salvataggio non ha (righe 148-154), incondizionatamente.

Il punto 2 spiega perche' R-IRN-8 e' bastata a smettere di seminare `Default Validation`: tolti gli
id dai registri, il loop smette di rimetterli. Ma spiega anche che il ritiro del seed non e' una
sottrazione da un elenco: e' un intervento su questo loop, e su chi lo alimenta. Vedi F4.

### F4. `Defaults.defaultViewsMap` si popola a runtime, e il seed e' la sua condizione di uscita

`Defaults.ts:87-89` costruisce le due mappe con valori **booleani** (`acc[val] = true`), non con
oggetti view, nonostante il tipo dichiarato dica `Dictionary<Pointer, DViewElement>`. A sostituirli
con oggetti veri e' `reducer.ts:1103-1112`:

```ts
if (typeof Defaults.defaultViewPointsMap[Defaults.Pointer_ViewPointDefault] !== 'object') {
    for (let k in ret.idlookup) { ...
        if (v.className.includes('DViewPoint')) Defaults.defaultViewPointsMap[k] = v;
        if (v.className.includes('DViewElement')) Defaults.defaultViewsMap[k] = v;
    }
}
```

Due cose, entrambe rilevanti.

La prima: **il loop non filtra sui venti id di default**, prende ogni `DViewElement` presente in
`idlookup`. Il contenuto delle mappe dipende quindi da quale stato passa per primo da questo
reducer. Se e' lo stato seminato all'init, contengono i default; se e' lo stato di un progetto
caricato, contengono tutte le view di quel progetto, per il resto della sessione di pagina. Le
mappe alimentano `Defaults.check()` (`Defaults.ts:99`), il loop di iniezione di F3 e
`LViewElement.updateDefaultView` (`view.tsx:1919`). Non l'ho misurato: e' il primo controllo da fare
in pagina.

La seconda, che e' la vera dipendenza del fronte del seed: **la guardia si sblocca solo quando
`Pointer_ViewPointDefault` diventa un oggetto**. Ritirare il seed senza toccare questa riga significa
che la condizione resta vera per sempre, quindi il loop gira a ogni passaggio del reducer accumulando
ogni view di ogni progetto, e nel frattempo le mappe restano di booleani finche' non arriva un
`DViewPoint` qualsiasi. Con le mappe a booleani, `updateDefaultView` fa `{...true}`, cioe' `{}`, e
scrive un oggetto vuoto in `idlookup` al posto della view (`view.tsx:1919-1921, 1936`); e il loop di
iniezione di F3 scrive `true` dentro `idlookup`. Nessuno dei due percorsi ha un errore di
compilazione che lo segnali.

### F5. Il seed crea ventuno view, il registro ne elenca venti

`Defaults.views` ha venti voci (`Defaults.ts:5-26`): quattordici create in
`frontend/src/redux/defaults/views.ts`, `Fallback` creata in `store.tsx:374`, cinque edge view create
da `makeEdgeView` in `store.tsx:418-422`. Ma `store.tsx:423` ne crea una sesta con nome vuoto, il cui
id diventa `Pointer_ViewEdge`, e che in nessun registro compare. E' lo stesso caso che il commento di
`Defaults.isSystemViewpoint` gia' documenta.

**Il ritiro deve enumerare i siti di creazione, non il registro.** Un intervento guidato da
`Defaults.views` lascerebbe viva la ventunesima.

### F6. `activeViewpoint` a 0..1 e' un cambio di tipo che da solo non fa niente

`Pointer<T, lowerbound, upperbound>` e' un alias di tipo puro (`classes.ts:3707-3711`): non c'e'
validazione a runtime. La forma `0, 1` produce `NotAString<...> | null`, quindi **il vuoto tipizzato
e' `null`**, non `undefined`.

Il comportamento vive altrove, in tre punti:

- gli inizializzatori di campo `= Defaults.viewpoints[0]`, in **due** classi:
  `ProjectPointers` (`classes.ts:2899`) e `DProject` (`classes.ts:2924`);
- il getter con fallback: `context.data.activeViewpoint || Defaults.viewpoints[0]`
  (`classes.ts:3353`), che oggi rende impossibile osservare un valore vuoto dal lato L;
- il percorso di caricamento `pointers.activeViewpoint = raw.activeViewpoint` (`projects.ts:338`),
  che copia quello che c'e' nel salvataggio senza normalizzarlo.

Tre rappresentazioni del vuoto convivono gia' oggi e vanno riconciliate prima di scrivere:
stringa vuota (`store.tsx:160`, `viewpoint: Pointer<DViewPoint> = ''`, che e' la forma che editor-v2
usa e che R-IRN-10 ha reso visibile come «Abstract syntax»), `null` (la forma del tipo 0..1), e
`undefined` (quello che restituisce l'optional chaining ai siti gia' difensivi).

### F7. Censimento dei lettori: undici siti, tre comportamenti

| Sito | Forma | Comportamento con valore vuoto |
|---|---|---|
| `classes.ts:1181` | `getProject()?.activeViewpoint.id \|\| Defaults.viewpoints[0]` | ripiega sul `Default`: rubinetto |
| `classes.ts:3353` | getter con `\|\| Defaults.viewpoints[0]` | maschera il vuoto a ogni lettura |
| `view.tsx:373-375` | `activeVP?.id !== Pointer_ViewPointDefault` | se vuoto, padre = `Pointer_ViewModel` |
| `view.tsx:903` | `dproject.activeViewpoint === c.data.id` | azzera `compiled_css` dei vp esclusivi non attivi |
| `selectors.ts:529` | `project.activeViewpoint.id`, senza optional chaining | alimenta il gradino `VP_Default` di `selectors.ts:557` |
| `NestedView.tsx:82,110-111,314-315,544` | legge e **scrive** | renderer classico, unico writer oltre a `lastViewpoint.ts:55` |
| `TreeViewContent.tsx:2328` | `project?.activeViewpoint?.id \|\| undefined` | gia' sicuro |
| `ViewParentingFields.tsx:49` | `?.activeViewpoint?.id` | gia' sicuro |
| `Toolbar.tsx:214-229` | normalizza via `Defaults.isSystemViewpoint` | gia' collassa a stringa vuota (R-IRN-10) |
| `lastViewpoint.ts:136` | `activeVP.id !== Pointer_ViewPointDefault` | secondo fallback di `resolveParentViewpoint` |
| `projects.ts:338` | copia grezza | persistenza |

Tre classi: chi ha gia' la forma giusta (Toolbar, TreeView, ViewParentingFields), chi maschera il
vuoto con un fallback da rimuovere (`classes.ts:3353`, `classes.ts:1181`), chi assume non-null senza
dirlo (`selectors.ts:529`, `NestedView.tsx`).

### F8. Il rubinetto ha tre bocche, e una non e' mai stata nominata

R-IRN-9 dichiara chiuso a meta' il rubinetto e poi si corregge da sola: la rimozione del terzo
fallback di `resolveParentViewpoint` **non e' avvenuta**, perche' il prompt la subordinava a un solo
chiamante. Confermato oggi: i chiamanti sono due, `lastViewpoint.ts:205` (`createViewInWorkbench`) e
`EditorV2.tsx:3049`. Il terzo fallback e' a `lastViewpoint.ts:146-152`.

La seconda bocca e' `classes.ts:1181`, il fallback di `DViewElement.new`, gia' a registro come
«discussione sua».

La terza non compare in nessuna decisione: `DViewElement.new2` (`view.tsx:336-342`) ha **due**
default verso il `Default`, non uno. Il parametro `father0` ripiega su
`DPointerTargetable.from(Defaults.viewpoints[0])` alla riga 339, e la riga 340 fa
`father.viewpoint || Defaults.viewpoints[0]`. E' il costruttore che tutti i siti di creazione view
attraversano, quindi e' la bocca piu' larga delle tre.

C'e' anche un quarto punto, di segno opposto, da tenere presente perche' cambia se `activeViewpoint`
puo' essere vuoto: `DViewElement.newDefault` (`view.tsx:373-375`) **evita** il `Default` e prende
`Pointer_ViewModel` come padre quando il viewpoint attivo e' quello di sistema. Con 0..1 quella
condizione va riscritta, altrimenti un progetto senza viewpoint attivo cade nel ramo sbagliato.

### F9. La versione di schema finisce nel numero di revisione mostrato all'utente

`VersionFixer.tsx:134` scrive `project.version = s.version.n`, cioe' `2.227`, sul `DProject` in
`idlookup`. Il campo si chiama uguale ma nasce con un altro significato: `classes.ts:1232` lo
inizializza con il commento «Content version: new projects start at 1.0, loaded projects use -1 (to
be extracted from state)». L'estrazione dallo stato, pero', restituisce la versione **di schema**.

A valle, `ProjectsApi.save` (`projects.ts:101-104`) fa `getNextVersionNumber(2.227)`, e
`versionUtils.ts:14-44` calcola major 2, minor `Math.round(2.27) = 2`, quindi restituisce `2.3`.
La revisione mostrata passa da `v2.2` a `v2.3` al primo salvataggio, indipendentemente da quante
volte quel progetto e' stato salvato prima.

**Conseguenza per il fronte**: spedire `2.228` riscrive il numero di revisione di ogni progetto del
corpus al primo salvataggio successivo. Non l'ho verificato a schermo; la catena di codice e' quella
sopra, ma la conferma va fatta sul cruscotto prima di spedire.

---

## 4. Dipendenze e rischi

1. **Zona critica.** `VersionFixer.tsx` richiede Layer Impact Report e go-ahead. Vale per la passata
   unica `2.227 -> 2.228` come per qualunque altra.
2. **Ordine imposto, ma con un meccanismo diverso da quello atteso.** R-IRN-2 mette la bonifica dei
   sessanta progetti come prerequisito del ritiro del seed. Per F2 quella bonifica non e' una
   migration: e' un passaggio bulk, e va deciso a parte.
3. **Ritirare il seed senza toccare `reducer.ts:1104` cambia `Defaults.check()` in silenzio** (F4).
   Nessun errore di compilazione, nessun warning: cambia solo la risposta di un predicato che tre
   percorsi diversi leggono.
4. **Una purga condizionata ha bisogno del seed per confrontare.** R-IRN-8 prescrive che la
   migrazione dei salvataggi purghi solo i record identici al seed e conservi quelli modificati
   dall'autore. Se il seed esce dal codice, il termine di paragone sparisce nello stesso commit che
   ne ha bisogno: va congelato dentro la migration, come tabella di firme, non letto da `Defaults`.
5. **La misura manca.** Quante delle venti view di default sono state toccate nei progetti reali
   (quindi `clonedCounter` definito, quindi non rigenerabili e non purgabili come identiche) e' il
   numero che dimensiona tutto il fronte, e nessuno lo ha misurato. Le cifre in circolazione vengono
   da `examples/` (F1).
6. **Il fronte 0..1 tocca `selectors.ts`**, cioe' la cascata `viewScores`/`stackViews`, che R-IRN-7
   dichiara vincolante per il codice classico. Non e' `useJjomSync.ts` ne' `portDistribution.ts`, ma
   e' il percorso di resa del renderer classico e merita lo stesso trattamento.

---

## 5. Domande aperte per Alfonso

1. **Forma canonica del vuoto**: stringa vuota, `null`, o `undefined`? Il tipo `Pointer<T,0,1>` impone
   `null`, la root `state.viewpoint` usa `''` gia' oggi, e i siti difensivi producono `undefined`.
   Una sola forma, decisa prima di scrivere.
2. **Bonifica dei sessanta**: apertura manuale progetto per progetto, o script una tantum da console
   che decomprime, applica la funzione pura, ricomprime e riscrive, con dump di backup prima?
3. **Purga condizionata**: congelare la tabella di firme del seed dentro la migration (proposta), o
   un'altra strategia?
4. **Numero di revisione (F9)**: difetto da correggere, o comportamento voluto? Se e' difetto, va
   corretto prima di `2.228`, altrimenti la migrazione lo propaga a tutto il corpus.
5. **Misura in pagina**: la scrivo io come snippet da incollare in console, o preferisci eseguirla
   in altro modo? Serve comunque prima della Fase 2.

---

## 6. Stato

Fase 1 chiusa. Nessun file di codice modificato, nessun commit. Nessun go-ahead richiesto: le cinque
domande di sopra vanno risolte prima di scrivere il prompt di Fase 2.
