import { prisma } from '@/lib/prisma';

export async function GET() {
  const requiredEnv = ['DATABASE_URL'];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);
  let database = 'unknown';

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'ok';
  } catch {
    database = 'error';
  }

  const ok = missingEnv.length === 0 && database === 'ok';

  return Response.json({
    ok,
    service: 'vnh-business-plan-tool',
    environment: process.env.NODE_ENV || 'development',
    database,
    missingEnv,
    rateLimitPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE || 120)
  }, { status: ok ? 200 : 503 });
}
