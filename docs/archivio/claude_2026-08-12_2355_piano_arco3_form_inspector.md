# Arco 3, il form dell'inspector. Piano di esecuzione autonoma

**Data**: 2026-08-12, 23:55. Sessione Cowork autonoma, mandato di esecuzione notturna.
**Base**: `alfonso-frontend-jjtl` a `d8b2e9e28`, working tree pulito (unico non tracciato:
`.claude/settings.local.json`, coperto dal gitignore globale del Mac).
**Specifica**: `docs/redesign/rail/README.md` §7, passi 3 e 4 del build order.
**Criterio di chiusura**: la definition of done del design, misurata e non descritta.

---

## 0. Le quattro decisioni, prese stanotte da te

1. **Perimetro**: arco 3 intero, a passi committabili separatamente. Un gate rosso ferma il passo,
   non l'arco: i passi già verdi restano consegnati.
2. **NODE**: R-RAIL-12 tiene. La sezione resta nel guscio, gated su `advanced`. L'inspector avrà
   due disclosure, Advanced e Flags, e nessuna Appearance. Il design §7 ultimo paragrafo resta
   disatteso su questo punto, e lo iscrivo come scostamento motivato, non come dimenticanza.
3. **Flag**: chip per tutti i flag esistenti, nomi e semantica invariati. Niente `Read-only` come
   vista invertita di `changeable`: nessuna inversione sul write path, che è il punto dove un
   errore corrompe un modello in silenzio senza dare errore di compilazione.
4. **Consegna**: file scritti direttamente in `/Users/alfonso/jjodel`. Nessun comando git di
   scrittura sul tuo repo.

Sul punto 4 ho aggiunto una cosa che non cambia la consegna ma cambia cosa posso garantire:
tengo un **mirror in cloud** come banco di prova. Il motivo è misurabile e non teorico: i tuoi
`node_modules` sono binari darwin-arm64, e dalla VM Linux del bridge `vite build` non parte, quindi
lavorando solo sul Mac ti consegnerei codice che non ho mai compilato. Il mirror è un clone shallow
da GitHub più i tre file che i tuoi quattro commit non pushati cambiano, verificati **md5 identici**
ai tuoi sui sei file che toccherò. Il mirror non ha accesso al tuo repo: è a senso unico.

---

## 1. Come lavoro, passo per passo

Ogni passo segue lo stesso giro, e nessun passo salta un gradino:

```
scrivo nel mirror  →  gate (typecheck, build)  →  harness visivo sui due temi
                   →  se verde: scrivo gli stessi file sul Mac
                   →  patch del passo messa da parte per il tuo commit tematico
```

Se un gate cade, il passo **non arriva sul Mac**. Trovi il fallimento in cima al report, con la
misura che lo dimostra, e i passi precedenti già consegnati.

**Gate per passo**: `npm run typecheck` (baseline attesa 14 sul clone Linux, 33 sul tuo Mac, la
differenza sono i 19 errori di casing che un filesystem case-sensitive non produce);
`npm run build` exit 0 con la sola warning di chunk-size; harness Playwright su `vite preview`
nei due temi. `check:docs` e `check:agents` solo sul passo che tocca i documenti.

**Perimetro negativo, esplicito.** Non tocco: `styles/components/_form-system.scss` (globale da
`style.scss:2`, consumatori vivi oltre a `Info`, R-RAIL-25); `editors/info-improvements.scss`
(R-RAIL-26); nulla della critical zone §3.1; il tree, l'header del rail, il canvas, il guscio salvo
il punto D. Non rinomino nessuna classe CSS esistente (P2). Non rimuovo codice apparentemente
inutilizzato (Regola 9).

---

## 2. Fase 1, discovery. Le ipotesi che provo a falsificare

Non è un giro di lettura: sono cinque affermazioni che oggi sono credenze, e che il passo A
userebbe come fondamenta. Report in `docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md`.

| # | ipotesi da falsificare | come la provo |
|---|---|---|
| 1 | `Info.tsx` ha un solo consumatore vivo, il rail | l'import nel drawer è rimosso a `EditorV2.tsx:105`; serve un controllo positivo sulla stessa ricerca, non il silenzio |
| 2 | la griglia 84px si può scopare a `.properties-with-tree-view--rail` senza toccare i fogli globali | catena di specificità contro i due `!important` noti (`info-improvements.scss:1174`, `viewapplyto.scss:815`) |
| 3 | i campi che attraversano la griglia sono quelli che credo | inventario per kind: class, enum, feature, attribute, reference, operation, literal, package, model, view |
| 4 | i bound usano `-1` per illimitato | in `Info.tsx` convivono `-1` e `999` (`:521-525`, `:621-622`, `:686-688`): la convenzione va letta sul write path, non sul render |
| 5 | il ramo view non attraversa la griglia | `ViewData.tsx` ha un suo header e propri campi |

L'ipotesi 4 è quella che può far saltare il passo B: se il segmented scrive un bound con la
convenzione sbagliata, il danno è nel modello e non a schermo.

---

## 3. I quattro passi

### Passo A. La griglia 84px

Il cuore della densità: `display: grid; grid-template-columns: 84px 1fr; align-items: center;
gap: 8px 10px`, label 12px `#475569` allineate a destra, ogni campo una riga da 30px invece di
uno stack da tre. Oggi `.jj-field` è `margin-bottom: 14px` con la label sopra
(`_form-system.scss:945-961`).

Dove: `properties-with-tree-view.scss`, sotto `.properties-with-tree-view--rail`. In TSX cambia
poco o nulla: la struttura `.jj-field > .jj-field-label + campo` è già quella che una griglia a due
colonne vuole, quindi la conversione è CSS e non markup. Se la discovery dice il contrario, il
passo A si spezza in A1 (CSS) e A2 (markup) e te lo riporto.

**Il rischio vero**: la griglia non tocca solo le feature. Tocca ogni kind che rende `.jj-field`,
inclusi package, model e il ramo view. È una regressione potenzialmente diffusa, e l'harness la
guarda kind per kind, non sulla sola classe.

### Passo B. Multiplicity segmentato

Cinque segmenti `[0..1] [1..1] [0..*] [1..*] Custom`, `flex: 1 1 0; min-width: 0; padding: 0 2px`
(il design annota che senza `min-width: 0` le label mono si rifiutano di stringersi e sfondano il
rail: è una nota di implementazione già pagata da qualcuno, e la seguo alla lettera), 28px,
IBM Plex Mono 11px, `role="radiogroup"`. Custom rivela la coppia di stepper Lower/Upper, che è
l'unico posto dove gli stepper sopravvivono.

Sostituisce `Info.tsx:423-441`, cioè la sezione `TYPE & BOUNDS` con i due `PropertiesNumberInput`
e il chip `formatMultiplicity`. Il componente nuovo vive in `Info.tsx` accanto agli altri
`Properties*`, con lo stesso pattern di scrittura sul proxy.

**Controllo negativo obbligatorio**: un attributo `[3..7]` deve cadere su Custom con 3 e 7, non su
un preset vicino, e non deve essere riscritto dal semplice render.

### Passo C. Flag come chip e switch

Eyebrow con label, filetto e riepilogo live a destra (`unique · ordered`, oppure `none set`), poi
chip da 26px in postura Browse e righe switch da 36px in Focus. La postura arriva dal CSS: il guscio
scrive già `--rail-focus` su di sé (R-RAIL-40), quindi nessuna prop attraversa `Info`.

Per la tua decisione 3, i chip sono uno per flag esistente, con il nome che il flag ha oggi. Ordine:
i sei che il design nomina per primi, gli altri dopo. `PropertiesToggle` resta dov'è e come è: il
chip è una resa alternativa, non una sostituzione, perché le altre sezioni continuano a usarlo.

### Passo D. Le due disclosure

`ADVANCED` e `ADVANCED STATE` si fondono in **Advanced**, riga da 30px con caret, eyebrow, filetto e
riepilogo a destra. `FLAGS` diventa **Flags**. `NODE` non si tocca, resta nel guscio (tua decisione 2).

Il design vuole dentro Advanced anche Default value, Opposite e Derivation expression. **Questi campi
oggi non esistono nel form**: introdurli è sviluppo nuovo su tre feature EMF, non restyle. Non li
faccio stanotte e li iscrivo a backlog, perché il mandato è l'architettura dell'informazione del form,
non l'estensione delle feature editabili. Se li vuoi, sono un arco 3b di mezza giornata.

---

## 4. La misura di chiusura

La definition of done del design, eseguita e non raccontata:

- a 420×1000 in preset `2a`, **almeno 9 controlli visibili senza scroll**: li conto sul DOM con
  `getBoundingClientRect`, non a occhio sullo screenshot;
- **nessuna scrollbar orizzontale da 360px in su**, con controllo mirato sulla riga multiplicity,
  che è quella che il design segnala come fragile;
- **i due temi**, perché R-RAIL-42 esiste per una Focus bar che nessuno aveva aperto in dark;
- ogni colore, dimensione e raggio risale a un token esistente.

L'harness parte da `harness_rail_visivo.mjs`, già scritto e già pagato: `vite preview` sulla build di
produzione, Offline mode, progetto più metamodello più due classi più due attributi più un'enum,
screenshot a densità doppia. Lo estendo ai kind che oggi non copre e che questo arco tocca:
reference, operation, literal.

**Quello che l'harness non misura, e che resta tuo**: il giudizio estetico, le proporzioni, la
gerarchia visiva, il comportamento percepito. Per questo domani la verifica la fai tu.

---

## 5. Cosa trovi domani

- il working tree con i file dei passi andati a buon fine, **non committati**;
- `docs/discovery/discovery_2026-08-13_form_inspector_griglia_84.md`, il report di Fase 1;
- un handover con, per ogni passo: file toccati, messaggio di commit proposto, misure prese,
  e cosa guardare a schermo per validarlo;
- le patch per passo, così i commit restano tematici invece di finire in un blocco unico;
- le voci di registro da iscrivere e l'entry di log già scritta, da incollare dopo la tua conferma
  visiva (P9 vuole l'entry a fine task, ma `Smoke visivo` e `Regressions` li puoi compilare solo tu);
- gli screenshot dell'harness nei due temi, per confrontare con quello che vedi.

## 6. Una cosa che ho già toccato e che devi sapere

Il primo tentativo di trasferimento ha usato `git bundle create` sul mount, ed è fallito nel modo che
R-RAIL-27 prevede: `warning: unable to unlink '.arco3-sync.bundle.lock': Operation not permitted`.
Il lock da 123 byte è rimasto, e dal bridge non è cancellabile. L'ho spostato in `.git/_to_delete/`,
che è la convenzione che questo repo usa già per lo stesso detrito: sono 33 file adesso, era 32.
Il trasferimento è poi passato per copia dei tre file che i quattro commit cambiano, senza git.

Nota di misura per il registro: è la conferma diretta del meccanismo di R-RAIL-27 su un comando che
non era ancora stato provato. Anche `git status --short` dal bridge lascia un `.git/index.lock`
non cancellabile: da qui in avanti, sul mount, nessun comando git oltre la lettura pura.
