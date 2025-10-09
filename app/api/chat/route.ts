import { z } from 'zod';
import { agentTypeSchema, messageSchema } from '@/app/agents/types';
import { getAgent } from '@/app/agents/registry';
import { getRagSources } from '@/app/agents/rag';

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

		// If it's the RAG agent, append sources after streaming
		if (agent === 'rag') {
			const stream = result.textStream;
			const encoder = new TextEncoder();

			const transformedStream = new ReadableStream({
				async start(controller) {
					try {
						// Stream all the AI response chunks
						for await (const chunk of stream) {
							controller.enqueue(encoder.encode(chunk));
						}

						// Get sources and append them
						const sources = getRagSources();
						if (sources.length > 0) {
							const sourcesText = `\n\n---\n**Sources:**\n${sources
								.map(
									(source, i) =>
										`${i + 1}. ${source.title}${source.url ? ` - ${source.url}` : ''}\n   ${source.snippet}`
								)
								.join('\n\n')}`;
							controller.enqueue(encoder.encode(sourcesText));
						}

						controller.close();
					} catch (error) {
						controller.error(error);
					}
				},
			});

			return new Response(transformedStream, {
				headers: {
					'Content-Type': 'text/plain; charset=utf-8',
				},
			});
		}

		return result.toTextStreamResponse();
	} catch (error) {
		console.error('Error in chat API:', error);
		return new Response('Internal server error', { status: 500 });
	}
}
