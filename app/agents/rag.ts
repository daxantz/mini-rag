import { AgentRequest, AgentResponse } from './types';
import { pineconeClient } from '@/app/libs/pinecone';
import { openaiClient } from '@/app/libs/openai/openai';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { qdrantClient } from '../libs/qdrant';
import { cohereClient } from '../libs/cohere';

export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
	// TODO: Step 1 - Generate embedding for the refined query
	// Use openaiClient.embeddings.create()
	// Model: 'text-embedding-3-small'
	// Dimensions: 512
	// Input: request.query
	// Extract the embedding from response.data[0].embedding
	const embeddingResponse = await openaiClient.embeddings.create({
		model: 'text-embedding-3-small',
		dimensions: 512,
		input: request.query,
	});
	const embedding = embeddingResponse.data[0].embedding;

	// TODO: Step 2 - Query Pinecone for similar documents
	// Get the index: pineconeClient.Index(process.env.PINECONE_INDEX!)
	const candidateResults = await qdrantClient.search('articles', {
		vector: embedding,
		limit: 20,
		with_payload: true,
	});

	console.log(candidateResults);
	// Query parameters:
	//   - vector: the embedding from step 1
	//   - topK: 10 (to over-fetch for reranking)
	//   - includeMetadata: true

	const rerankedResponse = await cohereClient.rerank({
		model: 'rerank-english-v3.0',
		query: request.query,
		documents: candidateResults.map((result) =>
			JSON.stringify({
				text: result.payload?.content,
				url: result.payload?.url,
				contentType: result.payload?.contentType,
			})
		),
		topN: 10,
		returnDocuments: true,
	});

	// TODO: Step 5 - Build context from reranked results
	// Map over reranked.data
	// Extract result.document?.text from each
	// Join with '\n\n' separator

	// TODO: Step 6 - Create system prompt
	// Include:
	//   - Instructions to answer based on context
	//   - Original query (request.originalQuery)
	//   - Refined query (request.query)
	//   - The retrieved context
	//   - Instruction to say if context is insufficient

	// TODO: Step 7 - Stream the response
	// Use streamText()
	// Model: openai('gpt-4o')
	// System: your system prompt
	// Messages: request.messages
	// Return the stream

	console.log(rerankedResponse.results);

	return streamText({
		model: openai('gpt-4o'),
		system: `Write an article based on the following context:		
		Original user query: ${request.originalQuery}
		Refined query: ${request.query}
		Writing samples: ${rerankedResponse.results
			.map((result) => result.document?.text)
			.join('\n\n')}

		Write the article using the tone and style of the writing samples.
		`,
		messages: [...request.messages],
		temperature: 0.7,
	});
}
