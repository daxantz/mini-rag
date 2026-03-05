/**
 * LANGGRAPH MULTI-AGENT SYSTEM
 *
 * This module refactors the existing agent flow into a LangGraph-based architecture.
 *
 * Benefits of LangGraph:
 * - Visual representation of agent flows
 * - Built-in state management
 * - Easy to add new agents or modify routing
 * - Support for complex workflows (loops, conditionals, parallel execution)
 * - Built-in persistence and checkpointing
 *
 * Learn more: https://langchain-ai.github.io/langgraphjs/
 */

export { AgentStateAnnotation, type AgentStateType } from './state';
export { agentGraph, runAgentGraph, streamAgentGraph } from './graph';
export {
	selectorNode,
	linkedinNode,
	ragNode,
	generalNode,
	routeToAgent,
} from './nodes';
