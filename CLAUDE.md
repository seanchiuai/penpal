# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Runs both Next.js frontend and Convex backend in parallel
  - Frontend: http://localhost:3000
  - Convex dashboard opens automatically
- `npm run dev:frontend` - Run only Next.js frontend with Turbopack
- `npm run dev:backend` - Run only Convex backend

### Build & Production
- `npm run build` - Build Next.js for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

This is a full-stack TypeScript application using:

### Frontend
- **Next.js 15** with App Router - React framework with file-based routing in `/app`
- **Tailwind CSS 4** - Utility-first styling with custom dark theme variables
- **shadcn/ui** - Pre-configured component library
- **Clerk** - Authentication provider integrated via `ClerkProvider` in app/layout.tsx

### Backend
- **Convex** - Real-time backend with:
  - Database schema defined in `convex/schema.ts`
  - Server functions in `convex/` directory (myFunctions.ts, todos.ts)
  - Auth config in `convex/auth.config.ts` (requires Clerk JWT configuration)

### Key Integration Points
- **ConvexClientProvider** (components/ConvexClientProvider.tsx) wraps the app with `ConvexProviderWithClerk` to integrate Convex with Clerk auth
- **Middleware** (middleware.ts) protects `/server` routes using Clerk
- Path aliases configured: `@/*` maps to root directory

## Setup Requirements

### Environment Variables
```env
NEXT_PUBLIC_CONVEX_URL=<your-convex-deployment-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
CLERK_SECRET_KEY=<clerk-secret-key>
```

### Clerk JWT Configuration
1. Create a JWT template named "convex" in Clerk dashboard
2. Set issuer domain in the template
3. Add `CLERK_JWT_ISSUER_DOMAIN` environment variable in Convex dashboard

## Project Structure
- `/app` - Next.js pages and layouts (App Router)
- `/components` - React components including sidebar and UI components
- `/convex` - Backend functions, schema, and auth configuration
- `/public` - Static assets including custom fonts
- `middleware.ts` - Route protection configuration