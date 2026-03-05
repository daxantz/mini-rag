import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { z } from 'zod';
import { AgentStateType } from './state';
import { AGENT_CONFIG } from '../openai/agents/types';

// Initialize clients
const pinecone = new Pinecone({
	apiKey: process.env.PINECONE_API_KEY!,
});

const llm = new ChatOpenAI({
	model: 'gpt-4o-mini',
	temperature: 0.1,
});

const embeddings = new OpenAIEmbeddings({
	model: 'text-embedding-3-small',
	dimensions: 512,
});

/**
 * SELECTOR NODE
 *
 * Routes the query to the appropriate agent based on content analysis.
 * Uses structured output to ensure consistent routing decisions.
 */
export async function selectorNode(
	state: AgentStateType
): Promise<Partial<AgentStateType>> {
	const agentDescriptions = Object.values(AGENT_CONFIG)
		.map((agent) => `- ${agent.name}: ${agent.description}`)
		.join('\n');

	const SYSTEM_PROMPT = `You are an agent router. Analyze the user query and select the best agent.

Available agents:
${agentDescriptions}

Select the most appropriate agent and refine the query if needed.`;

	const result = await llm
		.withStructuredOutput(
			z.object({
				selectedAgent: z.enum(['linkedin', 'knowledgeBase', 'general']),
				refinedQuery: z.string(),
			})
		)
		.invoke([
			{ role: 'system', content: SYSTEM_PROMPT },
			{ role: 'user', content: state.query },
		]);

	return {
		selectedAgent: result.selectedAgent,
		refinedQuery: result.refinedQuery,
		model: AGENT_CONFIG[result.selectedAgent].model,
	};
}

/**
 * LINKEDIN NODE
 *
 * Generates LinkedIn content using the fine-tuned model.
 */
export async function linkedinNode(
	state: AgentStateType
): Promise<Partial<AgentStateType>> {
	const linkedinLlm = new ChatOpenAI({
		model: state.model,
		temperature: 0.7,
	});

	const SYSTEM_PROMPT = `You are a LinkedIn expert assistant, specialized in helping with LinkedIn-related queries.
You have been fine-tuned on LinkedIn-specific data to provide accurate and relevant responses.
Focus on providing practical, actionable advice for LinkedIn-related questions.
You never use emojis.`;

	const result = await linkedinLlm
		.withStructuredOutput(z.object({ response: z.string() }))
		.invoke([
			{ role: 'system', content: SYSTEM_PROMPT },
			{ role: 'user', content: state.refinedQuery },
		]);

	return {
		response: result.response,
	};
}

/**
 * RAG NODE (Knowledge Base)
 *
 * Retrieves relevant context from Pinecone and generates a grounded response.
 */
export async function ragNode(
	state: AgentStateType
): Promise<Partial<AgentStateType>> {
	// Step 1: Get embedding for the query
	const queryEmbedding = await embeddings.embedQuery(state.refinedQuery);

	// Step 2: Search Pinecone
	const index = pinecone.Index(process.env.PINECONE_INDEX!);
	const searchResults = await index.query({
		vector: queryEmbedding,
		topK: 5,
		includeMetadata: true,
	});

	// Step 3: Extract context
	const context =
		searchResults.matches
			?.map((match) => {
				const metadata = match.metadata as {
					content?: string;
					text?: string;
					title?: string;
					source?: string;
				};
				const content = metadata?.content || metadata?.text || '';
				const source = metadata?.title || metadata?.source || 'Unknown';
				return `SOURCE: ${source}\n${content}`;
			})
			.filter(Boolean)
			.join('\n\n---\n\n') || '';

	// Step 4: Generate response with context
	const ragLlm = new ChatOpenAI({
		model: state.model,
		temperature: 0.7,
	});

	const SYSTEM_PROMPT = `You are a knowledgeable assistant that provides accurate information based on the content in your knowledge base.
Use the provided content to answer the user's query.
If the provided content doesn't contain relevant information, say so and provide a general response.
Always cite your sources when possible.`;

	const result = await ragLlm
		.withStructuredOutput(z.object({ response: z.string() }))
		.invoke([
			{ role: 'system', content: SYSTEM_PROMPT },
			{
				role: 'user',
				content: `Query: ${state.refinedQuery}\n\nRelevant content from knowledge base:\n${context}`,
			},
		]);

	return {
		context,
		response: result.response,
	};
}

/**
 * GENERAL NODE
 *
 * Handles general queries without RAG or fine-tuning.
 */
export async function generalNode(
	state: AgentStateType
): Promise<Partial<AgentStateType>> {
	const generalLlm = new ChatOpenAI({
		model: state.model,
		temperature: 0.7,
	});

	const SYSTEM_PROMPT = `You are a helpful assistant. Provide clear, accurate, and helpful responses to user queries.`;

	const result = await generalLlm
		.withStructuredOutput(z.object({ response: z.string() }))
		.invoke([
			{ role: 'system', content: SYSTEM_PROMPT },
			{ role: 'user', content: state.refinedQuery },
		]);

	return {
		response: result.response,
	};
}

/**
 * ROUTING FUNCTION
 *
 * Determines which agent node to execute based on selector output.
 */
export function routeToAgent(
	state: AgentStateType
): 'linkedin' | 'knowledgeBase' | 'general' {
	switch (state.selectedAgent) {
		case 'linkedin':
			return 'linkedin';
		case 'knowledgeBase':
			return 'knowledgeBase';
		case 'general':
		default:
			return 'general';
	}
}
