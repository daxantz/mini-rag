# Week 0: Setup & Orientation

Welcome to the RAG Applications curriculum! Before we dive into building AI-powered applications, we need to get your development environment and accounts set up.

**⚠️ IMPORTANT: Complete the [Pre-Course Homework](./PRE-COURSE-HOMEWORK.md) FIRST!**

That document includes:
- 3Blue1Brown videos on vectors and embeddings (required viewing!)
- LLM fundamentals
- Agent architecture readings
- Re-ranking concepts
- Account creation instructions

**Time Required:** 2-3 hours (after completing homework)

**Goal:** Complete all setup steps so you're ready to code on Day 1 of Week 1

---

## Two-Phase Approach

**Phase 1: Pre-Course Homework** ← Do this first!
- Watch foundational videos (3-4 hours)
- Read agent/RAG articles
- Create API accounts
- [Start Here: PRE-COURSE-HOMEWORK.md](./PRE-COURSE-HOMEWORK.md)

**Phase 2: Week 0 Setup** ← You are here
- Install development tools
- Clone repository
- Configure environment
- Test everything works

---

## Video: Pinecone and OpenAI Setup

Watch this walkthrough of setting up your OpenAI and Pinecone accounts:

<iframe src="https://share.descript.com/embed/eDhPxpnPLKa" width="640" height="360" frameborder="0" allowfullscreen></iframe>

---

## Why Week 0 Matters

Starting a course and immediately hitting setup issues is frustrating and wastes valuable learning time. Week 0 ensures:
- Everyone starts Week 1 on equal footing
- No one gets stuck on configuration during live sessions
- You can focus on learning RAG concepts, not debugging Node.js

**Please complete ALL steps below BEFORE the Week 0 kickoff session.**

---

## Setup Checklist

Use this checklist to track your progress:

### Required Accounts
- [ ] OpenAI API account with $5+ credit
- [ ] Pinecone account (free tier)
- [ ] Vercel account (free tier)
- [ ] Helicone account (free tier)
- [ ] GitHub account

### Local Development
- [ ] Node.js 20+ installed
- [ ] Git installed
- [ ] VS Code (or preferred IDE) installed
- [ ] Terminal/command line access

### Repository Setup
- [ ] Starter repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Development server runs (`npm run dev`)

### API Keys Configured
- [ ] `.env.local` file created
- [ ] OpenAI API key added and working
- [ ] Pinecone API key added and working
- [ ] Helicone API key added (optional for Week 0)
- [ ] Test script passes

---

## Step 1: Install Node.js (15 minutes)

### Check if Node.js is Already Installed

Open your terminal and run:
```bash
node --version
```

**If you see `v20.x.x` or higher:** ✅ You're good! Skip to Step 2.

**If you see a lower version or an error:** Continue below.

### Install Node.js 20+

**Option A: Using Official Installer (Recommended for beginners)**

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (should be 20.x or higher)
3. Run the installer
4. Follow the prompts (accept defaults)
5. Restart your terminal
6. Verify: `node --version`

**Option B: Using nvm (Recommended for experienced developers)**

macOS/Linux:
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then install Node.js
nvm install 20
nvm use 20
nvm alias default 20
```

Windows:
- Download [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
- Install and run: `nvm install 20` then `nvm use 20`

### Verify npm is Working

```bash
npm --version
```

You should see `10.x.x` or similar.

---

## Step 2: Install Git (10 minutes)

### Check if Git is Already Installed

```bash
git --version
```

**If you see `git version 2.x.x`:** ✅ You're good! Skip to Step 3.

### Install Git

**macOS:**
```bash
# Using Homebrew (install Homebrew first if needed: https://brew.sh)
brew install git

# OR install Xcode Command Line Tools
xcode-select --install
```

**Windows:**
- Download from [git-scm.com](https://git-scm.com/download/win)
- Run installer (accept defaults)

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

### Configure Git (First-time users)

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Step 3: Create Required Accounts (30 minutes)

### 3.1 OpenAI Account (REQUIRED)

**Why you need it:** OpenAI provides the embedding models and GPT models for RAG.

**Cost:** ~$5-10 total for the course

**Steps:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Click "Sign up" (or "Log in" if you have an account)
3. Verify your email
4. Go to **Billing** → **Add payment method**
5. Add a credit/debit card
6. Add at least **$5 credit** (Settings → Billing → Add credits)
7. Go to **API Keys** → **Create new secret key**
8. **IMPORTANT:** Copy the key immediately (starts with `sk-...`)
9. Save it somewhere safe (you won't see it again!)

**Setting Spending Limits (Recommended):**
- Go to **Billing** → **Limits**
- Set **hard limit** to $10 (prevents overspending)
- Set **soft limit** to $5 (you'll get an email notification)

**Verification:**
```bash
# Test your API key works (replace YOUR_KEY with your actual key)
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_OPENAI_KEY"
```

You should see a JSON response with model names.

---

### 3.2 Pinecone Account (REQUIRED)

**Why you need it:** Pinecone is our vector database for storing embeddings.

**Cost:** FREE (starter plan is sufficient)

**Steps:**
1. Go to [pinecone.io](https://www.pinecone.io/)
2. Click "Sign up free"
3. Create account (use Google/GitHub for faster signup)
4. After login, click **"Create Index"**
   - **Name:** `rag-course` (or any name you prefer)
   - **Dimensions:** `1536` (for OpenAI's text-embedding-3-small)
   - **Metric:** `cosine`
   - **Region:** Choose closest to you
   - **Spec:** Starter (free tier)
5. Wait for index to be created (~30 seconds)
6. Go to **API Keys** (left sidebar)
7. Copy your API key (starts with `pcsk_...` or similar)
8. Save it somewhere safe

**Verification:**
Your index should show "Ready" status in the dashboard.

---

### 3.3 Vercel Account (REQUIRED)

**Why you need it:** We'll deploy your capstone project to Vercel.

**Cost:** FREE

**Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign up"
3. **Use your GitHub account** to sign up (easiest)
4. Accept permissions
5. You should see the Vercel dashboard

**That's it!** We'll use this in Week 4 for deployment.

---

### 3.4 Helicone Account (OPTIONAL for Week 0)

**Why you need it:** Helicone provides observability for your LLM calls (see costs, latency, errors).

**Cost:** FREE (generous free tier)

**Steps:**
1. Go to [helicone.ai](https://www.helicone.ai/)
2. Click "Sign up"
3. Create account
4. Go to **Settings** → **API Keys**
5. Copy your API key (starts with `sk-helicone-...`)
6. Save it somewhere safe

**Note:** You can skip this for now and add it later in Week 4.

---

### 3.5 GitHub Account (REQUIRED)

**Why you need it:** You'll clone repos and submit your projects via GitHub.

**If you already have one:** ✅ You're good!

**If not:**
1. Go to [github.com](https://github.com)
2. Click "Sign up"
3. Follow the prompts
4. Verify your email

---

## Step 4: Clone Starter Repository (15 minutes)

### Get the Starter Code

**Option A: Using Git Clone (Recommended)**

```bash
# Navigate to where you keep projects
cd ~/Desktop/projects  # or wherever you prefer

# Clone the repository (replace with actual repo URL when available)
git clone https://github.com/parsity/rag-starter-project.git

# Navigate into the project
cd rag-starter-project
```

**Option B: Download ZIP**

1. Go to the repository URL
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Open terminal and navigate to the extracted folder

---

### Install Dependencies

```bash
# Make sure you're in the project directory
cd rag-starter-project

# Install all dependencies
npm install
```

This will take 1-2 minutes. You should see a progress bar and eventually "added XXX packages".

**Common Issues:**

❌ **"npm: command not found"**
- Node.js isn't installed properly. Go back to Step 1.

❌ **"EACCES: permission denied"**
- Don't use `sudo npm install`
- Fix permissions: [npmjs.com/get-npm](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

❌ **Network timeouts**
- Try using different network
- Or: `npm install --registry=https://registry.npmjs.org/`

---

### Project Structure

After installation, you should see:

```
rag-starter-project/
├── app/                # Next.js app directory
│   ├── api/           # API routes (you'll build these)
│   ├── components/    # React components
│   └── lib/           # Utility functions
├── scripts/           # Helper scripts
├── .env.example       # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Step 5: Configure Environment Variables (10 minutes)

### Create .env.local File

```bash
# Copy the example file
cp .env.example .env.local
```

**Windows users:**
```bash
copy .env.example .env.local
```

### Add Your API Keys

Open `.env.local` in your code editor and add your keys:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Pinecone Configuration
PINECONE_API_KEY=pcsk-xxxxxxxxxxxxxxxxxxxxxxxxxx
PINECONE_INDEX=rag-course
PINECONE_ENVIRONMENT=us-east-1  # or your region

# Helicone (Optional - can add later)
HELICONE_API_KEY=sk-helicone-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT:**
- Replace the `xxxxxxxxx` with your actual API keys
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep these keys secret!

---

## Step 6: Test Your Setup (10 minutes)

### Run the Test Script

We've included a test script that verifies all your API keys work:

```bash
npm run test:setup
```

**What this tests:**
1. ✅ OpenAI API connection
2. ✅ OpenAI embeddings generation
3. ✅ Pinecone connection
4. ✅ Pinecone write/read operations

**Expected Output:**
```
🔍 Testing setup...

✅ OpenAI API: Connected
✅ OpenAI Embeddings: Generated 1536-dimensional vector
✅ Pinecone: Connected to index 'rag-course'
✅ Pinecone: Successfully wrote test vector
✅ Pinecone: Successfully read test vector

🎉 All tests passed! You're ready to start.
```

**If something fails:**
- Double-check your API keys in `.env.local`
- Make sure you have credits in OpenAI account
- Verify Pinecone index name matches
- See Troubleshooting section below

---

### Run the Development Server

```bash
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in 1.2s
```

Open your browser and go to [http://localhost:3000](http://localhost:3000)

You should see a welcome page with a simple interface.

**To stop the server:** Press `Ctrl+C` in the terminal

---

## Troubleshooting Common Issues

### OpenAI API Issues

**❌ "Incorrect API key provided"**
- Copy the key again from OpenAI dashboard
- Make sure there are no extra spaces in `.env.local`
- Key should start with `sk-proj-` or `sk-`

**❌ "You exceeded your current quota"**
- Add credits to your OpenAI account
- Check billing settings
- Verify payment method is valid

**❌ "Rate limit exceeded"**
- Wait a few minutes and try again
- Free tier has lower limits

---

### Pinecone Issues

**❌ "Could not connect to Pinecone"**
- Check your API key is correct
- Verify index name matches (case-sensitive!)
- Confirm index status is "Ready" in dashboard

**❌ "Dimension mismatch"**
- Your index must have 1536 dimensions
- Delete and recreate index with correct dimensions

**❌ "Index not found"**
- Make sure `PINECONE_INDEX` in `.env.local` matches your index name exactly
- Check for typos

---

### Node/npm Issues

**❌ "Module not found"**
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then `npm install`

**❌ "Port 3000 already in use"**
- Another app is using that port
- Kill the process or use different port: `npm run dev -- -p 3001`

**❌ "Cannot find module 'typescript'"**
- Run `npm install -D typescript @types/node @types/react`

---

### Still Stuck?

**Before the Kickoff Session:**
1. Post in the course Slack channel with:
   - What you tried
   - The exact error message
   - Screenshot if helpful
2. Check the pinned messages in Slack (others might have same issue)
3. Tag the instructor for urgent issues

**During the Kickoff Session:**
- We'll dedicate 30 minutes to debugging setup issues
- Share your screen if needed
- Help each other (collaborative troubleshooting!)

---

## What's Next?

Once you've completed all steps above:

### Before Week 1 Starts:

1. **Join the Slack workspace** (link sent via email)
2. **Introduce yourself** in #introductions:
   - Your name
   - Your background
   - What you want to build with RAG
   - Your favorite emoji 🚀

3. **Optional prep:** Skim through Week 1 materials
   - `/week-1-foundations/README.md`
   - Get excited about what we'll build!

### Week 0 Kickoff Session

**When:** [Date/Time will be scheduled]

**Agenda:**
1. Welcome & introductions (10 min)
2. Troubleshoot any setup issues (30 min)
3. Tour of the starter project (15 min)
4. Week 1 preview (5 min)

**Bring to the session:**
- Any setup questions or issues
- Ideas for what you want to build
- Enthusiasm! 🎉

---

## API Cost Expectations

Here's roughly what you'll spend throughout the course:

| Week | Activity | Estimated Cost |
|------|----------|----------------|
| 1 | Embeddings (small dataset) | $0.10 - 0.50 |
| 2 | Embeddings (larger dataset) | $0.50 - 2.00 |
| 3 | Fine-tuning (optional) | $1.00 - 3.00 |
| 3 | Agent testing | $0.50 - 1.00 |
| 4 | Capstone project | $1.00 - 3.00 |
| **Total** | | **$3 - $10** |

**Tips to save money:**
- Use smaller datasets while learning
- Test with fewer queries first
- Cache embeddings (don't regenerate)
- Set spending limits in OpenAI dashboard

---

## Quick Reference: Essential Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run setup test
npm run test:setup

# Check Node version
node --version

# Check npm version
npm --version

# View environment variables (macOS/Linux)
cat .env.local

# View environment variables (Windows)
type .env.local
```

---

## Resources

### Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Pinecone Docs](https://docs.pinecone.io)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

### Community
- Course Slack workspace (link in email)
- Office hours: Mondays, 1 hour after each week starts
- Instructor email: [provided separately]

---

## Checklist: Are You Ready?

Before Week 1, make sure you can say YES to all of these:

- [ ] ✅ I can run `npm run dev` and see the app at localhost:3000
- [ ] ✅ I ran `npm run test:setup` and all tests passed
- [ ] ✅ I have at least $5 credit in my OpenAI account
- [ ] ✅ My Pinecone index shows "Ready" status
- [ ] ✅ I've joined the Slack workspace
- [ ] ✅ I know where to ask for help if I get stuck

**If you checked all boxes:** 🎉 You're ready! See you in Week 1!

**If you're missing anything:** No worries! Join the Week 0 kickoff session and we'll get you sorted.

---

## FAQ

**Q: Do I need to know Python?**
A: No! This course uses TypeScript/JavaScript exclusively.

**Q: Can I use a different vector database?**
A: For the course, please use Pinecone so we can support you better. After the course, you can adapt to other databases (Qdrant, Weaviate, etc.)

**Q: What if I can't afford the OpenAI credits?**
A: Reach out to the instructor. We may have credits available or can suggest alternatives.

**Q: Can I use a different IDE instead of VS Code?**
A: Absolutely! Use whatever you're comfortable with.

**Q: My company blocks some sites. What should I do?**
A: You may need to use a personal laptop or work with your IT team to whitelist:
- openai.com
- pinecone.io
- vercel.com
- helicone.ai

**Q: How much RAM/disk space do I need?**
A: Minimum: 8GB RAM, 5GB free disk space. Recommended: 16GB RAM, 10GB disk.

---

**Ready to build RAG applications? Let's go! 🚀**
