import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departments = await prisma.department.findMany();

  const sorted = [...departments].sort((a: any, b: any) => {
    const left = `${a.code || ''} ${a.name || ''}`.trim();
    const right = `${b.code || ''} ${b.name || ''}`.trim();
    return left.localeCompare(right);
  });

  return NextResponse.json(sorted);
}
