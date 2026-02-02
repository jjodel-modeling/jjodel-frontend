/**
 * Document Chunker for Jjodie RAG System
 *
 * Splits documents into smaller chunks for embedding and retrieval.
 * Uses a hierarchical splitting strategy that respects semantic boundaries
 * (paragraphs > sentences > words) while maintaining overlap for context.
 */

import {
    KnowledgeDocument,
    DocumentChunk,
    ChunkMetadata,
    RagConfig,
    DEFAULT_RAG_CONFIG,
} from './types';

// ============================================
// TYPES
// ============================================

interface ChunkingConfig {
    chunkSize: number;
    chunkOverlap: number;
    minChunkSize: number;
    splitDelimiters: string[];
}

interface ChunkingResult {
    chunks: DocumentChunk[];
    totalChunks: number;
    avgChunkSize: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique ID for a chunk
 */
function generateChunkId(documentId: string, index: number): string {
    return `${documentId}_chunk_${index}`;
}

/**
 * Estimate token count (rough approximation)
 * Average English word is ~4-5 characters, ~1.3 tokens per word
 */
function estimateTokens(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.ceil(words * 1.3);
}

/**
 * Split text by a delimiter while preserving the delimiter
 */
function splitByDelimiter(text: string, delimiter: string): string[] {
    if (!delimiter) return [text];

    const parts: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        const index = remaining.indexOf(delimiter);
        if (index === -1) {
            parts.push(remaining);
            break;
        }

        // Include the delimiter at the end of the chunk
        parts.push(remaining.slice(0, index + delimiter.length));
        remaining = remaining.slice(index + delimiter.length);
    }

    return parts.filter(p => p.trim().length > 0);
}

// ============================================
// CHUNKING STRATEGIES
// ============================================

/**
 * Recursive text splitter
 * Tries to split by larger delimiters first, falling back to smaller ones
 */
function recursiveSplit(
    text: string,
    delimiters: string[],
    targetSize: number,
    minSize: number
): string[] {
    // Base case: text is small enough
    if (text.length <= targetSize) {
        return [text];
    }

    // Try each delimiter in order
    for (const delimiter of delimiters) {
        const parts = splitByDelimiter(text, delimiter);

        // If we got multiple parts, try to combine them into chunks
        if (parts.length > 1) {
            const chunks: string[] = [];
            let currentChunk = '';

            for (const part of parts) {
                // If adding this part would exceed target, save current and start new
                if (currentChunk.length + part.length > targetSize && currentChunk.length >= minSize) {
                    chunks.push(currentChunk);
                    currentChunk = part;
                } else {
                    currentChunk += part;
                }
            }

            // Don't forget the last chunk
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }

            // If we got reasonable chunks, return them
            if (chunks.length > 1 || chunks[0].length <= targetSize) {
                // Recursively split any chunks that are still too large
                const result: string[] = [];
                for (const chunk of chunks) {
                    if (chunk.length > targetSize) {
                        // Use remaining delimiters for recursive split
                        const remainingDelimiters = delimiters.slice(delimiters.indexOf(delimiter) + 1);
                        if (remainingDelimiters.length > 0) {
                            result.push(...recursiveSplit(chunk, remainingDelimiters, targetSize, minSize));
                        } else {
                            // No more delimiters, force split by characters
                            result.push(...forceSplit(chunk, targetSize));
                        }
                    } else {
                        result.push(chunk);
                    }
                }
                return result;
            }
        }
    }

    // No delimiter worked, force split by character count
    return forceSplit(text, targetSize);
}

/**
 * Force split text into chunks by character count
 * Tries to break at word boundaries
 */
function forceSplit(text: string, maxSize: number): string[] {
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > maxSize) {
        // Find the last space within maxSize
        let splitPoint = remaining.lastIndexOf(' ', maxSize);

        // If no space found, just split at maxSize
        if (splitPoint === -1 || splitPoint < maxSize / 2) {
            splitPoint = maxSize;
        }

        chunks.push(remaining.slice(0, splitPoint).trim());
        remaining = remaining.slice(splitPoint).trim();
    }

    if (remaining.length > 0) {
        chunks.push(remaining);
    }

    return chunks;
}

/**
 * Add overlap between chunks
 */
function addOverlap(chunks: string[], overlapSize: number): string[] {
    if (chunks.length <= 1 || overlapSize <= 0) {
        return chunks;
    }

    const result: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i];

        // Add overlap from previous chunk
        if (i > 0) {
            const prevChunk = chunks[i - 1];
            const overlapText = prevChunk.slice(-overlapSize);
            // Find a word boundary for cleaner overlap
            const wordBoundary = overlapText.indexOf(' ');
            if (wordBoundary > 0) {
                chunk = overlapText.slice(wordBoundary + 1) + chunk;
            }
        }

        result.push(chunk);
    }

    return result;
}

// ============================================
// MAIN CHUNKER CLASS
// ============================================

/**
 * Document Chunker
 */
export class Chunker {
    private config: ChunkingConfig;

    constructor(config?: Partial<ChunkingConfig>) {
        this.config = {
            ...DEFAULT_RAG_CONFIG.chunking,
            ...config,
        };
    }

    /**
     * Chunk a single document
     */
    chunk(document: KnowledgeDocument): ChunkingResult {
        const { content, id: documentId, title, source, metadata } = document;

        // Skip empty documents
        if (!content || content.trim().length === 0) {
            return { chunks: [], totalChunks: 0, avgChunkSize: 0 };
        }

        // Split content into raw chunks
        const rawChunks = recursiveSplit(
            content,
            this.config.splitDelimiters,
            this.config.chunkSize,
            this.config.minChunkSize
        );

        // Add overlap
        const overlappedChunks = addOverlap(rawChunks, this.config.chunkOverlap);

        // Create DocumentChunk objects
        let currentOffset = 0;
        const chunks: DocumentChunk[] = overlappedChunks.map((text, index) => {
            const startOffset = Math.max(0, content.indexOf(text.slice(0, 50), currentOffset));
            const endOffset = startOffset + text.length;
            currentOffset = startOffset;

            const chunkMetadata: ChunkMetadata = {
                ...metadata,
                documentTitle: title,
                documentSource: source,
                totalChunks: overlappedChunks.length,
            };

            return {
                id: generateChunkId(documentId, index),
                documentId,
                content: text.trim(),
                index,
                startOffset,
                endOffset,
                metadata: chunkMetadata,
            };
        });

        // Filter out any chunks that ended up too small
        const filteredChunks = chunks.filter(c => c.content.length >= this.config.minChunkSize);

        // Calculate statistics
        const totalSize = filteredChunks.reduce((sum, c) => sum + c.content.length, 0);
        const avgChunkSize = filteredChunks.length > 0 ? totalSize / filteredChunks.length : 0;

        return {
            chunks: filteredChunks,
            totalChunks: filteredChunks.length,
            avgChunkSize: Math.round(avgChunkSize),
        };
    }

    /**
     * Chunk multiple documents
     */
    chunkMany(documents: KnowledgeDocument[]): ChunkingResult[] {
        return documents.map(doc => this.chunk(doc));
    }

    /**
     * Get all chunks from multiple documents flattened
     */
    chunkAndFlatten(documents: KnowledgeDocument[]): DocumentChunk[] {
        const results = this.chunkMany(documents);
        return results.flatMap(r => r.chunks);
    }

    /**
     * Estimate number of chunks for a document
     */
    estimateChunkCount(document: KnowledgeDocument): number {
        const contentLength = document.content.length;
        if (contentLength <= this.config.chunkSize) {
            return 1;
        }

        // Account for overlap
        const effectiveChunkSize = this.config.chunkSize - this.config.chunkOverlap;
        return Math.ceil(contentLength / effectiveChunkSize);
    }

    /**
     * Get configuration
     */
    getConfig(): ChunkingConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    setConfig(config: Partial<ChunkingConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// ============================================
// SPECIALIZED CHUNKERS
// ============================================

/**
 * Chunker optimized for metamodel descriptions
 */
export class MetamodelChunker extends Chunker {
    constructor() {
        super({
            chunkSize: 400,
            chunkOverlap: 40,
            minChunkSize: 80,
            splitDelimiters: ['\n## ', '\n### ', '\n- ', '\n', '. ', ' '],
        });
    }
}

/**
 * Chunker optimized for code/JjScript documentation
 */
export class CodeChunker extends Chunker {
    constructor() {
        super({
            chunkSize: 600,
            chunkOverlap: 60,
            minChunkSize: 100,
            splitDelimiters: ['\n\n', '\n', '; ', ' '],
        });
    }
}

/**
 * Chunker for tutorial content (larger chunks)
 */
export class TutorialChunker extends Chunker {
    constructor() {
        super({
            chunkSize: 800,
            chunkOverlap: 100,
            minChunkSize: 150,
            splitDelimiters: ['\n## ', '\n### ', '\n\n', '\n', '. ', ' '],
        });
    }
}

// ============================================
// FACTORY
// ============================================

/**
 * Get appropriate chunker for document type
 */
export function getChunkerForSource(source: string): Chunker {
    switch (source) {
        case 'metamodel':
        case 'model':
            return new MetamodelChunker();
        case 'jjscript':
            return new CodeChunker();
        case 'tutorial':
            return new TutorialChunker();
        default:
            return new Chunker();
    }
}

// ============================================
// SINGLETON
// ============================================

let defaultChunkerInstance: Chunker | null = null;

/**
 * Get the default chunker instance
 */
export function getDefaultChunker(): Chunker {
    if (!defaultChunkerInstance) {
        defaultChunkerInstance = new Chunker();
    }
    return defaultChunkerInstance;
}

export default Chunker;
