import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { requirePlanDepartmentAccess } from '@/lib/department-access';
import { buildWorkbookBuffer } from '@/lib/excel-export';
import { buildPlanPdfBuffer } from '@/lib/pdf-export';
import { extractPlanFromSnapshot } from '@/lib/snapshot-compare';

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, '-');
}

export async function GET(request: Request, { params }: { params: { id: string; snapshotId: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const snapshot = await prisma.approvalSnapshot.findFirst({
    where: { id: params.snapshotId, businessPlanId: params.id }
  });

  if (!snapshot) return NextResponse.json({ error: 'Snapshot not found.' }, { status: 404 });

  const plan = extractPlanFromSnapshot(snapshot as any);
  if (!plan) return NextResponse.json({ error: 'Snapshot does not contain a usable plan export.' }, { status: 400 });

  const url = new URL(request.url);
  const format = String(url.searchParams.get('format') || 'xlsx').toLowerCase();
  const baseName = safeFileName(`${snapshot.snapshotType}-${snapshot.status}-${snapshot.createdAt.toISOString().slice(0, 10)}`);

  if (format === 'pdf') {
    const fileName = `${baseName}.pdf`;
    const buffer = buildPlanPdfBuffer(plan, `${snapshot.snapshotType} PDF Frozen Export`);
    await prisma.exportHistory.create({ data: { userId: auth.user.id, businessPlanId: params.id, snapshotId: snapshot.id, exportType: 'SNAPSHOT', format: 'PDF', fileName } }).catch(() => null);
    await prisma.auditLog.create({ data: { businessPlanId: params.id, userId: auth.user.id, action: 'SNAPSHOT_EXPORTED', details: `Exported snapshot PDF ${fileName}.`, metadata: { snapshotId: snapshot.id, format: 'PDF' } } }).catch(() => null);
    return new Response(buffer as unknown as BodyInit, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"` } });
  }

  const fileName = `${baseName}.xlsx`;
  const buffer = await buildWorkbookBuffer(plan);
  await prisma.exportHistory.create({ data: { userId: auth.user.id, businessPlanId: params.id, snapshotId: snapshot.id, exportType: 'SNAPSHOT', format: 'XLSX', fileName } }).catch(() => null);
  await prisma.auditLog.create({ data: { businessPlanId: params.id, userId: auth.user.id, action: 'SNAPSHOT_EXPORTED', details: `Exported snapshot Excel ${fileName}.`, metadata: { snapshotId: snapshot.id, format: 'XLSX' } } }).catch(() => null);

  return new Response(buffer as unknown as BodyInit, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${fileName}"` } });
}
