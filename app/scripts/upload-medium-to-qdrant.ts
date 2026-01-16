/**
 * Medium Articles to Qdrant Upload Script
 *
 * This script uploads Medium articles to Qdrant vector database with chunking.
 *
 * WORKFLOW:
 * 1. Reads HTML files from app/scripts/data/articles/
 * 2. Extracts article content (title, text, date, url) using extractMediumArticle
 * 3. Chunks each article using chunkText with overlap
 * 4. Generates embeddings for each chunk using OpenAI
 * 5. Uploads chunks with metadata to Qdrant collection
 *
 * METADATA STRUCTURE:
 * Each chunk includes:
 * - id: Unique identifier (based on URL + chunk index)
 * - content: The text content of the chunk
 * - metadata: {
 *     title: Article title
 *     date: Publication date
 *     url: Canonical URL
 *     type: 'medium_article'
 *     source: URL (for identification)
 *     chunkIndex: Position in article
 *     totalChunks: Total chunks for this article
 *     startChar: Start position in original text
 *     endChar: End position in original text
 *   }
 *
 * REQUIREMENTS:
 * - QDRANT_URL environment variable
 * - QDRANT_API_KEY environment variable
 * - OPENAI_API_KEY environment variable
 *
 * USAGE:
 * yarn upload-medium
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { qdrantClient } from '../libs/pinecone';
import { openaiClient } from '../libs/openai/openai';
import {
	chunkText,
	extractMediumArticle,
	type MediumArticle,
} from '../libs/chunking';

dotenv.config();

const COLLECTION_NAME = 'medium_articles';
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Generates embedding for a text chunk using OpenAI
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
 * Processes a single Medium article: chunks it and uploads to Qdrant
 */
async function processArticle(
	article: MediumArticle,
	articleIndex: number
): Promise<number> {
	console.log(`\nProcessing article ${articleIndex + 1}: ${article.title}`);

	// Create chunks
	const chunks = chunkText(
		article.text,
		CHUNK_SIZE,
		CHUNK_OVERLAP,
		article.url
	);

	if (chunks.length === 0) {
		console.log('  No chunks generated (article too short), skipping...');
		return 0;
	}

	console.log(`  Generated ${chunks.length} chunks`);

	// Add Medium-specific metadata to each chunk
	const enrichedChunks = chunks.map((chunk) => ({
		...chunk,
		metadata: {
			...chunk.metadata,
			title: article.title,
			date: article.date,
			url: article.url,
			type: 'medium_article',
		},
	}));

	// Generate embeddings and upload in batches
	const batchSize = 10;
	let uploadedCount = 0;

	for (let i = 0; i < enrichedChunks.length; i += batchSize) {
		const batch = enrichedChunks.slice(i, i + batchSize);

		// Generate embeddings for batch
		const points = await Promise.all(
			batch.map(async (chunk) => {
				const embedding = await generateEmbedding(chunk.content);
				return {
					id: `${articleIndex}-${chunk.metadata.chunkIndex}`,
					vector: embedding,
					payload: {
						content: chunk.content,
						...chunk.metadata,
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
		console.log(`  Uploaded chunks ${i + 1}-${i + batch.length}`);
	}

	return uploadedCount;
}

/**
 * Main function: reads all Medium articles and uploads them to Qdrant
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

	const articlesDir = path.join(process.cwd(), 'app/scripts/data/articles');

	// Check if directory exists
	if (!fs.existsSync(articlesDir)) {
		console.error(`Articles directory not found: ${articlesDir}`);
		process.exit(1);
	}

	// Read all HTML files
	const files = fs.readdirSync(articlesDir);
	const htmlFiles = files.filter((f) => f.endsWith('.html'));

	if (htmlFiles.length === 0) {
		console.error('No HTML files found in articles directory');
		process.exit(1);
	}

	console.log(`Found ${htmlFiles.length} HTML files to process`);

	try {
		// Process each article
		let totalChunks = 0;
		let processedArticles = 0;

		for (let i = 0; i < htmlFiles.length; i++) {
			const file = htmlFiles[i];
			const filePath = path.join(articlesDir, file);
			const htmlContent = fs.readFileSync(filePath, 'utf-8');

			// Extract article
			const article = extractMediumArticle(htmlContent);

			if (!article) {
				console.log(`\nSkipping ${file} - extraction failed`);
				continue;
			}

			if (article.text.length < 100) {
				console.log(
					`\nSkipping ${file} - article too short (${article.text.length} chars)`
				);
				continue;
			}

			// Process and upload article
			const chunksUploaded = await processArticle(article, i);
			totalChunks += chunksUploaded;
			processedArticles++;
		}

		console.log('\n✅ Upload complete!');
		console.log(`   Processed: ${processedArticles} articles`);
		console.log(`   Uploaded: ${totalChunks} chunks`);
		console.log(`   Collection: ${COLLECTION_NAME}`);
	} catch (error) {
		console.error('\n❌ Upload failed:', error);
		process.exit(1);
	}
}

main();
