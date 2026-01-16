/**
 * Test Medium Articles Upload (No Qdrant Upload)
 *
 * This tests the Medium upload logic without actually uploading to Qdrant.
 * Verifies that articles shorter than 100 characters are rejected.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { chunkText, extractMediumArticle } from '../libs/chunking';

dotenv.config();

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const MIN_ARTICLE_LENGTH = 100;

async function main() {
	const articlesDir = path.join(process.cwd(), 'app/scripts/data/articles');

	if (!fs.existsSync(articlesDir)) {
		console.error(`Articles directory not found: ${articlesDir}`);
		process.exit(1);
	}

	const files = fs.readdirSync(articlesDir);
	const htmlFiles = files.filter((f) => f.endsWith('.html'));

	console.log(`📄 Found ${htmlFiles.length} HTML files to process\n`);

	let totalArticles = 0;
	let rejectedArticles = 0;
	let validArticles = 0;
	let totalChunks = 0;

	const rejectedSamples: any[] = [];
	const validSamples: any[] = [];

	for (let i = 0; i < htmlFiles.length; i++) {
		const file = htmlFiles[i];
		const filePath = path.join(articlesDir, file);
		const htmlContent = fs.readFileSync(filePath, 'utf-8');

		const article = extractMediumArticle(htmlContent);

		if (!article) {
			console.log(`⚠️  Skipping ${file} - extraction failed`);
			continue;
		}

		totalArticles++;

		if (article.text.length < MIN_ARTICLE_LENGTH) {
			rejectedArticles++;
			if (rejectedSamples.length < 3) {
				rejectedSamples.push({
					file,
					title: article.title,
					length: article.text.length,
					text: article.text,
				});
			}
			console.log(`❌ Rejected: ${file} (${article.text.length} chars) - "${article.title}"`);
		} else {
			validArticles++;
			const chunks = chunkText(article.text, CHUNK_SIZE, CHUNK_OVERLAP, article.url);
			totalChunks += chunks.length;

			if (validSamples.length < 3) {
				validSamples.push({
					file,
					title: article.title,
					length: article.text.length,
					chunks: chunks.length,
					url: article.url,
					date: article.date,
				});
			}
			console.log(`✅ Valid: ${file} (${article.text.length} chars, ${chunks.length} chunks) - "${article.title}"`);
		}
	}

	// Summary
	console.log(`\n${'='.repeat(60)}`);
	console.log(`📊 SUMMARY`);
	console.log(`${'='.repeat(60)}`);
	console.log(`Total articles processed: ${totalArticles}`);
	console.log(`❌ Rejected (< ${MIN_ARTICLE_LENGTH} chars): ${rejectedArticles}`);
	console.log(`✅ Valid (>= ${MIN_ARTICLE_LENGTH} chars): ${validArticles}`);
	console.log(`📦 Total chunks would be created: ${totalChunks}`);

	// Show rejected samples
	if (rejectedSamples.length > 0) {
		console.log(`\n🔍 Sample of rejected articles:`);
		rejectedSamples.forEach((sample, idx) => {
			console.log(`\n  ${idx + 1}. ${sample.title}`);
			console.log(`     File: ${sample.file}`);
			console.log(`     Length: ${sample.length} chars`);
			console.log(`     Text: "${sample.text.substring(0, 80)}${sample.text.length > 80 ? '...' : ''}"`);
		});
	}

	// Show valid samples
	if (validSamples.length > 0) {
		console.log(`\n✨ Sample of valid articles:`);
		validSamples.forEach((sample, idx) => {
			console.log(`\n  ${idx + 1}. ${sample.title}`);
			console.log(`     File: ${sample.file}`);
			console.log(`     Length: ${sample.length} chars`);
			console.log(`     Chunks: ${sample.chunks}`);
			console.log(`     Date: ${sample.date}`);
			console.log(`     URL: ${sample.url}`);
		});
	}

	console.log(`\n📤 Would upload ${totalChunks} chunks from ${validArticles} articles to Qdrant collection: medium_articles`);
	console.log(`   Each chunk would include metadata: title, date, url, type='medium_article', chunkIndex, totalChunks`);

	console.log(`\n✅ Test complete - no data uploaded to Qdrant`);
}

main();
