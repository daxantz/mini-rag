# Pre-Course Homework: Foundations

**⏰ Complete BEFORE Week 0 Kickoff Session**

**Time Required:** 3-4 hours (spread over a few days)

**Goal:** Build foundational knowledge of vectors, embeddings, LLMs, and RAG concepts so you're ready to build on Day 1.

---

## Why This Matters

This course moves fast. These videos and readings give you the mental models you need to understand:
- Why vectors are the foundation of RAG
- How embeddings capture meaning
- How LLMs actually work
- Why we need agents and observability

**Watch these BEFORE the course starts**, and the technical implementation will make much more sense!

---

## Part 1: Linear Algebra Foundations (90 minutes)

These 3Blue1Brown videos are the best visual explanations of vectors and dot products. You'll see why embeddings work.

### Video 1: Vectors - What Are They?
**Duration:** ~10 minutes
**Link:** https://www.youtube.com/watch?v=fNk_zzaMoSs

**Key Concepts:**
- Vectors as arrows in space
- Vectors as lists of numbers
- Why both views matter for RAG

**What to Watch For:**
- How vectors represent direction and magnitude
- How to add vectors together
- Why we use vector coordinates

---

### Video 2: Linear Combinations, Span, and Basis Vectors
**Duration:** ~10 minutes
**Link:** https://www.youtube.com/watch?v=k7RM-ot2NWY

**Key Concepts:**
- Linear combinations (scaling and adding vectors)
- Basis vectors (building blocks)
- Span (what vectors can you reach?)

**Connection to RAG:**
- Embeddings are high-dimensional vectors (512 or 1536 dimensions)
- Each dimension is a basis vector
- Meaning is captured in these dimensions

---

### Video 3: Dot Products and Duality ⭐ MOST IMPORTANT
**Duration:** ~14 minutes
**Link:** https://www.youtube.com/watch?v=LyGKycYT2v0

**Key Concepts:**
- Dot product as projection
- Geometric interpretation
- Why dot products measure similarity

**Connection to RAG:**
- **This is the foundation of semantic search!**
- Cosine similarity uses dot products
- Higher dot product = more similar meanings

**After Watching:** You should understand why `[0.8, 0.6] · [0.7, 0.9] = 1.1` tells us something about similarity.

---

## Part 2: Large Language Models (60 minutes)

Understand how LLMs work under the hood so you can build better applications.

### Video 1: Large Language Models Explained Briefly
**Duration:** ~10 minutes
**Link:** https://www.3blue1brown.com/lessons/mini-llm

**Key Concepts:**
- What are LLMs predicting?
- Token embeddings
- Why context matters

---

### Video 2: Transformers - The Architecture Behind LLMs
**Duration:** ~25 minutes
**Link:** https://www.3blue1brown.com/lessons/gpt

**Key Concepts:**
- Transformer architecture
- Self-attention mechanism
- Why transformers work for language

**Connection to RAG:**
- RAG provides external context to transformers
- Embeddings are learned during transformer training

---

### Video 3: Attention in Transformers
**Duration:** ~20 minutes
**Link:** https://www.3blue1brown.com/lessons/attention

**Key Concepts:**
- Multi-head attention
- How models "focus" on relevant parts
- Attention weights

---

### Video 4: Building a Large Language Model (Optional Deep Dive)
**Duration:** ~45 minutes
**Link:** https://www.youtube.com/watch?v=NKnZYvZA7w4

**If you have time:** This is a fantastic deep dive into building an LLM from scratch.

---

## Part 3: Vector Databases (30 minutes)

Understand why we need specialized databases for vectors and how they work.

### Pinecone Overview
**Link:** https://www.pinecone.io

**What to Read:**
1. Go to "Product" → "How it works"
2. Read: "What is a vector database?"
3. Browse the use cases

**Key Concepts:**
- Why traditional databases can't handle vectors efficiently
- Approximate Nearest Neighbors (ANN) search
- Indexes and namespaces

**Action Item:** Bookmark the Pinecone docs - you'll use them often!

---

### Qdrant Documentation
**Link:** https://qdrant.tech

**What to Read:**
1. "Concepts" section in docs
2. Compare to Pinecone (both are excellent)

**Why We Learn Qdrant Too:**
- Different trade-offs (open-source vs managed)
- Some companies prefer self-hosted solutions
- Good to know your options

---

## Part 4: Observability & Monitoring (15 minutes)

Learn why tracking your LLM usage matters.

### Helicone
**Link:** https://www.helicone.ai

**What to Explore:**
1. Homepage - understand what problems it solves
2. "Features" page - see what you can track
3. "Pricing" - note the generous free tier

**Key Questions to Answer:**
- Why do you need observability for LLMs?
- What metrics matter? (cost, latency, errors, usage)
- How does it help debug RAG applications?

---

## Part 5: Building Effective Agents (45 minutes)

Read these articles to understand agent design patterns.

### Reading 1: Building Effective Agents (Anthropic) ⭐ REQUIRED
**Link:** https://www.anthropic.com/engineering/building-effective-agents

**Time:** ~20 minutes

**Key Concepts:**
- Agentic workflows vs workflows
- When to use agents vs simple prompts
- Patterns: Routing, tool use, planning
- Orchestration patterns

**What to Think About:**
- When would you use an agent vs a simple chatbot?
- How do agents make decisions?
- What are the risks/challenges?

**Take Notes On:**
- Routing patterns (we'll implement this!)
- Tool calling
- Multi-step reasoning

---

### Reading 2: Re-Ranking for Semantic Search (Qdrant) ⭐ REQUIRED
**Link:** https://qdrant.tech/documentation/search-precision/reranking-semantic-search/

**Time:** ~15 minutes

**Key Concepts:**
- Why initial semantic search isn't perfect
- Two-stage retrieval: Retrieve → Re-rank
- Re-ranking models vs embedding models
- Trade-offs (speed vs quality)

**Connection to Course:**
- We'll implement re-ranking in Module 9
- This dramatically improves RAG quality
- Understanding the "why" helps you decide when to use it

**Questions to Consider:**
- When is re-ranking worth the extra latency?
- How does it differ from embedding search?

---

### Reading 3: Prompt Engineering for Business (Anthropic)
**Link:** https://www.anthropic.com/news/prompt-engineering-for-business-performance

**Time:** ~10 minutes

**Key Concepts:**
- Prompt engineering best practices
- System prompts vs user prompts
- Few-shot vs zero-shot learning
- Measuring prompt quality

**Connection to Course:**
- You'll write many prompts for agents
- Good prompts = better performance
- Testing and iteration matter

---

## Part 6: Create Accounts (30 minutes)

While you're learning, create these accounts so you're ready for Week 0.

### Required Accounts:
- [ ] **OpenAI** - https://platform.openai.com
  - Add payment method
  - Add $5+ credit
  - Get API key
  - Set spending limits ($10 hard limit recommended)

- [ ] **Pinecone** - https://www.pinecone.io
  - Free tier is fine
  - Get API key
  - Don't create index yet (we'll do this together)

- [ ] **Helicone** - https://www.helicone.ai
  - Free tier
  - Get API key

- [ ] **Vercel** - https://vercel.com
  - Sign up with GitHub
  - No config needed yet

- [ ] **GitHub** - https://github.com
  - If you don't have one already

**Save all API keys somewhere safe!** You'll need them for Week 0 setup.

---

## Optional: Explore Qdrant (If You Have Time)

If you're curious about alternative vector databases:

**Link:** https://qdrant.tech/documentation/

**What to Explore:**
- Quick start guide
- Compare features to Pinecone
- Read about hybrid search
- Explore the Python/JavaScript clients

**Why This Matters:**
- Some companies prefer open-source solutions
- Good to understand the landscape
- Transferable concepts

---

## Self-Check: Are You Ready?

Before Week 0 starts, you should be able to answer these:

### Vectors & Math
- [ ] What is a vector? (both geometric and numerical views)
- [ ] Why does the dot product measure similarity?
- [ ] What is cosine similarity and why do we use it?

### LLMs
- [ ] How do transformers work at a high level?
- [ ] What is attention and why does it matter?
- [ ] What are embeddings?

### RAG Concepts
- [ ] Why can't we just use LLMs directly for everything?
- [ ] What problem does RAG solve?
- [ ] What is a vector database and why is it needed?

### Agents
- [ ] What makes something an "agent" vs a simple chatbot?
- [ ] What is routing?
- [ ] Why do we need observability?

**If you can't answer these:** Re-watch the relevant videos or ask in Slack before Week 0!

---

## Checklist Before Week 0

Complete these before the Week 0 Kickoff Session:

### Videos Watched
- [ ] Vectors (Chapter 1)
- [ ] Linear combinations, span, basis vectors (Chapter 2)
- [ ] Dot products and duality (Chapter 9) ⭐ Critical
- [ ] Mini LLM explanation
- [ ] GPT/Transformers (Chapter 5)
- [ ] Attention in transformers (Chapter 6)

### Readings Completed
- [ ] Anthropic: Building Effective Agents
- [ ] Qdrant: Re-ranking semantic search
- [ ] Anthropic: Prompt engineering

### Resources Explored
- [ ] Pinecone website and docs
- [ ] Qdrant overview
- [ ] Helicone overview

### Accounts Created
- [ ] OpenAI (with API key and $5+ credit)
- [ ] Pinecone (with API key)
- [ ] Helicone (with API key)
- [ ] Vercel
- [ ] GitHub

### Ready for Week 0
- [ ] All API keys saved securely
- [ ] Basic understanding of vectors and embeddings
- [ ] Understanding of why RAG matters
- [ ] Excited to build! 🚀

---

## What Happens Next?

### Week 0 Kickoff Session (Live)
We'll meet for the kickoff where we'll:
1. Setup development environment (Node.js, Git, IDE)
2. Clone the starter repository
3. Configure environment variables
4. Test that everything works
5. Troubleshoot any issues together

**Before that session:** Complete the [Week 0 Setup Guide](./README.md) to install Node.js, Git, etc.

---

## Study Tips

**Spread it out:** Don't watch all videos in one sitting. Spread them over 3-4 days.

**Take notes:** Jot down questions as you watch. We'll answer them in class!

**Pause and think:** Especially in the 3Blue1Brown videos, pause when confused and rewind.

**Don't stress perfection:** You don't need to master linear algebra. Just get the intuition.

**Ask questions:** Join Slack early and ask if anything is confusing!

---

## Additional Resources (Optional)

If you want to go deeper:

### Books
- **"Speech and Language Processing" by Jurafsky & Martin** - Chapter on vector semantics
- **"Deep Learning" by Goodfellow et al.** - Chapter on embeddings

### Courses
- **FastAI Practical Deep Learning** - Free course, great for intuition
- **Stanford CS224N** - NLP course (advanced)

### Interactive
- **TensorFlow Embedding Projector** - Visualize embeddings: projector.tensorflow.org

---

## Questions?

**Before the course starts:** Post in Slack #general channel

**During Week 0:** We'll have dedicated Q&A time

**Anytime:** Email the instructor (provided separately)

---

**Ready to learn RAG? See you in Week 0! 🎓**
