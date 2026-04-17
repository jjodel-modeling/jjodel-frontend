/**
 * Canvas Export Service
 * Exports metamodel canvas (SVG + HTML) as image
 */

import { toPng, toJpeg, toSvg, toBlob,} from 'html-to-image';
import type { Options as ExportOptions0} from 'html-to-image/src/types.ts';
export type ExportOptions = ExportOptions0;

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'png' | 'jpeg' | 'svg';

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
    pixelRatio: 0.5,
    style: {padding: '5px' }
};

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
            // Find the actual graph element (the SVG container)
            const graphElement = canvasElement.querySelector('.Graph') as HTMLElement || canvasElement;

            // console.log('[CanvasExportService] Exporting element:', graphElement);
            // console.log('[CanvasExportService] Element dimensions:', graphElement.offsetWidth, 'x', graphElement.offsetHeight);

            // Generate image data URL directly from the element
            const dataUrl = await this.generateDataUrl(graphElement, opts);

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
            const graphElement = canvasElement.querySelector('.Graph') as HTMLElement || canvasElement;

            const blob = await toBlob(graphElement, {
                quality: opts.quality,
                pixelRatio: opts.pixelRatio,
                backgroundColor: opts.backgroundColor,
                style: {
                    //transform: 'none',
                    ...opts.style
                },
                filter: this.createFilter(),
            });

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
                return await toSvg(element, exportOptions);
            case 'png': case 'image/png':
            default:
                return await toPng(element, exportOptions);
        }
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
