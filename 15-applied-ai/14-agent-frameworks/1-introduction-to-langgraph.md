# Introduction to LangGraph

You've built a multi-agent system with a selector and specialized agents. As workflows grow more complex (multiple steps, conditional routing, state sharing), **agent frameworks** like LangGraph provide structure - similar to how React provides structure for complex UIs.

---

## What is LangGraph?

**LangGraph** is a framework for building **stateful, multi-step agent workflows** as graphs:
- **Nodes** = processing steps (call an LLM, fetch data, etc.)
- **Edges** = connections between steps
- **State** = data that flows through the workflow

Think of it as a state machine for your agents.

---

## When Do You Need It?

### Use Plain Code When:
- Simple linear workflows (A → B → C)
- 2-3 agents with straightforward routing
- No complex state sharing

**Your current system is fine without a framework!**

### Use LangGraph When:
- Complex conditional routing (if X then Y, else Z)
- Multiple agents sharing state
- Loops or retry logic
- Long-running workflows needing checkpoints
- You need to visualize/debug complex flows

---

## Core Concepts

### 1. StateGraph - Define Your Workflow

```typescript
import { StateGraph, START, END } from '@langchain/langgraph';
import { z } from 'zod';

// Define what data flows through the graph
const schema = z.object({
  query: z.string(),
  selectedAgent: z.string().optional(),
  result: z.string().optional(),
});

const graph = new StateGraph(schema);
```

### 2. Nodes - Processing Steps

Nodes receive state, do work, return updates:

```typescript
const selectAgentNode = async (state: z.infer<typeof schema>) => {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({ agent: z.enum(['linkedin', 'rag']) }),
    prompt: `Route this query: ${state.query}`,
  });

  return { selectedAgent: result.object.agent };
};

graph.addNode('selectAgent', selectAgentNode);
```

### 3. Edges - Define Flow

```typescript
// Simple edge: always go from A to B
graph.addEdge(START, 'selectAgent');

// Conditional edge: branch based on state
graph.addConditionalEdges('selectAgent', (state) => {
  return state.selectedAgent === 'linkedin'
    ? 'linkedInAgent'
    : 'ragAgent';
});

graph.addEdge('linkedInAgent', END);
graph.addEdge('ragAgent', END);
```

### 4. Compile and Run

```typescript
const workflow = graph.compile();

const result = await workflow.invoke({
  query: 'Write a LinkedIn post about React'
});

console.log(result.result);
```

---

## Example: Your Agent Selector as a Graph

### Current Approach (Plain Code)

```typescript
// app/api/chat/route.ts
async function handleChat(query: string) {
  const selection = await selectAgent(query);

  if (selection.agent === 'linkedin') {
    return await linkedInAgent({ query: selection.refinedQuery });
  } else {
    return await ragAgent({ query: selection.refinedQuery });
  }
}
```

**Challenge:** Hard to add validation, logging, or retry logic.

### LangGraph Approach

```typescript
import { StateGraph, START, END } from '@langchain/langgraph';
import { z } from 'zod';

const schema = z.object({
  query: z.string(),
  agent: z.enum(['linkedin', 'rag']).optional(),
  refinedQuery: z.string().optional(),
  result: z.string().optional(),
});

// Nodes
const selectAgentNode = async (state) => {
  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({ agent: z.enum(['linkedin', 'rag']), query: z.string() }),
    prompt: `Route: ${state.query}`,
  });
  return { agent: result.object.agent, refinedQuery: result.object.query };
};

const linkedInAgentNode = async (state) => {
  const result = await linkedInAgent({ query: state.refinedQuery });
  return { result: await result.text };
};

const ragAgentNode = async (state) => {
  const result = await ragAgent({ query: state.refinedQuery });
  return { result: await result.text };
};

// Build graph
const workflow = new StateGraph(schema)
  .addNode('selectAgent', selectAgentNode)
  .addNode('linkedInAgent', linkedInAgentNode)
  .addNode('ragAgent', ragAgentNode)
  .addEdge(START, 'selectAgent')
  .addConditionalEdges('selectAgent', (state) =>
    state.agent === 'linkedin' ? 'linkedInAgent' : 'ragAgent'
  )
  .addEdge('linkedInAgent', END)
  .addEdge('ragAgent', END)
  .compile();

// Use it
const result = await workflow.invoke({ query: 'Hello' });
```

**Benefits:**
- Visual structure (can see the flow)
- Easy to add steps (validation, logging)
- State flows automatically
- Built-in debugging tools

**Visualization:**
```
START → selectAgent → [linkedInAgent | ragAgent] → END
```

---

## Why LangGraph Helps: Real Example

Let's say you want to add query validation. With plain code:

```typescript
// Getting messy...
async function handleChat(query: string) {
  // Validate
  if (query.length < 3) return 'Query too short';

  // Select
  const selection = await selectAgent(query);

  // Check confidence
  if (selection.confidence < 0.7) return 'Please clarify';

  // Route
  if (selection.agent === 'linkedin') {
    const result = await linkedInAgent({ query: selection.refinedQuery });

    // Quality check
    const score = await evaluateQuality(result);
    if (score < 6) {
      // Retry?
      return await linkedInAgent({ query: selection.refinedQuery + ' (revised)' });
    }

    return result;
  } else {
    // ... same for RAG
  }
}
```

With LangGraph:

```typescript
const workflow = new StateGraph(schema)
  .addNode('validateQuery', validateNode)
  .addNode('selectAgent', selectNode)
  .addNode('checkConfidence', checkConfidenceNode)
  .addNode('linkedInAgent', linkedInNode)
  .addNode('ragAgent', ragNode)
  .addNode('evaluateQuality', evaluateNode)
  .addEdge(START, 'validateQuery')
  .addConditionalEdges('validateQuery', (s) => s.isValid ? 'selectAgent' : END)
  .addEdge('selectAgent', 'checkConfidence')
  .addConditionalEdges('checkConfidence', routeByConfidence)
  .addConditionalEdges('evaluateQuality', (s) => s.score < 6 ? 'linkedInAgent' : END)
  .compile();
```

Each node has one job. Flow is clear. Easy to modify.

---

## What's Next?

Now you understand LangGraph basics. Next:

1. **Challenge** - Refactor your agent flow to use LangGraph
2. **Solution** - See a production-ready implementation

---

## Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangGraph TypeScript Examples](https://github.com/langchain-ai/langgraphjs/tree/main/examples)
- [LangGraph Studio](https://github.com/langchain-ai/langgraph-studio) - Visual debugger

---

## Key Takeaways

- **LangGraph = graphs for agent workflows** (nodes = steps, edges = flow)
- **Use it for complex workflows** - validation, routing, retries, state sharing
- **Your current system is fine** - only adopt if adding complexity
- **State flows automatically** - no manual data passing
- **Visual debugging** - see the workflow, not just code
