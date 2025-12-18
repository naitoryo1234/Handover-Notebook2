# Database Connection Errors (Troubleshooting)

## Symptoms
- Error Message: `Timed out fetching a new connection from the connection pool. More info: http://pris.ly/d/connection-pool (Current connection pool timeout: 10, connection limit: ...)`
- Occurs primarily during local development with Next.js (Fast Refresh).

## Cause
This is a common issue in development environments. Next.js's "Fast Refresh" (hot reloading) can sometimes create multiple instances of the Prisma Client if not handled correctly, or simply exhaust the connection pool by rapidly reloading api routes/server actions that open connections.

## Solution

### 1. Singleton Pattern (Already Implemented)
We are correctly using the singleton pattern in `src/lib/prisma.ts`. This ensures that only one Prisma Client instance exists across hot reloads in development.
```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient(...);
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 2. Auto-Recovery
The error is transient. In development, simply refreshing the page or waiting a few seconds usually resolves it as old connections time out and return to the pool.

### 3. Production Configuration
In a production environment (Vercel/Serverless), this issue is handled by:
- **Connection Pooling**: Using a connection pooler (like PgBouncer or Neon's built-in pooling) in the `DATABASE_URL`.
- **Serverless Warning**: If you see this in production, verify your database connection string includes the pooling parameter (e.g., `?pgbouncer=true` or similar depending on the provider).

## Action Plan for Production
If this error appears in production logs:
1.  Check `DATABASE_URL` environment variable.
2.  Ensure you represent using a **Pooled Connection URL** (e.g., from Neon/Supabase), not the Direct Connection URL.
3.  Adjust `connection_limit` in the prisma schema datasource URL if necessary: `url = env("DATABASE_URL")` (append `?connection_limit=10` etc if direct).

**Current Status**: No code changes required. The local error is benign but annoying.
