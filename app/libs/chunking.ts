export type Chunk = {
	id: string;
	content: string;
	metadata: {
		source: string;
		chunkIndex: number;
		totalChunks: number;
		startChar: number;
		endChar: number;
		[key: string]: string | number | boolean | string[];
	};
};

export type LinkedInPost = {
	text: string;
	date: string;
	url: string;
	likes: number;
};

export type MediumArticle = {
	title: string;
	text: string;
	date: string;
	url: string;
};

/**
 * Splits text into smaller chunks for processing
 * @param text The text to chunk
 * @param chunkSize Maximum size of each chunk
 * @param overlap Number of characters to overlap between chunks
 * @param source Source identifier (typically URL)
 * @returns Array of text chunks
 */
export function chunkText(
	text: string,
	chunkSize: number = 500,
	overlap: number = 50,
	source: string = 'unknown'
): Chunk[] {
	const chunks: Chunk[] = [];
	const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

	let currentChunk = '';
	let chunkStart = 0;
	let chunkIndex = 0;

	for (let i = 0; i < sentences.length; i++) {
		const sentence = sentences[i].trim() + '.';

		// If adding this sentence would exceed chunk size, create a chunk
		if (
			currentChunk.length + sentence.length > chunkSize &&
			currentChunk.length > 0
		) {
			const chunk: Chunk = {
				id: `${source}-chunk-${chunkIndex}`,
				content: currentChunk.trim(),
				metadata: {
					source,
					chunkIndex,
					totalChunks: 0, // Will be updated later
					startChar: chunkStart,
					endChar: chunkStart + currentChunk.length,
				},
			};

			chunks.push(chunk);

			// Start new chunk with overlap
			const overlapText = getLastWords(currentChunk, overlap);
			currentChunk = overlapText + ' ' + sentence;
			chunkStart = chunk.metadata.endChar - overlapText.length;
			chunkIndex++;
		} else {
			currentChunk += (currentChunk ? ' ' : '') + sentence;
		}
	}

	// Add final chunk if it has content
	if (currentChunk.trim()) {
		chunks.push({
			id: `${source}-chunk-${chunkIndex}`,
			content: currentChunk.trim(),
			metadata: {
				source,
				chunkIndex,
				totalChunks: 0,
				startChar: chunkStart,
				endChar: chunkStart + currentChunk.length,
			},
		});
	}

	// Update total chunks count
	chunks.forEach((chunk) => {
		chunk.metadata.totalChunks = chunks.length;
	});

	return chunks;
}

/**
 * Gets the last N characters worth of words from a text
 *
 * This is used to create overlap between chunks. We want complete words,
 * not cut-off characters, so we work backwards from the end.
 *
 * @param text The source text
 * @param maxLength Maximum length to return
 * @returns The last words up to maxLength
 *
 * @example
 * getLastWords("React Hooks are awesome", 10)
 * // Returns: "are awesome" (10 chars)
 * // NOT: "re awesome" (cut off "are")
 *

 *
 * Requirements:
 * 1. If text is shorter than maxLength, return the whole text
 * 2. Otherwise, return the last maxLength characters worth of COMPLETE words
 * 3. Build the result backwards to ensure you get the last words
 *
 * Steps:
 * 1. Check if text.length <= maxLength, if so return text
 * 2. Split text into words using .split(' ')
 * 3. Start with empty result string
 * 4. Loop through words BACKWARDS (from end to start)
 * 5. For each word, check if adding it would exceed maxLength
 * 6. If it would exceed, break the loop
 * 7. Otherwise, prepend the word to result (word + ' ' + result)
 * 8. Return the result
 */
function getLastWords(text: string, maxLength: number): string {
	// If text is shorter than maxLength, return the whole text
	if (text.length <= maxLength) {
		return text;
	}

	// Split text into words
	const words = text.split(' ');

	// Start with empty result string
	let result = '';

	// Loop through words backwards (from end to start)
	for (let i = words.length - 1; i >= 0; i--) {
		const word = words[i];

		// Check if adding this word would exceed maxLength
		// Need to account for the space between words
		const testResult = word + (result ? ' ' + result : '');

		if (testResult.length > maxLength) {
			// If it would exceed, break the loop
			break;
		}

		// Otherwise, prepend the word to result
		result = testResult;
	}

	return result;
}

/**
 * Extracts LinkedIn posts from CSV data
 * @param csvContent The CSV file content as a string
 * @returns Array of LinkedInPost objects with text, date, url, and likes
 */
export function extractLinkedInPosts(csvContent: string): LinkedInPost[] {
	// Parse CSV properly handling multiline quoted fields
	const records: string[][] = [];
	let currentRecord: string[] = [];
	let currentValue = '';
	let insideQuotes = false;

	for (let i = 0; i < csvContent.length; i++) {
		const char = csvContent[i];
		const nextChar = csvContent[i + 1];

		if (char === '"' && nextChar === '"' && insideQuotes) {
			// Escaped quote (two quotes in a row inside a quoted field)
			currentValue += '"';
			i++; // Skip next quote
		} else if (char === '"') {
			// Toggle quote state
			insideQuotes = !insideQuotes;
		} else if (char === ',' && !insideQuotes) {
			// End of field
			currentRecord.push(currentValue);
			currentValue = '';
		} else if (char === '\n' && !insideQuotes) {
			// End of record
			currentRecord.push(currentValue);
			if (currentRecord.some((val) => val.trim().length > 0)) {
				records.push(currentRecord);
			}
			currentRecord = [];
			currentValue = '';
		} else {
			// Regular character
			currentValue += char;
		}
	}

	// Add last record if exists
	if (currentValue || currentRecord.length > 0) {
		currentRecord.push(currentValue);
		if (currentRecord.some((val) => val.trim().length > 0)) {
			records.push(currentRecord);
		}
	}

	if (records.length === 0) return [];

	// Parse headers
	const headers = records[0];
	const textIndex = headers.indexOf('text');
	const dateIndex = headers.indexOf('createdAt (TZ=America/Los_Angeles)');
	const urlIndex = headers.indexOf('link');
	const likesIndex = headers.indexOf('numReactions');

	const posts: LinkedInPost[] = [];

	// Process each record (skip header)
	for (let i = 1; i < records.length; i++) {
		const record = records[i];

		if (record.length > Math.max(textIndex, dateIndex, urlIndex, likesIndex)) {
			posts.push({
				text: record[textIndex]?.trim() || '',
				date: record[dateIndex]?.trim() || '',
				url: record[urlIndex]?.trim() || '',
				likes: parseInt(record[likesIndex]) || 0,
			});
		}
	}

	return posts;
}

/**
 * Extracts Medium articles from HTML files
 * @param htmlContent The HTML file content as a string
 * @returns MediumArticle object with title, text, date, and url
 */
export function extractMediumArticle(htmlContent: string): MediumArticle | null {
	try {
		// Extract title from <title> tag
		const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/);
		const title = titleMatch ? titleMatch[1] : 'Untitled';

		// Extract date from <time datetime="...">
		const dateMatch = htmlContent.match(/<time class="dt-published" datetime="(.*?)"/);
		const date = dateMatch ? dateMatch[1] : '';

		// Extract canonical URL
		const urlMatch = htmlContent.match(/<a href="(https:\/\/medium\.com\/@brianjenney\/[^"]+)" class="p-canonical">/);
		const url = urlMatch ? urlMatch[1] : '';

		// Extract text content from body section
		// Remove HTML tags but keep the text content
		const bodyMatch = htmlContent.match(/<section data-field="body" class="e-content">([\s\S]*?)<\/section>/);
		let text = '';

		if (bodyMatch) {
			const bodyContent = bodyMatch[1];
			// Remove all HTML tags but keep text
			text = bodyContent
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
				.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
				.replace(/<[^>]+>/g, ' ')
				.replace(/\s+/g, ' ')
				.trim();
		}

		return {
			title,
			text,
			date,
			url,
		};
	} catch (error) {
		console.error('Error extracting Medium article:', error);
		return null;
	}
}
