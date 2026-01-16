/**
 * Test LinkedIn Posts Upload (No Qdrant Upload)
 *
 * This tests the LinkedIn upload logic without actually uploading to Qdrant.
 * Verifies that posts shorter than 100 characters are rejected.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { extractLinkedInPosts } from '../libs/chunking';

dotenv.config();

const MIN_POST_LENGTH = 100;

async function main() {
	const csvPath = path.join(
		process.cwd(),
		'app/scripts/data/brian_posts.csv'
	);

	if (!fs.existsSync(csvPath)) {
		console.error(`CSV file not found: ${csvPath}`);
		process.exit(1);
	}

	console.log('📄 Reading LinkedIn posts from CSV...');
	const csvContent = fs.readFileSync(csvPath, 'utf-8');
	const allPosts = extractLinkedInPosts(csvContent);

	console.log(`\n📊 Total posts found: ${allPosts.length}`);

	// Separate short and valid posts
	const shortPosts = allPosts.filter((p) => p.text.length < MIN_POST_LENGTH);
	const validPosts = allPosts.filter((p) => p.text.length >= MIN_POST_LENGTH);

	console.log(`❌ Rejected (< ${MIN_POST_LENGTH} chars): ${shortPosts.length}`);
	console.log(`✅ Valid (>= ${MIN_POST_LENGTH} chars): ${validPosts.length}`);

	// Show sample of rejected posts
	if (shortPosts.length > 0) {
		console.log(`\n🔍 Sample of rejected posts (showing first 3):`);
		shortPosts.slice(0, 3).forEach((post, idx) => {
			console.log(`\n  ${idx + 1}. Length: ${post.text.length} chars`);
			console.log(`     Text: "${post.text.substring(0, 80)}${post.text.length > 80 ? '...' : ''}"`);
			console.log(`     Likes: ${post.likes}`);
		});
	}

	// Show sample of valid posts
	if (validPosts.length > 0) {
		console.log(`\n✨ Sample of valid posts (showing first 3):`);
		validPosts.slice(0, 3).forEach((post, idx) => {
			console.log(`\n  ${idx + 1}. Length: ${post.text.length} chars`);
			console.log(`     Text: "${post.text.substring(0, 100)}..."`);
			console.log(`     Date: ${post.date}`);
			console.log(`     Likes: ${post.likes}`);
			console.log(`     URL: ${post.url}`);
		});
	}

	// Show what would be uploaded
	console.log(`\n📤 Would upload ${validPosts.length} posts to Qdrant collection: linkedin_posts`);
	console.log(`   Each post would include metadata: date, url, likes, type='linkedin_post'`);

	console.log(`\n✅ Test complete - no data uploaded to Qdrant`);
}

main();
