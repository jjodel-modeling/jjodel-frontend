# HANDOVER: Jjodie RAG System Implementation

## DATA
2026-01-30

## CONTESTO
Implementazione del sistema RAG (Retrieval Augmented Generation) per Jjodie. Il sistema consente di indicizzare e recuperare conoscenza da metamodelli, modelli e documentazione per fornire risposte contestuali e informate.

---

## LAVORO COMPLETATO

### Sistema RAG Completo

**Directory creata:** `frontend/src/jjodie/rag/`

| File | Dimensione | Descrizione |
|------|------------|-------------|
| `types.ts` | 8.9KB | Definizioni tipi core |
| `embeddings.ts` | 11.8KB | Servizio embedding TF-IDF locale |
| `vectorStore.ts` | 16.3KB | Storage vettoriale con backend multipli |
| `chunker.ts` | 11.6KB | Splitting documenti con chunker specializzati |
| `retriever.ts` | 13.5KB | Ricerca semantica e keyword |
| `indexer.ts` | 16.7KB | Pipeline indicizzazione completa |
| `index.ts` | 6.4KB | Barrel exports e funzioni convenience |

---

## ARCHITETTURA

```
┌─────────────────────────────────────────────────────────────────┐
│                         JJODIE RAG SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │  Metamodel   │    │    Model     │    │Documentation │     │
│   │    Data      │    │    Data      │    │   Content    │     │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│          │                   │                   │              │
│          └───────────────────┼───────────────────┘              │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │    INDEXER      │                          │
│                    │  (indexer.ts)   │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│          ┌──────────────────┼──────────────────┐                │
│          ▼                  ▼                  ▼                │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │   CHUNKER    │  │  EMBEDDINGS  │  │ VECTOR STORE │         │
│   │ (chunker.ts) │  │(embeddings.ts│  │(vectorStore) │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│                              ▲                                   │
│                              │                                   │
│                    ┌─────────────────┐                          │
│                    │   RETRIEVER     │                          │
│                    │ (retriever.ts)  │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │  LLM CONTEXT    │                          │
│                    │   Augmentation  │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## TIPI PRINCIPALI (`types.ts`)

### KnowledgeDocument

```typescript
interface KnowledgeDocument {
    id: string;
    title: string;
    content: string;
    source: DocumentSource;  // 'metamodel' | 'model' | 'documentation' | 'jjscript' | 'tutorial' | 'user_defined'
    metadata: DocumentMetadata;
    createdAt: number;
    updatedAt: number;
}
```

### DocumentChunk

```typescript
interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    index: number;
    startOffset: number;
    endOffset: number;
    embedding?: number[];
    metadata: ChunkMetadata;
}
```

### SearchQuery / SearchResult

```typescript
interface SearchQuery {
    text: string;
    topK?: number;
    minScore?: number;
    sources?: DocumentSource[];
    projectId?: string;
    tags?: string[];
}

interface SearchResult {
    chunk: DocumentChunk;
    score: number;
    highlights?: string[];
}
```

### RagConfig

```typescript
interface RagConfig {
    chunking: {
        chunkSize: number;       // 512 default
        chunkOverlap: number;    // 50 default
        minChunkSize: number;    // 100 default
        splitDelimiters: string[];
    };
    embedding: EmbeddingConfig;
    search: {
        defaultTopK: number;     // 5 default
        defaultMinScore: number; // 0.5 default
        hybridSearch: boolean;   // true default
        semanticWeight: number;  // 0.7 default
    };
    storage: {
        backend: 'memory' | 'indexeddb' | 'localStorage';
        keyPrefix: string;
        persist: boolean;
    };
}
```

---

## EMBEDDING SERVICE (`embeddings.ts`)

### Caratteristiche

- **TF-IDF locale**: Nessuna API esterna richiesta
- **Random projection**: Riduzione dimensionalità a 384D
- **Preprocessing**: Tokenization, stop words removal, stemming
- **Cosine similarity**: Calcolo similarità tra vettori

### API

```typescript
class EmbeddingService {
    initialize(documents: string[]): void;
    addDocuments(documents: string[]): void;
    embed(request: EmbeddingRequest): Promise<Result<EmbeddingResponse>>;
    embedSingle(text: string): Promise<Result<number[]>>;
    static cosineSimilarity(a: number[], b: number[]): number;
    getVocabularySize(): number;
    exportVocabulary(): TFIDFVocabulary | null;
    importVocabulary(vocabulary: TFIDFVocabulary): void;
}

// Singleton
getEmbeddingService(): EmbeddingService;
resetEmbeddingService(): void;
```

---

## VECTOR STORE (`vectorStore.ts`)

### Storage Backends

| Backend | Persistenza | Uso |
|---------|-------------|-----|
| `memory` | No | Testing, sessioni temporanee |
| `indexeddb` | Sì | Produzione (default) |
| `localStorage` | Sì | Fallback (limite 5MB) |

### API

```typescript
class VectorStore {
    initialize(): Promise<void>;
    add(chunk: DocumentChunk, embedding: number[]): Promise<Result<void>>;
    addBatch(chunks: DocumentChunk[], embeddings: number[][]): Promise<Result<void>>;
    search(queryEmbedding: number[], options: SearchOptions): Promise<SearchHit[]>;
    get(chunkId: string): DocumentChunk | null;
    getByDocument(documentId: string): DocumentChunk[];
    delete(chunkId: string): Promise<Result<void>>;
    deleteByDocument(documentId: string): Promise<Result<number>>;
    clear(): Promise<Result<void>>;
    getStats(): IndexStats;
    size(): number;
}

// Singleton
getVectorStore(config?: Partial<VectorStoreConfig>): VectorStore;
resetVectorStore(): void;
```

---

## CHUNKER (`chunker.ts`)

### Strategia di Splitting

1. **Recursive split**: Prova delimitatori in ordine (paragrafi → frasi → parole)
2. **Overlap**: Aggiunge overlap tra chunk per contesto
3. **Size control**: Rispetta chunkSize target e minChunkSize

### Chunker Specializzati

| Chunker | Chunk Size | Overlap | Uso |
|---------|------------|---------|-----|
| `Chunker` (default) | 512 | 50 | Contenuto generico |
| `MetamodelChunker` | 400 | 40 | Metamodelli e modelli |
| `CodeChunker` | 600 | 60 | JjScript e codice |
| `TutorialChunker` | 800 | 100 | Tutorial e guide |

### API

```typescript
class Chunker {
    chunk(document: KnowledgeDocument): ChunkingResult;
    chunkMany(documents: KnowledgeDocument[]): ChunkingResult[];
    chunkAndFlatten(documents: KnowledgeDocument[]): DocumentChunk[];
    estimateChunkCount(document: KnowledgeDocument): number;
    getConfig(): ChunkingConfig;
    setConfig(config: Partial<ChunkingConfig>): void;
}

// Factory
getChunkerForSource(source: string): Chunker;
getDefaultChunker(): Chunker;
```

---

## RETRIEVER (`retriever.ts`)

### Modalità di Ricerca

| Modalità | Descrizione |
|----------|-------------|
| **Semantic** | Solo embedding similarity |
| **Keyword** | BM25-like keyword matching |
| **Hybrid** | Reciprocal Rank Fusion (semantic + keyword) |

### Hybrid Search

```
Final Score = (1/(k + rank_semantic)) × semanticWeight
            + (1/(k + rank_keyword)) × (1 - semanticWeight)

dove k = 60 (RRF parameter)
     semanticWeight = 0.7 (default)
```

### API

```typescript
class Retriever {
    search(query: SearchQuery): Promise<Result<SearchResponse>>;
    quickSearch(query: string, topK?: number): Promise<Result<DocumentChunk[]>>;
    searchForContext(query: string, maxTokens?: number): Promise<Result<string>>;
    getConfig(): RetrieverConfig;
    setConfig(config: Partial<RetrieverConfig>): void;
}

// Singleton
getRetriever(): Retriever;
resetRetriever(): void;
```

---

## INDEXER (`indexer.ts`)

### Document Generators

| Funzione | Input | Output |
|----------|-------|--------|
| `generateMetamodelDocument()` | MetamodelData | KnowledgeDocument |
| `generateClassDocuments()` | MetamodelData | KnowledgeDocument[] |
| `generateModelDocument()` | ModelData | KnowledgeDocument |
| `generateDocumentationDocument()` | content, title | KnowledgeDocument |

### Formato Metamodel Document

```markdown
# Metamodel: FamilyMetamodel

## Classes (5)

### Person
**Attributes:**
- name: string
- age: integer

**References:**
- children -> Person

### Family
...
```

### API

```typescript
class Indexer {
    initialize(): Promise<void>;
    indexDocument(document: KnowledgeDocument, onProgress?: ProgressCallback): Promise<Result<IndexingResult>>;
    indexDocuments(documents: KnowledgeDocument[], onProgress?: ProgressCallback): Promise<Result<IndexingResult[]>>;
    indexMetamodel(metamodel: MetamodelData, projectId?: string, includeClasses?: boolean, onProgress?: ProgressCallback): Promise<Result<IndexingResult[]>>;
    indexModel(model: ModelData, projectId?: string, onProgress?: ProgressCallback): Promise<Result<IndexingResult>>;
    indexDocumentation(content: string, title: string, projectId?: string, tags?: string[], onProgress?: ProgressCallback): Promise<Result<IndexingResult>>;
    removeDocument(documentId: string): Promise<Result<number>>;
    reindexDocument(document: KnowledgeDocument, onProgress?: ProgressCallback): Promise<Result<IndexingResult>>;
    clearAll(): Promise<Result<void>>;
    getStats(): IndexStats;
    getIndexedDocumentIds(): string[];
    isDocumentIndexed(documentId: string): boolean;
    getDocument(documentId: string): KnowledgeDocument | null;
}

// Singleton
getIndexer(): Indexer;
resetIndexer(): void;
```

---

## FUNZIONI CONVENIENCE (`index.ts`)

```typescript
// Inizializza tutto il sistema RAG
async function initializeRagSystem(): Promise<void>;

// Reset completo (testing/cleanup)
async function resetRagSystem(): Promise<void>;

// Ricerca veloce
async function searchKnowledge(
    query: string,
    options?: { topK?: number; projectId?: string; minScore?: number }
): Promise<string[]>;

// Ottieni contesto per LLM
async function getContextForQuery(
    query: string,
    maxTokens?: number
): Promise<string>;

// Indicizza contenuto progetto
async function indexProjectContent(
    projectId: string,
    content: {
        metamodels?: MetamodelData[];
        models?: ModelData[];
        documentation?: string;
    }
): Promise<void>;
```

---

## ESEMPIO DI UTILIZZO

```typescript
import {
    initializeRagSystem,
    indexProjectContent,
    getContextForQuery,
    getRetriever
} from '../jjodie/rag';

// 1. Inizializza il sistema
await initializeRagSystem();

// 2. Indicizza contenuto progetto
await indexProjectContent(projectId, {
    metamodels: project.metamodels,
    models: project.models,
    documentation: project.documentation
});

// 3. Ricerca contesto per query utente
const context = await getContextForQuery(
    'Come creo una nuova classe Person?',
    2000  // max tokens
);

// 4. Usa il contesto nel prompt per Jjodie
const prompt = `
Based on this context from the project:
${context}

User question: Come creo una nuova classe Person?
`;

// 5. Oppure ricerca diretta
const retriever = getRetriever();
const result = await retriever.search({
    text: 'Person class attributes',
    topK: 5,
    projectId: projectId
});

if (result.success) {
    for (const hit of result.data.results) {
        console.log(`Score: ${hit.score}, Content: ${hit.chunk.content}`);
    }
}
```

---

## STORAGE

### IndexedDB Schema

```
Database: jjodie_rag
└── Object Store: vectors
    └── Keys: chunk_{chunkId}
    └── Values: { chunk: DocumentChunk, embedding: number[] }
```

### LocalStorage Keys

```
jjodie_rag_chunk_{chunkId}: JSON(VectorEntry)
```

---

## PERFORMANCE

| Operazione | Complessità | Note |
|------------|-------------|------|
| Embedding | O(n × v) | n = tokens, v = vocabulary |
| Vector search | O(n) | n = total chunks |
| Chunking | O(m) | m = document length |
| Indexing | O(c × e) | c = chunks, e = embedding time |

### Ottimizzazioni Future

- [ ] Approximate Nearest Neighbors (ANN) per search O(log n)
- [ ] Batch embedding con Web Workers
- [ ] Incremental vocabulary updates
- [ ] Compressed embeddings (quantization)

---

## FILE CHIAVE

| File | Scopo |
|------|-------|
| `frontend/src/jjodie/rag/types.ts` | Definizioni tipi |
| `frontend/src/jjodie/rag/embeddings.ts` | Servizio embedding TF-IDF |
| `frontend/src/jjodie/rag/vectorStore.ts` | Storage vettoriale multi-backend |
| `frontend/src/jjodie/rag/chunker.ts` | Splitting documenti |
| `frontend/src/jjodie/rag/retriever.ts` | Ricerca semantica e keyword |
| `frontend/src/jjodie/rag/indexer.ts` | Pipeline indicizzazione |
| `frontend/src/jjodie/rag/index.ts` | Exports e convenience functions |
| `frontend/src/services/JjodieRagService.ts` | **NUOVO** Bridge RAG ↔ Jjodie |
| `frontend/src/components/Jodie/Jodie.tsx` | Componente chat con integrazione RAG |

---

## TODO / PROSSIMI PASSI

1. ✅ Integrare RAG in Jjodie chat (`Jodie.tsx`)
2. ✅ Auto-index on project load
3. ✅ Index JjScript command documentation
4. ⬜ Re-index on metamodel/model changes (attualmente ogni 30s)
5. ⬜ UI per visualizzare statistiche index
6. ⬜ Web Worker per embedding in background
7. ⬜ Supporto API embedding esterni (OpenAI, Cohere)

---

## INTEGRAZIONE JJODIE CHAT

### File Creati/Modificati

| File | Modifiche |
|------|-----------|
| `frontend/src/services/JjodieRagService.ts` | **NUOVO** - Servizio bridge tra RAG e Jjodie |
| `frontend/src/components/Jodie/Jodie.tsx` | Integrazione RAG context |

### JjodieRagService

Servizio che gestisce:
- Inizializzazione del sistema RAG
- Conversione progetti in documenti indicizzabili
- **Indicizzazione documentazione JjScript** (automatica all'avvio)
- Ricerca context per query utente

```typescript
class JjodieRagServiceClass {
    // Inizializza RAG system
    async initialize(): Promise<void>;

    // Indicizza contenuto progetto
    async indexProject(project: LProject): Promise<void>;

    // Ottieni context RAG per una query
    async getAugmentedContext(query: string, projectId?: string): Promise<string | null>;

    // Ricerca diretta
    async search(query: string, topK?: number): Promise<RagContext | null>;

    // Statistiche
    getStats(): IndexStats | null;
}
```

### Modifiche a Jodie.tsx

1. **Import aggiunto:**
```typescript
import { JjodieRagService } from '../../services/JjodieRagService';
```

2. **Nuovi state:**
```typescript
const lastIndexedProjectRef = useRef<string | null>(null);
const [ragInitialized, setRagInitialized] = useState(false);
```

3. **Effect per auto-indexing:**
```typescript
useEffect(() => {
    const initializeAndIndex = async () => {
        if (!ragInitialized) {
            await JjodieRagService.initialize();
            setRagInitialized(true);
        }

        const project = user?.project as LProject;
        if (project?.id && project.id !== lastIndexedProjectRef.current) {
            await JjodieRagService.indexProject(project);
            lastIndexedProjectRef.current = project.id;
        }
    };

    initializeAndIndex();
    const interval = setInterval(initializeAndIndex, 30000); // Re-index ogni 30s
    return () => clearInterval(interval);
}, [ragInitialized]);
```

4. **Context augmentation in handleSendMessage:**
```typescript
// Get RAG-augmented context based on query
let augmentedContext = projectContext;
if (ragInitialized) {
    const ragContext = await JjodieRagService.getAugmentedContext(content);
    if (ragContext) {
        augmentedContext = projectContext
            ? `${projectContext}\n\n---\n\n**Relevant Information:**\n${ragContext}`
            : `**Relevant Information:**\n${ragContext}`;
    }
}
```

### Flusso Dati

```
User Opens Project
       │
       ▼
┌─────────────────┐
│ Jodie useEffect │
│ (ogni 30s)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JjodieRagService│
│ .indexProject() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Project to Docs │────▶│    Indexer      │
│ Conversion      │     │ (chunk+embed)   │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Vector Store   │
                        │  (IndexedDB)    │
                        └─────────────────┘

User Sends Message
       │
       ▼
┌─────────────────┐
│handleSendMessage│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JjodieRagService│
│.getAugmentedCtx │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Retriever     │────▶│ Relevant Chunks │
│ (hybrid search) │     │   (top 5)       │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  AI Provider    │
                        │ (with context)  │
                        └─────────────────┘
```

---

## JJSCRIPT DOCUMENTATION INDEXING

Il sistema RAG indicizza automaticamente la documentazione JjScript all'avvio, permettendo a Jjodie di rispondere a domande sui comandi.

### Documenti Indicizzati (11 documenti)

| ID | Contenuto |
|----|-----------|
| `jjscript_overview` | Overview generale di JjScript |
| `jjscript_create` | Comando CREATE con tutte le opzioni |
| `jjscript_delete` | Comando DELETE (cascade, force) |
| `jjscript_rename` | Comando RENAME |
| `jjscript_set` | Comando SET con proprietà comuni |
| `jjscript_add` | Comando ADD |
| `jjscript_list` | Comando LIST con filtri |
| `jjscript_show` | Comando SHOW (brief/full/tree) |
| `jjscript_syntax` | Riferimento sintassi (tipi, molteplicità, operatori) |
| `jjscript_examples` | Esempi pratici completi |
| `jjscript_elements` | Riferimento tipi elementi (class, attribute, reference, etc.) |

### Implementazione

```typescript
// In JjodieRagService.ts
class JjodieRagServiceClass {
    private jjscriptIndexed = false;

    async initialize(): Promise<void> {
        await initializeRagSystem();
        this.initialized = true;

        // Index JjScript docs on first init
        if (!this.jjscriptIndexed) {
            await this.indexJjScriptDocumentation();
        }
    }

    async indexJjScriptDocumentation(): Promise<void> {
        const documents = this.generateJjScriptDocuments();
        for (const doc of documents) {
            await indexer.indexDocument(doc);
        }
        this.jjscriptIndexed = true;
    }
}
```

### Esempio Query

**User:** "Come creo una classe astratta in JjScript?"

**RAG Context Trovato:**
- jjscript_create (score: 0.85)
- jjscript_elements (score: 0.72)
- jjscript_examples (score: 0.65)

**Risposta Jjodie:** Include esempi specifici come `create abstract class Entity`

---

## NOTE TECNICHE

### Vantaggi TF-IDF Locale

1. **Nessuna API esterna**: Funziona offline
2. **Zero latenza**: Embedding istantanei
3. **Privacy**: Dati mai inviati a server esterni
4. **Costo zero**: Nessun token consumato

### Limitazioni

1. **Qualità semantica**: TF-IDF < Neural embeddings
2. **Vocabulary drift**: Necessario rebuild periodico
3. **Memory**: Vocabulary in memoria

### Design Decisions

- **Singleton pattern**: Un'istanza per servizio per gestione stato
- **Result type**: Gestione errori esplicita senza throw
- **Progress callbacks**: Feedback durante operazioni lunghe
- **Backend abstraction**: Facile switch tra storage engines

---

*Ultimo aggiornamento: 2026-01-30 ore 18:00*
