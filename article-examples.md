# Building AI Products: Code Examples & Patterns

This document contains real code examples and patterns from a production AI application. These examples are intended for people who want to understand how modern AI products are built.

## Table of Contents

1. [RAG Architecture: The Over-Fetch + Rerank Pattern](#rag-architecture)
2. [Vector Similarity: The Math Behind Semantic Search](#vector-similarity)
3. [Smart Text Chunking](#text-chunking)
4. [Agent Routing with LLMs](#agent-routing)
5. [Fine-Tuning Custom Models](#fine-tuning)
6. [Type-Safe AI with Structured Outputs](#structured-outputs)
7. [Streaming for Better UX](#streaming)

---

## RAG Architecture: The Over-Fetch + Rerank Pattern

**What it solves:** Traditional keyword search fails to understand meaning. "How do I handle errors?" won't match documents about "exception handling." RAG (Retrieval Augmented Generation) solves this using semantic search.

**The key insight:** Don't just retrieve once - over-fetch candidates, then rerank for quality.

```typescript
export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
  // Step 1: Convert query to a vector (embedding)
  const embeddingResponse = await openaiClient.embeddings.create({
    model: 'text-embedding-3-small',
    dimensions: 512,
    input: request.query,
  });
  const embedding = embeddingResponse.data[0].embedding;

  // Step 2: Search vector database - OVER-FETCH (20 results)
  // Why 20? Give the reranker more options to choose from
  const candidateResults = await qdrantClient.search('articles', {
    vector: embedding,
    limit: 20,  // 2-3x more than we need
    with_payload: true,
  });

  // Step 3: Rerank with specialized model (Cohere)
  // Vector similarity is good, but reranking is better
  const rerankedResponse = await cohereClient.rerank({
    model: 'rerank-english-v3.0',
    query: request.query,
    documents: candidateResults.map((result) =>
      JSON.stringify({
        text: result.payload?.content,
        url: result.payload?.url,
      })
    ),
    topN: 10,  // Now take the best 10
    returnDocuments: true,
  });

  // Step 4: Build context-aware prompt
  const systemPrompt = `Write an article based on the following context:

Original user query: ${request.originalQuery}
Refined query: ${request.query}
Writing samples: ${rerankedResponse.results
    .map((result) => result.document?.text)
    .join('\n\n')}

Write the article using the tone and style of the writing samples.
`;

  // Step 5: Generate streaming response
  return streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: [...request.messages],
    temperature: 0.7,
  });
}
```

**Why this matters:**
- Vector search alone has ~70% accuracy
- Adding reranking pushes it to ~85-90%
- The over-fetch strategy gives the reranker more options to choose from

---

## Vector Similarity: The Math Behind Semantic Search

**What it solves:** How do we measure if two pieces of text are "similar"? Cosine similarity is the answer.

```typescript
/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 (opposite) and 1 (identical)
 */
export function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  // Step 1: Calculate dot product (sum of element-wise multiplication)
  const dotProd = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);

  // Step 2: Calculate magnitudes (length of each vector)
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));

  // Step 3: Divide dot product by product of magnitudes
  return dotProd / (magnitudeA * magnitudeB);
}

/**
 * Find the most similar documents to a query
 * This is the core of semantic search!
 */
export function findTopSimilarDocuments(
  queryVector: number[],
  documents: Document[],
  minSimilarity: number = 0.7,
  topK: number = 3
): Array<{ document: Document; similarity: number }> {
  return documents
    .map(doc => ({
      document: doc,
      similarity: cosineSimilarity(queryVector, doc.embedding)
    }))
    .filter(result => result.similarity >= minSimilarity)  // Quality threshold
    .sort((a, b) => b.similarity - a.similarity)           // Best first
    .slice(0, topK);                                       // Top K only
}
```

**Real example:**
```typescript
const query = "vector databases";
// Query embedding: [0.75, 0.25, 0.8, 0.1]

const documents = [
  {
    title: "Introduction to Vector Databases",
    embedding: [0.8, 0.2, 0.7, 0.1]  // Similarity: 0.95 ✅
  },
  {
    title: "Machine Learning Fundamentals",
    embedding: [0.2, 0.8, 0.1, 0.7]  // Similarity: 0.32 ❌
  },
];
// First document matches semantically, second doesn't
```

---

## Smart Text Chunking

**What it solves:** LLMs have token limits. A 10,000-word article won't fit. We need to split it intelligently while preserving context.

```typescript
/**
 * Chunks text with overlap to preserve context across boundaries
 *
 * Example: "React hooks are great. They simplify state. State management is easier."
 *
 * Without overlap:
 *   Chunk 1: "React hooks are great."
 *   Chunk 2: "State management is easier."
 *   ❌ Lost context about "They simplify state"
 *
 * With overlap:
 *   Chunk 1: "React hooks are great. They simplify state."
 *   Chunk 2: "They simplify state. State management is easier."
 *   ✅ Context preserved!
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50,
  source: string = 'unknown'
): Chunk[] {
  const chunks: Chunk[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let currentChunk = '';
  let chunkStart = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim() + '.';

    // If adding this sentence exceeds limit, create chunk
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        id: `${source}-chunk-${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          source,
          chunkIndex,
          startChar: chunkStart,
          endChar: chunkStart + currentChunk.length,
        },
      });

      // 🔑 KEY INSIGHT: Start new chunk with overlap from previous
      const overlapText = getLastWords(currentChunk, overlap);
      currentChunk = overlapText + ' ' + sentence;
      chunkStart = chunkStart + currentChunk.length - overlapText.length;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  return chunks;
}
```

**Why overlap matters:**
- Without overlap: Context gets lost at chunk boundaries
- With overlap: Each chunk shares context with neighbors
- Typical values: 500 char chunks, 50 char overlap (~10%)

---

## Agent Routing with LLMs

**What it solves:** Different queries need different handling. LinkedIn posts need a different agent than technical documentation. How do we route intelligently?

**The approach:** Use an LLM as a smart router with structured outputs.

```typescript
// Define agent types with Zod
export const agentTypeSchema = z.enum(['linkedin', 'rag']);
export type AgentType = z.infer<typeof agentTypeSchema>;

// Agent registry pattern
export const agentRegistry: Record<AgentType, AgentExecutor> = {
  linkedin: linkedInAgent,    // For professional content
  rag: ragAgent,              // For technical Q&A
};

// Smart routing with structured output
const responseSchema = z.object({
  agent: z.enum(['linkedin', 'rag']),
  refinedQuery: z.string(),
  reasoning: z.string().optional(),
});

const result = await generateObject({
  model: openai('gpt-4o'),
  schema: responseSchema,
  prompt: `Route this query to the best agent:
    "${userQuery}"

    - linkedin: For career advice, professional posts, networking
    - rag: For technical documentation, coding questions, how-tos
  `,
});

// Execute the selected agent
const agent = agentRegistry[result.object.agent];
return agent({ query: result.object.refinedQuery, ... });
```

**Testing routing (real tests from the codebase):**
```typescript
describe('Selector Agent Routing', () => {
  it('should route LinkedIn post creation to linkedin agent', async () => {
    const result = await selectAgent(
      'Write a LinkedIn post about learning TypeScript'
    );
    expect(result.agent).toBe('linkedin');
  });

  it('should route technical questions to rag agent', async () => {
    const result = await selectAgent('How do React hooks work?');
    expect(result.agent).toBe('rag');
  });

  it('should handle ambiguous queries gracefully', async () => {
    const result = await selectAgent('Tell me about JavaScript');
    // Could go either way - both valid
    expect(['linkedin', 'rag']).toContain(result.agent);
  });
});
```

**Why this matters:**
- Single LLM call determines routing (cheap)
- Structured output ensures type safety
- Easy to add new agents (just extend the enum)

---

## Fine-Tuning Custom Models

**What it solves:** GPT-4 is great but generic. Fine-tuning creates a model that writes in YOUR voice, with YOUR style.

```typescript
/**
 * Fine-tuning workflow:
 * 1. Prepare training data (JSONL format)
 * 2. Upload to OpenAI
 * 3. Create fine-tuning job
 * 4. Wait for completion (minutes to hours)
 * 5. Use your custom model
 */

async function uploadTrainingFile(filePath: string): Promise<string> {
  const file = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: 'fine-tune',
  });
  return file.id;
}

async function createFineTuningJob(fileId: string): Promise<void> {
  const job = await openai.fineTuning.jobs.create({
    training_file: fileId,
    model: 'gpt-4o-mini-2024-07-18',  // Base model
  });

  console.log(`Fine-tuning job created: ${job.id}`);
  console.log(`Monitor at: https://platform.openai.com/finetune/${job.id}`);
}
```

**Training data format (JSONL):**
```jsonl
{"messages": [{"role": "system", "content": "You are a LinkedIn expert."}, {"role": "user", "content": "Write about AI"}, {"role": "assistant", "content": "🚀 AI is transforming..."}]}
{"messages": [{"role": "system", "content": "You are a LinkedIn expert."}, {"role": "user", "content": "Career advice"}, {"role": "assistant", "content": "Here's what I learned..."}]}
```

**When to use fine-tuned vs base model:**
```typescript
// Generic queries - use base model
const genericResponse = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...]
});

// Domain-specific queries - use fine-tuned model
const linkedInResponse = await openai.chat.completions.create({
  model: 'ft:gpt-4o-mini-2024-07-18:personal::XXXXXXXX',  // Your fine-tuned model
  messages: [...]
});
```

**Costs & benefits:**
- Training: ~$10-50 depending on data size
- Inference: Same as base model
- Benefits: Consistent tone, domain expertise, style matching

---

## Type-Safe AI with Structured Outputs

**What it solves:** LLM responses are unpredictable strings. We need JSON objects we can trust.

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

// Define exactly what you want
const responseSchema = z.object({
  agent: z.enum(['linkedin', 'rag']),
  refinedQuery: z.string().min(10),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

// Get typed, validated response
const result = await generateObject({
  model: openai('gpt-4o'),
  schema: responseSchema,
  prompt: 'Route this query: "How do I learn TypeScript?"',
});

// TypeScript knows the shape!
console.log(result.object.agent);        // ✅ Type: 'linkedin' | 'rag'
console.log(result.object.confidence);   // ✅ Type: number (0-1)
console.log(result.object.invalid);      // ❌ TypeScript error!
```

**Request validation pattern:**
```typescript
// Define API contract
const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  agent: z.enum(['linkedin', 'rag']),
  query: z.string(),
});

// Validate incoming requests
export async function POST(req: Request) {
  const body = await req.json();
  const parsed = chatSchema.parse(body);  // Throws if invalid

  // TypeScript knows parsed.agent is 'linkedin' | 'rag'
  const { messages, agent, query } = parsed;

  // Use validated data...
}
```

**Why this matters:**
- Runtime validation catches bad data
- TypeScript prevents bugs at compile time
- No more "undefined is not a function" errors
- Self-documenting API contracts

---

## Streaming for Better UX

**What it solves:** Waiting 10 seconds for a response feels broken. Streaming shows progress.

```typescript
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { query } = await req.json();

  // Generate streaming response
  const result = await streamText({
    model: openai('gpt-4o'),
    system: 'You are a helpful assistant.',
    messages: [{ role: 'user', content: query }],
    temperature: 0.7,
  });

  // Return stream to client
  return result.toTextStreamResponse();
}
```

**Client-side consumption:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ query: 'Explain RAG' }),
});

// Read stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  console.log(chunk);  // Display incrementally!
}
```

**Benefits:**
- User sees progress immediately
- Perceived performance is 3-5x better
- Can cancel long-running requests
- Better error handling (partial responses)

---

## Key Architectural Patterns

### 1. The Agent Pattern
```typescript
type AgentRequest = {
  type: AgentType;
  query: string;           // Refined by selector
  originalQuery: string;   // User's actual words
  messages: Message[];     // Conversation history
};

type AgentResponse = StreamTextResult;

// Each agent follows the same contract
export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
  // Implementation...
}
```

### 2. The Over-Fetch + Rerank Pattern
```
Query → Embedding → Vector Search (20) → Rerank (10) → Generate
        ↓           ↓                     ↓              ↓
        512 dims    Fast but ~70%        Slower ~90%    Final answer
```

### 3. The Validation Chain
```
Raw JSON → Zod Schema → TypeScript Types → Business Logic
           ↓            ↓                   ↓
           Runtime      Compile time        Safe to use
           validation   type checking
```

---

## Summary: Building AI Products

**Key lessons from production code:**

1. **Two-stage retrieval** (vector search + reranking) beats single-stage
2. **Overlap in chunking** preserves context across boundaries
3. **LLMs as routers** enable intelligent request handling
4. **Fine-tuning** customizes models for your domain
5. **Structured outputs** make AI responses predictable
6. **Streaming** dramatically improves perceived performance

**The stack that powers this:**
- **Vector DB:** Qdrant (could be Pinecone, Weaviate, etc.)
- **Embeddings:** OpenAI `text-embedding-3-small` (512 dims)
- **Reranking:** Cohere `rerank-english-v3.0`
- **LLM:** OpenAI `gpt-4o` (or fine-tuned `gpt-4o-mini`)
- **Type safety:** Zod + TypeScript
- **Streaming:** Vercel AI SDK

**Cost considerations:**
- Embeddings: ~$0.002 per 1M tokens
- Reranking: ~$0.002 per 1K searches
- LLM: ~$2.50 per 1M input tokens (GPT-4o)
- Fine-tuning: ~$10-50 one-time training cost

**Performance benchmarks:**
- Vector search: 10-50ms
- Reranking: 100-300ms
- LLM generation: 2-5s (streaming starts immediately)
- End-to-end: ~3-8s for complex queries
