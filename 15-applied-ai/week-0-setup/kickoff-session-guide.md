# Week 0 Kickoff Session Guide

**Duration:** 1 hour

**Format:** Live video call (Zoom/Google Meet)

**Goal:** Ensure all students are set up and ready to start Week 1 on Monday

---

## Pre-Session Checklist (Instructor)

- [ ] Test your own setup (run through all Week 0 steps)
- [ ] Prepare screen sharing
- [ ] Have the starter repository open
- [ ] Have troubleshooting commands ready to copy/paste
- [ ] Set up breakout rooms (if large cohort)
- [ ] Prepare Slack channel with pinned setup resources

---

## Session Agenda

### 1. Welcome & Introductions (10 minutes)

**Instructor Introduction:**
- Brief intro about yourself
- Your experience with RAG/AI
- Why you're excited about teaching this course

**Set Expectations:**
- "This is a hands-on, project-based course"
- "We learn by building, not just watching"
- "Expect to spend ~1 hour/day for weeks 1-3, more in week 4"
- "You'll have a deployed RAG app by the end"

**Student Introductions (if small cohort <10 people):**
- Name
- Background
- What they want to build
- One thing they're nervous about

**Poll (if large cohort >10 people):**
- "Who has worked with LLMs before?" (show of hands)
- "Who has used OpenAI API?"
- "Who has deployed a Next.js app?"
- "Who completed all Week 0 setup steps?" 👈 **Important!**

---

### 2. Troubleshooting Setup Issues (30 minutes)

**Quick status check:**
"Let's do a quick poll in chat:
- Type ✅ if your setup is 100% working
- Type ⚠️ if you have a minor issue
- Type ❌ if you're blocked"

#### For ✅ (Setup Complete):
- "Great! You can help others while we debug"
- Encourage them to pair up in breakout rooms if needed
- Give them an optional task: "Try modifying the starter project's UI"

#### For ⚠️ and ❌ (Need Help):

**Common Issues & Solutions:**

**Issue #1: OpenAI API Key Not Working**

```bash
# Test the key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

Troubleshooting:
- Check for extra spaces in `.env.local`
- Verify credits in OpenAI account
- Try regenerating the key

**Issue #2: Pinecone Connection Failed**

Live demo:
1. Open Pinecone dashboard
2. Show index status (must be "Ready")
3. Verify index dimensions (1536)
4. Copy API key again
5. Check `PINECONE_INDEX` name matches exactly

**Issue #3: npm install Failing**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Issue #4: Port Already in Use**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)

# Or use different port
npm run dev -- -p 3001
```

**Issue #5: Environment Variables Not Loading**

```bash
# Verify .env.local exists
ls -la | grep .env

# Check contents (hide sensitive values)
cat .env.local | sed 's/=.*/=***/'

# Restart dev server (env changes require restart)
```

**Breakout Rooms (if needed):**
- Large cohorts: Split into groups of 3-4
- Each group debugs together
- Instructor rotates through rooms
- Students help each other (best learning!)

---

### 3. Starter Project Walkthrough (15 minutes)

**Screen share the starter project:**

```
rag-starter-project/
├── app/
│   ├── api/              👈 "You'll build API routes here"
│   ├── components/       👈 "React components for the UI"
│   └── lib/              👈 "Utility functions and configs"
├── scripts/              👈 "Helper scripts for data processing"
├── .env.example          👈 "Template for your .env.local"
└── README.md             👈 "Setup instructions"
```

**Key Points to Cover:**

1. **This is MINIMAL scaffolding:**
   - "We provide the structure, you build the brain"
   - "Week 1: You'll build similarity search from scratch"
   - "Weeks 2-3: You'll add to this starter"
   - "Week 4: You might start fresh or fork this"

2. **What's Included:**
   - Next.js 14 App Router setup
   - TypeScript configuration
   - OpenAI and Pinecone clients (just setup, no logic)
   - Basic UI components (chat interface)
   - Tailwind CSS for styling

3. **What's NOT Included (you'll build):**
   - ❌ Chunking logic
   - ❌ Embedding generation
   - ❌ RAG pipeline
   - ❌ Agent system
   - ❌ Fine-tuning code

4. **Quick Code Tour:**

```typescript
// app/lib/openai.ts - Just the client setup
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

```typescript
// app/lib/pinecone.ts - Just the client setup
import { Pinecone } from '@pinecone-database/pinecone';

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || '',
});
```

5. **Run the dev server together:**

```bash
npm run dev
```

Show the default page at `localhost:3000`.

---

### 4. Week 1 Preview (5 minutes)

**What Students Will Learn:**

"Starting Monday, we dive into Week 1: RAG Foundations & Vector Math"

**Monday-Thursday (45 min/day):**
- What is RAG and why it matters
- Vector math fundamentals (dot product, cosine similarity)
- How embeddings work
- Setting up Pinecone

**Friday Live Session:**
- We'll build a similarity search engine from scratch together
- No fancy libraries - pure TypeScript
- You'll see RAG work with ~20 lines of code

**Weekend Assignment:**
- Build your own similarity search tool
- 10-15 documents of your choice
- Implement cosine similarity yourself

**How to Prepare:**
"Don't need to prepare! Just show up Monday ready to learn."

**Optional Pre-reading:**
- Skim `/week-1-foundations/README.md`
- Watch 3Blue1Brown's "Vectors, what even are they?"
- Play around with the starter project

---

### 5. Q&A & Wrap-Up (remaining time)

**Open Floor for Questions:**

Common questions to expect:
- "What if I fall behind?"
  - Office hours every Monday
  - Slack channel for async help
  - Recorded sessions available
  - Catch-up support provided

- "How technical will this get?"
  - Focus on practical application
  - Math is intuitive, not rigorous
  - TypeScript knowledge assumed
  - No ML/AI background needed

- "Can I work with a partner?"
  - Study groups encouraged!
  - Individual submissions required
  - Collaboration is great for learning

- "What happens after the course?"
  - You'll have a portfolio project
  - Alumni Slack channel
  - Optional advanced topics sessions
  - Open-source project opportunities

**Action Items:**

For Students:
- [ ] Join the Slack workspace (link in chat)
- [ ] Post introduction in #introductions
- [ ] Review Week 1 README if curious
- [ ] Monday: First async lesson goes live at 9 AM

For Instructor:
- [ ] Share recording link (for those who couldn't attend)
- [ ] Post troubleshooting recap in Slack
- [ ] Follow up individually with anyone still blocked
- [ ] Schedule Monday office hours

**Closing Motivation:**

"By the end of this course, you'll:
- Understand how RAG actually works under the hood
- Build a production-ready AI application
- Have a portfolio project to show employers
- Be the go-to AI person in your organization

This is ambitious, but totally doable. We'll build together, help each other, and ship something amazing.

See you Monday! 🚀"

---

## After the Session

### Immediate (Within 1 hour):
- [ ] Post recording link in Slack
- [ ] Share slides/resources
- [ ] Pin common troubleshooting solutions
- [ ] Send welcome email with:
  - Week 1 schedule
  - Slack channel links
  - Office hours Zoom link

### Within 24 hours:
- [ ] Follow up with students who had issues
- [ ] Create #setup-help channel for ongoing questions
- [ ] Post reminder about Monday's first lesson

### Before Week 1:
- [ ] Test all Week 1 materials
- [ ] Prepare live session demos
- [ ] Set up office hours calendar
- [ ] Create assignment submission form

---

## Tips for a Great Session

**Do:**
- ✅ Be enthusiastic and encouraging
- ✅ Share your screen often
- ✅ Pause for questions regularly
- ✅ Use breakout rooms for personalized help
- ✅ Make students feel capable

**Don't:**
- ❌ Rush through troubleshooting
- ❌ Assume everyone has same tech comfort level
- ❌ Skip over "obvious" steps
- ❌ Make anyone feel bad for being stuck
- ❌ Go over time (respect their schedules)

**If Running Over Time:**
- Offer to stay on for anyone with urgent issues
- Schedule follow-up 1-on-1s for complex problems
- Use office hours for extended debugging

---

## Emergency Contact Plan

If major issues come up during Week 0:
1. **Slack outage**: Backup to email list
2. **Starter repo issues**: Have fork ready
3. **Mass API failures**: Have local-only alternatives
4. **Your availability**: Have backup instructor contact

---

## Success Metrics

Week 0 is successful if:
- [ ] >90% of students completed setup
- [ ] All students have access to Slack
- [ ] Everyone ran `npm run test:setup` successfully
- [ ] Students feel excited and supported
- [ ] Clear next steps for Week 1

---

**Ready to kick off an amazing cohort! You've got this! 🎉**
