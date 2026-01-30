/**
 * Jjodie RAG (Retrieval Augmented Generation) System
 *
 * This module provides knowledge retrieval capabilities for Jjodie,
 * enabling context-aware responses based on:
 * - Metamodel structure and documentation
 * - Model instances and data
 * - User-provided documentation
 * - JjScript command documentation
 * - Tutorial content
 *
 * Usage:
 * ```typescript
 * import { getIndexer, getRetriever } from '../jjodie/rag';
 *
 * // Index a metamodel
 * const indexer = getIndexer();
 * await indexer.initialize();
 * await indexer.indexMetamodel(metamodelData, projectId);
 *
 * // Search for relevant context
 * const retriever = getRetriever();
 * const result = await retriever.search({
 *   text: 'How do I create a new class?',
 *   topK: 5,
 * });
 *
 * // Use results to augment LLM prompt
 * const context = result.data.results.map(r => r.chunk.content).join('\n');
 * ```
 */

// ============================================
// TYPE EXPORTS
// ============================================

export {
    // Document types
    DocumentSource,
    KnowledgeDocument,
    DocumentMetadata,

    // Chunk types
    DocumentChunk,
    ChunkMetadata,

    // Search types
    SearchQuery,
    SearchResult,
    SearchResponse,

    // Embedding types
    EmbeddingConfig,
    EmbeddingRequest,
    EmbeddingResponse,

    // Indexing types
    IndexingStatus,
    IndexingResult,
    IndexStats,

    // Configuration
    RagConfig,
    DEFAULT_RAG_CONFIG,

    // Utility types
    ProgressCallback,
    Result,
    success,
    failure,
} from './types';

// ============================================
// SERVICE EXPORTS
// ============================================

// Embeddings
export {
    EmbeddingService,
    getEmbeddingService,
    resetEmbeddingService,
} from './embeddings';

// Vector Store
export {
    VectorStore,
    VectorStoreConfig,
    getVectorStore,
    resetVectorStore,
} from './vectorStore';

// Chunker
export {
    Chunker,
    MetamodelChunker,
    CodeChunker,
    TutorialChunker,
    getChunkerForSource,
    getDefaultChunker,
} from './chunker';

// Retriever
export {
    Retriever,
    getRetriever,
    resetRetriever,
} from './retriever';

// Indexer
export {
    Indexer,
    getIndexer,
    resetIndexer,
    generateMetamodelDocument,
    generateClassDocuments,
    generateModelDocument,
    generateDocumentationDocument,
} from './indexer';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { getIndexer } from './indexer';
import { getRetriever } from './retriever';
import { getVectorStore } from './vectorStore';
import { getEmbeddingService } from './embeddings';

/**
 * Initialize the entire RAG system
 */
export async function initializeRagSystem(): Promise<void> {
    const vectorStore = getVectorStore({
        backend: 'indexeddb',
        keyPrefix: 'jjodie_rag_',
        persist: true,
    });

    await vectorStore.initialize();

    const indexer = getIndexer();
    await indexer.initialize();

    console.log('[RAG] System initialized');
}

/**
 * Reset the entire RAG system (for testing or cleanup)
 */
export async function resetRagSystem(): Promise<void> {
    const vectorStore = getVectorStore();
    await vectorStore.clear();

    // Reset all singletons
    const { resetEmbeddingService } = await import('./embeddings');
    const { resetVectorStore } = await import('./vectorStore');
    const { resetRetriever } = await import('./retriever');
    const { resetIndexer } = await import('./indexer');

    resetEmbeddingService();
    resetVectorStore();
    resetRetriever();
    resetIndexer();

    console.log('[RAG] System reset');
}

/**
 * Quick search utility
 */
export async function searchKnowledge(
    query: string,
    options?: {
        topK?: number;
        projectId?: string;
        minScore?: number;
    }
): Promise<string[]> {
    const retriever = getRetriever();
    const result = await retriever.search({
        text: query,
        topK: options?.topK || 5,
        projectId: options?.projectId,
        minScore: options?.minScore || 0.3,
    });

    if (!result.success) {
        console.error('[RAG] Search failed:', result.error);
        return [];
    }

    return result.data.results.map(r => r.chunk.content);
}

/**
 * Get context string for LLM augmentation
 */
export async function getContextForQuery(
    query: string,
    maxTokens: number = 2000
): Promise<string> {
    const retriever = getRetriever();
    const result = await retriever.searchForContext(query, maxTokens);

    if (!result.success) {
        console.error('[RAG] Context retrieval failed:', result.error);
        return '';
    }

    return result.data;
}

/**
 * Index project content (metamodels + models + documentation)
 */
export async function indexProjectContent(
    projectId: string,
    content: {
        metamodels?: Array<{
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
        }>;
        models?: Array<{
            id: string;
            name: string;
            metamodelId?: string;
            instances?: Array<{
                id: string;
                className: string;
                values?: Record<string, unknown>;
            }>;
        }>;
        documentation?: string;
    }
): Promise<void> {
    const indexer = getIndexer();
    await indexer.initialize();

    // Index metamodels
    if (content.metamodels) {
        for (const mm of content.metamodels) {
            await indexer.indexMetamodel(mm, projectId, true);
        }
    }

    // Index models
    if (content.models) {
        for (const model of content.models) {
            await indexer.indexModel(model, projectId);
        }
    }

    // Index documentation
    if (content.documentation) {
        await indexer.indexDocumentation(
            content.documentation,
            'Project Documentation',
            projectId
        );
    }

    console.log(`[RAG] Indexed project ${projectId}`);
}
