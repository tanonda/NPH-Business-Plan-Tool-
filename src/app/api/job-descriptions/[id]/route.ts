import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { JobDescriptionSchema } from '@/lib/schemas';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const record = await prisma.jobDescription.findUnique({ where: { id: params.id }, include: { department: true, objectives: { orderBy: { sortOrder: 'asc' } }, versions: { orderBy: { version: 'desc' } }, assignments: { include: { staffMember: true }, where: { isActive: true } } } });
  if (!record) return NextResponse.json({ error: 'Job Description not found.' }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);
  if (!auth.ok) return auth.response;
  const { objectives, ...data } = JobDescriptionSchema.parse(await request.json());
  const current = await prisma.jobDescription.findUnique({ where: { id: params.id }, include: { objectives: { orderBy: { sortOrder: 'asc' } } } });
  if (!current) return NextResponse.json({ error: 'Job Description not found.' }, { status: 404 });
  if (current.status === 'APPROVED') {
    const nextVersion = current.version + 1;
    const record = await prisma.$transaction(async (tx) => {
      await tx.jobDescriptionVersion.create({ data: { jobDescriptionId: current.id, version: current.version, departmentId: current.departmentId, code: current.code, title: current.title, purpose: current.purpose, reportsTo: current.reportsTo, supervises: current.supervises, contacts: current.contacts, specialConditions: current.specialConditions, selectionCriteria: current.selectionCriteria, sourceReference: current.sourceReference, status: current.status, effectiveFrom: current.effectiveFrom, effectiveTo: new Date(), objectives: current.objectives } });
      await tx.jobDescriptionObjective.deleteMany({ where: { jobDescriptionId: current.id } });
      return tx.jobDescription.update({ where: { id: params.id }, data: { ...data, version: nextVersion, status: 'DRAFT', effectiveFrom: null, effectiveTo: null, objectives: { create: objectives.map((objective, index) => ({ ...objective, sortOrder: index + 1 })) } }, include: { department: true, objectives: { orderBy: { sortOrder: 'asc' } }, versions: { orderBy: { version: 'desc' } } } });
    });
    return NextResponse.json(record);
  }
  const record = await prisma.$transaction(async (tx) => {
    await tx.jobDescriptionObjective.deleteMany({ where: { jobDescriptionId: params.id } });
    return tx.jobDescription.update({ where: { id: params.id }, data: { ...data, objectives: { create: objectives.map((objective, index) => ({ ...objective, sortOrder: index + 1 })) } }, include: { department: true, objectives: { orderBy: { sortOrder: 'asc' } } } });
  });
  return NextResponse.json(record);
}
