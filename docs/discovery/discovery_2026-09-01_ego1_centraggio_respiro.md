# EGO1 — l'ego-diagramma si centra, e respira

**Data**: 2026-09-01
**Prompt**: MICRO in chat, con screenshot dell'utente del 01-09 sulla riga espansa
del manager. Due difetti: il grafo appoggiato a sinistra, e l'aria sopra/sotto
scarsa (l'eyebrow NEIGHBORHOOD e la riga dei conteggi addosso ai nodi).
**Corsia**: veloce (RC-3) — due dichiarazioni CSS in un foglio, fuori dalla
critical zone (§3.1), zero scritture verso lo store.
**Perimetro**: `components/abstract/tabs/egoDiagram.scss` (il foglio proprio del
nastro) e la sua suite. `instanceManagerTab.scss` **non e' toccato**: il nastro
ha un foglio suo dal giorno di FL5, ed e' quello.

---

## 1. Che cosa produce il difetto

`.ego-diagram` e' una colonna flex con tre figli: `__head` (l'eyebrow e le
affordance), `__scroll` (la scatola che scorre), `__foot` (i conteggi e «show
all»). Dentro `__scroll` sta `__frame`, un blocco `position: relative` la cui
**larghezza e' nota e arriva come stile inline** da `egoLayout(ego).width` —
aritmetica pura del modulo `jjform/egoNeighborhood`, la stessa che disegna le
frecce.

Due conseguenze, entrambe misurate:

1. **Il centraggio.** `__frame` e' un blocco di larghezza fissa dentro un
   contenitore piu' largo, con `margin: 0`. Un blocco in quelle condizioni sta a
   sinistra. Non c'e' nessuna regola che lo sposti, e non ce n'e' mai stata: FL5
   disegnava alla larghezza della riga, e il caso «grafo molto piu' stretto della
   riga» non era stato guardato.
2. **Il respiro.** Lo stacco fra il disegno e le due cornici di testo era il
   `gap: 6px` della colonna. Poiche' i figli sono tre, quel gap E' esattamente
   l'aria sopra e sotto il disegno, e nient'altro. 6px e' inoltre un letterale
   **fuori dalla scala del DS**: `tokens/_spacing.scss` e' a passo 4px
   (`--space-1` 4, `--space-2` 8, `--space-3` 12).

---

## 2. Il fix

Due dichiarazioni, entrambe in `egoDiagram.scss`.

```scss
.ego-diagram {
    gap: var(--space-3);      /* era: gap: 6px */
    …
    &__frame {
        position: relative;
        margin-inline: auto;  /* nuova */
    }
}
```

**Perche' `margin-inline: auto` e non `justify-content: center` sul genitore.**
`__scroll` e' un contenitore che scorre (`overflow-x: auto`). Centrare con
`justify-content` in un contenitore che scorre **taglia l'inizio** del contenuto
quando questo e' piu' largo: il primo nodo finisce prima dell'origine dello
scroll e diventa irraggiungibile. Con i margini automatici, invece, lo spazio
libero negativo li porta a 0 e il blocco resta a sinistra — cioe' esattamente il
comportamento di oggi. Misurato, §4, blocco X.

**Perche' `--space-3` e non `--space-2`.** Il 6px letterale si appoggia fra
`--space-1` (4) e `--space-2` (8). `--space-2` e' il primo token strettamente
sopra il valore attuale, ma vale **+2px per lato**, che non e' una risposta al
difetto riportato («il respiro e' scarso»). `--space-3` e' un gradino sopra il
token su cui il 6px si appoggia, e porta lo stacco a 12px per lato. Nessun numero
inventato: entrambi i candidati sono token della scala, e la scelta e' dichiarata
qui perche' e' l'unico punto discrezionale della slice. Tornare a `--space-2` e'
una parola sola nel foglio.

**Che cosa NON e' toccato.** `EGO_OWNER_GAP` (24px, 10k p7) e' la banda
owner → soggetto **dentro** il disegno, aritmetica di `jjform/egoNeighborhood`
che arriva nel `d` dell'arco. Non e' un margine CSS e non e' questa misura. La
sonda la ri-misura come non-regressione: **24px prima, 24px dopo**.

---

## 3. Before / after, computed

Sonda `frontend/scripts/smoke/_tmp_ego1_verify.ts` (non committata,
`.gitignore:66`). Soggetto `Off` — contenuto in `Heater`, senza entranti ne'
uscenti: e' il vicinato minimo, l'unico in cui l'owner e' disegnato come scatola,
ed e' il caso dello screenshot. Viewport 1600.

| misura | before | after |
|--------|--------|-------|
| `.ego-diagram` `row-gap` | `6px` | `12px` (= `--space-3`) |
| `__frame` `margin-left` / `margin-right` | `0px` / `0px` | `289.5px` / `289.5px` |
| `__frame` x / larghezza | 797 / **168** | 1086.5 / **168** |
| `__scroll` x / larghezza | 797 / 747 | 797 / 747 |
| scarto dei centri (frame − scatola) | **−289.5px** | **0px** |
| aria sopra (head.bottom → frame.top) | **6px** | **12px** |
| aria sotto (frame.bottom → foot.top) | **6px** | **12px** |
| aria sotto fino al TESTO dei conteggi | 15px | 21px |

La larghezza del disegno e' **la stessa** prima e dopo (168px): si centra, non si
allarga. Il footer conserva i suoi `padding-top: 8px` e il filetto: i 21px sono
12 + 8 + 1.

Alle altre larghezze, stesso esito:

| caso | scatola | scarto dei centri, before → after |
|------|---------|-----------------------------------|
| `Off`, viewport 1600 | 747px | −289.5 → **0** |
| `Off`, viewport 1280 | 427px | −129.5 → **0** |
| `Running` (vicinato piu' largo, 356px), 1600 | 747px | −195.5 → **0** |

Il centraggio segue la scatola e non una misura fissa: la stessa riga a due
larghezze diverse produce due margini diversi e lo stesso scarto zero.

---

## 4. Non-regressioni, misurate nello stesso giro

Verdi in **entrambi** i giri — e' quello che le rende controlli, non asserzioni.

- **10k p7** — banda owner → soggetto: `24px` before, `24px` after. L'etichetta
  «owner» resta dentro la sua scatola, sopra il soggetto.
- **FL5** — la riga dei conteggi e' ancora la sua: «0 incoming · 0 outgoing».
- **FL6** — sotto la soglia (`hostWidth < drawnWidth`) la riga espansa degrada
  ancora nella lista testuale: a viewport 620 `__frame` e' **assente** e l'ospite
  e' `instance-manager__ego-list`. E' anche il controllo **negativo** del punto 1:
  dove il grafo non c'e', non c'e' niente da centrare.
- **Overflow** — la meta' non ovvia del punto 1, e la ragione della scelta di §2.
  Scatola stretta a mano sotto la larghezza del disegno (`Running`, 356px in una
  scatola da 260):

  | | before | after |
  |---|---|---|
  | `__frame` x vs `__scroll` x | 797 = 797 | 797 = 797 |
  | margini calcolati | `0px` / `0px` | `0px` / `−96px` |
  | `scrollWidth` / `clientWidth` | 356 / 260 | 356 / 260 |

  Il blocco resta a sinistra e la scatola scorre, identica a prima: **nessun clip
  nuovo**. I margini automatici con spazio libero negativo valgono 0, e il
  browser scarica lo scarto sul margine destro (LTR).

**Sonda**: `before` **14 PASS / 6 FAIL** (i 6 rossi sono i punti 1 e 2, mirati),
`after` **20 PASS / 0 FAIL**. Zero errori di pagina in entrambi i giri.

Una nota di metodo, perche' e' costata un giro: il primo `PROBE_LABEL=before`
rilanciato **dopo** il fix e' uscito 20/20. L'etichetta e' solo un nome di file —
il dev server aveva gia' ricaricato il foglio. Il giro `before` valido e' stato
rifatto con `git checkout HEAD --` sul foglio, e sono quelli i numeri qui sopra e
gli screenshot `_tmp_ego1_before_*`.

---

## 5. L'unita'

`__tests__/egoDiagram.test.ts`, blocco 4, **5 casi nuovi** (24 in totale). La
suite gira con `environment: 'node'`: non c'e' layout, quindi qui non si misura
ne' il centraggio ne' i 12px — quella meta' e' della sonda. Quel che l'unita'
tiene e' la **forma** delle due dichiarazioni: che il centraggio sia a margini
automatici e non a `justify-content` (che in un contenitore che scorre taglia),
che `__frame` non prenda una `width` dal foglio (arriva inline, e due copie
divergerebbero), che il passo verticale venga dalla scala `--space-*`, e che il
foglio non copi il valore di `EGO_OWNER_GAP`. Una riscrittura che le perde passa
la sonda solo se qualcuno la rilancia; passa di qui sempre.

Provata contro **cinque** mutazioni — gap tornato a `6px`, `margin-inline`
rimosso, centraggio riscritto con `justify-content` sul contenitore che scorre,
`24px` ricopiato nel foglio, `width: 100%` sul frame: **1 rosso ciascuna**, verde
al ripristino in tutte e cinque.

Un caso e' stato corretto in corsa: l'asserzione su `EGO_OWNER_GAP` era scritta
sul testo del foglio e cadeva sul **commento** che dice che la costante sta
altrove — cioe' sul contrario del difetto. Ora toglie i commenti e guarda le sole
dichiarazioni, con un positivo di controllo che il taglio non abbia mangiato il
foglio.

---

## 6. Corsie

Nessun conflitto. AUTO1 Fase 2 (in volo, referto non committato
`discovery_2026-09-01_auto1_id_autoincrement.md`) ha perimetro `jjform/create.ts`
e il percorso Create di `InstanceManagerTab.tsx`. Questa slice tocca
`egoDiagram.scss` e `__tests__/egoDiagram.test.ts` — nessun file in comune,
nessuna serializzazione necessaria.

---

## 7. Punti aperti

- Il `gap` scelto e' `--space-3` (12px). Se all'occhio e' troppo, `--space-2`
  (8px) e' l'altro token della scala e la misura e' §2. Non ci sono altri
  candidati: sotto c'e' il letterale che si e' tolto.
- Il foglio dichiarava in testa «Letterali: le misure … il sistema tokenizza i
  colori»; con questa slice non e' piu' vero senza un'eccezione, e
  l'intestazione la nomina. Il resto delle misure di FL5 (raggi, corpi, pesi)
  resta letterale, come prima.
