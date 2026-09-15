# Memo di ratifica: palette entity, il presupposto dell'arco 2

**Data**: 2026-08-11
**Serve a**: sbloccare `seed-rail-arco2`, che dipende da questa decisione
**Chiede**: una ratifica, non un'implementazione
**Valori**: letti dal repo a HEAD `df8850653`, non da memoria di sessione

---

## 1. Le quattro sedi sono in realtà due, più due cose diverse

La voce di backlog diceva «quattro sedi che non concordano». Letti i valori reali, il quadro è
più semplice e più decidibile.

**Le sedi 1 e 3 coincidono già, esattamente.** I quattro token creati da C9.1 sono la copia
byte per byte dei `badgeBg`/`badgeText` di `entityMeta.ts`:

| kind | `entityMeta` badge | token `--color-entity-*` | coincidono |
|---|---|---|---|
| attribute | `#D1FAE5` / `#059669` | `#D1FAE5` / `#059669` | sì |
| reference | `#CFFAFE` / `#0891B2` | `#CFFAFE` / `#0891B2` | sì |
| operation | `#E0E7FF` / `#4F46E5` | `#E0E7FF` / `#4F46E5` | sì |
| enum | `#FEF3C7` / `#D97706` | `#FEF3C7` / `#D97706` | sì |

C9.1 non ha inventato una palette: ha tokenizzato fedelmente quella di `entityMeta`, che si
dichiara «single source of truth for entity type icons and colors». **Quindi la sorgente unica
esiste già e ha un nome.**

**La sede 4 non è una palette di badge.** I `$color-*` di `tree-view-sidebar.scss:33-41` sono
colori di *outline* a tinta piena (`$color-attribute: #639922`, `$color-reference: #D85A30`),
un linguaggio diverso dal badge, che è una coppia fondo pastello più testo scuro. Confrontarli
è un errore di categoria: possono divergere legittimamente.

**Resta una sola vera divergenza, la sede 2.** `_form-system.scss:1251-1259` porta nove
modificatori `.jj-type-badge--*` con esadecimali inline, ed è un'altra palette:

| kind | token / entityMeta | `.jj-type-badge--*` | |
|---|---|---|---|
| attribute | smeraldo `#D1FAE5` / `#059669` | ambra `#fef3c7` / `#92400e` | **invertiti** |
| enum | ambra `#FEF3C7` / `#D97706` | smeraldo `#d1fae5` / `#065f46` | **invertiti** |
| reference | ciano `#CFFAFE` / `#0891B2` | rosa `#fce7f3` / `#9d174d` | diversi |
| operation | indaco `#E0E7FF` / `#4F46E5` | viola `#ede9fe` / `#6d28d9` | diversi |
| class | rosso `#FEE2E2` / `#DC2626` | celeste `#e0f2fe` / `#0369a1` | diversi |
| package | blu `#DBEAFE` / `#2563EB` | ardesia `#f1f5f9` / `#475569` | diversi |

## 2. Due fatti che cambiano il costo della decisione

**I token C9.1 non hanno zero consumatori: ne hanno zero *quelle quattro coppie*.** Gli altri
token entity sono già vivi: `properties-with-tree-view.scss:1407-1413` consuma
`--color-entity-metamodel-*` e `--color-entity-model-*`, e `tree-view-sidebar.scss:1482-1483`
consuma `--color-entity-viewpoint-*`. **Il rail è già sul sistema a token.** Adottarli per
l'identity block non introduce un sistema nuovo: continua quello che c'è.

**I commenti di `entityMeta` sono stale, e vanno corretti a parte.** Ogni voce dichiara di
rispecchiare il `$color-*` omonimo del tree, e per almeno tre non è vero:

| kind | `entityMeta.color` (col commento) | `$color-*` reale nel tree |
|---|---|---|
| package | `#f59e0b` «$color-package — Amber» | `#888780` grigio |
| class | `#0ea5e9` «$color-class — Cyan» | `#378ADD` blu |
| attribute | `#10b981` «$color-attribute — Green» | `#639922` verde diverso |

È un difetto di documentazione nel codice, non di resa: nessuno consuma quel campo per
disegnare il tree. Va corretto, ma non è questa decisione.

## 3. Le tre strade

**A. Vince il token, e `_form-system` si allinea.** Sorgente unica vera, ma i badge del
pannello cambiano colore a video su sei kind, `class` passerebbe da celeste a rosso, e si tocca
un foglio importato globalmente da `styles/style.scss:2` e già dichiarato intoccabile, con un
consumatore vivo fuori da `Info` (`views/ViewData.tsx:221`). Raggio d'azione: l'app.

**B. Vince `_form-system`, e i token si riscrivono sui suoi valori.** Nessun file globale
toccato e nessun colore cambia a video, ma si contraddice `entityMeta`, che è la sorgente
dichiarata e che alimenta canvas e tree. Sposta l'incoerenza invece di risolverla.

**C. Nessuna unificazione ora: l'identity block consuma i token, `_form-system` resta dov'è.**
L'arco 2 costruisce una superficie **nuova**, che non deve somigliare al vecchio badge del
pannello: deve somigliare al **tree**, che le sta accanto nello stesso rail e che è già sul
sistema a token.

## 4. Raccomandazione: C

Tre ragioni, in ordine di peso.

1. **Non tocca niente di globale.** L'arco 2 consuma `var(--color-entity-<kind>-bg|fg)` e
   nessun altro file cambia. `_form-system.scss` resta intoccabile come dichiarato.
2. **La divergenza smette di essere visibile nello stesso schermo.** L'identity block dell'arco
   2 sostituisce il badge di `PropertiesHeader` (`Info.tsx:877-903`, reso a `:1284`): quando
   arriva, il rail smette di consumare `.jj-type-badge--*`. L'unico consumatore residuo di
   quella palette diventa `ViewData.tsx:221`, che sta altrove. Oggi le due palette
   convivrebbero a due centimetri di distanza; dopo l'arco 2, no.
3. **Non chiude nessuna porta.** Se un domani si vuole la A, il lavoro è la migrazione
   meccanica di `.jj-type-badge--*` ai token, con un solo consumatore residuo da guardare
   invece di due superfici da riconciliare. La C rende la A più economica, non più difficile.

Il prezzo, dichiarato: fino all'arrivo dell'arco 2 il badge del pannello e quello del tree
restano di colori diversi sugli stessi kind, e dopo l'arco 2 la divergenza sopravvive fra rail
e `ViewData`. È debito, resta a registro in `docs/TECH-DEBT.md`, e non peggiora rispetto a oggi.

## 5. Cosa ratifichi, se dici sì

- **R-RAIL-27**: la palette dei badge di entità ha sorgente unica in `common/entityMeta.ts`,
  esposta come token `--color-entity-<kind>-{bg,fg}`. Ogni superficie **nuova** consuma i token.
  `.jj-type-badge--*` di `_form-system.scss` è una palette legacy: non si tocca, non si estende,
  e i suoi consumatori si migrano solo con una voce di lavoro dedicata.
- **Conseguenza per l'arco 2**: l'identity block prende fondo e testo dai token; il chip di
  firma, se avrà un colore, lo prende dagli stessi. Nessun esadecimale in chiaro, coerente con
  R-RAIL-4.
- **Conseguenza per C9.1**: le quattro coppie smettono di essere token senza consumatori, il che
  chiude la seconda metà di R-RAIL-9 rimasta in sospeso.
- **Voce separata, non in questa ratifica**: correggere i commenti stale di `entityMeta.color`,
  e completare le coppie mancanti (`transformation`, `parameter`), che è già a backlog.

Se preferisci la A perché la palette C9.1 ti convince di più nel merito, la strada resta aperta,
ma va vista a video prima: sei kind cambiano colore e `class` diventa rosso.
