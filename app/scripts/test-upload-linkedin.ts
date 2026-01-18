import fs from 'fs';
import path from 'path';
import { extractLinkedInPosts } from '../libs/chunking';

const DATA_DIR = path.join(process.cwd(), 'app/scripts/data');
const LINKEDIN_CSV = path.join(DATA_DIR, 'brian_posts.csv');

async function main() {
	console.log('🚀 Testing LinkedIn posts extraction...\n');

	// Read and parse CSV
	const csvContent = fs.readFileSync(LINKEDIN_CSV, 'utf-8');
	const allPosts = extractLinkedInPosts(csvContent);

	console.log(`Found ${allPosts.length} LinkedIn posts`);

	// Filter posts >= 100 characters
	const validPosts = allPosts.filter((post) => post.text.length >= 100);
	const rejectedCount = allPosts.length - validPosts.length;

	console.log(`Valid posts (>= 100 chars): ${validPosts.length}`);
	console.log(`Rejected posts (< 100 chars): ${rejectedCount}`);

	console.log(`\nFirst 3 valid posts:`);
	validPosts.slice(0, 3).forEach((post, i) => {
		console.log(`\n--- Post ${i + 1} ---`);
		console.log(`Text length: ${post.text.length}`);
		console.log(`Text preview: ${post.text.substring(0, 100)}...`);
		console.log(`Date: ${post.date}`);
		console.log(`URL: ${post.url}`);
		console.log(`Likes: ${post.likes}`);
	});

	console.log(`\n📊 Summary:`);
	console.log(`   Total posts: ${allPosts.length}`);
	console.log(`   Valid posts: ${validPosts.length}`);
	console.log(`   Rejected: ${rejectedCount}`);
}

main();
