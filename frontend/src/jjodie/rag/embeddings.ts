/**
 * Embeddings Module for Jjodie RAG System
 *
 * Handles text embedding generation using various strategies:
 * - TF-IDF based local embeddings (default, no API needed)
 * - API-based embeddings (when available)
 *
 * The local TF-IDF approach provides reasonable semantic similarity
 * without requiring external API calls, making it suitable for
 * offline use and reducing latency.
 */

import {
    EmbeddingConfig,
    EmbeddingRequest,
    EmbeddingResponse,
    Result,
    success,
    failure,
} from './types';

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
    model: 'tfidf-local',
    dimensions: 384,
    maxTokens: 512,
    batchSize: 32,
};

// ============================================
// TEXT PREPROCESSING
// ============================================

/**
 * Tokenize text into words
 */
function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')  // Remove punctuation
        .split(/\s+/)               // Split on whitespace
        .filter(token => token.length > 1); // Remove single chars
}

/**
 * Remove common stop words
 */
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
    'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
    'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
]);

function removeStopWords(tokens: string[]): string[] {
    return tokens.filter(token => !STOP_WORDS.has(token));
}

/**
 * Apply simple stemming (suffix stripping)
 */
function stem(word: string): string {
    // Simple English suffix stripping
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 's', 'es', 'ment', 'ness', 'tion', 'sion'];
    for (const suffix of suffixes) {
        if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
            return word.slice(0, -suffix.length);
        }
    }
    return word;
}

/**
 * Full text preprocessing pipeline
 */
function preprocessText(text: string): string[] {
    const tokens = tokenize(text);
    const filtered = removeStopWords(tokens);
    return filtered.map(stem);
}

// ============================================
// TF-IDF IMPLEMENTATION
// ============================================

/**
 * Calculate term frequency for a document
 */
function calculateTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    const totalTokens = tokens.length;

    for (const token of tokens) {
        tf.set(token, (tf.get(token) || 0) + 1);
    }

    // Normalize by document length
    for (const [term, count] of tf) {
        tf.set(term, count / totalTokens);
    }

    return tf;
}

/**
 * TF-IDF vocabulary and IDF scores
 */
interface TFIDFVocabulary {
    terms: string[];
    termToIndex: Map<string, number>;
    idf: Map<string, number>;
    documentCount: number;
}

/**
 * Build vocabulary from a corpus of documents
 */
function buildVocabulary(documents: string[][], maxTerms: number = 10000): TFIDFVocabulary {
    const documentFrequency = new Map<string, number>();
    const allTerms = new Set<string>();

    // Count document frequency for each term
    for (const doc of documents) {
        const uniqueTerms = new Set(doc);
        for (const term of uniqueTerms) {
            allTerms.add(term);
            documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
        }
    }

    // Calculate IDF and sort by document frequency
    const termScores: Array<{ term: string; df: number; idf: number }> = [];
    const n = documents.length;

    for (const term of allTerms) {
        const df = documentFrequency.get(term) || 0;
        // IDF with smoothing: log((N + 1) / (df + 1)) + 1
        const idf = Math.log((n + 1) / (df + 1)) + 1;
        termScores.push({ term, df, idf });
    }

    // Sort by document frequency (descending) and take top terms
    termScores.sort((a, b) => b.df - a.df);
    const topTerms = termScores.slice(0, maxTerms);

    // Build vocabulary structures
    const terms = topTerms.map(t => t.term);
    const termToIndex = new Map<string, number>();
    const idf = new Map<string, number>();

    terms.forEach((term, index) => {
        termToIndex.set(term, index);
        const score = topTerms.find(t => t.term === term);
        if (score) {
            idf.set(term, score.idf);
        }
    });

    return {
        terms,
        termToIndex,
        idf,
        documentCount: n,
    };
}

/**
 * Convert TF-IDF vector to fixed-dimension embedding using random projection
 */
function projectToFixedDimension(
    tfidfVector: Map<string, number>,
    vocabulary: TFIDFVocabulary,
    targetDimension: number,
    seed: number = 42
): number[] {
    // Use seeded random for reproducibility
    const random = seededRandom(seed);

    // Initialize output vector
    const output = new Array(targetDimension).fill(0);

    // Random projection: multiply sparse vector by random matrix
    for (const [term, weight] of tfidfVector) {
        const termIndex = vocabulary.termToIndex.get(term);
        if (termIndex === undefined) continue;

        // Generate deterministic random projections for this term
        for (let i = 0; i < targetDimension; i++) {
            // Use term index and dimension to seed projection
            const projectionSeed = termIndex * targetDimension + i + seed;
            const projection = gaussianRandom(projectionSeed);
            output[i] += weight * projection;
        }
    }

    // L2 normalize
    const magnitude = Math.sqrt(output.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < output.length; i++) {
            output[i] /= magnitude;
        }
    }

    return output;
}

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

/**
 * Generate Gaussian random number using Box-Muller transform
 */
function gaussianRandom(seed: number): number {
    const random = seededRandom(seed);
    const u1 = random();
    const u2 = random();
    return Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2);
}

// ============================================
// EMBEDDING SERVICE
// ============================================

/**
 * Embedding service class
 */
export class EmbeddingService {
    private config: EmbeddingConfig;
    private vocabulary: TFIDFVocabulary | null = null;
    private corpusTokens: string[][] = [];

    constructor(config: Partial<EmbeddingConfig> = {}) {
        this.config = { ...DEFAULT_EMBEDDING_CONFIG, ...config };
    }

    /**
     * Initialize the embedding service with a corpus
     */
    initialize(documents: string[]): void {
        // Preprocess all documents
        this.corpusTokens = documents.map(preprocessText);

        // Build vocabulary
        this.vocabulary = buildVocabulary(this.corpusTokens, 10000);

        // console.log(`[EmbeddingService] Initialized with ${documents.length} documents, ${this.vocabulary.terms.length} terms`);
    }

    /**
     * Add documents to the corpus (incremental update)
     */
    addDocuments(documents: string[]): void {
        const newTokens = documents.map(preprocessText);
        this.corpusTokens.push(...newTokens);

        // Rebuild vocabulary with all documents
        this.vocabulary = buildVocabulary(this.corpusTokens, 10000);
    }

    /**
     * Generate embeddings for texts
     */
    async embed(request: EmbeddingRequest): Promise<Result<EmbeddingResponse>> {
        try {
            const { texts } = request;

            // Ensure vocabulary is initialized
            if (!this.vocabulary) {
                // Initialize with the texts themselves if no corpus
                this.initialize(texts);
            }

            const embeddings: number[][] = [];
            let tokensUsed = 0;

            for (const text of texts) {
                const tokens = preprocessText(text);
                tokensUsed += tokens.length;

                // Calculate TF
                const tf = calculateTF(tokens);

                // Calculate TF-IDF
                const tfidf = new Map<string, number>();
                for (const [term, tfScore] of tf) {
                    const idfScore = this.vocabulary!.idf.get(term) || 1;
                    tfidf.set(term, tfScore * idfScore);
                }

                // Project to fixed dimension
                const embedding = projectToFixedDimension(
                    tfidf,
                    this.vocabulary!,
                    this.config.dimensions
                );

                embeddings.push(embedding);
            }

            return success({
                embeddings,
                model: this.config.model,
                tokensUsed,
            });
        } catch (error) {
            return failure(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Generate embedding for a single text
     */
    async embedSingle(text: string): Promise<Result<number[]>> {
        const result = await this.embed({ texts: [text] });
        if (!result.success) {
            return failure(result.error);
        }
        return success(result.data.embeddings[0]);
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    static cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same dimension');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
        if (magnitude === 0) return 0;

        return dotProduct / magnitude;
    }

    /**
     * Get configuration
     */
    getConfig(): EmbeddingConfig {
        return { ...this.config };
    }

    /**
     * Get vocabulary size
     */
    getVocabularySize(): number {
        return this.vocabulary?.terms.length || 0;
    }

    /**
     * Export vocabulary for persistence
     */
    exportVocabulary(): TFIDFVocabulary | null {
        return this.vocabulary;
    }

    /**
     * Import vocabulary from persistence
     */
    importVocabulary(vocabulary: TFIDFVocabulary): void {
        this.vocabulary = vocabulary;
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let embeddingServiceInstance: EmbeddingService | null = null;

/**
 * Get the singleton embedding service instance
 */
export function getEmbeddingService(): EmbeddingService {
    if (!embeddingServiceInstance) {
        embeddingServiceInstance = new EmbeddingService();
    }
    return embeddingServiceInstance;
}

/**
 * Reset the embedding service (useful for testing)
 */
export function resetEmbeddingService(): void {
    embeddingServiceInstance = null;
}

export default EmbeddingService;
