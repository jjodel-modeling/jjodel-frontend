/**
 * Export/Import Services
 * Handles Ecore and XMI file operations
 */

export { EcoreService, type EcoreExportOptions, type EcoreImportResult } from './EcoreService';
export { XMIService, type XMIExportOptions, type XMIImportResult } from './XMIService';
export {
    JsonModelService,
    type JsonMetamodelRef,
    type JsonClassifierRef,
    type JsonExternalMetamodel,
} from './JsonModelService';
