# Memo: #174, una sola forma di annidamento nel core

Data: 2026-10-07. Chat: `C-2026-10-07-0948`. Lane: `P-2026-10-07-0950`, branch `fix/174-nesting-forms`.
Commit di riferimento: `5bdb45e89` (referto di Fase 1). Referto: `docs/discovery/discovery_2026-10-07_174_nesting_forms.md`.
Decide: Juri, direttore della lane, in chat il 2026-10-07 (risposte alle quattro domande della chat sulla lista
di RC-26). Righe in `docs/decisions.md`: R-NEST-1..6.

## Decisioni

1. **Forma canonica (b).** `DModel.objects` elenca ogni istanza del modello, annidate comprese; «radice» è
   una proprietà di `father` (`LModel.roots` e `root` filtrano su `father` = DModel). Adottata come
   raccomandata dal referto, contro la raccomandazione (a) del referto R del 2026-10-02.
2. **Aggregazione come oggi.** Un riferimento di aggregazione resta «contenimento» nella scrittura
   (`composition || aggregation`) e ri-padra l'oggetto. **Diverge dal referto**, che raccomandava di non
   ri-padrare. Conseguenza: la cascata di cancellazione segue la stessa relazione.
3. **Perimetro della conformità: ogni istanza.** Emenda CRUD3 F2 (perimetro di visita = `model.objects`
   inteso come radici), adottata come raccomandata.
4. **GO su tutto il piano del §10**: radici come filtro, scritture (`addObject` e `t2m` elencano il figlio,
   l'espulsione non lascia orfani), cascata #171 (b), migrazione `2.229 -> 2.230`. Cancellazione e
   riscrittura di dati persistiti accettate; go-ahead RC-30 su `VersionFixer.tsx`.

## Razionale

- Il referto ha misurato ciò che R non aveva: l'import XMI scrive di proposito la forma `set`
  (`XMIService.ts:1074`, figli annidati in `objects` per la materializzazione dello Step 2bis), e il canvas
  legge `objects` come «ogni istanza da disegnare» (`useJjomSync.ts:743`). Con (a) il layer di sync, in
  critical zone, andrebbe riscritto per non perdere i nodi annidati dei progetti importati; con (b) resta
  intatto e la perdita degli archi uscenti di un figlio «Add» (W1) sparisce per via dei dati.
- Verifica RC-27, fatta dalla chat (agente diverso da quello che ha scritto il referto): il censimento del §5
  rifatto sul tree della lane, 117 righe non di test che leggono `objects`; nessun lettore «solo radici» senza
  filtro su `father` manca dal §5. Le righe in più sono commenti, `LProject.objects` (= `allSubObjects`,
  `joiner/classes.ts:3564`), la mappa padre|figlio di `U.tsx:791` (il padre di un annidato è un `DValue`) e
  `consumerJodieContext.ts:355`, che filtra l'export JSON, dove le radici sono già difese.
- Aggregazione: Juri tiene il comportamento di oggi. La regola che ne segue per la cascata: un elemento va con
  il contenitore se lo slot è una composizione (ogni `DObject` dei `values`, come `descendantsOf` oggi)
  oppure se il suo `father` è lo slot (aggregazione che ha ri-padrato, slot shapeless). Un elemento che uno
  slot di aggregazione elenca senza esserne figlio (`appendValue`, misura G2) è condiviso e resta.
- Conformità: «ogni istanza» è monotona, nulla di ciò che oggi è visitato smette di esserlo; il costo è il
  rumore nuovo nel pannello Problems dei modelli costruiti con «Add».

## Alternative scartate

- (a) solo radici in `objects`: quattro file di sync da riscrivere, due in §3.1, più l'import XMI.
- Aggregazione che non ri-padra: scartata da Juri; resta aperto il doppio significato della parola
  `containment` per i lettori di presentazione.
- Perimetro «solo radici» con filtro `isRoot`: i figli annidati importati o in forma `set`, oggi visitati,
  smetterebbero di esserlo.
- GO senza cascata, o passi 1-2 soli: scartati da Juri.

## Prossimo passo

GO della Fase 2 alla lane (`lane-run resume`). File confermati: `LModelElement.tsx`,
`ConformanceValidator.ts`, `Dummy.ts`, `deleteDraw.ts` e il suo test (al posto di `permissionGuard.ts`, che
con la decisione 2 non cambia), `VersionFixer.tsx` e il test della migrazione `2.230`. La sessione era partita
senza `--critical-zone-goahead`: la chat scrive `goahead.txt` nella cartella della lane, come lo scrive
`lane-run start`, così il resume porta il go-ahead. Dopo la misura E3 della Fase 2 la chat aggiorna R-JS-12
(`WOULD_ORPHAN` irraggiungibile su dati migrati).
