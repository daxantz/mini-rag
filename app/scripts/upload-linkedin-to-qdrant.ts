/**
 * LinkedIn Posts to Qdrant Upload Script
 *
 * This script uploads LinkedIn posts to Qdrant vector database without chunking.
 *
 * WORKFLOW:
 * 1. Reads CSV file from app/scripts/data/brian_posts.csv
 * 2. Extracts posts using extractLinkedInPosts
 * 3. Filters posts with >= 100 characters
 * 4. Generates embeddings for each post using OpenAI
 * 5. Uploads posts with metadata to Qdrant collection
 *
 * METADATA STRUCTURE:
 * Each post includes:
 * - id: Unique identifier (based on URL)
 * - content: The full text of the post
 * - metadata: {
 *     date: Publication date
 *     url: Post URL
 *     likes: Number of reactions
 *     type: 'linkedin_post'
 *   }
 *
 * REQUIREMENTS:
 * - QDRANT_URL environment variable
 * - QDRANT_API_KEY environment variable
 * - OPENAI_API_KEY environment variable
 *
 * USAGE:
 * yarn upload-linkedin
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { qdrantClient } from '../libs/pinecone';
import { openaiClient } from '../libs/openai/openai';
import { extractLinkedInPosts, type LinkedInPost } from '../libs/chunking';

dotenv.config();

const COLLECTION_NAME = 'linkedin_posts';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const MIN_POST_LENGTH = 100;

/**
 * Generates embedding for a text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const response = await openaiClient.embeddings.create({
			model: EMBEDDING_MODEL,
			input: text,
			dimensions: 512,
		});
		return response.data[0].embedding;
	} catch (error) {
		console.error('Error generating embedding:', error);
		throw error;
	}
}

/**
 * Processes and uploads LinkedIn posts in batches
 */
async function uploadPosts(posts: LinkedInPost[]): Promise<number> {
	console.log(`\nUploading ${posts.length} posts...`);

	const batchSize = 10;
	let uploadedCount = 0;

	for (let i = 0; i < posts.length; i += batchSize) {
		const batch = posts.slice(i, i + batchSize);

		// Generate embeddings for batch
		const points = await Promise.all(
			batch.map(async (post, idx) => {
				const embedding = await generateEmbedding(post.text);
				// Create a unique ID from the URL or use index
				const id = post.url || `linkedin-post-${i + idx}`;
				return {
					id: id.replace(/[^a-zA-Z0-9-_]/g, '-'), // Sanitize ID
					vector: embedding,
					payload: {
						content: post.text,
						date: post.date,
						url: post.url,
						likes: post.likes,
						type: 'linkedin_post',
					},
				};
			})
		);

		// Upload batch to Qdrant
		await qdrantClient.upsert(COLLECTION_NAME, {
			wait: true,
			points,
		});

		uploadedCount += points.length;
		console.log(
			`  Uploaded posts ${i + 1}-${Math.min(i + batch.length, posts.length)}`
		);
	}

	return uploadedCount;
}

/**
 * Main function: reads LinkedIn posts and uploads them to Qdrant
 */
async function main() {
	// Validate environment variables
	if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
		console.error(
			'Please set QDRANT_URL and QDRANT_API_KEY environment variables'
		);
		process.exit(1);
	}

	if (!process.env.OPENAI_API_KEY) {
		console.error('Please set OPENAI_API_KEY environment variable');
		process.exit(1);
	}

	const csvPath = path.join(
		process.cwd(),
		'app/scripts/data/brian_posts.csv'
	);

	// Check if file exists
	if (!fs.existsSync(csvPath)) {
		console.error(`CSV file not found: ${csvPath}`);
		process.exit(1);
	}

	console.log('Reading LinkedIn posts from CSV...');
	const csvContent = fs.readFileSync(csvPath, 'utf-8');
	const allPosts = extractLinkedInPosts(csvContent);

	console.log(`Found ${allPosts.length} total posts`);

	// Filter posts with at least 100 characters
	const validPosts = allPosts.filter((p) => p.text.length >= MIN_POST_LENGTH);

	console.log(
		`Filtered to ${validPosts.length} posts with >= ${MIN_POST_LENGTH} characters`
	);

	if (validPosts.length === 0) {
		console.error('No valid posts found to upload');
		process.exit(1);
	}

	try {
		// Upload posts
		const uploadedCount = await uploadPosts(validPosts);

		console.log('\n✅ Upload complete!');
		console.log(`   Uploaded: ${uploadedCount} posts`);
		console.log(`   Collection: ${COLLECTION_NAME}`);
	} catch (error) {
		console.error('\n❌ Upload failed:', error);
		process.exit(1);
	}
}

main();
