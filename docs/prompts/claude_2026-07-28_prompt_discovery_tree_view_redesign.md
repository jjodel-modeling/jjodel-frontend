# Fase 1 (discovery) · Tree View redesign

**Tipo:** discovery read-only (nessuna modifica al codice)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Contesto:** prossimo step del redesign dei pannelli di destra. Il Properties è chiuso (Fase 2, Commit 1-4). Ora tocca al **Tree View**, l'altro pannello del mockup ratificato `jjodel-panel-redesign`. Questa è la **Fase 1: solo discovery**, per mappare l'implementazione attuale e preparare una Fase 2 scoped. Nessuna implementazione qui.

> Two-phase: questa è la Fase 1 (discovery read-only) con salvataggio **obbligatorio** del report. Hard stop a fine report: si torna in chat per l'analisi, poi si genera la Fase 2. Non toccare il codice.

---

## 0. Vincoli di ingaggio (leggere prima)

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**.
- **READ-ONLY:** non modificare nessun file di codice o di stile. Solo lettura e analisi. Nessun `git`, nessun edit.
- **Discovery report OBBLIGATORIO.** A fine discovery salva il report in `docs/discovery/discovery_2026-07-28_tree_view_redesign.md` (se esegui in un altro giorno usa la data di quel giorno; per più discovery lo stesso giorno, suffisso `_N`). Se la cartella non esiste, creala. Contenuto minimo: obiettivo, file letti/analizzati con path completi, findings rilevanti, dipendenze e rischi individuati, domande aperte per Alfonso. **L'hard stop di Fase 1 non è completo finché il report non è scritto.**
- **Niente Layer Impact Report** a meno che la discovery trovi import di `useJjomSync`/`portDistribution` nel Tree View (improbabile: verifica e annota).
- Hard stop dopo il report: si torna in chat, non si implementa nulla.

## 1. Obiettivo

Mappare l'implementazione attuale del **Tree View** (il pannello ad albero del progetto, affiancato al Properties) per preparare una Fase 2 scoped che lo allinei al mockup "after" (artifact `jjodel-panel-redesign`). Cambiamenti previsti dal mockup, da confermare in analisi: **icone consistenti, guide di indentazione, active state pulito**, in particolare la **rimozione della barretta cyan a sinistra degli item attivi**.

## 2. Punti di partenza noti (anchor)

- Catena host già mappata per il Properties: `Dock.tsx` "Properties" → `PropertiesWithTreeView` → (router per tipo). Il Tree View vive in/accanto a `PropertiesWithTreeView`: parti da lì per trovare il componente reale.
- Comportamento esistente da **non rompere**: "double-click su un item del tree → pin del Properties" (rif. `sessione_2026-07-23.md`). Verifica dov'è e come è implementato.
- Vincoli di sistema: solo Bootstrap Icons; design tokens slate `#334155`, cyan `#0ea5e9` (accent), label 11px, griglia 8px (`--space-*`), no layout shift.

## 3. Domande a cui il report DEVE rispondere

1. **Componente:** quale/i componente/i rendono il Tree View? Path completi. Dove si costruisce l'albero dei nodi?
2. **Item row:** struttura di una riga dell'albero, come sono composti icona + label + chevron espandi/collassa. Nomi delle classi CSS.
3. **Active / selected state:** come è stilizzato l'item attivo o selezionato? Dov'è la **barretta cyan a sinistra** (la cosa da togliere)? Nome classe e file.
4. **Icone:** come si sceglie l'icona per tipo di nodo? Sono tutte Bootstrap Icons? Ci sono inconsistenze (sorgenti o dimensioni miste)?
5. **Indentazione:** come è resa la profondità? C'è già una guida di indentazione (linea verticale) o solo padding?
6. **Stile:** quale/i file SCSS/CSS? Le classi sono condivise con altri componenti (rischio collisione, come è emerso per il Properties)? La scala di spaziatura è locale o a token?
7. **Stato / interazione:** selezione, espandi/collassa, il double-click→pin, eventuali custom event o chiavi di context. Cosa va preservato in un restyle.
8. **Basic/Advanced:** il Tree View consuma il mode globale (`useInterfaceMode`) o no?

## 4. Deliverable e hard stop

- Report salvato in `docs/discovery/discovery_2026-07-28_tree_view_redesign.md` (naming come al §0).
- Nessuna modifica al codice. **Hard stop:** torna in chat con il report per l'analisi e la pianificazione della Fase 2.

## 5. Riferimenti

- Mockup target: artifact `jjodel-panel-redesign` (Tree View "after", barretta cyan degli item attivi rimossa).
- Discovery Properties (per stile del report e catena host): `docs/discovery/discovery_2026-07-28_properties_panel_redesign.md`.
- Design tokens: slate `#334155`, cyan `#0ea5e9` (solo accent), 11px label, 8px grid (`--space-*`), solo Bootstrap Icons, no layout shift.
