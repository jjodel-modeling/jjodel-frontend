# Discovery — Doppio click su vista nel tree-view apre Properties pinnato

**Tipo**: feat (Fase 1, discovery read-only). **Branch**: `alfonso-frontend-jjtl`. **Critical-zone**: nessuna in senso stretto (non è `useJjomSync.ts`/`portDistribution.ts`), ma tocca l'infrastruttura di selezione/pin già esistente (`Info.tsx`, `PropertiesWithTreeView.tsx`): leggere con attenzione prima di proporre modifiche, non improvvisare sopra codice non letto. **LIR**: not-required.

## Contesto (ratificato, non ridiscutere)

- Il pin su Properties esiste già: feature "Pin su Properties" completata il 2026-07-05 (bottone `properties-panel-pin-btn`, unico wiring in `PropertiesWithTreeView.tsx` riga ~195). Pattern noto: override della sorgente della tripla in `mapStateToProps` con precedenza a `ownProps.overrideSelected`; cattura della tripla al pin via `useStore()` + `store.getState()._lastSelected` **imperativo** nell'handler (NON `useSelector`, per non risottoscrivere il container a ogni cambio selezione). Semantica esistente: pin con nulla selezionato cattura la tripla vuota; `clearSelection` (chiusura editor view) con pin attivo ri-targetizza il pin a tripla vuota; unpin automatico su elemento cancellato via `pinnedResolvable`; la navigazione interna a Info aggiorna il target pinnato.
- **Nuovo comportamento richiesto**: il doppio click su un nodo **vista** nel tree-view deve (1) selezionare la vista come oggi, aprendo il Properties panel con i suoi dati, e (2) attivare automaticamente il pin su quella vista — esattamente come se l'utente avesse cliccato manualmente il bottone pin subito dopo la selezione.
- **Ri-targeting (ratificato con Alfonso)**: se il pannello è già pinnato su un'altra vista, il doppio click su una vista diversa ri-targetizza sempre il pin alla nuova vista, sganciando quella precedente. Coerente col precedente già esistente (`clearSelection` con pin attivo ri-targetizza a tripla vuota).
- **Scope (ratificato con Alfonso)**: SOLO i nodi vista nel tree-view. Gli altri nodi (model element, DObject, DClass, ecc.) mantengono il comportamento attuale — nessun auto-pin su doppio click per loro, non toccarne gli handler.
- Il singolo click su una vista non cambia comportamento: resta selezione live, non pinnata, a meno che l'utente prema poi il bottone pin manualmente.

## Obiettivo di questa Fase 1

Mappare con precisione, PRIMA di scrivere qualunque codice:

1. Come sono gestiti oggi i click sui nodi vista in `TreeViewContent.tsx`: singolo click (quale handler, cosa scrive), ed **verificare se esiste già un doppio click** su questi nodi e cosa fa (es. apre qualcos'altro — Monaco, ViewData — che non va rotto).
2. Il meccanismo esatto di attivazione del pin oggi: quale funzione viene chiamata dal bottone pin in `PropertiesWithTreeView.tsx` (riga ~195); che tipo di stato imposta (flag booleano? tripla catturata? in che punto vive — state locale del componente, redux, context?); se è invocabile programmaticamente da un chiamante esterno senza passare dal click sul bottone.
3. Se `TreeViewContent.tsx` ha già un canale (import diretto, context condiviso, prop) verso il meccanismo di pin di `PropertiesWithTreeView.tsx`, oppure se sono disaccoppiati e serve un canale nuovo (custom DOM event — pattern già in uso nel progetto per casi analoghi — oppure context condiviso, oppure prop drilling) per far arrivare "doppio click su vista X" fino a "pinna X".
4. Come funziona oggi il ri-targeting del pin su un target diverso da quello corrente (già previsto per `clearSelection`), per capire se lo stesso meccanismo interno è riusabile identicamente per il doppio click o se serve una variante.
5. Guard esistenti da rispettare: `pinnedResolvable`, unpin automatico su elemento cancellato. Verificare in particolare se qualcosa in questi guard assume che il pin parta sempre da un click esplicito sul bottone (possibile race condition tra "seleziona" e "pinna" se entrambi gli effetti scattano nello stesso evento di doppio click).

## Dove guardare (punti di partenza — verificare la posizione esatta prima di editare, il codice può essere avanzato rispetto a queste righe)

- `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx` — noti 9 siti che scrivono `_lastSelected` (da sessione 2026-07-05); individuare quelli relativi ai nodi vista e i relativi `onClick`/`onDoubleClick`.
- `frontend/src/components/editors/PropertiesWithTreeView.tsx` — riga ~195, unico wiring del pin: handler del bottone, stato che imposta.
- `frontend/src/components/editors/Info.tsx` (~1410 righe) — `mapStateToProps` righe ~1382-1393, pattern `ownProps.overrideSelected`, `pinnedResolvable`, `onInternalNavigate`.
- `docs/discovery/2026-07-05_properties-pin.md`, se presente nel repo — è il report della discovery originale del pin: leggerlo per primo, evita di ri-scoprire da zero quanto già mappato allora.

## Report obbligatorio

Salva `docs/discovery/discovery_2026-07-23_treeview_doubleclick_pin.md` con: obiettivo, file letti (path completi + righe rilevanti), come funzionano oggi click/doppio click sui nodi vista, come si attiva oggi il pin e dove vive lo stato, canale di comunicazione proposto (o già esistente) tra `TreeViewContent` e il meccanismo di pin, rischi individuati (race condition, doppio dispatch, conflitti con eventuali handler di doppio click già presenti sui nodi vista), domande aperte per Alfonso.

**Hard stop dopo la Fase 1**: fermati dopo aver scritto il report. Non procedere all'implementazione senza go-ahead esplicito — la Fase 2 (wiring del doppio click al pin) verrà generata come prompt separato dopo che Alfonso ha validato l'approccio proposto nel report.
