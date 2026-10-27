/**
 * Canvas Export Service
 * Exports metamodel canvas (SVG + HTML) as image
 */

import { toPng, toJpeg, toSvg, toBlob,} from 'html-to-image';
import type { Options as ExportOptions0} from 'html-to-image/src/types.ts';
import { JjodelEvents } from '../events/registry';
export type ExportOptions = ExportOptions0;

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'png' | 'jpeg' | 'svg';

/** What File > Export Canvas asks for: a download in one format, or a PNG on the clipboard. */
export type CanvasExportRoute = { kind: 'download'; type: ExportFormat } | { kind: 'clipboard' };

/** What the File > Export Canvas listener needs from the app. */
export interface CanvasExportDeps {
    /** The canvas to export and the base of the file name, or null when no canvas is on screen. */
    resolveCanvas: () => { element: HTMLElement; filename: string } | null;
    /** Tells the user how it went (U.alert in the app). */
    notify: (type: 'i' | 'e', title: string, message: string) => void;
}

interface ExportResult {
    success: boolean;
    filename?: string;
    error?: string;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: Partial<ExportOptions> = {
    type: 'image/png',
    quality: 0.95,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    style: {padding: '5px' }
};

/** Margin around the diagram in the image, in flow units (CSS px at zoom 1). */
const FLOW_EXPORT_MARGIN = 24;

/** The React Flow parts that make up the drawing: nodes, edges, edge labels, and what is portalled into the viewport. */
const FLOW_PARTS = '.react-flow__node, .react-flow__edge, .react-flow__edgelabel-renderer > *, .react-flow__viewport-portal > *';

/**
 * The paint html-to-image 1.11.13 does not carry to SVG descendants: it clones an `<svg>` deep and inlines the
 * computed style of the `<svg>` alone (`es/clone-node.js` `cloneSingleNode`, `cloneChildren`), so a path whose stroke
 * comes from a class (the edge paths) renders unpainted.
 */
const SVG_PAINT_PROPERTIES = [
    'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray',
    'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'visibility', 'display', 'color',
    'font-family', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'paint-order',
];

/** Where the installed listener is kept on its target, so installing again replaces it (module reload under HMR). */
const LISTENER_KEY = Symbol.for('jjodel.canvasExportListener');

// ============================================
// FILE > EXPORT CANVAS
// ============================================

/** Routes a File > Export Canvas format (`JjodelEvents.EXPORT_CANVAS` detail) to what it asks for; null when unknown. */
export function routeCanvasExport(format: string): CanvasExportRoute | null {
    switch (format) {
        case 'png':
        case 'jpeg':
        case 'svg':
            return { kind: 'download', type: format };
        case 'clipboard':
            return { kind: 'clipboard' };
        default:
            return null;
    }
}

/**
 * The editor canvas File > Export Canvas exports: the one of the active dock tab that is on screen, preferring the
 * one holding the focus when two panels show one each. `modelId` is the dock tab's id, which is the model's id
 * (TabDataMaker.metamodel and .model).
 */
export function findActiveCanvas(root: ParentNode = document): { element: HTMLElement; modelId: string | null } | null {
    const shown = (Array.from(root.querySelectorAll('.dock-tabpane-active .editor-v2__canvas')) as HTMLElement[])
        .filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0);
    const focused = typeof document !== 'undefined' ? document.activeElement : null;
    const element = shown.find((el) => !!focused && !!el.closest('.dock-tabpane')?.contains(focused)) ?? shown[0];
    if (!element) return null;
    return { element, modelId: element.closest('.dock-tabpane')?.id || null };
}

/**
 * The one listener of File > Export Canvas, for the canvas of every tab, metamodel and model. Installing it again on
 * the same target replaces the handler instead of adding a second one.
 */
export function installCanvasExportListener(target: EventTarget, deps: CanvasExportDeps): void {
    const holder = target as unknown as Record<symbol, EventListener | undefined>;
    const previous = holder[LISTENER_KEY];
    if (previous) target.removeEventListener(JjodelEvents.EXPORT_CANVAS, previous);
    const handler: EventListener = (e) => {
        void runCanvasExport((e as CustomEvent<{ format?: string }>).detail?.format ?? '', deps);
    };
    holder[LISTENER_KEY] = handler;
    target.addEventListener(JjodelEvents.EXPORT_CANVAS, handler);
}

/** One File > Export Canvas request: the route, the call to the service, the alert. */
async function runCanvasExport(format: string, deps: CanvasExportDeps): Promise<void> {
    const route = routeCanvasExport(format);
    if (!route) {
        deps.notify('e', 'Export Failed', `Unknown export format: ${format}`);
        return;
    }
    const canvas = deps.resolveCanvas();
    if (!canvas) {
        deps.notify('e', 'Export Failed', 'Open a metamodel or model canvas to export it');
        return;
    }
    try {
        if (route.kind === 'clipboard') {
            if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
                deps.notify('e', 'Copy Failed', 'This browser does not allow copying images to the clipboard. Use Export as PNG instead.');
                return;
            }
            const success = await CanvasExportService.copyToClipboard(canvas.element, {
                backgroundColor: '#ffffff',
            });
            if (success) {
                deps.notify('i', 'Copied to Clipboard', 'Canvas image copied to clipboard');
            } else {
                deps.notify('e', 'Copy Failed', 'The browser did not let the image reach the clipboard. Use Export as PNG instead.');
            }
        } else {
            const result = await CanvasExportService.export(canvas.element, { type: route.type, filename: canvas.filename } as Partial<ExportOptions>);
            if (result.success) {
                deps.notify('i', 'Export Complete', `Canvas exported as ${result.filename}`);
            } else {
                deps.notify('e', 'Export Failed', result.error || 'Failed to export canvas');
            }
        }
    } catch (error) {
        console.error('[CanvasExportService] Export failed:', error);
        deps.notify('e', 'Export Failed', 'An error occurred during export');
    }
}

// ============================================
// DIAGRAM GEOMETRY
// ============================================

type ScreenBox = { left: number; top: number; right: number; bottom: number; width: number; height: number };

/**
 * The diagram's box in flow units, margin included, from the screen boxes of its parts under a viewport whose flow
 * origin sits at `origin` on screen at `zoom`. An empty box (display none) is skipped; a zero-width one (a vertical
 * edge) is not. Null when nothing is drawn.
 */
export function diagramBounds(
    boxes: ScreenBox[],
    origin: { x: number; y: number },
    zoom: number,
    margin: number,
): { x: number; y: number; width: number; height: number } | null {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const b of boxes) {
        if (!b.width && !b.height) continue;
        x0 = Math.min(x0, (b.left - origin.x) / zoom);
        y0 = Math.min(y0, (b.top - origin.y) / zoom);
        x1 = Math.max(x1, (b.right - origin.x) / zoom);
        y1 = Math.max(y1, (b.bottom - origin.y) / zoom);
    }
    if (x0 === Infinity) return null;
    const x = Math.floor(x0 - margin);
    const y = Math.floor(y0 - margin);
    return { x, y, width: Math.ceil(x1 + margin) - x, height: Math.ceil(y1 + margin) - y };
}

/**
 * Writes on every SVG descendant of `root` the computed paint it does not already carry inline (see
 * SVG_PAINT_PROPERTIES), and returns the function that removes exactly what was written. The values are the computed
 * ones, so nothing moves on screen for the length of a render.
 */
export function inlineSvgPaint(root: Element): () => void {
    const written: [SVGElement, string][] = [];
    root.querySelectorAll('svg *').forEach((node) => {
        const el = node as SVGElement;
        if (!el.style) return;
        const computed = getComputedStyle(el);
        for (const name of SVG_PAINT_PROPERTIES) {
            if (el.style.getPropertyValue(name)) continue;
            el.style.setProperty(name, computed.getPropertyValue(name));
            written.push([el, name]);
        }
    });
    return () => written.forEach(([el, name]) => el.style.removeProperty(name));
}

// ============================================
// CANVAS EXPORT SERVICE
// ============================================

export class CanvasExportService {

    /**
     * Export canvas element as image and trigger download
     */
    static async export(
        canvasElement: HTMLElement,
        options: Partial<ExportOptions> = {}
    ): Promise<ExportResult> {
        const opts = { ...DEFAULT_OPTIONS, ...options } as ExportOptions;

        try {
            // The node to render: a React Flow canvas renders its viewport fitted to the diagram
            const target = this.renderTarget(canvasElement, opts);

            // console.log('[CanvasExportService] Exporting element:', graphElement);
            // console.log('[CanvasExportService] Element dimensions:', graphElement.offsetWidth, 'x', graphElement.offsetHeight);

            // Generate image data URL directly from the element
            let dataUrl: string;
            try {
                dataUrl = await this.generateDataUrl(target.node, target.options);
            } finally {
                target.restore();
            }

            // Generate filename
            const filename = this.generateFilename(opts);

            // Trigger download
            this.downloadImage(dataUrl, filename);

            return { success: true, filename };
        } catch (error) {
            console.error('[CanvasExportService] Export failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Export failed'
            };
        }
    }

    /**
     * Export canvas and return as Blob (for clipboard, upload, etc.)
     */
    static async exportAsBlob(
        canvasElement: HTMLElement,
        options: Partial<ExportOptions> = {}
    ): Promise<Blob | null> {
        const opts = { ...DEFAULT_OPTIONS, ...options } as ExportOptions;

        try {
            const target = this.renderTarget(canvasElement, opts);

            let blob: Blob | null;
            try {
                blob = await toBlob(target.node, {
                    quality: opts.quality,
                    pixelRatio: opts.pixelRatio,
                    backgroundColor: opts.backgroundColor,
                    width: target.options.width,
                    height: target.options.height,
                    style: {
                        //transform: 'none',
                        ...target.options.style
                    },
                    filter: this.createFilter(),
                });
            } finally {
                target.restore();
            }

            return blob;
        } catch (error) {
            console.error('[CanvasExportService] Blob export failed:', error);
            return null;
        }
    }

    /**
     * Copy canvas to clipboard
     */
    static async copyToClipboard(
        canvasElement: HTMLElement,
        options: Partial<ExportOptions> = {}
    ): Promise<boolean> {
        try {
            const blob = await this.exportAsBlob(canvasElement, { ...options, type: 'image/png' });

            if (!blob) {
                throw new Error('Failed to generate image blob');
            }

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            return true;
        } catch (error) {
            console.error('[CanvasExportService] Copy to clipboard failed:', error);
            return false;
        }
    }

    // ========================================
    // PRIVATE METHODS
    // ========================================

    /**
     * The node html-to-image renders, the options that fit it, and what undoes the preparation. A React Flow canvas
     * renders its `.react-flow__viewport` fitted to the diagram at zoom 1, whatever the pan and zoom on screen: the
     * canvas background, the dot grid and the minimap stay out, and the SVG paint is inlined for the render. Any
     * other element renders as before (`.Graph` inside it, or the element itself).
     */
    private static renderTarget(
        canvasElement: HTMLElement,
        opts: ExportOptions
    ): { node: HTMLElement; options: ExportOptions; restore: () => void } {
        const viewport = canvasElement.querySelector('.react-flow__viewport') as HTMLElement | null;
        if (viewport && viewport.offsetWidth > 0) {
            const screen = viewport.getBoundingClientRect();
            const zoom = screen.width / viewport.offsetWidth;
            const parts = Array.from(viewport.querySelectorAll(FLOW_PARTS)).filter((el) => {
                const cs = getComputedStyle(el);
                return cs.visibility !== 'hidden' && cs.display !== 'none';
            });
            const b = diagramBounds(parts.map((el) => el.getBoundingClientRect()), { x: screen.left, y: screen.top }, zoom, FLOW_EXPORT_MARGIN);
            if (b) {
                return {
                    node: viewport,
                    options: {
                        ...opts,
                        width: b.width,
                        height: b.height,
                        style: {
                            width: `${b.width}px`,
                            height: `${b.height}px`,
                            transform: `translate(${-b.x}px, ${-b.y}px) scale(1)`,
                        },
                    },
                    restore: inlineSvgPaint(viewport),
                };
            }
        }
        return {
            node: canvasElement.querySelector('.Graph') as HTMLElement || canvasElement,
            options: opts,
            restore: () => {},
        };
    }

    /**
     * Create filter function to exclude certain elements
     */
    private static createFilter(): (node: HTMLElement) => boolean {
        return (node: HTMLElement) => {
            // Skip hidden elements
            if (node.style?.display === 'none') return false;
            if (node.style?.visibility === 'hidden') return false;
            // Skip certain classes that shouldn't be exported
            if (node.classList?.contains('no-export')) return false;
            if (node.classList?.contains('toolbar')) return false;
            if (node.classList?.contains('context-menu')) return false;
            if (node.classList?.contains('features-palette')) return false;
            // Skip edge points and handles (small squares used for editing)
            if (node.classList?.contains('EdgePoint')) return false;
            if (node.classList?.contains('edge-point')) return false;
            if (node.classList?.contains('resize-handle')) return false;
            if (node.classList?.contains('handle')) return false;
            if (node.classList?.contains('grip')) return false;
            // Skip selection UI
            if (node.classList?.contains('selected-indicator')) return false;
            if (node.classList?.contains('selection-box')) return false;
            // Check data attributes for edge points
            if (node.getAttribute?.('data-nodetype') === 'EdgePoint') return false;
            return true;
        };
    }

    /**
     * Generate data URL from element
     */
    private static async generateDataUrl(
        element: HTMLElement,
        options: ExportOptions
    ): Promise<string> {
        const exportOptions = {
            ...options,
            style: {
                // Reset any transforms that might affect the export
                transform: 'none',
                ...(options.style || {})
            },
            filter: this.createFilter(),
        };

        switch (options.type) {
            case 'jpeg': case 'image/jpeg':
                return await toJpeg(element, exportOptions);
            case 'svg': case 'image/svg':
                return this.withSvgBackground(await toSvg(element, exportOptions), options.backgroundColor);
            case 'png': case 'image/png':
            default:
                return await toPng(element, exportOptions);
        }
    }

    /**
     * PNG and JPEG paint the background on the whole canvas; toSvg paints it on the rendered node only, and the fitted
     * React Flow viewport is translated, so its background leaves a band of the image transparent. A rect as the first
     * child of the `<svg>` (under the foreignObject) fills the whole image. The data URL is html-to-image's
     * `data:image/svg+xml;charset=utf-8,` + the URI-encoded `<svg ...>`: the rect goes after the first encoded `>`.
     */
    private static withSvgBackground(dataUrl: string, color?: string): string {
        if (!color) return dataUrl;
        const open = dataUrl.indexOf('%3Csvg');
        const end = open < 0 ? -1 : dataUrl.indexOf('%3E', open);
        if (end < 0 || dataUrl.slice(end - 3, end) === '%2F') return dataUrl;
        const rect = encodeURIComponent(`<rect width="100%" height="100%" fill="${color}"/>`);
        return dataUrl.slice(0, end + 3) + rect + dataUrl.slice(end + 3);
    }

    /**
     * Generate filename based on options
     */
    private static generateFilename(options: ExportOptions): string {
        const base = (options as any).filename || 'metamodel';
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        let extension = options.type;
        if (typeof extension !== 'string') extension = 'png';
        if (extension.includes('/')) {
            let arr = extension.split('/').filter(e=>!!e);
            extension = arr[arr.length - 1];
        }

        return `${base}_${timestamp}.${extension}`;
    }

    /**
     * Trigger file download
     */
    private static downloadImage(dataUrl: string, filename: string): void {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }
}

export default CanvasExportService;
