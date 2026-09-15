# Prompt Claude Code, 2026-08-18 16:17: Fase 1 discovery per `2.227 -> 2.228`

**Fase**: 1 di 2, discovery **read-only**. Hard stop al termine.
**Zona critica**: `frontend/src/redux/VersionFixer.tsx`. La Fase 2 richiede Layer Impact Report e
go-ahead esplicito di Alfonso. Questa fase non la tocca.
**Branch**: `alfonso-frontend-jjtl`.

---

## COSA

Preparare la migration `2.227 -> 2.228` e le modifiche di codice che la accompagnano. Due fronti,
una sola passata:

**Fronte A, ritiro del seed.** Jjodel smette di seminare il viewpoint `Default` e le sue venti view,
e la migration purga dai salvataggi quelle rimaste identiche al seed.

**Fronte B, `activeViewpoint` a 0..1.** Il campo passa da `Pointer<DViewPoint, 1, 1>` a
`Pointer<DViewPoint, 0, 1>`, i fallback che oggi mascherano il vuoto vengono rimossi, e la migration
normalizza il valore salvato.

I due fronti stanno insieme per una ragione strutturale, non di comodo: **una purga da sola sarebbe
un no-op**. `VersionFixer.update` esegue la catena degli adapter (righe 118-131) e poi, alle righe
148-154, reinietta in `idlookup` ogni id presente in `Defaults.defaultViewsMap` che manchi. Una purga
scritta dentro l'adapter `2.227 -> 2.228` verrebbe annullata dal loop di coda nella stessa chiamata.

**Questa fase non scrive codice.** L'unico output è il discovery report.

---

## Decisioni già prese, da non rimettere in discussione

- **D1.** La forma canonica del viewpoint vuoto è **`null`**, non stringa vuota e non `undefined`.
  Ratificata da Alfonso il 18/8. Motivo: `Pointer<T, 0, 1>` si espande gia' in `NotAString<...> | null`
  (`joiner/classes.ts:3707-3711`), e la stringa vuota passerebbe in silenzio dentro gli `||` di
  fallback, cioe' dentro la classe di bug che stiamo rimuovendo.
- **D2.** Fronte A e fronte B stanno nella stessa passata `2.228`. Ratificata da Alfonso il 18/8.
- **D3.** **La bonifica dei sessanta progetti di R-IRN-2 non e' piu' dovuta.** Quei progetti non
  esistono piu', confermato da Alfonso il 18/8 dopo misura sul corpus reale. Il prerequisito che
  R-IRN-9 poneva al ritiro del seed e' chiuso. Non progettare quella bonifica e non citarla come
  blocco.
- **D4.** Il difetto sul numero di revisione (F9 del report di riferimento) va corretto **prima** di
  spedire `2.228`, altrimenti la migrazione lo propaga. Rientra nel perimetro di Fase 2.

---

## Punto di partenza obbligatorio

Leggi per intero, **prima** di qualunque ricerca:

`docs/discovery/discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md`

Contiene nove finding gia' verificati e una misura sul corpus reale eseguita in pagina. **Non
rifare quel lavoro.** Parti da li'. Se trovi evidenza che contraddice uno dei suoi finding, dillo
esplicitamente nel tuo report, con la ricerca che lo sostiene: e' un risultato utile, non un
problema.

In sintesi, cosa quel report ha gia' stabilito:

- il corpus vero e' `localStorage['projects']`, oggi due progetti di cui uno con stato;
  `frontend/src/examples/` e' codice morto senza importatori, e tre cifre di R-IRN-9 vengono da li';
- sul progetto reale le venti view di default ci sono tutte e **nessuna e' stata toccata**
  (`clonedCounter` non definito), quindi la purga condizionata potrebbe non avere casi da conservare;
- il seed crea **ventuno** view, il registro ne elenca venti: `store.tsx:423` ne fa una con nome
  vuoto, id `Pointer_ViewEdge`, presente nel salvataggio reale;
- `clonedCounter` compare **anche come chiave di `idlookup`** (valore misurato 178, tipo number), non
  solo dentro `subViews`;
- `Defaults.defaultViewsMap` nasce di booleani (`Defaults.ts:87`) e viene riempita di oggetti veri da
  `reducer.ts:1103-1112`, con una guardia che si sblocca solo quando `Pointer_ViewPointDefault`
  diventa un oggetto;
- il rubinetto verso il `Default` ha tre bocche: `classes.ts:1181`, il terzo fallback di
  `resolveParentViewpoint` (`utils/lastViewpoint.ts:146-152`, due chiamanti), e i due default di
  `DViewElement.new2` (`view/viewElement/view.tsx:339-340`).

---

## DOVE

Punti di partenza, non elenco esaustivo. La discovery puo' e deve allargarsi dove serve.

| File | Perche' |
|---|---|
| `frontend/src/redux/VersionFixer.tsx` | catena adapter (testa a `2.226 -> 2.227`, riga 1067), riga 134, loop di coda 136-154 |
| `frontend/src/common/Defaults.ts` | registri, `check`, `isSystemViewpoint`, `holdsOnlySystemViews`, `freshViewsMap` |
| `frontend/src/redux/reducer/reducer.ts` | guardia e popolamento delle mappe, righe 1103-1112 |
| `frontend/src/redux/store.tsx` | seed: `init_editor` da riga 243, `makeDefaultGraphViews` da 358, le sei `makeEdgeView` 418-423 |
| `frontend/src/redux/defaults/views.ts` | quattordici dei venti siti di creazione |
| `frontend/src/joiner/classes.ts` | 1181, 1232, 2899, 2924, 3352-3360, 3707-3711 |
| `frontend/src/view/viewElement/view.tsx` | `new2` 336-342, `newDefault` 373-375, `compiled_css` 903, `updateDefaultView` 1917-1945 |
| `frontend/src/utils/lastViewpoint.ts` | `resolveParentViewpoint` 123-152, chiamanti 205 e `EditorV2.tsx:3049` |
| `frontend/src/redux/selectors/selectors.ts` | 529 e il gradino `VP_Default` 556-557 |
| `frontend/src/api/persistance/projects.ts` | 95-125 salvataggio, 202-280 `Offline`, 320-360 caricamento |
| `frontend/src/utils/versionUtils.ts` | `getNextVersionNumber`, per D4 |
| `frontend/src/components/editors/views/NestedView.tsx` | 82, 110-111, 314-315, 544: unico writer oltre a `lastViewpoint.ts:55` |
| `frontend/src/components/editor-v2/Toolbar.tsx` | 214-229, normalizzazione a render time gia' esistente |

---

## COME: le domande a cui il report deve rispondere

### Blocco A, blast radius del ritiro del seed

- **A1.** Censimento completo dei riferimenti a `Pointer_ViewPointDefault`, `Defaults.viewpoints`,
  `Defaults.views` e ai venti id `Pointer_View*`, in `src/`, nei test, nelle fixture e negli script
  dei gate. Per ciascuno: e' un uso come **identita'** (confronto), come **fallback** (ripiego) o come
  **costruzione** (creazione)? Solo la terza categoria sparisce col seed; le prime due vanno decise
  una per una.
- **A2.** `Defaults.check(id)` (`Defaults.ts:99`): tutti i chiamanti, e per ciascuno cosa cambia se la
  risposta diventa `false` per gli id che oggi restituisce `true`.
- **A3.** La guardia di `reducer.ts:1104` si sblocca solo quando `Pointer_ViewPointDefault` diventa un
  oggetto. Senza seed non si sblocca mai. Determina, leggendo il codice: quante volte gira il loop in
  quel caso, che cosa finisce nelle due mappe, e che cosa fanno con mappe di booleani i tre
  consumatori (`Defaults.check`, il loop di coda di `VersionFixer`, `updateDefaultView` a
  `view.tsx:1919`). Il report deve dire quale delle tre fallisce per prima e con quale sintomo.
- **A4.** Il loop di coda 148-154. Opzioni sul tavolo e conseguenze di ciascuna: lasciarlo con
  registri vuoti; renderlo condizionale; rimuoverlo. Interazione con `updateDefaultView`, che
  rigenera le default non toccate al bump di versione.
- **A5.** `selectors.ts:556-557`: il gradino `VP_Default` scatta su
  `dvp.id === 'Pointer_ViewPointDefault'`, stringa letterale. Senza seed nessuna view avra' quel
  viewpoint. Che cosa succede alla cascata `viewScores` / `stackViews`, e in particolare: le view che
  oggi prendono `VP_Default` dove finiscono, `VP_Decorative` o `VP_MISMATCH`? Determina se cambia
  la view scelta per un nodo, che e' l'unico effetto visibile.
- **A6.** Test e fixture che dipendono dal seed. Quali dei 1315 test lo assumono, e quali delle nove
  suite gia' rosse toccano quest'area.

### Blocco B, `activeViewpoint` a 0..1 con `null`

- **B1.** `LViewPoint.fromPointer(null)` e `fromPointer(undefined)`: cosa restituiscono davvero, con
  il codice alla mano. Da questo dipende se il getter puo' restituire `null` o se serve un tipo di
  ritorno diverso.
- **B2.** Gli undici siti di lettura elencati nella sezione 3, F7 del report di riferimento. Per
  ciascuno: cosa fa oggi con un valore vuoto, cosa farebbe con `null`, e se serve un intervento.
  Segnala in particolare `selectors.ts:529`, che legge `.id` senza optional chaining.
- **B3.** `NestedView.tsx` scrive `project.activeViewpoint = ptr`. Verifica se quel percorso puo'
  ricevere `null` e cosa fa il setter `classes.ts:3355-3361` in quel caso (passa da
  `Pointers.from`: cosa restituisce su `null`?).
- **B4.** Percorso di persistenza: `projects.ts:338` copia `raw.activeViewpoint` grezzo. Un `null`
  sopravvive al giro `compressToUTF16` / `JSON` / `decompressFromUTF16`? E il DTO lato server lo
  accetta, o rimanda un default?
- **B5.** Cambiare la cardinalita' nel tipo e' type-only. Quali errori di typecheck emergono dal
  cambio ai due inizializzatori (`classes.ts:2899` e `2924`) e alla firma del getter? Esegui il
  typecheck su un albero da `git archive` con la modifica applicata **in locale e non committata**,
  riportane il conteggio, e poi **scarta la modifica**. Baseline attesa: 14 nell'albero da
  `git archive`, 33 su macOS.

### Blocco C, la migration

- **C1.** Dove puo' stare la purga senza essere annullata dal loop di coda. Almeno tre collocazioni
  possibili, con pro e contro: dentro l'adapter piu' svuotamento dei registri; dopo il loop di coda;
  dentro il loop di coda reso condizionale.
- **C2.** Che cosa punta agli id delle view purgate. Usa come modello il Finding 2 di
  `docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md`, che elenca sei categorie di
  puntatore pendente per i DValue. Fai l'equivalente per i `DViewElement`: `subViews` del viewpoint
  padre, `viewelements` di root, `pointedBy`, `viewpoint` dei figli, `transientProperties`,
  `VIEWS_RECOMPILE_*`, e qualunque altra sede tu trovi. **Una ricerca dichiarata ed eseguita**, non
  un elenco plausibile.
- **C3.** Idempotenza: al secondo run la migration deve essere no-op. Indica come verificarlo e su
  quale fixture.
- **C4.** La condizione «identica al seed». Il termine di paragone sparisce nello stesso commit che ne
  ha bisogno. Proponi la forma concreta: tabella di firme congelata dentro la migration, confronto
  strutturale, oppure il solo test su `clonedCounter` non definito. Argomenta con la misura del
  report (zero default toccate sul progetto reale) e di' che cosa perdi in ciascuna forma.
- **C5.** D4, il numero di revisione. Il percorso e' `VersionFixer.tsx:134` che scrive la versione di
  schema su `DProject.version`, e `projects.ts:101-104` che la tratta come revisione utente.
  `classes.ts:1232` dice che i progetti caricati partono da `-1` «to be extracted from state».
  Ricostruisci quale valore era inteso, e proponi la correzione minima.

### Blocco D, gate e baseline

- **D1.** Misura le baseline attuali **prima** di qualunque ipotesi: typecheck, vitest, build,
  `check:docs`, `check:agents`. Riportale nel report con le unita' e il metodo.
- **D2.** Quale dei gate coprirebbe una regressione su questi due fronti, e quale no. Se nessuno la
  copre, dillo: e' un input alla Fase 2.

---

## Vincoli

- **Read-only.** Nessuna modifica al codice, con la sola eccezione temporanea di B5, che va scartata
  subito dopo la misura. Verifica con `git status` prima di chiudere.
- **Discovery report obbligatorio.** Salvalo in `docs/discovery/` con naming
  `discovery_<data>_<descrizione>.md`, data in formato `YYYY-MM-DD` e descrizione breve in
  snake_case. Nome previsto:
  `docs/discovery/discovery_2026-08-19_2228_seed_e_activeviewpoint.md` (adatta la data a quella
  reale di esecuzione; se ce n'e' gia' uno sullo stesso tema nello stesso giorno, aggiungi il
  suffisso `_N`). Contenuto minimo: obiettivo, file letti con path completi, findings, dipendenze e
  rischi, domande aperte per Alfonso. **La Fase 1 non e' completa finche' il report non e' scritto**:
  l'analisi in chat parte dal file, non dalla tua memoria di sessione.
- **Entry di log.** Aggiungi l'entry in `docs/claude-code-log.md` col formato previsto. Il campo
  `Notes` sta **sotto i 500 caratteri**: il gate lo impone dal 2026-08-19, ma applicalo da subito. Il
  ragionamento va nel discovery report, e l'entry lo cita per nome.
- **Commit.** Solo i due file prodotti, con pathspec esplicita:
  `git commit -m "<messaggio>" -- docs/discovery/<report>.md docs/claude-code-log.md`.
  Mai `git add .`. Il messaggio in inglese, tipo `docs:`, una riga. Se altre sessioni hanno messo
  roba nell'indice, la pathspec al commit ti protegge: verificala comunque con
  `git diff --cached --name-only`.
- **Nessuna decisione architetturale.** Dove ci sono alternative, elencale con pro e contro e lascia
  la scelta ad Alfonso. Le uniche decisioni gia' prese sono D1-D4 sopra.
- **Asserzioni di assenza.** Valgono solo se dichiari la ricerca che le sostiene (R-RAIL-28). Vale
  anche per i numeri scritti a parole, non solo per le cifre: una grep su `20` non trova «venti».

---

## HARD STOP

Al termine della Fase 1 **fermati**. Non iniziare la Fase 2, non modificare `VersionFixer.tsx`, non
toccare il seed. La Fase 2 parte solo dopo che Alfonso ha letto il report e dato il go-ahead, e
richiede prima un Layer Impact Report perche' `VersionFixer.tsx` e' zona critica.

---

## RIFERIMENTI

- `docs/discovery/discovery_2026-08-18_3_corpus_persistito_e_due_migrazioni.md`, base di partenza
  obbligatoria.
- `docs/decisions.md`, sezione «Serie R-IRN», in particolare R-IRN-1, R-IRN-2, R-IRN-7, R-IRN-8,
  R-IRN-9 con i suoi emendamenti, R-IRN-10.
- `docs/discovery/discovery_2026-07-20_versionfixer_bonifica_slot.md`, modello di come si progetta una
  migration su questo file: forma della trasformazione, censimento dei puntatori pendenti,
  idempotenza, strategia di test.
- `docs/discovery/discovery_2026-08-16_2_le_23_view_di_default.md` e
  `docs/discovery/discovery_2026-08-16_viewpoint_default_e_validation.md`, contesto sulle default e
  sul viewpoint `Default Validation` gia' ritirato da R-IRN-8.
- `CLAUDE.md` e `docs/PROTOCOL.md`, normativi. In caso di conflitto con questo prompt, segnala il
  conflitto invece di eseguire.
