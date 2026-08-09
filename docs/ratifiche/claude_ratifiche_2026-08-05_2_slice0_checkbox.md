# Ratifiche 2 — Slice 0, checkbox native: decisioni ed esito

**Data**: 2026-08-05
**Stato**: **chiusa** con un solo commit (`3e99044d8`, un file, 62 cancellazioni, zero inserzioni).
**Base**: `docs/discovery/discovery_2026-08-05_checkbox_native_visibilita.md` (343 righe) e `docs/discovery/discovery_2026-08-05_censimento_primitive_ui.md`, entrambi nel repo.

## Il difetto, nella sua formulazione corretta

**Attenzione: la diagnosi con cui questa slice e' partita era sbagliata, ed e' stata corretta dalla verifica a video.** La Fase 1 aveva classificato otto controlli come **invisibili**. Erano invece **visibili e non cliccabili**: `style.scss:221`, una seconda regola globale sugli input nativi che il censimento non aveva isolato, ne governava la resa, mentre di `tokens/index.scss:106-112` mordeva soprattutto il `pointer-events: none`. Il difetto reale era che la casella si vedeva ma il click diretto non arrivava.

Ogni riferimento a "otto controlli invisibili" nei documenti precedenti va letto come "otto controlli non cliccabili direttamente".

**Come e' nato**: `b8b00eaec` (17 gennaio) introduce il nascondimento globale insieme al blocco `::before` che lo rendeva funzionante, una coppia coerente. `3979b5e1a` (17 marzo, «removed some styles too generic») commenta il blocco di ridisegno e lascia attiva la riga 106. La rimozione era voluta; il nascondimento e' rimasto indietro. Nessun commit successivo ha toccato il file: **141 giorni in piedi**, in un diff di quattro righe che nessuna review avrebbe fermato.

**Nessuno dipendeva dal nascondimento globale**: ogni pattern legittimo di input nascosto piu' sostituto (`.viewpoint-checkbox`, `.viewpoint-radio`, `.jodie-settings-toggle`, `.toggle` di `_form-system`) si nasconde con regole proprie. L'alternativa "restringere il selettore" non aveva oggetto.

## Decisioni

**S0-1 — I tre controlli in markup da toggle andrebbero verso `ui/Toggle`, non verso `ui/Checkbox`.** Vale la regola semantica: le proprieta' booleane che si applicano nell'istante in cui le cambi sono toggle. Decisione **non eseguita**, vedi S0-6.

**S0-2 — `NestedView.tsx:157` resta fuori e non si ripristina.** Il pattern e' corretto ma manca lo `<span>` e l'`onChange` e' un TODO vuoto. Rendere visibile un controllo inerte e' peggio che lasciarlo nascosto: e' la stessa situazione per cui il tab Template e' classificato bug ad alta priorita' e per cui il tab Events e' stato marcato inerte invece che riparato. Item di backlog con due sole uscite: implementare la selezione overlay, oppure rimuovere il controllo dal JSX.

**S0-3 — La rimozione precede la migrazione, e in mezzo si guarda.** E' la decisione che ha salvato la slice: senza il passo di verifica fra il commit 1 e i successivi, avremmo migrato otto call site sulla base di una diagnosi sbagliata.

**S0-4 — I diciannove override difensivi non si rimuovono ora.** Dopo il commit 1 sono ridondanti; toccarli allargherebbe la slice a diciannove file. Vanno elencati nel report di chiusura e chiusi nella slice sui controlli booleani. Vale anche per il ripristino di `info.scss:881`, agganciato a `.properties-panel` e quindi incapace di raggiungere `NodeEditor`, montato sotto `.properties-panel-container`: si lascia morire, non si allarga.

**S0-5 — Toggle acceso cyan, checkbox spuntata slate. Non e' un'incoerenza.** Il cyan sta dove il colore porta informazione: in un toggle il colore *e'* l'informazione, perche' senza si distinguono male le due posizioni della pillola; in una checkbox l'informazione e' la spunta, che si vede da sola, e il colore ne e' solo il supporto. Quindi `ui/Toggle` acceso resta cyan `#0ea5e9` (DS-2) e `ui/Checkbox` spuntata resta slate `#334155`. La ragione va scritta accanto a entrambe le primitive, al posto dei due commenti che oggi si contraddicono citando lo stesso "design system A".

**S0-6 — La slice si chiude al commit 1. I commit 2 e 3 non si eseguono.** Motivo: **premessa caduta**, non rinvio per mancanza di tempo. Il difetto che l'utente subiva e' chiuso; l'uniformazione a `ui/Checkbox` e `ui/Toggle` sarebbe design system applicato a otto call site scelti non perche' formino un insieme sensato, ma perche' erano quelli diagnosticati male. La slice sui controlli booleani dovra' comunque ripassare sugli stessi file, con criterio uniforme su tutti.

## Debito registrato alla chiusura

- **`style.scss:221` e' una seconda regola globale sugli input nativi.** Oggi lavora a favore, ed e' la ragione per cui la premessa dei commit 2 e 3 e' caduta. Ma e' la stessa classe di rischio appena rimossa da `tokens/index.scss:106`, con la miccia dall'altra parte: basta un commit che la giudichi troppo generica perche' l'incidente si ripeta. Va nella slice sui booleani, con nome e riga.
- **Diciannove override difensivi** ora ridondanti (S0-4).
- **Righe rimaste dedotte e non misurate** su Settings e Viewpoints: si misurano nella slice booleani, non prima.
- **Typecheck a 33 errori in baseline**: preesistente, non toccato da un cambio SCSS, ma e' una rete assente per le slice che verranno.

## Lezione di metodo: la resa non si deduce dal CSS

Una discovery da 343 righe, accurata su tutto il resto, ha sbagliato il verdetto perche' ha **dedotto la resa leggendo le regole** invece di guardarla. La deduzione falliva per un motivo strutturale: la cascata. Una regola diceva `opacity: 0` e portava a concludere "invisibile", ma un'altra piu' specifica ne governava davvero l'aspetto, e cio' che restava della prima era il `pointer-events`.

E' la stessa classe di errore del 4 agosto, quando si era dedotto "raggiungibile" da "registrato". La regola generale che ne discende: **cio' che l'utente vede si misura guardando, e ogni verdetto su una resa dedotto da un file di stile e' un'ipotesi, non un dato.** Nei prompt di discovery futuri, i verdetti sulla resa vanno marcati come da confermare a video, e il gate visivo va messo prima di qualunque migrazione che dipenda da essi.

Corollario sull'harness: in due turni consecutivi l'architetto aveva previsto prima che il lavoro si sarebbe ridotto, poi che l'aspetto sarebbe peggiorato. La verifica a video ha smentito entrambe. Il gate visivo fra un commit e l'altro non e' burocrazia di processo: e' l'unico punto della catena in cui entra un dato che nessuno dei due agenti puo' produrre.
