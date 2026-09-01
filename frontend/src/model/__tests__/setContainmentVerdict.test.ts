import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * ENG1/A — `LReference.set_containment` dice la verita' sul rifiuto
 * (`model/logicWrapper/LModelElement.tsx`).
 *
 * Il difetto, misurato in `docs/discovery/discovery_2026-08-31_10g_outline_doppi.md` §3:
 * il ramo dell'auto-composizione (`father === type`) logga il warning, NON scrive, e
 * restituiva `true`. La vittima nota e' `substates` (State -> State), che resta
 * `composition: false` mentre l'assegnazione riporta successo. La decisione di merito non
 * cambia: il rifiuto resta. Cambia solo la verita' del ritorno.
 *
 * Perche' statiche e non di comportamento: `LModelElement.tsx` non e' importabile sotto
 * vitest. Riverificato in questa sessione con una sonda usa-e-getta: l'import solleva
 * `ReferenceError: window is not defined` da
 * `monaco-editor/esm/vs/base/browser/window.js:14`, tirata dentro dalla catena della barrel
 * `joiner`, e l'ambiente di `vitest.config.ts` e' `node`. Stessa ragione e stessa forma di
 * `getTypeFallback.test.ts` e `getByNameKey.test.ts`.
 *
 * La prova di comportamento e' la sonda `scripts/smoke/_tmp_eng1_measure.ts`, che misura
 * sull'app vera il rifiuto su `substates` e il controllo positivo su `states`.
 *
 * I casi sul trap di `proxy.ts` non sono decorativi: sono il CENSIMENTO DEI CONSUMER che
 * rende sicuro il cambio di ritorno. Se un giorno il trap smette di scartare il verdetto,
 * questi test vanno rossi e il censimento va rifatto prima di fidarsi ancora.
 */

const LME_TSX = path.resolve(__dirname, '../logicWrapper/LModelElement.tsx');
const PROXY_TS = path.resolve(__dirname, '../../joiner/proxy.ts');

const source = fs.readFileSync(LME_TSX, 'utf8');
const proxySource = fs.readFileSync(PROXY_TS, 'utf8');

/** Il corpo del solo `set_containment`, dalla firma al metodo che la segue. */
function setContainmentBody(): string {
    const start = source.indexOf('    set_containment(val: this["containment"], c: Context');
    expect(start, 'la firma di set_containment e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = source.indexOf('\n    protected get_aggregation(', start);
    expect(next, 'il metodo che segue set_containment e\' cambiato: aggiorna il test').toBeGreaterThan(start);
    return source.slice(start, next);
}

/** Il solo ramo di rifiuto dell'auto-composizione, dalla sua guardia alla chiusura. */
function refusalBranch(): string {
    const body = setContainmentBody();
    const start = body.indexOf("if (val && mainkey === 'composition' && c.data.father === c.data.type) {");
    expect(start, 'la guardia dell\'auto-composizione e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const end = body.indexOf('\n        }', start);
    expect(end).toBeGreaterThan(start);
    return body.slice(start, end);
}

describe('set_containment — il rifiuto dell\'auto-composizione restituisce falsy', () => {
    it('il ramo di rifiuto restituisce false, non piu\' true', () => {
        const branch = refusalBranch();
        expect(branch).toMatch(/return false;/);
        expect(branch).not.toMatch(/return true;/);
    });

    it('il warning resta: il rifiuto continua a essere spiegato', () => {
        // Il criterio di accettazione ha due meta': ritorno falsy E warning presente.
        // Un ritorno corretto su un rifiuto muto sarebbe meta' correzione.
        const branch = refusalBranch();
        expect(branch).toMatch(/Log\.ww\(/);
        expect(branch).toMatch(/is generating a composition loop/);
        expect(branch).toMatch(/Consider switching to aggregation/);
    });

    it('la guardia e\' invariata: si rifiuta la stessa cosa di prima', () => {
        // La decisione di merito non e' di questa correzione. Se la condizione cambia,
        // e' un'altra modifica e va discussa: qui va rossa.
        expect(refusalBranch()).toMatch(
            /if \(val && mainkey === 'composition' && c\.data\.father === c\.data\.type\) \{/);
    });

    it('il rifiuto vale solo per composition, non per aggregation', () => {
        // `set_aggregation` passa mainkey='aggregation' e non entra nel ramo: una
        // self-aggregation resta lecita. Il contrasto e' la meta' che dice che il
        // `return false` non e' diventato un rifiuto generale.
        const body = setContainmentBody();
        expect(body).toMatch(/mainkey === 'composition'/);
        expect(source).toMatch(
            /protected set_aggregation\(val: this\["aggregation"\], c: Context\): boolean \{ return this\.set_containment\(val, c, 'aggregation', 'composition'\); \}/);
    });
});

describe('set_containment — le due vie di successo restano truthy', () => {
    it('il no-op (valore gia\' quello richiesto) restituisce true', () => {
        // Un no-op non e' un rifiuto: chiedere cio' che c'e' gia' e' riuscito.
        expect(setContainmentBody()).toMatch(/if \(!!c\.data\[mainkey\] === val\) return true;/);
    });

    it('la scrittura avvenuta restituisce true dopo la TRANSACTION', () => {
        const body = setContainmentBody();
        const tx = body.lastIndexOf('        }, c.data[mainkey], val);');
        expect(tx, 'la chiusura della TRANSACTION e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
        expect(body.slice(tx)).toMatch(/return true;/);
    });

    it('in tutto il metodo restano esattamente tre uscite: due true e un false', () => {
        // Il conteggio e' il controllo che la correzione non abbia aggiunto ne' spostato
        // uscite: una sola e' falsy, ed e' quella del rifiuto.
        const body = setContainmentBody();
        const trues = body.match(/return true;/g) ?? [];
        const falses = body.match(/return false;/g) ?? [];
        expect(trues.length).toBe(2);
        expect(falses.length).toBe(1);
    });
});

describe('censimento dei consumer — chi legge questo verdetto', () => {
    it('nessuno lo legge: le sole chiamate dirette sono i tre wrapper che lo rilanciano', () => {
        // `command grep -rn "set_(containment|composition|aggregation|isContainment)" src`
        // in questa sessione: sei righe, tutte in LModelElement.tsx, e nessuna e' una
        // lettura del ritorno in un `if`, un `&&` o un'assegnazione.
        const calls = [...source.matchAll(/this\.set_containment\(/g)];
        expect(calls.length).toBe(3);
        for (const wrapper of [
            /protected set_isContainment\(v: boolean, c: Context\): boolean \{ return this\.set_containment\(v, c\); \}/,
            /protected set_aggregation\(val: this\["aggregation"\], c: Context\): boolean \{ return this\.set_containment\(val, c, 'aggregation', 'composition'\); \}/,
            /protected set_composition\(val: this\["composition"\], c: Context\): boolean \{ return this\.set_containment\(val, c, 'composition', 'aggregation'\); \}/,
        ]) expect(source).toMatch(wrapper);
    });

    it('controllo positivo: il censimento sa trovare una lettura di ritorno quando c\'e\'', () => {
        // Se questa asserzione fallisce, e' la ricerca a non avere segnale, non il soggetto.
        // `setValueAtPosition` il suo verdetto lo fa leggere davvero, ed e' nello stesso file.
        expect(source).toMatch(/modified = out\.success \|\| modified;/);
    });

    it('il trap del proxy scarta il verdetto del setter e restituisce true a mano', () => {
        // E' questa la riga che rende sicuro il cambio: `lRef.composition = true` non puo'
        // osservare il false, e un trap `set` che restituisse false farebbe lanciare
        // l'assegnazione in strict mode. Il verdetto non arriva mai fin li'.
        const start = proxySource.indexOf('    public set(targetObj: ME, propKey: string | symbol, value: any');
        expect(start, 'la firma del trap set e\' cambiata: rifai il censimento').toBeGreaterThan(-1);
        const end = proxySource.indexOf('\n    /*      problema:', start);
        expect(end).toBeGreaterThan(start);
        const trap = proxySource.slice(start, end);
        expect(trap).toMatch(/this\.lg\[this\.s \+ propKey\]\(value, logicContext\);\n\s*\} catch/);
        // la chiamata NON e' in un return: il valore viene buttato e il trap ne rende uno suo
        expect(trap).not.toMatch(/return this\.lg\[this\.s \+ propKey\]\(/);
    });

    it('le assegnazioni di composition nel codice vivo passano tutte dal trap', () => {
        // Cinque siti misurati fuori dal core: nessuno chiama il metodo, tutti assegnano
        // sulla proxy. Il file e' citato perche' se un domani qualcuno legge il ritorno,
        // lo fara' da qui e questo test non basta piu'.
        const canvasToJjom = fs.readFileSync(
            path.resolve(__dirname, '../../components/editor-v2/sync/canvasToJjom.ts'), 'utf8');
        expect(canvasToJjom).toMatch(/lRef\.composition = true;/);
        expect(canvasToJjom).not.toMatch(/= lRef\.composition = /);
        expect(canvasToJjom).not.toMatch(/if \(lRef\.composition = /);
    });
});
