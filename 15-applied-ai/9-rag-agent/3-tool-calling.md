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
				},
			}),
		},
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
		},
	});
}
```

**Key Components:**

- `description`: Tells the AI when to use this tool
- `inputSchema`: Validates tool inputs using Zod
- `execute`: The function that runs when AI calls the tool

---

### 2. Tool Choice Strategies

```typescript
toolChoice: 'auto'; // AI decides when to use tools
// vs
toolChoice: 'required'; // AI must use a tool
// vs
toolChoice: 'none'; // AI cannot use tools
```

**Best Practice:** Use `'auto'` to let the AI make intelligent decisions.

---

### 3. Safety Mechanisms

```typescript
stopWhen: stepCountIs(15); // Prevent infinite tool-calling loops
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

## Your Challenge

Modify your RAG agent to use tool-calling instead of a fixed workflow.

### Requirements:

1. **Define a tool** that performs your current RAG workflow (embedding → search → re-rank)
2. **Configure tool choice** to let the AI decide when to use it
3. **Add safety limits** to prevent infinite loops
4. **Write a system prompt** that instructs the AI when to use the tool

### Starter Code Structure:

```typescript
export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
	return streamText({
		model: openai('gpt-4o'),
		toolChoice: 'auto',
		stopWhen: stepCountIs(10),
		tools: {
			search_documentation: tool({
				description: 'Search documentation for relevant context',
				inputSchema: z.object({
					query: z.string(),
				}),
				execute: async ({ query }) => {
					// TODO: Implement your RAG workflow here
					// 1. Generate embedding
					// 2. Search vector DB
					// 3. Re-rank results
					// 4. Return context
				},
			}),
		},
		messages: [
			{
				role: 'system',
				content: `You are a helpful assistant.

When the user asks about technical topics, use the search_documentation tool.
For general conversation, answer directly without using tools.`,
			},
			{
				role: 'user',
				content: request.query,
			},
		],
	});
}
```

---

## Testing Your Implementation

### Test Case 1: Should Use Tool

**Request:**

- Method: POST
- URL: `http://localhost:3000/api/chat`
- Headers: `Content-Type: application/json`
- Body:

```json
{
	"messages": [{ "role": "user", "content": "How do I use React hooks?" }],
	"agent": "rag",
	"query": "React hooks documentation"
}
```

**Expected:** AI calls `search_documentation` tool, retrieves context, generates answer.

---

### Test Case 2: Should NOT Use Tool

**Request:**

- Method: POST
- URL: `http://localhost:3000/api/chat`
- Headers: `Content-Type: application/json`
- Body:

```json
{
	"messages": [{ "role": "user", "content": "Thanks!" }],
	"agent": "rag"
}
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
};
```

You should see tool calls logged only for queries that need context retrieval.

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
