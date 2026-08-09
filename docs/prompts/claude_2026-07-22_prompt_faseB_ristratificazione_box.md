# Fase B: ri-stratificazione del box painting IR (Fase 2, implementazione)

Leggi CLAUDE.md prima di iniziare. Leggi docs/claude-code-log.md per il contesto recente. Base di questo task: il tuo report `docs/discovery/discovery_2026-07-22_ir_box_layering.md`, ratificato in chat.

## Decisioni ratificate (non rimetterle in discussione)

- **Path A**: tutto il painting authored (border, fill) va inline su `.ir-node-content` in IRNodeContent. Il radius resta via classi `ir-shape--*` su `.ir-node-content`.
- **Selezione**: outline su `.ir-node-content` (il border inline authored vince su qualsiasi border-color CSS, quindi il ring via border è escluso).
- **Ombra**: preservata, spostata su `.ir-node-content`.
- **rect**: border-radius 4px, come la base dei nodi nativi.
- **staticCssFor**: smette di emettere border e background; l'infrastruttura `ensureViewCss` resta in piedi.

## COSA

### 1. IRNodeContent.tsx

- Rendi vivo `compiled.border` (prodotto in `irCompile.ts:262` e `:336`, oggi mai consumato): accanto al fill inline (`:98-99`), aggiungi il border con fallback per campo:

```ts
const b = compiled.border;
if (b) inlineStyle.border = `${b.width ?? 1}px ${b.style ?? 'solid'} ${b.color ?? 'var(--border-default)'}`;
```

  Se `compiled.border` è null, nessun border inline: vale il fallback CSS del punto 2 (copre le viste demo/migrate senza border, rischio R2).
- NON aggiungere radius inline. L'emissione del form come className (`:105`) non si tocca.

### 2. irStyle.ts, BASE_CSS

- **Rimuovi** le regole `:has()` sul border-radius del fix precedente (`:35-37`). Sono sostituite da questa stratificazione. Mantieni la regola `justify-content: center` per ellipse.
- **Bridge di neutralizzazione** (l'unico `:has()` che resta):

```css
.mm-node:has(> .ir-node-content) { background: transparent; border-color: transparent; box-shadow: none; }
.mm-node.selected:has(> .ir-node-content),
.mm-node.drop-target:has(> .ir-node-content) { border-color: transparent; box-shadow: none; }
```

  Usa `border-color: transparent`, NON `border: none`: preserva la geometria del bordo 1px ed evita layout shift. Le due regole esplicite su `.selected`/`.drop-target` servono a evitare il pareggio di specificità (0,2,0) con `EditorV2.scss:1222-1230`, che altrimenti si risolverebbe solo per ordine di iniezione.
- **Box su `.ir-node-content`**, replica dei valori base di `EditorV2.scss:1208-1219` con gli stessi token (leggili dal file, non inventare valori):

```css
.ir-node-content { background: var(--node-bg); border: 1px solid var(--border-default); border-radius: 4px; box-shadow: /* copia esatta della base */; overflow: hidden; }
.ir-node-content.ir-shape--rounded { border-radius: 10px; }
.ir-node-content.ir-shape--ellipse { border-radius: 50%; }
```

  Verifica che `.ir-node-content` abbia `box-sizing: border-box` (ereditato o esplicito): con width/height 100% e un border proprio, senza border-box il box sborda di 2px.
- **Stati su `.ir-node-content`**, con gli stessi token accent di `EditorV2.scss:1222-1230`:

```css
.mm-node.selected > .ir-node-content { outline: 2px solid var(--color-accent); outline-offset: 1px; }
.mm-node.drop-target > .ir-node-content { outline: 2px solid var(--color-accent); }
```

### 3. staticCssFor (irStyle.ts:62-73)

Rimuovi l'emissione di border e background. Se per una view non resta nulla da emettere, non emettere nulla. Lascia `ensureViewCss` e `viewCssNodes` in piedi con un commento di una riga (riservati a future parti statiche per-view). Niente smantellamento.

### 4. Build

`npm run build` verde.

## Cosa NON toccare

- `IRNodeContent:105` (className del form) e tutto il path reattivo (set_ir, computeIRSignature, refToken).
- `irCompile.ts`: nessuna modifica attesa (`compiled.border` è già popolato). Se scopri che serve una normalizzazione, fermati e segnala prima.
- `EditorV2.scss`: i nodi nativi non si toccano. La neutralizzazione vive solo nel BASE_CSS iniettato, condizionata a `:has(> .ir-node-content)` (i nativi non hanno quel figlio, §3 del report).
- Nessun padding preventivo per l'ellipse: si valuta in verifica visiva (R4).

## HARD STOP e commit

Dopo la build, FERMATI. Verifica visiva di Alfonso (localhost:3001, hard refresh):

- rect (4px), rounded (10px), ellipse live su tutte le istanze; ellipse senza rettangolo che sborda;
- border stile/colore/spessore ora reattivi dal pannello;
- fill ancora reattivo; ombra presente; selezione con outline che segue la sagoma;
- nodi NON-IR invariati (controllare un viewpoint nativo);
- nessuno shift di layout; handle non clippati; label leggibile dentro l'ellipse.

Al suo OK esplicito nella sessione:

- commit unico dell'intera Fase B, `git add` dei soli file coinvolti (mai `git add .`), messaggio: `feat: vertex authoring panel with live IR preview (phase B)`;
- aggiorna `docs/claude-code-log.md` (entry standard; nome documento prompt: 2026-07-22 con ora).

## DOVE

- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx`
- `frontend/src/components/editor-v2/viewpoint/ir/irStyle.ts`
- Nessun altro file. Se ritieni necessario toccarne altri, chiedi prima.

## RIFERIMENTI

- `docs/discovery/discovery_2026-07-22_ir_box_layering.md`. Gestione rischi: R1 chiuso con outline, R2 con fallback per campo, R3 decade con path A, R4 rimandato alla verifica visiva, R5 accettato (test bed non-ER), annotalo nel log.
- `EditorV2.scss:1208-1230`: valori base e stati da replicare con gli stessi token.
