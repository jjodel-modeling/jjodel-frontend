# Discovery — 10d: sfondo e card del manager

Data: 2026-08-31. Slice micro, seriale. Solo chrome della colonna centrale del
manager; zero logica.

## Ipotesi che questa discovery sta falsificando

1. «Il token da usare per il fondo desk e' `--color-bg`.» — il prompt lo nomina
   cosi'. **Falsa**: quel token non esiste.
2. «La testata e il footer vanno spostati dentro la card.» — **falsa**: sono
   gia' dentro la sezione che diventera' card. Nessun movimento di DOM.
3. «Il rail metaclassi ha un bordo destro da verificare sul fondo nuovo.» —
   **falsa**: quel bordo non esiste oggi.

## Obiettivo

Stabilire quali token esistono per (a) il fondo desk, (b) la card, e quale
elemento del DOM li riceve, prima di scrivere una riga.

## File letti

- `frontend/src/components/abstract/tabs/instanceManagerTab.scss` (1619 righe)
- `frontend/src/components/abstract/tabs/InstanceManagerTab.tsx` (2506 righe,
  regione di layout 1860-2506 e i memo 1250-1292)
- `frontend/src/components/abstract/tabs/__tests__/instanceManager10c.test.ts`
- `frontend/src/styles/tokens/_colors-light.scss`, `_colors-dark.scss`,
  `_radius.scss`, `_shadows.scss`
- `frontend/src/styles/tokens.css` (il file dei 15 token omonimi)
- `docs/PROTOCOL.md`, `docs/claude-code-log.md` (ultime entry),
  `docs/discovery/discovery_2026-08-31_manager_parity_10c.md`

## Reperti

### 1. `--color-bg` non esiste. Il token del fondo desk e' `--color-form-panel`

`command grep -rn -- "--color-bg:" frontend/src/styles/` esce a vuoto (controllo
positivo: la stessa forma su `--color-bg-primary` restituisce
`_colors-light.scss:80`). Il nome del prompt e' descrittivo, non un token.

I due candidati ovvii sono avvelenati e il codebase lo documenta:
`_colors-light.scss:390-397` dice che `--color-bg-primary` / `--color-bg-secondary`
sono fra i 15 nomi dichiarati **sia** da `styles/tokens/` **sia** da
`styles/tokens.css` con valori diversi, e che tokens.css vince la cascata.
Misurato qui: `tokens.css:116` dichiara `--color-bg-primary: #ffffff` —
esattamente il bianco pieno che questa slice deve togliere.

Il token giusto e' `--color-form-panel`, che vale `$slate-50` = `#f8fafc`
(`_colors-light.scss:399`) ed e' commentato in scuro (`_colors-dark.scss:298`)
come *«panel under the cards»*: il ruolo che questa slice chiede, gia' scritto.
Ed e' nel vocabolario che il foglio del manager usa dappertutto.

### 2. I token della card esistono tutti tranne uno, e l'eccezione va dichiarata

| Chiesto dal prompt | Token | Valore |
|---|---|---|
| bianco | `--color-form-surface` | `#ffffff` |
| `border-radius: 12px` | `--radius-card` | `var(--radius-lg)` = 12px |
| hairline `#e2e8f0` | `--color-form-border` | `$slate-200` = `#e2e8f0` |
| `0 1px 3px rgba(0,0,0,0.04)` | **nessuno** | — |

L'ombra chiesta non e' un token. `--shadow-card` e' `--shadow-md` =
`0 4px 12px rgba(0,0,0,0.08)`, il doppio del raggio e il doppio dell'alpha:
sarebbe un'ombra da modale su una superficie di lettura. `--shadow-sm` =
`0 1px 2px rgba(0,0,0,0.05)` (`_shadows.scss:41`) sembrava il vicino piu'
prossimo, ed e' un token. **Prima decisione, scritta qui e poi FALSIFICATA dalla
sonda**: si usa `--shadow-sm`, delta 1px di raggio e 0.01 di alpha.

### 2b. `--shadow-sm` non dipinge `--shadow-sm`. Misurato, non dedotto

La sonda `_tmp_10d_verify.ts` legge lo stile CALCOLATO sulla card, e con
`box-shadow: var(--shadow-sm)` ha misurato:

```
rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px
```

che non e' lo `0 1px 2px rgba(0,0,0,0.05)` di `_shadows.scss:41`. E' il valore
di `styles/tokens.css:192`. **`--shadow-sm` e' fra i nomi dichiarati due volte
con valori diversi**, e tokens.css vince la cascata — lo stesso meccanismo che
`_colors-light.scss:390-397` documenta per `--color-bg-primary`, su un file di
token che quel blocco non nomina. Il reperto 1 aveva evitato la trappola sui
colori e la slice ci e' caduta sulle ombre, un blocco piu' sotto.

E' anche il caso di scuola di §5: leggere `_shadows.scss` e concludere «vale
0 1px 2px 0.05» e' leggere il comparatore. La sola validazione e' eseguire e
guardare il pixel, ed e' la sonda ad averlo fatto.

**Decisione definitiva**: si dichiara un ruolo proprio,
`--shadow-desk-card: 0 1px 3px rgba(0, 0, 0, 0.04)`, in
`styles/tokens/_shadows.scss`, nei blocchi di ENTRAMBI i temi — scritto per
esteso e non come alias, per la stessa ragione per cui `--shadow-popover` lo e'
(la nota gia' nel file: un alias eredita la gara di cascata invece di
risolverla). Il valore e' esattamente quello della board, quindi il delta
dichiarato sopra sparisce, e la regola 28 e' rispettata perche' la variabile
nasce in `tokens/` e il componente la legge soltanto. Rimisurato: la card
dipinge `rgba(0, 0, 0, 0.04) 0px 1px 3px 0px`.

**Espansione di scope, dichiarata (Regola 1 / P2)**: `_shadows.scss` non e' fra
i file che il prompt nomina. Ci si e' arrivati per la Regola 28, che vieta di
dichiarare variabili CSS nel foglio del componente e indica `styles/tokens/`
come la loro sola casa. L'alternativa — tenere `--shadow-sm` — sarebbe stata
lasciare la superficie appesa a un nome che il codebase documenta come
inaffidabile.

Il 12px della card e' l'unico raggio: `--radius-card` esiste e vale 12px, quindi
il numero del prompt e il token coincidono e non c'e' niente da arbitrare.

### 3. La testata e il footer sono gia' dentro la card. Nessun DOM da spostare

`InstanceManagerTab.tsx:1896` apre `<section class="… __pane--table">` e la
chiude a `:2252`. Dentro, in ordine: `__head` (1905, titolo e provenienza),
`__toolbar` (1913, filtro + segmented + indicatore colonne + Export + New),
`__table-scroll` (2028), `__foot` (2216, conteggio e paginazione). La richiesta
«testata DENTRO la card, footer come bordo inferiore» e' gia' soddisfatta dalla
struttura: quello che manca e' che la sezione **sia** una card. Il diff e' di
sole regole SCSS su selettori esistenti, piu' la riga del sottotitolo.

Il footer pero' oggi ha `border-top` dentro il padding del pannello (14px), e
quindi la sua riga NON arriva ai bordi. Per essere «il bordo inferiore della
card» va sbordato in negativo (`margin: 8px -14px -14px; padding: 10px 14px`),
che il `overflow: hidden` gia' presente sul pannello clippa contro il raggio.

### 4. Il fondo desk va su `__main`, non sulla radice

`.instance-manager` (`:34`) dipinge `--color-form-surface` su TUTTO il tab, rail
compresi. Il prompt limita il fondo desk «alla colonna a destra del rail»: quel
contenitore esiste ed e' `__main` (`:59`, JSX `:1894`), che avvolge esattamente
i due pannelli tabella e form. La radice resta bianca, e i due pannelli di
lettura a sinistra (`__pane--outline` 300px, `__pane--classes` 200px) restano la
superficie di colonna che sono oggi. `__main` prende `padding: 12px` e
`gap: 12px`, che sono la gronda della card e il fondo che separa le due card.

### 5. Il «bordo destro del rail» che il prompt chiede di verificare non c'e'

La regola dei separatori e' `&__pane { + .instance-manager__pane { border-left } }`
(`:42`). Nell'ordine del DOM — outline, classes, main — `__main` **non** ha
classe `__pane`, quindi non riceve alcun `border-left`: fra il rail e la colonna
centrale oggi non passa nessuna riga, e le due superfici si toccano perche' sono
lo stesso bianco. Col fondo desk il confine diventa un salto di tono, che e' un
separatore piu' forte di quello che c'era. **Non si aggiunge nulla**: il reperto
e' che non c'era un bordo da far reggere, non che ce n'e' uno che regge.

### 6. Il sottotitolo: l'arbitrato di 10c chiude un punto che 10c aveva aperto

`discovery_2026-08-31_manager_parity_10c.md:217-224` lascia aperto che il
sottotitolo di provenienza e la frase di `newInstanceReason` dicono quasi la
stessa cosa a sessanta pixel di distanza, e rimanda la scelta ad Alfonso. Il
prompt di 10d la fa: cade «Created from the container's form», resta
`<modello> · N instances`.

`N` e' `rows.length` (`:1250`), le istanze della metaclasse nel modello, NON
filtrate. Il footer conta `visible.length`, le filtrate. I due numeri non sono
lo stesso numero detto due volte: il sottotitolo dice quanto e' grande la
collezione, il footer quanto ne resta sotto i filtri, e coincidono solo a filtri
spenti.

Un'asserzione di 10c va aggiornata: `instanceManager10c.test.ts:416` afferma il
testo vecchio alla lettera. Si riscrive sulla frase nuova — stessa affermazione
(«il sottotitolo porta il nome del modello»), copy nuova.

## Dipendenze e rischi

- Nessun file di `CLAUDE.md` §3.1 nel perimetro: niente Layer Impact Report.
- Zero creatori D, zero `TRANSACTION`, zero `SetFieldAction`. Il delta e' un
  foglio SCSS, una riga di JSX e due file di test.
- Rischio di regressione visiva concentrato su tre punti: il `thead` sticky
  (dipinge `--color-form-surface` e resta sulla card, invariato), il footer
  sbordato (clippato dal raggio, va misurato) e il pannello form collassato, che
  deve restare una card sottile e non una barra a tutta larghezza.
- Dark mode fuori scope, ma i quattro token scelti sono dichiarati in entrambi i
  file: la slice non introduce un buco di tema.

## Domande aperte

Nessuna bloccante. Una dichiarata e non toccata, come il prompt chiede: la
colonna `name` compare due volte in tabella (gia' rilevata come reperto 3 di
10c, «la colonna `name` e' due cose»). Fuori perimetro qui.


## Addendum — la sonda, e cosa ha detto il giro «before»

`frontend/scripts/smoke/_tmp_10d_verify.ts`, fixture Heater/Cooler di 10c
(l'enum `Kind` e la colonna `note` mai valorizzata servono a tenere in scena
segmented e indicatore delle colonne vuote, o le misure di chrome girerebbero su
una superficie piu' povera di quella vera). 29 asserzioni, viewport 1600x950.

Girata **due volte con lo stesso file**, `PROBE_LABEL` a distinguere gli
screenshot, e la seconda con l'albero della slice in `git stash`:

| giro | esito |
|------|-------|
| **before** (albero pre-10d) | **15 PASS / 14 FAIL / 0 errori di pagina** |
| **after** (albero della slice) | **29 PASS / 0 FAIL / 0 errori di pagina** |

I 14 rossi del before sono il controllo per contrasto, e sono esattamente le
asserzioni della slice: `main.bg` bianco invece di `#f8fafc`, `radius: 0px`,
`box-shadow: none`, `form.y - table.bottom = 0` (le due superfici fuse, che e'
il difetto segnalato a schermo), footer a 13px dal fondo e largo 26px meno della
sezione, sottotitolo alla vecchia copy. I 15 verdi sono i controlli positivi e
le non-regressioni: un before tutto rosso avrebbe detto che la sonda non sa
misurare, un before tutto verde che non misura questa slice.

Misure che valgono la pena di essere citate:

- `main.bg = rgb(248, 250, 252)` con `root.bg = rgb(255, 255, 255)`: il fondo
  desk sta sulla colonna e NON ha invaso il tab. Il rail e' `rgba(0,0,0,0)`,
  cioe' eredita il bianco della radice — reperto 4 confermato a schermo.
- `table.x - main.x = 12` e `form.y - table.bottom = 12`: la gronda e lo stacco.
- `foot.bottom = 858` contro `table.bottom - 1 = 858`, e `foot.w = 832` contro
  `table.w - 2 = 832`: il footer poggia sul bordo inferiore della card e la sua
  riga attraversa tutta la card, non il solo contenuto.
- form collassata **34px** con `radius: 12px` e ombra: card sottile, non barra;
  aperta **387px**, quindi il `max-height: 55%` di FL6 continua a fare da tetto.
- sottotitolo `SmM1 · 6 instances` mentre il footer, col segmented su `final`,
  dice `2 instances of 6 · 1 selected`: i due numeri sono due domande diverse,
  come il reperto 6 sosteneva.
- riga espandibile = 1, ego-diagramma = 1, nodi outline = 18, overflow
  orizzontale del documento = 0.

Screenshot (non committati, `.gitignore:66`):
`_tmp_10d_{before,after}_{1_rest,2_selected,3_filtered}.png` in
`frontend/scripts/smoke/`.
