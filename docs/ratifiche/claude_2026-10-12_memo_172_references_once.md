# Memo: #172, un riferimento compare una volta sola nel dettaglio di un'istanza

Data: 2026-10-12. Chat: `C-2026-10-10-1540`. Lane: `P-2026-10-10-1545`, branch `feat/172-references-once`.
Commit di riferimento: `b9a9be322` (referto di Fase 1) e l'addendum A dello stesso referto. Referto:
`docs/discovery/discovery_2026-10-10_172_references_once.md`.
Decide: Juri, direttore della lane, in chat il 2026-10-12 (sei risposte in due giri di domande della chat sulla
lista di RC-26 e sulla regola 19). Righe in `docs/decisions.md`: R-REF-1..6.

## Decisioni

1. **Una volta sola, nella lista (R-REF-1).** Nel dettaglio di un'istanza, in Data Manager e Configurator, per
   l'elemento e per ogni figlio inline, un riferimento non di contenimento sta nella sua sezione della lista e
   non è più un campo della form. È la direzione concordata nella issue il 2026-10-07 fra @tmaog e Juri.
2. **Via libera a `IRForm.tsx` (R-REF-2).** La prop opzionale `hostReferences`, il diff del §11.3 del referto
   così com'è, compresa la metà `focusFirst`. Critical zone: Layer Impact Report su file prima del diff. A
   R-FRM-1 si aggiunge una frase: un host che rende lui una feature accanto alla form può chiedere alla form di
   non renderla.
3. **Menu di riga, non pulsante singolo (R-REF-3).** **Diverge dal referto**, che raccomandava la scheda che
   apre più un pulsante d'azione. Juri ha scelto il menu: un pulsante a destra della scheda lo apre, con Open,
   Change sui riferimenti singoli, Remove from the list sui multipli e sui singoli con limite inferiore 0. Il
   click sulla scheda continua ad aprire l'elemento; il click destro resta quello del browser (seconda domanda:
   «Solo il pulsante»).
4. **Tre cose perse, accettate (R-REF-5).** Il filtro Basic / Advanced sui riferimenti, il colore dell'opzione
   sul valore scelto, il ripiegamento del gruppo REFERENCES.
5. **I figli restano alla #166.** Nessun cambiamento ai campi CHILDREN né alla barra «Add».
6. **Gli otto file di codice del §11.1** confermati (regola 19).

Decise dalla chat sotto RC-25, provvisorie, nel digest di chiusura con diritto di veto (R-REF-6): un riferimento
nascosto dall'autore della vista tiene la sezione di oggi senza gesti nuovi; il comando si chiama «Link existing
<Type>»; la molteplicità va nel tooltip del chip `[n/m]` e non a stampa (contro la raccomandazione del referto);
due ticket alla chiusura per i due difetti misurati sul campo.

## Razionale

- Il referto ha misurato che il doppione si toglie senza un percorso di scrittura nuovo: la sezione chiama le
  tre funzioni di `formWrite` che chiama il campo, all'indice grezzo della riga (R-REF-4). Con il campo spariscono
  dal dettaglio due difetti misurati: lo slot 0..1 con due target (§3.5) e il doppio link del picker a chip (§3.6).
- Ogni strada per togliere i campi passa da `viewpoint/ir/` (H7 del referto, falsificata): la prop opzionale è
  la più stretta, e `IRForm` ha oggi due soli mount, entrambi in `InstanceDetail.tsx`.
- La lista ignorava già Basic / Advanced, `hidden`, `labels` e `order` (§3.3): con R-REF-1 prende `labels` e
  `order`, e lascia Basic / Advanced e il ripiegamento, che vivono come stato dentro `IRForm`.
- La issue separata chiesta a @tmaog su «menu contestuali o doppio pulsante» non è mai stata aperta (issue da
  173 a 183 lette il 2026-10-10): la scelta fra le due forme l'ha fatta Juri qui.

## Alternative scartate

- I campi chiave dentro il campo di selezione (`ReferenceWidget`, `ChipInputWidget`), la strada del testo della
  issue: scartata dalla direzione del 2026-10-07; i widget non si toccano.
- Una regola dell'host `manager` nella risoluzione dello spec, e `host === 'manager'` letto dentro `IRForm`:
  §5.2 del referto (le schede perderebbero i campi chiave; rimozione implicita per ogni mount futuro).
- Le sezioni rese dentro la cornice della form: modifica più larga del file in critical zone.
- Il pulsante d'azione singolo e i due pulsanti separati: Juri ha scelto il menu.
- Il click destro come secondo modo di aprire il menu: non voluto da Juri.
- Basic che nasconde le sezioni dei riferimenti opzionali: chiederebbe un'altra modifica a `IRForm.tsx` e
  toglierebbe in Basic l'apertura e il «New … & link» che oggi ci sono.

## Tempi (RC-28)

Primo giro di domande posto il 2026-10-10 alle 16:15, risposto il 2026-10-12; secondo giro posto e risposto il
2026-10-12 alle 10:40.

## Prossimo passo

GO della Fase 2 alla lane, in tre passi (regola pura, la sezione prende i gesti, i campi escono dalla form), poi
la checklist visiva per Juri su entrambi gli host.
