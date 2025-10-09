import { AgentRequest, AgentResponse } from './types';
import { pineconeClient } from '@/app/libs/pinecone';
import { openaiClient } from '@/app/libs/openai/openai';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Store sources globally for the current request (simple approach for now)
let currentSources: Array<{ title: string; url?: string; snippet?: string }> = [];

export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
	const embeddingResponse = await openaiClient.embeddings.create({
		model: 'text-embedding-3-small',
		dimensions: 512,
		input: request.query,
	});

	const embedding = embeddingResponse.data[0].embedding;

	const index = pineconeClient.Index(process.env.PINECONE_INDEX!);

	const queryResponse = await index.query({
		vector: embedding,
		topK: 10,
		includeMetadata: true,
	});

	// Store original matches with metadata for sources
	const matchesWithMetadata = queryResponse.matches.map((match) => ({
		text: (match.metadata?.text ?? match.metadata?.content) as string,
		url: match.metadata?.url as string | undefined,
		title: match.metadata?.title as string | undefined,
		score: match.score,
	}));

	const documents = matchesWithMetadata
		.map((match) => match.text)
		.filter(Boolean);

	const reranked = await pineconeClient.inference.rerank(
		'bge-reranker-v2-m3',
		request.query,
		documents as string[]
	);

	const retrievedContext = reranked.data
		.map((result) => result.document?.text)
		.filter(Boolean)
		.join('\n\n');

	// Build sources array from reranked results
	const sources = reranked.data
		.slice(0, 3) // Top 3 sources
		.map((result, index) => {
			const originalMatch = matchesWithMetadata[result.index];
			return {
				title:
					originalMatch?.title ||
					originalMatch?.url ||
					`Source ${index + 1}`,
				url: originalMatch?.url,
				snippet: result.document?.text?.substring(0, 150) + '...',
			};
		})
		.filter((source) => source.snippet);

	const systemPrompt = `You are a helpful assistant that answers questions based on the provided context.

Original user request: "${request.originalQuery}"
Refined query: "${request.query}"

Context from documentation:
${retrievedContext}

Use the context above to answer the user's question. If the context doesn't contain enough information, say so clearly.`;

	// Store sources for access by the chat route
	currentSources = sources;

	return streamText({
		model: openai('gpt-4o'),
		system: systemPrompt,
		messages: request.messages,
		onFinish: async () => {
			console.log('Sources used:', JSON.stringify(sources, null, 2));
		},
	});
}

// Export function to get current sources
export function getRagSources() {
	return currentSources;
}
