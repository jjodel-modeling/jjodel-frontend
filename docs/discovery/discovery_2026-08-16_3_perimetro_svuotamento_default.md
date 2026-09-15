# Discovery 2026-08-16 (3) — Perimetro dello svuotamento del viewpoint `Default` (opzione B)

**Fase**: 1 (read-only). Nessun file di codice toccato.
**Decisione a monte (Alfonso, 2026-08-16)**: opzione **B**, «nascondi e svuota». `Default` esce dalle
liste utente, smette di seminare le sue 20 view, e i salvataggi vengono purgati. Il viewpoint resta
come record ancora. L'opzione C (rifare `Default` come viewpoint con notazione IR autorata) resta
un fronte aperto e non pregiudicato, e quando si aprirà emenderà R-IRN-1.
**Albero analizzato**: working tree locale, branch `alfonso-frontend-jjtl`, HEAD `70f7822d1`.
Working tree con `useContentSize.ts` modificato (fuori perimetro) e tre untracked, di cui uno
(`docs/discovery/discovery_2026-08-16_appliable_to_discriminatore.md`) non risulta dal documento di
sessione: **da chiarire con Alfonso prima di committare in questa cartella**.
**Continuità**: terzo report della serie. (1) i due viewpoint, (2) le 23 view, (3) il perimetro
dello svuotamento.
**Ambiente**: VM del bridge, `type grep` = `/usr/bin/grep` (GNU). Ogni asserzione di assenza porta
il suo controllo positivo (R-RAIL-28).

---

## 1. Obiettivo

Stabilire che cosa tocca davvero l'opzione B, prima di scrivere qualsiasi diff:

1. dove si nasconde `Default` dalle liste utente, e se è davvero «un solo posto»;
2. che cosa succede quando `Defaults.views` va a zero;
3. se la purga dei record di `Default Validation` può essere incondizionata;
4. quali consumatori cambiano comportamento senza essere nel perimetro dichiarato.

## 2. File letti

Percorsi relativi a `frontend/src/`.

| File | Righe | Perche' |
|------|-------|---------|
| `common/Defaults.ts` | 1-35, 68-71, 87-100 | Registri correnti, costanti residue, `check()` |
| `joiner/classes.ts` | 3294-3340, 3440-3452 | `get_views`, `get_viewpoints`, `get_activeViewpoint`, filtro subElements |
| `pages/components/Dashboard.tsx` | 365-392 | Soglia sul numero di viewpoint |
| `api/persistance/projects.ts` | 97, 223 | `viewpointsNumber` persistito |
| `components/abstract/tabs/EditorSwitch.tsx` | 70-100 | Validazione contro `state.viewpoints` |
| `components/abstract/Dock.tsx` | 288, 313 | Mount di `Console` |
| `redux/VersionFixer.tsx` | 149-154, 295-315 | Reiniezione dei default, `rootPointers` |
| `redux/reducer/reducer.ts` | 1104-1112 | Bootstrap dei registri |
| `components/megamodel/MegamodelView.tsx` | 37-39 | Esclusione per puntatore (gia' corretta in `d68c4bbc8`) |

---

## 3. Findings

### F1. Il punto di iniezione e' uno solo, i consumatori sono otto e non vogliono la stessa cosa

`joiner/classes.ts:3324` e' l'unico posto che prepone i viewpoint di sistema:

```typescript
protected get_viewpoints(context: Context): this['viewpoints'] {
    return LViewPoint.fromPointer([...Defaults.viewpoints, ...(context.data.viewpoints || [])]);
}
```

Ma `LProject.viewpoints` ha consumatori con intenzioni divergenti:

| Consumatore | Vuole l'esclusione? |
|-------------|---------------------|
| `components/TreeViewSidebar/TreeViewContent.tsx:2297` | si' (e' la lista dove si vedono le 20 view) |
| `components/project/ProjectEditor.tsx:205` | si' |
| `pages/components/LeftBar.tsx:275` | si' |
| `pages/Project.tsx:72` | si' |
| `components/editors/views/NestedView.tsx:543` | si' |
| `components/editors/Info.tsx:1352` | si' |
| `pages/components/Dashboard.tsx:463` e 369-372 | si', ma vedi F2 |
| `api/persistance/projects.ts:97` | **no**: e' un conteggio persistito, vedi F3 |

E due getter interni dipendono dal prepend in modo non negoziabile:

- `classes.ts:3335` `get_activeViewpoint` risolve su `Defaults.viewpoints[0]` quando il progetto non
  ne ha uno attivo. Deve continuare a risolvere anche se `Default` non compare in lista.
- `classes.ts:3296` `get_views` deriva le view del progetto da `get_viewpoints(c).flatMap(vp => vp.allSubViews)`.
  Togliere `Default` dalla lista ne toglie anche le view da `LProject.views`. Dopo lo svuotamento
  e' senza effetto, ma nella finestra tra il codice nuovo e la migration di un dato progetto **non**
  lo e'.

**Conseguenza sul disegno della fetta**: «escludere per puntatore in un solo posto» ha due letture.
(a) togliere il prepend da `3324` e riparare i consumatori che lo volevano; (b) lasciare `3324`
intatto e introdurre un getter separato per le liste utente. La (a) e' piu' pulita ma cambia otto
comportamenti insieme; la (b) e' piu' sicura e aggiunge superficie. **Decisione dovuta ad Alfonso.**

### F2. `Dashboard.tsx` ha una soglia gia' rotta dal commit `14bbede4d`, indipendentemente da B

`Dashboard.tsx:369-372` sceglie una di quattro immagini con `project.viewpoints.length <= 2` e
`> 2`. Il numero 2 non e' arbitrario: era il numero dei viewpoint di sistema, quindi la condizione
significava «il progetto non ha viewpoint autorati». Dopo `14bbede4d`, `Defaults.viewpoints` ha un
solo elemento (verificato: `Defaults.ts:25`), quindi la soglia e' **sfasata di uno da adesso**: un
progetto con esattamente un viewpoint autorato viene mostrato come se non ne avesse.

`Dashboard.tsx:390` dice inoltre testualmente «<b>{project.viewpoints.length} viewpoints</b>
(including the default ones)»: il numero mostrato e' gia' calato di uno, e la parola «ones» al
plurale non ha piu' referente.

**Questa e' una regressione gia' in albero**, non introdotta da B. E' esattamente il genere di cosa
che lo smoke visivo pendente sui tre commit avrebbe intercettato. B la peggiora (il conteggio
calerebbe di un altro) e quindi deve chiuderla: `Dashboard.tsx` entra nel perimetro dichiarato.

### F3. `viewpointsNumber` esce dal frontend e va sul server

`api/persistance/projects.ts:97` calcola `dProject.viewpointsNumber = project.viewpoints.length`
sul getter L, quindi **includendo i viewpoint di sistema**. Il valore finisce in
`UpdateProjectRequest` (`api/DTO/UpdateProjectRequest.ts:40`), torna in `GetAllProjects` e
`ProjectResponseDTO`, ed e' mostrato in `pages/ProjectsInfo.tsx:22`.

B cambia questo numero per ogni progetto, ma solo **al primo salvataggio successivo**. I progetti
non riaperti conservano il vecchio conteggio: divergenza permanente sul dato lato server tra
progetti toccati e non toccati. Non e' un blocco, e' una cosa da dichiarare e non da scoprire.

### F4. `Console.tsx` e' montato: la domanda 3 della discovery (2) va riaperta con segno opposto

La discovery precedente chiedeva se `Console` fosse vivo, perche' e' l'unico consumatore di
`viewScores` fuori dal giro classico. **Lo e'**: `components/abstract/Dock.tsx:288` lo monta come
tab non chiudibile (`closable: false`) e `:313` lo rende una seconda volta. L'import arriva dal
barrel `components/editors/index.ts:3`, ed e' per questo che una ricerca sui soli import diretti al
file lo faceva sembrare morto: le uniche due righe che importano `./Console` per path sono
entrambe commentate (`DockLayout.tsx:27`, `ResizableLayout.example.tsx:29`).

Controllo positivo sulla stessa ricerca: `<Info` restituisce occorrenze vive.

Conseguenza: il ritiro della cascata `viewScores`/`stackViews` (fronte separato, non questa fetta)
non e' la formalita' che sembrava. Non tocca B, perche' B non spegne la cascata: la lascia girare
su un viewpoint vuoto.

### F5. La purga di `Default Validation` ha un bersaglio pulito

I quattro puntatori sopravvivono in **quattro righe soltanto**, tutte di dichiarazione:
`Defaults.ts:68-71`. Nessun altro riferimento in `frontend/src` esclusi `examples/` (grep sui
quattro nomi, output completo). Sono esattamente gli id che la migration deve cercare, come dice
R-IRN-8.

### F6. Lo stato dei registri conferma `14bbede4d`

`Defaults.views` conta **20** puntatori (`Defaults.ts:5-24`), `Defaults.viewpoints` **1**
(`Defaults.ts:25`). Coerente con 23 meno le tre di validazione.

### F7. La readOnly per costruzione regge sulle superfici UI, non e' verificata altrove

`Defaults.check(id)` gate la sola lettura in dodici superfici di editing (elenco confermato dal
grep: `Javascript.tsx:33`, `Js.tsx:35`, `Ocl.tsx:20`, `Jsx.tsx:18`, `Selector.tsx:17`,
`CountryPicker.tsx:17`, `Color.tsx:148`, `MTM.tsx:528`, `MySelect.tsx:18`, `Input.tsx:161`,
`ViewData.tsx:52`, `NestedView.tsx:396`) e a `view.tsx:543` rende le default non cancellabili.

Questo sostiene la tesi «i record salvati non contengono lavoro dell'utente, quindi la purga puo'
essere incondizionata». **Ma la verifica non e' completa**: non ho controllato le scritture
programmatiche che non passano da queste superfici (JjScript, console di sviluppo, import di
progetto da file esterno, API). Finche' quel controllo non e' fatto, la purga incondizionata resta
una proposta motivata e non un fatto stabilito.

---

## 4. Dipendenze e rischi

| Rischio | Dove | Mitigazione |
|---------|------|-------------|
| Otto consumatori cambiano insieme | `classes.ts:3324` | Scegliere (a) o (b) di F1 prima del diff |
| Soglia e testo gia' sbagliati | `Dashboard.tsx:369-372, 390` | Entra nel perimetro; e' una correzione, non uno scope creep |
| Conteggio persistito che diverge | `projects.ts:97` | Dichiarare; eventualmente escludere i default dal conteggio in modo esplicito |
| `get_activeViewpoint` senza fallback | `classes.ts:3335` | Non toccare il fallback su `Defaults.viewpoints[0]` |
| Finestra tra codice nuovo e migration | `classes.ts:3296`, `3448` | La migration gira al caricamento, prima del render: verificare l'ordine in Fase 2 |
| Purga incondizionata non ancora giustificata | F7 | Controllo sulle scritture non gated prima di scrivere la migration |
| Marker di `defaultViewTemplate.ts` | migration `2.225 -> 2.226` | Servono finche' esistono progetti non migrati: il loro ritiro viene **dopo**, mai prima |

**Zona critica**: `redux/VersionFixer.tsx` (CLAUDE.md §3.1). `common/Defaults.ts`, `redux/store.tsx`
e `joiner/classes.ts` sono core (regola 5). Nessun diff senza go-ahead e Layer Impact Report.

## 5. Domande aperte per Alfonso

1. **F1, variante (a) o (b)**: togliere il prepend da `classes.ts:3324` e riparare i consumatori,
   oppure lasciarlo e aggiungere un getter dedicato alle liste utente?
2. **F3**: `viewpointsNumber` deve contare i viewpoint di sistema? Se no, la correzione e' una riga
   ma cambia un dato che il server ha gia'.
3. **F2**: la correzione di `Dashboard.tsx` va in questa fetta o in una sua? E' gia' rotta adesso,
   quindi c'e' un argomento per farla subito e separatamente.
4. Il file untracked `discovery_2026-08-16_appliable_to_discriminatore.md` e' tuo? Non risulta dal
   documento di sessione e non voglio committarlo per sbaglio.

## 6. Stato

Fase 1 chiusa con questo report. Nessuna implementazione. Restano da verificare, prima della
migration, le scritture non gated sui puntatori di default (F7).
