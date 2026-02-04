/**
 * Canvas Export Hook
 * Provides easy-to-use methods for exporting canvas as image
 */

import { useState, useCallback, RefObject } from 'react';
import { CanvasExportService, ExportOptions, ExportFormat } from '../services/CanvasExportService';

interface UseCanvasExportReturn {
    /** Export canvas with specified options */
    exportAs: (format: ExportFormat, options?: Partial<ExportOptions>) => Promise<boolean>;
    /** Quick export as PNG */
    exportPng: (options?: Partial<ExportOptions>) => Promise<boolean>;
    /** Quick export as JPEG */
    exportJpeg: (options?: Partial<ExportOptions>) => Promise<boolean>;
    /** Quick export as SVG */
    exportSvg: (options?: Partial<ExportOptions>) => Promise<boolean>;
    /** Copy to clipboard */
    copyToClipboard: () => Promise<boolean>;
    /** Whether export is in progress */
    isExporting: boolean;
    /** Last error message if any */
    error: string | null;
}

export function useCanvasExport(
    canvasRef: RefObject<HTMLElement>,
    defaultOptions?: Partial<ExportOptions>
): UseCanvasExportReturn {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const exportAs = useCallback(async (
        format: ExportFormat,
        options?: Partial<ExportOptions>
    ): Promise<boolean> => {
        if (!canvasRef.current) {
            setError('Canvas element not found');
            return false;
        }

        setIsExporting(true);
        setError(null);

        try {
            const result = await CanvasExportService.export(canvasRef.current, {
                ...defaultOptions,
                ...options,
                type:format,
            });

            if (!result.success) {
                setError(result.error || 'Export failed');
                return false;
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Export failed';
            setError(message);
            return false;
        } finally {
            setIsExporting(false);
        }
    }, [canvasRef, defaultOptions]);

    const exportPng = useCallback((options?: Partial<ExportOptions>) => {
        return exportAs('png', options);
    }, [exportAs]);

    const exportJpeg = useCallback((options?: Partial<ExportOptions>) => {
        return exportAs('jpeg', options);
    }, [exportAs]);

    const exportSvg = useCallback((options?: Partial<ExportOptions>) => {
        return exportAs('svg', options);
    }, [exportAs]);

    const copyToClipboard = useCallback(async (): Promise<boolean> => {
        if (!canvasRef.current) {
            setError('Canvas element not found');
            return false;
        }

        setIsExporting(true);
        setError(null);

        try {
            const success = await CanvasExportService.copyToClipboard(
                canvasRef.current,
                defaultOptions
            );

            if (!success) {
                setError('Failed to copy to clipboard');
                return false;
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Copy failed';
            setError(message);
            return false;
        } finally {
            setIsExporting(false);
        }
    }, [canvasRef, defaultOptions]);

    return {
        exportAs,
        exportPng,
        exportJpeg,
        exportSvg,
        copyToClipboard,
        isExporting,
        error,
    };
}

export default useCanvasExport;
