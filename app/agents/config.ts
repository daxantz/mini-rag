import { AgentType, AgentConfig } from './types';

export const agentConfigs: Record<AgentType, AgentConfig> = {
	linkedin: {
		name: 'LinkedIn Agent',
		description:
			'For polishing a written post in a certain voice and tone for LinkedIn. The user will provide a post and you will polish it.',
	},
	rag: {
		name: 'RAG Agent',
		description: 'For generating a new text piece based on a user query.',
	},
};
