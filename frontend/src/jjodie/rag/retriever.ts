/**
 * Retriever for Jjodie RAG System
 *
 * Handles search queries and retrieves relevant document chunks.
 * Supports multiple retrieval strategies:
 * - Semantic search (embedding similarity)
 * - Keyword search (BM25-like)
 * - Hybrid search (combination of both)
 */

import {
    SearchQuery,
    SearchResult,
    SearchResponse,
    DocumentChunk,
    DocumentSource,
    RagConfig,
    DEFAULT_RAG_CONFIG,
    Result,
    success,
    failure,
} from './types';
import { EmbeddingService, getEmbeddingService } from './embeddings';
import { VectorStore, getVectorStore } from './vectorStore';

// ============================================
// TYPES
// ============================================

interface RetrieverConfig {
    defaultTopK: number;
    defaultMinScore: number;
    hybridSearch: boolean;
    semanticWeight: number;
}

interface KeywordMatch {
    chunk: DocumentChunk;
    score: number;
    matchedTerms: string[];
}

// ============================================
// KEYWORD SEARCH (BM25-like)
// ============================================

/**
 * Simple BM25-inspired keyword scoring
 */
class KeywordSearcher {
    private k1 = 1.2; // Term frequency saturation
    private b = 0.75; // Length normalization
    private avgDocLength = 500; // Average document length (will be updated)

    /**
     * Tokenize and normalize text
     */
    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }

    /**
     * Calculate term frequency
     */
    private termFrequency(term: string, tokens: string[]): number {
        return tokens.filter(t => t === term).length;
    }

    /**
     * Calculate BM25-like score for a single chunk
     */
    private scoreChunk(queryTokens: string[], chunk: DocumentChunk): KeywordMatch {
        const chunkTokens = this.tokenize(chunk.content);
        const docLength = chunkTokens.length;
        const matchedTerms: string[] = [];

        let score = 0;

        for (const term of queryTokens) {
            const tf = this.termFrequency(term, chunkTokens);
            if (tf > 0) {
                matchedTerms.push(term);

                // BM25 formula (simplified, without IDF since we don't have corpus stats)
                const numerator = tf * (this.k1 + 1);
                const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
                score += numerator / denominator;
            }
        }

        // Normalize by query length
        if (queryTokens.length > 0) {
            score = score / queryTokens.length;
        }

        return { chunk, score, matchedTerms };
    }

    /**
     * Search chunks using keyword matching
     */
    search(
        query: string,
        chunks: DocumentChunk[],
        topK: number = 5,
        minScore: number = 0.1
    ): KeywordMatch[] {
        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0) {
            return [];
        }

        // Update average document length
        if (chunks.length > 0) {
            const totalLength = chunks.reduce((sum, c) => sum + this.tokenize(c.content).length, 0);
            this.avgDocLength = totalLength / chunks.length;
        }

        // Score all chunks
        const matches = chunks
            .map(chunk => this.scoreChunk(queryTokens, chunk))
            .filter(match => match.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        return matches;
    }
}

// ============================================
// RETRIEVER CLASS
// ============================================

/**
 * Main Retriever class
 */
export class Retriever {
    private config: RetrieverConfig;
    private embeddingService: EmbeddingService;
    private vectorStore: VectorStore;
    private keywordSearcher: KeywordSearcher;

    constructor(
        config?: Partial<RetrieverConfig>,
        embeddingService?: EmbeddingService,
        vectorStore?: VectorStore
    ) {
        this.config = {
            ...DEFAULT_RAG_CONFIG.search,
            ...config,
        };
        this.embeddingService = embeddingService || getEmbeddingService();
        this.vectorStore = vectorStore || getVectorStore();
        this.keywordSearcher = new KeywordSearcher();
    }

    /**
     * Search for relevant chunks
     */
    async search(query: SearchQuery): Promise<Result<SearchResponse>> {
        const startTime = Date.now();

        try {
            const {
                text,
                topK = this.config.defaultTopK,
                minScore = this.config.defaultMinScore,
                sources,
                projectId,
                tags,
                includeMetadata = true,
            } = query;

            // Validate query
            if (!text || text.trim().length === 0) {
                return failure(new Error('Query text cannot be empty'));
            }

            let results: SearchResult[];

            if (this.config.hybridSearch) {
                // Hybrid search: combine semantic and keyword
                results = await this.hybridSearch(
                    text,
                    topK,
                    minScore,
                    { sources, projectId, tags }
                );
            } else {
                // Pure semantic search
                results = await this.semanticSearch(
                    text,
                    topK,
                    minScore,
                    { sources, projectId, tags }
                );
            }

            // Optionally strip metadata for smaller response
            if (!includeMetadata) {
                results = results.map(r => ({
                    ...r,
                    chunk: {
                        ...r.chunk,
                        metadata: {} as any,
                    },
                }));
            }

            const searchTimeMs = Date.now() - startTime;

            return success({
                results,
                totalMatches: results.length,
                searchTimeMs,
                query,
            });
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Semantic search using embeddings
     */
    private async semanticSearch(
        queryText: string,
        topK: number,
        minScore: number,
        filters: { sources?: DocumentSource[]; projectId?: string; tags?: string[] }
    ): Promise<SearchResult[]> {
        // Generate query embedding
        const embeddingResult = await this.embeddingService.embedSingle(queryText);
        if (!embeddingResult.success) {
            throw embeddingResult.error;
        }

        // Search vector store
        const hits = await this.vectorStore.search(embeddingResult.data, {
            topK,
            minScore,
            ...filters,
        });

        return hits.map(hit => ({
            chunk: hit.chunk,
            score: hit.score,
        }));
    }

    /**
     * Keyword search using BM25-like scoring
     */
    private keywordSearch(
        queryText: string,
        chunks: DocumentChunk[],
        topK: number,
        minScore: number
    ): SearchResult[] {
        const matches = this.keywordSearcher.search(queryText, chunks, topK, minScore);

        return matches.map(match => ({
            chunk: match.chunk,
            score: match.score,
            highlights: match.matchedTerms,
        }));
    }

    /**
     * Hybrid search combining semantic and keyword
     */
    private async hybridSearch(
        queryText: string,
        topK: number,
        minScore: number,
        filters: { sources?: DocumentSource[]; projectId?: string; tags?: string[] }
    ): Promise<SearchResult[]> {
        // Get more results from each method to allow for good fusion
        const expandedTopK = Math.min(topK * 3, 50);

        // Run semantic search
        const semanticResults = await this.semanticSearch(
            queryText,
            expandedTopK,
            minScore * 0.5, // Lower threshold for fusion
            filters
        );

        // Get all chunks for keyword search (filtered)
        const allChunks = this.getFilteredChunks(filters);
        const keywordResults = this.keywordSearch(queryText, allChunks, expandedTopK, 0.05);

        // Reciprocal Rank Fusion (RRF)
        const k = 60; // RRF parameter
        const fusedScores = new Map<string, { chunk: DocumentChunk; score: number; highlights?: string[] }>();

        // Add semantic results
        semanticResults.forEach((result, rank) => {
            const rrf = 1 / (k + rank + 1);
            const weighted = rrf * this.config.semanticWeight;
            fusedScores.set(result.chunk.id, {
                chunk: result.chunk,
                score: weighted,
            });
        });

        // Add keyword results
        keywordResults.forEach((result, rank) => {
            const rrf = 1 / (k + rank + 1);
            const weighted = rrf * (1 - this.config.semanticWeight);
            const existing = fusedScores.get(result.chunk.id);

            if (existing) {
                existing.score += weighted;
                existing.highlights = result.highlights;
            } else {
                fusedScores.set(result.chunk.id, {
                    chunk: result.chunk,
                    score: weighted,
                    highlights: result.highlights,
                });
            }
        });

        // Sort by fused score and take top K
        const results = Array.from(fusedScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .filter(r => r.score >= minScore);

        return results;
    }

    /**
     * Get all chunks matching filters
     */
    private getFilteredChunks(filters: {
        sources?: DocumentSource[];
        projectId?: string;
        tags?: string[];
    }): DocumentChunk[] {
        // This is a simplified implementation
        // In production, the vector store should support efficient filtering
        const stats = this.vectorStore.getStats();
        const chunks: DocumentChunk[] = [];

        // Get chunks from vector store (would need to add a method for this)
        // For now, return empty - hybrid search will still work via semantic results
        return chunks;
    }

    /**
     * Quick search - simplified API for common use case
     */
    async quickSearch(
        query: string,
        topK: number = 5
    ): Promise<Result<DocumentChunk[]>> {
        const result = await this.search({
            text: query,
            topK,
            minScore: this.config.defaultMinScore,
        });

        if (!result.success) {
            return failure(result.error);
        }

        return success(result.data.results.map(r => r.chunk));
    }

    /**
     * Search and format results as context string
     */
    async searchForContext(
        query: string,
        maxTokens: number = 2000
    ): Promise<Result<string>> {
        const result = await this.search({
            text: query,
            topK: 10, // Get more results, then trim to token limit
            minScore: this.config.defaultMinScore,
        });

        if (!result.success) {
            return failure(result.error);
        }

        // Build context string within token limit
        const contextParts: string[] = [];
        let currentTokens = 0;

        for (const searchResult of result.data.results) {
            const chunk = searchResult.chunk;
            // Rough token estimate: ~4 chars per token
            const chunkTokens = Math.ceil(chunk.content.length / 4);

            if (currentTokens + chunkTokens > maxTokens) {
                break;
            }

            // Format chunk with metadata
            const formatted = this.formatChunkForContext(chunk, searchResult.score);
            contextParts.push(formatted);
            currentTokens += chunkTokens;
        }

        return success(contextParts.join('\n\n---\n\n'));
    }

    /**
     * Format a chunk for inclusion in LLM context
     */
    private formatChunkForContext(chunk: DocumentChunk, score: number): string {
        const { content, metadata } = chunk;
        const source = metadata.documentSource || 'unknown';
        const title = metadata.documentTitle || 'Untitled';

        return `[Source: ${source} | ${title} | Relevance: ${(score * 100).toFixed(0)}%]\n${content}`;
    }

    /**
     * Get configuration
     */
    getConfig(): RetrieverConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<RetrieverConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// ============================================
// SINGLETON
// ============================================

let retrieverInstance: Retriever | null = null;

/**
 * Get the singleton retriever instance
 */
export function getRetriever(): Retriever {
    if (!retrieverInstance) {
        retrieverInstance = new Retriever();
    }
    return retrieverInstance;
}

/**
 * Reset the retriever (useful for testing)
 */
export function resetRetriever(): void {
    retrieverInstance = null;
}

export default Retriever;
