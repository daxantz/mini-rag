# Branch Structure

This repository uses multiple branches for different purposes in the course.

## Student Branches

### `student-working-version` ⭐ COMPLETE WORKING VERSION
**This has all solutions implemented!**

**Purpose:** Fully working implementation with all exercises completed

**What's included:**
- ✅ All infrastructure and setup code
- ✅ All helper functions and utilities
- ✅ All API routes fully implemented
- ✅ All exercise solutions completed
- ✅ All agents fully implemented
- ✅ Re-ranking, structured outputs, and advanced features

**Use this branch for:**
- Reference when stuck on exercises
- Understanding how the complete system works
- Comparing your implementation
- Instructor demos
- Running the full application

**Fully implemented files:**
```
app/
├── scripts/exercises/
│   └── vector-similarity.ts          # ✅ Similarity search implemented
├── libs/
│   └── chunking.ts                   # ✅ getLastWords() implemented
├── agents/
│   ├── linkedin.ts                   # ✅ LinkedIn agent complete
│   └── rag.ts                        # ✅ RAG agent with re-ranking
└── api/
    └── select-agent/route.ts         # ✅ Selector with structured outputs
```

---

### `student-starter`
**Purpose:** Starter code with TODOs for students to complete (TO BE CREATED)

**What will be included:**
- ✅ All infrastructure and setup code (pre-built)
- ✅ Helper functions and utilities (pre-built)
- ✅ API routes scaffolding (pre-built)
- ❌ Exercise implementations (TODOs for students)
- ❌ Agent implementations (TODOs for students)

**Note:** This branch needs to be created from `student-working-version` by removing solutions and adding TODOs.

---

## Instructor/Solution Branches

### `solution`
**Purpose:** Complete working implementation

**Contains:**
- ✅ All exercises completed
- ✅ All agents implemented
- ✅ Full working application

**Use for:**
- Instructor reference
- Debugging student issues
- Comparing implementations
- Live coding demos

---

### `solution-session-2`, `solution-session-3`, `solution-session-4`
**Purpose:** Incremental solutions for each week

**Use for:**
- Showing weekly progress
- Students who join mid-course
- Catchup for students who fall behind

---

## Other Branches

### `main`
**Purpose:** Production-ready code (may differ from course version)

**Note:** This might include features beyond the curriculum. Use `student-todo-exercises` for the course.

---

### `working_version`
**Purpose:** Development branch for testing new features

---

### `cohort-1`
**Purpose:** Snapshot of first cohort's version (historical)

---

### `chunking-upload-test`
**Purpose:** Testing branch (can be ignored)

---

## Quick Start for Students

**Step 1: Clone the repository**
```bash
git clone https://github.com/your-org/mini_rag.git
cd mini_rag
```

**Step 2: Switch to student branch**
```bash
git checkout student-todo-exercises
```

**Step 3: Install dependencies**
```bash
yarn install
# or
npm install
```

**Step 4: Set up environment**
```bash
cp .env.example .env.local
# Add your API keys to .env.local
```

**Step 5: Start learning!**
```bash
# Check what exercises you need to complete
grep -r "TODO:" app/
```

---

## Quick Start for Instructors

**View solutions:**
```bash
git checkout solution
```

**View specific week's solution:**
```bash
git checkout solution-session-2  # Week 2 complete
git checkout solution-session-3  # Week 3 complete
git checkout solution-session-4  # Week 4 complete
```

**Compare student code to solution:**
```bash
# From student-todo-exercises branch
git diff solution -- app/agents/rag.ts
```

---

## Branch Protection

**Protected branches:**
- `main` - Production code
- `student-todo-exercises` - Student starter (don't push solutions here!)
- `solution` - Complete solutions

**Students should:**
- Work on their own forks or feature branches
- Never push to `student-todo-exercises` directly

**Instructors should:**
- Keep `student-todo-exercises` clean (TODOs only)
- Update `solution` when curriculum changes
- Create new `solution-session-X` branches for each cohort if needed

---

## Common Workflows

### For Students: Start a New Exercise

```bash
# Make sure you're on the right branch
git checkout student-todo-exercises

# Create a feature branch for your work (optional)
git checkout -b my-rag-agent-implementation

# Work on your implementation
# Test frequently
yarn test

# Commit your progress
git add .
git commit -m "Implement RAG agent"
```

---

### For Instructors: Update Student Branch

```bash
# Switch to student branch
git checkout student-todo-exercises

# Make changes (update curriculum, fix bugs, improve TODOs)
# IMPORTANT: Don't include solutions!

# Test that TODOs are clear
grep -r "TODO:" app/

# Commit and push
git add .
git commit -m "Update TODO guidance for RAG agent"
git push origin student-todo-exercises
```

---

### For Instructors: Update Solution Branch

```bash
# Switch to solution branch
git checkout solution

# Make changes (implement new features, fix bugs)

# Test everything works
yarn test
yarn dev

# Commit and push
git add .
git commit -m "Add re-ranking implementation"
git push origin solution
```

---

## Current Branch: student-todo-exercises ✅

You are currently on the student branch with exercises to complete. Follow the curriculum at `15-applied-ai/` to get started!

**Next steps:**
1. Complete [Pre-Course Homework](./15-applied-ai/week-0-setup/PRE-COURSE-HOMEWORK.md)
2. Set up your environment: [Week 0 Setup](./15-applied-ai/week-0-setup/README.md)
3. Start with Module 1: [Introduction to RAG](./15-applied-ai/1-intro-to-rag/)

**Happy coding! 🚀**
