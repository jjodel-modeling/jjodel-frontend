# Memo di ratifica: taglia delle forme geometriche = contenuto piu' supplemento

**Data**: 2026-08-14
**Branch**: `alfonso-frontend-jjtl`
**Commit**: `71ae754b6`, `5c3a95ddb`, `c9e0a423f`, `668006e5e` (discovery, probe, catalogo)
**Report**: `docs/discovery/discovery_2026-08-14_labelbox_content_inset.md` sez. 1-9,
`docs/discovery/discovery_2026-08-14_catalogo_area_utile.md`

---

## La decisione

Una forma geometrica (ellisse, cerchio, rombo, e in prospettiva tutto il catalogo) **non** nasce con una taglia di default fissa e **non** fa content-hug puro. Ha una dimensione ulteriore al contenuto: il box si ricava dal contenuto piu' il supplemento che il contorno richiede.

Scartate esplicitamente: la taglia di default fissa (cambierebbe i diagrammi esistenti in modo arbitrario) e il content-hug puro (misurato rotto: ellisse 116 x 16,3 px con testo da 114, contorno che alla banda della riga ne consente 55,6).

## Il contratto (corretto dopo l'analisi del catalogo)

Il descriptor risponde a una domanda sola, "dato un box, dove puo' stare il contenuto", e la taglia e' la sua inversa:

```ts
contentRect(w, h, p): Rect          // gia' previsto dal piano come labelBox; porta anche la POSIZIONE
boxForContent(cw, ch, p): Size      // inversa; default per bisezione, forma chiusa dove esiste
```

Il rettangolo utile deve poter essere **non centrato**. Verificato sulle tredici forme del catalogo: nove sono simmetriche sui due assi e la forma chiusa basta; cilindro, folder, nota e chevron no. Su cilindro e folder il rettangolo centrato **collassa a zero** dove la risposta vera e' la larghezza piena, perche' il centro geometrico cade dentro il coperchio o la linguetta. Non e' una stima imprecisa, e' una risposta priva di senso.

`insetFractionAt` resta, ma cambia stato: da premessa del sistema a ottimizzazione dichiarata per famiglia. Le forme che la espongono dichiarano di essere simmetriche sui due assi; le altre passano dalla via numerica. Il commento attuale del modulo (*"tutte e cinque le forme attuali sono simmetriche sui due assi"*) va riscritto come precondizione dichiarata, non come constatazione.

Nessun numero cambia sulle cinque forme in produzione: sono tutte nel gruppo simmetrico.

## La formula, per il gruppo simmetrico

```
B_h = max(H_min, k_forma · h)
B_w = max( ceil(w / (1 − 2·inset(t))), ceil(aspetto_min · B_h) )
      con t = 0.5 + h / (2·B_h)
```

`w`, `h` sono le dimensioni dell'**inchiostro** del contenuto (Range sui nodi di testo), non dello span. Parametri misurati: `H_min` = 48, `k` = √2 (ellisse, cerchio) e 2 (rombo), `aspetto_min` = 0,8. Su `rect` e `rounded` l'inset e' nullo e la formula degenera nell'identita'.

Arrotondamento per **eccesso**: con `round` il caso "label corta" perdeva 0,2 px e usciva dal contorno. Il pavimento d'aspetto evita che un'etichetta corta produca una lente verticale.

Verificata sull'app reale: 8 casi su 8 con l'inchiostro dentro il contorno.

## Il finding strutturale

`insetFractionAt` non e' "il rientro degli handle": e' il profilo di semilarghezza della forma. Tre consumatori: rientro degli handle (fatto), taglia da contenuto (questa decisione), ritaglio a banda (da fare). Gli handle sono stati il primo consumatore, non la ragione d'essere della funzione. Il catalogo mostra pero' che il profilo scalare e' il caso particolare, e il rettangolo posizionato il caso generale.

## Ordine dei difetti, misurato

1. **Content-hug su forma geometrica**: fattore due fra testo e contorno. Lo chiude questa decisione.
2. **Rombo con etichette lunghe**: sotto `align-items: center` la label e' auto-width, `text-overflow: ellipsis` non scatta mai, il testo esce dal rombo oltre i 22 caratteri su un nodo 170x80. Lo chiude una dichiarazione, `max-width: 100%`.
3. **Taglio al box invece che al contorno**: 0,8 px sull'ellisse 170x80, circa 28 px sul rombo. E' il solo che il `labelBox` della roadmap risolveva, ed e' il meno grave.

Il punto 3 della roadmap attaccava il terzo difetto per primo, con il primitivo sbagliato: il rettangolo inscritto statico, misurato, **tronca** etichette oggi leggibili.

## Vincolo di meccanismo

Il CSS da solo non basta: su un box shrink-to-fit le percentuali di padding valgono zero nel calcolo intrinseco, quindi il box non cresce attorno al contenuto. Serve una misura. Perche' non produca un ciclo, il wrapper del contenuto va a `width: max-content`. Nel repo non esiste oggi alcun `ResizeObserver` sul contenuto dei nodi: macchinario nuovo, ma locale a `IRNodeContent`.

## Novita' di superficie: i gate girano

Working tree portato in un container Linux (`git archive` + `npm ci`): typecheck, vitest, build e smoke eseguibili. Chiude il punto 6 della roadmap.

- `typecheck`: 14 errori. La baseline dichiarata e' 33, di cui 19 di casing che su filesystem case-sensitive non esistono. 33 − 19 = 14, coincidenti file per file con gli "scattered" documentati. Da annotare in CLAUDE.md §17.
- `vitest`: 1169 passed, 0 failed; 9 suite non collezionano per `window is not defined`, le note.
- `build`: exit 0. `smoke`: 7 pass, 3 fail, tutti A4 console per assenza del backend nel container.
- `shapeRegistry.test.ts`: 12 su 12, mai eseguiti prima da nessuna superficie.

## Artefatti

Cruscotto persistente `catalogo-forme-area-utile`: area utile per il contenuto sulle tredici forme, quattro bande, centrato contro migliore.

## Prossimo passo

Due commit: la dichiarazione `max-width` (difetto 2), poi la taglia da contenuto espressa sul contratto `contentRect` / `boxForContent` (difetto 1). Il ritaglio a banda (difetto 3) resta dopo.
