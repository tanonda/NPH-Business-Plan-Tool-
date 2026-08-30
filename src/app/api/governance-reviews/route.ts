import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';

const entityTypes = new Set(['PILLAR', 'ALLOCATION', 'JOB_DESCRIPTION']);

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const params = new URL(request.url).searchParams;
  const requestedType = params.get('entityType')?.toUpperCase();
  const limit = Math.min(Math.max(Number(params.get('limit') || 50), 1), 100);
  if (requestedType && !entityTypes.has(requestedType)) return NextResponse.json({ error: 'Unsupported governance review type.' }, { status: 400 });

  const reviews = await prisma.governanceReview.findMany({
    where: requestedType ? { entityType: requestedType } : undefined,
    include: { reviewedBy: { select: { name: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
  return NextResponse.json(reviews);
}
