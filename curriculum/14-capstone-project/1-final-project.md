## Capstone Project: Multi-Source RAG System

Extend the existing RAG project by adding **one additional data source**, indexed separately and handled by a **new agent**.

---

## Week 4: Project Proposal

Before building, submit a proposal outlining your plan.

**Video Assignment:** Record a **2-3 minute video** explaining your project plan.

**Your proposal should cover:**

1. **Data Source:**
   - What data will you add? (articles, docs, posts, etc.)
   - Where will you get it? (public API, scraping, dataset)
   - Why did you choose this data?

2. **Chunking Strategy:**
   - How will you chunk this content?
   - What chunk size and overlap make sense?
   - Any special considerations for this data type?

3. **Agent Design:**
   - What will your new agent do?
   - How should the router decide when to use it?
   - What kind of queries should trigger this agent?

**Submit Your Proposal:**
- [Video Submission - Week 4](https://form.typeform.com/to/Z9JApCkF)
- [Code Submission - Week 4](https://form.typeform.com/to/DXPyafyJ) (include link to proposal doc or notes)

**Due:** Before starting implementation

---

## Requirements

### Data
- Add **one new data source** of your choice
  (articles, blog posts, docs, repos, posts, etc.)
- Create a **new vector index** for this data
- Data must be:
  - Public
  - Properly chunked
  - Embedded and uploaded successfully

---

### Agents
- Add **one new agent** responsible for the new data source
- Update routing so the correct agent is selected
- The new agent must:
  - Query the new index
  - Return grounded, relevant responses

---

### Testing
- Add tests that verify:
  - The new agent is selected correctly
  - Retrieval works for the new data source
  - Existing functionality is not broken

---

### Documentation
Your `README.md` must explain:
- What data you added and how you collected it
- How the new index is structured
- What the new agent does
- How routing works at a high level

---

## Week 5: Final Submission

**Video Assignment:** Record a **3-5 minute video** demonstrating your completed RAG system.

**Your video should show:**
1. The original system working
2. Your new data source and how you collected it
3. The new agent in action
4. Example queries that hit the new index
5. Brief explanation of your design decisions

**Submit Your Final Project:**
- [Video Submission - Week 5](https://form.typeform.com/to/SF6b6edL)
- [Code Submission - Week 5](https://form.typeform.com/to/TXjlfrlr) (include GitHub repo link)

---

## Evaluation Criteria
- Correct use of embeddings and chunking
- Clear separation of indexes and agents
- Clean, readable code
- Clear explanation of design decisions
- Working demo with example queries

---

### Guiding Principle
> **One new data source. One new index. One new agent. Explain why.**