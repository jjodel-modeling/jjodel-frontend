/**
 * CanvasExportService: File > Export Canvas, from the event to the library call.
 *
 * The listener is exercised through the event it listens to (P11): a CustomEvent dispatched on an EventTarget, the
 * service's static calls spied. The service is exercised through `export`, with html-to-image mocked, so the test
 * sees which library function renders which node with which options, and the file name the download gets.
 * The pixels are the browser probe's (discovery_2026-09-30_canvas_export_broken.md).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock, MockInstance } from 'vitest';

const lib = vi.hoisted(() => ({
    toPng: vi.fn(async (_node: unknown, _options?: any) => 'data:image/png;base64,UE5H'),
    toJpeg: vi.fn(async (_node: unknown, _options?: any) => 'data:image/jpeg;base64,SlBFRw=='),
    // what html-to-image returns: the serialized <svg><foreignObject/></svg>, URI-encoded
    toSvg: vi.fn(async (_node: unknown, _options?: any) => 'data:image/svg+xml;charset=utf-8,'
        + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="8" viewBox="0 0 10 8"><foreignObject width="100%" height="100%"/></svg>')),
    toBlob: vi.fn(async (_node: unknown, _options?: any) => ({ size: 4, type: 'image/png' })),
}));
vi.mock('html-to-image', () => lib);

import {
    CanvasExportService,
    diagramBounds,
    installCanvasExportListener,
    routeCanvasExport,
} from '../CanvasExportService';
import type { CanvasExportDeps } from '../CanvasExportService';
import { JjodelEvents } from '../../events/registry';

type Anchor = { download: string; href: string; click: ReturnType<typeof vi.fn> };
let anchor: Anchor;

beforeEach(() => {
    vi.clearAllMocks();
    anchor = { download: '', href: '', click: vi.fn() };
    vi.stubGlobal('document', { createElement: vi.fn(() => anchor) });
    vi.stubGlobal('getComputedStyle', () => ({ visibility: 'visible', display: 'block', getPropertyValue: () => '' }));
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

/** An element that holds neither a React Flow viewport nor a `.Graph`: the service renders it as it is. */
const plainElement = () => ({ querySelector: () => null }) as unknown as HTMLElement;

const DATE = '\\d{4}-\\d{2}-\\d{2}';

describe('CanvasExportService.export: the format reaches the library and the file extension', () => {
    const cases = [
        ['png', 'toPng'],
        ['jpeg', 'toJpeg'],
        ['svg', 'toSvg'],
    ] as const;

    it.each(cases)('type %s renders with %s only and downloads <name>_<date>.%s', async (type, fn) => {
        const el = plainElement();
        const result = await CanvasExportService.export(el, { type, filename: 'DemoESM' } as any);

        expect(result.success).toBe(true);
        expect(lib[fn]).toHaveBeenCalledTimes(1);
        expect(lib[fn].mock.calls[0][0]).toBe(el);
        for (const other of ['toPng', 'toJpeg', 'toSvg'] as const) {
            if (other !== fn) expect(lib[other]).not.toHaveBeenCalled();
        }
        expect(result.filename).toMatch(new RegExp(`^DemoESM_${DATE}\\.${type}$`));
        expect(anchor.download).toBe(result.filename);
        if (type !== 'svg') expect(anchor.href).toBe(await lib[fn].mock.results[0].value);
        expect(anchor.click).toHaveBeenCalledTimes(1);
    });

    it('an SVG gets its background as a rect under the drawing, filling the whole image', async () => {
        await CanvasExportService.export(plainElement(), { type: 'svg' } as any);

        const prefix = 'data:image/svg+xml;charset=utf-8,';
        expect(anchor.href.startsWith(prefix)).toBe(true);
        expect(decodeURIComponent(anchor.href.slice(prefix.length))).toBe(
            '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="8" viewBox="0 0 10 8">'
            + '<rect width="100%" height="100%" fill="#ffffff"/>'
            + '<foreignObject width="100%" height="100%"/></svg>');
    });

    it('with no options renders a PNG at pixel ratio 2 on white, named metamodel_<date>.png', async () => {
        const result = await CanvasExportService.export(plainElement());

        expect(lib.toPng).toHaveBeenCalledTimes(1);
        const options = lib.toPng.mock.calls[0][1];
        expect(options.pixelRatio).toBe(2);
        expect(options.backgroundColor).toBe('#ffffff');
        expect(result.filename).toMatch(new RegExp(`^metamodel_${DATE}\\.png$`));
    });
});

describe('CanvasExportService on a React Flow canvas: the whole diagram, whatever the view', () => {
    /**
     * A viewport drawn at zoom 0.5 with its origin at (300, 100) on screen: 1400 px wide, 700 px on screen.
     * A node at flow (0, 0)-(100, 60) and a vertical edge at flow x 200, y 100-300 (a zero-width box).
     */
    function flowCanvas() {
        const rect = (left: number, top: number, right: number, bottom: number) =>
            ({ left, top, right, bottom, width: right - left, height: bottom - top });
        const node = { getBoundingClientRect: () => rect(300, 100, 350, 130) };
        const edge = { getBoundingClientRect: () => rect(400, 150, 400, 250) };
        const hidden = { getBoundingClientRect: () => rect(0, 0, 0, 0) };
        const viewport = {
            offsetWidth: 1400,
            getBoundingClientRect: () => rect(300, 100, 1000, 538),
            querySelectorAll: (selector: string) => (selector.includes('react-flow__node') ? [node, edge, hidden] : []),
        };
        const canvas = { querySelector: (selector: string) => (selector === '.react-flow__viewport' ? viewport : null) };
        return { canvas: canvas as unknown as HTMLElement, viewport };
    }

    it('renders the viewport fitted to the diagram bounds at zoom 1, not the canvas box', async () => {
        const { canvas, viewport } = flowCanvas();
        await CanvasExportService.export(canvas, { type: 'png' } as any);

        expect(lib.toPng).toHaveBeenCalledTimes(1);
        const [node, options] = lib.toPng.mock.calls[0];
        expect(node).toBe(viewport);
        // flow box (0, 0)-(200, 300), margin 24: x -24, y -24, 248 x 348
        expect(options.width).toBe(248);
        expect(options.height).toBe(348);
        expect(options.style.width).toBe('248px');
        expect(options.style.height).toBe('348px');
        expect(options.style.transform).toBe('translate(24px, 24px) scale(1)');
    });

    it('puts the same fitted viewport on the clipboard blob', async () => {
        const { canvas, viewport } = flowCanvas();
        await CanvasExportService.exportAsBlob(canvas);

        expect(lib.toBlob).toHaveBeenCalledTimes(1);
        const [node, options] = lib.toBlob.mock.calls[0];
        expect(node).toBe(viewport);
        expect(options.width).toBe(248);
        expect(options.height).toBe(348);
        expect(options.style.transform).toBe('translate(24px, 24px) scale(1)');
    });
});

describe('diagramBounds', () => {
    const r = (left: number, top: number, right: number, bottom: number) =>
        ({ left, top, right, bottom, width: right - left, height: bottom - top });

    it('converts screen boxes to flow units through origin and zoom, and adds the margin', () => {
        const b = diagramBounds([r(300, 100, 350, 130), r(400, 150, 400, 250)], { x: 300, y: 100 }, 0.5, 24);
        expect(b).toEqual({ x: -24, y: -24, width: 248, height: 348 });
    });

    it('keeps a zero-width box (a vertical edge) and skips an empty one', () => {
        const b = diagramBounds([r(0, 0, 0, 0), r(50, 10, 50, 90)], { x: 0, y: 0 }, 1, 0);
        expect(b).toEqual({ x: 50, y: 10, width: 0, height: 80 });
    });

    it('is null when nothing is drawn', () => {
        expect(diagramBounds([r(0, 0, 0, 0)], { x: 0, y: 0 }, 1, 24)).toBeNull();
        expect(diagramBounds([], { x: 0, y: 0 }, 1, 24)).toBeNull();
    });
});

describe('routeCanvasExport', () => {
    it('routes the four menu formats to four distinct routes', () => {
        expect(routeCanvasExport('png')).toEqual({ kind: 'download', type: 'png' });
        expect(routeCanvasExport('jpeg')).toEqual({ kind: 'download', type: 'jpeg' });
        expect(routeCanvasExport('svg')).toEqual({ kind: 'download', type: 'svg' });
        expect(routeCanvasExport('clipboard')).toEqual({ kind: 'clipboard' });
    });

    it('refuses a format the menu does not send', () => {
        expect(routeCanvasExport('pdf')).toBeNull();
        expect(routeCanvasExport('')).toBeNull();
    });
});

describe('the EXPORT_CANVAS listener', () => {
    const element = { tag: 'canvas' } as unknown as HTMLElement;
    let target: EventTarget;
    let deps: { resolveCanvas: Mock<CanvasExportDeps['resolveCanvas']>; notify: Mock<CanvasExportDeps['notify']> };
    let exportSpy: MockInstance<typeof CanvasExportService.export>;
    let copySpy: MockInstance<typeof CanvasExportService.copyToClipboard>;

    beforeEach(() => {
        target = new EventTarget();
        deps = {
            resolveCanvas: vi.fn<CanvasExportDeps['resolveCanvas']>(() => ({ element, filename: 'DemoESM' })),
            notify: vi.fn<CanvasExportDeps['notify']>(),
        };
        exportSpy = vi.spyOn(CanvasExportService, 'export').mockResolvedValue({ success: true, filename: 'DemoESM_x.png' });
        copySpy = vi.spyOn(CanvasExportService, 'copyToClipboard').mockResolvedValue(true);
        vi.stubGlobal('ClipboardItem', class {});
        vi.stubGlobal('navigator', { clipboard: { write: vi.fn() } });
    });

    const send = async (format: string) => {
        target.dispatchEvent(new CustomEvent(JjodelEvents.EXPORT_CANVAS, { detail: { format } }));
        await new Promise((resolve) => setTimeout(resolve, 0));
    };

    it.each(['png', 'jpeg', 'svg'] as const)('%s calls export once with that type and the model name', async (format) => {
        installCanvasExportListener(target, deps);
        await send(format);

        expect(exportSpy).toHaveBeenCalledTimes(1);
        expect(exportSpy).toHaveBeenCalledWith(element, { type: format, filename: 'DemoESM' });
        expect(copySpy).not.toHaveBeenCalled();
        expect(deps.notify).toHaveBeenCalledWith('i', 'Export Complete', 'Canvas exported as DemoESM_x.png');
    });

    it('clipboard calls copyToClipboard once and no download', async () => {
        installCanvasExportListener(target, deps);
        await send('clipboard');

        expect(copySpy).toHaveBeenCalledTimes(1);
        expect(copySpy.mock.calls[0][0]).toBe(element);
        expect(exportSpy).not.toHaveBeenCalled();
        expect(deps.notify).toHaveBeenCalledWith('i', 'Copied to Clipboard', 'Canvas image copied to clipboard');
    });

    it('the four formats make four distinct calls', async () => {
        installCanvasExportListener(target, deps);
        for (const format of ['png', 'jpeg', 'svg', 'clipboard']) await send(format);

        const calls = [
            ...exportSpy.mock.calls.map((c) => `export:${c[1]?.type}`),
            ...copySpy.mock.calls.map(() => 'clipboard'),
        ];
        expect(calls.sort()).toEqual(['clipboard', 'export:jpeg', 'export:png', 'export:svg']);
    });

    it('installing twice keeps one listener: one call per event', async () => {
        installCanvasExportListener(target, deps);
        installCanvasExportListener(target, deps);
        await send('png');

        expect(exportSpy).toHaveBeenCalledTimes(1);
    });

    it('with no active canvas says so and exports nothing', async () => {
        deps.resolveCanvas.mockReturnValue(null);
        installCanvasExportListener(target, deps);
        await send('png');

        expect(exportSpy).not.toHaveBeenCalled();
        expect(deps.notify).toHaveBeenCalledTimes(1);
        expect(deps.notify.mock.calls[0][0]).toBe('e');
    });

    it('a failed export shows the error the service returned', async () => {
        exportSpy.mockResolvedValue({ success: false, error: 'boom' });
        installCanvasExportListener(target, deps);
        await send('svg');

        expect(deps.notify).toHaveBeenCalledWith('e', 'Export Failed', 'boom');
    });

    it('without ClipboardItem the copy is refused with a clear alert, before any render', async () => {
        vi.stubGlobal('ClipboardItem', undefined);
        installCanvasExportListener(target, deps);
        await send('clipboard');

        expect(copySpy).not.toHaveBeenCalled();
        expect(deps.notify).toHaveBeenCalledTimes(1);
        const [type, title, message] = deps.notify.mock.calls[0];
        expect([type, title]).toEqual(['e', 'Copy Failed']);
        expect(message).toMatch(/Export as PNG/);
    });

    it('a copy the browser refuses shows a clear alert', async () => {
        copySpy.mockResolvedValue(false);
        installCanvasExportListener(target, deps);
        await send('clipboard');

        const [type, title, message] = deps.notify.mock.calls[0];
        expect([type, title]).toEqual(['e', 'Copy Failed']);
        expect(message).toMatch(/Export as PNG/);
    });
});
