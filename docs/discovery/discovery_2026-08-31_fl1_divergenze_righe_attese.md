# FL1 — le tre divergenze fra le «righe attese» del prompt e le regole della specifica

Data: 2026-08-31. Prodotto in Fase 2 di `docs/prompts/PROMPT_FL1_widthmap_packing.md`
(implementazione di `frontend/src/jjform/layout.ts`), non da una discovery preventiva.

## Ipotesi che questo documento falsifica

«Le righe elencate sotto *Test attesi* nel prompt sono derivabili dalle regole di packing
della specifica ratificata.» **Falsa**, in tre punti distinti e indipendenti.

## Il reperto che le rende non arbitrabili

`form-autolayout-spec.md` si dichiara «Reference artifact: `Form Auto Layout.dc.html`
(authoritative where this text and the board disagree)». **Quel file non esiste nel repo.**
Positivo di controllo sulla stessa ricerca: `grep -rl "Form Auto Layout"` da root restituisce
5 hit (la specifica e i quattro `PROMPT_FL*.md`), quindi la ricerca ha segnale; nessuna di
esse e' un `.dc.html`. `ls docs/design/design_handoff_jjodel_form_views/` elenca
`form-autolayout-spec.md`, `Jjodel Form Views.dc.html`, `README.md`, `support.js` — la board
presente e' un'altra, e nei suoi 106838 byte non c'e' nessuna griglia a 12 colonne: le
occorrenze di `entryAction`/`timeout`/`isHistory` stanno in mockup di riga e di pannello.

Quando la board autoritativa manca, l'unica autorita' rimasta e' il testo ratificato. Il
modulo segue il testo.

## Le tre divergenze

Sequenza del fixture, come il prompt la enumera: `name` string, `kind` enum3, `isHistory`
bool, `timeout` int, `depth` int readOnly, `entryAction` @code, `tags` multi, `outgoing`
multi-ref. Righe attese dal prompt: `[name 6, kind 6]`, `[bool 3, int 3, int 3, buco 3]`,
`[@code 12]`, `[tags 6, outgoing 6]`.

**(1) `kind` a 6 richiede un enum con piu' di 3 literals.** Il registro della specifica dice
«boolean, enum ≤ 3 literals → 3». Con `kind` a span 3 il fill greedy mette `name`+`kind`+
`isHistory` sulla prima riga (6+3+3 = 12 esatti) e la riga attesa `[name 6, kind 6]` non si
forma. Misura collaterale: assumendo `kind` a span 6 (enum >3 → select), il greedy puro
riproduce **esattamente** le quattro righe attese, holes inclusi. La lettura piu' economica
e' quindi che il fixture della board avesse un enum a 4+ literals e che «enum3» nel prompt
sia il refuso, non l'algoritmo.

**(2) Il «buco 3» della seconda riga contraddice la regola 2.** «L'ultimo scalare di una riga
corta si estende a riempirla»: `depth` e' uno scalare ed e' l'ultimo di una riga da 9, quindi
si estende a 6 e il buco non esiste. Il prompt enuncia la regola e poi disegna la riga senza
applicarla. Il modulo applica la regola; il buco resta solo dove l'ultimo campo e' un
multivalore, che e' il caso che la regola 2 esclude esplicitamente.

**(3) `tags` e `outgoing` non possono condividere una riga.** Regola 3: «le sezioni vengono
dal metamodello (attrs, poi refs): il packing riparte a ogni sezione». `tags` e' un
attributo, `outgoing` una reference: stanno in due sezioni, e il confine di sezione e' una
interruzione. Entrambi chiudono una riga corta da 6 con un buco da 6, e i due buchi sono
informazione — dicono che il metamodello ha dichiarato un multivalore dove uno scalare
avrebbe chiuso la riga.

## Cosa e' stato scritto, di conseguenza

`layout.test.ts` asserisce le REGOLE (ogni riga del registro, enum 3 vs 4, `unknown`, lo
stretch, il non-stretch del multi, la permutazione della dichiarazione, il riavvio a ogni
sezione) e asserisce le righe del fixture **come le regole le producono**:

```
attributes: [name 6, kind 3, isHistory 3]        free 0
            [timeout 3, depth 3, entryAction 6]  free 0
            [tags 6]                             free 6   (multi: non si estende)
references: [outgoing 6]                         free 6   (multi: non si estende)
```

## Domande aperte

1. `Form Auto Layout.dc.html` va depositato nel repo, oppure la specifica va emendata a
   citare `Jjodel Form Views.dc.html`? Finche' resta com'e', la clausola di autorita' della
   specifica punta al vuoto.
2. Se la board conferma `[name 6, kind 6]` con un enum a 3 literals, allora la riga del
   registro «enum ≤ 3 → 3» e' sbagliata, non il packer: la correzione e' una riga della
   mappa, non un ramo dell'algoritmo (che la specifica dichiara chiuso).
3. Il buco della divergenza (2) e' un errore di disegno o una regola non scritta (per esempio
   «un campo `readOnly` non si estende»)? Nel dubbio il modulo non ha inventato la regola.
