# Memo di ratifica: connettore GitHub (serie R-GH)

**Data**: 2026-09-05 13:55
**Autore**: Claude (chat di progetto), su richiesta di Alfonso
**Stato**: proposta. La ratifica avviene in chat dopo il discovery report (`docs/discovery/discovery_2026-09-05_connettore_github.md`).
**Riferimenti interni**: `frontend/src/api/persistance/projects.ts` (`ProjectsApi`, classi non esportate `Offline` :294 e `Online` :360, ramo `U.isOffline()`), `frontend/src/common/libraries/saveProject.tsx`, `frontend/src/services/export/` (`JsonModelService`, `EcoreService`, `XMIService`), `frontend/src/components/common/ExportImportMenu.tsx`, `frontend/src/components/forEndUser/Try.tsx` :120-132 (chiamata esistente a `api.github.com` per i bug report, via `XMLHttpRequest`, senza autenticazione), `frontend/src/services/AIProviderPreferences.ts` (precedente di chiavi API conservate lato client).

## 1. Perché e cosa

Un progetto Jjodel oggi vive in `localStorage` (ramo `Offline`) o nel backend Docker (ramo `Online`). Il connettore aggiunge un terzo posto, un repository GitHub, con due usi: **Save to GitHub** (commit del progetto o di un export a un path del repo) e **Open from GitHub** (caricamento da repo autenticato o da URL raw pubblico). Il valore è didattico e di ricerca: un repo per progetto, storia dei commit gratis, condivisione con un link.

Cosa il connettore **non è**: non è un sistema di versionamento dei modelli (niente branch dall'interno di Jjodel, niente diff o merge di modelli), non sostituisce `Offline`/`Online` come persistenza primaria, non implementa OAuth.

## 2. Regole proposte

### R-GH-1: solo client, Contents API
Il connettore chiama direttamente `https://api.github.com` dal browser (la Contents API accetta richieste cross-origin) con le quattro operazioni: `GET /repos/{owner}/{repo}/contents/{path}` (contenuto e `sha`), `PUT` sullo stesso path (create o update, con `sha` obbligatorio per l'update, `message`, `branch`), `GET .../contents/{dir}` (elenco), `GET /repos/{owner}/{repo}/branches`. Nessun backend, nessuna dipendenza nuova: `axios` è già in `package.json`; la chiamata esistente in `Try.tsx` resta com'è.

### R-GH-2: autenticazione con Personal Access Token
L'utente crea un fine-grained PAT (permesso `contents: read/write` sul solo repo) e lo incolla nelle impostazioni. Il token si conserva lato client con lo stesso meccanismo delle chiavi AI (`AIProviderPreferences`), da verificare nel discovery, e non viene mai scritto nel progetto né negli export. L'app avvisa in chiaro nel pannello che il token vive nel browser. OAuth via GitHub App è fuori perimetro: richiede un client secret e quindi un componente server.

### R-GH-3: cosa si committa
Tre formati, tutti già prodotti dai servizi di export: il progetto completo (`JsonModelService`), `.ecore` (`EcoreService`), XMI (`XMIService`). Il formato LionWeb si aggiunge quando esisterà (memo R-LW). Path di default proposto: `jjodel/<nome-progetto>.jjodel.json`, modificabile. Messaggio di commit di default `Update <file> from Jjodel`, modificabile nel dialogo di salvataggio.

### R-GH-4: file grandi
La Contents API rifiuta file oltre 1 MB. Sotto la soglia si usa la Contents API; sopra, il fallback è la Git Data API (blob → tree → commit → ref), da implementare nella seconda slice solo se il discovery mostra progetti di esempio o `compressedState` che superano la soglia. La prima slice rifiuta il salvataggio oltre 1 MB con messaggio esplicito, non tronca e non fallisce in silenzio.

### R-GH-5: conflitti
La scrittura porta sempre il `sha` letto all'apertura o all'ultimo salvataggio. Se GitHub risponde 409 (file cambiato), l'app mostra la scelta tra ricaricare la versione remota e sovrascrivere dopo una nuova lettura del `sha`. Nessun merge automatico.

### R-GH-6: apertura da URL pubblico senza token
`Open from URL` accetta un URL `raw.githubusercontent.com` (o un URL `github.com/.../blob/...` che l'app riscrive in raw) e importa il file con il percorso già usato dall'import da file. Non richiede token e vale per qualunque host che serva il file con CORS aperto.

### R-GH-7: perimetro del codice
Nuovo modulo `frontend/src/services/github/` (`GitHubService.ts` puro, tipi, test con `fetch`/`axios` mockati), nome da verificare con grep prima di crearlo. Un pannello di impostazioni e due voci in `ExportImportMenu.tsx`. Nessun tocco a `projects.ts`, a `Offline`/`Online`, a `saveProject.tsx`: il connettore non entra nel ciclo di salvataggio (SAVE1, DIRTY1, VER1, VER2, R-IRN-28), lo affianca come un export con destinazione remota. Se il discovery mostra che l'import da file passa da `ProjectsApi.import`, l'apertura da GitHub riusa quella via senza modificarla.

## 3. Stima

Slice 1 (R-GH-1, 2, 3, 5, 6, 7, con rifiuto oltre 1 MB): due o tre giorni di Claude Code. Slice 2 (Git Data API per file grandi): un giorno. OAuth: due o tre giorni più un servizio da mantenere, non proposto.

## 4. Domande aperte per Alfonso

1. Il connettore salva il progetto intero (con viewpoint e layout) o solo il metamodello/modello? La proposta è il progetto intero come default, con gli altri formati a scelta.
2. Il token va conservato in `localStorage` (persistente, comodo per gli studenti) o in `sessionStorage` (scompare alla chiusura del tab, più prudente sui PC condivisi dei laboratori)?
3. Un repo per progetto o un repo con più progetti in sottocartelle? Cambia solo il default del path.
4. Vuoi che il connettore aggiorni anche `docs.jjodel.io` con una pagina "Save to GitHub" nella user guide, nella stessa slice o dopo?
