/**
 * Indexer for Jjodie RAG System
 *
 * Manages the full indexing pipeline:
 * 1. Convert source data (metamodels, models, docs) to KnowledgeDocuments
 * 2. Chunk documents
 * 3. Generate embeddings
 * 4. Store in vector store
 *
 * Also handles incremental updates and re-indexing.
 */

import {
    KnowledgeDocument,
    DocumentChunk,
    DocumentSource,
    DocumentMetadata,
    IndexingResult,
    IndexingStatus,
    IndexStats,
    ProgressCallback,
    Result,
    success,
    failure,
} from './types';
import { EmbeddingService, getEmbeddingService } from './embeddings';
import { VectorStore, getVectorStore } from './vectorStore';
import { Chunker, getChunkerForSource, getDefaultChunker } from './chunker';

// ============================================
// TYPES
// ============================================

interface IndexerConfig {
    batchSize: number;
    autoInitialize: boolean;
}

const DEFAULT_INDEXER_CONFIG: IndexerConfig = {
    batchSize: 10,
    autoInitialize: true,
};

/**
 * Raw metamodel data structure
 */
interface MetamodelData {
    id: string;
    name: string;
    classes?: Array<{
        id: string;
        name: string;
        attributes?: Array<{ name: string; type: string }>;
        references?: Array<{ name: string; target: string }>;
        operations?: Array<{ name: string; returnType?: string }>;
    }>;
    documentation?: string;
}

/**
 * Raw model data structure
 */
interface ModelData {
    id: string;
    name: string;
    metamodelId?: string;
    instances?: Array<{
        id: string;
        className: string;
        values?: Record<string, unknown>;
    }>;
}

// ============================================
// DOCUMENT GENERATORS
// ============================================

/**
 * Generate KnowledgeDocument from a metamodel
 */
function generateMetamodelDocument(metamodel: MetamodelData, projectId?: string): KnowledgeDocument {
    const parts: string[] = [];

    parts.push(`# Metamodel: ${metamodel.name}`);
    parts.push('');

    if (metamodel.documentation) {
        parts.push(metamodel.documentation);
        parts.push('');
    }

    if (metamodel.classes && metamodel.classes.length > 0) {
        parts.push(`## Classes (${metamodel.classes.length})`);
        parts.push('');

        for (const cls of metamodel.classes) {
            parts.push(`### ${cls.name}`);

            if (cls.attributes && cls.attributes.length > 0) {
                parts.push('**Attributes:**');
                for (const attr of cls.attributes) {
                    parts.push(`- ${attr.name}: ${attr.type}`);
                }
            }

            if (cls.references && cls.references.length > 0) {
                parts.push('**References:**');
                for (const ref of cls.references) {
                    parts.push(`- ${ref.name} -> ${ref.target}`);
                }
            }

            if (cls.operations && cls.operations.length > 0) {
                parts.push('**Operations:**');
                for (const op of cls.operations) {
                    parts.push(`- ${op.name}()${op.returnType ? `: ${op.returnType}` : ''}`);
                }
            }

            parts.push('');
        }
    }

    const metadata: DocumentMetadata = {
        projectId,
        metamodelId: metamodel.id,
        elementType: 'metamodel',
        tags: ['metamodel', 'structure'],
    };

    return {
        id: `metamodel_${metamodel.id}`,
        title: `Metamodel: ${metamodel.name}`,
        content: parts.join('\n'),
        source: 'metamodel',
        metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

/**
 * Generate KnowledgeDocuments for individual classes in a metamodel
 */
function generateClassDocuments(metamodel: MetamodelData, projectId?: string): KnowledgeDocument[] {
    if (!metamodel.classes) return [];

    return metamodel.classes.map(cls => {
        const parts: string[] = [];

        parts.push(`# Class: ${cls.name}`);
        parts.push(`Part of metamodel: ${metamodel.name}`);
        parts.push('');

        if (cls.attributes && cls.attributes.length > 0) {
            parts.push('## Attributes');
            for (const attr of cls.attributes) {
                parts.push(`- **${attr.name}**: ${attr.type}`);
            }
            parts.push('');
        }

        if (cls.references && cls.references.length > 0) {
            parts.push('## References');
            for (const ref of cls.references) {
                parts.push(`- **${ref.name}** -> ${ref.target}`);
            }
            parts.push('');
        }

        if (cls.operations && cls.operations.length > 0) {
            parts.push('## Operations');
            for (const op of cls.operations) {
                const signature = `${op.name}()${op.returnType ? `: ${op.returnType}` : ''}`;
                parts.push(`- **${signature}**`);
            }
            parts.push('');
        }

        const metadata: DocumentMetadata = {
            projectId,
            metamodelId: metamodel.id,
            elementType: 'class',
            elementId: cls.id,
            tags: ['class', 'metamodel', cls.name.toLowerCase()],
        };

        return {
            id: `class_${metamodel.id}_${cls.id}`,
            title: `Class: ${cls.name}`,
            content: parts.join('\n'),
            source: 'metamodel' as DocumentSource,
            metadata,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    });
}

/**
 * Generate KnowledgeDocument from model data
 */
function generateModelDocument(model: ModelData, projectId?: string): KnowledgeDocument {
    const parts: string[] = [];

    parts.push(`# Model: ${model.name}`);
    parts.push('');

    if (model.instances && model.instances.length > 0) {
        parts.push(`## Instances (${model.instances.length})`);
        parts.push('');

        // Group by class
        const byClass = new Map<string, typeof model.instances>();
        for (const inst of model.instances) {
            const existing = byClass.get(inst.className) || [];
            existing.push(inst);
            byClass.set(inst.className, existing);
        }

        for (const [className, instances] of byClass) {
            parts.push(`### ${className} (${instances.length} instances)`);
            for (const inst of instances.slice(0, 5)) { // Limit to 5 examples
                if (inst.values && Object.keys(inst.values).length > 0) {
                    const values = Object.entries(inst.values)
                        .map(([k, v]) => `${k}=${v}`)
                        .join(', ');
                    parts.push(`- ${inst.id}: ${values}`);
                } else {
                    parts.push(`- ${inst.id}`);
                }
            }
            if (instances.length > 5) {
                parts.push(`- ... and ${instances.length - 5} more`);
            }
            parts.push('');
        }
    }

    const metadata: DocumentMetadata = {
        projectId,
        modelId: model.id,
        metamodelId: model.metamodelId,
        elementType: 'model',
        tags: ['model', 'instances'],
    };

    return {
        id: `model_${model.id}`,
        title: `Model: ${model.name}`,
        content: parts.join('\n'),
        source: 'model',
        metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

/**
 * Generate KnowledgeDocument from plain documentation
 */
function generateDocumentationDocument(
    content: string,
    title: string,
    projectId?: string,
    tags?: string[]
): KnowledgeDocument {
    const metadata: DocumentMetadata = {
        projectId,
        elementType: 'documentation',
        tags: ['documentation', ...(tags || [])],
    };

    return {
        id: `doc_${projectId || 'global'}_${Date.now()}`,
        title,
        content,
        source: 'documentation',
        metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

// ============================================
// INDEXER CLASS
// ============================================

/**
 * Main Indexer class
 */
export class Indexer {
    private config: IndexerConfig;
    private embeddingService: EmbeddingService;
    private vectorStore: VectorStore;
    private chunker: Chunker;
    private documentRegistry: Map<string, KnowledgeDocument> = new Map();
    private initialized = false;

    constructor(
        config?: Partial<IndexerConfig>,
        embeddingService?: EmbeddingService,
        vectorStore?: VectorStore
    ) {
        this.config = { ...DEFAULT_INDEXER_CONFIG, ...config };
        this.embeddingService = embeddingService || getEmbeddingService();
        this.vectorStore = vectorStore || getVectorStore();
        this.chunker = getDefaultChunker();
    }

    /**
     * Initialize the indexer
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        await this.vectorStore.initialize();
        this.initialized = true;

        console.log('[Indexer] Initialized');
    }

    /**
     * Ensure initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized && this.config.autoInitialize) {
            await this.initialize();
        }
    }

    /**
     * Index a single document
     */
    async indexDocument(
        document: KnowledgeDocument,
        onProgress?: ProgressCallback
    ): Promise<Result<IndexingResult>> {
        await this.ensureInitialized();
        const startTime = Date.now();

        try {
            // Get appropriate chunker for document type
            const chunker = getChunkerForSource(document.source);

            // Chunk the document
            const { chunks } = chunker.chunk(document);

            if (chunks.length === 0) {
                return success({
                    status: 'completed',
                    documentId: document.id,
                    chunksCreated: 0,
                    indexTimeMs: Date.now() - startTime,
                });
            }

            // Generate embeddings
            const contents = chunks.map(c => c.content);
            const embeddingResult = await this.embeddingService.embed({ texts: contents });

            if (!embeddingResult.success) {
                return failure(embeddingResult.error);
            }

            // Store in vector store
            for (let i = 0; i < chunks.length; i++) {
                chunks[i].embedding = embeddingResult.data.embeddings[i];
                await this.vectorStore.add(chunks[i], embeddingResult.data.embeddings[i]);

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: chunks.length,
                        message: `Indexed chunk ${i + 1}/${chunks.length}`,
                    });
                }
            }

            // Store document reference
            this.documentRegistry.set(document.id, document);

            return success({
                status: 'completed',
                documentId: document.id,
                chunksCreated: chunks.length,
                indexTimeMs: Date.now() - startTime,
            });
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Index multiple documents
     */
    async indexDocuments(
        documents: KnowledgeDocument[],
        onProgress?: ProgressCallback
    ): Promise<Result<IndexingResult[]>> {
        await this.ensureInitialized();

        const results: IndexingResult[] = [];
        let processedCount = 0;

        for (const doc of documents) {
            const result = await this.indexDocument(doc, (progress) => {
                if (onProgress) {
                    onProgress({
                        current: processedCount + progress.current / progress.total,
                        total: documents.length,
                        message: `Document ${processedCount + 1}/${documents.length}: ${progress.message}`,
                    });
                }
            });

            if (result.success) {
                results.push(result.data);
            } else {
                results.push({
                    status: 'failed',
                    documentId: doc.id,
                    chunksCreated: 0,
                    error: result.error.message,
                    indexTimeMs: 0,
                });
            }

            processedCount++;
        }

        return success(results);
    }

    /**
     * Index a metamodel
     */
    async indexMetamodel(
        metamodel: MetamodelData,
        projectId?: string,
        includeClasses: boolean = true,
        onProgress?: ProgressCallback
    ): Promise<Result<IndexingResult[]>> {
        const documents: KnowledgeDocument[] = [];

        // Generate main metamodel document
        documents.push(generateMetamodelDocument(metamodel, projectId));

        // Optionally generate individual class documents
        if (includeClasses) {
            documents.push(...generateClassDocuments(metamodel, projectId));
        }

        return this.indexDocuments(documents, onProgress);
    }

    /**
     * Index a model
     */
    async indexModel(
        model: ModelData,
        projectId?: string,
        onProgress?: ProgressCallback
    ): Promise<Result<IndexingResult>> {
        const document = generateModelDocument(model, projectId);
        return this.indexDocument(document, onProgress);
    }

    /**
     * Index plain documentation
     */
    async indexDocumentation(
        content: string,
        title: string,
        projectId?: string,
        tags?: string[],
        onProgress?: ProgressCallback
    ): Promise<Result<IndexingResult>> {
        const document = generateDocumentationDocument(content, title, projectId, tags);
        return this.indexDocument(document, onProgress);
    }

    /**
     * Remove a document from the index
     */
    async removeDocument(documentId: string): Promise<Result<number>> {
        await this.ensureInitialized();

        try {
            const result = await this.vectorStore.deleteByDocument(documentId);
            if (result.success) {
                this.documentRegistry.delete(documentId);
            }
            return result;
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Re-index a document (remove and re-add)
     */
    async reindexDocument(
        document: KnowledgeDocument,
        onProgress?: ProgressCallback
    ): Promise<Result<IndexingResult>> {
        // Remove existing
        await this.removeDocument(document.id);

        // Re-index
        return this.indexDocument(document, onProgress);
    }

    /**
     * Clear all indexed data
     */
    async clearAll(): Promise<Result<void>> {
        await this.ensureInitialized();

        try {
            const result = await this.vectorStore.clear();
            if (result.success) {
                this.documentRegistry.clear();
            }
            return result;
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Get index statistics
     */
    getStats(): IndexStats {
        return this.vectorStore.getStats();
    }

    /**
     * Get all indexed document IDs
     */
    getIndexedDocumentIds(): string[] {
        return Array.from(this.documentRegistry.keys());
    }

    /**
     * Check if a document is indexed
     */
    isDocumentIndexed(documentId: string): boolean {
        return this.documentRegistry.has(documentId);
    }

    /**
     * Get a document by ID
     */
    getDocument(documentId: string): KnowledgeDocument | null {
        return this.documentRegistry.get(documentId) || null;
    }
}

// ============================================
// SINGLETON
// ============================================

let indexerInstance: Indexer | null = null;

/**
 * Get the singleton indexer instance
 */
export function getIndexer(): Indexer {
    if (!indexerInstance) {
        indexerInstance = new Indexer();
    }
    return indexerInstance;
}

/**
 * Reset the indexer (useful for testing)
 */
export function resetIndexer(): void {
    indexerInstance = null;
}

// ============================================
// EXPORTS
// ============================================

export {
    generateMetamodelDocument,
    generateClassDocuments,
    generateModelDocument,
    generateDocumentationDocument,
};

export default Indexer;
