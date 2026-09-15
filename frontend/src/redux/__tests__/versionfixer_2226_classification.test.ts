/**
 * Classification predicate of the VersionFixer migration `2.225 -> 2.226`
 * (inverse migration: classic defaults -> IR, everything else marked legacy).
 *
 * WHAT IS DUPLICATED AND WHY. `VersionFixer.tsx` cannot be imported in the node
 * vitest environment (it drags the joiner), so the three-branch cascade below is
 * replicated from `['2.225 -> 2.226']` — same convention as
 * versionfixer_2227_migration.test.ts. The MARKERS ARE NOT duplicated: they are
 * imported from the real `utils/defaultViewTemplate` (a pure string module with
 * zero imports), so a marker that changes there breaks this test instead of
 * silently diverging from it. Only the `||` chain and the branch order are
 * mirrored, and any change to them must be mirrored here.
 *
 * The fixtures are the fragments the census of 2026-08-04 found on the REAL saved
 * projects, where 1315 DViewElement out of 1550 were falling into the legacy
 * branch. Each `tool-generated` fixture used to land in branch 3 (marked
 * `irLegacyClassic`) and must now land in branch 5 (no field written at all).
 */
import { describe, it, expect } from 'vitest';
import {
    DEFAULT_VIEW_JSX_STRING,
    DEFAULT_VIEW_JSX_V2_3_LEGACY,
    V2_3_TO_V3_DETECT_MARKER,
    V2_2_TO_V2_3_DETECT_MARKER,
    LEGACY_PLACEHOLDER_MARKER,
    CLASSIC_OBJECT_VIEW_MARKER,
    CLASSIC_VALUE_VIEW_MARKER,
    CLASSIC_SINGLETON_VIEW_MARKER,
    CLASSIC_EDGE_RELATION_MARKER,
    JJODEL_ABSTRACT_SYNTAX_MARKER,
    CLASSIC_EDGEPOINT_VIEW_MARKER,
    CLASSIC_ANCHOR_OVERLAY_MARKER,
    CLASSIC_VOID_VIEW_MARKER,
} from '../../utils/defaultViewTemplate';

// --- mirrored from VersionFixer.tsx ['2.225 -> 2.226'] ----------------------

const isKnownDefault = (jsx: string): boolean =>
    jsx === DEFAULT_VIEW_JSX_STRING
    || jsx === DEFAULT_VIEW_JSX_V2_3_LEGACY
    || jsx.includes(V2_3_TO_V3_DETECT_MARKER)
    || jsx.includes(V2_2_TO_V2_3_DETECT_MARKER)
    || jsx.includes(LEGACY_PLACEHOLDER_MARKER)
    || jsx.includes('jjodel-default-view')
    || jsx.includes(CLASSIC_EDGE_RELATION_MARKER)
    || jsx.includes(JJODEL_ABSTRACT_SYNTAX_MARKER)
    || jsx.includes(CLASSIC_EDGEPOINT_VIEW_MARKER)
    || jsx.includes(CLASSIC_ANCHOR_OVERLAY_MARKER)
    || jsx.includes(CLASSIC_VOID_VIEW_MARKER);

/** The outcome of the cascade for one jsxString, named after the branch it hits. */
type Branch = 'ir-default' | 'legacy-classic-value' | 'legacy-custom' | 'untouched';

function classify(jsx: string): Branch {
    if (jsx.includes(CLASSIC_OBJECT_VIEW_MARKER) || jsx.includes(CLASSIC_SINGLETON_VIEW_MARKER)) return 'ir-default';
    if (jsx.includes(CLASSIC_VALUE_VIEW_MARKER)) return 'legacy-classic-value';
    if (!isKnownDefault(jsx)) return 'legacy-custom';
    return 'untouched';
}

// --- fixtures: fragments as they appear in the real saved projects ----------
// Sources in common/DV.tsx are cited per fixture; the strings are trimmed to the
// identifying part, which is what `includes` matches on.

const TOOL_GENERATED: { name: string; occurrences: number; jsx: string }[] = [
    {
        name: 'edge relation — Association (DV.tsx:870)',
        occurrences: 195,
        jsx: `<div className={"edge hoverable hide-ep clickthrough fullscreen Association"}>
    <svg className={"clickthrough fullscreen"}></svg>
</div>`,
    },
    {
        name: 'edge relation — Aggregation',
        occurrences: 62,
        jsx: `<div className={"edge hoverable hide-ep clickthrough fullscreen Aggregation"}></div>`,
    },
    {
        name: 'edge relation — Composition',
        occurrences: 62,
        jsx: `<div className={"edge hoverable hide-ep clickthrough fullscreen Composition"}></div>`,
    },
    {
        name: 'edge relation — Extension',
        occurrences: 62,
        jsx: `<div className={"edge hoverable hide-ep clickthrough fullscreen Extension"}></div>`,
    },
    {
        name: 'abstract syntax v2.0 (DV.tsx:1219)',
        occurrences: 122,
        jsx: `/* -- Jjodel Abstract Syntax Specification v2.0 -- */
<div className={"root"}>{data.name}</div>`,
    },
    {
        name: 'abstract syntax v2.2 (DV.tsx:1393)',
        occurrences: 61,
        jsx: `/* -- Jjodel Abstract Syntax Specification v2.2 -- */
<div className={"root"}>{data.name}</div>`,
    },
    {
        name: 'abstract syntax v2.3 (DV.tsx:1587)',
        occurrences: 61,
        jsx: `/* -- Jjodel Abstract Syntax Specification v2.3 -- */
<div className={"root"}>{data.name}</div>`,
    },
    {
        name: 'edge point (DV.tsx:592-595)',
        occurrences: 62,
        jsx: `<div className={"edgePoint"} tabIndex="-1">
    {decorators}
</div>`,
    },
    {
        name: 'anchor overlay (DV.tsx:585-589)',
        occurrences: 61,
        jsx: `<div className={"overlap"}>
{Object.keys(anchors).map( (k) => { let a = anchors[k]; return(
<div className={"anchor draggable resizable"} data-anchorName={a.name} data-anchorKey={k} />)})
}</div>`,
    },
    {
        name: 'void placeholder (DV.tsx:1332)',
        occurrences: 61,
        jsx: `<div className="void model-less">
    <i className="bi bi-exclamation-diamond-fill" />
</div>`,
    },
];

/** Authored notation: must KEEP falling into the legacy branch. Taken verbatim
 *  from the example corpus (census 2026-08-04 §A.4, family DOM). */
const AUTHORED: { name: string; jsx: string }[] = [
    {
        name: 'Room_View — remote background image',
        jsx: `<div className={'root bg-white d-flex'} style={{flexWrap: "wrap", backgroundSize: "100% 100%", backgroundImage:"url(https://images.freeimages.com/365/images/istock/previews/7398/73982903-linear.jpg)"}}></div>`,
    },
    {
        name: 'StudentView — conditional image on a slot value',
        jsx: `<div className={'root '} style={{border:"none"}}> {progress.value!=="Finished" && <img className="w-100 h-100" alt="Student" src="https://cdn-icons-png.flaticon.com/512/10/10938.png" />} </div>`,
    },
    {
        name: 'Lifeline — button with a handler',
        jsx: `<div className={'root bg-white p-1'}> <strong className={'d-block text-center'}>Lifeline</strong> <button className={'p-1 btn btn-primary d-block mx-auto'} onClick={e => { const o = 1; }}>add</button> </div>`,
    },
    {
        name: 'ClassView — authored gradient box',
        jsx: `<div className={'root'} style= {{ border: '1px solid gray', backgroundImage: 'linear-gradient(to top left, #b5c6e0, #ebf4f5)', borderRadius: '5px' }}> <div className={'text-center'} /> </div>`,
    },
    {
        name: 'model_1View — filter by metaclass name',
        jsx: `<div className={'root model'}> {data.objects.filter(obj => obj.instanceof.name !== 'Edge').map((obj, index) => { return(<DefaultNode key={index} data={obj.id} />) })} </div>`,
    },
];

describe("VersionFixer '2.225 -> 2.226' — tool-generated defaults are recognised", () => {
    for (const f of TOOL_GENERATED) {
        it(`does not mark legacy: ${f.name} (${f.occurrences} occurrences in the real projects)`, () => {
            expect(isKnownDefault(f.jsx)).toBe(true);
            expect(classify(f.jsx)).toBe('untouched');
        });
    }

    it('covers the whole census sample: no tool-generated fixture reaches the legacy branch', () => {
        const leaking = TOOL_GENERATED.filter(f => classify(f.jsx) === 'legacy-custom').map(f => f.name);
        expect(leaking).toEqual([]);
    });
});

describe("VersionFixer '2.225 -> 2.226' — authored notation still reaches the legacy branch", () => {
    for (const f of AUTHORED) {
        it(`marks legacy: ${f.name}`, () => {
            expect(isKnownDefault(f.jsx)).toBe(false);
            expect(classify(f.jsx)).toBe('legacy-custom');
        });
    }
});

describe("VersionFixer '2.225 -> 2.226' — the three original branches are unchanged", () => {
    it('classic object marker still routes to the IR default', () => {
        expect(classify(`/* ${CLASSIC_OBJECT_VIEW_MARKER} */ <div/>`)).toBe('ir-default');
    });

    it('classic singleton marker still routes to the IR default', () => {
        expect(classify(`/* ${CLASSIC_SINGLETON_VIEW_MARKER} */ <div/>`)).toBe('ir-default');
    });

    it('classic value marker still routes to the legacy mark', () => {
        expect(classify(`/* ${CLASSIC_VALUE_VIEW_MARKER} */ <div/>`)).toBe('legacy-classic-value');
    });

    it('the object branch wins over the value branch when both markers are present', () => {
        const both = `/* ${CLASSIC_OBJECT_VIEW_MARKER} */ /* ${CLASSIC_VALUE_VIEW_MARKER} */`;
        expect(classify(both)).toBe('ir-default');
    });

    it('the pre-existing default templates are still recognised', () => {
        expect(classify(DEFAULT_VIEW_JSX_STRING)).toBe('untouched');
        expect(classify(DEFAULT_VIEW_JSX_V2_3_LEGACY)).toBe('untouched');
        expect(classify(`<div>${LEGACY_PLACEHOLDER_MARKER} something</div>`)).toBe('untouched');
        expect(classify(`<div className='jjodel-default-view'/>`)).toBe('untouched');
    });
});

describe('markers are specific enough not to swallow authored notation', () => {
    it('the anchor overlay marker is keyed on the anchor class, not on the generic wrapper', () => {
        // `overlap` alone would also catch DV.semanticErrorOverlay and any authored
        // template reusing the class; the marker must not match on it.
        expect(CLASSIC_ANCHOR_OVERLAY_MARKER.includes('overlap')).toBe(false);
        expect(isKnownDefault(`<section className="overlap"><div>authored</div></section>`)).toBe(false);
    });

    it('a bare mention of the word "edge" does not make a template a known default', () => {
        expect(isKnownDefault(`<div className={'root'}>my edge diagram</div>`)).toBe(false);
    });

    it('the abstract-syntax marker stops before the version digits, so it covers every version', () => {
        expect(JJODEL_ABSTRACT_SYNTAX_MARKER).not.toMatch(/v\d/);
        for (const v of ['v2.0', 'v2.2', 'v2.3', 'v9.9']) {
            expect(isKnownDefault(`/* -- ${JJODEL_ABSTRACT_SYNTAX_MARKER} ${v} -- */`)).toBe(true);
        }
    });
});
