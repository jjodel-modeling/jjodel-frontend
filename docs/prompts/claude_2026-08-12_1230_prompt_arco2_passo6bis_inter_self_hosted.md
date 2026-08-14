# Prompt Claude Code — arco 2, passo 6-bis: Inter self-hosted, e la chiusura di «"Inter Variable" non è il nome servito da Google»

**Data**: 2026-08-12 12:30
**Tipo**: fix
**Perimetro**: due file. Fuori dalla critical zone.
**Dipende da**: il **passo 6**, che riscrive il commento di `_typography.scss:70-78`. Questo passo lo
riscrive di nuovo, e la diff allegata è calcolata **sopra** il passo 6. Se esegui questo prima del 6,
il contesto del secondo hunk non combacia: fai prima il 6.
**Numerazione**: «6-bis» e non «7» perché il 7 nel memo di ratifica è la postura Browse/Focus, e
spostare tutto per fare posto romperebbe i riferimenti già scritti.

**Diff verificata allegata**: `patch_2026-08-12_inter_self_hosted.diff`. Prodotta e provata su clone
Linux sopra `d09058ae` più il passo 6: `npm run typecheck` **14 errori, il baseline locale, invariati**
(sul Mac sono 33), `npm run build` exit 0.

---

## Perché

`@fontsource-variable/inter ^5.2.6` è in `package.json` e in `node_modules`, e il suo `index.css`
dichiara `font-family: 'Inter Variable'`. **Non è mai importato**: zero occorrenze di `fontsource`
in `frontend/src` e in `frontend/index.html`, con controllo positivo su `bootstrap-icons`, che
invece si trova. Quindi `'Inter Variable'`, che è il primo nome di `--font-sans` e compare come
primo nome in una ventina di stack letterali sparsi per il codebase, **non risolve**: la resa cade
sul secondo nome, `Inter`, servito dall'`@import` di Google.

Misurato prima della modifica, su build di produzione servita e Chromium: la larghezza resa di una
stringa di prova con `font-family: "Inter Variable"` è **770.94px**, identica a quella del `serif`
di sistema, cioè il fallback di default; `document.fonts` non contiene alcuna faccia `Inter Variable`.

Il TODO a `_typography.scss:74-77` chiede il self-hosting per performance, privacy e offline. Il
pacchetto per farlo è **già installato**: chiudere la voce e chiudere il TODO sono lo stesso atto.

---

## COSA

Un commit solo, due file.

### 1. `frontend/src/index.tsx` — l'import mancante

Aggiungere una riga dopo `import 'bootstrap-icons/font/bootstrap-icons.css';` (`:7`):

```ts
import '@fontsource-variable/inter';
```

La collocazione non è arbitraria: le righe `:6-8` sono già il blocco dei CSS che arrivano da
pacchetti npm, e questa è dello stesso tipo. Non va in un file SCSS, perché il pacchetto risolve
per specifier npm e i token SCSS non lo importano.

**Non è una dipendenza nuova**: `@fontsource-variable/inter` è già in `package.json`. La regola 4
delle NON-NEGOTIABLE non è toccata. `package.json` **non si modifica** in questo passo.

### 2. `frontend/src/styles/tokens/_typography.scss` — via l'`@import` di Inter

Rimuovere l'`@import` di Inter da Google (`:81` prima del passo 6) e il suo commento di riga.
**Lasciare l'`@import` di IBM Plex Mono**: portarlo in locale richiederebbe
`@fontsource/ibm-plex-mono`, che è una dipendenza nuova, e quella richiede l'approvazione di Alfonso.

Riscrivere il blocco di commento `FONT LOADING`: il TODO sul self-hosting è soddisfatto per Inter e
va tolto, non lasciato a mentire; e va detto quale dei due font è locale e quale no.

---

## Verifiche, e quali sono già state fatte

**Già misurate sul clone**, non previste:

- `npm run typecheck`: 14, invariato.
- `npm run build`: exit 0.
- **Il font ora risolve.** Dopo la modifica `document.fonts` contiene `Inter Variable [loaded]`, e la
  larghezza della stessa stringa di prova passa da 770.94px a **877.39px**, distinta dal `serif`
  (770.94), dal `sans-serif` (844.92) e dal `monospace` (915.13). Prima cadeva sul fallback, ora no.
- **Nessuna richiesta a `fonts.googleapis.com` per Inter**: la CSS emessa contiene un solo `@import`,
  quello di IBM Plex Mono.
- **Il bundle**: otto file `.woff2` emessi, **356 KB** in totale, come asset separati e non dentro il
  JS. Il browser ne scarica solo i sottoinsiemi che gli servono, per `unicode-range`.
- **Il layout regge**: il rail renderizzato con Inter Variable non manda a capo niente e non tronca
  niente; l'identity block passa da 51px a 52px.

**Da fare a te, e non sostituibile:**

**Smoke visivo sul dev server.** Attenzione a come si legge: sul clone il «prima» era un fallback
serif, perché il container non raggiunge Google, quindi il mio delta visivo è molto più grande di
quello che vedrai tu. Sul tuo Mac il prima è Inter servito da Google e il dopo è Inter Variable
locale: stesso carattere, metriche quasi identiche, differenza attesa piccola ma **non nulla**,
perché una variable font non è la stessa cosa di un'istanza statica. Guarda in particolare i pesi
600 (nomi selezionati nel tree, eyebrow delle sezioni) e le label a 11px, dove una differenza di
metriche si vede prima che altrove.

**Controllo in DevTools**, che è la misura che chiude la voce del cruscotto: Network filtrato su
`fonts.g`, hard refresh. Atteso: **una sola** richiesta, quella di IBM Plex Mono. Poi Elements,
Computed, sezione «Rendered Fonts» su un testo qualsiasi dell'interfaccia. Atteso: `Inter Variable`,
non `Inter` e non un fallback di sistema.

---

## Hard stop

1. **Se `grep -rn "fontsource" frontend/src frontend/index.html` trova già qualcosa**, STOP:
   l'import esiste già e la premessa di questo passo è falsa. Controllo positivo obbligatorio su
   `bootstrap-icons`, che deve dare almeno `frontend/src/index.tsx:7`.
2. **Se `@fontsource-variable/inter` non è in `package.json`**, STOP: sarebbe una dipendenza nuova e
   serve l'approvazione, non è quello che questo passo autorizza.
3. **Se il rendered font in DevTools resta `Inter` o cade su un fallback di sistema**, STOP e
   riporta: l'import non ha preso, e il resto della voce non si chiude.
4. **Se `typecheck` supera 33**, STOP.

## Cosa questo passo NON fa

- **Non tocca i venti stack letterali** che ripetono `'Inter Variable', 'Inter', -apple-system, …`
  nei fogli di componente. Adesso il loro primo nome risolve, quindi sono corretti per costruzione;
  che duplichino `--font-sans` invece di consumarlo è un debito suo, e R-RAIL-5 C5.1 lo copre già.
- **Non porta IBM Plex Mono in locale**: dipendenza nuova, serve l'approvazione.
- **Non tocca `frontend/index.html`**, dove JetBrains Mono resta caricato per Monaco.

## Log

Entry in `docs/claude-code-log.md`, formato §21.2.
`Corregge`: `—`. `Causa`: `—`. `Regressions`: `no` solo se hai fatto lo smoke visivo, altrimenti
`unknown`. `Out-of-scope changes`: `no`. `Layer Impact Report`: `not-required`.
`Smoke visivo`: obbligatorio, questo passo cambia il carattere di tutta l'interfaccia.

Nelle note: il pacchetto era installato e mai importato dal giorno in cui è entrato in
`package.json`; il TODO sul self-hosting si chiude per Inter e resta aperto per IBM Plex Mono; le
misure di larghezza prima e dopo.

## Cruscotto

Chiude la voce **«"Inter Variable" non è il nome servito da Google»** (Backlog Fase 0 rail, DEBITO,
oggi «idea»). Il titolo resta vero: Google serve la famiglia `Inter`, non `Inter Variable`. Quello
che cambia è che ora quel nome ha chi lo serve, in locale.
