# Week 0 Setup Files

This directory contains all materials needed for Week 0: Setup & Orientation.

## Files Created

### For Students

1. **README.md** ⭐ Main setup guide
   - Complete step-by-step setup instructions
   - Troubleshooting common issues
   - API cost expectations
   - Verification steps
   - FAQ section
   - **Students read this first!**

2. **test-setup-script.js** - Automated verification script
   - Tests OpenAI API connection
   - Tests Pinecone connection
   - Verifies embeddings generation
   - Tests write/read operations
   - Provides colored terminal output
   - **Students run: `npm run test:setup`**

3. **env-example.txt** - Environment variables template
   - Copy this to `.env.local`
   - Fill in actual API keys
   - Includes helpful comments with links
   - **Copy to starter project as `.env.example`**

### For Instructors

4. **kickoff-session-guide.md** - Live session plan
   - Complete 1-hour session agenda
   - Troubleshooting playbook
   - Common issues & solutions
   - Starter project walkthrough
   - Student engagement strategies
   - Post-session follow-up tasks
   - **Instructor uses this to run Week 0 kickoff**

5. **package-json-scripts.md** - NPM configuration
   - Required scripts for starter project
   - Dependencies list with explanations
   - Version specifications
   - **Use when building starter repository**

6. **FILES.md** (this file) - Directory index
   - Overview of all Week 0 materials
   - How to use each file

---

## How to Use These Files

### Setting Up Week 0 for a New Cohort

**1. Prepare Starter Repository**
```bash
# Create starter project with Next.js
npx create-next-app@latest rag-starter-project --typescript --tailwind --app

# Copy setup files
cp week-0-setup/test-setup-script.js rag-starter-project/scripts/
cp week-0-setup/env-example.txt rag-starter-project/.env.example
cp week-0-setup/package-json-scripts.md rag-starter-project/SCRIPTS.md

# Add test:setup script to package.json
# (See package-json-scripts.md for dependencies)
```

**2. Send to Students (1 week before start)**
- Link to `README.md` (setup instructions)
- Link to starter repository
- Slack invite link
- Week 0 kickoff session calendar invite

**3. Prepare for Kickoff Session**
- Review `kickoff-session-guide.md`
- Test all setup steps yourself
- Prepare screen share
- Set up Zoom/Meet link
- Create Slack channels

**4. During Kickoff Session**
- Follow agenda in `kickoff-session-guide.md`
- Help students run `npm run test:setup`
- Troubleshoot issues live
- Build excitement for Week 1!

---

## File Dependencies

```
Student Flow:
├── README.md (reads first)
├── .env.example (copies to .env.local)
└── test-setup-script.js (runs to verify)

Instructor Flow:
├── kickoff-session-guide.md (session prep)
├── package-json-scripts.md (starter repo setup)
└── README.md (reference during troubleshooting)
```

---

## Customization Notes

### To Adapt for Your Course:

**README.md:**
- Update repository URLs
- Adjust API cost estimates
- Add your contact info
- Customize Slack channel names
- Update session dates/times

**test-setup-script.js:**
- Modify expected index dimensions if not using text-embedding-3-small
- Add/remove service tests as needed
- Customize success/error messages

**kickoff-session-guide.md:**
- Adjust timing based on cohort size
- Add/remove agenda items
- Customize intro/outro
- Update Zoom/calendar links

---

## Common Modifications

### For Different Vector Databases (Qdrant, Weaviate, etc.)

1. Update `README.md` Section 3.2 with new DB instructions
2. Modify `test-setup-script.js` to test new DB connection
3. Update `env-example.txt` with new DB variables
4. Adjust `package-json-scripts.md` dependencies

### For Different LLM Providers (Anthropic, Cohere, etc.)

1. Update `README.md` Section 3.1 with new provider steps
2. Add new test function in `test-setup-script.js`
3. Update `env-example.txt` with new API keys
4. Adjust `package-json-scripts.md` dependencies

### For Corporate/Enterprise Settings

1. Add VPN setup instructions to `README.md`
2. Include IT approval process steps
3. Add enterprise SSO setup if needed
4. Document any proxy configurations
5. Update `test-setup-script.js` to handle proxies

---

## Testing These Materials

Before sending to students, test by:

1. **Fresh install test:**
   ```bash
   # Start with clean machine (or VM)
   # Follow README.md step by step
   # Note any confusing parts
   # Time how long each step takes
   ```

2. **Run test script:**
   ```bash
   npm run test:setup
   # Should pass all checks
   ```

3. **Peer review:**
   - Have another instructor review
   - Ask a colleague to follow README
   - Get feedback on clarity

4. **Dry run kickoff:**
   - Practice the full session
   - Time each section
   - Prepare backup plans

---

## Maintenance

### Before Each Cohort:

- [ ] Test all API endpoints still work
- [ ] Verify latest package versions
- [ ] Update cost estimates
- [ ] Check all links work
- [ ] Test on fresh environment
- [ ] Update dates/times in docs

### When Dependencies Change:

- [ ] Update `package-json-scripts.md`
- [ ] Test new versions
- [ ] Update `README.md` if setup changes
- [ ] Document breaking changes

### When APIs Change:

- [ ] Update `test-setup-script.js`
- [ ] Test all endpoints
- [ ] Update `README.md` instructions
- [ ] Alert current students if mid-cohort

---

## Troubleshooting These Files

**If test script fails:**
- Check Node.js version compatibility
- Verify all dependencies installed
- Test API keys manually first
- Check for rate limiting

**If students confused:**
- Add more screenshots to README
- Record video walkthrough
- Update FAQ section
- Simplify language

**If setup takes too long:**
- Consider pre-created VM image
- Prepare API keys in advance (not recommended)
- Simplify required tools
- Offer setup support sessions

---

## Success Metrics

Week 0 materials are successful if:
- [ ] 90%+ students complete setup before Week 1
- [ ] Setup takes <3 hours average
- [ ] Less than 5 support requests per cohort
- [ ] Test script pass rate >95%
- [ ] Students report feeling prepared

---

## Future Improvements

Potential additions:
- [ ] Video walkthrough of setup
- [ ] Docker container for consistent environment
- [ ] Setup automation script
- [ ] Visual diagrams in README
- [ ] Interactive setup checklist web page
- [ ] Automated API key testing web service

---

## Credits & Attribution

Setup guide inspired by:
- Next.js official docs
- OpenAI quickstart guides
- Pinecone getting started
- Vercel deployment docs

Test script inspired by:
- Create React App health checks
- Kubernetes readiness probes
- npm doctor command

---

**Questions about these files?**

Contact: [Instructor Email]
Slack: #setup-help
Office Hours: [Schedule Link]
