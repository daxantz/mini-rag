/**
 * SELECTOR AGENT TESTS
 *
 * These tests verify that queries are routed to the correct agent.
 * Since LLMs are non-deterministic, we test routing decisions and
 * response structure, not exact text output.
 *
 * These tests call the API route handler directly - no server needed!
 */

import { POST } from '@/app/api/select-agent/route';
import { NextRequest } from 'next/server';
import { ragAgent } from '../rag';
import { openai } from '@ai-sdk/openai';

describe('Selector Agent Routing', () => {
	// Increase timeout for LLM API calls
	jest.setTimeout(15000);

	// Helper to create a mock NextRequest
	const createRequest = (query: string): NextRequest => {
		return {
			json: async () => ({
				messages: [{ role: 'user', content: query }],
			}),
		} as NextRequest;
	};

	// Helper to call the selector and get response
	const selectAgent = async (query: string) => {
		const request = createRequest(query);
		const response = await POST(request);
		return response.json();
	};

	describe('LinkedIn Agent Routing', () => {
		it('should route LinkedIn post creation to linkedin agent', async () => {
			const result = await selectAgent(
				'Make this post more cringy and engaging: "I love React hooks and use them all the time"',
			);

			expect(result.agent).toBe('linkedin');
			expect(result.query).toBeTruthy();
			expect(result.confidence).toBeGreaterThan(0.5);
		});
	});

	describe('Irrelevant requests routing', () => {
		it('should route irrelevant requests to NO agent', async () => {
			const result = await selectAgent('What is the capital of France?');
			expect(result.agent).toBe(null);
		});
	});
});
