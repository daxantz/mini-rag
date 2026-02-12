# Building the Document Upload Pipeline

Now that you have Pinecone configured, it's time to fill your vector database with actual content! This is where your RAG system gets its knowledge.

---

## Video Walkthrough

Watch the uploading documents process from the chat interface:

<iframe src="https://share.descript.com/embed/vXKQ7RBncMc" width="640" height="360" frameborder="0" allowfullscreen></iframe>

---

## What You'll Build

This is the **"write" side** of your RAG system - getting knowledge INTO the database.

By the end of this module, you'll have:

- An API route that accepts URLs (`/api/upload-document`)
- A pipeline that scrapes, chunks, and vectorizes content
- Documents uploaded to Pinecone and ready for retrieval

**The bigger picture:**

- **This module**: Upload documents (the "write" side)
- **Next module**: Query documents to answer questions (the "read" side)

That's when RAG truly comes alive - you'll be able to ask "Tell me about Anthropic" or "How do I use the Pinecone TypeScript client?" and get answers grounded in your knowledge base!

**Note**: The UI also supports a `/api/upload-text` route for uploading raw text (already implemented as a reference). This module focuses on the URL route, which is more complex because it requires web scraping.

---

## The Big Picture: The Upload Pipeline

Let's understand the complete flow for the **URL upload route**:

```
URLs from User
    ↓
1. Scrape web content (HTML → text)
    ↓
2. Chunk text into smaller pieces
    ↓
3. Generate embeddings (text → vectors)
    ↓
4. Upload to Pinecone
    ↓
Content Ready for RAG!
```

**For the text upload route** (already implemented at `/api/upload-text`):

```
Raw Text from User
    ↓
1. Chunk text into smaller pieces
    ↓
2. Generate embeddings (text → vectors)
    ↓
3. Upload to Pinecone
    ↓
Content Ready for RAG!
```

This is the "write" side of your RAG system. The "read" side (retrieval) comes later.

---

## Why This Pipeline Exists

**Why not just save the whole webpage?**

- Too much context for the LLM (token limits!)
- Harder to find relevant sections
- Less precise retrieval

**Why chunk the content?**

- Smaller chunks = more focused context
- Better retrieval (find exact relevant sections)
- Fits within LLM context windows

**Why batch upload?**

- API rate limits
- More efficient
- Better error handling

---

## Understanding the Pieces

### 1. The DataProcessor

Located at: `app/libs/dataProcessor.ts`

This class handles:

- **Scraping**: Fetching HTML and extracting clean text
- **Chunking**: Breaking text into ~500 character pieces with overlap

```typescript
// How it works (simplified)
const processor = new DataProcessor();
const chunks = await processor.processUrls(['https://example.com']);

// Returns array of chunks:
[
	{
		id: 'url-chunk-0',
		content: 'First 500 chars of text...',
		metadata: {
			url: 'https://example.com',
			title: 'Page Title',
			chunkIndex: 0,
			totalChunks: 5,
		},
	},
	// ... more chunks
];
```

**Key concept: Overlap**
Chunks overlap by ~50 characters to maintain context at boundaries. This ensures important information isn't split awkwardly.

### 2. OpenAI Embeddings

Embeddings convert text to vectors (arrays of numbers that capture meaning).

```typescript
// What happens under the hood
const response = await openaiClient.embeddings.create({
  model: 'text-embedding-3-small',
  input: ['Hello world', 'Machine learning basics']
});

// Returns:
[
  { embedding: [0.1, -0.3, 0.8, ...] }, // 1536 numbers for "Hello world"
  { embedding: [0.2, 0.1, -0.5, ...] }  // 1536 numbers for "Machine learning"
]
```

**Why 'text-embedding-3-small'?**

- Fast and efficient (512 dimensions instead of 1536)
- Good quality for most use cases
- Lower cost than larger models

### 3. Batching Strategy

Pinecone recommends uploading in batches of 100:

```typescript
// Why batch?
const allChunks = 500; // chunks to upload
const batchSize = 100;

// Without batching: 500 API calls
// With batching: 5 API calls (much faster!)

for (let i = 0; i < chunks.length; i += batchSize) {
	const batch = chunks.slice(i, i + batchSize);
	// Process batch...
}
```

---

## The API Route Structure

Your route lives at: `app/api/upload-document/route.ts`

**What it needs to do:**

1. Validate incoming URLs (Zod schema)
2. Scrape and chunk content
3. Generate embeddings for all chunks
4. Format vectors for Pinecone
5. Upload in batches
6. Return success/failure

**Why an API route?**

- Can be called from the frontend UI
- Can be triggered by scripts
- Keeps business logic separate from UI
- Easy to test independently

---

## Understanding Vector Metadata

When you upload to Pinecone, each vector includes metadata:

```typescript
{
  id: "unique-identifier",
  values: [0.1, -0.3, ...], // The embedding
  metadata: {
    text: "The actual chunk content",
    url: "https://source-url.com",
    title: "Document Title",
    chunkIndex: 0,
    totalChunks: 10
  }
}
```

**Why metadata matters:**

- `text`: What you show to the LLM as context
- `url`: For attribution/sourcing
- `title`: For display to users
- `chunkIndex`: To reconstruct full documents if needed

Pinecone indexes the vector but returns the metadata when querying!

---

## Your Challenge

Open `app/api/upload-document/route.ts` and you'll see 9 TODO steps.

### Implementation Steps

**Step 1: Validate the Request**

```typescript
// Parse the request body
const body = await req.json();

// Validate with Zod
const parsed = uploadDocumentSchema.parse(body);
const { urls } = parsed;
```

**Step 2: Scrape and Chunk**

```typescript
const processor = new DataProcessor();
const chunks = await processor.processUrls(urls);
```

**Step 3-5: Set Up for Upload**

- Check if chunks exist
- Get Pinecone index
- Set up batch processing

**Step 6-7: Generate Embeddings and Format**
For each batch:

- Generate embeddings for all chunk contents
- Map chunks + embeddings to Pinecone vector format

**Step 8-9: Upload and Respond**

- Upload each batch to Pinecone
- Track success count
- Return results

### Hints

**For generating embeddings:**

- Use openaiClient.embeddings.create with the model parameter
- Pass in an array of strings (map the batch to extract content)
- The response has a data array where each item has an embedding property
- Access with: response.data[index].embedding

**For uploading to Pinecone:**

- Call the upsert method on your index reference
- Pass in the formatted vectors array
- Pinecone handles the indexing automatically

**For creating unique IDs:**

- Combine the URL with the chunk index using template literals
- Format: URL-chunkIndex
- This ensures each chunk has a globally unique identifier

**Need more guidance?**
Check the inline TODO comments in the route file - they guide you through each step with specific method names and parameters.

---

## Testing Your Implementation

### Using the Frontend

The UI (at `http://localhost:3000` after running `yarn dev`) has two upload modes:

**URL Mode:**

1. Select "URLs" tab
2. Enter URLs (one per line)
3. Click "Upload"
4. Check the response for success message

**Text Mode:**

1. Select "Raw Text" tab
2. Paste any text content
3. Click "Upload"
4. Check the response for success message

### Using Postman or Thunder Client

You can test the API routes directly using Postman, Thunder Client (VS Code extension), or any HTTP client.

**Test URL upload:**

- Method: POST
- URL: `http://localhost:3000/api/upload-document`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
	"urls": ["https://react.dev/learn", "https://nextjs.org/docs"]
}
```

**Test text upload:**

- Method: POST
- URL: `http://localhost:3000/api/upload-text`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
	"text": "This is sample text about React hooks. useState and useEffect are commonly used hooks."
}
```

### Verifying in Pinecone Console

1. Go to your Pinecone index
2. Check "Vectors" tab - should see new entries
3. Try the "Query" feature - search for test content

---

## Troubleshooting Common Issues

### Issue: Dimension mismatch

**Symptom**: Vector dimension doesn't match index configuration

**Solution**: Ensure you're using `text-embedding-3-small` with `dimensions: 512`

### Issue: Rate limit exceeded

**Symptom**: OpenAI API rate limiting

**Solution**: Add delay between batches or reduce batch size

### Issue: No content scraped

**Symptom**: Empty chunks array after processing

**Solution**:

- Check URL is accessible
- Look at `dataProcessor.ts` - may need to adjust selectors
- Some sites block scraping

### Issue: Metadata too large

**Symptom**: Pinecone metadata size limit exceeded

**Solution**: Chunk text is too long. Reduce chunk size or trim metadata text field

---

## Understanding What You Built

Let's break down the flow:

**Request → Validation**

```typescript
uploadDocumentSchema.parse(body); // Zod validates structure
```

This ensures you only process valid URLs (proper format, array structure).

**Scraping → Chunking**

```typescript
processor.processUrls(urls); // Returns structured chunks
```

The processor fetches HTML, extracts text, and breaks it into manageable pieces with metadata.

**Text → Vectors**

```typescript
openaiClient.embeddings.create(); // Converts meaning to numbers
```

OpenAI's model captures semantic meaning in a 512-dimensional space.

**Vectors → Database**

index.upsert(vectors) // Stores in Pinecone

Your knowledge is now searchable by semantic similarity!

---

## What's Next?

You've built the upload pipeline - documents are now in Pinecone as searchable vectors!

**But here's the thing:** Right now you can only upload. You can't ask questions yet.

Next, you'll build the query side - the part that lets you:

- Ask "Tell me about Anthropic"
- Ask "How do I use the Pinecone TypeScript client?"
- Ask "What are common pitfalls?"

And get answers based on YOUR knowledge base, not hallucinations!

This is where the full request/response cycle comes alive and RAG starts to feel like magic.

---

## Bonus: Understanding the Text Upload Route

Want to see a simpler version of the upload pipeline? Check out `/api/upload-text/route.ts` - it's already implemented and shows the same flow without the web scraping complexity:

1. **Direct chunking** - Uses `chunkText()` from `app/libs/chunking.ts`
2. **Same embedding process** - Calls OpenAI with `text-embedding-3-small`
3. **Same Pinecone upload** - Uses index.upsert()

The main difference: it skips the DataProcessor scraping step since it receives text directly from the user. This is useful when you want to upload documentation, articles, or any text content without needing a URL.

---

## Video Solution Walkthrough

Watch this guide to building the API route:

<iframe src="https://share.descript.com/embed/tb6EgaRGjay" width="640" height="360" frameborder="0" allowfullscreen></iframe>

---

## Challenge Solution

Here's the complete implementation for `app/api/upload-document/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { DataProcessor } from '@/app/libs/dataProcessor';
import { openaiClient } from '@/app/libs/openai/openai';
import { pineconeClient } from '@/app/libs/pinecone';
import { z } from 'zod';

const uploadDocumentSchema = z.object({
	urls: z.array(z.string().url()).min(1),
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const parsed = uploadDocumentSchema.parse(body);
		const { urls } = parsed;

		// Step 1: Scrape and chunk the content
		const processor = new DataProcessor();
		const chunks = await processor.processUrls(urls);

		if (chunks.length === 0) {
			return NextResponse.json(
				{ error: 'No content found to process' },
				{ status: 400 }
			);
		}

		// Step 2: Generate embeddings and upload to Pinecone
		const index = pineconeClient.Index(process.env.PINECONE_INDEX!);
		const batchSize = 100;
		let successCount = 0;

		for (let i = 0; i < chunks.length; i += batchSize) {
			const batch = chunks.slice(i, i + batchSize);

			// Generate embeddings
			const embeddingResponse = await openaiClient.embeddings.create({
				model: 'text-embedding-3-small',
				input: batch.map((chunk) => chunk.content),
			});

			// Prepare vectors for Pinecone
			const vectors = batch.map((chunk, idx) => ({
				id: `${chunk.metadata.url}-${chunk.metadata.chunkIndex}`,
				values: embeddingResponse.data[idx].embedding,
				metadata: {
					text: chunk.content,
					url: chunk.metadata.url || '',
					title: chunk.metadata.title || '',
					chunkIndex: chunk.metadata.chunkIndex || 0,
					totalChunks: chunk.metadata.totalChunks || 0,
				},
			}));

			// Upload to Pinecone
			await index.upsert(vectors);
			successCount += batch.length;
		}

		return NextResponse.json({
			success: true,
			chunksProcessed: chunks.length,
			vectorsUploaded: successCount,
		});
	} catch (error) {
		console.error('Error uploading documents:', error);
		return NextResponse.json(
			{ error: 'Failed to upload documents' },
			{ status: 500 }
		);
	}
}
```

**Key implementation points:**

- **Step 1:** Parse and validate URLs using Zod schema
- **Step 2:** Use DataProcessor to scrape and chunk URLs
- **Step 3:** Check for empty chunks and return error if none
- **Step 4:** Get Pinecone index from environment variable
- **Step 5:** Process chunks in batches of 100
- **Step 6:** Generate embeddings for each batch using OpenAI
- **Step 7:** Map chunks to Pinecone vector format with metadata
- **Step 8:** Upload vectors to Pinecone using upsert
- **Step 9:** Return success response with counts

---

## What You Built

You now have a complete document ingestion pipeline! This is the "write" side of your RAG system.

**What's working:**

- ✅ URL validation and scraping
- ✅ Intelligent text chunking with overlap
- ✅ Embedding generation
- ✅ Batch upload to Pinecone
- ✅ Proper metadata tracking

**What's next:**
You'll build the "read" side - querying Pinecone to answer questions about your knowledge base. This is where RAG comes alive!
