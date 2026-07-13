/**
 * M1 (model) round-trip: import metamodel (.ecore) + model (.xmi) → export the
 * model via XMIService.exportToXML → re-import → the two semantic snapshots
 * must be identical (object tree, attribute values, enum literals, references).
 *
 * Production code paths under test:
 *   XMIService.importM1FromXML (the active M1 importer, used by importM1FromFile)
 *   XMIService.exportToXML     (the active M1 exporter, ProjectEditor.tsx:946)
 *
 * Reports land in /tmp/rt-reports/<name>.m1report.json (+ exported .xmi).
 *
 * Run from frontend/:
 *   npx vitest run --config ecore-roundtrip-tests/vitest.roundtrip.config.ts m1-roundtrip
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { bootstrap, lookup, importEcoreCompensated, flush } from './rt-helpers';
import * as helpers from './rt-helpers';
import { m1Snapshot, deepDiff } from './snapshot';

const FIXTURE_DIR = path.resolve(__dirname, '../src/__tests__/fixtures/xmi-m1');
const REPORT_DIR = '/tmp/rt-reports';

beforeAll(async () => {
    await bootstrap();
    fs.mkdirSync(REPORT_DIR, { recursive: true });
});

async function importM1(xmi: string, name: string): Promise<any> {
    // importM1FromXML is private (the public API wraps a browser File); tests
    // call it directly with the same arguments importM1FromFile would pass.
    const errs: string[] = [];
    const origErr = console.error;
    const fmt = (x: any): string => {
        if (x && typeof x === 'object') {
            const pick: any = {};
            for (const k of ['path', 'pathArray', 'type', 'value', 'className', 'key']) if (x[k] !== undefined) pick[k] = x[k];
            if (x.action) pick.action = { path: x.action.path, value: typeof x.action.value === 'string' ? x.action.value : typeof x.action.value };
            try { return JSON.stringify(pick).slice(0, 400); } catch { return String(x); }
        }
        return String(x);
    };
    console.error = (...a: any[]) => { errs.push(a.map(fmt).join(' ').slice(0, 500)); origErr(...a); };
    let res: any;
    try {
        res = (helpers.XMIService as any).importM1FromXML(xmi, name);
        await flush(10, 30);
    } finally {
        console.error = origErr;
    }
    res.consoleErrors = errs;
    // Diagnostic breadcrumb only when something went wrong (reducer aborts are silent).
    if (res.model?.id && (!lookup()[res.model.id] || errs.length > 0)) {
        console.warn('[M1 IMPORT PROBE]', JSON.stringify({
            name,
            modelInLookup: !!lookup()[res.model.id],
            consoleErrors: errs.slice(0, 6),
        }));
    }
    return res;
}

async function m1RoundTrip(name: string, ecoreFile: string, xmiFile: string) {
    const mmRes = await importEcoreCompensated(fs.readFileSync(ecoreFile, 'utf8'), `m1mm_${name}`);
    if (!mmRes.success) return { phase: 'mm-import', errors: mmRes.errors } as any;

    const res1 = await importM1(fs.readFileSync(xmiFile, 'utf8'), `m1_rt1_${name}`);
    if (!res1.success || !res1.model) return { phase: 'import1', errors: res1.errors, warnings: res1.warnings } as any;
    const snap1 = m1Snapshot(lookup(), res1.model.id);

    let exported = '';
    try {
        exported = helpers.XMIService.exportToXML(res1.model, { includeMetamodel: false });
    } catch (e) {
        return { phase: 'export', errors: [String(e)], snap1 } as any;
    }
    fs.writeFileSync(path.join(REPORT_DIR, `${name}.exported.xmi`), exported);

    const res2 = await importM1(exported, `m1_rt2_${name}`);
    if (!res2.success || !res2.model) return { phase: 'import2', errors: res2.errors, warnings: res2.warnings, snap1, exported } as any;
    const snap2 = m1Snapshot(lookup(), res2.model.id);

    const diff = deepDiff(snap1, snap2, '', [], 500);
    return { phase: 'done', snap1, snap2, diff, exported, warnings1: res1.warnings, warnings2: res2.warnings };
}

async function runPair(name: string, ecore: string, xmi: string) {
    const result = await m1RoundTrip(name, path.join(FIXTURE_DIR, ecore), path.join(FIXTURE_DIR, xmi));
    fs.writeFileSync(
        path.join(REPORT_DIR, `${name}.m1report.json`),
        JSON.stringify({ name, phase: result.phase, errors: result.errors, warnings1: result.warnings1, warnings2: result.warnings2, diff: result.diff, snap1: result.snap1, snap2: result.snap2 }, null, 2),
    );
    return result;
}

describe('M1 round-trip — import → export → import (semantic identity)', () => {

    it('combo_test (Library): containment + xsi:type + non-containment refs', async () => {
        const result = await runPair('combo_test', 'Library.ecore', 'combo_test.xmi');
        expect(result.phase, `failed at phase ${result.phase}: ${JSON.stringify(result.errors)}`).toBe('done');
        expect(result.snap1.rootCount, 'import1 produced no roots — vacuous run').toBeGreaterThan(0);
        expect(result.diff, `semantic diff:\n${(result.diff || []).join('\n')}`).toEqual([]);
    });

    it('polymorphism_test (Shapes): xmi:XMI wrapper + xsi:type children', async () => {
        const result = await runPair('polymorphism_test', 'Shapes.ecore', 'polymorphism_test.xmi');
        expect(result.phase, `failed at phase ${result.phase}: ${JSON.stringify(result.errors)}`).toBe('done');
        expect(result.snap1.rootCount, 'import1 produced no roots — vacuous run').toBeGreaterThan(0);
        expect(result.diff, `semantic diff:\n${(result.diff || []).join('\n')}`).toEqual([]);
    });

    it('references_test (Graph): EMF //@path refs (known import limitation — report only)', async () => {
        const result = await runPair('references_test', 'Graph.ecore', 'references_test.xmi');
        // //@nodes.N path references are unsupported by the importer (falls back to
        // literal xmi:id matching). This test documents the current behaviour and
        // fails only on hard crashes, not on the known reference loss.
        expect(['done', 'import2'], `unexpected phase ${result.phase}: ${JSON.stringify(result.errors)}`).toContain(result.phase);
    });
});
