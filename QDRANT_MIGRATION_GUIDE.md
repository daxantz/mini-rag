# Qdrant Migration & Upload Scripts Guide

This document outlines the tasks completed in the `chunking-upload-test` branch and provides example prompts to recreate this work.

## Overview

This branch migrated from Pinecone to Qdrant and created upload scripts for Medium articles and LinkedIn posts with proper chunking and metadata.

---

## Task 1: Replace Pinecone with Qdrant

### What was done:

-   Installed `@qdrant/qdrant-js` package
-   Updated `app/libs/pinecone.ts` to use Qdrant client
-   Changed initialization to use `QDRANT_URL` and `QDRANT_API_KEY` environment variables
-   Updated function signatures to include `collectionName` parameter

### Example prompts:

```
"I need to replace pinecone with qdrant - update @app/libs/pinecone.ts to use qdrant and yarn add qdrant client"
```

### Key changes:

-   Client initialization: `new QdrantClient({ url, apiKey })`
-   Updated documentation comments to reference Qdrant
-   Added `collectionName` parameter to `searchDocuments` function

---

## Task 2: Create Medium Articles Upload Script

### What was done:

-   Created `app/scripts/upload-medium-to-qdrant.ts`
-   Implemented chunking with 500 char chunks and 50 char overlap
-   Added metadata: `title`, `date`, `url`, `type: 'medium_article'`, `chunkIndex`, `totalChunks`
-   Filters out articles < 100 characters
-   Generates embeddings using OpenAI (text-embedding-3-small, 512 dimensions)
-   Uploads to `medium_articles` collection in batches

### Example prompts:

```
"We need a script to upload our medium articles with chunks and appropriate metadata
(according to @app/libs/chunking.test.ts) into qdrant"
```

### Key features:

-   Reads HTML files from `app/scripts/data/articles/`
-   Uses `extractMediumArticle` to parse HTML
-   Uses `chunkText` to create overlapping chunks
-   Batch processing (10 chunks at a time)

### Package.json script:

```json
"upload-medium": "npx ts-node app/scripts/upload-medium-to-qdrant.ts"
```

---

## Task 3: Create LinkedIn Posts Upload Script

### What was done:

-   Created `app/scripts/upload-linkedin-to-qdrant.ts`
-   NO chunking (posts uploaded as-is)
-   Added metadata: `date`, `url`, `likes`, `type: 'linkedin_post'`
-   Filters out posts < 100 characters
-   Generates embeddings using OpenAI (text-embedding-3-small, 512 dimensions)
-   Uploads to `linkedin_posts` collection in batches

### Example prompts:

```
"We need the same for linkedin posts (no chunking required)"
```

### Key features:

-   Reads CSV from `app/scripts/data/brian_posts.csv`
-   Uses `extractLinkedInPosts` to parse CSV
-   Batch processing (10 posts at a time)
-   Sanitizes URLs for use as IDs

### Package.json script:

```json
"upload-linkedin": "npx ts-node app/scripts/upload-linkedin-to-qdrant.ts"
```

---

## Task 4: Create Test Scripts

### What was done:

-   Created `app/scripts/test-medium-upload.ts`
-   Created `app/scripts/test-linkedin-upload.ts`
-   Both scripts skip Qdrant upload and print output to terminal
-   Verify filtering logic (reject content < 100 chars)
-   Show samples of rejected and valid content

### Example prompts:

```
"Run a small test that does NOT upload to qdrant - we should reject posts and articles
shorter than 100 chars. You can just comment out the upsert stuff and print output to terminal"
```

### Test results:

-   **LinkedIn**: 853 total posts → 811 valid (>= 100 chars), 42 rejected
-   **Medium**: 178 total articles → 169 valid, 9 rejected → 1,726 total chunks

### Package.json scripts:

```json
"test-upload-medium": "npx ts-node app/scripts/test-medium-upload.ts",
"test-upload-linkedin": "npx ts-node app/scripts/test-linkedin-upload.ts"
```

---

## Task 5: Fix CSV Parsing Bug

### What was done:

-   Fixed `extractLinkedInPosts` in `app/libs/chunking.ts`
-   Problem: Original parser split by newlines first, breaking multiline quoted fields
-   Solution: Character-by-character parser that tracks quote state across newlines
-   Handles escaped quotes (`""`) properly
-   Result: Increased from 68 posts to 853 posts parsed correctly

### Example prompts:

```
"There should be wayyyy more linkedin posts"
```

### Key fix:

-   Changed from line-by-line parsing to character-by-character
-   Properly handles multiline CSV fields within quotes
-   Only treats newlines as record separators when outside quotes

---

## Environment Variables Required

Add to `.env`:

```bash
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your-api-key-here
OPENAI_API_KEY=your-openai-key-here
```

---

## Usage Summary

### Test the uploads (no Qdrant connection needed):

```bash
yarn test-upload-linkedin
yarn test-upload-medium
```

### Perform actual uploads to Qdrant:

```bash
yarn upload-linkedin
yarn upload-medium
```

---

## Metadata Structures

### LinkedIn Post Metadata:

```typescript
{
  content: string,        // Full post text
  date: string,          // Publication date
  url: string,           // Post URL
  likes: number,         // Number of reactions
  type: 'linkedin_post'  // Content type identifier
}
```

### Medium Article Chunk Metadata:

```typescript
{
  content: string,           // Chunk text
  title: string,            // Article title
  date: string,             // Publication date
  url: string,              // Article URL
  type: 'medium_article',   // Content type identifier
  source: string,           // URL (for identification)
  chunkIndex: number,       // Position in article
  totalChunks: number,      // Total chunks for article
  startChar: number,        // Start position in original
  endChar: number          // End position in original
}
```

---

## Collections Created

1. **`linkedin_posts`** - 811 posts (full posts, no chunking)
2. **`medium_articles`** - 1,726 chunks from 169 articles

Both use:

-   Embedding model: `text-embedding-3-small`
-   Vector dimensions: 512
-   Distance metric: Cosine similarity

---

## Step-by-Step Recreation

To recreate this work in a new branch:

1. **Install Qdrant client**

    ```bash
    yarn add @qdrant/qdrant-js --ignore-engines
    ```

2. **Update Pinecone integration to Qdrant**

    - Replace imports and client initialization in `app/libs/pinecone.ts`

3. **Create upload scripts**

    - Copy patterns from existing scripts
    - Implement chunking for Medium, none for LinkedIn
    - Add metadata according to test requirements

4. **Create test scripts**

    - Remove Qdrant upload logic
    - Add console output for validation

5. **Fix CSV parser**

    - Update `extractLinkedInPosts` to handle multiline fields

6. **Add package.json scripts**

    - Add yarn commands for all 4 scripts

7. **Test before uploading**

    ```bash
    yarn test-upload-linkedin
    yarn test-upload-medium
    ```

8. **Upload to Qdrant**
    ```bash
    yarn upload-linkedin
    yarn upload-medium
    ```
