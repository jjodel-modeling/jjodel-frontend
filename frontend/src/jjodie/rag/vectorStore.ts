/**
 * Vector Store for Jjodie RAG System
 *
 * Provides efficient storage and retrieval of document chunks
 * with their embeddings. Supports multiple storage backends:
 * - Memory (fast, volatile)
 * - IndexedDB (persistent, browser-based)
 * - LocalStorage (persistent, limited size)
 */

import {
    DocumentChunk,
    DocumentSource,
    IndexStats,
    Result,
    success,
    failure,
} from './types';
import { EmbeddingService } from './embeddings';

// ============================================
// TYPES
// ============================================

interface VectorEntry {
    chunk: DocumentChunk;
    embedding: number[];
}

interface StorageBackend {
    save(key: string, data: unknown): Promise<void>;
    load<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
}

interface SearchOptions {
    topK?: number;
    minScore?: number;
    sources?: DocumentSource[];
    projectId?: string;
    tags?: string[];
}

interface SearchHit {
    chunk: DocumentChunk;
    score: number;
}

// ============================================
// STORAGE BACKENDS
// ============================================

/**
 * In-memory storage backend
 */
class MemoryBackend implements StorageBackend {
    private store = new Map<string, unknown>();

    async save(key: string, data: unknown): Promise<void> {
        this.store.set(key, data);
    }

    async load<T>(key: string): Promise<T | null> {
        return (this.store.get(key) as T) || null;
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async clear(): Promise<void> {
        this.store.clear();
    }

    async keys(): Promise<string[]> {
        return Array.from(this.store.keys());
    }
}

/**
 * IndexedDB storage backend
 */
class IndexedDBBackend implements StorageBackend {
    private dbName: string;
    private storeName = 'vectors';
    private db: IDBDatabase | null = null;

    constructor(dbName: string = 'jjodie_rag') {
        this.dbName = dbName;
    }

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async save(key: string, data: unknown): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put(data, key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async load<T>(key: string): Promise<T | null> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    async delete(key: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.delete(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async clear(): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async keys(): Promise<string[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.getAllKeys();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result as string[]);
        });
    }
}

/**
 * LocalStorage backend (fallback)
 */
class LocalStorageBackend implements StorageBackend {
    private prefix: string;

    constructor(prefix: string = 'jjodie_rag_') {
        this.prefix = prefix;
    }

    async save(key: string, data: unknown): Promise<void> {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
        } catch (e) {
            console.warn('[LocalStorageBackend] Storage full or unavailable:', e);
            throw e;
        }
    }

    async load<T>(key: string): Promise<T | null> {
        const item = localStorage.getItem(this.prefix + key);
        if (!item) return null;
        try {
            return JSON.parse(item) as T;
        } catch {
            return null;
        }
    }

    async delete(key: string): Promise<void> {
        localStorage.removeItem(this.prefix + key);
    }

    async clear(): Promise<void> {
        const keys = await this.keys();
        for (const key of keys) {
            localStorage.removeItem(this.prefix + key);
        }
    }

    async keys(): Promise<string[]> {
        const allKeys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                allKeys.push(key.slice(this.prefix.length));
            }
        }
        return allKeys;
    }
}

// ============================================
// VECTOR STORE
// ============================================

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
    backend: 'memory' | 'indexeddb' | 'localStorage';
    keyPrefix: string;
    persist: boolean;
}

const DEFAULT_CONFIG: VectorStoreConfig = {
    backend: 'memory',
    keyPrefix: 'jjodie_rag_',
    persist: false,
};

/**
 * Main Vector Store class
 */
export class VectorStore {
    private config: VectorStoreConfig;
    private backend: StorageBackend;
    private vectors: Map<string, VectorEntry> = new Map();
    private documentIndex: Map<string, Set<string>> = new Map(); // documentId -> chunkIds
    private initialized = false;

    constructor(config: Partial<VectorStoreConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.backend = this.createBackend();
    }

    private createBackend(): StorageBackend {
        switch (this.config.backend) {
            case 'indexeddb':
                return new IndexedDBBackend();
            case 'localStorage':
                return new LocalStorageBackend(this.config.keyPrefix);
            default:
                return new MemoryBackend();
        }
    }

    /**
     * Initialize the vector store
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        if (this.config.persist) {
            await this.loadFromStorage();
        }

        this.initialized = true;
        console.log(`[VectorStore] Initialized with ${this.vectors.size} vectors`);
    }

    /**
     * Load vectors from persistent storage
     */
    private async loadFromStorage(): Promise<void> {
        try {
            const keys = await this.backend.keys();
            const vectorKeys = keys.filter(k => k.startsWith('chunk_'));

            for (const key of vectorKeys) {
                const entry = await this.backend.load<VectorEntry>(key);
                if (entry) {
                    this.vectors.set(entry.chunk.id, entry);
                    this.indexChunk(entry.chunk);
                }
            }
        } catch (error) {
            console.warn('[VectorStore] Failed to load from storage:', error);
        }
    }

    /**
     * Index a chunk by document ID
     */
    private indexChunk(chunk: DocumentChunk): void {
        if (!this.documentIndex.has(chunk.documentId)) {
            this.documentIndex.set(chunk.documentId, new Set());
        }
        this.documentIndex.get(chunk.documentId)!.add(chunk.id);
    }

    /**
     * Add a chunk with its embedding
     */
    async add(chunk: DocumentChunk, embedding: number[]): Promise<Result<void>> {
        try {
            const entry: VectorEntry = { chunk, embedding };
            this.vectors.set(chunk.id, entry);
            this.indexChunk(chunk);

            if (this.config.persist) {
                await this.backend.save(`chunk_${chunk.id}`, entry);
            }

            return success(undefined);
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Add multiple chunks with embeddings
     */
    async addBatch(chunks: DocumentChunk[], embeddings: number[][]): Promise<Result<void>> {
        try {
            if (chunks.length !== embeddings.length) {
                return failure(new Error('Chunks and embeddings arrays must have same length'));
            }

            for (let i = 0; i < chunks.length; i++) {
                await this.add(chunks[i], embeddings[i]);
            }

            return success(undefined);
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Search for similar vectors
     */
    async search(queryEmbedding: number[], options: SearchOptions = {}): Promise<SearchHit[]> {
        const {
            topK = 5,
            minScore = 0,
            sources,
            projectId,
            tags,
        } = options;

        const results: SearchHit[] = [];

        for (const [, entry] of this.vectors) {
            const { chunk, embedding } = entry;

            // Apply filters
            if (sources && !sources.includes(chunk.metadata.documentSource)) {
                continue;
            }

            if (projectId && chunk.metadata.projectId !== projectId) {
                continue;
            }

            if (tags && tags.length > 0) {
                const chunkTags = chunk.metadata.tags || [];
                if (!tags.some(tag => chunkTags.includes(tag))) {
                    continue;
                }
            }

            // Calculate similarity
            const score = EmbeddingService.cosineSimilarity(queryEmbedding, embedding);

            if (score >= minScore) {
                results.push({ chunk, score });
            }
        }

        // Sort by score descending and take top K
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, topK);
    }

    /**
     * Get a chunk by ID
     */
    get(chunkId: string): DocumentChunk | null {
        const entry = this.vectors.get(chunkId);
        return entry?.chunk || null;
    }

    /**
     * Get all chunks for a document
     */
    getByDocument(documentId: string): DocumentChunk[] {
        const chunkIds = this.documentIndex.get(documentId);
        if (!chunkIds) return [];

        const chunks: DocumentChunk[] = [];
        for (const id of chunkIds) {
            const entry = this.vectors.get(id);
            if (entry) {
                chunks.push(entry.chunk);
            }
        }

        // Sort by index
        chunks.sort((a, b) => a.index - b.index);
        return chunks;
    }

    /**
     * Delete a chunk
     */
    async delete(chunkId: string): Promise<Result<void>> {
        try {
            const entry = this.vectors.get(chunkId);
            if (entry) {
                this.vectors.delete(chunkId);

                // Remove from document index
                const docChunks = this.documentIndex.get(entry.chunk.documentId);
                if (docChunks) {
                    docChunks.delete(chunkId);
                    if (docChunks.size === 0) {
                        this.documentIndex.delete(entry.chunk.documentId);
                    }
                }

                if (this.config.persist) {
                    await this.backend.delete(`chunk_${chunkId}`);
                }
            }

            return success(undefined);
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Delete all chunks for a document
     */
    async deleteByDocument(documentId: string): Promise<Result<number>> {
        try {
            const chunkIds = this.documentIndex.get(documentId);
            if (!chunkIds) return success(0);

            let deletedCount = 0;
            for (const chunkId of chunkIds) {
                this.vectors.delete(chunkId);
                if (this.config.persist) {
                    await this.backend.delete(`chunk_${chunkId}`);
                }
                deletedCount++;
            }

            this.documentIndex.delete(documentId);
            return success(deletedCount);
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Clear all vectors
     */
    async clear(): Promise<Result<void>> {
        try {
            this.vectors.clear();
            this.documentIndex.clear();

            if (this.config.persist) {
                await this.backend.clear();
            }

            return success(undefined);
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Get index statistics
     */
    getStats(): IndexStats {
        const documentsBySource: Record<DocumentSource, number> = {
            metamodel: 0,
            model: 0,
            documentation: 0,
            jjscript: 0,
            tutorial: 0,
            user_defined: 0,
        };

        const documentIds = new Set<string>();

        for (const [, entry] of this.vectors) {
            documentIds.add(entry.chunk.documentId);
            const source = entry.chunk.metadata.documentSource;
            if (source && source in documentsBySource) {
                documentsBySource[source]++;
            }
        }

        // Estimate size (rough calculation)
        const avgEmbeddingSize = 384 * 8; // 384 floats * 8 bytes
        const avgChunkSize = 500; // average chunk text length
        const sizeBytes = this.vectors.size * (avgEmbeddingSize + avgChunkSize);

        return {
            totalDocuments: documentIds.size,
            totalChunks: this.vectors.size,
            sizeBytes,
            lastUpdated: Date.now(),
            documentsBySource,
        };
    }

    /**
     * Check if initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get total chunk count
     */
    size(): number {
        return this.vectors.size;
    }
}

// ============================================
// SINGLETON
// ============================================

let vectorStoreInstance: VectorStore | null = null;

/**
 * Get the singleton vector store instance
 */
export function getVectorStore(config?: Partial<VectorStoreConfig>): VectorStore {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new VectorStore(config);
    }
    return vectorStoreInstance;
}

/**
 * Reset the vector store (useful for testing)
 */
export function resetVectorStore(): void {
    vectorStoreInstance = null;
}

export default VectorStore;
