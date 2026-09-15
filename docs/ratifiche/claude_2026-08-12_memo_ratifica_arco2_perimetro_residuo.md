# Memo di ratifica — il perimetro residuo dell'arco 2, con le posizioni prese

**Data**: 2026-08-12, sessione autonoma.
**Base**: `alfonso-frontend-jjtl` a `f48cc299a`, più il passo 4 in corso al momento della scrittura.
**Fonti**: `docs/redesign/rail/README.md` (il design, 417 righe, mai citato nei checkpoint recenti),
`docs/decisions.md` R-RAIL-1..33, `docs/TECH-DEBT.md`, misure su clone Linux con harness visivo.

Hai detto «decidi tu». Sotto ci sono sette posizioni, non sette opzioni. Ogni voce dice cosa si fa,
perché, e cosa costa. Dove serve la tua firma è segnato.

---

## 0. Il fatto che riordina tutto: il design specifica già il perimetro residuo

`docs/redesign/rail/README.md` §7 e §6 descrivono l'identity block e la Focus bar al livello del
pixel, e §«Suggested build order» numera sette passi. L'arco 1 ha consegnato i passi 1 e 2. Il
perimetro residuo dell'arco 2 non va inventato: è il **passo 3** (inspector: identity block, griglia
label 84px, Type, multiplicity) e il **passo 5** (postura più tastiera), che il design dichiara essere
quello che «yields preset 2a, the default».

Conseguenza che va detta chiaramente: **l'arco 2 come oggi delimitato non consegna il preset 2a.**
R-RAIL-3 dice «arco 1 realizza solo il preset 2a» e R-RAIL-14 manda la postura fuori dall'arco 1.
Nessuno dei due la ha poi ricollocata. Senza postura, `2a` è un guscio con due pane fissi, cioè il
preset `1a` senza divider.

---

## 1. Postura Browse/Focus e Focus bar — SÌ, primo passo dopo il 4

**Posizione**: rientrano nell'arco 2, e sono la prossima cosa da fare dopo il passo 4.

**Perché non è sviluppo nuovo.** Erano state scritte in `bcc68da8f` e ritirate in `77e2bb6a6` per
sole ragioni di scope, con un commit additivo, apposta perché restassero recuperabili. Misurato
oggi sul clone:

| file | esito del revert su HEAD |
|---|---|
| `PropertiesWithTreeView.tsx` | **applica pulito**, zero conflitti |
| `properties-with-tree-view.scss` | **un hunk in conflitto**; il foglio è cambiato di 109 righe dopo il ritiro, quasi tutte tokenizzazione |

Comando di verifica, da rifare al momento dell'esecuzione perché il passo 4 può aver toccato quei
file: `git show 77e2bb6a6 -- <file> | git apply -R --check -`.

Costo reale: il revert del TSX, più la riconciliazione a mano di un hunk SCSS contro il foglio
tokenizzato, più la riverifica di tutto quello che l'arco ha cambiato nel frattempo. Non è un
`git revert` e basta, ma è molto meno di una riscrittura.

**Cosa torna con esso**: `RailPosture`, il collasso del tree pane a 0px sulla selezione di una
foglia, `Escape` che riporta a Browse, il bottone Focus/Browse in header, il doppio click sull'header,
il modificatore `--rail-focus`, e la Focus bar di §6.

**Serve la tua firma su una cosa sola**: R-RAIL-14 dice «postura fuori dall'arco 1». Non dice «fuori
dall'arco 2», ma nessuna voce la ha ricollocata. Va iscritta la ricollocazione, altrimenti il passo
esegue contro un vincolo che il registro dà ancora per attivo.

---

## 2. Stepper dei fratelli — SÌ, ma dopo la postura, e leggendo l'ordine dal tree

**Posizione**: dentro l'arco 2, subito dopo la postura, perché la Focus bar li ospita e senza di
essi la barra è monca.

**Non erano in `bcc68da8f`**: misurato, zero occorrenze di `sibling`, `chevron-up`, `chevron-down`
nel diff del ritiro. Questo è lavoro nuovo.

**Il vincolo, e come si scioglie.** R-RAIL-7 dice che l'ordine dei fratelli è quello **reso** da
`TreeViewContent`, e che ricostruirlo altrove duplica il modello. Sembrava impossibile in postura
Focus, dove il tree non si vede. Non lo è: il codice ritirato porta il commento
«The tree pane is a height, not a mount», cioè in Focus il pane **è alto zero ma è montato**, e il
suo DOM resta interrogabile. Lo stepper legge quindi l'ordine reso, con una query sulle righe del
tree, e non ricalcola niente.

**Da decidere in esecuzione, non ora**: se la query va sul DOM o su una funzione esposta da
`TreeViewContent`. La seconda è più pulita e tocca un file in area attiva (§2.5 di `CLAUDE.md`);
la prima è più sporca e tocca solo il rail. La scelta si prende dopo aver letto `TreeViewContent`,
non prima.

---

## 3. Identity block nel guscio dell'inspector — SÌ, ed è la parte cara

**Posizione**: il blocco sale dal ramo model element di `Info.tsx` al guscio del pane inspector, in
`PropertiesWithTreeView.tsx`, sopra `<Info/>`.

**Perché non basta restilarlo dov'è.** Il design vuole `transition: padding 250ms` sul blocco e
`padding: 11px 14px 10px` in Browse contro `18px 14px 14px` in Focus, e la definition of done dice
«switching posture moves nothing but the tree pane's height». Un blocco che vive dentro il ramo
model element non può animare su una postura che è stato del guscio senza far passare la postura
attraverso `Info`, che è esattamente il props drilling che le convenzioni del progetto vietano.
R-RAIL-26 lo aveva già detto: la collocazione dentro il ramo era «una sistemazione provvisoria», e
«regole scritte ora sotto un modificatore element-only verrebbero smontate dall'arco 2».

**Il costo vero**: ci sono due rami, model element e view. Il ramo view ha un suo header,
`.props-header--view` in `ViewData.tsx:212-221`, con il chip VIEW e il segmento di path. Salire nel
guscio significa che il blocco unico deve rendere entrambi i casi, e che `ViewData` perde il suo
header. È il punto in cui l'arco tocca un file che finora non aveva toccato.

**Misure di partenza, prese sul prodotto e non sul codice** (harness, tema light, classe selezionata):

| cosa | oggi | design §7 |
|---|---|---|
| `.props-header` | 40px, badge kind a destra | badge 22×22 a sinistra, titolo, kind sotto il titolo |
| badge `CLASS` | bg `#FCE1EA`, fg `#7A4056`, 10px, radius 4 | badge glifo entity 22×22 radius 7, e il **kind come testo** 11px/600 uppercase in entity fg |
| titolo | 14px | 14px in Browse, 19px in Focus |
| `.properties-tab` padding | **0px computato**, malgrado `info-improvements.scss:140` dichiari 24px | form body `4px 14px 18px` |

L'ultima riga è la sorpresa: il padding del form body di R-RAIL-26 non parte da 24, parte da **zero**.
Qualcosa nel foglio del rail azzera il valore dichiarato. Chi scrive il passo lo misura di nuovo
invece di fidarsi della dichiarazione.

---

## 4. Chip di firma — SÌ, e solo dove una firma esiste

**Posizione**: si fa, contenuto `"EString [0..1]"`, IBM Plex Mono 11px su `#f1f5f9`, come da §7.

**Ma si rende solo per le feature tipate**: attribute, reference, parameter. Una classe, un package,
un metamodello non hanno tipo né molteplicità, e per essi il chip **non si rende affatto**, senza
placeholder e senza spazio riservato. È lo stesso criterio già ratificato da R-RAIL-1 C1.2 per
l'identity block delle view legacy, e conviene applicarlo con le stesse parole invece di inventare
una regola nuova.

R-RAIL-16 diceva «niente chip di firma», ma è superata per l'arco 1 da R-RAIL-26, che il chip lo
manda esplicitamente all'arco 2. Va iscritto che qui la clausola cade, altrimenti restano due voci
che si contraddicono.

---

## 5. Multiplicity, Flags e le disclosure Advanced/Appearance — FUORI dall'arco 2

**Posizione**: non entrano. Sono i passi 3 (parte) e 4 del build order del design, e cambiano
l'architettura dell'informazione del form, non la sua pelle: il segmented a cinque bottoni sostituisce
due stepper e un chip; i flag passano da righe a chip o switch a seconda della postura; quattro
sezioni (`ADVANCED`, `FLAGS`, `ADVANCED STATE`, `NODE`) diventano tre.

**Perché fuori**: l'arco 2 è nato come «identity block e palette». Ha già assorbito la scala entity
intera, la migrazione del tree, cinque voci di debito e due regole. Allargarlo al form significa non
chiuderlo. E `NODE` è dentro il guscio per R-RAIL-12: mapparlo su «Appearance» dentro l'inspector
è precisamente la modifica che R-RAIL-12 ha già rifiutato una volta.

**Proposta**: arco 3, «il form dell'inspector», con il design §7 come specifica e la definition of
done del design come criterio (nove controlli visibili a 420×1000 senza scroll).

---

## 6. Footer — resta fuori, ma la voce va chiusa

R-RAIL-18 dice «footer fuori arco». Il design §8 lo specifica per intero e lo lega allo stato di
persistenza reale. Non è una decisione da riaprire adesso; è una voce che va **scritta a backlog**
invece di restare in un «fuori arco» che nessun documento raccoglie. Oggi non è in `TECH-DEBT.md`
e non è in `decisions.md` come rinvio: esiste solo dentro una clausola.

---

## 7. Ordine di esecuzione proposto

| passo | contenuto | rischio | dipende da |
|---|---|---|---|
| 4 | breadcrumb ridondante, astrattezza | in corso | — |
| 5 | registro e debiti su misura (prompt già pronto) | nullo, solo `docs/` | 4 chiuso |
| 6 | campi colore morti di `entityMeta.ts` e tre commenti (diff già verificata) | basso | — |
| 7 | ricollocazione di R-RAIL-14, poi revert della postura e Focus bar | medio, un hunk SCSS a mano | 4 |
| 8 | stepper dei fratelli sulla Focus bar | medio | 7 |
| 9 | identity block nel guscio, chip di firma, padding del form body | **alto**, tocca `ViewData` | 7 |
| 10 | esecuzione di R-RAIL-33: via i tre blocchi entity dal tree | basso, **zero pixel** misurati | 5 |
| — | push dell'arco | — | 9 |

Il passo 10 non cambia niente a video, misurato: i tre blocchi colorano il `<span>` che contiene il
glifo, mentre a dipingere e' l'`<i class="bi">`, che ha un colore suo da `styles/style.scss:790`.
Toglierli sposta lo stile computato del contenitore e zero pixel. Sta in fondo solo perche' e' igiene
e non ha fretta.

---

## Cosa ti serve firmare, in tre righe

1. **La postura rientra nell'arco 2**, e R-RAIL-14 va ricollocata di conseguenza.
2. **Il chip di firma si fa**, condizionato alle feature tipate; la clausola di R-RAIL-16 cade.
3. **Multiplicity, Flags e le disclosure vanno all'arco 3**, con il design §7 come specifica.

Sul resto ho preso posizione e i prompt sono scrivibili senza altra ratifica.
