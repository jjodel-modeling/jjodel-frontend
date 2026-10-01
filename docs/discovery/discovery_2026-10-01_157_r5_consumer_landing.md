# Discovery — #157 R5, chi apre il link stand-alone atterra sul Configurator

**Data**: 2026-10-01
**Branch**: `feat/157-environment-config` @ `b4620f3ed`
**Fonte**: decisione UX di @tmaog, #157 issuecomment-5893727318 punto 6, e il suo mockup
(rosso = togliere, verde = aggiungere, arancione = modificare).
**Stato**: Fase 1 read-only. Nessun sorgente toccato.

## 0. Answer in brief

- Oggi chi apre `#/project?id=X&profile=Y` vede Navbar + LeftBar + Dock: il Dock mostra la tab
  «project summary» con Metamodels/Models, e il Configurator è un overlay a schermo intero da
  aprire a mano («Open Configurator» nella LeftBar).
- **Proposta**: in consumer il Configurator diventa la pagina. Si disegna **sopra** l'area del
  Dock (posizionato assoluto nel suo contenitore), senza X; il Dock resta montato sotto, così
  ProjectEditor e tutto ciò che vive nel Dock continuano a funzionare e il ritorno al developer
  togliendo `&profile=` (F3-A) resta senza ricarica.
- **Navbar in consumer** (mockup, rosso): via i menu Jjodel/File/Edit/View, l'etichetta del
  progetto, la striscia delle tab e il «+». Restano logo, «Saved/Unsaved», **Save** (già fatto),
  Basic/Advanced, Help, avatar. Ctrl+S continua a funzionare: dipende dall'URL, non dal Dock.
- **LeftBar in consumer**: via «Open Configurator» (rosso). La colonna Models (arancione)
  diventa l'elenco dei **tipi** visibili al profilo, che seleziona il tipo nel Configurator.
- **«All projects» → «My models»** (arancione) dipende da F4b (chi è l'utente, a quali ambienti
  ha accesso): oggi non c'è niente di vero da elencare.
- Nessun file di §3.1. 7 file previsti (§4): sopra la soglia di 5, elenco per conferma.

Decisioni per Juri:
1. Il fruitore usa **solo il Configurator** (niente editor del modello su canvas, niente tab del
   Data Manager)? Il mockup lo implica: niente striscia delle tab, colonna Models riusata.
   Recommended: sì; il dettaglio del Configurator è già quello del Data Manager.
2. I tipi: nella **colonna di sinistra** (mockup) o nella barra in alto del Configurator com'è oggi?
   Recommended: colonna di sinistra, come nel mockup; la barra in alto sparisce nella pagina.
3. «All projects» e il logo portano al catalogo del developer. Recommended: in consumer niente
   link indietro e logo inerte finché F4b non dà un «My models» vero.
4. Azioni Progetto (Download, Favorites, Share, Close project): il mockup le tiene. Recommended:
   tenerle ora, rivederle con F4b (Close e Download hanno senso da developer).

## 1. Ipotesi che la discovery falsifica

- **H1** «Il Configurator si può mostrare al posto del Dock smontando il Dock». Non conviene: il
  Dock ospita ProjectEditor (tab `project_summary`), che possiede i listener degli eventi del
  progetto (share, create model, megamodel) e la sincronizzazione delle trasformazioni; e F3-A
  prevede il ritorno al developer senza ricarica. Coprire, non smontare.
- **H2** «Ctrl+S ha bisogno del Dock». Falsa: `detectCurrentContext` (`utils/keyboardShortcuts.ts:31`)
  decide dal hash (`path.includes('/project')` → `PROJECT_EDITOR`), non dal DOM del Dock.

## 2. File letti

- `frontend/src/components/environment/consumerMode.ts` (intero)
- `frontend/src/pages/components/LeftBar.tsx:104-460`
- `frontend/src/pages/components/Dashboard.tsx:560-650`
- `frontend/src/pages/components/Navbar.tsx:575-590, 1360-1380, 1520-1565, 1805-1820, 1860-1990`
- `frontend/src/components/environment/ConfiguratorTab.tsx` (intero), `configuratorTab.scss` (intero)
- `frontend/src/pages/dashboard.scss:420-430`
- `frontend/src/utils/keyboardShortcuts.ts:31-60`

## 3. Findings

### F1 — la pagina del progetto
`Dashboard.tsx:636-638`:
```
<div className={`dashboard-container two-column${hideLeftBar ? ' hide-leftbar' : ''}`}>
    {!hideLeftBar && <LeftBar active={'Project'} project={project} />}
    <div className="project-dock-wrapper">
```
`hideLeftBar` (`:565`) diventa vero quando la tab attiva è un editor (metamodel/model/
transformation, `:579-580`). Il contenitore `.project-dock-wrapper` (`dashboard.scss:420`) non è
`position: relative` e forza `> div { height: 100% !important; }`.

### F2 — il Configurator è un overlay della LeftBar
`LeftBar.tsx:459`: `<ConfiguratorTab open={showConfigurator} onClose={() => setShowConfigurator(false)} />`;
aperto da «Open Configurator» (`:447`), presente anche in consumer. `ConfiguratorTab.tsx:240`
`return createPortal(` su `document.body`, `.configurator-overlay` è `position: fixed; inset: 0`;
chiusura `:256` `configurator__close`. Per questo l'editor aperto da `createM1` lo chiudeva
(corretto in `6d35280cd`): vive e muore con la LeftBar.

### F3 — LeftBar in consumer
Già nascosti (F3): Megamodel, Metamodels, Transforms, Viewpoints, «Configure environment».
Restano: `psb-back` «All projects» (`:363`, va al catalogo con il controllo unsaved), la sezione
Models (`:384`, apre editor e Data Manager), le azioni Progetto, «Open Configurator».

### F4 — Navbar in consumer
Già nascosti (F3b): New Project, New → Metamodel, Tools, Analyze, le tab developer. Restano e il
mockup segna in rosso: `<MainMenu items={items} />` (`:1872`), `project-label` (`:1880`), la
striscia `appbar-tabs` (`:1903`) con `<NewDocumentButton ...>` (`:1978`). Il logo
(`:1862`) fa `R.navigate('/allProjects')`: porta il fruitore nel catalogo del developer.

## 4. Piano (Fase 2, dopo le decisioni)

1. `pages/components/Dashboard.tsx` — in consumer: LeftBar sempre visibile, Configurator pagina
   sopra il Dock; listener `hashchange` per il ritorno al developer senza ricarica.
2. `pages/dashboard.scss` — `position: relative` sul contenitore del Dock.
3. `components/environment/ConfiguratorTab.tsx` — `variant?: 'overlay' | 'page'` (prop opzionale,
   Rule 11): in pagina niente portale, niente X, niente barra dei tipi se la decisione 2 è
   «colonna di sinistra»; selezione del tipo via evento.
4. `components/environment/configuratorTab.scss` — stile della variante pagina.
5. `pages/components/LeftBar.tsx` — in consumer: niente «Open Configurator» né overlay; colonna
   dei tipi al posto di Models (decisione 2); back link secondo la decisione 3.
6. `pages/components/Navbar.tsx` — in consumer: niente MainMenu, etichetta progetto, tab, «+»;
   logo inerte (decisione 3).
7. `events/registry.ts` — due costanti per la selezione del tipo tra LeftBar e Configurator
   (CustomEvent + `useState`, §8.7), mai stringhe `'jjodel:...'` (Rule 25).

Verifica: la sonda Playwright `_tmp_157_158_verify.ts` si estende con lo stato consumer
(atterraggio, assenza dei menu, selezione del tipo dalla colonna, ritorno al developer), più
`npm run smoke`.

## 5. Rischi

- Il ritorno al developer togliendo `&profile=` deve far ricomparire Dock e LeftBar normali:
  coperto dal Dock che resta montato; da misurare con la sonda.
- `PropertiesWithTreeView` (`Dashboard.tsx:645`) è portalato su body: in consumer non deve
  comparire sopra la pagina (oggi compare solo con un editor attivo, che in consumer non si apre).
- Le azioni Download/Close project in consumer portano fuori dall'ambiente o scaricano anche i
  metamodelli (enforcement soft, D1): da rivedere con F4b.

## 6. Domande aperte

Le quattro decisioni del §0.

## 7. Decisioni di Juri (2026-10-01, in chat)

1. Il fruitore usa **solo il Configurator**: niente editor su canvas, niente tab del Data Manager.
2. I tipi stanno nella **colonna di sinistra**; nella pagina la barra in alto del Configurator sparisce.
3. In consumer **niente link indietro** («All projects») e **logo inerte**, finché F4b non dà un «My models».
4. Azioni Progetto (Download, Favorites, Share, Close project) **tenute** per ora; via solo «Open Configurator».
5. Scope: i 7 file del §4, confermati.
