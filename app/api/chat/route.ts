import { z } from 'zod';
import { agentTypeSchema, messageSchema } from '@/app/agents/types';
import { getAgent } from '@/app/agents/registry';

const chatSchema = z.object({
	messages: z.array(messageSchema),
	agent: agentTypeSchema,
	query: z.string(),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const parsed = chatSchema.parse(body);
		const { messages, agent, query } = parsed;

		// Get original user query (last message)
		const lastMessage = messages[messages.length - 1];
		const originalQuery = lastMessage?.content || query;

		// Get the agent executor from registry
		const agentExecutor = getAgent(agent);

		// Execute agent and get streamed response
		const result = await agentExecutor({
			type: agent,
			query,
			originalQuery,
			messages,
		});

		// TODO: OPTIONAL CHALLENGE (Module 11) - Add Source References
		// Currently, RAG responses don't show which documents were used.
		// Your task: Display source references below RAG responses.
		//
		// Steps:
		// 1. Modify the RAG agent (app/agents/rag.ts) to store sources
		//    - After querying Pinecone, store the matches in a module variable
		//    - Create a getRagSources() function to retrieve them
		//    - Include: title, url, score, snippet
		//
		// 2. In this route, check if agent === 'rag'
		//    - Create a transformed stream that appends sources after content
		//    - Use TextEncoder to encode the sources text
		//    - Format sources nicely with markdown
		//
		// 3. Update the UI (app/page.tsx) to parse and display sources
		//    - Extract sources from the stream
		//    - Show as clickable links below the response
		//    - Include relevance scores
		//
		// Hints:
		// - Use ReadableStream to transform result.textStream
		// - Append sources after all chunks are streamed
		// - Format: "\n\n---\n**Sources:**\n1. [Title](url) - snippet"

		return result.toTextStreamResponse();
	} catch (error) {
		console.error('Error in chat API:', error);
		return new Response('Internal server error', { status: 500 });
	}
}
