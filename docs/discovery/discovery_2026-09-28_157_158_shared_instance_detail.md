# Discovery 2026-09-28 — stand-alone e Data Manager: un solo pannello di dettaglio

- **Prompt-ID**: nessuno — prompt in chat di Juri (2026-09-28), con due screenshot: la form di `Arco_0` nello stand-alone (solo `IRForm`) e la stessa nel Data Manager (testata con Delete, sezioni SRC/TRG navigabili). «Vorrei che fossero entrambi consistenti e che facesse navigare gli elementi nell'environment stand alone così come nel data manager.»
- **Sessione**: `ea12e59f-6368-4419-af86-c2ff32b06257`
- **Albero**: `/Users/juridirocco/development/jjodel`, branch `feat/157-environment-config` @ `ae2347d4c` (merge di `feat/158-data-manager-ux`, decisione di Juri)
- **Esecutore**: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- **Lane**: full (RC-3: più di 3 file)

Questo referto è un insieme di ipotesi con evidenze, non un riferimento definitivo. Chi lo usa a valle rilegge i file reali.

## 1. Ipotesi e verdetti

**H1 — Lo stand-alone rende la form nuda, senza navigazione.** Regge (letto). `frontend/src/components/environment/ConfiguratorTab.tsx:257` e `:261` — `<IRForm objectId={selectedInstanceId} host="rail" />`: niente testata, breadcrumb/Back, sezioni dei riferimenti, figli inline, Add, Delete. Anche l'host è diverso (`rail`, non `manager`), quindi le personalizzazioni della vista del Data Manager non valgono nello stand-alone.

**H2 — Nel Data Manager tutto il pannello vive dentro `InstanceManagerTab.tsx`.** Regge (letto, versione di `feat/158`). Stato di navigazione (`nav`, `drillTo`, `goBack`, scroll per livello), `inlineChildren`, `refSlotsOf` / `summaryOf`, `childSlots`, testata e Delete sono nel componente del tab. Riusarlo da fuori richiede di estrarlo.

**H3 — `feat/158` si fonde in `feat/157` senza conflitti di codice.** Regge (misurato). `git merge-tree` : un solo conflitto, `docs/claude-code-log.md`, risolto per unione nel merge `ae2347d4c`. Sull'albero fuso: `npx tsc --noEmit` 14 errori (insieme §17), vitest tabs + jjform + environmentConfig 810 passati.

**H4 — Il permesso di un tipo raggiunto navigando è già definito.** Regge (letto). `frontend/src/joiner/environmentConfig.ts:79-84` — `resolveTypePermission`: `hidden` / `read` / `edit`, default `edit` anche per i tipi non configurati. Juri ha scelto di applicare questa regola così com'è.

**H5 — I test del Data Manager leggono il sorgente del tab.** Regge (misurato). 9 file di `__tests__/` leggono `InstanceManagerTab.tsx`; gli asserti sul pannello che si sposterebbero sono in `instanceManager10c`, `10k`, `Fl6`, `Outline` (form-head, `<IRForm objectId=...>`, `openDelete(subjectId)`, barra dei figli). Leggendo anche il file nuovo restano validi; cambia solo l'asserto della testata (`ego?.subject.name` → il nome da `navStepOf`, stessa regola: `neighborhoodDraw.ts:158-159` e `multiDraw.ts:108-109` usano entrambi `makeDrawReadCtx`).

## 2. Piano

Un componente **`InstanceDetail`** (`frontend/src/components/abstract/tabs/InstanceDetail.tsx`), estratto dal pannello della form del Data Manager e montato da entrambi gli host:

- **controllato**: `nav` e il suo setter restano all'host (il Data Manager azzera la navigazione dai suoi quattro emettitori di selezione, fissati dai test);
- dentro: testata (nome, tipo, Delete), breadcrumb + Back con ripristino dello scorrimento, `IRForm host="manager"`, figli inline con le loro sezioni, sezioni dei riferimenti con riassunto, barra «Add»;
- verso l'host, solo eventi: `openDelete(id)`, `onCreate(cls, owner, childKey)`, `onCreateAndLink(cls, source, refKey)`; assente l'evento, assente il bottone;
- **permessi** opzionali, `permissionOf(classId)`: `read` → form in sola lettura (stesso gate morbido del Configurator, D1) e nessuna creazione/cancellazione; `hidden` → il target resta nella lista ma non si apre; senza la prop tutto è `edit` (il Data Manager oggi).

Nello stand-alone: `ConfiguratorTab` monta `InstanceDetail` al posto di `IRForm`, con la navigazione propria (azzerata al cambio di istanza e di tipo), i permessi del profilo, il Delete del Data Manager (stessa conferma, `DeleteDialog` esportato) sui tipi `edit`, e le creazioni dirette come il suo «New» di oggi (`applyCreate`, più `appendValue` per il «& link»).

**File**: `InstanceDetail.tsx` (nuovo), `InstanceManagerTab.tsx`, `instanceManagerTab.scss`, `ConfiguratorTab.tsx`, `configuratorTab.scss`, e i test che leggono il sorgente del pannello (`instanceManager10c`, `10k`, `Fl6`, `Outline`). Sopra i 5 file: dichiarato qui (RC-11), conseguenza diretta dell'estrazione.

**Layer Impact Report**: non richiesto. Nessun file di §3.2; nessuna scrittura D-layer nuova (creazioni e cancellazioni passano da `applyCreate`, `appendValue`, `applyDelete`, già usati dai due host).

## 3. Decisioni

**Prese da Juri (2026-09-28, in chat):**

1. Merge di `feat/158` in `feat/157`, lavoro su `feat/157` (fatto: `ae2347d4c`).
2. Permessi dei tipi raggiunti navigando: `resolveTypePermission` così com'è.
3. Delete nella testata dello stand-alone quando il profilo ha `edit`, con la conferma del Data Manager.

**Prese (unattended, RC-25):**

1. Lo stand-alone passa a `IRForm host="manager"`: la vista del Data Manager diventa la stessa nelle due superfici, che è la consistenza chiesta.
2. Nello stand-alone le creazioni restano dirette (senza la finestra di bozza), come il suo «New» attuale.

**In attesa:** il riassunto dentro il campo di selezione (#158, @apierantonio) resta com'era.

## 4. Checklist visiva

1. Stand-alone, un'istanza con riferimenti (`Arco_0`): testata con nome, tipo e Delete; sezioni SRC/TRG come nel Data Manager.
2. Click su `Nodo_0: Nodo`: la form diventa quella di Nodo_0, breadcrumb e Back compaiono; Back torna ad `Arco_0`.
3. Profilo con `Nodo` in `read`: Nodo_0 si apre in sola lettura, senza Delete né creazioni.
4. Profilo con `Nodo` in `hidden`: il target è in lista ma non si apre.
5. Data Manager: stessa resa di prima (testata, Back, sezioni, figli inline, riassunti).
