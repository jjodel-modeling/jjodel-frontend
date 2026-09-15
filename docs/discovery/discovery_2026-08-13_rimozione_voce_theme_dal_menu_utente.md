# Discovery — rimozione della voce Theme dal menu utente

**Data**: 2026-08-13
**Origine**: «la gestione dei temi (light, dark) la rimandiamo, per ora rimuovi la voce theme dal
menu utente». Richiesta diretta in chat Cowork, subito dopo il fix dark del menu.
**Esito**: rimozione fattibile e contenuta a un solo file. Un punto da sapere prima di
procedere, alla sezione 4.

---

## 1. Obiettivo

Capire cosa tiene in piedi il `<SubMenu label="Theme">` del menu utente, che cosa resta orfano
togliendolo, e se togliendolo il tema dark diventa irraggiungibile dalla UI.

## 2. File letti

- `frontend/src/pages/components/Navbar.tsx` — righe 40, 59, 598, 1607, 2000-2016.
- `frontend/src/pages/components/menu/Menu.tsx` — `SubMenu`, `SubMenuItem`, `Divisor`.
- `frontend/src/pages/settings/AppearanceSettings.tsx` — 87 righe, lette per intero.
- `frontend/src/services/ThemeService.ts`.
- `frontend/tsconfig.json` — per sapere se un simbolo orfano rompe la compilazione.

## 3. Cosa esiste solo per quel blocco

Misurato con `command grep -n` su `Navbar.tsx`, poi su tutto `src` per i consumatori esterni.

| simbolo | occorrenze in `Navbar.tsx` | orfano dopo la rimozione |
|---|---|---|
| `useTheme` (import, `:59`) | 1 import, 1 uso (`:598`) | sì |
| `theme` / `setTheme` (`:598`) | 4 usi, tutti nel blocco `:2001-2016` | sì |
| `Divisor` (import `:40`) | 1 uso, `:2000`, il separatore sopra Theme | sì |
| `SubMenu`, `SubMenuItem` (import `:40`) | usati solo nel blocco | sì |
| `Item`, `Menu`, `UserHeader` (import `:40`) | usati altrove nel menu | no, restano |

`tsconfig.json` non dichiara `noUnusedLocals`: lasciare i simboli orfani non romperebbe la
compilazione, li lascerebbe come codice morto introdotto dal passo stesso. Sono stati rimossi
per questo, non come pulizia opportunistica: la Regola 9 protegge il codice morto
**preesistente**, non quello che il proprio diff crea.

`SubMenu` e `SubMenuItem` in `Menu.tsx` restano definiti e da oggi **senza consumatori** in
tutto `src`. Non rimossi: la Regola 9 li protegge, e servono quando il tema torna.

## 4. Il tema dark resta raggiungibile — ma non dal componente che si pensa

`AppearanceSettings.tsx` ha una coppia di radio Light/Dark funzionante, e quindi la rimozione
non taglia l'unico interruttore. Va però notato che quel pannello **non usa `ThemeService`**:
la riga `//const [theme, setTheme] = useTheme();` (`:6`) è commentata e sotto c'è una
reimplementazione locale che scrive `document.documentElement.setAttribute('data-theme', …)` e
`localStorage.setItem('theme', …)` a mano (`:7-11`), con lo stato in un `useState` proprio
(`:12-17`).

Conseguenza operativa: fino a ieri esistevano **due** scrittori indipendenti dello stesso
stato, il `SubMenu` via `ThemeService` e il pannello Settings a mano, senza un canale che li
sincronizzasse. Da oggi ne resta uno solo, e questo è di per sé una semplificazione; ma quando
la gestione dei temi verrà ripresa, la riconciliazione dei due percorsi è il primo nodo, non
un dettaglio. `EditorV2.tsx:811` è l'altro consumatore di `useTheme`, in sola lettura
(`const [theme] = useTheme()`): legge lo stato che il pannello Settings non gli notifica.

## 5. Modifica applicata

Solo `frontend/src/pages/components/Navbar.tsx`, cinque sostituzioni puntuali, tutte con
asserzione di unicità della stringa cercata: il blocco JSX `:2000-2016`, l'hook `:598`,
l'import di `ThemeService` `:59`, i tre named import di `Menu.tsx` `:40`, e il commento `:1607`
che elencava `useTheme` fra gli hook issati e che sarebbe rimasto falso. Diff: **+2 −21**.

`Menu.tsx` e `menu.scss` non toccati.

## 6. Verifica

- `npx tsc --noEmit` prima e dopo, con lo stesso albero a parte questo file: **26 errori in
  entrambi i casi, elenchi identici byte per byte** (`diff` vuoto). Nessun errore in
  `Navbar.tsx`. Nota: la baseline di 33 citata dalle entry precedenti è superata, i commit di
  oggi l'hanno abbassata a 26.
- DOM del menu aperto su `localhost:3000`: figli di `.dropdown` esattamente
  `[user-header, Dashboard, Profile, Settings, Sign out]`; `hasSubmenu: false`,
  `hasDivisor: false`. Nessun separatore penzolante in coda.
- Console senza errori né eccezioni dopo l'apertura del menu.
- Screenshot del menu in chat.

## 7. Domande aperte

1. **I due scrittori del tema vanno riconciliati** quando la gestione dei temi torna in
   perimetro: `AppearanceSettings` a mano contro `ThemeService`, con `EditorV2` che legge il
   secondo. Vedi sezione 4.
2. **Il blocco dark aggiunto poche ore fa a `menu.scss` e `navbar.scss` resta in piedi.** Non è
   stato ritirato: il dark è ancora raggiungibile da Settings, e quel blocco ripara anche i
   dropdown della navbar e le tendine delle project card, che con Theme o senza restavano
   illeggibili. Se la scelta è congelare tutto il tema, si ritira in un passo a sé.
