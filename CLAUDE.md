# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Runs both Next.js frontend and Convex backend in parallel
  - Frontend: http://localhost:3000
  - Convex dashboard opens automatically
- `npm run dev:frontend` - Run only Next.js frontend
- `npm run dev:backend` - Run only Convex backend

### Build & Production
- `npm run build` - Build Next.js for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

This is a full-stack TypeScript application using:

### Frontend
- **Next.js 15** with App Router - React framework with file-based routing in `/app`
- **Tailwind CSS 4** - Utility-first styling
- **Clerk** - Authentication provider integrated via `ClerkProvider` in app/layout.tsx:35

### Backend
- **Convex** - Real-time backend with:
  - Database schema defined in `convex/schema.ts`
  - Server functions in `convex/myFunctions.ts`
  - Auth config in `convex/auth.config.ts` (requires Clerk JWT configuration)

### Key Integration Points
- **ConvexClientProvider** (components/ConvexClientProvider.tsx:9-19) wraps the app with `ConvexProviderWithClerk` to integrate Convex with Clerk auth
- **Middleware** (middleware.ts:3-7) protects `/server` routes using Clerk
- Path aliases configured: `@/*` maps to root directory

### Setup Requirements
1. Environment variable `NEXT_PUBLIC_CONVEX_URL` required for Convex connection
2. Clerk JWT template must be configured with issuer domain in `convex/auth.config.ts`
3. Set `CLERK_JWT_ISSUER_DOMAIN` in Convex dashboard environment variables

### Project Structure
- `/app` - Next.js pages and layouts
- `/components` - React components
- `/convex` - Backend functions and schema
- `/public` - Static assets