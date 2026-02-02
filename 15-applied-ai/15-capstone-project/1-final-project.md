## Capstone Extension: Multi-Source RAG System

Extend the existing RAG project by adding **one additional data source**, indexed separately and handled by a **new agent**.

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

### Presentation
Record a **short video (≈ 3–5 minutes)** showing:
1. The original system
2. The new data source
3. The new agent in action
4. Example queries that hit the new index

---

## Submission
- Deployed URL
- GitHub repository
- Video link

---

## Evaluation Criteria
- Correct use of embeddings and chunking
- Clear separation of indexes and agents
- Clean, readable code
- Clear explanation of design decisions

---

### Guiding Principle
> **One new data source. One new index. One new agent. Explain why.**