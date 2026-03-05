import { NextRequest, NextResponse } from 'next/server';
import { runAgentGraph, streamAgentGraph } from '@/app/libs/langgraph';

/**
 * LANGGRAPH API ENDPOINT
 *
 * Exposes the LangGraph multi-agent system via REST API.
 *
 * POST /api/langgraph
 * Body: { query: string, stream?: boolean }
 *
 * Response:
 * - Standard: { selectedAgent, refinedQuery, response, context? }
 * - Streaming: Server-sent events with node updates
 */

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { query, stream = false } = body;

		if (!query || typeof query !== 'string') {
			return NextResponse.json(
				{ error: 'Query is required and must be a string' },
				{ status: 400 }
			);
		}

		// Streaming mode
		if (stream) {
			const encoder = new TextEncoder();
			const readable = new ReadableStream({
				async start(controller) {
					try {
						for await (const event of streamAgentGraph(query)) {
							const data = JSON.stringify(event);
							controller.enqueue(
								encoder.encode(`data: ${data}\n\n`)
							);
						}
						controller.enqueue(encoder.encode('data: [DONE]\n\n'));
						controller.close();
					} catch (error) {
						controller.error(error);
					}
				},
			});

			return new Response(readable, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive',
				},
			});
		}

		// Standard mode
		const result = await runAgentGraph(query);

		return NextResponse.json({
			success: true,
			...result,
		});
	} catch (error) {
		console.error('LangGraph API error:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to process query',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

/**
 * GET /api/langgraph
 *
 * Returns information about the LangGraph agent system.
 */
export async function GET() {
	return NextResponse.json({
		name: 'LangGraph Multi-Agent System',
		version: '1.0.0',
		description:
			'A multi-agent system built with LangGraph for intelligent query routing',
		endpoints: {
			POST: {
				description: 'Process a query through the agent system',
				body: {
					query: 'string (required) - The user query to process',
					stream:
						'boolean (optional) - Whether to stream the response',
				},
				response: {
					selectedAgent:
						'The agent that handled the query (linkedin, knowledgeBase, general)',
					refinedQuery: 'The refined/optimized query',
					response: 'The generated response',
					context:
						'Retrieved context (only for knowledgeBase queries)',
				},
			},
		},
		agents: {
			linkedin:
				'Specialized in LinkedIn content using a fine-tuned model',
			knowledgeBase:
				'RAG-based agent that searches the vector database for relevant content',
			general: 'General-purpose agent for other queries',
		},
	});
}
