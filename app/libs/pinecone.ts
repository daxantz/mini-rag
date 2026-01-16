/**
 * QDRANT VECTOR DATABASE INTEGRATION
 *
 * This file handles interactions with Qdrant, an open-source vector database service.
 *
 * WHAT IS A VECTOR DATABASE?
 * Vector databases store high-dimensional numerical representations (embeddings) of data.
 * Unlike traditional databases that store exact text/numbers, vector DBs store "meanings"
 * as mathematical vectors. This enables semantic search - finding content by meaning
 * rather than exact keyword matches.
 *
 *
 * Learn more: https://qdrant.tech/documentation/
 *
 * EXPERIMENT: Try changing the embedding model or topK values below!
 */

import { QdrantClient } from '@qdrant/qdrant-js';
import { openaiClient } from '../libs/openai/openai';

// Initialize Qdrant client with your URL and API key
// Get started at: https://cloud.qdrant.io/
export const qdrantClient = new QdrantClient({
	url: process.env.QDRANT_URL as string,
	apiKey: process.env.QDRANT_API_KEY as string,
});

/**
 * Searches for semantically similar documents in the vector database
 *
 * @param query - The search query (will be converted to embeddings)
 * @param topK - Number of most similar results to return (try 3-10)
 * @param collectionName - Name of the Qdrant collection to search in
 * @returns Array of matching documents with similarity scores
 */
export const searchDocuments = async (
	query: string,
	topK: number = 3,
	collectionName: string = 'documents'
) => {
	// TODO: Step 1 - Generate query embedding using OpenAI

	// TODO: Step 2 - Extract the embedding array from the response

	// TODO: Step 3 - Query Qdrant for similar vectors

	// TODO: Step 4 - Return the matches

	throw new Error('searchDocuments not implemented yet!');
};
