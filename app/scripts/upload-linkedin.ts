/**
 * LinkedIn Posts Upload Script
 *
 * This script processes LinkedIn posts from the CSV file and uploads them to Qdrant
 * WITHOUT chunking (unlike Medium articles which are chunked).
 *
 * WORKFLOW:
 * 1. Read LinkedIn posts from data/brian_posts.csv
 * 2. Parse them using extractLinkedInPosts
 * 3. Generate embeddings for each post
 * 4. Upload to Qdrant (full posts, no chunking)
 *
 * USAGE:
 * Run: npx tsx app/scripts/upload-linkedin.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { extractLinkedInPosts } from '../libs/chunking';

// Load environment variables BEFORE importing clients
dotenv.config();

import { qdrantClient } from '../libs/qdrant';
import { openaiClient } from '../libs/openai/openai';

const DATA_DIR = path.join(process.cwd(), 'app/scripts/data');
const LINKEDIN_CSV = path.join(DATA_DIR, 'brian_posts.csv');
const COLLECTION_NAME = 'linkedin';

/**
 * Processes LinkedIn posts from CSV file and uploads to Qdrant
 */
async function processLinkedInPosts(): Promise<void> {
	console.log('💼 Processing LinkedIn posts...');

	// Read and parse CSV
	const csvContent = fs.readFileSync(LINKEDIN_CSV, 'utf-8');
	const allPosts = extractLinkedInPosts(csvContent);

	console.log(`Found ${allPosts.length} LinkedIn posts`);

	// Filter posts >= 100 characters
	const validPosts = allPosts.filter((post) => post.text.length >= 100);
	const rejectedCount = allPosts.length - validPosts.length;

	console.log(`Valid posts (>= 100 chars): ${validPosts.length}`);
	console.log(`Rejected posts (< 100 chars): ${rejectedCount}`);

	let successCount = 0;
	let failCount = 0;

	for (const post of validPosts) {
		try {
			// Generate embedding for the full post text (no chunking)
			const embeddings = await openaiClient.embeddings.create({
				model: 'text-embedding-3-small',
				dimensions: 512,
				input: post.text,
			});

			// Upload to Qdrant
			await qdrantClient.upsert(COLLECTION_NAME, {
				wait: true,
				points: [
					{
						id: crypto.randomUUID(),
						vector: embeddings.data[0].embedding,
						payload: {
							content: post.text,
							url: post.url,
							date: post.date,
							likes: post.likes,
							contentType: 'linkedin',
						},
					},
				],
			});

			successCount++;
			console.log(`✅ Uploaded post ${successCount}/${validPosts.length}`);
		} catch (error) {
			console.error(`❌ Failed to upload post: ${post.url}`, error);
			failCount++;
		}
	}

	console.log(`\n📊 Summary:`);
	console.log(`   Successfully uploaded: ${successCount}`);
	console.log(`   Failed: ${failCount}`);
	console.log(`   Total valid posts: ${validPosts.length}`);
}

/**
 * Main function
 */
async function main() {
	console.log('🚀 Starting LinkedIn posts upload...\n');

	try {
		await processLinkedInPosts();
		console.log('\n✅ Upload complete!');
	} catch (error) {
		console.error('❌ Error processing LinkedIn posts:', error);
		process.exit(1);
	}
}

main();
