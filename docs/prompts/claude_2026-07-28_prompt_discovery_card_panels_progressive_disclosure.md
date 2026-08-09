# Fase 1 (discovery) · Pannelli a card indipendenti + progressive disclosure (Properties)

**Tipo:** discovery read-only (nessuna modifica al codice)
**Data prompt:** 2026-07-28
**Repo:** `jjodel-frontend` · branch `alfonso-frontend-jjtl`
**Effort consigliato:** xhigh
**Contesto:** fase che chiude il redesign dei pannelli di destra. Direzione ratificata da Alfonso su mockup: tree e Properties resi come **card indipendenti** (angoli arrotondati, elevazione, inset), con stati di riga a pillola; e sulla Properties la **progressive disclosure** del mockup "after" (toggle Basic/Advanced nell'header, sezioni in maiuscolo, in Basic si nascondono compartments, badges e il ramo conditional-visibility). Questa è la Fase 1: **solo discovery** per capire come farlo. Nessuna implementazione.

> Two-phase: Fase 1 read-only con salvataggio **obbligatorio** del report. Hard stop a fine report: si torna in chat per l'analisi, poi si genera la Fase 2. Non toccare il codice.

---

## 0. Vincoli di ingaggio

- Leggi `CLAUDE.md` (fonte di verità). Se qualcosa qui lo contraddice, **segnala e fermati**.
- **READ-ONLY:** nessuna modifica a codice/stile, nessun `git`, nessun edit. Solo lettura e analisi.
- **Discovery report OBBLIGATORIO** in `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md` (se esegui in un altro giorno usa la data di quel giorno; suffisso `_N` per più discovery lo stesso giorno). Se la cartella non esiste, creala. Contenuto minimo: obiettivo, file letti con path completi, findings per ogni domanda sotto, dipendenze e rischi, domande aperte per Alfonso. **L'hard stop non è completo finché il report non è scritto.**
- **Critical-zone:** verifica esplicitamente se il **dock/layout** importa `useJjomSync`/`portDistribution` (il pannello interno no, ma il container del dock potrebbe essere diverso). Se sì, segnalalo: la Fase 2 richiederà Layer Impact Report.
- Hard stop dopo il report: si torna in chat, non si implementa nulla.

## 1. Obiettivo

Mappare **come è implementato oggi** (a) il layout a dock che contiene tree e Properties, e (b) il meccanismo Basic/Advanced e la struttura interna del pannello di authoring, per poter scopare con precisione una Fase 2 che: rende i due pannelli **card indipendenti** senza rompere resize/split/collapse; introduce la **progressive disclosure** sulla Properties come da mockup `jjodel-panel-redesign` "after".

## 2. Parte A · Container / dock (card per entrambi i pannelli)

Domande a cui il report deve rispondere:

1. **Layout host:** dove sono montati e disposti tree e Properties nel dock? (`Dock.tsx`, `PropertiesWithTreeView`, il container split `.properties-with-tree-view`). Path e classi dei container.
2. **Resize / split:** come è implementato il ridimensionamento e lo split delle colonne del dock? Quali elementi/classi/handle lo governano? Cosa si romperebbe introducendo margini/ombre/angoli attorno ai pannelli?
3. **Chrome attuale:** oggi i pannelli sono flush (edge-to-edge) o hanno già un container stilizzabile? Dove vivono background, bordi, eventuali ombre? Quali classi andrebbero toccate per la card (radius, shadow, margin, sfondo dietro) e quali sono condivise/rischiose.
4. **Collapse:** il tree e la Properties hanno un collapse (chevron header): come interagisce col trattamento a card?
5. **Critical-zone:** import di `useJjomSync`/`portDistribution` nel dock/container? (verifica esplicita).

## 3. Parte B · Progressive disclosure (Properties)

Domande a cui il report deve rispondere:

6. **Meccanismo Basic/Advanced globale:** com'è fatto `useInterfaceMode` (localStorage `jjodel.interfaceMode` + `U.interfaceMode` + evento `INTERFACE_MODE_CHANGE`) e il Redux `state.advanced`? Chi lo consuma oggi (`Info.tsx` sì, `ViewData`/authoring no). Come si wira al pannello di authoring lato view.
7. **Sub-tab locale:** il `basic/advanced` locale di `VertexAuthoringPanel` (`~:55`), scollegato dal mode globale: si sostituisce col globale? si sposta nell'header del pannello (`.props-header--view`)? Mappa dove finirebbe il toggle nel mockup (header).
8. **Struttura in sezioni:** come sono resi oggi i gruppi del tab IR (Shape, Fill, Border, Resizable/Sizing, Labels, compartments, badges)? Dove si introdurrebbero gli header di sezione in maiuscolo (stile `LINE / SIZING / LABELS` del mockup) e come raggrupparli sui controlli attuali (il mockup è antecedente a Shape/Fill: si applica il pattern, non le sue sezioni letterali).
9. **Cosa nascondere in Basic:** individua nel codice cosa sono esattamente "compartments", "badges" e il "ramo conditional-visibility" (il percorso `Conditional` del ConditionalEditor), e come renderli condizionali al mode = Basic (progressive disclosure). Quali componenti/blocchi, quali props.
10. **Condivisione:** il pannello di authoring è condiviso (vertex/edge/row/textstyle)? La progressive disclosure va pensata per tutti o solo per il vertex in questa fase? Segnala l'impatto.

## 4. Deliverable e hard stop

- Report salvato in `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md` (naming come al §0), con le due parti A e B distinte.
- Nessuna modifica al codice. **Hard stop:** torna in chat col report per l'analisi e la pianificazione della Fase 2 (che verosimilmente sarà spezzata: container/card, poi progressive disclosure).

## 5. Riferimenti

- Mockup target: artifact `jjodel-panel-redesign` (Properties "after" con Basic/Advanced nell'header + sezioni + disclosure) e il mockup card dei pannelli.
- Discovery precedenti da riusare: `docs/discovery/discovery_2026-07-28_properties_panel_redesign.md` (mappa già il meccanismo Basic/Advanced, il sub-tab locale, `.props-header--view`, la catena host) e `docs/discovery/discovery_2026-07-28_tree_view_redesign.md`.
- Tokens: slate `#334155`, cyan `#0ea5e9` (solo accent), 11px label, griglia 8px (`--space-*`), solo Bootstrap Icons, no layout shift.
