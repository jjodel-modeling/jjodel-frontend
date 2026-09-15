/**
 * RAG (Retrieval Augmented Generation) Type Definitions for Jjodie
 *
 * This module defines the core types used throughout the RAG system
 * for knowledge retrieval and context augmentation.
 */

// ============================================
// DOCUMENT TYPES
// ============================================

/**
 * Source types for knowledge documents
 */
export type DocumentSource =
    | 'metamodel'      // Generated from metamodel structure
    | 'model'          // Generated from model instances
    | 'documentation'  // User-provided documentation
    | 'jjscript'       // JjScript command documentation
    | 'tutorial'       // Tutorial content
    | 'user_defined';  // Custom user-added knowledge

/**
 * Represents a knowledge document in the RAG system
 */
export interface KnowledgeDocument {
    /** Unique identifier for the document */
    id: string;

    /** Document title or name */
    title: string;

    /** Full text content of the document */
    content: string;

    /** Source type of the document */
    source: DocumentSource;

    /** Additional metadata */
    metadata: DocumentMetadata;

    /** Timestamp when document was created/indexed */
    createdAt: number;

    /** Timestamp when document was last updated */
    updatedAt: number;
}

/**
 * Metadata associated with a knowledge document
 */
export interface DocumentMetadata {
    /** Project ID this document belongs to (if applicable) */
    projectId?: string;

    /** Metamodel ID (if source is metamodel) */
    metamodelId?: string;

    /** Model ID (if source is model) */
    modelId?: string;

    /** Element type (class, attribute, reference, etc.) */
    elementType?: string;

    /** Element ID within the model/metamodel */
    elementId?: string;

    /** Tags for categorization */
    tags?: string[];

    /** Language of the content */
    language?: string;

    /** Custom key-value pairs */
    [key: string]: unknown;
}

// ============================================
// CHUNK TYPES
// ============================================

/**
 * Represents a chunk of a document after splitting
 */
export interface DocumentChunk {
    /** Unique identifier for the chunk */
    id: string;

    /** Reference to parent document ID */
    documentId: string;

    /** Chunk text content */
    content: string;

    /** Position index within the document (0-based) */
    index: number;

    /** Character offset start in original document */
    startOffset: number;

    /** Character offset end in original document */
    endOffset: number;

    /** Embedding vector (populated after embedding) */
    embedding?: number[];

    /** Inherited metadata from parent document */
    metadata: ChunkMetadata;
}

/**
 * Metadata for a document chunk
 */
export interface ChunkMetadata extends DocumentMetadata {
    /** Parent document title */
    documentTitle: string;

    /** Source of the parent document */
    documentSource: DocumentSource;

    /** Total chunks in parent document */
    totalChunks: number;
}

// ============================================
// SEARCH TYPES
// ============================================

/**
 * Search query for the RAG system
 */
export interface SearchQuery {
    /** Query text */
    text: string;

    /** Maximum number of results to return */
    topK?: number;

    /** Minimum similarity threshold (0-1) */
    minScore?: number;

    /** Filter by document sources */
    sources?: DocumentSource[];

    /** Filter by project ID */
    projectId?: string;

    /** Filter by tags */
    tags?: string[];

    /** Include metadata in results */
    includeMetadata?: boolean;
}

/**
 * A single search result
 */
export interface SearchResult {
    /** The matched chunk */
    chunk: DocumentChunk;

    /** Similarity score (0-1, higher is better) */
    score: number;

    /** Highlighted content (if available) */
    highlights?: string[];
}

/**
 * Response from a search operation
 */
export interface SearchResponse {
    /** Array of search results */
    results: SearchResult[];

    /** Total number of matches found */
    totalMatches: number;

    /** Time taken to search (ms) */
    searchTimeMs: number;

    /** Query that was executed */
    query: SearchQuery;
}

// ============================================
// EMBEDDING TYPES
// ============================================

/**
 * Embedding model configuration
 */
export interface EmbeddingConfig {
    /** Model identifier */
    model: string;

    /** Dimension of output vectors */
    dimensions: number;

    /** Maximum tokens per embedding request */
    maxTokens: number;

    /** Batch size for bulk embedding */
    batchSize: number;
}

/**
 * Request to generate embeddings
 */
export interface EmbeddingRequest {
    /** Texts to embed */
    texts: string[];

    /** Model to use (optional, uses default) */
    model?: string;
}

/**
 * Response from embedding generation
 */
export interface EmbeddingResponse {
    /** Generated embeddings (same order as input texts) */
    embeddings: number[][];

    /** Model used */
    model: string;

    /** Total tokens processed */
    tokensUsed: number;
}

// ============================================
// INDEXING TYPES
// ============================================

/**
 * Status of an indexing operation
 */
export type IndexingStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed';

/**
 * Result of an indexing operation
 */
export interface IndexingResult {
    /** Status of the operation */
    status: IndexingStatus;

    /** Document ID that was indexed */
    documentId: string;

    /** Number of chunks created */
    chunksCreated: number;

    /** Error message (if failed) */
    error?: string;

    /** Time taken to index (ms) */
    indexTimeMs: number;
}

/**
 * Statistics about the current index
 */
export interface IndexStats {
    /** Total documents in index */
    totalDocuments: number;

    /** Total chunks in index */
    totalChunks: number;

    /** Index size in bytes (approximate) */
    sizeBytes: number;

    /** Last update timestamp */
    lastUpdated: number;

    /** Documents by source type */
    documentsBySource: Record<DocumentSource, number>;
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * RAG system configuration
 */
export interface RagConfig {
    /** Chunking configuration */
    chunking: {
        /** Target chunk size in characters */
        chunkSize: number;

        /** Overlap between chunks in characters */
        chunkOverlap: number;

        /** Minimum chunk size (won't split below this) */
        minChunkSize: number;

        /** Split on these delimiters (in order of preference) */
        splitDelimiters: string[];
    };

    /** Embedding configuration */
    embedding: EmbeddingConfig;

    /** Search configuration */
    search: {
        /** Default number of results */
        defaultTopK: number;

        /** Default minimum score threshold */
        defaultMinScore: number;

        /** Enable hybrid search (semantic + keyword) */
        hybridSearch: boolean;

        /** Weight for semantic search in hybrid mode (0-1) */
        semanticWeight: number;
    };

    /** Storage configuration */
    storage: {
        /** Storage backend type */
        backend: 'memory' | 'indexeddb' | 'localStorage';

        /** Key prefix for storage */
        keyPrefix: string;

        /** Enable persistence */
        persist: boolean;
    };
}

/**
 * Default RAG configuration
 */
export const DEFAULT_RAG_CONFIG: RagConfig = {
    chunking: {
        chunkSize: 512,
        chunkOverlap: 50,
        minChunkSize: 100,
        splitDelimiters: ['\n\n', '\n', '. ', ' '],
    },
    embedding: {
        model: 'text-embedding-local',
        dimensions: 384,
        maxTokens: 512,
        batchSize: 32,
    },
    search: {
        defaultTopK: 5,
        defaultMinScore: 0.5,
        hybridSearch: true,
        semanticWeight: 0.7,
    },
    storage: {
        backend: 'indexeddb',
        keyPrefix: 'jjodie_rag_',
        persist: true,
    },
};

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Progress callback for long-running operations
 */
export type ProgressCallback = (progress: {
    current: number;
    total: number;
    message?: string;
}) => void;

/**
 * Generic result type for operations that can fail
 */
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Create a success result
 */
export function success<T>(data: T): Result<T, never> {
    return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure<E>(error: E): Result<never, E> {
    return { success: false, error };
}
