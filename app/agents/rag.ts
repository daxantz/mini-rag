import { AgentRequest, AgentResponse } from './types';
import { openaiClient } from '@/app/libs/openai/openai';
import { openai } from '@ai-sdk/openai';
import { stepCountIs, streamText, tool } from 'ai';
import { qdrantClient } from '../libs/qdrant';
import { cohereClient } from '../libs/cohere';
import { z } from 'zod';

export async function ragAgent(request: AgentRequest): Promise<AgentResponse> {
	const { query } = request;

	// we want to generate a linkedin post based on a user query
	return streamText({
		model: openai('gpt-5'),
		toolChoice: 'auto',
		stopWhen: stepCountIs(15),
		tools: {
			generate_linkedin_post: tool({
				name: 'generate_linkedin_post',
				description: 'Generate a LinkedIn post based on a user query',
				inputSchema: z.object({
					query: z
						.string()
						.describe(
							'the user query to generate a LinkedIn post for',
						),
				}),
				execute: async ({ query }) => {
					console.log('query', query);
					const embedding = await openaiClient.embeddings.create({
						model: 'text-embedding-3-small',
						dimensions: 512,
						input: query,
					});

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
