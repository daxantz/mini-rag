import { NextRequest, NextResponse } from 'next/server';
import { openaiClient } from '@/app/libs/openai/openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { agentTypeSchema, messageSchema } from '@/app/agents/types';
import { agentConfigs } from '@/app/agents/config';

const selectAgentSchema = z.object({
	messages: z.array(messageSchema).min(1),
});

const agentSelectionSchema = z.object({
	agent: agentTypeSchema,
	query: z.string(),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = selectAgentSchema.parse(body);
		const { messages } = parsed;

		// Take last 5 messages for context
		const recentMessages = messages.slice(-5);

		// Build agent descriptions from config
		const agentDescriptions = Object.entries(agentConfigs)
			.map(([key, config]) => `- "${key}": ${config.description}`)
			.join('\n');

		// TODO: Step 1 - Call OpenAI with structured output
		const parseResponse = await openaiClient.responses.parse({
			model: 'gpt-4o-mini',
			temperature: 0.1,
			input: [
				{
					role: 'system',
					content: `You are a helpful assistant that selects the appropriate agent based on the user's query.
					The agents are: ${agentDescriptions}
					`,
				},
				...recentMessages,
			],
			text: {
				format: zodTextFormat(agentSelectionSchema, 'agentSelection'),
			},
		});

		const { agent, query } = parseResponse.output_parsed ?? {};

		// TODO: Step 2 - Extract the parsed output

		// TODO: Step 3 - Return the result
		return NextResponse.json({
			agent,
			query,
			originalQuery: messages[messages.length - 1].content,
			messages: recentMessages,
		});
		/**
		 * type: AgentType;
		 * query: string; // Refined/summarized query from selector
		 * originalQuery: string; // Original user message
		 * messages: Message[]; // Conversation history
		 */

		throw new Error('Selector not implemented yet!');
	} catch (error) {
		console.error('Error selecting agent:', error);
		return NextResponse.json(
			{ error: 'Failed to select agent' },
			{ status: 500 }
		);
	}
}
