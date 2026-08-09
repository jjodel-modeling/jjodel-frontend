# Sessione 2026-08-05 (2) — Capitolo legacy classic: misurato, riparato, chiuso

Sessione Cowork cloud, parallela all'arco A (partizione dei tab). Non lo interseca in nessun
file. Nata da una domanda di Alfonso: che succede a un progetto che usava i vecchi viewpoint
con l'editor v1.

## Stato a fine sessione

Il capitolo legacy classic è aperto e chiuso nella stessa sessione, con due commit dentro:
`1d5b55aed` (S1, classificazione) e `383170dc0` (S2, tab Template). HEAD allineato al remoto.

La sostanza in una riga: **non c'era un problema di notazione persa, c'era un predicato di
classificazione sbagliato**. Sui progetti reali l'85% delle view veniva marcato legacy; dopo S1
è il 5,5%, e di quel residuo i tre quarti sono un'altra default del tool non ancora
riconosciuta.

## Decisioni prese

### 2026-08-05 — I demo di `src/examples/` sono codice morto, e il primo censimento era sul corpus sbagliato
Grep su tutto il repo: zero importatori di `stateExamples` o dei singoli blob fuori da
`examples/`. In UI, Templates renderizza una pagina senza nodi ed Explore è "coming soon". Il
censimento eseguito su quel corpus (85 view, 81 nel secchio 3, 13 notazioni di dominio) descrive
file che il prodotto non carica. Sostituito dal censimento sui progetti reali.

### 2026-08-05 — La riparazione del flag è il predicato, non solo il carry-over
L'ipotesi iniziale era che i falsi positivi venissero dal carry-over della Fase 4, che preserva
`irLegacyClassic` sulle view rigenerate da `updateDefaultView`. Vero ma marginale. La causa
dominante è che `isKnownDefault` conosceva solo la famiglia del default M1
object/singleton/value: tutte le altre default che il tool genera da sé (edge delle relazioni
standard, view di sintassi astratta in tre versioni, `edgePoint`, overlay degli anchor,
placeholder `void model-less`) cadevano nel ramo legacy.

### 2026-08-05 — Il tab Template resta montato, in sola lettura, con avviso
Ratifica iniziale "rimuovi o marca", cambiata in corsa e accettata: rimuoverlo cancellerebbe
l'unico posto in cui il `jsxString` originale resta ispezionabile, e su una view degradata quello
è l'unica traccia della notazione perduta. Sola lettura ottiene tutto il beneficio senza
distruggere informazione.

### 2026-08-05 — Il gate del write path sta su `readOnly`, non su una condizione legacy
Conseguenza voluta: S2 ripara anche le default view, che erano dichiarate read-only
nell'editor (`ViewData.tsx:47`, `Defaults.check`) e scrivibili al blur. Non era un buco nato con
le view legacy, era un read-only rotto da prima.

### 2026-08-05 — Il censimento va agli atti nel repo, non solo nel KB
I commenti lasciati da S1 in `VersionFixer.tsx` citano il censimento. Un commento che cita un
documento vivo solo in chat è un riferimento pendente. Il report è quindi in
`docs/discovery/`, nello stesso commit di S1.

## Bug risolti

- **Classificazione legacy** (`1d5b55aed`): `isKnownDefault` esteso con cinque clausole in
  `utils/defaultViewTemplate.ts:174-189`. Secchio 3 da 1315 a 86 sui progetti reali, secchio 5 da
  60 a 1289. Tutte e cinque le clausole scattano.
- **Tab Template ingannevole** (`383170dc0`): sola lettura più avviso sulle view senza `ir`, gate
  su `readOnly` in `Jsx.tsx` per `blur()` e per l'`onSave` passato al modal fullscreen.

## Bug nuovi / Todo

- **[ALTA] Trappola `.gitignore` su `CLAUDE.md`.** `.gitignore:61` ha un `CLAUDE.md` nudo, che
  matcha a qualunque livello: `frontend/src/jjtl/CLAUDE.md` è ignorato (verificato con
  `check-ignore`). Nel working tree c'è una modifica non committata che porta il file di root da
  934 a 778 righe spostando 156 righe proprio lì. Committarla farebbe sparire quelle regole dal
  repo senza che la sostituzione ci entri. Fix probabile: `/CLAUDE.md`.
- **[MEDIA, da misurare] `async-lz-string` fa yield per simbolo.** `U.decompressState`
  (`common/U.tsx:424`). Un progetto da 48 KB non ha terminato entro 45 s nel contesto della
  misura; un `lz-string` sincrono lo apre in 61 ms. Divario probabilmente amplificato dal
  contesto isolato, quindi da rimisurare dentro la pagina. Formato compatibile, quindi
  eventuale sostituzione senza migration.
- **[MEDIA] Sesta clausola mancante**: 61 delle 86 view residue sono la view di overlay degli
  errori di validazione. Frammento marker proposto `errors.separator(`. Porterebbe il residuo a
  25 su 1550.
- **[MEDIA] 60 progetti già flaggati per errore non ripuliti**: la guardia di idempotenza li
  salta, S1 non bumpa `highestVersion`. Bonifica non decisa.
- **[BASSA / debito] Il modal fullscreen non guarda `readOnly` nel suo Ctrl+S**
  (`EditorFullscreenModal.tsx:69`). Chiuso per il consumatore di S2 passando `undefined`, resta
  per gli altri.
- **[BASSA / chore] `src/examples/` è codice morto**: ~1,9 MB di blob senza importatori.
- **[igiene] Documenti di questa sessione datati 2026-08-04 invece che 2026-08-05**, incluso il
  discovery report committato. Rinomina da fare.

## Documenti prodotti

- `claude/censimento_2026-08-04_progetti_reali.md` (KB) e la sua copia agli atti in
  `docs/discovery/discovery_2026-08-04_legacy_view_census_real_projects.md` (repo, da
  rinominare al 05).
- `claude/2026-08-04_prompt_discovery_legacy_viewpoint_census.md` (censimento superato, tenuto
  per tracciabilità dell'errore di perimetro).
- `contesto_progetto.md` ricostruito su due archi paralleli, dopo aver scoperto che era fermo a
  due sessioni prima.

## Prompt generati per Claude Code

| Prompt | Esito |
|---|---|
| `claude/2026-08-04_prompt_discovery_legacy_viewpoint_census.md` | ✅ eseguito, ma su corpus morto |
| `claude/2026-08-04_prompt_S1_isknowndefault_e_flag_legacy.md` | ✅ `1d5b55aed` |
| `claude/2026-08-04_prompt_S2_tab_template_view_legacy.md` | ✅ `383170dc0`, con terzo file approvato in corsa |

## Prossimi passi

Quelli dell'arco A restano davanti (ratifica su `canonicalize`, atterraggio congiunto 2.1 più
WIP, misura sul css di default, 3.6, 1.5). Code di questo arco, in ordine:

1. Rinominare i documenti del capitolo da 2026-08-04 a 2026-08-05.
2. Decidere sulla trappola `.gitignore` prima che il diff pendente su `CLAUDE.md` venga
   committato.
3. Sesta clausola in `isKnownDefault`.
4. Misura pulita di `async-lz-string` dentro la pagina.
5. Bonifica dei 60 flaggati, se si decide di farla.
6. Guardare le 25 view residue e decidere se contengono notazione davvero autorata.

## Info strutturali scoperte

**Persistenza in modalità offline.** I progetti stanno in `localStorage['projects']`, ciascuno
con `state` compresso UTF16. `Storage` (`data/storage.ts`) è un wrapper su `localStorage`;
`Offline.getAll/getOne/save` in `api/persistance/projects.ts:202-260`. Il `localStorage`
contiene inoltre solo preferenze di UI (`jjodel.editorPrefs.*`, `jjodel.highlight.*`,
`jjodel.interfaceMode`). In modalità online la persistenza è un'API Azure
(`VITE_PERSISTANCE` in `.env.development`).

**`state.version` è un oggetto** `{n, date, conversionList}`, non uno scalare.

**Predicato della migration** `2.225 -> 2.226`: `VersionFixer.tsx:1007-1040`. Marker in
`utils/defaultViewTemplate.ts:63,105,117,146-148` più i cinque aggiunti a `:174-189`. Quattro
migration di riscrittura del `jsxString` (2.211→2.212, 2.213→2.214, 2.222→2.223, 2.223→2.224)
girano prima della classificazione.

**Catena del tab Template**: `ViewData.tsx:47` calcola `readOnly`; `:63-69` il nuovo
`templateLegacy`; `data/TemplateData.tsx` passa a `JsxEditor`, che gira a Monaco via
`withReadOnly` (`monacoConfig.ts:188-197`). Il read-only di Monaco ferma i tasti, non la
scrittura: il commit vive in `languages/Jsx.tsx` sull'`onBlur` del wrapper.

**Metodo di misura riutilizzabile.** Il censimento gira in sola lettura dalla console del
browser: leggere `localStorage['projects']`, decomprimere con un `lz-string` sincrono, iterare
`idlookup` sui `DViewElement`. A batch di 15-25 progetti per non superare i timeout dell'estensione.

## Lezioni di metodo

1. **Prima di misurare un corpus, verificare che qualcuno lo carichi.** Il primo censimento è
   stato scoperto su `src/examples/` deducendo "raggiungibile" da "registrato in `index.ts`".
   Una grep sugli importatori costa dieci secondi e viene prima della misura.
2. **Un numero alto su pochi template distinti accusa il predicato, non la popolazione.** 1315
   view su 50 template distinti diceva già dove guardare.

## Cronologia

Apertura su una domanda di contesto sui viewpoint dell'editor v1. La risposta dai documenti
sembrava netta (notazione persa in silenzio, nessun segnale all'utente) e ha prodotto un prompt
di censimento su `src/examples/`. Il censimento è tornato con 81 view su 85 nel secchio legacy,
numero che sembrava confermare tutto.

La verifica a schermo lo ha demolito: quei blob non sono raggiungibili, e la grep ha mostrato
che non sono nemmeno importati. Da lì il censimento rifatto sui progetti reali, dalla sessione
browser di Alfonso, che ha richiesto di scrivere un decompressore sincrono perché quello
dell'app non terminava.

I numeri veri hanno spostato il problema dal dominio al predicato, e le due slice ne sono
seguite. S2 è stata eseguita prima di S1 per un fraintendimento sull'ordine, senza conseguenze
perché i perimetri erano disgiunti. Chiusura sulla scoperta che `contesto_progetto.md` era fermo
a due sessioni prima, e sulla trappola del `.gitignore`, trovata mentre si controllava lo stato
del working tree prima dei commit.
