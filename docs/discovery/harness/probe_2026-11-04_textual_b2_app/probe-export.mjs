// P-2026-11-04-0005 run 1: demoESM as the Text tab reads it (metamodel, objects, stored notation, print), written to
// demoesm.json for the vitest probe of points (1) and (2). No write to the model.
import { writeFileSync } from 'node:fs';
import { setup, note } from './common.mjs';

const OUT = new URL('./demoesm.json', import.meta.url);
const { browser, page, errors, ids } = await setup();
try {
    const data = await page.evaluate(`(async () => {
        const j = await import('/src/jjscript/index.ts');
        const sb = await import('/src/components/editor-v2/sim/simBridge.ts');
        const t = await import('/src/codegen/textual/ui/TextualTab.tsx');
        const L = window.windoww.store.getState().idlookup;
        const globals = j.buildEvalContext(sb.evalContextFor(L, ${JSON.stringify(ids.m1)}, ''), { extentModelId: ${JSON.stringify(ids.m1)} });
        const stored = t.storedNotation(L, ${JSON.stringify(ids.mm)});
        const r = t.readModel(globals, stored, L);
        const ed = ${'(window.monaco?.editor?.getEditors?.() || []).find(e => document.querySelector(".textual-tab")?.contains(e.getDomNode()) && !e.getRawOptions().readOnly)'};
        return { mm: r.base.mm, objects: r.base.objects, stored, text: r.view.text, editorText: ed ? ed.getValue() : null, monaco: window.monaco?.version ?? null };
    })()`);
    writeFileSync(OUT, JSON.stringify(data, null, 1));
    note('export', { classes: data.mm.classes.length, objects: data.objects.length, chars: data.text.length, editorEqualsPrint: data.editorText === data.text, record: !!data.stored.decoded.record });
    note('errors', errors.slice(0, 5));
} finally {
    await browser.close();
}
