# Discovery — estrazione protocollo da CLAUDE.md e smoke visivo

**Data**: 2026-08-01
**Prompt**: 2026-08-01 15:05
**Branch**: `alfonso-frontend-jjtl` @ `b05e50364`
**Fase**: 1 (read-only). Nessun file sorgente modificato. Unico file scritto: questo report.
**Protocollo**: `docs/PROTOCOL.md` P1..P9. `Deroga: P8 non applicabile`.

---

## 0. Precondizione e discrepanze rispetto al prompt

`docs/PROTOCOL.md` esiste ed è committato:

```
b05e50364 protocol added
```

Tre discrepanze fra il prompt e lo stato reale del repo, da correggere prima di procedere:

| Prompt dice | Realtà misurata | Impatto |
|---|---|---|
| `CLAUDE.md` è «circa 1850 righe» | **946 righe** (`wc -l CLAUDE.md`) | Il margine di riduzione è molto minore di quanto assunto |
| Playwright «già presente» (`docs/PROTOCOL.md:102`) | **Non installato**, né in `dependencies` né in `devDependencies` | Blocca il Commit B |
| Il piano assume `frontend/scripts/smoke/` | `docs/PROTOCOL.md:104-106` dice `scripts/smoke/` (senza `frontend/`) | Ambiguità di path da risolvere |

---

## 1. Ipotesi e verdetti

### Ipotesi A — sovrapposizione CLAUDE.md ↔ PROTOCOL.md

> Le sezioni di `CLAUDE.md` che trattano scope, lettura preventiva, two-phase, discovery report, critical zone, commit, build e prompt log sono **interamente** coperte da P1..P9, quindi rimuovibili e sostituibili con un rimando.

**VERDETTO: FALSIFICATA.**

Una sola sezione (§4, 21 righe) è integralmente coperta. Tutte le altre contengono materiale unico, e in quattro punti `CLAUDE.md` e `PROTOCOL.md` **si contraddicono apertamente** (§2.3). Il piano deve passare alla variante prevista dal prompt: si estrae solo la parte coperta, il residuo resta.

Righe realmente estraibili senza perdita: **~85 su 946 (9%)**. Il grosso di `CLAUDE.md` (§3 sync layer 248 righe, §7-§20 reference tecnica ~390 righe) non è toccato da nessuna clausola P.

### Ipotesi B — stato noto montabile da Playwright headless

> È possibile portare l'app a uno stato riproducibile e popolato da uno script Playwright headless, senza intervento manuale.

**VERDETTO: FALSIFICATA allo stato attuale, ma recuperabile.**

Tre blocchi indipendenti, tutti risolvibili ma nessuno risolvibile *dentro* lo scope del Commit B così com'è scritto:

1. **Playwright non esiste nel progetto** → serve una nuova dipendenza, vietata senza approvazione (regola 4 delle NON-NEGOTIABLE, e il prompt stesso impone «fermati e chiedi»).
2. **Zero `data-testid` in tutto il codebase** (0 occorrenze su `frontend/src/`) → i selettori vanno presi dalle classi CSS di ReactFlow e dalle classi BEM applicative, oppure si aggiungono testid, che è modifica al codice applicativo → go-ahead separato.
3. **L'app è interamente dietro autenticazione** e il backend di persistenza (`localhost:5002`) **non è in esecuzione**. Esiste però una modalità offline su `localStorage` che rende il precaricamento di stato fattibile (§3.4).

Conseguenza operativa: **non ho potuto misurare alcun valore DOM a runtime**. Il prompt chiede i valori misurati nello stato buono corrente; senza un driver di browser installato non sono ottenibili. Qui sotto riporto i valori **dichiarati nel CSS** e i selettori, distinguendoli esplicitamente da misure runtime che restano da fare.

---

## 2. Obiettivo A — mappatura CLAUDE.md ↔ PROTOCOL.md

### A1. Sezioni di CLAUDE.md che trattano i temi del protocollo

| § | Titolo | Righe | N. righe |
|---|---|---|---|
| — | Blocco `NON-NEGOTIABLE RULES` (fenced) | `CLAUDE.md:7-65` | 59 |
| 0 | Runtime — model & effort | `CLAUDE.md:66-77` | 12 |
| 1 | Hard stops — pause and ask | `CLAUDE.md:79-83` | 5 |
| 2 | Preservation first — committed code is verified | `CLAUDE.md:85-102` | 18 |
| 3.1 | Files in the critical zone | `CLAUDE.md:108-121` | 14 |
| 3.2 | Layer Impact Report — mandatory for sync/D-L tasks | `CLAUDE.md:123-154` | 32 |
| 4 | Scope & anti-refactoring (4.1, 4.2, 4.3) | `CLAUDE.md:352-372` | 21 |
| 5 | Discovery before action (intro + liste) | `CLAUDE.md:374-388` | 15 |
| 5.1 | Visual bugs: specify before diagnosing | `CLAUDE.md:390-417` | 28 |
| 6 | Commit discipline (6.1-6.4) | `CLAUDE.md:419-450` | 32 |
| 17 | Development commands | `CLAUDE.md:766-784` | 19 |
| 20.1 | Do NOT | `CLAUDE.md:879-881` | 3 |
| 21 | Prompt log (21.1, 21.2, 21.3) | `CLAUDE.md:895-945` | 51 |

Totale nominale in area protocollo: **309 righe**. Di queste, estraibili senza perdita: ~85.

### A2. Confronto puntuale — identico / equivalente / **unico**

Questo è il punto critico: il materiale marcato **UNICO** non esiste in `PROTOCOL.md` e sparirebbe silenziosamente se la sezione venisse cancellata in blocco.

#### Blocco NON-NEGOTIABLE RULES (`CLAUDE.md:7-65`)

| Regole | Clausola P | Esito |
|---|---|---|
| 1, 2, 7, 8, 10 | P2 | Equivalente. P2: *«Tocca solo i file elencati nel prompt… Zero refactoring opportunistico: non rinominare variabili, non riordinare import, non migliorare codice adiacente»* (`docs/PROTOCOL.md:24`) |
| 9, 11 | P3 | Equivalente. P3: *«Non rimuovere codice apparentemente inutilizzato. Non modificare interfacce TypeScript esistenti»* (`docs/PROTOCOL.md:30`) |
| 3 | — | **UNICO**: *«Committed behavior is verified. Never degrade it. In doubt: STOP.»* (`CLAUDE.md:19`) |
| 4 | — | **UNICO**: *«No new dependencies / external libraries (no new package.json entries) without approval.»* (`CLAUDE.md:20-21`) — direttamente rilevante per il Commit B |
| 5 | — | **UNICO**: *«No core changes without approval.»* (`CLAUDE.md:22`) |
| 6 | — | **UNICO**: *«Don't over-engineer simple features.»* (`CLAUDE.md:23`) |
| 12, 13, 14 | P5 (parziale) | **UNICO nel dettaglio**. P5 nomina i file e il Layer Impact Report ma non contiene nessuno dei tre divieti tecnici: TRANSACTION, `hasCanvasEdgePair`, migrazione VersionFixer (`CLAUDE.md:32-36`) |
| 15 | P4 + P6 | Equivalente in spirito |
| 16 | P9 | Identico nella sostanza |
| 17 | P6 | Identico: *«`git add` solo con path espliciti. Mai `git add .`»* (`docs/PROTOCOL.md:53`) |
| 18 | P6 | **CONFLITTO** — vedi §2.3 |
| 19 | P6 | **CONFLITTO** — soglia diversa (5 vs 3) |
| 20 | — | **UNICO**: *«A change that propagates to a layer not named in the prompt (D-layer, L-layer, sync, view, JjOM) → pause and report.»* (`CLAUDE.md:47-48`) |
| 21-25 | — | **TUTTE UNICHE**: `createM1()`, `require()` nel frontend, `model.addChild()` in canvasToJjom, Editor V3, stringhe `'jjodel:...'` hardcoded (`CLAUDE.md:51-57`) |
| 26-28 | — | **TUTTE UNICHE**: no emoji nel codice, token CSS legacy, no CSS vars nei component file (`CLAUDE.md:60-63`) |

→ **Il blocco non è rimuovibile.** Circa 30 righe su 59 sono contenuto unico non protocollare.

#### §0 Runtime (`CLAUDE.md:66-77`)

**UNICO** e **STALE**: dichiara *«This agent runs as **Claude Opus 4.8**»* (`CLAUDE.md:68`). La sessione corrente gira su **Opus 5**. Nessuna clausola P copre il tema effort/modello. Da aggiornare, non da rimuovere. Nota: questa è esattamente la sezione che `scripts/generate-agents.mjs` sostituisce con `docs/_agents/runtime-codex.md` (§A4).

#### §1 Hard stops (`CLAUDE.md:79-83`)

Puro rimando al blocco NON-NEGOTIABLE. Non ha contenuto proprio. Rimovibile **solo se** il blocco resta (e resta).

#### §2 Preservation first (`CLAUDE.md:85-102`)

| Contenuto | Esito |
|---|---|
| Bullet 1-4 (`:90-93`) | Coperti da P3 e P2 |
| Bullet 5 dipendenze (`:94`) | Duplica regola 4, comunque **UNICO** vs PROTOCOL |
| Bullet 6 (`:95`) | **UNICO**: *«Do not commit instrumentation (`console.log`, `[diagN]` blocks). These are removed in a dedicated cleanup commit after the fix is confirmed.»* |
| «Test before considering a task done» (`:97-100`) | Parzialmente P7. P7 copre `build` e la baseline `tsc --noEmit`, **non menziona `npm run test`** → il bullet su test è **UNICO** |

#### §3.1 / §3.2 (`CLAUDE.md:108-154`)

P5 è drasticamente più povero. `docs/PROTOCOL.md:47` elenca tre path (`useJjomSync.ts`, `portDistribution.ts`, `sync/*`); §3.1 ne elenca **otto**, inclusi `useM1ReferenceEdges.ts`, `VersionFixer.tsx`, `defaultViewTemplate.ts`, `DV.tsx`, più la nota di cross-reference su `handlePosition.ts`/`DynamicHandles.tsx` (`CLAUDE.md:121`).

P5 nomina «Layer Impact Report» ma **non ne dà il template**. Il template di 28 righe (`CLAUDE.md:127-154`) è **interamente UNICO**. Senza di esso la clausola P5 è ineseguibile.

→ Entrambe restano. Semmai è `PROTOCOL.md` P5 che andrebbe reso un rimando a §3.

#### §4 Scope & anti-refactoring (`CLAUDE.md:352-372`)

**L'unica sezione integralmente coperta.**
- §4.1 (`:356`) ≡ P2 prima frase.
- §4.2 (`:360`) è un rimando interno al blocco.
- §4.3 (`:364-370`) ≡ P2 seconda frase: *«Prima di introdurre un nuovo identificatore, verifica con ricerca globale (`grep -r`) che non sia già in uso»* (`docs/PROTOCOL.md:26`), e la motivazione sulle collisioni CSS è in P2 (`docs/PROTOCOL.md:24`).

→ **21 righe rimovibili senza residuo.** L'unica perdita è l'esempio `grep -rn "myNewClassName\|myNewEventName" frontend/src/` — cosmetico.

#### §5 Discovery before action (`CLAUDE.md:374-417`)

| Contenuto | Esito |
|---|---|
| Intro + «Always before modifying a file» 1-3 (`:376-381`) | Coperti da P3 e P4 |
| Punto 4 `git log -1 --format=...` (`:382`) | **UNICO**, minore |
| «Always at session start» (`:386-388`) | Coperti da P1 e P9 |
| **§5.1 (`:390-415`)** | **INTERAMENTE UNICO — 26 righe.** Nessuna clausola P parla di bug visivi, criterio di accettazione, dead writes, validazione dei sort, o sfiducia nelle fixture da sessioni precedenti. È il materiale più prezioso della sezione |

→ Rimovibili `:374-388` (15 righe). §5.1 resta e va ricollocata.

#### §6 Commit discipline (`CLAUDE.md:419-450`)

| Contenuto | Esito |
|---|---|
| §6.1 primo bullet (`:423`) | ≡ P6 |
| §6.1 ricetta `git add -p` / log-backup (`:424-433`) | **UNICO** — 10 righe di procedura operativa |
| §6.2 (`:437-439`) | Parzialmente P6. «≤ 72 chars» e «split commits thematically» **UNICI**. Viceversa P6 ha *«Il tipo è indicato nel prompt: se manca, chiedilo, non sceglierlo»* (`docs/PROTOCOL.md:55`) che **non** è in CLAUDE.md |
| §6.3 (`:443-445`) | **CONFLITTO** su «wait for approval» (§2.3). *«Never use `--no-verify`»* è **UNICO** |
| §6.4 Incident log (`:449`) | **UNICO** — registro storico di una violazione reale |

#### §17 Development commands (`CLAUDE.md:766-784`)

Tabella comandi: **UNICA** (reference, non protocollo). «Verification gates» (`:779-782`) ≈ P7, ma con dettagli **UNICI** e importanti: baseline `typecheck` non-zero nota, suite test con failure note, assenza di ESLint. P7 dice solo *«se il numero di errori sale, fermati»* (`docs/PROTOCOL.md:61`).

#### §21 Prompt log (`CLAUDE.md:895-945`)

| Contenuto | Esito |
|---|---|
| §21.1 lifecycle (`:899-904`) | ≡ P9. Rimovibile (6 righe) |
| §21.2 entry format (`:906-918`) | **CONFLITTO STRUTTURALE** — §2.3 |
| §21.3 self-assessment (`:920-943`) | **INTERAMENTE UNICO — 24 righe.** Definisce la semantica di `Regressions`/`Out-of-scope`/`Layer Impact Report` e il principio di onestà. P9 non ha nulla di equivalente |

### A3. Conflitti aperti fra CLAUDE.md e PROTOCOL.md

Quattro contraddizioni dirette. **Nessuna è risolvibile da me**: sono decisioni di processo.

| # | CLAUDE.md | PROTOCOL.md | Nota |
|---|---|---|---|
| C1 | Regola 18 + §6.3: *«Hard stop before commit: show diff, wait for approval»* (`CLAUDE.md:44`, `:443`) | P6: *«Si committa a ogni passo compiuto, anche prima della verifica visiva di Alfonso. La verifica non blocca il commit: blocca il merge»* (`docs/PROTOCOL.md:51`) | Opposti. P6 è più recente e presumibilmente vince |
| C2 | Regola 19: *«A task touching more than **5** files → pause»* (`CLAUDE.md:45`) | P6: *«Per modifiche che toccano più di **3** file: elenca prima tutti i file»* (`docs/PROTOCOL.md:57`) | Soglie diverse |
| C3 | §21.2: campi `Regressions`, `Out-of-scope changes`, `Layer Impact Report`, `Prompt document name`; header `## YYYY-MM-DD` | P9: campo `Smoke visivo`; header `## YYYY-MM-DD HH:mm`; nessun campo di autovalutazione | Formati di log incompatibili. Il log reale (`docs/claude-code-log.md`) usa oggi il formato §21.2 |
| C4 | §6.2 non chiede il tipo di commit al prompt | P6: *«Il tipo è indicato nel prompt: se manca, chiedilo, non sceglierlo»* | P6 aggiunge un obbligo |

### A4. Riferimenti incrociati interni — e il problema AGENTS.md

**Cross-reference da riscrivere** (grep su `§[0-9]`):

| `file:riga` | Testo | Azione |
|---|---|---|
| `CLAUDE.md:11` | *«Canonical list — §1, §4.2 and §20.1 point here»* | §4.2 sparisce con §4 → riscrivere |
| `CLAUDE.md:71` | *«including the critical zone (§3) and discovery (§5)»* | §5 si riduce a §5.1 → riscrivere |
| `CLAUDE.md:121` | *«see the §3.10 note and §5.1 `Visual bugs: specify before diagnosing`»* | §5.1 va ricollocata → aggiornare numero |
| `CLAUDE.md:384` | *«**Always before introducing a new identifier**: global grep (see §4.3)»* | Riga essa stessa in rimozione; il rimando a §4.3 muore comunque |
| `CLAUDE.md:938` | *«(see §3.1 and §3.2)»* | §3 resta → OK, nessuna azione |

Altri riferimenti (`§3.3`, `§3.4`, `§3.5`, `§3.6`, `§3.7`, `§3.9`, `§3.10`, `§8.6`, `§8.7`, `§10`, `§14`, `§15.4`) puntano a sezioni che restano: nessuna azione.

**CLAUDE.md di sottocartella: nessuno.**

```
$ find . -name "CLAUDE.md" -not -path "*/node_modules/*"
./CLAUDE.md
```

**Ma esiste un problema più serio, non previsto dal prompt.**

`AGENTS.md` in root (**937 righe**) è una **proiezione generata** di `CLAUDE.md`:

```
AGENTS.md:1: <!-- GENERATED FROM CLAUDE.md — DO NOT EDIT. Run `npm run gen:agents` to regenerate. -->
```

Il generatore è `scripts/generate-agents.mjs`, esposto come `npm run gen:agents` (`frontend/package.json`, sezione `misc_utilities`). Sostituisce `Claude Code`→`Codex`, `CLAUDE.md`→`AGENTS.md`, e rimpiazza §0 con `docs/_agents/runtime-codex.md`.

Implicazione diretta: **modificare `CLAUDE.md` senza rilanciare `npm run gen:agents` fa divergere `AGENTS.md`** — cioè riproduce esattamente il fallimento che questo task vuole eliminare, solo su Codex invece che su Claude. Il Commit A deve includere `AGENTS.md` rigenerato.

Due dettagli aggiuntivi:
- `generate-agents.mjs:16` cita un file canary a `frontend/src/components/editor-v2/CLAUDE.md`. **Non esiste.** Commento stale, nessuna azione richiesta.
- `generate-agents.mjs:89` fa `throw` se non trova `## 0. ` in `CLAUDE.md`: se il Commit A tocca il titolo di §0 il generatore muore. Il vincolo del prompt «non cambiare il titolo o la struttura di primo livello» va esteso a §0.

### A5. Bilancio righe

| Voce | Righe |
|---|---|
| `CLAUDE.md` oggi | **946** |
| §4 integrale (`352-372`) | −21 |
| §5 intro (`374-388`), §5.1 preservata | −15 |
| §1 (`79-83`), rimando puro | −5 |
| §21.1 (`899-904`) | −6 |
| §2 bullet 1-4 (`90-93`) | −4 |
| §6.1 primo bullet + §6.2 parziale | ~−8 |
| Nuova sezione «Protocollo di esecuzione» | +8 |
| Ricollocazione §5.1 / §21.3 (invariante netto) | 0 |
| **`CLAUDE.md` dopo** | **≈ 895** |

**Riduzione netta ≈ 51 righe (5,4%).** Se si risolvono i conflitti C1-C4 a favore di PROTOCOL si arriva a ≈ 875 righe (−7,5%).

Il prompt puntava a un accorciamento sostanziale. Non è ottenibile per questa via: `CLAUDE.md` non è lungo *perché* duplica il protocollo, è lungo perché contiene 640 righe di reference tecnica (§3 sync layer, §7-§20) che nessuna clausola P tocca. **Se l'obiettivo è la lunghezza, il candidato giusto è un altro: spostare §3 e §7-§20 in `docs/` con rimandi.** Decisione di Alfonso, fuori scope qui.

---

## 3. Obiettivo B — montaggio di uno stato noto

### B1. Script e runner disponibili

`frontend/package.json`, sezione `scripts`, voci attive:

```
start      → vite
build      → vite build
serve      → vite preview
typecheck  → tsc --noEmit
test       → vitest run
test:watch → vitest
dev        → docker-compose -f docker-compose.dev.yml up
gen:agents → node ../scripts/generate-agents.mjs
```

**Runner E2E: nessuno.**

| Pacchetto | Stato |
|---|---|
| `playwright` / `@playwright/test` | **assente** da `dependencies` e `devDependencies`; assente da `frontend/node_modules/` e da `node_modules/` root |
| `puppeteer` | assente |
| `vitest` | `^4.1.1` (devDependencies) — unit runner, jsdom, **non pilota un browser reale** |

`npx playwright --version` risponde `1.62.1` **solo perché npx lo scaricherebbe al volo** (`npm warn exec The following package was not found and will be installed: playwright@1.62.1`). Non è una dipendenza del progetto.

`docker-compose.dev.yml` referenziato da `npm run dev` **non esiste** nel repo (né in root né in `frontend/`). Script morto.

→ **Blocco 1 del Commit B.** Serve `npm i -D @playwright/test` + `npx playwright install chromium` (~120 MB di browser). Violerebbe la regola 4 senza approvazione esplicita.

### B2. Dev server e porta — **confermata la 3000**

`frontend/vite.config.ts`:

```ts
server: {
    port: 3000
}
```

Confermato a runtime — il server è attivo adesso:

```
$ lsof -nP -iTCP -sTCP:LISTEN | grep -E ":(3000|3001|5001|5002)"
node  88033  alfonso  22u  IPv6  TCP [::1]:3000 (LISTEN)

$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
200
```

**Porta 3001: niente in ascolto.** La nota di P8 (`docs/PROTOCOL.md:67`) è corretta.

Nota: il server è in ascolto su **IPv6 `[::1]` soltanto**. Uno script che punta a `http://127.0.0.1:3000` può fallire; usare `http://localhost:3000`.

**Backend non attivi**: né 5001 né 5002. `frontend/src/settings/Settings.ts`:

```ts
static production = false;
static collaborativeURL = this.production ? '/' : 'http://localhost:5001';
static persistanceURL   = this.production ? ''  : 'http://localhost:5002';
```

Non esiste una directory backend nel repo (`ls` root: solo `frontend/`, `docs/`, `scripts/`).

### B3. Routing

`frontend/src/App.tsx:129` usa **`HashRouter`** → tutti gli URL sono `#/...`.

**L'intero albero di route è condizionato all'autenticazione** (`App.tsx:132`):

```tsx
{user ? <>
    <Route path={'/'} element={<Navigate to="/allProjects" replace/>}/>
    <Route path={'allProjects'} element={<AllProjectsPage/>}/>
    <Route path={'project'} element={<ProjectPage/>}/>
    <Route path={'editor-v2'} element={<EditorV2/>}/>
    ...
</> : <>
    <Route path={'confirm/:id/:token'} element={<ConfirmAccount/>}/>
    <Route path={'*'} element={<AuthPage/>}/>
</>}
```

Senza `user`, **qualunque URL rende `AuthPage`**. Uno smoke che non autentica misura la schermata di login e passa le asserzioni per il motivo sbagliato.

| URL | Vista |
|---|---|
| `#/allProjects` | dashboard progetti |
| `#/project?id=<projectId>` | progetto aperto |
| `#/editor-v2` | PoC standalone, `<EditorV2/>` **senza `modelid`** (`App.tsx:144`) |
| `#/test-tokens` | preview token design system |

Il progetto è selezionato **da query param nell'hash**, non da path param:

- `frontend/src/pages/Project.tsx:101` → `ret.projectid = U.getProjectID_URL() || ''`
- `frontend/src/common/U.tsx:2806` → `public static getProjectID_URL(): string | null { return U.getHashParam('id'); }`

→ **Un progetto è raggiungibile per URL diretto**: `#/project?id=<id>`.

**Un viewpoint/canvas NO.** Il canvas vive dentro una tab rc-dock aperta via `DockManager.openViewpoint()`; `EditorV2` riceve `modelid` come prop da `EditorSwitch` (`frontend/src/components/abstract/tabs/EditorSwitch.tsx:116` e `:134`), non dall'URL. Nessuna traccia di tab-id nell'hash.

→ Gli stati 2, 3, 4 del prompt (viewpoint popolato, Properties aperto, Advanced) **richiedono sequenze di click**, non URL.

### B4. Persistenza — precaricamento fattibile in offline

Doppio binario, deciso da un flag in `localStorage` (`frontend/src/common/U.tsx:443`):

```ts
static isOffline(): boolean {
    return Storage.read('offline') === true;
}
```

`frontend/src/api/persistance/projects.ts:61`:

```ts
static async getAll(): Promise<void> {
    let isOffline = U.isOffline();
    if(isOffline) Offline.getAll();
    else await Online.getAll();
}
```

`Offline` (`projects.ts:202-232`) legge e scrive **`localStorage['projects']`** come array di `DProject` serializzati. `Storage` (`frontend/src/data/storage.ts`) è un wrapper JSON su `localStorage`; la chiave `'user'` ha un side effect: `Storage.read('user')` chiama `LUser.replace(val)`.

Chiavi rilevanti per il precaricamento:

| Chiave | Ruolo | `file:riga` |
|---|---|---|
| `offline` | `true` → bypassa il backend | `common/U.tsx:444` |
| `user` | utente autenticato | `data/storage.ts:10`, `joiner/classes.ts:1280` |
| `projects` | array progetti offline | `api/persistance/projects.ts:204,209` |
| `jjodel.interfaceMode` | `'basic'` \| `'advanced'` | `hooks/useInterfaceMode.ts:17`, `pages/components/Navbar.tsx:842` |
| `jjodel_layout_mode`, `jjodel_dock_ratio_${mode}` | layout dock | `components/abstract/Dock.tsx:33,82` |
| `jjodel.showGrid`, `jjodel.showBackground`, `jjodel.showEdgeLabels` | resa canvas | `components/editor-v2/EditorV2.tsx:596` |
| `theme` | tema chiaro/scuro | — |

→ **Uno script *può* precaricare uno stato noto** via `page.addInitScript()` scrivendo `offline`, `user`, `projects` prima del primo load. Copre lo stato «progetto vuoto» e, con un `state` compresso valido dentro `projects`, anche «viewpoint popolato». Restano da simulare a click l'apertura della tab viewpoint e del pannello Properties.

`DProject.state` è compresso: `U.decompressState(project.state)` (`pages/Project.tsx:48`). Una fixture di progetto va prodotta **esportandola dall'app**, non scritta a mano.

### B5. Fixture e seed esistenti

`frontend/src/__tests__/fixtures/`:

```
xmi-m1/                        combo_test.xmi
DataType_collision_test.ecore  DataType_test.ecore
Graph.ecore                    Library.ecore
modelBook.xmi                  polymorphism_test.xmi
references_test.xmi            sample-Families.xmi
sample-Persons.xmi
```

Sono fixture **di parsing Ecore/XMI**, consumate dai test vitest (`services/export/__tests__/ecore-io.test.ts`). **Non sono stati di progetto** e non si caricano via `localStorage`: passerebbero dal flusso di import UI.

**Non esiste nessuna fixture di stato applicativo** (nessun `DState` o `DProject` serializzato versionato nel repo). Per lo stato «viewpoint con class diagram popolato» va creata ex novo — è un artefatto nuovo da versionare, non previsto dal prompt.

### B6. Selettori — **zero `data-testid`**

```
$ grep -rn "data-testid" --include="*.tsx" --include="*.ts" frontend/src/ | wc -l
0
```

Selettori attualmente disponibili, ragionevolmente stabili:

| Target | Selettore | `file:riga` | Stabilità |
|---|---|---|---|
| Root app | `#root` | `frontend/src/index.scss:31` | Alta |
| Shell editor | `.editor-v2` | `components/editor-v2/EditorV2.tsx:3913` | Alta (BEM, classe radice) |
| Area canvas | `.editor-v2__canvas` | `EditorV2.tsx:3995`, `:4006` | Alta — ma **due call-site**: split mode e standalone |
| Main editor | `.editor-v2__main` | `EditorV2.tsx:3923` | Alta |
| Viewport ReactFlow | `.react-flow`, `.react-flow__renderer`, `.react-flow__viewport` | libreria `@xyflow/react` 12.10 | Alta (API pubblica libreria) |
| Nodo | `.react-flow__node` | usato dal codice app: `EditorV2.tsx:1197`, `:1633`, `:1728` | Alta |
| Nodo per id | `.react-flow__node[data-id="<id>"]` | `EditorV2.tsx:1633` | Alta |
| Status bar | `.app-statusbar` | `components/StatusBar.tsx:315` | Alta — prefisso scelto apposta per evitare collisione con `jjtl-statusbar` (`StatusBar.scss:4`) |
| MiniMap | `.react-flow__minimap` | `<MiniMap>` a `EditorV2.tsx:3850` | Alta |
| Split pane | `.editor-split-flow`, `.editor-split-container`, `.editor-split-classic` | `EditorV2.tsx:3993`, `EditorV2.scss:53,59` | Media |
| Griglia | `.editor-v2__dot-grid` | `EditorV2.tsx:3830` | Media |

**Non trovato**: nessun selettore stabile identificato per il pannello Properties e per il Tree. `Info.tsx`/`properties-with-tree-view.scss` esistono ma non ho tracciato una classe radice univoca — **da completare prima di scrivere lo stato 3**.

→ **Blocco 2 del Commit B.** Gli stati 1, 2 e 4 sono coprbili con i selettori attuali. Lo stato 3 (Properties) no. Aggiungere `data-testid` è modifica al codice applicativo → go-ahead separato, come da prompt.

### B7. Canvas collassato vs corretto

Elemento da misurare: **`.react-flow__viewport`** dentro `.editor-v2__canvas`.

`.editor-v2__canvas` è `flex: 1; position: relative` (`components/editor-v2/EditorV2.scss:34-37`): occupa lo spazio residuo. Il caso «canvas collassato al 30%» si manifesta come `getBoundingClientRect().width` molto minore della larghezza del contenitore padre `.editor-v2__main`.

**Metrica robusta**, indipendente dalla dimensione della finestra e quindi non fragile fra macchine diverse:

```
ratio = canvas.getBoundingClientRect().width / main.getBoundingClientRect().width
```

In split mode il rapporto atteso cambia (`splitPercent`, default da verificare, clampato 15-85% in `EditorV2.tsx:3768`). Uno stato di smoke deve fissare la modalità.

**Valore misurato nello stato buono corrente: NON DISPONIBILE.** Serve un driver di browser. Riportare qui un numero senza averlo letto dal DOM sarebbe inventato.

### B8. Conteggio nodi

```
document.querySelectorAll('.react-flow__node').length
```

Confermato come selettore già usato dal codice applicativo per iterare i nodi renderizzati (`EditorV2.tsx:1197`). Per gli edge: `.react-flow__edge`.

Attenzione: ReactFlow di default **non monta i nodi fuori viewport** solo se `onlyRenderVisibleElements` è attivo. Non l'ho verificato nel prop set di `<ReactFlow>` (`EditorV2.tsx:3791+`) — **da controllare prima di fissare la soglia**, altrimenti il conteggio dipende dallo zoom.

**Valore misurato: NON DISPONIBILE** (stesso motivo di B7).

### B9. Status bar ed elementi fixed

`components/StatusBar.tsx:315`:

```tsx
<div className="app-statusbar" role="status">
```

`components/StatusBar.scss:9-24`:

```scss
.app-statusbar {
    height: 32px;
    min-height: 32px;
    max-height: 32px;
    z-index: 50;
    flex-shrink: 0;
}
```

**Altezza dichiarata: 32px, bloccata da min/max.** `z-index: 50`.

Nota importante: il commento SCSS dice *«Fixed 32px bar at the bottom of the viewport»* (`StatusBar.scss:3`) ma la regola **non è `position: fixed`**: è un flex child con `flex-shrink: 0`. Sta in fondo perché `#root` è `display: flex; flex-direction: column` (`index.scss:31-33`). Montata in `pages/components/Dashboard.tsx:353` e `:635`. Ha `role="status"` → selettore alternativo `[role="status"]`.

**Elementi `position: fixed`: 92 occorrenze** su `frontend/src/` (`.scss` + `.tsx`). Non enumerabili staticamente in modo utile — l'asserzione 4 va valutata a runtime su `getComputedStyle(el).position === 'fixed'` per tutti i nodi, intersecando i rect con quello di `.app-statusbar`.

Candidati a rischio più probabili, dato il tipo di regressione occorsa a luglio:

| Componente | `file:riga` |
|---|---|
| Jjodie widget (FAB) | `components/JjodieWidget/jjodie-widget.scss:11` (`position: fixed !important`), `:60` |
| Toast | `components/Toast/toast.scss:7` |
| Tree view sidebar | `components/TreeViewSidebar/tree-view-sidebar.scss:54`, `:233` |
| Properties panel | `components/editors/properties-with-tree-view.scss:1163`, `:1240` |
| Editor V2 overlay | `components/editor-v2/EditorV2.scss:3276`, `:3285` |
| Node problem overlay | `components/editor-v2/problems/NodeProblemOverlay.scss:2` |
| Donation banner | `components/DonationBanner/DonationBanner.scss:2` |
| Dev mode label | `components/DevModeLabel/dev-mode-label.scss:8` |

Modali e dialoghi (`UnifiedSettingsModal`, `ExplainModal`, `CreateProjectDialog`, `add-tag-dialog`, …) sono anch'essi `fixed` ma coprono lo schermo per design: **vanno esclusi dall'asserzione 4**, altrimenti falsi positivi garantiti. Serve una allowlist.

### B10. Rumore atteso in console

**Non misurato** — richiede il browser. Quanto segue è un censimento statico dei generatori noti, da validare al primo run.

Nota strutturale (`frontend/vite.config.ts`, blocco `esbuild`): `console.log/debug/info/trace` sono rimossi **solo in build di produzione**; `console.warn` e `console.error` sono **sempre preservati**. In dev server (`npm start`, il contesto dello smoke) **non viene rimosso nulla**.

Generatori noti di `console.warn` a regime, tutti in area editor:

| Pattern | `file:riga` |
|---|---|
| `[DEDUP] Caught duplicate edge:` | `components/editor-v2/EditorV2.tsx:343` |
| `[EditorV2] Removed duplicate edge:` | `EditorV2.tsx:3550` |
| `[EditorV2] Failed to create JjOM edge` | `EditorV2.tsx:1556`, `:1564` |
| `[EditorV2] Upper bound violated:` | `EditorV2.tsx:1664` |
| clamp handle overflow | `components/editor-v2/utils/portDistribution.ts:188` |

`console.error` raggiungibili a runtime senza che ci sia un bug:

| Pattern | `file:riga` |
|---|---|
| `user not loaded` | `joiner/classes.ts:1287` (in blocco commentato — verificare) |
| `R.navigate() called twice` | `common/U.tsx:135` |
| `wrong parameter in DPointerTargetable.fromPointers()` | `joiner/classes.ts:1493` |

Rumore **esterno** atteso, da filtrare per forza:
- React DevTools banner
- Vite HMR (`[vite] connecting...`, `[vite] connected.`)
- richieste fallite verso `localhost:5002` / `localhost:5001` se `offline` non è impostato → `net::ERR_CONNECTION_REFUSED`
- `https://fonts.googleapis.com` (preconnect in `index.html`) se la macchina è offline
- `https://jjodel-notifications.alfonso-pierantonio.workers.dev` (`components/NotificationWidget/NotificationWidget.tsx:21`, fetch a `:80`) — chiamata di rete a ogni avvio

→ L'asserzione 1 senza allowlist fallisce a ogni run. L'allowlist va costruita al primo run reale, non indovinata adesso.

---

## 4. Dipendenze e rischi

| # | Rischio | Gravità | Mitigazione |
|---|---|---|---|
| R1 | `AGENTS.md` diverge da `CLAUDE.md` se il Commit A non rigenera | **Alta** | Includere `npm run gen:agents` e `AGENTS.md` nel Commit A |
| R2 | I 4 conflitti C1-C4 restano irrisolti: due documenti che si contraddicono sono peggio di uno lungo | **Alta** | Decisione di Alfonso prima del Commit A |
| R3 | Playwright è una nuova dipendenza (~120 MB con Chromium) | **Alta** | Go-ahead esplicito richiesto |
| R4 | Servono `data-testid` per il pannello Properties | Media | Go-ahead separato, lista puntuale prima |
| R5 | Nessuna fixture di stato progetto → lo stato «viewpoint popolato» va creato e versionato | Media | Esportare da app reale, non scrivere a mano |
| R6 | Asserzione 4 senza allowlist modali → falsi positivi certi | Media | Allowlist esplicita in `states.ts` |
| R7 | Asserzione 1 senza allowlist console → rosso a ogni run | Media | Costruire l'allowlist al primo run |
| R8 | Backend 5001/5002 non attivi → l'app funziona solo con `offline: true` | Media | Precaricare `localStorage.offline = true` |
| R9 | `generate-agents.mjs:89` fa `throw` se `## 0. ` sparisce da CLAUDE.md | Bassa | Non toccare il titolo di §0 |
| R10 | Soglia larghezza canvas assoluta = fragile fra macchine/risoluzioni | Bassa | Usare il rapporto canvas/main, non i pixel |
| R11 | Dev server in ascolto solo su `[::1]` | Bassa | Usare `localhost`, non `127.0.0.1` |

---

## 5. Domande aperte per Alfonso

**Bloccanti per il Commit A**

1. **C1** — commit prima o dopo approvazione? P6 dice «committa subito», CLAUDE.md regola 18 dice «mostra diff e aspetta». Quale vince?
2. **C2** — soglia file: 3 (P6) o 5 (CLAUDE.md regola 19)?
3. **C3** — formato del prompt log: quello di P9 (con `Smoke visivo`) o quello di §21.2 (con la triade di autovalutazione)? Il log attuale usa §21.2. Se vince P9, si perdono `Regressions`/`Out-of-scope`/`Layer Impact Report` — e con essi §21.3, che li definisce.
4. **AGENTS.md** — confermi che il Commit A includa `AGENTS.md` rigenerato via `npm run gen:agents`?
5. Data la riduzione reale (**−51 righe, 5,4%**, non le centinaia ipotizzate): l'estrazione vale comunque come anti-divergenza, o preferisci ripuntare l'obiettivo sullo spostamento di §3 e §7-§20 in `docs/`?

**Bloccanti per il Commit B**

6. **Playwright non c'è.** Autorizzi `npm i -D @playwright/test` + `npx playwright install chromium`? Senza, il Commit B non è eseguibile in nessuna forma.
7. `data-testid` per il pannello Properties: autorizzi un commit separato che li aggiunga? Senza, lo stato 3 esce dallo smoke e va dichiarato scoperto.
8. Path: `frontend/scripts/smoke/` (prompt) o `scripts/smoke/` (`docs/PROTOCOL.md:104`)? Se `npm run smoke` sta in `frontend/package.json`, `frontend/scripts/smoke/` è coerente — e `PROTOCOL.md` va corretto.
9. Lo stato «viewpoint con class diagram popolato» richiede una fixture di progetto che non esiste. La produci tu esportandola dall'app, o vuoi che lo smoke la costruisca a click (più lento e più fragile)?
10. Le soglie: come da prompt le fissi tu sui valori misurati. **I valori misurati non esistono ancora** — servono Playwright (Q6) e un primo run di calibrazione. Propongo: dopo il go-ahead su Q6, un run di sola misurazione che stampa i numeri, poi tu fissi le soglie, poi scrivo `states.ts`.

---

## 6. File letti

```
/Users/alfonso/jjodel/CLAUDE.md
/Users/alfonso/jjodel/AGENTS.md
/Users/alfonso/jjodel/docs/PROTOCOL.md
/Users/alfonso/jjodel/docs/claude-code-log.md
/Users/alfonso/jjodel/scripts/generate-agents.mjs
/Users/alfonso/jjodel/frontend/package.json
/Users/alfonso/jjodel/frontend/vite.config.ts
/Users/alfonso/jjodel/frontend/src/App.tsx
/Users/alfonso/jjodel/frontend/src/index.scss
/Users/alfonso/jjodel/frontend/src/App.scss
/Users/alfonso/jjodel/frontend/src/settings/Settings.ts
/Users/alfonso/jjodel/frontend/src/pages/Project.tsx
/Users/alfonso/jjodel/frontend/src/hooks/useQuery.ts
/Users/alfonso/jjodel/frontend/src/common/U.tsx            (sezioni)
/Users/alfonso/jjodel/frontend/src/joiner/classes.ts       (sezioni)
/Users/alfonso/jjodel/frontend/src/data/storage.ts
/Users/alfonso/jjodel/frontend/src/api/persistance/projects.ts
/Users/alfonso/jjodel/frontend/src/components/StatusBar.tsx
/Users/alfonso/jjodel/frontend/src/components/StatusBar.scss
/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.tsx    (sezioni)
/Users/alfonso/jjodel/frontend/src/components/editor-v2/EditorV2.scss   (sezioni)
/Users/alfonso/jjodel/frontend/src/components/abstract/tabs/EditorSwitch.tsx
/Users/alfonso/jjodel/frontend/src/hooks/useInterfaceMode.ts
```

**Nessun file sorgente modificato.** Unico artefatto prodotto: questo report.
