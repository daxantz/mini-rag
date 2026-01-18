import fs from 'fs';
import path from 'path';
import { extractLinkedInPosts } from '../libs/chunking';

const DATA_DIR = path.join(process.cwd(), 'app/scripts/data');
const LINKEDIN_CSV = path.join(DATA_DIR, 'brian_posts.csv');

console.log('Reading CSV file...');
const csvContent = fs.readFileSync(LINKEDIN_CSV, 'utf-8');

console.log('Extracting posts...');
const allPosts = extractLinkedInPosts(csvContent);

console.log('Filtering posts (>= 100 chars)...');
const validPosts = allPosts.filter((post) => post.text.length >= 100);
const rejectedPosts = allPosts.filter((post) => post.text.length < 100);

console.log(`\n📊 Results:`);
console.log(`   Total posts extracted: ${allPosts.length}`);
console.log(`   Valid posts (>= 100 chars): ${validPosts.length}`);
console.log(`   Rejected posts (< 100 chars): ${rejectedPosts.length}`);

console.log(`\nFirst 3 valid posts:`);
validPosts.slice(0, 3).forEach((post, i) => {
	console.log(`\n--- Post ${i + 1} ---`);
	console.log(`Text length: ${post.text.length}`);
	console.log(`Text: ${post.text.substring(0, 100)}...`);
	console.log(`Date: ${post.date}`);
	console.log(`URL: ${post.url}`);
	console.log(`Likes: ${post.likes}`);
});
