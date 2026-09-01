# PROMPT — STYLE2: tema form a livello viewpoint (rung vero, SERIALE dopo FL8)

Decisione presa (01-09, referto STYLE1 §5): via **2** — un campo D nuovo a livello viewpoint più un secondo argomento letto dalla risoluzione del tema. La 1 è esclusa (R-B9: l'IR salvato non ha VersionFixer, ogni letterale è definitivo; e aprirebbe doppia dichiarazione `theme` skin + `formTheme`), la 3 non raggiunge Dense.

## Cosa fare

- **Campo D** sul viewpoint (naming coerente col grafo D esistente; se il punto giusto è il DViewPoint dichiara perché, con VersionFixer per i salvataggi esistenti → default assente).
- **Risoluzione**: `resolveFormTheme` guadagna la sorgente viewpoint; precedenza dichiarata e testata: `ir.form.theme` (view) vince sul viewpoint, viewpoint vince sul default. Assente ovunque = comportamento di oggi (assert byte-per-byte come la non-regressione STYLE1).
- **UI**: select «Form theme» nel tab **Style** del viewpoint (ramo legacy di `ViewData.tsx:105` — i viewpoint lo prendono già; reperto 2 di STYLE1). I 4 preset di `themes.ts`, incluso Dense — che con questo rung diventa raggiungibile per la prima volta da una scrittura dell'app.
- Il select legacy «Theme» del tab Form (skin) resta com'è: skin e preset sono strutture diverse, non riconciliarle qui.

## Test attesi

- Precedenza a tre livelli (view > viewpoint > default), ciascun gradino con test.
- Dense selezionato dal viewpoint → la form rende la firma Dense misurata da STYLE1 (6px/11.5px/0 eyebrow).
- Salvataggio pre-esistente senza campo → identico al before (VersionFixer o default-assente, dichiara quale).
- Riuso della sonda STYLE1: 4 preset per via reale ora (niente più via contratto per Dense).

## Fuori scope

Nuovi temi, il rung metamodello (non richiesto da nessuna misura — non costruirlo «già che ci sei»), skin legacy, il manager.

## Coordinamento

SERIALE dopo FL8 (il picker non si espone con Compact/Dense illeggibili nel rail). Perimetro: grafo D (campo nuovo), `formAutoLayout.ts`/risoluzione, tab Style del viewpoint. Il campo D è core → §5 CLAUDE.md. Pathspec, entry di log in commit separato.
