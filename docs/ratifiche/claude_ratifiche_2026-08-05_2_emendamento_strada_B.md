# Emendamento alle ratifiche del 2026-08-05 — la partizione monta tutto e nasconde

**Data**: 2026-08-05 (seconda sessione)
**Ratificato da**: Alfonso, su delega esplicita ("decidi tu").
**Rapporto con `claude/ratifiche_2026-08-05_panel_state_lifting.md`**: **supera R-2**. Le altre
ratifiche di quel documento (R-1, R-3, R-4, R-5, R-6, R-7) restano valide e invariate.
**Fonte**: addendum §10 e §13 di `docs/discovery/discovery_2026-08-05_panel_state_lifting.md`,
scritto da una seconda sessione dopo la ratifica di R-2.

## Perché R-2 cade

R-2 sceglieva l'owner interposto (strada A) anche sull'argomento che tenere i tab montati
reintrodurrebbe il clobber fra draft concorrenti. **L'argomento è sbagliato.** Il clobber
presuppone draft **per-tab**; se il draft resta nel pannello e il pannello non si smonta, di
draft ce n'è uno solo e il clobber non si dà. La strada B è stata scartata su una premessa che
non le appartiene.

L'addendum poi la misura, invece di liquidarla in una riga:

- **costo di montaggio** circa 645 elementi JSX nel caso peggiore contro 330 del solo tab più
  pesante, ma 645 è **quanto si monta già oggi**, perché il tab IR attuale monta il pannello
  intero. Parità con l'adesso, non raddoppio rispetto a domani;
- **effetti collaterali**: zero `focus()`, zero `scrollIntoView`, zero `autoFocus` in tutto
  l'albero di authoring e in `components/ui/`; un solo popover in portal
  (`TextStyleField.tsx`), che si autochiude al `mousedown` fuori dal trigger; un solo
  sotto-editor con `useEffect`, già inerte da chiuso;
- **righe toccate su E-ref ed E-obj: zero.**

## R-8 — La partizione è un cambiamento di presentazione

**Ratificato**: la barra a cinque rende i cinque corpi e ne nasconde quattro. Il pannello di
authoring resta **montato intero**, il draft resta dove sta oggi, non si solleva niente.

**L'argomento che decide** è lo stesso principio che le ratifiche del 2026-08-04 applicano già a
un'altra coppia: *"1.6 separato da 1.5, altrimenti la verifica visiva non distingue una
regressione della barra da una regressione di ciò che la barra non mostra più."*

Con B, 1.5 è un cambiamento di sola presentazione: guardi la barra e guardi cosa mostra ogni
tab, e nessuna regressione di ciclo di vita dello stato è possibile, perché il ciclo di vita
dello stato non è cambiato. Con A, 1.5 riorganizzerebbe la barra **e** rilocherebbe lo stato che
la alimenta nello stesso commit: davanti a un difetto visivo non sapresti quale dei due
guardare.

**L'obiezione del pattern nuovo, onestamente**: vale, ma vale per entrambe. Il codebase non ha
alcun precedente di tab che condividono un draft; non ha `useReducer` da nessuna parte
(grep globale, zero occorrenze) e non ha host che usino `display:none` per preservare stato. Il
pattern di casa è montare solo il tab attivo, che è l'opzione C, cioè quella che non risolve il
problema. Fra due pattern entrambi nuovi si sceglie quello che non tocca codice verificato.

**Il rischio che si evita**, e che pesa più di tutto il resto: la strada A riscrive i tre
`useState` di `EdgeAuthoringPanel` e i loro due consumatori, cioè il ramo E-obj già verificato a
video, portandosi dietro un rischio che l'addendum dichiara **non verificabile per lettura** (il
momento del seed: se girasse una volta di troppo riprodurrebbe la perdita che il sollevamento
esiste per evitare, in forma più difficile da vedere).

## Cosa ne è del task 1.2

**Si chiude senza implementazione.** La discovery ha prodotto il suo valore (i due report più
l'addendum) e la conclusione è che il sollevamento **non serve**: i sotto-editor non hanno
stato, il draft è già uno solo per pannello, il debounce è già a 300 ms, e con B niente si
smonta.

I tre atomi che vivono fuori dal draft in `EdgeAuthoringPanel.tsx:116-118` (`nature`,
`sourceExpr`, `targetExpr`) **restano** una sorgente di verità parallela, ma dopo Slice A
(`49c32c134`) non sono più un percorso di perdita di dati: sono debito di igiene. Migrano nel
grappolo del task 2.1, insieme a `isUsableEndpointExpr` e al mirror `nextEdgeForEndpoints`.

## Due vincoli per il prompt di 1.5

**V1 — Due meccanismi di occultamento, distinti e da non confondere.** La matrice di R-5 nasconde
`Structure` e `Appearance` per le view di kind `row`, perché una row non ha geometria per
costruzione. Quel nascondere è **strutturale**: il corpo non si rende affatto. Il nascondere del
tab inattivo è invece `display:none` su un corpo montato. Confonderli significherebbe montare
editor di geometria per un kind che non ne ha.

**V2 — Il popover e la tastiera.** Un popover aperto dentro un tab che diventa `display:none`
sopravvivrebbe visivamente, perché il portal esce dal contenitore nascosto. Oggi non può
succedere: la barra è solo cliccabile (`ViewData.tsx:190-201`, nessun handler di tastiera) e il
listener `mousedown` in cattura di `TextStyleField.tsx:122` chiude il popover a ogni click
fuori. Il vincolo da scrivere nel prompt: **se si aggiunge navigazione da tastiera alla barra,
il cambio tab deve chiudere il popover esplicitamente.**

## Nota di processo: collisione di sessioni

Il task 1.2 è stato emesso **due volte da due chat diverse** a undici minuti di distanza (prompt
`2026-08-05 12:20`, eseguito e committato in `f83252d06` alle 13:08; prompt `2026-08-05 13:19`,
che ha trovato il report già al suo path). L'esecutore del secondo non ha sovrascritto: ha letto
il report esistente, l'ha confrontato OQ per OQ e ha scritto un addendum sui quattro punti
scoperti. È il comportamento giusto, e va detto.

Resta che l'esito registrato è `⚠️ partial` su un lavoro completo, e che il secondo prompt aveva
**nove OQ** contro i sette punti del primo: le domande in più sono esattamente quelle che hanno
prodotto la misurazione che ha ribaltato R-2. Il duplicato è costato, ma ha anche pagato.

Da tenere presente quando più chat lavorano sullo stesso backlog: prima di emettere un prompt,
un `ls docs/discovery/` sul path che il prompt sta per chiedere costa niente.
