# Package.json Scripts for Starter Project

Add these scripts to the starter project's `package.json`:

```json
{
  "name": "rag-starter-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test:setup": "node scripts/test-setup.js"
  },
  "dependencies": {
    "@pinecone-database/pinecone": "^2.0.0",
    "ai": "^3.0.0",
    "next": "14.1.0",
    "openai": "^4.28.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "dotenv": "^16.4.0",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5"
  }
}
```

## Key Dependencies Explained

### Production Dependencies

- **@pinecone-database/pinecone**: Vector database client
- **ai**: Vercel AI SDK for streaming LLM responses
- **next**: Next.js framework
- **openai**: OpenAI API client
- **react** & **react-dom**: React for UI

### Development Dependencies

- **@types/\***: TypeScript type definitions
- **autoprefixer** & **postcss** & **tailwindcss**: CSS processing
- **dotenv**: Environment variable management
- **eslint**: Code linting
- **typescript**: TypeScript compiler

## Script Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test:setup       # Run setup verification script

# Linting
npm run lint             # Check code for issues
```
