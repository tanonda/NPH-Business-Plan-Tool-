import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';

export async function GET() {
  const auth = await requireApiRole(['ADMIN']);
  if (!auth.ok) return auth.response;

  const history = await prisma.exportHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      businessPlan: { select: { title: true, costCenter: true, year: true } }
    }
  });

  return NextResponse.json(history);
}
