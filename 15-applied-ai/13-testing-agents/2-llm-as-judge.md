# LLM as Judge: Evaluating Agent Output Quality

While traditional tests verify structure and routing, they can't assess the *quality* of generated content. That's where **LLM as Judge** comes in - using an LLM to evaluate another LLM's output.

---

## What is LLM as Judge?

**LLM as Judge** is a testing pattern where you use one LLM to evaluate the quality of another LLM's output. Instead of checking exact text matches (which fail due to non-determinism), you evaluate based on criteria like:

- Engagement and tone
- Factual accuracy
- Format adherence
- Relevance to the prompt
- Writing quality

Think of it like code review, but automated with AI.

---

## Why Use LLM as Judge?

### The Problem with Traditional Testing

```typescript
// ❌ This fails due to non-determinism
expect(post).toBe("React hooks let you use state in functional components");

// ❌ This is too loose - doesn't check quality
expect(post.length).toBeGreaterThan(0);
```

Traditional assertions can't evaluate:
- Is the tone appropriate?
- Is the content engaging?
- Does it follow best practices?
- Is it factually correct?

### The LLM as Judge Solution

```typescript
// ✅ Use an LLM to score quality on a 1-10 scale
const evaluation = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: z.object({
    score: z.number().min(1).max(10),
    reasoning: z.string()
  }),
  prompt: `Rate this LinkedIn post on engagement and professionalism...`
});

expect(evaluation.object.score).toBeGreaterThanOrEqual(7);
```

Now you're testing *quality*, not exact output.

---

## When to Use LLM as Judge

**Use it for:**
- Content generation quality (posts, articles, etc.)
- Summarization accuracy
- Tone and style adherence
- Fact-checking against references
- Detecting hallucinations

**Don't use it for:**
- Fast unit tests (LLM calls are slow ~1-3s each)
- Exact structural validation (use traditional assertions)
- High-frequency CI/CD runs (expensive)

**Best for:** Evals, periodic quality checks, and development validation.

---

## Implementation Pattern

Location: `app/agents/__tests__/llm-as-judge.test.ts`

### Step 1: Generate Content

```typescript
// Call your agent to generate content
const result = await ragAgent({
  type: 'rag',
  query: 'Write a LinkedIn post about React hooks',
  originalQuery: 'Write a LinkedIn post about React hooks',
  messages: [],
});

// Get the full text from the stream
const generatedPost = await result.text;
```

### Step 2: Define Evaluation Schema

```typescript
import { z } from 'zod';

const evaluationSchema = z.object({
  score: z.number().min(1).max(10)
    .describe('Quality score from 1-10'),
  reasoning: z.string()
    .describe('Detailed explanation for the score'),
});
```

### Step 3: Use LLM to Evaluate

```typescript
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

const evaluation = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: evaluationSchema,
  prompt: `You are an expert evaluator of LinkedIn posts.

Score this post from 1-10 based on:
- Engagement and authenticity
- Writing quality and structure
- Appropriate use of formatting
- Relevance to the topic

Reference example (high quality):
${REFERENCE_EXAMPLE}

Generated post to evaluate:
${generatedPost}

Provide a score and detailed reasoning.`,
});
```

### Step 4: Assert Quality Threshold

```typescript
// Log results for debugging
console.log(`Score: ${evaluation.object.score}/10`);
console.log(`Reasoning: ${evaluation.object.reasoning}`);

// Assert minimum quality
expect(evaluation.object.score).toBeGreaterThanOrEqual(7);
```

---

## Full Example

Here's a complete test from `app/agents/__tests__/llm-as-judge.test.ts`:

```typescript
import { ragAgent } from '../rag';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

describe('LLM as Judge - Agent Quality Evaluation', () => {
  jest.setTimeout(60000); // LLM calls take time!

  it('should generate high-quality LinkedIn posts', async () => {
    // Reference example of a good post
    const GOOD_EXAMPLE = `
      5 Biggest mistakes of my coding career?

      1. Not learning the fundamentals before diving into frameworks
      2. Being afraid to admit when I didn't know something
      3. Only taking on tasks I knew I could finish
      4. Not understanding how engineering fits into business goals
      5. Not speaking up

      That last one hurt me the most.

      [... rest of engaging post ...]
    `.trim();

    const MINIMUM_SCORE = 7;

    // 1. Generate content with your agent
    const result = await ragAgent({
      type: 'rag',
      query: 'I love React hooks and use them all the time',
      originalQuery: 'I love React hooks and use them all the time',
      messages: [],
    });

    const fullText = await result.text;

    // 2. Define evaluation criteria
    const evaluationSchema = z.object({
      score: z.number().min(1).max(10),
      reasoning: z.string(),
    });

    // 3. Evaluate with LLM judge
    const evaluation = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: evaluationSchema,
      prompt: `You are an expert evaluator of LinkedIn posts.

Compare the generated post with the reference and score it from 1-10 based on:
- Engagement and authenticity
- Writing quality and structure
- Appropriate use of formatting
- Relevance to the topic

Reference example (high quality):
${GOOD_EXAMPLE}

Generated post to evaluate:
${fullText}

Provide a score and detailed reasoning.`,
    });

    // 4. Log and assert
    console.log(`\nLLM Judge Score: ${evaluation.object.score}/10`);
    console.log(`Reasoning: ${evaluation.object.reasoning}`);
    console.log(`\nGenerated Post:\n${fullText}\n`);

    expect(evaluation.object.score).toBeGreaterThanOrEqual(MINIMUM_SCORE);
  });
});
```

---

## Your Challenge: Create the LLM as Judge Test

Now it's your turn to implement this test in your codebase.

### Step 1: Create the Test File

Create a new file at `app/agents/__tests__/llm-as-judge.test.ts` and implement the complete test using the pattern shown above.

### Step 2: Run Your Test

```bash
# Run the specific test
npx jest llm-as-judge

# Or run all tests
yarn test

# Warning: Takes 30-60 seconds due to multiple LLM calls
```

**Expected output:**
```
LLM Judge Score: 8/10
Reasoning: The post demonstrates good engagement with a personal story
and clear structure. The formatting uses appropriate line breaks and
emphasis. Content is relevant to React hooks and career development.
Could improve with more specific technical examples.

Generated Post:
[Your agent's generated post]

✓ should generate high-quality LinkedIn posts (45234ms)
```

---

## Customizing Evaluation Criteria

### Multiple Criteria Scoring

```typescript
const detailedEvaluationSchema = z.object({
  engagement: z.number().min(1).max(10),
  accuracy: z.number().min(1).max(10),
  formatting: z.number().min(1).max(10),
  relevance: z.number().min(1).max(10),
  overallScore: z.number().min(1).max(10),
  reasoning: z.string(),
  improvements: z.array(z.string()),
});

const evaluation = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: detailedEvaluationSchema,
  prompt: `Evaluate on multiple dimensions...`,
});

// Assert on specific criteria
expect(evaluation.object.engagement).toBeGreaterThanOrEqual(7);
expect(evaluation.object.accuracy).toBeGreaterThanOrEqual(8);
expect(evaluation.object.overallScore).toBeGreaterThanOrEqual(7);
```

### Fact-Checking Against Source Material

```typescript
const factCheckSchema = z.object({
  isAccurate: z.boolean(),
  factualErrors: z.array(z.string()),
  reasoning: z.string(),
});

const factCheck = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: factCheckSchema,
  prompt: `Compare the generated summary with the source document.

Source material:
${sourceDocument}

Generated summary:
${generatedSummary}

Identify any factual errors or hallucinations.`,
});

expect(factCheck.object.isAccurate).toBe(true);
expect(factCheck.object.factualErrors).toHaveLength(0);
```

---

## LLM as Judge vs Evals

### What are Evals?

**Evals** (evaluations) are systematic tests of LLM performance across many examples. They're like a comprehensive test suite for your AI system.

**LLM as Judge** is one technique used *within* evals to score quality programmatically.

### Example Eval Dataset

```typescript
const evalDataset = [
  {
    input: "Write about TypeScript benefits",
    expectedTone: "professional",
    minimumScore: 7
  },
  {
    input: "Explain async/await to beginners",
    expectedTone: "educational",
    minimumScore: 7
  },
  // ... 100 more test cases
];

for (const testCase of evalDataset) {
  const result = await agent(testCase.input);
  const score = await evaluateWithLLM(result, testCase.criteria);

  results.push({
    input: testCase.input,
    output: result,
    score: score,
    passed: score >= testCase.minimumScore
  });
}

console.log(`Pass rate: ${results.filter(r => r.passed).length / results.length}`);
```

This lets you:
- Track model performance over time
- Detect regressions when you change prompts
- A/B test different approaches
- Find edge cases

---

## Best Practices

### 1. Use Specific Evaluation Criteria

```typescript
// ❌ Vague
prompt: "Is this post good?"

// ✅ Specific
prompt: `Score 1-10 based on:
- Hook effectiveness (first 2 lines)
- Clear value proposition
- Call to action present
- Professional tone without jargon`
```

### 2. Provide Reference Examples

```typescript
// ✅ Always include examples
prompt: `
Reference example (score: 9/10):
${GOOD_EXAMPLE}

Reference example (score: 4/10):
${BAD_EXAMPLE}

Now evaluate this:
${generatedContent}
`
```

### 3. Log Results for Analysis

```typescript
// Save evaluation results
const results = {
  timestamp: new Date(),
  input: query,
  output: generatedPost,
  score: evaluation.object.score,
  reasoning: evaluation.object.reasoning,
};

// Optionally log to file for tracking trends
fs.appendFileSync('eval-results.jsonl', JSON.stringify(results) + '\n');
```

### 4. Use Consistent Judge Models

```typescript
// Use the same model for consistency
const JUDGE_MODEL = 'gpt-4o-mini'; // Fast and cheap for evals

// For critical evals, use a stronger model
const CRITICAL_JUDGE_MODEL = 'gpt-4o'; // More accurate but slower/expensive
```

---

## Cost Considerations

LLM as Judge uses API calls, so be mindful of costs:

```typescript
// Cost per evaluation (approximate)
// gpt-4o-mini: ~$0.001 per eval
// gpt-4o: ~$0.01 per eval

// For 100 test cases:
// gpt-4o-mini: ~$0.10
// gpt-4o: ~$1.00
```

**Tips:**
- Use `gpt-4o-mini` for frequent evals (cheap, fast)
- Use `gpt-4o` for critical quality checks
- Cache evaluation results to avoid re-running
- Run full evals periodically, not on every commit

---

## Limitations

LLM as Judge isn't perfect:

1. **Subjectivity** - Different judge models might score differently
2. **Bias** - Judges may favor certain styles or topics
3. **Cost** - Requires API calls for every evaluation
4. **Latency** - Each eval takes 1-5 seconds
5. **Not deterministic** - Same content might get slightly different scores

**Solution:** Use it as a *guide*, not absolute truth. Combine with:
- Human review for critical content
- Traditional assertions for structure
- Multiple evaluation runs for consistency

---

## Your Turn

**After building your test, run it:**
```bash
npx jest llm-as-judge
# Or run all tests: yarn test
```

**Experiment:**
1. Adjust the `MINIMUM_SCORE` threshold
2. Add new evaluation criteria
3. Try different judge models (gpt-4o vs gpt-4o-mini)
4. Create an eval dataset with 10 test cases

---

## 📝 Homework Assignment: Build Your Eval Dataset

**Assignment:** Create a comprehensive evaluation dataset for one of your agents.

**Requirements:**

1. **Create an eval dataset with 10-15 test cases**
   - Each test case should have: input query, expected behavior, quality criteria
   - Include edge cases and challenging scenarios
   - Mix of positive and negative examples

2. **Implement LLM as Judge tests**
   - Write tests using the LLM as Judge pattern
   - Define clear evaluation criteria (5-7 specific criteria)
   - Set reasonable score thresholds

3. **Document your findings:**
   - What patterns emerged from failures?
   - How did you adjust your prompts or logic?
   - What scores did your agent achieve?

**What to Submit:**
- Video walkthrough (3-5 minutes) showing your eval dataset and results
- Code with your test implementation

**Submit Your Work:**
- **[Video Submission - Week 4](https://tally.so/form/Z9JApCkF/create)**
- **[Code Submission - Week 4](https://tally.so/form/DXPyafyJ/create)**

**Due:** Before Module 14

**Why This Matters:** Production RAG systems require rigorous testing. Building eval datasets and using LLM as Judge helps you iterate quickly and maintain quality as your system evolves.

---

## What's Next?

Now you know:
- ✅ How to test routing and structure (traditional tests)
- ✅ How to evaluate content quality (LLM as Judge)
- ✅ When to use each approach

Next up: **Agent Frameworks** where you'll learn about LangGraph for orchestrating complex agent workflows!

---

## Quick Reference

```bash
# Run your LLM as Judge test (after creating it)
npx jest llm-as-judge

# Run all tests
yarn test

# Run with verbose output
npx jest llm-as-judge --verbose
```

