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
	agent: agentTypeSchema.nullable(),
	clarification: z
		.string()
		.nullable()
		.describe(
			'clarification for the user query if the user query is not clear or not related to writing a LinkedIn post or generating a linkedin post',
		),
	query: z
		.string()
		.describe(
			'refine query for agent and remove any unnecessary words and correct spelling',
		),
	confidence: z
		.number()
		.min(1)
		.max(10)
		.describe(
			'confidence score between 1 and 10 that the agent is the best fit for the user query',
		),
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
		const response = await openaiClient.responses.parse({
			model: 'gpt-4o',
			input: [
				{
					role: 'system',
					content: `
					Pick the best agent based on the user query
					The agents are: ${JSON.stringify(agentDescriptions)}

					RAG Agent: For generating a cringy linkedin post based on a user query with a bunch of emojis and hashtags.
					LinkedIn Agent: For polishing a written post in a certain voice and tone for LinkedIn. The user will provide a topic and you will write a post about it.

					If the user query is not clear then ask for clarification and do NOT pick an agent
					Instead clarify their request AND suggest the types of requests that are possible (e.g. "I can help you with writing a LinkedIn post or generating a linkedin post")
					`,
				},
				...recentMessages,
			],
			temperature: 0.1, // 1 for high creativity, 0 for low creativity
			text: {
				format: zodTextFormat(agentSelectionSchema, 'agentSelection'),
			},
		});

		// TODO: Step 2 - Extract the parsed output
		const { agent, query, confidence, clarification } =
			response.output_parsed ?? {};

		return NextResponse.json({
			agent,
			query,
			clarification,
			confidence,
		});
	} catch (error) {
		console.error('Error selecting agent:', error);
		return NextResponse.json(
			{ error: 'Failed to select agent' },
			{ status: 500 },
		);
	}
}
