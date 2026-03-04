# Tool-Calling in AI Agents

Now that you have a working RAG agent with re-ranking, let's explore a powerful pattern: giving your AI agent **tools** to decide when and how to retrieve context.

---

## What You'll Learn

This module covers:
- The difference between tools and workflows
- When to use tool-calling vs direct workflows
- How to implement tools with the AI SDK
- Building an agent that decides when to search for context

---

## Tools vs Workflows

### Workflow Approach (What You've Built)

Your current RAG agent uses a **workflow** - a fixed sequence of steps that always executes:

```
User Query → Embedding → Vector Search → Re-rank → Generate Response
```

**Characteristics:**
- Predictable and deterministic
- Always retrieves context, even if not needed
- No decision-making by the AI
- Lower cost per request

**Example:**
```typescript
export async function ragAgent(request: AgentRequest) {
  // Always runs these steps
  const embedding = await generateEmbedding(request.query);
  const results = await searchVectorDB(embedding);
  const reranked = await rerank(results);
  return streamText({ context: reranked });
}
```

---

### Tool-Calling Approach

With **tool-calling**, the AI agent decides whether to use tools based on the query:

```
User Query → AI Decides → [Use Tool] OR [Answer Directly]
                ↓
         Embedding → Search → Re-rank → Generate
```

**Characteristics:**
- AI decides when to retrieve context
- Can skip retrieval for simple queries
- More flexible and intelligent
- Higher cost per request (extra AI decision step)

**Example:**
```typescript
export async function ragAgent(request: AgentRequest) {
  return streamText({
    model: openai('gpt-4o'),
    tools: {
      generate_linkedin_post: tool({
        // AI calls this ONLY when needed
        execute: async ({ query }) => {
          const embedding = await generateEmbedding(query);
          const results = await searchVectorDB(embedding);
          return rerank(results);
        }
      })
    }
  });
}
```

---

## When to Use Each Approach

### ✅ Use Workflows When:

- **Simple, predictable use case**: Every query needs the same process
- **Cost-sensitive applications**: Avoid extra LLM calls to decide
- **Deterministic behavior required**: Regulatory or compliance needs
- **Single-purpose agents**: E.g., "Always search docs and answer"

**Example Use Cases:**
- Customer support bot (always search knowledge base)
- Documentation Q&A (always retrieve relevant docs)
- FAQ chatbot (always match against FAQ database)

---

### ✅ Use Tool-Calling When:

- **Multi-capability agents**: Agent can do multiple things
- **Query-dependent logic**: Some queries need context, others don't
- **Interactive tasks**: Agent might need multiple tool calls
- **Complex decision-making**: When to search, what to search, how to combine results

**Example Use Cases:**
- Content creation agent (might search examples, or create from scratch)
- Research assistant (decides which databases to query)
- Code assistant (might search docs, or answer from training)
- Multi-step tasks (search → analyze → search again → synthesize)

---

## Implementation Example

Here's a LinkedIn content creator that uses tool-calling to decide when to retrieve context:

```typescript
import { AgentRequest, AgentResponse } from './types';
import { openaiClient } from '@/app/libs/openai/openai';
import { openai } from '@ai-sdk/openai';
import { stepCountIs, streamText, tool } from 'ai';
import { qdrantClient } from '../libs/qdrant';
import { cohereClient } from '../libs/cohere';
import { z } from 'zod';

export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
    const { query } = request;

    return streamText({
        model: openai('gpt-4o'),
        toolChoice: 'auto', // Let AI decide when to use tools
        stopWhen: stepCountIs(15), // Prevent infinite loops
        tools: {
            generate_linkedin_post: tool({
                description: 'Generate a LinkedIn post based on a user query',
                inputSchema: z.object({
                    query: z.string(),
                }),
                execute: async ({ query }) => {
                    // Step 1: Generate embedding
                    const embedding = await openaiClient.embeddings.create({
                        model: 'text-embedding-3-small',
                        dimensions: 512,
                        input: query,
                    });

                    // Step 2: Search multiple collections
                    const linkedInPosts = await qdrantClient.search(
                        'linkedin',
                        {
                            vector: embedding.data[0].embedding,
                            limit: 10,
                            with_payload: true,
                        },
                    );

                    const articles = await qdrantClient.search('articles', {
                        vector: embedding.data[0].embedding,
                        limit: 10,
                        with_payload: true,
                    });

                    // Step 3: Re-rank all results together
                    const rerankedDocuments = await cohereClient.rerank({
                        model: 'rerank-english-v3.0',
                        query: query,
                        documents: [
                            ...linkedInPosts.map(
                                (post) => post.payload?.content as string,
                            ),
                            ...articles.map(
                                (article) => article.payload?.content as string,
                            ),
                        ],
                        topN: 10,
                        returnDocuments: true,
                    });

                    // Return context to the AI
                    return rerankedDocuments.results.map(
                        (result) => result.document?.text,
                    );
                },
            }),
        },
        messages: [
            {
                role: 'system',
                content: `You are a LinkedIn content creator. Your task is to generate an engaging LinkedIn post based on user queries.

## Content Creation Process
**IMPORTANT: For ANY content creation request, you MUST use the tool BEFORE writing:**
1. ALWAYS call generate_linkedin_post tool first to retrieve relevant context from similar posts and articles
2. Only after receiving tool results should you draft the LinkedIn post

## Writing Guidelines
After receiving the context, write a compelling LinkedIn post that:
- Is authentic and engaging
- Incorporates insights from the retrieved content
- Matches the format and style of the retrieved content
- Is formatted appropriately with line breaks and emojis where relevant

Never use emojis or hashtags in the post.`,
            },
            {
                role: 'user',
                content: query,
            },
        ],
        temperature: 0.8,
    });
}
```

---

## Breaking Down the Tool Definition

### 1. Tool Configuration

```typescript
tools: {
    generate_linkedin_post: tool({
        description: 'Generate a LinkedIn post based on a user query',
        inputSchema: z.object({
            query: z.string(),
        }),
        execute: async ({ query }) => {
            // Tool implementation
        }
    })
}
```

**Key Components:**
- `description`: Tells the AI when to use this tool
- `inputSchema`: Validates tool inputs using Zod
- `execute`: The function that runs when AI calls the tool

---

### 2. Tool Choice Strategies

```typescript
toolChoice: 'auto'  // AI decides when to use tools
// vs
toolChoice: 'required'  // AI must use a tool
// vs
toolChoice: 'none'  // AI cannot use tools
```

**Best Practice:** Use `'auto'` to let the AI make intelligent decisions.

---

### 3. Safety Mechanisms

```typescript
stopWhen: stepCountIs(15)  // Prevent infinite tool-calling loops
```

Without this, an agent might get stuck calling tools repeatedly. Always set a reasonable limit.

---

## The Execution Flow

Here's what happens when a user asks: "Write a post about AI agents"

```
1. User: "Write a post about AI agents"
   ↓
2. AI analyzes query → Decides to use generate_linkedin_post tool
   ↓
3. Tool executes:
   - Generates embedding for "AI agents"
   - Searches LinkedIn posts collection
   - Searches articles collection
   - Re-ranks all results
   - Returns top 10 context pieces
   ↓
4. AI receives tool results
   ↓
5. AI writes LinkedIn post using the retrieved context
   ↓
6. Streams response to user
```

---

## Comparison: Workflow vs Tool-Calling

Let's see how each approach handles different queries:

### Query 1: "Write a post about microservices"

**Workflow Approach:**
```
✅ Retrieves context (needed)
✅ Generates post with examples
Cost: 1 embedding + 1 search + 1 rerank + 1 generation
```

**Tool-Calling Approach:**
```
✅ AI decides to call tool
✅ Retrieves context (needed)
✅ Generates post with examples
Cost: 1 decision + 1 embedding + 1 search + 1 rerank + 1 generation
```

**Winner:** Workflow (slightly cheaper, same quality)

---

### Query 2: "What did I ask you before?"

**Workflow Approach:**
```
❌ Retrieves context (NOT needed - wasted cost)
❌ Searches for "what did I ask" in vector DB
⚠️ Generates confusing response with irrelevant context
Cost: 1 embedding + 1 search + 1 rerank + 1 generation
```

**Tool-Calling Approach:**
```
✅ AI decides NOT to call tool
✅ Answers directly from conversation history
✅ Faster, cheaper, more relevant
Cost: 1 decision + 1 generation
```

**Winner:** Tool-calling (smarter, cheaper, better UX)

---

## Your Challenge: Refactor to Tool-Calling

Now refactor your RAG agent from a fixed workflow to an intelligent tool-calling agent.

### What You're Refactoring

**Before (Workflow) - Always Runs:**
```typescript
export async function ragAgent(request: AgentRequest) {
  // These steps ALWAYS execute, even for "Thanks!"
  const embeddingResponse = await openaiClient.embeddings.create(...);
  const embedding = embeddingResponse.data[0].embedding;

  const index = pineconeClient.Index(process.env.PINECONE_INDEX!);
  const queryResponse = await index.query({
    vector: embedding,
    topK: 10,
    includeMetadata: true,
  });

  const documents = queryResponse.matches.map(...);
  const reranked = await pineconeClient.inference.rerank(...);
  const context = reranked.data.map(...).join('\n\n');

  const systemPrompt = `You are a helpful assistant...
  Context: ${context}`;

  return streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: request.messages,
  });
}
```

**After (Tool-Calling) - Runs Only When Needed:**
```typescript
export async function ragAgent(request: AgentRequest) {
  return streamText({
    model: openai('gpt-4o'),
    toolChoice: 'auto',  // AI decides
    tools: {
      search_documentation: tool({
        description: 'Search React docs...',
        execute: async ({ query }) => {
          // Your RAG workflow moves here
          // Only runs when AI calls this tool
          const embedding = await generateEmbedding(query);
          const results = await searchPinecone(embedding);
          const reranked = await rerank(results);
          return reranked; // Return context for AI to use
        }
      })
    },
    messages: [...request.messages],
  });
}
```

**Key Difference:** The workflow is now inside a tool. The AI decides whether to call it.

---

### Step 1: Import Required Functions

Add the tool helpers to your imports in `app/agents/rag.ts`:

```typescript
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
```

---

### Step 2: Restructure the Agent Function

Replace your current implementation with the tool-calling structure:

```typescript
export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
    return streamText({
        model: openai('gpt-4o'),
        toolChoice: 'auto',      // Let AI decide when to use tools
        stopWhen: stepCountIs(10), // Prevent infinite loops
        tools: {
            // Move your RAG workflow here (next step)
        },
        messages: [
            {
                role: 'system',
                content: `You are a helpful assistant that answers questions about React documentation.

When users ask technical questions about React, use the search_documentation tool to retrieve relevant context.
For general conversation (greetings, thanks, clarifications), respond directly without using tools.`,
            },
            ...request.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        ],
    });
}
```

**Key Changes:**
- Wrapped in `streamText()` instead of executing workflow directly
- Added `toolChoice: 'auto'` to let AI decide
- Added `stopWhen: stepCountIs(10)` for safety
- System prompt instructs when to use tools

---

### Step 3: Define the search_documentation Tool

Move your RAG workflow (embed → search → rerank) into a tool:

```typescript
tools: {
    search_documentation: tool({
        description: 'Search React documentation for relevant information about hooks, components, and APIs. Use this when users ask technical questions.',
        inputSchema: z.object({
            query: z.string().describe('The search query to find relevant documentation'),
        }),
        execute: async ({ query }) => {
            // TODO: Move your RAG workflow here
            // 1. Generate embedding for the query
            // 2. Search Pinecone with topK: 10
            // 3. Extract documents from matches
            // 4. Rerank with Pinecone inference
            // 5. Return the top reranked documents as context

            // Hint: This is the same code you wrote in modules 9.1 and 9.2
            // Just return the reranked documents instead of building a prompt
        },
    }),
},
```

**Tool Components:**
- `description`: Tells the AI when to use this tool
- `inputSchema`: Validates the query parameter with Zod
- `execute`: Your RAG workflow goes here

---

### Step 4: Implement the Tool's Execute Function

Copy your RAG workflow into the tool's `execute` function:

**Hints:**
```typescript
execute: async ({ query }) => {
    console.log('🔧 Tool called for query:', query);

    // Step 1: Generate embedding
    const embeddingResponse = await openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // Step 2: Search Pinecone
    const index = pineconeClient.Index(process.env.PINECONE_INDEX!);
    const queryResponse = await index.query({
        vector: embedding,
        topK: 10,
        includeMetadata: true,
    });

    // Step 3: Extract documents
    const documents = queryResponse.matches
        .map((match) => match.metadata?.text)
        .filter(Boolean) as string[];

    // Step 4: Rerank
    const reranked = await pineconeClient.inference.rerank({
        model: 'bge-reranker-v2-m3',
        query: query,
        documents: documents,
        topK: 5,
        returnDocuments: true,
    });

    // Step 5: Return context (not prompt!)
    const context = reranked.data
        .map((result) => result.document?.text)
        .filter(Boolean)
        .join('\n\n');

    console.log('📊 Retrieved', reranked.data.length, 'documents');

    return context;
},
```

**Important:** Return the context text, not a full prompt. The AI will use the returned context to formulate its response.

---

### Step 5: Remove the Old Workflow Code

Delete the old workflow code:
- Remove embedding generation at the top level
- Remove Pinecone search at the top level
- Remove reranking at the top level
- Remove system prompt building

All of this now happens inside the tool when the AI calls it.

---

## Testing Your Implementation

### Test Case 1: Should Use Tool

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "How do I use React hooks?"}],
    "agent": "rag",
    "query": "React hooks documentation"
  }'
```

**Expected:** AI calls `search_documentation` tool, retrieves context, generates answer.

---

### Test Case 2: Should NOT Use Tool

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Thanks!"}],
    "agent": "rag"
  }'
```

**Expected:** AI responds directly without calling any tools.

---

### Debugging Tool Calls

Add logging to see when tools are called:

```typescript
execute: async ({ query }) => {
    console.log('🔧 Tool called with query:', query);

    const results = await performRAG(query);

    console.log('📊 Retrieved context:', results.length, 'documents');

    return results;
}
```

**What to look for in your console:**

When you send "How do I use useState?":
```
🔧 Tool called with query: How do I use useState?
📊 Retrieved 5 documents
```

When you send "Thanks!":
```
(no tool logs - AI responded directly)
```

This confirms the AI is making intelligent decisions about when to retrieve context.

---

## Observing Tool Execution

To see the full execution flow, you can add more detailed logging:

```typescript
execute: async ({ query }) => {
    console.log('\n=== TOOL EXECUTION START ===');
    console.log('Query:', query);

    const startTime = Date.now();

    // Your RAG workflow...

    const duration = Date.now() - startTime;
    console.log('Duration:', duration, 'ms');
    console.log('=== TOOL EXECUTION END ===\n');

    return context;
}
```

This helps you understand:
- When tools are called
- What queries trigger them
- How long they take
- How much context they retrieve

**Pro Tip:** In production, use proper observability tools (like Helicone, covered in module 12) instead of console logs.

---

## Cost Analysis

Let's compare costs for 100 queries (50 need context, 50 don't):

### Workflow Approach (Always Retrieves)

```
100 queries × (embedding + search + rerank + generation)
= 100 × $0.025
= $2.50
```

**Waste:** 50 unnecessary retrievals ($1.25 wasted)

---

### Tool-Calling Approach (Selective Retrieval)

```
100 queries × decision = 100 × $0.002 = $0.20
50 queries × (embedding + search + rerank + generation) = 50 × $0.025 = $1.25
Total = $1.45
```

**Savings:** $1.05 per 100 queries (42% cheaper)

---

## Reference Solution

<details>
<summary>⚠️ Only look at this after attempting the refactoring yourself! Click to reveal the complete tool-calling implementation.</summary>

```typescript
import { AgentRequest, AgentResponse } from './types';
import { pineconeClient } from '@/app/libs/pinecone';
import { openaiClient } from '@/app/libs/openai/openai';
import { openai } from '@ai-sdk/openai';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';

export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
	return streamText({
		model: openai('gpt-4o'),
		toolChoice: 'auto',
		stopWhen: stepCountIs(10),
		tools: {
			search_documentation: tool({
				description:
					'Search React documentation for relevant information about hooks, components, and APIs. Use this when users ask technical questions about React.',
				inputSchema: z.object({
					query: z
						.string()
						.describe('The search query to find relevant documentation'),
				}),
				execute: async ({ query }) => {
					console.log('🔧 Tool called with query:', query);

					// Step 1: Generate embedding
					const embeddingResponse = await openaiClient.embeddings.create({
						model: 'text-embedding-3-small',
						input: query,
					});
					const embedding = embeddingResponse.data[0].embedding;

					// Step 2: Query Pinecone (over-fetch for reranking)
					const index = pineconeClient.Index(process.env.PINECONE_INDEX!);
					const queryResponse = await index.query({
						vector: embedding,
						topK: 10,
						includeMetadata: true,
					});

					// Step 3: Extract documents
					const documents = queryResponse.matches
						.map((match) => match.metadata?.text)
						.filter(Boolean) as string[];

					if (documents.length === 0) {
						return 'No relevant documentation found.';
					}

					// Step 4: Rerank with Pinecone inference
					const reranked = await pineconeClient.inference.rerank({
						model: 'bge-reranker-v2-m3',
						query: query,
						documents: documents,
						topK: 5,
						returnDocuments: true,
					});

					// Step 5: Build context from reranked results
					const context = reranked.data
						.map((result) => result.document?.text)
						.filter(Boolean)
						.join('\n\n');

					console.log('📊 Retrieved', reranked.data.length, 'documents');

					return context;
				},
			}),
		},
		messages: [
			{
				role: 'system',
				content: `You are a helpful assistant that answers questions about React documentation.

## Tool Usage
When users ask technical questions about React (hooks, components, APIs, etc.), use the search_documentation tool to retrieve relevant context before answering.

For general conversation (greetings, thanks, clarifications), respond directly without using tools.

## Answering Guidelines
- Base your answers on the retrieved documentation context
- If the context doesn't contain enough information, say so clearly
- Provide code examples when relevant
- Be concise but thorough`,
			},
			...request.messages.map((msg) => ({
				role: msg.role,
				content: msg.content,
			})),
		],
	});
}
```

**Key Features:**
- ✅ Tool decides when to search (not every query)
- ✅ Complete RAG workflow in tool's `execute` function
- ✅ Safety limit with `stopWhen: stepCountIs(10)`
- ✅ Clear system prompt instructing tool usage
- ✅ Logging for debugging tool calls
- ✅ Handles case when no documents found

</details>

---

## Advanced: Multiple Tools

You can give your agent multiple tools for different tasks:

```typescript
tools: {
    search_documentation: tool({
        description: 'Search technical documentation',
        execute: async ({ query }) => { /* ... */ }
    }),
    search_examples: tool({
        description: 'Search code examples',
        execute: async ({ query }) => { /* ... */ }
    }),
    search_blog_posts: tool({
        description: 'Search blog articles',
        execute: async ({ query }) => { /* ... */ }
    })
}
```

The AI will choose the most appropriate tool (or combination of tools) based on the query.

---

## What You Learned

✅ The difference between tools and workflows
✅ When to use tool-calling vs direct workflows
✅ How to implement tools with the AI SDK
✅ Tool choice strategies and safety mechanisms
✅ Cost implications of intelligent tool selection
✅ How to test and debug tool-calling agents

---

## What's Next?

Consider exploring:
- **Multi-step tool use**: Agent calls multiple tools in sequence
- **Tool chaining**: Output of one tool feeds into another
- **Conditional tools**: Different tools for different user types
- **Observability**: Tracking tool usage and performance (next module!)
