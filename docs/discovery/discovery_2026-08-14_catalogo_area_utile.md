# Discovery: area utile per il contenuto sul catalogo forme previsto

**Data**: 2026-08-14
**Autore**: chat di progetto (analisi geometrica, non lettura di codice)
**Branch**: `alfonso-frontend-jjtl`
**Origine**: la politica di taglia ratificata poche ore prima (`discovery_2026-08-14_labelbox_content_inset.md` sez. 9) e' costruita su `insetFractionAt(t)`, che nel proprio commento dichiara: *"Il lato non e' un parametro: tutte e cinque le forme attuali sono simmetriche sui due assi"*. Questa discovery verifica se la premessa regge il catalogo previsto (`claude/2026-08-14_piano_sistema_forme.md`, Fase 5).

**Esito in una riga**: regge su nove forme su tredici e cade sulle altre quattro, su due delle quali in modo non graduale.

---

## 1. Metodo

Le tredici forme sono state campionate come poligoni in un box unitario centrato, senza alcuna assunzione di convessita' o di simmetria. Per ogni forma e per quattro **bande** (la semialtezza del contenuto come frazione della semialtezza della forma: 0,2 e' una riga in un nodo alto, 0,8 un nodo pieno di compartimenti) si calcola per bisezione la semilarghezza massima del rettangolo inscritto, in due varianti: **centrato** sul centro della forma, e **migliore** lasciando scorrere il centro verticalmente.

Il test di appartenenza e' ray casting sui quattro angoli piu' otto punti lungo i lati orizzontali, quindi vale anche sui contorni non convessi. Il cilindro porta il proprio arco superiore come regione interna vietata.

I parametri delle forme (raggio del rounded, taglio dell'ottagono, shear del parallelogramma, altezza della linguetta del folder) sono illustrativi: cambiano i numeri, non il verdetto di simmetria.

---

## 2. Risultato

| forma | 0,2 | 0,4 | 0,6 | 0,8 | verdetto |
|-------|-----|-----|-----|-----|----------|
| rect | 1,00 | 1,00 | 1,00 | 1,00 | simmetrica |
| rounded | 1,00 | 1,00 | 1,00 | 1,00 | simmetrica |
| stadio | 0,99 | 0,96 | 0,90 | 0,80 | simmetrica |
| ellisse | 0,98 | 0,92 | 0,80 | 0,60 | simmetrica |
| cerchio | 0,98 | 0,92 | 0,80 | 0,60 | simmetrica |
| rombo | 0,80 | 0,60 | 0,40 | 0,20 | simmetrica |
| esagono | 0,92 | 0,84 | 0,76 | 0,68 | simmetrica |
| ottagono | 1,00 | 1,00 | 0,90 | 0,70 | simmetrica |
| parallelogramma | 0,82 | 0,79 | 0,76 | 0,73 | simmetrica |
| **cilindro** | 1,00 | 1,00 | **0,00** (migliore 1,00 a +0,10) | 0,98 | **collassa** |
| **folder** | 1,00 | 1,00 | 1,00 | **0,00** (migliore 1,00 a +0,02) | **collassa** |
| **nota** | 1,00 | 1,00 | 1,00 | 0,80 (migliore 0,99 a +0,19) | asimmetrica |
| **chevron** | 0,72 (migliore 0,74 a −0,45) | 0,79 | 0,76 | 0,68 | asimmetrica |

Il parallelogramma **non** rompe la simmetria, e vale la pena dire perche': lo shear trasla l'intervallo utile a ogni quota, ma la semilarghezza *centrata* resta funzione pari della distanza dal centro. Se il contenuto e' centrato, e lo e', il profilo scalare basta.

Le quattro che cadono sono esattamente la famiglia `pathTemplate` del piano (cilindro, folder, nota) piu' il chevron, cioe' la forma che l'invariante I5 gia' segnala come non convessa.

---

## 3. Perche' due casi sono qualitativamente diversi

Su nota e chevron il rettangolo centrato esiste ed e' solo piu' piccolo del necessario: si perde il 24% sulla nota e il 3% sul chevron. E' uno spreco.

Su cilindro e folder il rettangolo centrato **collassa a zero** dove la risposta vera e' la larghezza piena. Il centro geometrico della forma cade dentro una regione vietata (il coperchio del cilindro, la linguetta del folder), quindi non e' un errore di stima: e' una risposta priva di senso. Un motore che ci si appoggiasse non produrrebbe un nodo stretto, non produrrebbe un nodo.

---

## 4. Conseguenza sul contratto

La taglia da contenuto non puo' essere espressa come inversione di uno **scalare simmetrico**. Il descriptor deve rispondere con un **rettangolo che porta anche la propria posizione**:

```ts
contentRect(w, h, p): Rect          // gia' previsto dal piano come labelBox
boxForContent(cw, ch, p): Size      // l'inversa, per la taglia da contenuto
```

`boxForContent` ha un'implementazione di default che inverte `contentRect` per bisezione (la relazione e' monotona in entrambe le dimensioni), e una forma chiusa come override per le nove forme simmetriche.

`insetFractionAt` **resta**, ma cambia stato: da premessa del sistema a ottimizzazione dichiarata per famiglia. Le forme che la espongono dichiarano di essere simmetriche sui due assi; le altre non la espongono e passano dalla via numerica.

Nessun numero cambia sulle cinque forme oggi in produzione, perche' sono tutte nel gruppo simmetrico. Cambia l'interfaccia, e cambia adesso invece che in Fase 5.

---

## 5. Rischi e note

- I valori qui sono geometrici, non misurati sul DOM. La verifica sull'app reale della politica di taglia (otto casi su otto) e' nell'altra discovery, sezione 9, e riguarda le due sole forme non rettangolari oggi esistenti.
- Il chevron perde solo il 3%, ma e' non convesso: il rettangolo utile non e' il suo unico problema, e I5 chiede comunque una `anchorPolicy` esplicita.
- Cilindro, folder e nota hanno un contenuto che vuole stare **sotto** un ornamento (coperchio, linguetta, angolo piegato). Nel modello a quattro livelli questo e' un `Composite` con una `Region`, non un caso speciale della taglia. La discovery non anticipa quella scelta: si limita a mostrare che il contratto scalare non la puo' rappresentare.

---

## 6. Riproducibilita'

`docs/discovery/harness/catalogo_area_utile_2026-08-14.mjs` (contorni e calcolo) e
`catalogo_area_utile_render_2026-08-14.mjs` (pagina HTML). Nessuna dipendenza oltre a node.
