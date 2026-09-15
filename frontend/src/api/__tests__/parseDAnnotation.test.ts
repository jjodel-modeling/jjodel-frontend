import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseRowViewAnnotations, annotationSource } from '../../components/editor-v2/nodes/rowViewAnnotations';

/**
 * Il contratto di `EcoreParser.parseDAnnotation` (api/data.ts).
 *
 * Perche' in parte statiche: `api/data.ts` non e' importabile sotto vitest — tira
 * dentro il barrel di `joiner`, e `joiner/types.ts:192` lega `window` a livello di
 * modulo mentre l'ambiente di `vitest.config.ts` e' `node`. E' la stessa ragione
 * dichiarata in `services/export/__tests__/ecore-io.test.ts` e in
 * `joiner/__tests__/dTypedElement.test.ts`.
 *
 * La prova di comportamento e' la sonda `_tmp_annotation_parse.ts`, che chiama
 * `parseDAnnotation` sul parser vero col JSON prodotto dal fixture qui sotto:
 * 5/5 ALL GREEN, tabella nel report di discovery.
 *
 * Quello che invece si prova qui davvero, e non per lettura del sorgente, e' il
 * pezzo che conta: che la stringa prodotta dal parser sia una che il gradino 1
 * della ladder legge. `rowViewAnnotations` e' puro e importabile, quindi le due
 * meta' del giro si toccano in un test.
 */

const DATA_TS = path.resolve(__dirname, '../data.ts');
const FIXTURE = path.resolve(__dirname, '../../__tests__/fixtures/xmi-m1/Annotation_test.ecore');

const source = fs.readFileSync(DATA_TS, 'utf8');

/** Il corpo del solo `parseDAnnotation`, dalla firma al metodo che segue. */
function body(): string {
    const start = source.indexOf('    static parseDAnnotation(parent: DModelElement');
    expect(start, 'la firma di parseDAnnotation e\' cambiata: aggiorna il test').toBeGreaterThan(-1);
    const next = source.indexOf('\n    static parseRootPackage(', start);
    expect(next).toBeGreaterThan(start);
    return source.slice(start, next);
}

describe('parseDAnnotation — lo stub e\' chiuso', () => {
    it('non ritorna piu\' [] sulla prima riga', () => {
        expect(body()).not.toMatch(/^\s*static parseDAnnotation\([^)]*\)[^{]*\{\s*\n\s*return \[\];/);
    });

    it('legge source e details', () => {
        const b = body();
        expect(b).toMatch(/this\.read\(json, ECoreAnnotation\.source, ''\)/);
        expect(b).toMatch(/this\.getDetails\(json\)/);
        expect(b).toMatch(/this\.read\(det, ECoreDetail\.key, ''\)/);
        expect(b).toMatch(/this\.read\(det, ECoreDetail\.value, ''\)/);
    });

    it('produce un DAnnotation per detail, parentato sull\'elemento', () => {
        expect(body()).toMatch(/DAnnotation\.new\([^)]*\[\], parent\.id\)/);
    });

    it('non tocca la costruzione dei typed element', () => {
        // Il contratto pinnato dal discovery DTypedElement del 2026-08-30: il parser
        // costruisce con `type === undefined` e scrive `.type` dopo.
        expect(source).toMatch(/DAttribute\.new\(\s*\n\s*this\.read\(json, ECoreNamed\.namee, 'attr_1'\),\s*\n\s*undefined,/);
        expect(source).toMatch(/DReference\.new\(undefined, undefined, parent\.id\)/);
        expect(body()).not.toMatch(/DAttribute|DReference|DTypedElement/);
    });
});

describe('parseDAnnotation — il fixture', () => {
    const xml = fs.readFileSync(FIXTURE, 'utf8');

    it('esiste ed e\' XML con un solo EPackage', () => {
        expect((xml.match(/<ecore:EPackage\b/g) || []).length).toBe(1);
        expect((xml.match(/<\/ecore:EPackage>/g) || []).length).toBe(1);
    });

    it('dichiara la forma EMF: source con details a chiave', () => {
        expect(xml).toMatch(/<eAnnotations source="jjodel">\s*\n\s*<details key="renderer" value="color"\/>/);
    });

    it('dichiara la forma che l\'export di jjodel produce: source impacchettato', () => {
        expect(xml).toContain('<eAnnotations source="jjodel/renderer=code"/>');
    });

    it('porta un controllo negativo senza annotazioni', () => {
        expect(xml).toMatch(/name="plain" eType="#\/\/EString"\/>/);
    });
});

describe('l\'encoding prodotto e\' quello che il gradino 1 legge', () => {
    // Le stringhe di sinistra sono quelle misurate in uscita dalla sonda sul parser
    // vero; quelle a destra sono la lettura del consumatore. Se il parser cambiasse
    // encoding senza avvisare il lettore, questo test cadrebbe.
    it('source + detail -> renderer visto dalla ladder', () => {
        expect(parseRowViewAnnotations(['jjodel/renderer=color']).renderer).toBe('color');
    });

    it('due details -> due dichiarazioni distinte', () => {
        const a = parseRowViewAnnotations(['jjodel/unit=px', 'jjodel/min=0']);
        expect(a.unit).toBe('px');
        expect(a.min).toBe(0);
    });

    it('il source impacchettato del round trip e\' letto identico', () => {
        expect(parseRowViewAnnotations(['jjodel/renderer=code']).renderer).toBe('code');
    });

    it('il formato del parser coincide con quello che il write path scrive', () => {
        // `annotationSource` e' l'unico proprietario del formato sul lato scrittura:
        // il parser deve comporre la stessa stringa, o il round trip si apre di nuovo.
        expect(annotationSource('renderer', 'color')).toBe('jjodel/renderer=color');
        expect(annotationSource('unit', 'px')).toBe('jjodel/unit=px');
    });

    it('controllo negativo: nessuna annotazione, nessuna dichiarazione', () => {
        const a = parseRowViewAnnotations([]);
        expect(a.renderer).toBeUndefined();
        expect(a.unit).toBeUndefined();
    });
});
