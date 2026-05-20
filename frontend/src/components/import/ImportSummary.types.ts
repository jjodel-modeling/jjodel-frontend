export type ImportStatus = 'success' | 'success-with-warnings' | 'error';

export interface EcoreImportSummary {
    kind: 'metamodel';
    fileName: string;
    status: ImportStatus;
    // Identity
    modelName: string;
    rootPackageName: string;
    rootPackageNsURI: string;
    // Statistics
    packageCount: number;
    classCount: number;
    attributeCount: number;
    referenceCount: number;
    enumCount: number;
    dataTypeCount: number;
    // Diagnostics
    warnings: string[];
    errorMessage?: string;
}

export interface XmiImportSummary {
    kind: 'model';
    fileName: string;
    status: ImportStatus;
    // Identity
    modelName: string;
    metamodelName: string;
    metamodelNsURI: string;
    xmiPattern: 'wrapper' | 'single-root' | 'unknown';
    // Statistics
    rootObjectCount: number;
    nestedObjectCount: number;
    valueCount: number;
    // Diagnostics
    warnings: string[];
    errorMessage?: string;
}

export type ImportSummary = EcoreImportSummary | XmiImportSummary;
