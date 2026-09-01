/**
 * rowViewAnnotations — the metamodel declarations, and the one thing they must
 * never be: an inference from the attribute's name.
 *
 * Only the pure half is exercised here. `declareRowViewAnnotation` and
 * `clearRowViewAnnotation` write through Redux and are covered by the manual
 * smoke pass, not by a unit test that would have to stand up a store.
 */

import { describe, it, expect } from 'vitest';
import {
    annotationKeyOf,
    annotationSource,
    findRowViewAnnotationId,
    parseRowViewAnnotations,
    readRowViewAnnotations,
} from '../rowViewAnnotations';
import { metamodelRenderer, type SlotShape } from '../valueRenderer';

describe('the wire format', () => {
    it('round-trips every key', () => {
        for (const key of ['renderer', 'unit', 'min', 'max', 'multiline'] as const) {
            expect(annotationKeyOf(annotationSource(key, 'v'))).toBe(key);
        }
    });

    it('formats a number as its own text, so the parser gets it back unchanged', () => {
        expect(annotationSource('min', 0)).toBe('jjodel/min=0');
        expect(parseRowViewAnnotations(['jjodel/min=0']).min).toBe(0);
    });

    it('ignores an annotation that is not ours', () => {
        // The namespace is what makes the encoding safe to read back: nothing
        // else in the codebase writes `DAnnotation.source`, but something might.
        expect(annotationKeyOf('http://www.eclipse.org/emf/2002/GenModel')).toBeNull();
        expect(annotationKeyOf('jjodel/somethingElse=1')).toBeNull();
        expect(annotationKeyOf('jjodel/unit')).toBeNull();   // no `=`
        expect(annotationKeyOf(undefined)).toBeNull();
    });
});

describe('parseRowViewAnnotations', () => {
    it('reads the five keys', () => {
        expect(parseRowViewAnnotations([
            'jjodel/renderer=swatch', 'jjodel/unit=px', 'jjodel/min=0', 'jjodel/max=100',
            'jjodel/multiline=true',
        ])).toEqual({ renderer: 'swatch', unit: 'px', min: 0, max: 100, multiline: true });
    });

    it('an undeclared key is ABSENT, not defaulted', () => {
        // The whole point of `unit`: absence is a statement, and a default would
        // erase it. A row shows no unit because the metamodel declared none.
        const a = parseRowViewAnnotations(['jjodel/renderer=code']);
        expect(a.unit).toBeUndefined();
        expect(a.min).toBeUndefined();
        expect(a.max).toBeUndefined();
    });

    it('drops a bound that is not a number rather than keeping NaN', () => {
        // A NaN bound would satisfy `min != null && max != null` and then paint
        // an unpaintable bar. Dropping it falls back to numberUnit instead.
        const a = parseRowViewAnnotations(['jjodel/min=abc', 'jjodel/max=10']);
        expect(a.min).toBeUndefined();
        expect(a.max).toBe(10);
    });

    it('an empty value declares nothing, which is how a cleared annotation reads', () => {
        expect(parseRowViewAnnotations(['jjodel/renderer=']).renderer).toBeUndefined();
    });

    it('accepts a negative and a fractional bound', () => {
        expect(parseRowViewAnnotations(['jjodel/min=-2.5']).min).toBe(-2.5);
    });
});

describe('readRowViewAnnotations — off an idlookup', () => {
    const lookup = {
        attr1: { className: 'DAttribute', name: 'width', annotations: ['a1', 'a2'] },
        a1: { className: 'DAnnotation', source: 'jjodel/unit=px' },
        a2: { className: 'DAnnotation', source: 'jjodel/renderer=numberUnit' },
        attrNone: { className: 'DAttribute', name: 'label' },
    };

    it('resolves pointer ids', () => {
        expect(readRowViewAnnotations(lookup, 'attr1')).toEqual({ unit: 'px', renderer: 'numberUnit' });
    });

    it('accepts the record inline, the second shape the write paths leave behind', () => {
        const inline = { attr: { annotations: [{ source: 'jjodel/unit=s' }] } };
        expect(readRowViewAnnotations(inline, 'attr')).toEqual({ unit: 's' });
    });

    it('a feature with no annotations declares nothing', () => {
        expect(readRowViewAnnotations(lookup, 'attrNone')).toEqual({});
        expect(readRowViewAnnotations(lookup, 'missing')).toEqual({});
        expect(readRowViewAnnotations(lookup, null)).toEqual({});
    });

    it('finds the annotation to overwrite, so a second declaration is never stacked', () => {
        expect(findRowViewAnnotationId(lookup, 'attr1', 'unit')).toBe('a1');
        expect(findRowViewAnnotationId(lookup, 'attr1', 'min')).toBeNull();
    });
});

// ─── The third family: `multiline`, a boolean (TXT1) ─────────────────────────

describe('multiline — the boolean family', () => {
    it('is the fifth key of the union, so a source carrying it is OURS', () => {
        // Before TXT1 this returned null and the declaration was dropped at the door.
        expect(annotationKeyOf('jjodel/multiline=true')).toBe('multiline');
        expect(annotationSource('multiline', 'true')).toBe('jjodel/multiline=true');
    });

    it('reads the two words the writer emits, as booleans and not as strings', () => {
        expect(parseRowViewAnnotations(['jjodel/multiline=true'])).toEqual({ multiline: true });
        expect(parseRowViewAnnotations(['jjodel/multiline=false'])).toEqual({ multiline: false });
    });

    it('DROPS anything else rather than coercing it — the argument that settles the NaN', () => {
        // A value that means nothing here must not arrive downstream looking like a
        // decision. `1` and `True` are the two an importer is most likely to produce,
        // and they are dropped exactly as `jjodel/min=abc` is.
        for (const bad of ['si', '1', '0', 'True', 'yes', '']) {
            expect(parseRowViewAnnotations([`jjodel/multiline=${bad}`]).multiline,
                `value ${JSON.stringify(bad)}`).toBeUndefined();
        }
    });

    it('tolerates surrounding whitespace, which an imported model can carry', () => {
        expect(parseRowViewAnnotations(['jjodel/multiline= true ']).multiline).toBe(true);
    });

    it('is absent, not false, when nothing declares it', () => {
        expect(parseRowViewAnnotations(['jjodel/renderer=code']).multiline).toBeUndefined();
        expect(readRowViewAnnotations({ a: { annotations: [] } }, 'a').multiline).toBeUndefined();
    });

    it('reads off an idlookup like every other key', () => {
        const lookup = {
            attr: { className: 'DAttribute', annotations: ['m1'] },
            m1: { className: 'DAnnotation', source: 'jjodel/multiline=true' },
        };
        expect(readRowViewAnnotations(lookup, 'attr')).toEqual({ multiline: true });
        expect(findRowViewAnnotationId(lookup, 'attr', 'multiline')).toBe('m1');
    });
});

describe('the canvas and the table do not see the fifth key', () => {
    // Not asserted, SHOWN: the Row view and the instance table both build their slot by
    // NAMING four fields (`jjomTransformers.ts:456-459`, `instanceTable.ts:168-171`).
    // The projection below is that destructuring, and the verdict either side of a
    // multiline declaration has to be the same object.
    const project = (a: ReturnType<typeof parseRowViewAnnotations>, value: string): SlotShape => ({
        value,
        typeName: 'EString',
        rendererOverride: a.renderer,
        unit: a.unit,
        min: a.min,
        max: a.max,
    });

    it('a multiline declaration leaves the metamodel verdict untouched', () => {
        const bare = parseRowViewAnnotations([]);
        const declared = parseRowViewAnnotations(['jjodel/multiline=true']);
        expect(declared.multiline).toBe(true);   // positive control: the parse DID happen
        expect(metamodelRenderer(project(declared, 'note')))
            .toEqual(metamodelRenderer(project(bare, 'note')));
    });

    it('and it does not disturb a declaration the canvas DOES read', () => {
        const both = parseRowViewAnnotations(['jjodel/renderer=code', 'jjodel/multiline=true']);
        const codeOnly = parseRowViewAnnotations(['jjodel/renderer=code']);
        expect(metamodelRenderer(project(both, 'x')))
            .toEqual(metamodelRenderer(project(codeOnly, 'x')));
        expect(metamodelRenderer(project(both, 'x')).kind).toBe('code');
    });
});
