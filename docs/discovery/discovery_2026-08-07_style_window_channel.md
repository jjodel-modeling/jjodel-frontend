# Discovery — il canale Style e la finestra della 3.6

**Documento prompt**: 2026-08-07 16:49
**Fase**: 0 della micro-slice 3.6, read-only
**HEAD**: `acf0249ce` (dopo i due commit del passo 0)
**Esito**: nessuna regola di uscita anticipata scatta. Il canale del CONTESTO esiste a HEAD, ed è
**più ampio di come è descritto**: il css di default con `!important` annidato non viaggia solo con
le view generate dal tool, sta nel costruttore di **ogni** `DViewElement`, e una migrazione di
`VersionFixer` accende `cssIsGlobal` su **tutti i viewpoint**. Nessuna superficie di warning esiste
oggi per questo caso.

---

## Obiettivo

Mappare a HEAD il canale per cui il css di una view ridipinge i nodi IR del canvas v2, individuare
il choke point del rilevamento, misurare il corpus, e presentare le opzioni di superficie del
warning senza sceglierne una.

## File letti

- `/Users/alfonso/jjodel/frontend/src/view/viewElement/view.tsx`
- `/Users/alfonso/jjodel/frontend/src/joiner/classes.ts`
- `/Users/alfonso/jjodel/frontend/src/redux/VersionFixer.tsx`
- `/Users/alfonso/jjodel/frontend/src/pages/components/Dashboard.tsx`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editors/views/data/PaletteData.tsx`
- `/Users/alfonso/jjodel/frontend/src/utils/lastViewpoint.ts`
- `/Users/alfonso/jjodel/frontend/src/common/Defaults.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/problems/registry.ts`
- `/Users/alfonso/jjodel/frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx`
- `/Users/alfonso/jjodel/frontend/src/components/Toast/toastDispatch.ts`

---

## (a) Il canale, dal campo al pixel

Cinque passaggi, tutti verificati:

1. **Il testo dell'autore.** `DViewElement.css` (`view.tsx:269`), affiancato da `cssIsGlobal`
   (`view.tsx:270`, `:748-761`) e da `compiled_css` (`view.tsx:271`, `:775-871`).
2. **La compilazione.** `get_compiled_css` (`view.tsx:777`) monta le variabili di palette come
   custom properties e poi appende il css dell'autore **verbatim**, solo re-indentato:
   `view.tsx:864`, `s += '\n\t' + U.replaceAll(c.data.css, '\n', '\n\t')`. Nessun parsing, nessuna
   sanitizzazione. `allowLESS` è `false` (`:785`): quello che finisce nel foglio è CSS nativo, e la
   nidificazione è quella nativa del browser.
3. **Lo scoping, che è l'interruttore.** `view.tsx:865-866`:
   ```typescript
   const localViewSelector: string = (c.data.className === 'DViewPoint') ? '.GraphContainer' : '.'+c.data.id;
   s = (!c.data.cssIsGlobal ? localViewSelector : 'body') +' {\n' + s + '\n}';
   ```
   Con `cssIsGlobal === false` tutto finisce sotto `.<viewid>` (o `.GraphContainer` per un
   viewpoint). Con `cssIsGlobal === true` il wrapper diventa **`body`**, cioè nessuno scope.
4. **L'iniezione.** `Dashboard.tsx:595-615`: un `useSelector` scorre **tutto** `state.idlookup`,
   prende ogni `DViewElement` e `DViewPoint`, legge `lv.compiled_css` e concatena il risultato in un
   unico `<style id="views-css-injector-d">` montato alla radice della Dashboard. Un solo foglio,
   nessuna separazione per viewpoint.
5. **Il bersaglio.** I nodi IR rendono come `.ir-node-content` dentro `.mm-node`
   (`irStyle.ts:17-53`, tag dedicato `<style id="ir-views-css">`). Le parti condizionali di stile
   (form, fill, border) sono risolte per istanza e applicate **inline** da `IRNodeContent`
   (`irStyle.ts:6-9`).

**Perché `!important` vince.** Una dichiarazione `!important` in un foglio batte una dichiarazione
inline senza `!important`. Il fill e il border autorati di un nodo IR sono inline e senza
`!important`: una regola globale `!important` che li matcha li sovrascrive. È il meccanismo esatto
del ridipingere, e non richiede che la regola nomini l'IR: le basta matchare.

## (b) L'attivazione, e perché non coincide con l'esposizione

Il choke point dell'attivazione è unico e documentato: `utils/lastViewpoint.ts:46-57`,
`activateViewpoint(viewpointId)`, che scrive le due sedi con `SetFieldAction` diretta
(`project.activeViewpoint`, `:52`) e `SetRootFieldAction` (`state.viewpoint`, `:56`). Il commento
`:33-45` spiega perché non passa dal setter L-proxy. È il punto giusto in cui agganciare un
rilevamento.

**Ma l'esposizione non comincia lì**, e questo è il risultato che più conta per la 3.6. In
`get_compiled_css` c'è un solo gate legato all'attivazione, `view.tsx:778-782`:

```typescript
if (c.data.isExclusiveView && c.data.className === DViewPoint.cname && !Defaults.check(c.data.id)) {
    ...
    if (!(dproject && dproject.activeViewpoint === c.data.id)) return '';
}
```

Il gate copre **solo** i viewpoint esclusivi **non di default**. Ne restano fuori, con il css sempre
iniettato qualunque sia il viewpoint attivo:

- ogni **`DViewElement`** normale (la condizione richiede `className === DViewPoint.cname`);
- ogni **viewpoint di default** (`Defaults.check` vero, `Defaults.ts:101-103`);
- ogni **viewpoint overlay** (`isExclusiveView` falso).

Conseguenza operativa: scansionare «le view del viewpoint appena attivato» mancherebbe la
popolazione che oggi è davvero sempre accesa. L'insieme corretto è **tutte le view e i viewpoint del
progetto**, con il gate `:778-782` replicato per non allarmare su un css che in quel momento non è
iniettato.

## (c) Il corpus, misurato

**Il css di default non è dei template: è del costruttore.** `classes.ts:1125-1172`, dentro
`DViewElement(name, jsxString, ...)` (`:1085`), assegna un blocco fisso a `thiss.css`. Quindi **ogni**
`DViewElement` creato dal tool nasce con quel testo, `DViewPoint` compresi (ereditano il
costruttore). `defaultViewTemplate.ts` non c'entra: porta il `jsxString`, non il css.

Il blocco contiene **12 `!important`**, e sono tutti dentro **regole annidate**. I due casi
canonici, `classes.ts:1143-1160`:

```css
.left, .start {
  & input:placeholder-shown {
    width: 120px !important;
    font-style: italic !important;
    text-align: left;
    left: 0 !important;
  }
}
```

più il gemello `.right, .end`. Sotto `body { ... }` questa regola matcha **qualsiasi**
`input:placeholder-shown` dentro un qualsiasi `.left`/`.start` del documento, canvas v2 incluso.

**Il valore di `cssIsGlobal`.** Default del costruttore: **`false`** (`classes.ts:1175`). Nel
costruttore di `DViewPoint` la riga che lo accenderebbe è commentata (`classes.ts:1254`). Ma
`VersionFixer.tsx:428` lo accende in migrazione, su tutti i viewpoint del progetto:

```typescript
for (let c of (s.viewpoints).map(p=> this.d(p, s))) { c.cssIsGlobal = true; }
```

**Quindi la popolazione esposta oggi**: ogni progetto passato da quella migrazione ha i propri
viewpoint con `cssIsGlobal = true` e con il css di default a 12 `!important` annidati. Fra questi, i
viewpoint **di default** e gli **overlay** saltano il gate di `:778` e iniettano **sempre**. Il
«css dormiente» del CONTESTO non è un'ipotesi: è il default di fabbrica più una migrazione.

*Limite dichiarato*: non ho aperto progetti reali né contato le view di un progetto tipico. La
stima di popolazione è derivata dal codice (costruttore più migrazione), non da un censimento.

## (d) Il predicato, proposta

Minimo, testuale, senza parser:

```
cssIsGlobal === true
  AND  css contiene '!important'
  AND  il '!important' sta dentro una regola annidata
```

Il terzo congiunto è quello che costa. Approssimazione testuale proposta: cercare `!important` e
verificare che prima di esso, nel testo, ci sia un `{` non ancora chiuso oltre il primo livello
(conteggio di graffe, non parsing). Alternativa più povera e più robusta: rinunciare al terzo
congiunto e fermarsi a `cssIsGlobal === true AND css include '!important'`.

**Falsi positivi** del predicato a due congiunti: un `!important` di primo livello sotto `body`
è comunque globale e comunque capace di ridipingere, quindi non è propriamente un falso positivo:
è un caso vero che il terzo congiunto **escluderebbe**. Questo suggerisce che il terzo congiunto
sia una restrizione non necessaria.

**Falsi negativi** di entrambi: un css globale **senza** `!important` che vince per specificità o
per ordine (il foglio della Dashboard è iniettato una volta sola e concatenato, quindi l'ordine
relativo fra view non è controllato). Sono reali e il predicato non li vede.

**Sul corpus vero il predicato scatta sempre**, perché il css di default lo soddisfa per
costruzione. È il punto da decidere in chat: un warning che compare su ogni progetto è rumore, non
segnale. Due modi per renderlo informativo, entrambi da ratificare: (i) confrontare il css con il
default di fabbrica e tacere se è identico, segnalando solo i css **modificati** dall'autore;
(ii) far scattare il warning non sul testo ma sul **conflitto osservato**, cosa che però esce dal
vincolo «niente motore CSS».

## (e) Le superfici del warning, censite senza sceglierne una

| Superficie | `file:riga` | Costo di aggancio | Visibilità all'attivazione | Rumore |
|---|---|---|---|---|
| Registry dei problems | `editor-v2/problems/registry.ts:27-58` | medio: `NodeProblemKind` è un'unione chiusa (`'duplicate-name' \| 'conformance'`), va estesa; i problems sono **per nodo**, questo è per view | alta, ma solo a canvas aperto | basso, ha già dedup e TTL |
| Toast | `components/Toast/toastDispatch.ts:71`, `:116-118` | minimo: `toast.warning(msg, title)` | alta e immediata | alto se ripetuto a ogni attivazione |
| Striscia d'errore di pannello | `VertexAuthoringPanel.tsx:257` (`<ErrorText>` da `ui`, fuori dai corpi dei tab) | basso, ma richiede il pannello aperto | nulla all'attivazione | basso |
| Tab Source | `irTabs.tsx:168-181` (sede ratificata da R-2) | basso: è un `<pre>`, aggiungere un blocco sopra | nulla all'attivazione | nullo |
| Pill di validazione | `editor-v2/problems/ValidationPill.tsx` | medio | media | basso |

Nota trasversale: il registry e la pill sono **per nodo**, il conflitto è **per view**. Chi sceglie
una di quelle due deve decidere come proiettare una view su N nodi, o accettare un problem
sintetico non ancorato.

## (f) Il costo

La scansione proposta è **strettamente più economica di ciò che già accade**. `Dashboard.tsx:595-608`
itera l'intero `state.idlookup`, filtra view e viewpoint e legge `compiled_css` per ciascuno, e lo
fa dentro un `useSelector`, cioè **a ogni cambiamento di stato Redux**, non all'attivazione. Un
predicato testuale sullo stesso corpus, eseguito una volta per attivazione, è ordini di grandezza
meno frequente.

Il costo unitario è una `String.includes` più un conteggio di graffe su testi dell'ordine delle
centinaia di byte. Su 1550 view resta lavoro trascurabile una tantum. **Memoizzazione e debounce non
servono all'attivazione**; servirebbero solo se il rilevamento venisse agganciato al `useSelector`
esistente invece che ad `activateViewpoint`.

*Limite dichiarato*: nessuna misura a runtime. L'argomento è di confronto strutturale col codice già
in esecuzione, non un benchmark.

## (g) Collisioni

Grep globale su `.ts`/`.tsx` in `frontend/src`: `cssConflict` **0**, `globalCssWarning` **0**,
`styleWindow` **0**, `detectGlobalCss` **0**, `css-conflict` **0**, `global-css` **0**,
`GLOBAL_CSS` **0**. Nessun nome occupato.

`NodeProblemKind` (`registry.ts:28`) è un'unione chiusa: aggiungere una kind è un edit tipizzato, non
una collisione.

---

## Dipendenze e rischi

1. **Il gate di `:778-782` va replicato, non ignorato.** Un rilevamento che segnala il css di un
   viewpoint esclusivo non attivo allarmerebbe su un foglio che in quel momento non è iniettato.
2. **Il predicato scatta su tutto il parco per costruzione** (punto d). Senza un confronto col
   default di fabbrica, il warning è garantito su ogni progetto.
3. **Il conflitto è per view, le superfici migliori sono per nodo** (punto e).
4. **Il rimedio non esiste ancora.** Anche a warning mostrato, una view IR non ha superficie da cui
   toccare `css` o `cssIsGlobal`: il tab Style è solo sulla barra legacy. Un warning senza rimedio
   informa e basta; la 3.6 deve decidere se si ferma lì.
5. **`VersionFixer.tsx` è in critical zone** (§3.1). Se una decisione futura toccasse la migrazione
   `:428`, quella non è più corsia veloce.

## Domande aperte per Alfonso

1. **Il predicato scatta su tutti**: confrontiamo col css di fabbrica e segnaliamo solo i css
   modificati, oppure accettiamo un warning universale al primo giro?
2. **Il terzo congiunto** (annidamento) esclude un `!important` globale di primo livello, che è
   altrettanto dannoso. Lo teniamo comunque, per aderenza alla ratifica, o ci fermiamo a due
   congiunti?
3. **Insieme da scansionare**: confermi tutte le view e i viewpoint del progetto (col gate di
   `:778` replicato) invece delle sole view del viewpoint attivato?
4. **Superficie**: toast all'attivazione (immediato, rumoroso) o blocco nel tab Source (silenzioso,
   va cercato)? Sono i due estremi; il registry dei problems sta in mezzo ma richiede di proiettare
   una view su N nodi.
5. **Rimedio**: la 3.6 si ferma al warning, o deve anche restituire una superficie minima da cui
   spegnere `cssIsGlobal` su una view IR?
