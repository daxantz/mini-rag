# Challenge: Refactor Your Agent Flow to LangGraph

Now that you understand LangGraph basics, it's time to apply it to your own code. In this challenge, you'll refactor your current agent system to use a graph-based workflow.

---

## Your Mission

Refactor your multi-agent system from plain code to LangGraph, adding at least one enhancement that would be difficult without a framework.

---

## Current System Overview

Right now, your system works like this:

```
User Query
    ↓
Selector Agent (API call)
    ↓
┌─────────────────────┐
│   Agent Router      │
├─────────────────────┤
│ if (agent === 'ln') │
│   → LinkedIn Agent  │
│ else                │
│   → RAG Agent       │
└─────────────────────┘
    ↓
Result
```

**Files involved:**
- `app/api/select-agent/route.ts` - Selector logic
- `app/agents/linkedin.ts` - LinkedIn agent
- `app/agents/rag.ts` - RAG agent
- `app/api/chat/route.ts` - Main chat handler (calls selector → agent)

---

## Challenge Requirements

### Part 1: Basic Refactor (Required)

Convert your current flow to a LangGraph workflow:

1. **Create a state schema** that tracks:
   ```typescript
   {
     query: string;
     agent: 'linkedin' | 'rag' | null;
     refinedQuery: string;
     result: string;
   }
   ```

2. **Create three nodes:**
   - `selectAgent` - Determines which agent to use
   - `linkedInAgent` - Generates LinkedIn content
   - `ragAgent` - Retrieves and generates using RAG

3. **Add conditional routing:**
   - From `selectAgent` → route to `linkedInAgent` or `ragAgent` based on `state.agent`

4. **Wire up the graph:**
   ```
   START → selectAgent → [linkedInAgent | ragAgent] → END
   ```

### Part 2: Add One Enhancement (Choose One)

Pick **one** enhancement that demonstrates why LangGraph is valuable:

#### Option A: Query Validation
Add a `validateQuery` node before the selector that checks if the query is valid:
- Too short (< 3 characters)
- Empty
- Just profanity/spam

If invalid, skip agents and return an error message.

```
START → validateQuery → [selectAgent | error] → ...
```

#### Option B: Confidence Check
After the selector, add a `checkConfidence` node:
- If confidence > 0.7, proceed to the agent
- If confidence < 0.7, route to a fallback node that asks for clarification

```
START → selectAgent → checkConfidence → [agent | clarify] → ...
```

#### Option C: Result Enhancement
After the agent generates content, add a `reviewContent` node:
- Use an LLM to score the quality (1-10)
- If score < 6, retry with modified prompt
- If score >= 6, return result

```
START → selectAgent → agent → reviewContent → [retry | END]
```

#### Option D: Logging & Analytics
Add a `logInteraction` node that:
- Logs the query, selected agent, and execution time
- Optionally sends to an analytics service
- Happens after agent selection but before execution

```
START → selectAgent → logInteraction → agent → END
```

---

## Setup

### 1. Install LangGraph

```bash
npm install @langchain/langgraph @langchain/core @langchain/openai
```

### 2. Create the workflow file

```bash
touch app/workflows/agent-graph.ts
```

---

## Implementation Hints

### Define State

```typescript
import { z } from 'zod';

export const agentGraphSchema = z.object({
  query: z.string(),
  agent: z.enum(['linkedin', 'rag']).nullable().optional(),
  refinedQuery: z.string().optional(),
  result: z.string().optional(),
  confidence: z.number().optional(), // For enhancement B
  error: z.string().optional(), // For enhancement A
});

export type AgentGraphState = z.infer<typeof agentGraphSchema>;
```

### Create Nodes

```typescript
import { StateGraph, START, END } from '@langchain/langgraph';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

const selectAgentNode = async (state: AgentGraphState) => {
  const selectionSchema = z.object({
    agent: z.enum(['linkedin', 'rag']).nullable(),
    query: z.string(),
    confidence: z.number().min(0).max(1),
  });

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: selectionSchema,
    prompt: `Analyze this query and route to the right agent...
Query: ${state.query}`,
  });

  return {
    agent: result.object.agent,
    refinedQuery: result.object.query,
    confidence: result.object.confidence,
  };
};
```

### Add Conditional Routing

```typescript
const routeByAgent = (state: AgentGraphState) => {
  if (state.agent === 'linkedin') return 'linkedInAgent';
  if (state.agent === 'rag') return 'ragAgent';
  return END; // No agent selected
};

graph.addConditionalEdges('selectAgent', routeByAgent);
```

### Build the Graph

```typescript
export const agentWorkflow = new StateGraph(agentGraphSchema)
  .addNode('selectAgent', selectAgentNode)
  .addNode('linkedInAgent', linkedInAgentNode)
  .addNode('ragAgent', ragAgentNode)
  .addEdge(START, 'selectAgent')
  .addConditionalEdges('selectAgent', routeByAgent)
  .addEdge('linkedInAgent', END)
  .addEdge('ragAgent', END)
  .compile();
```

### Use in API Route

```typescript
// app/api/chat-graph/route.ts
import { agentWorkflow } from '@/app/workflows/agent-graph';

export async function POST(req: Request) {
  const { query } = await req.json();

  const result = await agentWorkflow.invoke({ query });

  return Response.json({
    result: result.result,
    agent: result.agent,
  });
}
```

---

## Testing Your Graph

### 1. Test the basic flow

```bash
curl -X POST http://localhost:3000/api/chat-graph \
  -H "Content-Type: application/json" \
  -d '{"query": "Write a LinkedIn post about TypeScript"}'
```

**Expected:**
- Should route to `linkedInAgent`
- Return a LinkedIn-style post

### 2. Test RAG routing

```bash
curl -X POST http://localhost:3000/api/chat-graph \
  -H "Content-Type: application/json" \
  -d '{"query": "How do React hooks work?"}'
```

**Expected:**
- Should route to `ragAgent`
- Return a technical explanation

### 3. Test your enhancement

If you added query validation:
```bash
curl -X POST http://localhost:3000/api/chat-graph \
  -H "Content-Type: application/json" \
  -d '{"query": "hi"}'
```

**Expected:**
- Should detect invalid query and return an error

---

## Bonus: Visualize Your Graph

LangGraph can output Mermaid diagrams:

```typescript
import { agentWorkflow } from '@/app/workflows/agent-graph';

// Generate Mermaid diagram
const mermaid = agentWorkflow.getGraph().drawMermaid();
console.log(mermaid);
```

Copy the output to [Mermaid Live Editor](https://mermaid.live/) to see your workflow visually!

---

## Success Criteria

Your solution should:

✅ Use LangGraph StateGraph
✅ Have at least 3 nodes (selector + 2 agents)
✅ Use conditional edges for routing
✅ Implement one enhancement from Part 2
✅ Pass all routing tests (LinkedIn, RAG, invalid queries)
✅ Be deployable as a Next.js API route

---

## Common Pitfalls

**❌ Not compiling the graph:**
```typescript
const graph = new StateGraph(schema).addNode(...); // Missing .compile()
```

**✅ Always compile:**
```typescript
const workflow = new StateGraph(schema).addNode(...).compile();
```

**❌ Returning full objects instead of updates:**
```typescript
// Node shouldn't return the ENTIRE state
return { query: state.query, agent: 'linkedin', refinedQuery: '...' };
```

**✅ Return only updates:**
```typescript
// Return only what changed
return { agent: 'linkedin', refinedQuery: '...' };
```

**❌ Forgetting to handle null agent:**
```typescript
// If agent is null, this breaks
.addConditionalEdges('selectAgent', (state) =>
  state.agent === 'linkedin' ? 'linkedInAgent' : 'ragAgent'
);
```

**✅ Handle all cases:**
```typescript
.addConditionalEdges('selectAgent', (state) => {
  if (!state.agent) return END;
  return state.agent === 'linkedin' ? 'linkedInAgent' : 'ragAgent';
});
```

---

## Deliverables

When you're done, you should have:

1. **`app/workflows/agent-graph.ts`** - Your LangGraph workflow
2. **`app/api/chat-graph/route.ts`** - API route using the graph
3. **Working tests** - Verify routing and your enhancement
4. **Mermaid diagram** - Visual representation of your graph

---

## What's Next?

Once you complete this challenge, compare your solution to the reference implementation in the next lesson. You'll see:
- A production-ready LangGraph workflow
- Advanced patterns (loops, retries, human-in-the-loop)
- Real-world example from a content generation system

**Ready?** Start coding! Remember: start simple (basic refactor), then add your enhancement.

---

## Need Help?

**Stuck on state schema?**
- Look at the `agentTypeSchema` in `app/agents/config.ts` for inspiration

**Nodes not working?**
- Console.log the state in each node to debug
- Make sure you're returning updates, not the full state

**Routing broken?**
- Test conditional edge functions in isolation
- Verify state.agent is set correctly in selectAgent node

**Graph won't compile?**
- Check that all edges lead somewhere (no dead ends)
- Ensure START and END are used correctly

Good luck! 🚀
