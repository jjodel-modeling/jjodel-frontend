/**
 * 10b — le due clausole del prompt che nessun test committato copriva.
 *
 * L'outline di containment e' gia' a terra (commit `8c0caef49`, entry di log del
 * 2026-08-30) e sopravvive al riassetto di FL6. Delle quattro prove che il prompt
 * chiede, due erano gia' coperte dai moduli puri — l'albero coi quattro livelli
 * (`editor-v2/hooks/__tests__/outlineDraw.test.ts`) e il menu del «+» con lo slot
 * pieno e le sole rootable sulla radice (`jjform/__tests__/outline.test.ts`) — e
 * due erano state misurate soltanto dalla sonda `_tmp_10b_verify.ts`, che non e'
 * committata e quindi non e' una prova che regge nel tempo. Questo file le rende
 * permanenti:
 *
 *   3. selezione outline ↔ tabella ↔ form coerente SU ID;
 *   4. il New del catalogo e il «+» dell'outline emettono lo STESSO evento
 *      (asserito sull'evento, non sulla UI).
 *
 * ── Perche' meta' file e' asserito sul sorgente ───────────────────────────────
 *
 * Stessa ragione dichiarata in `instanceManagerFl6.test.ts`: `vitest.config.ts`
 * dichiara `environment: 'node'`, non ci sono jsdom ne' testing-library, e
 * `InstanceManagerTab` importa il barrel di `editor-v2/`, che arriva a monaco,
 * che dereferenzia `window` all'import — il file morirebbe prima del primo `it`.
 * Cio' che si puo' eseguire davvero si esegue: la clausola 4 e' provata sul
 * MOTORE (`newDraft`), dove l'affermazione «nulla si dirama sulla provenienza»
 * si puo' misurare invece che leggere.
 *
 * Il controllo POSITIVO e' in ogni blocco che afferma un'assenza.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ClassShape, MetamodelShape, RefShape } from '../../../../jjform/shape';
import { newDraft } from '../../../../jjform';

const TSX = readFileSync(resolve(__dirname, '../InstanceManagerTab.tsx'), 'utf8');
const SCSS = readFileSync(resolve(__dirname, '../instanceManagerTab.scss'), 'utf8');

/* Lo stesso fixture State Machine di `jjform/__tests__/outline.test.ts`, ridotto
   a cio' che serve qui: una rootable con uno slot figlio. */
const ref = (o: Partial<RefShape> & { key: string; of: string }): RefShape => ({
    id: 'r_' + o.key,
    lower: 0, upper: -1, many: true, required: false,
    derived: false, readOnly: false,
    ofId: 'c_' + o.of, composition: true,
    ...o,
});

const cls = (o: Partial<ClassShape> & { key: string }): ClassShape => ({
    id: 'c_' + o.key,
    root: false, abstract: false, singleton: false, containedIn: [],
    attrs: [], refs: [], children: [],
    ...o,
});

const SHAPE: MetamodelShape = {
    enums: {},
    classes: {
        Machine: cls({ key: 'Machine', root: true, children: [ref({ key: 'regions', of: 'Region' })] }),
        Region: cls({ key: 'Region', containedIn: ['Machine'], children: [ref({ key: 'states', of: 'State' })] }),
        State: cls({ key: 'State', containedIn: ['Region'] }),
    },
};

describe('10b — positivo di controllo', () => {
    it('i file letti sono quelli giusti, e il pannello e\' ancora montato', () => {
        expect(TSX).toContain('export function InstanceManagerTab');
        expect(TSX).toContain('function OutlinePanel');
        expect(TSX).toContain('instance-manager__pane--outline');
        expect(SCSS).toContain('&__pane--outline');
        expect(TSX.length).toBeGreaterThan(10_000);
    });
});

describe('10b — un solo evento di create, e il motore non sa da dove viene', () => {
    /* L'affermazione del docstring di `jjform/create.ts` — «nulla a valle si
       dirama sulla provenienza del gesto» — non e' una promessa di stile: e'
       misurabile. Le due vie danno gli STESSI argomenti al motore, quindi il
       motore da' lo stesso draft. Se un giorno qualcuno aggiungesse un ramo
       sulla provenienza, dovrebbe prima aggiungere un argomento che la nomina,
       e la firma qui sotto lo rifiuterebbe. */
    it('lo stesso draft, che il gesto venga dal catalogo o dall\'albero', () => {
        const fromCatalogue = newDraft(SHAPE, 'Machine', null, null);
        const fromOutlineRoot = newDraft(SHAPE, 'Machine', null, null);
        expect(fromOutlineRoot).toEqual(fromCatalogue);
    });

    it('e lo stesso draft per la via contenuta: barra «Add» e «+» del nodo', () => {
        const fromChildBar = newDraft(SHAPE, 'Region', 'm1', 'regions');
        const fromOutlinePlus = newDraft(SHAPE, 'Region', 'm1', 'regions');
        expect(fromOutlinePlus).toEqual(fromChildBar);
        // Il padre e lo slot sono NEL draft: e' cosi' che la create atterra nel
        // padre giusto, e non per un ramo che sa chi ha cliccato.
        expect(fromOutlinePlus.ownerId).toBe('m1');
        expect(fromOutlinePlus.childKey).toBe('regions');
    });

    it('la create dalla radice non ha padre, ed e\' l\'unica differenza', () => {
        const root = newDraft(SHAPE, 'Machine', null, null);
        expect(root.ownerId).toBeNull();
        expect(root.childKey).toBeNull();
        expect(root.cls).toBe('Machine');
    });

    it('nel tab le tre superfici passano tutte per `openCreate`', () => {
        // Catalogo (toolbar della tabella), barra dei figli, e nodo dell'outline.
        expect(TSX).toContain('onClick={() => openCreate(classShape.key, null, null)}');
        expect(TSX).toContain('onClick={() => openCreate(child.of, subjectId, child.key)}');
        const outlineCreate = TSX.slice(TSX.indexOf('const outlineCreate'));
        expect(outlineCreate.slice(0, outlineCreate.indexOf('\n    };')))
            .toContain("openCreate(entry.cls, node.kind === 'model' ? null : node.id, entry.childKey)");
    });

    it('e `openCreate` e\' l\'unica porta del draft: un solo `newDraft` nel tab', () => {
        expect(TSX.match(/newDraft\(/g)?.length).toBe(1);
        expect(TSX).toContain('setDraft(newDraft(shapeCtx.shape(), clsName, ownerId, childKey))');
    });

    it('la selezione segue l\'istanza appena creata, da qualunque via', () => {
        const commit = TSX.slice(TSX.indexOf('const commitDraft'));
        const body = commit.slice(0, commit.indexOf('\n    };'));
        expect(body).toContain('const createdId = applyCreate(modelid, shapeCtx.shape(), draft)');
        expect(body).toContain('setSelectedObjectId(createdId)');
    });
});

describe('10b — una sola selezione, condivisa da tutte le superfici', () => {
    it('lo stato di selezione e\' UNO: nessuno stato proprio dell\'outline', () => {
        expect(TSX).toContain('const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)');
        // L'assenza, dopo il positivo qui sopra: nessun secondo stato di
        // selezione con un nome dell'albero.
        expect(TSX).not.toMatch(/const \[outlineSelected/);
        expect(TSX).not.toMatch(/setOutlineSelected/);
    });

    it('lo stato locale dell\'albero e\' la sola espansione, piu\' il menu aperto', () => {
        expect(TSX).toMatch(/const \[expanded, setExpanded\]/);
        expect(TSX).toMatch(/const \[menuFor, setMenuFor\]/);
    });

    it('outline → selezione: lo STESSO corpo degli altri emettitori', () => {
        const from = TSX.slice(TSX.indexOf('const selectFromOutline'));
        const fn = from.slice(0, from.indexOf('\n    };'));
        for (const call of ['setSelectedObjectId(node.id)', 'setAlsoSelected([])', 'setBulkTouched({})', 'setNav(null)']) {
            expect(fn).toContain(call);
        }
        // L'outline non alimenta la multi-selezione (12b): la azzera.
        expect(fn).not.toContain('setAlsoSelected(prev');
    });

    it('selezione → outline, tabella, form ed ego: tutte su `subjectId`, per id', () => {
        expect(TSX).toContain("node.id === subjectId ? ' instance-manager__outline-node--selected' : ''");
        expect(TSX).toContain("row.id === subjectId ? 'instance-manager__tr--selected'");
        expect(TSX).toContain('const isExpanded = row.id === subjectId');
        expect(TSX).toContain('<IRForm objectId={formSubjectId ?? subjectId} />');
        expect(TSX).toContain('egoInputOf(idlookup, subjectId, shapeCtx.shape())');
    });

    it('`subjectId` accetta un nodo dell\'albero anche fuori dalla collezione mostrata', () => {
        const at = TSX.indexOf('const subjectId = selectedObjectId');
        const expr = TSX.slice(at, at + 400);
        // Riga viva OPPURE DObject vivo di QUESTO modello: e' cio' che permette
        // di guardare la form di un nodo di un'altra metaclasse senza cambiare
        // la tabella sotto.
        expect(expr).toContain('rows.some(r => r.id === selectedObjectId)');
        expect(expr).toContain("idlookup?.[selectedObjectId]?.className === 'DObject'");
        expect(expr).toContain('modelIdOfObject(idlookup, selectedObjectId) === modelid');
    });

    it('selezionare nell\'albero NON cambia la collezione della tabella', () => {
        const from = TSX.slice(TSX.indexOf('const selectFromOutline'));
        const fn = from.slice(0, from.indexOf('\n    };'));
        expect(fn).not.toContain('setSelectedClassId');
        // Positivo di contrasto: la funzione che invece la cambia esiste, ed e'
        // quella della create.
        expect(TSX).toContain('setSelectedClassId(createdClassId)');
    });
});

describe('10b — la selezione porta il vocabolario cyan intero', () => {
    it('campitura e barra, le stesse due della riga della tabella', () => {
        expect(SCSS).toMatch(
            /&__outline-node\s*\{[\s\S]*?&--selected,\s*&--selected:hover\s*\{[^}]*background:\s*var\(--color-selection-bg\)[^}]*box-shadow:\s*inset 2px 0 0 var\(--color-selection-bar\)/,
        );
        // Positivo di controllo: e' la coppia che la tabella gia' usa.
        expect(SCSS).toContain('box-shadow: inset 2px 0 0 var(--color-selection-bar);');
        // Il token e' gia' del foglio (l'intestazione lo dichiara, la tabella lo
        // usa): cio' che questa slice aggiunge e' la sua occorrenza NELL'albero.
        const block = SCSS.slice(SCSS.indexOf('&__outline-node {'), SCSS.indexOf('&__outline-caret'));
        expect(block).toContain('var(--color-selection-bar)');
    });

    it('nessun colore nuovo: i due token, non i due literal', () => {
        const block = SCSS.slice(SCSS.indexOf('&__outline-node {'), SCSS.indexOf('&__outline-caret'));
        expect(block).not.toContain('#e0f7fa');
        expect(block).not.toContain('#0891b2');
    });
});
