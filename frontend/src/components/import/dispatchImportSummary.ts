import { ImportSummary } from './ImportSummary.types';
import { JjodelEvents } from '../../events/registry';

export function dispatchImportSummary(summary: ImportSummary): void {
    window.dispatchEvent(
        new CustomEvent(JjodelEvents.IMPORT_SUMMARY_SHOW, { detail: summary })
    );
}
