import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { JobDescriptionSchema } from '@/lib/schemas';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const record = await prisma.jobDescription.findUnique({ where: { id: params.id }, include: { department: true, objectives: { orderBy: { sortOrder: 'asc' } }, assignments: { include: { staffMember: true }, where: { isActive: true } } } });
  if (!record) return NextResponse.json({ error: 'Job Description not found.' }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const { objectives, ...data } = JobDescriptionSchema.parse(await request.json());
  const record = await prisma.$transaction(async (tx) => {
    await tx.jobDescriptionObjective.deleteMany({ where: { jobDescriptionId: params.id } });
    return tx.jobDescription.update({ where: { id: params.id }, data: { ...data, objectives: { create: objectives.map((objective, index) => ({ ...objective, sortOrder: index + 1 })) } }, include: { department: true, objectives: { orderBy: { sortOrder: 'asc' } } } });
  });
  return NextResponse.json(record);
}
