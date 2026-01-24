# Qdrant Migration & Upload Scripts Guide

This document outlines the tasks completed in the `solution-session-2` branch and provides guidance for working with Qdrant and upload scripts.

## Overview

This branch includes Qdrant integration and upload scripts for Medium articles and LinkedIn posts with proper chunking and metadata.

---

## Task 1: Qdrant Client Setup

### What was done:

-   Installed `@qdrant/js-client-rest` package
-   Created `app/libs/qdrant.ts` for Qdrant client initialization
-   Uses `QDRANT_URL` and `QDRANT_API_KEY` environment variables

### Key changes:

-   Client initialization: `new QdrantClient({ url, apiKey })`
-   Simple, clean client setup

---

## Task 2: Complete Chunking Implementation

### What was done:

-   Implemented `getLastWords` function in `app/libs/chunking.ts`
-   Implemented `extractLinkedInPosts` with character-by-character CSV parser
-   Implemented `extractMediumArticle` with regex-based HTML parsing
-   Defined `LinkedInPost` and `MediumArticle` types

### Key features:

-   Character-by-character CSV parser handles multiline quoted fields
-   HTML extraction uses regex for title, date, URL, author, text
-   Proper overlap handling in chunking

---

## Task 3: Upload Scripts

### Medium Articles (`upload-articles.ts`):

-   Reads HTML files from `app/scripts/data/articles/`
-   Uses `extractMediumArticle` to parse HTML
-   Uses `chunkText` to create overlapping chunks (500 chars, 50 overlap)
-   Generates embeddings with OpenAI (text-embedding-3-small, 512 dimensions)
-   Uploads to `articles` collection in Qdrant

### LinkedIn Posts (`upload-linkedin.ts`):

-   Reads CSV from `app/scripts/data/brian_posts.csv`
-   Uses `extractLinkedInPosts` to parse CSV
-   NO chunking (posts uploaded as-is)
-   Filters posts >= 100 characters
-   Generates embeddings and uploads to `linkedin` collection

### Package.json scripts:

```json
"upload:articles": "npx tsx app/scripts/upload-articles.ts",
"upload:linkedin": "npx tsx app/scripts/upload-linkedin.ts"
```

---

## Task 4: Test Scripts

### Test LinkedIn Extraction (`test-linkedin-extraction.ts`):

-   Tests CSV parsing without Qdrant upload
-   Shows filtering logic (reject < 100 chars)
-   Displays sample posts

### Test Upload LinkedIn (`test-upload-linkedin.ts`):

-   Similar to extraction test but with summary format
-   Validates filtering and parsing

### Package.json scripts:

```json
"test:linkedin": "npx tsx app/scripts/test-linkedin-extraction.ts",
"test:upload-linkedin": "npx tsx app/scripts/test-upload-linkedin.ts"
```

---

## Task 5: Enhanced Upload UI

### What was done:

-   Updated `app/page.tsx` with enhanced upload form
-   Added type selector (post vs article)
-   Added metadata inputs (title, URL, date)
-   Integrates with `/api/upload-document` endpoint

### Key features:

-   Upload type selection
-   Metadata collection
-   Status feedback
-   Clean UI with Tailwind

---

## Environment Variables Required

Add to `.env`:

```bash
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your-api-key-here
OPENAI_API_KEY=your-openai-key-here
COHERE_RERANK_API=your-cohere-key-here
```

---

## Usage Summary

### Test the parsing (no Qdrant connection needed):

```bash
yarn test:linkedin
yarn test:upload-linkedin
```

### Perform actual uploads to Qdrant:

```bash
yarn upload:articles
yarn upload:linkedin
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
  contentType: 'linkedin'
}
```

### Medium Article Chunk Metadata:

```typescript
{
  content: string,           // Chunk text
  title: string,            // Article title
  author: string,           // Article author
  date: string,             // Publication date
  url: string,              // Article URL (also source)
  contentType: 'medium',    // Content type
  language: string,         // Article language
  chunkIndex: number,       // Position in article
  totalChunks: number,      // Total chunks for article
  startChar: number,        // Start position in original
  endChar: number          // End position in original
}
```

---

## Collections

1. **`articles`** - Medium article chunks with metadata
2. **`linkedin`** - LinkedIn posts (full, no chunking)

Both use:

-   Embedding model: `text-embedding-3-small`
-   Vector dimensions: 512
-   Distance metric: Cosine similarity

---

## Key Implementation Details

### CSV Parser (extractLinkedInPosts):

-   Character-by-character parsing
-   Handles multiline quoted fields
-   Properly escapes quotes (`""`)
-   Only treats newlines as separators when outside quotes

### HTML Parser (extractMediumArticle):

-   Regex-based extraction
-   Extracts title, date, URL, author, text, language
-   Removes HTML tags from body content
-   Normalizes whitespace

### Chunking (chunkText):

-   Splits by sentences
-   500 character chunks with 50 character overlap
-   Preserves context across chunk boundaries
-   Includes metadata (chunkIndex, totalChunks, startChar, endChar)
