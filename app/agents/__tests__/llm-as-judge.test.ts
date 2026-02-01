/**
 * LLM AS JUDGE TESTS
 *
 * These tests use an LLM to evaluate the quality of agent outputs.
 * They compare generated content against reference examples and score
 * them on engagement, writing quality, formatting, and relevance.
 */

import { ragAgent } from '../rag';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

describe('LLM as Judge - Agent Quality Evaluation', () => {
	// Increase timeout significantly for LLM API calls and streaming
	jest.setTimeout(60000);

	describe('RAG Agent Quality', () => {
		it('should generate high-quality LinkedIn posts', async () => {
			const GOOD_EXAMPLE = `
				5 Biggest mistakes of my coding career?

				1. Not learning the fundamentals before diving into frameworks
				2. Being afraid to admit when I didn't know something
				3. Only taking on tasks I knew I could finish
				4. Not understanding how engineering fits into the company eco-system and business goals
				5. Not speaking up

				That last one hurt me the most.

				I thought I was playing it safe by taking on easy tickets.

				I nodded my head during estimation sessions and gave bland status updates.

				I never shared my ideas during meetings.

				I wanted to blend in.

				It was the most dangerous thing I could've done.

				They say the tallest blade of grass is the first to get cut.

				Yeah, I guess. It's also the one growing the fastest.

				Companies need average developers more than they'd like to admit. But, if career trajectory and increased hire-ability is your goal, then playing it safe is your greatest threat.
			`.trim();

			const MINIMUM_SCORE = 7;

			// 1. Call the RAG agent
			const result = await ragAgent({
				type: 'rag',
				query: 'I love React hooks and use them all the time',
				originalQuery: 'I love React hooks and use them all the time',
				messages: [],
			});

			// 2. Get the full text response from the stream
			const fullText = await result.text;

			// 3. Define evaluation schema
			const evaluationSchema = z.object({
				score: z
					.number()
					.min(1)
					.max(10)
					.describe('Quality score from 1-10'),
				reasoning: z
					.string()
					.describe('Explanation for the score'),
			});

			// 4. Use LLM as judge to evaluate the response
			const evaluation = await generateObject({
				model: openai('gpt-4o-mini'),
				schema: evaluationSchema,
				prompt: `You are an expert evaluator of LinkedIn posts.

Compare the generated post below with the reference example and score it from 1-10 based on:
- Engagement and authenticity
- Writing quality and structure
- Appropriate use of formatting
- Relevance to the topic

Reference example (high quality):
${GOOD_EXAMPLE}

Generated post to evaluate:
${fullText}

Provide a score and detailed reasoning.`,
			});

			// 5. Log results for debugging
			console.log(
				`\nLLM Judge Score: ${evaluation.object.score}/10`,
			);
			console.log(`Reasoning: ${evaluation.object.reasoning}`);
			console.log(`\nGenerated Post:\n${fullText}\n`);

			// 6. Assert quality threshold
			expect(evaluation.object.score).toBeGreaterThanOrEqual(
				MINIMUM_SCORE,
			);
		});
	});
});
