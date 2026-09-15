# Discovery — 10e: conformità dell'outline e misura della colonna centrale

Data: 2026-08-31. Fase 1 di `PROMPT_10e_outline_misura.md` (prompt a schermo, non su file
al momento della lettura). Sessione singola, seriale.

## 0. Ipotesi che questa discovery sta falsificando

Il prompt elenca cinque requisiti per l'outline e due per la colonna centrale, e li
presenta tutti come *difetti da correggere*. L'ipotesi sotto esame è che siano sette
delta. **Tre dei sette non lo sono**: sono già nel codice committato, e due di quelli il
prompt stesso li chiama «verifica che…», non «fai». La discovery serve a separare i
delta veri dalle verifiche, perché scrivere un diff su una regola già presente è il modo
più economico di introdurre una regressione.

L'ottava ipotesi, non dichiarata nel prompt: che la coppia di token `--color-entity-model-*`
sia ambra. **Falsificata**, §4.

## 1. File letti

| Path | Righe lette |
|---|---|
| `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` | 800–960 (`OutlinePanel`), 1740–1900 (layout), 2028–2060, 2380–2512 |
| `frontend/src/components/abstract/tabs/instanceManagerTab.scss` | 1–130 (layout/card), 390–420 (footer), 460–490 (table-scroll), 610–615 (`__code`), 1267–1410 (outline) |
| `frontend/src/components/editor-v2/hooks/outlineDraw.ts` | 1–80 |
| `frontend/src/jjform/outline.ts` | 30–80 (`OutlineNode`, `OutlineKind`) |
| `frontend/src/jjform/shape.ts` | riga 120 (`abstract: boolean`) |
| `frontend/src/common/entityMeta.ts` | 1–175 (intero) |
| `frontend/src/styles/tokens/_colors-light.scss` | 52–54, 84, 161–163, 229, 334–371, 376, 407, 423 |
| `frontend/src/components/abstract/tabs/__tests__/instanceManager10d.test.ts` | 1–60 |
| `frontend/scripts/smoke/_tmp_10d_verify.ts` | 1–320 |

## 2. Findings — outline

### F1. La coppia di selezione c'è già, ed è la stessa della riga tabella

`instanceManagerTab.scss:1288-1296`, verbatim:

```scss
        &--selected,
        &--selected:hover {
            background: var(--color-selection-bg);
            box-shadow: inset 2px 0 0 var(--color-selection-bar);
        }
```

È esattamente ciò che il prompt chiede («campitura `--color-selection-bg` + barra
inset 2px 0 0 `--color-selection-bar`»), byte per byte, e ci è arrivata con 10b.

La domanda subordinata del prompt — «se sono due alberi diversi, unificali o dichiara
perché no» — **non si pone**: l'albero di 10b e il pannello Model outline sono lo stesso
componente. `OutlinePanel` (`InstanceManagerTab.tsx:839`) è l'unico albero del manager, è
montato una volta sola (`:1764`), e il commento di 10b sopra la regola dice già che la
barra è «quella che la riga della tabella porta su `__td-name`». Zero delta. Resta la
verifica a schermo, che è l'unica prova ammessa (§5: uno stile è una misura del rendering
solo se l'elemento misurato è quello che dipinge).

### F2. La classe a destra è già mono 11 slate-500

`instanceManagerTab.scss:610-614`:

```scss
    &__code {
        font-family: 'IBM Plex Mono', Monaco, Consolas, monospace;
        font-size: 11px;
        color: var(--color-form-section);
    }
```

e `_colors-light.scss:407`: `--color-form-section: #{$slate-500};` — cioè `#64748b`.
`OutlinePanel` monta `<span className="instance-manager__code">{node.cls}</span>`
(`InstanceManagerTab.tsx:913`), la stessa classe che la tabella usa. L'arbitrato A4
(parity, un valore solo ovunque) **è già soddisfatto**. Zero delta, verifica a schermo.

Il prompt elenca «classe in mono chiaro» fra i difetti osservati. Il sorgente dice che il
valore è quello richiesto: o il difetto percepito è il *contrasto* dello slate-500 su
bianco (che è la scelta del DS, non un errore), o è la vicinanza con le icone generiche
di F3, che tirano giù l'intera riga. La sonda misurerà il valore; non può misurare la
percezione.

### F3. Le icone sono generiche, e non passano da `entityMeta` — DELTA

`InstanceManagerTab.tsx:855-859`, verbatim:

```typescript
    const icon = (node: OutlineNode): string => {
        if (node.kind === 'model') return 'bi-box';
        if (node.kind === 'broken') return 'bi-exclamation-triangle';
        return hasSlots(node) ? 'bi-folder2' : 'bi-circle';
    };
```

`bi-folder2` e `bi-circle` **non esistono in `ENTITY_META`**: sono una tabella locale, e
il docstring di 10b lo dichiara apposta («il modello è una scatola, un'istanza la cui
metaclasse ha feature di contenimento è una cartella, ogni altra un cerchio»). La regola
scelta lì è *ha figli / non ha figli*, che è informazione di struttura, non di tipo — ed è
già detta dal chevron, due pixel a sinistra.

`entityMeta.ts` dà `class → diagram-3` (`ENTITY_META.class.icon = 'diagram-3'`) e
`model → box`. Il nodo modello quindi **non cambia glifo**: `bi-box` è già quello che
`entityIcon('model')` restituisce. Cambia il fatto che lo prenda dalla mappa invece che da
un letterale, e cambia il colore.

Il colore: `&__outline-icon { color: var(--color-form-section); }` (`:1325-1329`) — grigio
per tutte. Il prompt vuole il foreground della coppia di entità.

**Nota sul dominio.** Ogni riga `object` dell'outline è un `DObject` la cui metaclasse è
una `DClass`: l'entity type è `'class'` per costruzione, mai `'enum'` né `'dataType'`.
`abstractClass` non può occorrere — un'istanza di una classe astratta non esiste, ed è la
regola che il rail già applica (`uninstantiableReason`). Quindi la mappa, per quanto sia
la sorgente giusta, restituisce **un valore solo** su questa superficie: `diagram-3` +
`--color-entity-class-fg`. Questo è il comportamento richiesto, non un difetto della
lettura — ma va detto, perché una sonda che verificasse «icone diverse per metaclassi
diverse» misurerebbe una cosa che il modello non produce.

`broken` resta `bi-exclamation-triangle` con `--color-error`: è ciò che 12d impone e che
il prompt non tocca.

### F4. Il nodo modello: il glifo c'è, il peso e la coppia no — DELTA

- Glifo: già `bi-box` (F3), che è `entityIcon('model')`.
- Coppia: `--color-entity-model-fg`, oggi non applicata.
- Nome 12/600: la riga è `font-size: 12px` (`:1283`), e `&__outline-name` (`:1331-1337`)
  **non dichiara `font-weight`** — eredita `normal`. Serve un modificatore sul nodo
  modello.

### F5. Densità e hover — DELTA

Oggi (`:1278-1287`):

```scss
        gap: 6px;
        padding: 4px 10px 4px 14px;
        font-size: 12px;
        ...
        &:hover { background: var(--color-bg-tertiary); }
```

- Altezza: 12px di testo × line-height normale + 8px di padding ≈ 26px. Il prompt chiede
  **28px**, che va dichiarato come `min-height` e non ottenuto allargando il padding: il
  padding lo mangerebbe la riga con il menu «+» aperto.
- Indent 16px/livello: **già corretto**, inline in
  `style={{ paddingLeft: 14 + node.depth * 16 }}` (`:884`).
- Hover: `--color-bg-tertiary` oggi, `--color-bg-hover` richiesto. Sono due ruoli diversi
  (`_colors-light.scss:84`: `--color-bg-hover: #{$slate-150};`). Delta di un token.

### F6. Il «+»: raggiungibile da tastiera e visibile — già vero, da verificare

`InstanceManagerTab.tsx:916-925` è un `<button type="button">`, quindi nel tab order per
costruzione, e `:1361` gli dà `&:focus-visible { opacity: 1; ... }` — cioè si accende al
focus da tastiera, non solo all'hover del mouse. `:1367-1369` lo tiene acceso su hover,
sulla riga selezionata e a menu aperto. Zero delta; la verifica è a schermo, con un
`Tab` vero e non con una lettura del foglio.

## 3. Findings — colonna centrale

### F7. Il `max-width: 1300px` esiste, ma **non sulle card** — DELTA

`instanceManagerTab.scss:115-121`:

```scss
    &__form-inner {
        width: 100%;
        max-width: 1300px;
        margin: 0 auto;
        padding: 14px;
    }
```

Il cinturino è **dentro** la card della form. La card stessa, e quella della tabella,
prendono tutta la larghezza del desk: `&__main` è `display: flex; flex-direction: column`
con `align-items` implicito `stretch`. Il prompt chiede il cinturino **sulle due card**,
centrate sul fondo desk — che è un'altra cosa: sotto il 1300 la tabella oggi si allarga
fino al bordo, e la form no, e le due card hanno larghezze diverse su schermo largo.

Questo è **anche** il difetto che il prompt chiama «la colonna centrale non ha misura»:
non è che la misura manca, è che è applicata un livello troppo in basso.

### F8. La card tabella riempie l'altezza — DELTA

`instanceManagerTab.scss:99`, verbatim:

```scss
    &__pane--table { flex: 1 1 auto; overflow: hidden; min-height: 0; }
```

`flex-grow: 1` su una colonna: con sei righe in tabella la card si stira fino al fondo
del desk e il footer resta appeso in basso, staccato dall'ultima riga. È esattamente
«la card vuota che riempie la pagina».

Il vincolo che non va perso, dichiarato da FL6 in `:100-111`: **la tabella non deve mai
sparire** quando la form è alta. Quindi la card non può diventare `flex: 0 0 auto` nudo —
con quaranta righe crescerebbe oltre il desk. Serve `flex: 0 1 auto` più un tetto, così
che abbracci il contenuto quando è corta e scorra al suo interno quando è lunga. Il
`&__table-scroll { flex: 1 1 auto; }` (`:469-473`) resta corretto sotto entrambi i regimi:
in una card che abbraccia non ha spazio in più da prendere.

## 4. La coppia model **non è ambra** — premessa del prompt falsificata

Il prompt scrive «coppia model (amber)». `_colors-light.scss:356-357`:

```scss
  --color-entity-model-bg: var(--color-entity-container-bg);
  --color-entity-model-fg: var(--color-entity-container-fg);
```

e `:334-335` danno `container-bg: #E2EAF5`, `container-fg: #45566F` — un blu-ardesia. La
coppia model **aliasa la famiglia container** insieme a metamodel, package, viewpoint,
transformation, refactoring e view. Non è ambra e non lo è mai stata in questa scala,
che è generata in OKLCH (R-RAIL-30, nota in testa a `entityMeta.ts`).

L'ambra nel DS esiste, ed è altrove: `--color-warning: #f59e0b` (`:161`) e
`--color-type-object: #f59e0b` (`:229`).

**Scelta, e perché.** Si usa `--color-entity-model-fg`, cioè il token, non il colore fra
parentesi. La clausola normativa del prompt è «coppia model»; «(amber)» è l'inciso che la
descrive, e descrive male. Dipingere il nodo modello di `#f59e0b` significherebbe
introdurre nel manager una seconda palette per un elemento solo, contro la Regola 28 e
contro il precedente diretto di 10c, che per il badge «C» ha preso i token di entità e ha
scritto nel foglio la sola geometria. Se l'intenzione era davvero l'ambra, è una modifica
alla scala di entità in `styles/tokens/`, non a questo pannello, e vale per ogni
superficie che dipinge un modello.

## 5. Perimetro e rischi

File toccati: `InstanceManagerTab.tsx`, `instanceManagerTab.scss`, più un file di test
nuovo. Tre file, sotto la soglia della Regola 19.

**Layer Impact Report: non richiesto.** Nessun file di §3.1 nel perimetro. Zero creatori
D, zero `TRANSACTION`, zero `SetFieldAction`: il delta è regole SCSS, la funzione `icon`
di `OutlinePanel`, e una classe in più sul nodo modello.

Rischi:

1. **La regola condivisa delle card.** `&__pane--table, &__pane--form` (`:91-97`) è letta
   dai test di 10d come ancora testuale (`CARD_RULE` in `instanceManager10d.test.ts:47`,
   con la stringa esatta `'&__pane--table,\n    &__pane--form {'`). Aggiungere dichiarazioni
   dentro quel blocco è sicuro; cambiarne il testo del selettore romperebbe quei test.
2. **`__form-inner` diventa ridondante.** Con il cinturino sulla card, il suo
   `max-width: 1300px` non morde più (la card è già ≤ 1300, meno il padding). Non si
   rimuove: Regola 9, e la rimozione non cambierebbe un pixel.
3. **Il footer sbordato.** `&__foot` usa `margin: 8px -14px -14px` e conta sul
   `overflow: hidden` della card. Cambiare il regime di flex della card non tocca né
   l'uno né l'altro, ma va verificato a schermo (asserzione 3b/3c di 10d, riusata qui
   come non-regressione).

## 6. Domande aperte

1. L'ambra del §4 è un errore di stesura del prompt, o è una richiesta di cambiare la
   scala di entità? La slice procede col token; se è la seconda, è un'altra slice e
   tocca `styles/tokens/`.
2. Con la card che abbraccia il contenuto, il tetto d'altezza va al 100% del desk meno la
   form, che è ciò che il flex già calcola. Nessuna percentuale nuova viene introdotta.

---

## 7. Fase 2 — cosa la misura ha aggiunto alla discovery

Sonda `frontend/scripts/smoke/_tmp_10e_verify.ts`, girata DUE volte con lo stesso file e la
slice in `git stash`. **before 36 PASS / 17 FAIL — after 53 PASS / 0 FAIL**, zero errori di
pagina in entrambi i giri. I 17 rossi del before sono le asserzioni della slice; i 36 verdi
sono i controlli positivi e le non-regressioni, e comprendono F1, F2 e F6 — le tre cose che
la §2 aveva dichiarato già presenti dal sorgente, qui confermate a schermo.

### 7.1 La regola del colore del glifo, scritta da 10b, non dipinge

Il reperto della slice, e non era nella lista dei sette. `instanceManagerTab.scss:1325-1329`
dichiara `&__outline-icon { color: var(--color-form-section); }`, cioè slate-500. Misurato
nel giro «before»: **ogni glifo dell'outline rende `rgb(15, 23, 42)`**, che non è
`#64748b` — è `--font-color-1`, e arriva da `styles/style.scss:788`:

```scss
i.bi {
  color: var(--font-color-1);
  &:hover{
    color: var(--palette-1-hover);
  }
}
```

`i.bi` è (0,1,1), la regola dell'outline è (0,1,0), e il glifo dell'albero **è** un
`<i class="bi …">`. La dichiarazione di 10b è morta da quando è stata scritta, senza errore
di compilazione e senza avviso. È il reperto dell'albero del 2026-08-12 nella stessa forma:
quando uno stile e un pixel non concordano, il pixel è la misura.

Conseguenza sul diff: la regola nuova è a **(0,3,0)** — pannello, nodo, glifo — e non a
(0,2,0), perché deve battere anche `i.bi:hover`, che è (0,2,1). Con (0,2,0) il colore
dell'entità sarebbe saltato via al passaggio del mouse: verde in una sonda che non passa
sopra la riga, rotto sotto il dito dell'utente.

La regola nuda di 10b resta dov'è, come fallback dichiarato (Regola 9). Non è stata
promossa: il colore per genere ha la sua regola, e sono due affermazioni diverse.

### 7.2 Il cinturino a 1300px non morde a 1600px di viewport, e non è un difetto

Prima stesura della sonda: «a 1600px di viewport il desk è più largo del cinturino».
**Falsa.** A 1600px il desk è largo **858px** — l'outline ne prende 300, il catalogo 200, il
rail di progetto il resto — e nessun cinturino a 1300 può toccare una colonna da 858.
L'asserzione è stata l'unico rosso del primo giro «after», ed era la sonda a sbagliare.

Corretta misurando dove morde: a **2200px** il desk supera 1400 e le due card si fermano a
**1300 esatti**, centrate, gronde pari a sinistra e a destra (§11c–11f). Il ritaglio è
`_tmp_10e_after_6_wide.png`.

Il punto di metodo: un'asserzione il cui *antecedente* è falso passa o fallisce per la
ragione sbagliata. Qui sarebbe stata verde in entrambi i giri se scritta come `<= 1300`, e
avrebbe certificato un cinturino mai esercitato.

### 7.3 Tre difetti della sonda, corretti prima del giro buono

Tutti e tre della stessa famiglia — una misura che restituisce silenzio, e il silenzio letto
come risultato (§5).

1. **L'hover misurato su una foglia.** `nth(2)` è `Idle`, che non ha child-slot e quindi non
   ha «+»: l'opacità letta era `null`, cioè *il controllo non c'è*, non *il controllo è
   invisibile*. La sonda ora cerca la prima riga che un «+» ce l'ha.
2. **`el.focus()` non accende `:focus-visible`.** Misurato: `focused=true opacity=0`. È una
   regola sulla **modalità** di interazione, e dopo un focus programmatico preceduto dal
   mouse il browser non la fa scattare. La sonda ora preme **Tab** veri: il «+» si raggiunge
   al 68° Tab, con `:focus-visible` vero e opacità 1.
3. **La parità A4 non ha due termini da confrontare.** La tabella dipinge il mono solo sulle
   celle di genere `code`, e questa fixture non ne ha (misurato: **0** in pagina). Il
   confronto di due stili calcolati sarebbe stato uno contro `null`. L'affermazione vera, e
   misurabile, è che l'outline usa **la stessa classe** `instance-manager__code` e non un
   mono privato; il conteggio delle celle vive è riportato accanto invece che nascosto.

### 7.4 Un reperto fuori scope, registrato e non toccato

L'outline rende lo **stesso oggetto sotto più padri**: 18 nodi per 12 istanze, e la
selezione per id ne accende **due** (`["Running@46", "Running@30"]` nel giro «after»). Si
vede nel ritaglio `_tmp_10e_after_1_rest.png`: `Idle`, `Running`, `Off`, `Broken`, `start`,
`stop` compaiono sia sotto `Heater`/`Cooler` sia come radici.

È logica dell'outline — `outlineRoots` e `ownerOf` — che il prompt dichiara **fuori scope**,
ed è **antecedente** a questa slice: il giro «before» conta gli stessi 18 nodi. L'asserzione
9a è stata scritta `>= 1` con il conteggio registrato accanto come misura, invece che
`=== 1`, che avrebbe dato per uno ciò che sono due. Materia per una slice sulla logica
dell'albero, non per una di chrome.

### 7.5 Gate

| Gate | Esito |
|---|---|
| `npm run typecheck` | **33**, baseline invariata, conteggio su output completo (`EXIT=2`), zero errori nei file toccati |
| `npm run build` | exit **0**, solo il chunk-warning noto |
| `npx vitest run` | **2642 passati / 0 falliti** (2607 + i 35 nuovi); 9 file rossi = i noti `window is not defined`, nessuno di questa slice |
| suite propria | **35/35**, provata con 5 mutazioni (2/1/1/1/1 rossi, verde al ripristino) |
| `npm run smoke` | **GREEN 12/0/3**, corsa quiescente, un boot per stato, `moved: nothing` — e NON probante per questa slice: nessuno stato di `states.ts` monta il manager |
