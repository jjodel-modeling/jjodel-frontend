import { describe, it, expect } from 'vitest';
import { placeScriptNodes, scriptLinkId, scriptLinks, SCRIPT_ROW_GAP } from '../megamodelScripts';

describe('scriptLinks', () => {
    it('links a script to its model when the model is a node of the view', () => {
        const links = scriptLinks([{ id: 's1', name: 'a.jjs', modelId: 'm1' }], new Set(['m1', 'mm1']));
        expect(links).toEqual([{ id: scriptLinkId('s1'), from: 'm1', to: 's1' }]);
    });

    it('gives no link to a script with no model, or whose model is not in the view', () => {
        const links = scriptLinks([
            { id: 's1', name: 'a.jjs' },
            { id: 's2', name: 'b.jjs', modelId: 'gone' },
            { id: 's3', name: 'c.jjs', modelId: 'm1' },
        ], new Set(['m1']));
        expect(links.map(l => l.to)).toEqual(['s3']);
    });
});

describe('placeScriptNodes', () => {
    it('puts the scripts on one row under the lowest node, from the leftmost x, in order', () => {
        const placed = [{ x: 100, y: 0 }, { x: -50, y: 200 }, { x: 300, y: 80 }];
        const pos = placeScriptNodes(placed, ['s1', 's2'], 180, 60);
        expect(pos.get('s1')).toEqual({ x: -50, y: 200 + 60 + SCRIPT_ROW_GAP });
        expect(pos.get('s2')).toEqual({ x: -50 + 180 + SCRIPT_ROW_GAP, y: 200 + 60 + SCRIPT_ROW_GAP });
    });

    it('starts at the origin when nothing else is placed', () => {
        const pos = placeScriptNodes([], ['s1'], 180, 60);
        expect(pos.get('s1')).toEqual({ x: 0, y: 0 });
    });

    it('leaves no script node overlapping a placed one', () => {
        const placed = [{ x: 0, y: 0 }, { x: 0, y: 100 }];
        const pos = placeScriptNodes(placed, ['s1', 's2', 's3'], 180, 60);
        for (const p of pos.values()) {
            for (const q of placed) expect(p.y >= q.y + 60 || p.x >= q.x + 180).toBe(true);
        }
    });
});
