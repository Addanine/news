# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application bootstrapped with create-t3-app. It uses:
- Next.js 15 with App Router (React 19)
- TypeScript with strict mode
- Tailwind CSS v4
- Type-safe environment variables with @t3-oss/env-nextjs and Zod

## Development Commands

```bash
npm run dev          # Start development server with Turbo
npm run build        # Build production bundle
npm run start        # Start production server
npm run preview      # Build and start production server

npm run check        # Run linter and typecheck (use after code changes)
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run typecheck    # TypeScript type checking without emitting

npm run format:check # Check code formatting with Prettier
npm run format:write # Auto-format code with Prettier
```

**After making code changes, always run `npm run check` to validate.**

## Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/env.js` - Type-safe environment variable validation schema
- `src/styles/` - Global CSS and Tailwind styles

### Path Aliases
Use `~/` to import from `src/`, e.g., `import "~/styles/globals.css"`

### Environment Variables
When adding new environment variables:
1. Add to `.env` (gitignored, never commit)
2. Add example to `.env.example`
3. Update schema in `src/env.js`:
   - Server vars go in `server` object
   - Client vars go in `client` object (must be prefixed with `NEXT_PUBLIC_`)
   - Add to `runtimeEnv` object

Use Docker builds with `SKIP_ENV_VALIDATION=true` to skip validation.

### TypeScript Configuration
- Strict mode enabled with `noUncheckedIndexedAccess`
- `checkJs` enabled for JavaScript files
- Module resolution: Bundler (ESNext)