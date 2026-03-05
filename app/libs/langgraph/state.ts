import { Annotation } from '@langchain/langgraph';

/**
 * LangGraph State Definition using Annotation
 *
 * Each field is defined as a channel that can be updated by nodes.
 */
export const AgentStateAnnotation = Annotation.Root({
	query: Annotation<string>({
		reducer: (_, y) => y,
		default: () => '',
	}),
	selectedAgent: Annotation<'linkedin' | 'knowledgeBase' | 'general' | null>({
		reducer: (_, y) => y,
		default: () => null,
	}),
	refinedQuery: Annotation<string>({
		reducer: (_, y) => y,
		default: () => '',
	}),
	context: Annotation<string>({
		reducer: (_, y) => y,
		default: () => '',
	}),
	response: Annotation<string>({
		reducer: (_, y) => y,
		default: () => '',
	}),
	model: Annotation<string>({
		reducer: (_, y) => y,
		default: () => 'gpt-4o-mini',
	}),
});

export type AgentStateType = typeof AgentStateAnnotation.State;
