import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentStateType } from './state';
import {
	selectorNode,
	linkedinNode,
	ragNode,
	generalNode,
	routeToAgent,
} from './nodes';

/**
 * LANGGRAPH AGENT FLOW
 *
 * This creates a directed graph that:
 * 1. Routes queries through the selector node
 * 2. Conditionally branches to the appropriate agent
 * 3. Returns the final response
 *
 * Graph structure:
 *
 *                    ┌─────────────┐
 *                    │   START     │
 *                    └──────┬──────┘
 *                           │
 *                           ▼
 *                    ┌─────────────┐
 *                    │  selector   │
 *                    └──────┬──────┘
 *                           │
 *              ┌────────────┼────────────┐
 *              │            │            │
 *              ▼            ▼            ▼
 *        ┌──────────┐ ┌──────────┐ ┌──────────┐
 *        │ linkedin │ │   rag    │ │ general  │
 *        └────┬─────┘ └────┬─────┘ └────┬─────┘
 *              │            │            │
 *              └────────────┼────────────┘
 *                           │
 *                           ▼
 *                    ┌─────────────┐
 *                    │    END      │
 *                    └─────────────┘
 */

// Create the graph using Annotation
const workflow = new StateGraph(AgentStateAnnotation)
	// Add nodes
	.addNode('selector', selectorNode)
	.addNode('linkedin', linkedinNode)
	.addNode('knowledgeBase', ragNode)
	.addNode('general', generalNode)

	// Set entry point
	.addEdge(START, 'selector')

	// Add conditional routing after selector
	.addConditionalEdges('selector', routeToAgent, {
		linkedin: 'linkedin',
		knowledgeBase: 'knowledgeBase',
		general: 'general',
	})

	// All agents go to END
	.addEdge('linkedin', END)
	.addEdge('knowledgeBase', END)
	.addEdge('general', END);

// Compile the graph
export const agentGraph = workflow.compile();

/**
 * Run the agent graph with a query
 */
export async function runAgentGraph(query: string): Promise<{
	selectedAgent: string;
	refinedQuery: string;
	response: string;
	context?: string;
}> {
	const result = (await agentGraph.invoke({
		query,
	})) as AgentStateType;

	return {
		selectedAgent: result.selectedAgent || 'unknown',
		refinedQuery: result.refinedQuery,
		response: result.response,
		context: result.context || undefined,
	};
}

/**
 * Stream the agent graph execution
 */
export async function* streamAgentGraph(query: string) {
	const stream = await agentGraph.stream({
		query,
	});

	for await (const event of stream) {
		yield event;
	}
}

// Export type for external use
export type { AgentStateType };
