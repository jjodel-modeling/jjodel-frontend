# Fase 1 — Discovery read-only: Properties panel (redesign lato destro)

**Tipo:** discovery (read-only)
**Data prompt:** 2026-07-27
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh

> Questa è la **Fase 1** del redesign del Properties panel. È **read-only**: nessuna modifica al sorgente, nessun commit. L'unico output atteso è il **discovery report** su file. La Fase 2 (implementazione scoped) arriva in un prompt separato, dopo l'analisi in chat del report.

---

## 0. Vincoli di ingaggio (leggere prima)

- Leggi `CLAUDE.md` nella root **prima di iniziare**: è la fonte di verità. Se qualcosa in questo prompt contraddice `CLAUDE.md`, **segnala il conflitto** e fermati, non eseguire in silenzio.
- **Fase 1 = solo lettura.** Non toccare nessun file `.tsx/.ts/.scss`. Non fare commit. Non lanciare build.
- Gli **unici file scrivibili** in questa fase sono dentro `docs/` (il discovery report, vedi §4). Zero scritture altrove.
- Non è un tour del codebase: leggi solo i file utili a rispondere alle domande sotto. Ma quei file **leggili interi**, non a spezzoni.

---

## 1. Obiettivo (COSA)

Mappare **come è implementato oggi** il Properties panel (l'inspector di destra, header "PROPERTIES" seguito da "View for State" con i tab `Apply to / Template / IR / Style / Events / Options`), così da poter scopare con precisione la Fase 2.

Il redesign target (contesto, **da NON implementare adesso**) tocca 6 punti:

1. **Lingua unica (English).** Oggi il pannello mescola IT/EN: `Stile`, `Fisso`/`Condizionale`, `Propaga dimensione`, l'helper `Forza le maniglie di resize…` convivono con `Resizable`, `Labels`, `Add label`, `No compartments`.
2. **Header collassato.** Le tre zone header (titolo pannello, riga contestuale `View for State` con eye/VIEW/back/help, breadcrumb `STATE MACHINE › View for State`) diventano **una sola riga di contesto**.
3. **Tab su una riga.** `Apply to` va a capo su due righe: altezze disuguali. Target: tab ad **altezza fissa**, single line, scroll orizzontale se overflow. **Label di dominio invariate** (niente rename di `Apply to`).
4. **Riga in alto etichettata.** Lo stepper + dropdown `Solid` senza label diventa un gruppo **"Line"** con micro-label `Width` / `Style`.
5. **Un solo controllo di visibilità.** Oggi `Fisso/Condizionale` (segmented) + una checkbox `visible` separata (con stile diverso dalle altre). Target: **modalità** `Fixed/Conditional` con uno switch **Visible** dipendente, annidato sotto; **un solo stile di checkbox** in tutto il pannello.
6. **Ritmo 8px.** Spaziature disuguali e bottone disabilitato troppo pesante: spaziatura di gruppo coerente, azione disabilitata de-enfatizzata.

La Fase 1 **non applica** nulla di questo: serve a scoprire dove e come intervenire.

---

## 2. Dove guardare (DOVE)

Area probabile: `src/components/panels/` (Properties) ed eventualmente `src/components/editors/`. **Non assumere**: individua i file reali via ricerca globale sulle stringhe letterali del pannello (sono quelle visibili nello screenshot dell'app in esecuzione).

Seed di ricerca (usa `grep -r` / ripgrep, sia case-sensitive sia insensitive):

- `"Propaga dimensione"` e `"Forza le maniglie di resize"` → localizzano il controllo resize/propagate e dicono se le stringhe sono hardcoded o in una risorsa i18n.
- `"Fisso"` e `"Condizionale"` → il segmented della visibilità.
- `"Resizable"`
- `"Apply to"`, `"Template"`, `"Events"` → il componente dei tab.
- `"View for"` → il titolo contestuale dell'header.
- `"Add label"`, `"No compartments"`, `"No badges"` → sezioni Labels / compartments / badges.
- `"Intrinsic property"`, `"Metaclass"` → il controllo Source.

Per ogni hit: apri e **leggi il file intero** per capire struttura, import, convenzioni locali (naming, pattern componenti, stile SCSS).

---

## 3. Cosa documentare (COME)

Per **ciascuno dei 6 punti**, il report deve dire: com'è implementato oggi + qual è la superficie di rischio.

**1. Lingua / stringhe**
- Le stringhe UI sono hardcoded nel JSX o in una risorsa i18n/localization? Quale file/formato?
- Elenca **ogni** stringa italiana del Properties panel con la sua posizione (file:riga).
- Il mix IT/EN è per-file o interlacciato nello stesso componente?
- Rischio: se esiste un sistema i18n, cambiare lingua qui può impattare altri pannelli.

**2. Header**
- Quale/i componente/i rendono le 3 zone header? Sono 3 componenti separati o uno?
- Il breadcrumb (`STATE MACHINE › View for State`) è riusato altrove?
- Da dove arrivano titolo, badge `VIEW`, back-arrow, help (props? context?).

**3. Tab**
- Quale componente rende la tab bar? È un **componente Tabs condiviso** (usato da altri pannelli)? Se sì → cambiarne layout/altezza li impatta: **flag esplicito**.
- Come si traccia il tab attivo?
- Perché `Apply to` va a capo (max-width/width fissa per tab)?
- **Nomi esatti delle classi CSS** del container tab e degli item (servono per non collidere e per sapere cosa NON rinominare).

**4. Controlli "Line" (stepper + Solid)**
- Quale controllo rende lo stepper width e il dropdown line-style? Sono etichettati da qualche parte?
- A cosa sono bound (quale attributo del modello / campo IR)?

**5. Visibilità**
- Quale componente rende il segmented `Fisso/Condizionale` **e** la checkbox `visible` separata? Uno o due componenti?
- Modello dati: `Fisso/Condizionale` è un enum di modalità e `visible` un booleano-valore? **Conferma la semantica** (è critica per il redesign che annida Visible sotto la modalità).
- Perché una checkbox è un quadrato pieno scuro e le altre sono outline? Ci sono **≥2 componenti/classi checkbox** diversi in uso? Elencali.

**6. Spaziatura / SCSS**
- Quale/i file SCSS stilano il Properties panel? Elencali.
- Esiste una scala di spaziatura 8px / token (variabili SCSS) o margini ad-hoc?
- Da dove prende lo stile prominente il bottone disabilitato `Propaga dimensione`?

---

## 3-bis. Cross-cutting (obbligatorio, serve a scopare la Fase 2)

- **Pannello condiviso State/Transition?** Il Properties panel è lo stesso per `View for State` e `View for Transition`? Cioè: una modifica impatta entrambe le viste?
- **Basic/Advanced esistente.** Come è implementata la modalità globale Basic/Advanced (il toggle "Basic" nella top bar)? Quale context/hook/stato la espone? Il Properties panel la consuma già? → Il progressive disclosure del redesign **deve riusare questo meccanismo esistente, non crearne uno nuovo**.
- **Inventario classi CSS/SCSS** del pannello (lista completa): è l'API interna esistente, la Fase 2 deve conoscerla per evitare collisioni/rename.
- **Pattern critici** (da `CLAUDE.md`): il pannello usa custom DOM events, LModel proxy, DObject temp IDs? Dove?
- **Critical-zone.** Il pannello importa/usa `useJjomSync.ts` o `portDistribution.ts`? Se sì → flag (la Fase 2 richiederà Layer Impact Report + go-ahead).
- **Comunicazione componenti:** i controlli usano callback chain o custom DOM events?

---

## 4. Discovery report (OBBLIGATORIO)

- **Dove:** `docs/discovery/discovery_<YYYY-MM-DD>_properties_panel_redesign.md` (usa la data reale di esecuzione; crea la cartella `docs/discovery/` se non esiste).
- **Contenuto minimo:**
  - Obiettivo della discovery
  - File letti/analizzati con **path completi**
  - Findings per ciascuno dei 6 punti + sezione cross-cutting
  - Dipendenze e rischi individuati (in particolare: componenti condivisi tab/checkbox/breadcrumb, sistema i18n, pannello condiviso State/Transition, meccanismo Basic/Advanced)
  - Domande aperte per Alfonso
- **L'hard stop di Fase 1 non è completo finché il report non è scritto su file.** L'analisi in chat parte dal report salvato, non dalla memoria di sessione.
- Nessuna entry in `docs/claude-code-log.md` per questa fase (read-only, nessun file sorgente toccato): il log si aggiorna alla fine della Fase 2.

---

## 5. HARD STOP

Fine Fase 1. **Non** modificare sorgenti, **non** implementare il redesign, **non** committare. Nessuna Fase 2 senza go-ahead esplicito in chat.

---

## 6. Riferimenti

- **Mockup visivo target:** il Properties panel "after" del mockup di redesign (artifact `jjodel-panel-redesign`). È lo stato a cui puntiamo, non lo stato attuale.
- **Semantica da preservare:** label `Apply to` invariata (no rename di concetti di dominio); visibilità = modalità (`Fixed`/`Conditional`) + valore dipendente (`Visible`).
- **Design tokens:** slate `#334155`, cyan `#0ea5e9`, focus `#334155` + rgba shadow, label 11px, griglia 8px, **solo Bootstrap Icons**, no layout shift, progressive disclosure Basic/Advanced.
- **Disciplina Claude Code:** tocca solo i file dichiarati, zero refactoring opportunistico, **mai rinominare identificatori esistenti** (incluse classi CSS/SCSS), diff minimale. Prima di introdurre un nuovo identificatore in Fase 2, verifica con ricerca globale che non sia già in uso.
