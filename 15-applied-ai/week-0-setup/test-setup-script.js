#!/usr/bin/env node

/**
 * Setup Test Script
 *
 * This script verifies that all required API keys and services are working correctly.
 * Run with: npm run test:setup
 *
 * Or directly: node scripts/test-setup.js
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const { Pinecone } = require('@pinecone-database/pinecone');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.blue}🔍 ${msg}${colors.reset}\n`),
};

// Track results
let allTestsPassed = true;
const results = {
  openai: false,
  embeddings: false,
  pinecone: false,
  pineconeWrite: false,
};

async function testOpenAI() {
  log.section('Testing OpenAI API...');

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    log.error('OpenAI API key not found in .env.local');
    log.info('Add: OPENAI_API_KEY=sk-...');
    allTestsPassed = false;
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    log.warning('OpenAI API key should start with "sk-"');
  }

  // Test basic API connection
  try {
    await makeOpenAIRequest('/v1/models', apiKey);
    log.success('OpenAI API: Connected');
    results.openai = true;
  } catch (error) {
    log.error(`OpenAI API: ${error.message}`);
    allTestsPassed = false;
    return;
  }

  // Test embeddings
  try {
    const embedding = await generateEmbedding('Hello world', apiKey);
    if (embedding.length === 1536) {
      log.success(`OpenAI Embeddings: Generated ${embedding.length}-dimensional vector`);
      results.embeddings = true;
    } else {
      log.error(`OpenAI Embeddings: Unexpected dimension count (${embedding.length}, expected 1536)`);
      allTestsPassed = false;
    }
  } catch (error) {
    log.error(`OpenAI Embeddings: ${error.message}`);
    allTestsPassed = false;
  }
}

async function testPinecone() {
  log.section('Testing Pinecone...');

  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX;

  if (!apiKey) {
    log.error('Pinecone API key not found in .env.local');
    log.info('Add: PINECONE_API_KEY=...');
    allTestsPassed = false;
    return;
  }

  if (!indexName) {
    log.error('Pinecone index name not found in .env.local');
    log.info('Add: PINECONE_INDEX=rag-course');
    allTestsPassed = false;
    return;
  }

  try {
    const pc = new Pinecone({ apiKey });

    // Test connection by listing indexes
    const indexes = await pc.listIndexes();

    // Check if our index exists
    const indexExists = indexes.indexes?.some(idx => idx.name === indexName);

    if (!indexExists) {
      log.error(`Pinecone: Index "${indexName}" not found`);
      log.info('Create an index in the Pinecone dashboard with:');
      log.info('  - Dimensions: 1536');
      log.info('  - Metric: cosine');
      allTestsPassed = false;
      return;
    }

    log.success(`Pinecone: Connected to index "${indexName}"`);
    results.pinecone = true;

    // Test write/read operations
    const index = pc.index(indexName);
    const testVector = Array(1536).fill(0).map(() => Math.random());
    const testId = `test-${Date.now()}`;

    // Write test
    await index.upsert([
      {
        id: testId,
        values: testVector,
        metadata: { test: true, timestamp: Date.now() },
      },
    ]);
    log.success('Pinecone: Successfully wrote test vector');
    results.pineconeWrite = true;

    // Read test
    const queryResponse = await index.query({
      vector: testVector,
      topK: 1,
      includeMetadata: true,
    });

    if (queryResponse.matches && queryResponse.matches.length > 0) {
      log.success('Pinecone: Successfully queried test vector');
    } else {
      log.warning('Pinecone: Query returned no results (this is OK for empty indexes)');
    }

    // Clean up test vector
    await index.deleteOne(testId);

  } catch (error) {
    log.error(`Pinecone: ${error.message}`);
    allTestsPassed = false;
  }
}

async function testHelicone() {
  log.section('Testing Helicone (Optional)...');

  const apiKey = process.env.HELICONE_API_KEY;

  if (!apiKey) {
    log.warning('Helicone API key not found (this is optional for Week 0)');
    log.info('You can add it later: HELICONE_API_KEY=sk-helicone-...');
    return;
  }

  log.success('Helicone: API key found');
  log.info('We\'ll test Helicone integration in Week 4');
}

function checkEnvironment() {
  log.section('Checking Environment...');

  // Check Node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 20) {
    log.success(`Node.js: ${nodeVersion}`);
  } else {
    log.error(`Node.js: ${nodeVersion} (need v20 or higher)`);
    allTestsPassed = false;
  }

  // Check .env.local exists
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    log.success('.env.local file found');
  } else {
    log.error('.env.local file not found');
    log.info('Copy .env.example to .env.local and add your API keys');
    allTestsPassed = false;
  }
}

// Helper function to make OpenAI API requests
function makeOpenAIRequest(path, apiKey, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path,
      method: data ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(body));
        } else {
          const error = JSON.parse(body);
          reject(new Error(error.error?.message || `HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Helper function to generate embeddings
async function generateEmbedding(text, apiKey) {
  const response = await makeOpenAIRequest(
    '/v1/embeddings',
    apiKey,
    {
      model: 'text-embedding-3-small',
      input: text,
    }
  );
  return response.data[0].embedding;
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 RAG Course Setup Test');
  console.log('='.repeat(50) + '\n');

  checkEnvironment();
  await testOpenAI();
  await testPinecone();
  await testHelicone();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50) + '\n');

  console.log('OpenAI API:        ', results.openai ? '✅' : '❌');
  console.log('OpenAI Embeddings: ', results.embeddings ? '✅' : '❌');
  console.log('Pinecone Connect:  ', results.pinecone ? '✅' : '❌');
  console.log('Pinecone Write:    ', results.pineconeWrite ? '✅' : '❌');

  console.log('\n' + '='.repeat(50) + '\n');

  if (allTestsPassed) {
    log.success('🎉 All tests passed! You\'re ready to start Week 1.');
    console.log('\nNext steps:');
    console.log('  1. Join the course Slack workspace');
    console.log('  2. Attend the Week 0 kickoff session');
    console.log('  3. Start Week 1 materials on Monday\n');
    process.exit(0);
  } else {
    log.error('❌ Some tests failed. Please fix the issues above.');
    console.log('\nNeed help?');
    console.log('  - Check the Week 0 README troubleshooting section');
    console.log('  - Post in the course Slack channel');
    console.log('  - Attend the Week 0 kickoff session for help\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
