# Discovery: il rail destro della dashboard e la larghezza della griglia progetti

**Data**: 2026-08-14
**Autore**: sessione Cowork (Claude), lettura diretta del working tree
**Branch**: `alfonso-frontend-jjtl`
**Working tree alla lettura**: `M docs/claude-code-log.md` e `A docs/discovery/discovery_2026-08-14_jjel_come_linguaggio_espressioni_ir.md`
gia' in staging da una sessione concorrente; untracked `.claude/settings.local.json`, `_to_delete/`,
`docs/discovery/discovery_2026-08-13_metaclass_picker_flat.md`. **Nessun sorgente modificato prima del task.**

**Obiettivo**: stabilire chi monta il pannello Overview / Quick Actions / Recent Activity della
dashboard, se sia condiviso con il project editor, e che cosa serve perche' la sua rimozione
restituisca larghezza alla griglia dei progetti invece che spazio vuoto.

**Origine**: osservazione di Alfonso sulla schermata `#/allProjects` del 2026-08-14, "in alto a
destra c'e' una card con overview, mi chiedo se ha senso tenerla". Analisi e tre alternative
discusse in chat; scelta ratificata: variante A, rimozione del rail.

---

## 1. Chi monta il rail, e dove compare

Componente: `frontend/src/pages/components/RightPanel/` (7 file, 1317 righe complessive).

Unico consumatore, ricerca su tutto `frontend/src`:

| Sito | Riga |
|------|------|
| `pages/components/Dashboard.tsx` | `19` import, `310` `showRightPanel`, `311` `layoutClass`, `339-341` render |

Le occorrenze di `RightPanel` in `jjtl/components/JjtlDevelopmentEnv.tsx` sono variabili locali
(`rightPanelWidth`, `isResizingRightPanel`) di un pannello diverso: nessuna relazione.

**Il project editor non lo usa.** `ProjectDashboard` (`Dashboard.tsx:620-633`) monta
`dashboard-container two-column` e al posto del rail ha un commento `TODO` che ne descrive una
versione contestuale mai scritta. La domanda "e' condiviso col project editor" ha quindi risposta
negativa, verificata sul codice e non dedotta.

**Ma non e' solo la pagina progetti.** La condizione e' `active !== 'Project' && hasProjects`
(`Dashboard.tsx:310`): il rail compare su **tutte** le pagine della dashboard, cioe' All, Recent,
Notes, Updates, Profile, Templates, Explore, per chiunque abbia almeno un progetto. Rimuoverlo li
rimuove ovunque. E' coerente con la decisione presa, ma va dichiarato: la richiesta parlava della
pagina progetti, l'effetto e' su sette viste.

## 2. Anatomia del rail

`RightPanel.tsx`, tre sezioni:

- **Overview**, quattro celle in `.overview-grid`. Le prime tre navigano (`/allProjects`,
  `?filter=favorites`, `?filter=recent`), la quarta va a `/account` e **il suo valore e' la
  stringa letterale `—`** (`RightPanel.tsx:113`). Non e' un dato mancante a runtime: e' hardcoded.
- **Quick Actions**, tre bottoni: New Project, User Manual, Documentation.
- **Recent Activity**, alimentata da `useRecentActivities({limit: 15, enableGrouping: true})`
  e raggruppata da `groupTimelineActivitiesByTime`.

Larghezza fissa in tre dichiarazioni: `RightPanel.scss:7-9`, `width/min-width/max-width: 360px`.
Il rail e' quindi 360px, non i 250 che l'occhio stima sulla schermata.

`DevModeLabel componentId="T4.4"` a `:66`. L'id e' registrato in `contexts/DevModeContext.tsx:25,44`
come "Right Panel Tabs": la registrazione resta valida anche a rail non montato, e non va toccata.

## 3. Le duplicazioni, misurate sulla schermata

Sette coppie, tutte verificabili a video sulla stessa viewport:

| # | Nel rail destro | Gia' presente altrove |
|---|-----------------|-----------------------|
| 1 | Quick Actions "New Project" | CTA in testa al contenuto (`AllProjects.tsx:131-137`) |
| 2 | (nessuna, ma vale per la pagina) tab All/Public/Private/Collaborative | sezione FILTERS del `LeftBar` |
| 3 | Overview "84 Projects" | "Load More (72 remaining)" piu' 12 card a schermo |
| 4 | Overview "0 Favorites" | sezione FAVORITES del `LeftBar`, "No favorites yet" |
| 5 | Overview "2 Modified Today" e Recent Activity | sezione RECENTLY MODIFIED del `LeftBar`, piu' "Modified ..." su ogni card |
| 6 | Quick Actions "Documentation" | sezione RESOURCES del `LeftBar` |
| 7 | quarta cella "Account" con valore `—` | avatar utente nella navbar |

Difetto autonomo del feed: le righe rendono il nome dell'elemento (`model_1`, `metamodel_2`) senza
il progetto di appartenenza. Con i nomi di default identici in tutti i progetti, le righe sono
indistinguibili. Non e' oggetto di questo task ed e' la ragione per cui il feed non viene
riposizionato altrove.

## 4. Perche' togliere il rail non basta: due colli di bottiglia

Questa e' la parte non ovvia. Rimuovere `<RightPanel/>` restituisce 360px al layout, ma **nessuno
dei due meccanismi a valle li usa**.

**(a) Il contenuto e' capped a 1200px.**
`dashboard.scss:10-15`

```scss
.dashboard-main-content { width: 100%; max-width: 1200px; margin: 0 auto; padding: var(--space-6); }
```

Il wrapper e' montato solo da `AllProjects.tsx:117`, quindi il cap riguarda la sola pagina
progetti. Su viewport larga la colonna centrale passa da `1fr` di
`grid-template-columns: 240px 1fr 360px` a `1fr` di `240px 1fr`, ma il contenuto resta a 1200 e i
360px liberati diventano margine.

**(b) La griglia gallery ha tre colonne fisse.**
`catalog/catalog.scss:948-961`

```scss
&--gallery {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  @media (max-width: 767px) { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  @media (max-width: 420px)  { grid-template-columns: 1fr; }
}
```

Non e' `auto-fill`. Con piu' larghezza a disposizione le colonne restano tre e le card si allargano.
Da notare che, per ordine sorgente, questa dichiarazione base vince sulla media query
`max-width: 1199px` del `.slider-page` genitore: **fra 768 e 1199px la gallery mostra gia' oggi tre
colonne strette**, non due. Il passaggio ad `auto-fill` corregge anche quel caso.

La griglia `.projects-grid, .catalog-grid, .project-cards-grid` (`project-card.scss:27-38`) usa
invece gia' `repeat(auto-fill, minmax(300px, 1fr))`. Il pattern esiste nel codebase: la gallery e'
l'eccezione, non la regola.

**Catena orizzontale completa sulla pagina progetti**, a rail rimosso e viewport `W`:
`dash-content.projects-view` azzera padding e margin (`dashboard.scss:495-502`), quindi
larghezza griglia = `min(cap, W - 240) - 48` (padding `.dashboard-main-content`) `- 48`
(padding `.projects-slider`, `catalog.scss:922-929`).

Con `cap = 1440` e `minmax(280px, 1fr)` a gap 12: `1440 - 96 = 1344`,
`floor((1344 + 12) / 292) = 4`. Quattro colonne al cap, tre sotto i ~1230px di contenuto, senza
breakpoint magici.

## 5. File coinvolti e cosa cambia

Tre sorgenti, sotto la soglia dei cinque della Regola 19.

| File | Cambio |
|------|--------|
| `pages/components/Dashboard.tsx` | rimozione di import, `showRightPanel`, ramo `three-column` e render del rail |
| `pages/dashboard.scss` | `max-width` di `.dashboard-main-content` da 1200 a 1440; blocco `.three-column` marcato `TODO: cleanup` |
| `pages/components/catalog/catalog.scss` | `--gallery` da `repeat(3, ...)` ad `auto-fill minmax(280px, 1fr)` |

**Non toccati, per Regola 9**: i sette file di `RightPanel/`, il blocco `.three-column` di
`dashboard.scss`, la registrazione `T4.4` in `DevModeContext.tsx`. Restano in albero perche' la
variante B discussa in chat (rail che diventa "riprendi da qui") li riuserebbe quasi tutti.

## 6. Rischi

1. **`hasProjects` diventa inutilizzato.** Serviva solo a `showRightPanel` (`Dashboard.tsx:309-310`,
   nessun altro uso nel file). Va rimosso insieme, altrimenti resta una variabile morta. `tsconfig`
   ha `strict: true` ma non `noUnusedLocals`, quindi non sarebbe un errore di compilazione: e'
   pulizia dovuta, non necessaria.
2. **Sette viste cambiano, non una.** Vedi §1. Nessuna di esse ha un layout alternativo previsto:
   tutte ricadono su `two-column`, che esiste ed e' gia' il layout del project editor.
3. **Il cap a 1440 e' una scelta, non una misura.** Sotto i ~1680px di viewport non viene
   raggiunto e il contenuto resta fluido; sopra, limita la lunghezza di riga. Se a schermo risulta
   troppo stretto o troppo largo, e' un numero e si cambia.
4. **La media query `max-width: 1200px` dentro `.three-column`** nascondeva il rail sui monitor
   medi (`dashboard.scss:339-344`). Sparendo il rail, quella regola diventa inerte: su quelle
   larghezze il comportamento e' identico a prima, cioe' nessun rail.
5. **Gate non eseguibili da questa superficie.** `frontend/node_modules` porta binari darwin-arm64
   e la VM del bridge e' Linux aarch64: `npm run build`, `typecheck` e `test` non partono. Limite
   gia' registrato nelle due entry precedenti del log. La verifica resta ad Alfonso.

## 7. Criterio di accettazione

Una sola frase controllabile a vista, su `#/allProjects` a finestra larga:

> Il rail destro non c'e', la griglia mostra **quattro** card per riga invece di tre, e fra
> l'ultima card e il bordo destro della finestra non resta piu' spazio vuoto di quanto ce ne sia
> fra la prima card e il rail sinistro.

Da controllare inoltre: le pagine Recent, Notes, Updates, Profile, Templates ed Explore non
mostrano piu' il rail e non hanno colonne vuote; la CTA "New Project" in testa alla pagina continua
ad aprire il dialog; il drag and drop di un `.jjodel` sul container continua a importare.

## 8. Domande aperte

- Il feed di attivita' va recuperato altrove, una volta risolto il difetto dei nomi (§3)? Oggi non
  ha una casa alternativa e questo task non gliene assegna una.
- La variante B (rail come "Continue", con anteprima del canvas e attivita' raggruppata per
  progetto) resta sul tavolo: richiede una thumbnail del canvas, che non esiste, e un concetto di
  "ultimo progetto aperto" distinto da "ultimo modificato".
