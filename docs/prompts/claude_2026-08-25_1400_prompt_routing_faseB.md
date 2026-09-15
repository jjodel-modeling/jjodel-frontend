# Prompt — routing archi, Fase B (implementazione)

> Branch: `alfonso-frontend-jjtl`. Segue `claude_2026-08-25_1256_prompt_routing_faseA.md`.

---

## GO ricevuto (Alfonso, 2026-08-25)

**Opzione (ii)** — estremi + nodi visibili. «F1b non e' un caso raro: un nodo nel
corridoio e' la topologia normale di un modello vero, e chiudere due rossi su tre
lasciando il piu' frequente non vale il giro.»

**Forma a valle approvata e vincolante**: router intatto, poi check del criterio sulla
polilinea; ri-instrada solo se violato. R0 byte-identico per costruzione.

**Politica del corridoio occupato**: il detour aggira il nodo bloccante dal lato con
piu' spazio libero (confronto delle distanze del rect ai bordi utili), clearance 8px
come da criterio F2. Se dopo il ri-instradamento il criterio e' ancora violato
(corridoio saturo, piu' nodi impilati), si tiene il path originale: degradare al
comportamento di oggi e' accettabile, un loop di tentativi o un path peggiore no. Al
massimo un solo giro di ri-instradamento per arco.

**I tre buchi dichiarati in Fase A, da chiudere qui**:
1. R0 con waypoint utente: misurarlo — arco selezionato, drag della maniglia di
   segmento, poi assert che il path rispetta il waypoint E che l'evitamento non lo
   sovrascrive (R-B10).
2. bundleSpread: aggiungere il caso di due archi paralleli fra gli stessi nodi con un
   terzo nodo nel corridoio; se lo spread reintroduce una violazione, il
   ri-instradamento deve avvenire sul path post-spread, oppure il caso va dichiarato
   limite noto con la misura.
3. Confronto a posizioni coincidenti: accettato — un `d` diverso su posizioni diverse
   non e' regressione; fissare le posizioni della griglia R0 nella sonda e riusarle.

Vincoli invariati dalla Fase A. Gate soliti. Gli assert F1a/F1b/F2 girati a verde, R0
e smoke verdi.

---

## Esito

Implementazione e verifica nel §6-9 di
`docs/discovery/discovery_2026-08-25_routing_faseA.md`. In sintesi: sonda 12/12,
test unitari 5/5, i tre rossi della Fase A verdi, i tre buchi chiusi.

Due scostamenti dal prompt, entrambi misurati e argomentati nel report:

- **Il confronto byte a byte di R0 fra corse diverse e' stato ritirato**: a parita' di
  posizioni finali, due corse scelgono lati d'ancoraggio diversi (dipendono dai gesti,
  non solo dalla geometria), quindi produrrebbe rossi falsi. La byte-identita' e'
  dimostrata dove e' deterministica: `avoidNodeRects` ritorna **lo stesso
  riferimento** quando non c'e' violazione, verificato nel test unitario.
- **Il caso degli archi paralleli vive sul canvas M2**, non M1: due referenze fra la
  stessa coppia di istanze danno un arco solo (chiave per coppia, §3.4). Sul
  metamodello i due archi ci sono, lo spread li distribuisce, e il criterio e' verde
  con un terzo nodo nel corridoio.
