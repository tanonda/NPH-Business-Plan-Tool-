import { prisma } from '@/lib/prisma';
import { requirePlanDepartmentAccess } from '@/lib/department-access';
import { buildWorkbookBuffer } from '@/lib/excel-export';
import { buildPlanPdfBuffer } from '@/lib/pdf-export';
import { requireApiUser } from '@/lib/api-auth-guard';

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, '-');
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;

  const url = new URL(request.url);
  const format = String(url.searchParams.get('format') || 'xlsx').toLowerCase();

  const plan = await prisma.businessPlan.findUnique({
    where: { id: params.id },
    include: { department: true, activities: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!plan) return Response.json({ error: 'Business plan not found' }, { status: 404 });

  if (format === 'pdf') {
    const buffer = buildPlanPdfBuffer(plan as any, 'Business Plan PDF Export');
    const fileName = safeFileName(`${plan.costCenter}-${plan.year}-business-plan.pdf`);
    await prisma.exportHistory.create({
      data: {
        userId: auth.user.id,
        businessPlanId: plan.id,
        exportType: 'PLAN',
        format: 'PDF',
        fileName,
        metadata: { status: plan.status }
      }
    }).catch(() => null);
    await prisma.auditLog.create({ data: { businessPlanId: plan.id, userId: auth.user.id, action: 'EXCEL_EXPORTED', details: `Exported PDF ${fileName}.`, metadata: { format: 'PDF' } } }).catch(() => null);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  }

  const buffer = await buildWorkbookBuffer(plan as any);
  const fileName = safeFileName(`${plan.costCenter}-${plan.year}-business-plan.xlsx`);

  await prisma.exportHistory.create({
    data: {
      userId: auth.user.id,
      businessPlanId: plan.id,
      exportType: 'PLAN',
      format: 'XLSX',
      fileName,
      metadata: { status: plan.status }
    }
  }).catch(() => null);
  await prisma.auditLog.create({ data: { businessPlanId: plan.id, userId: auth.user.id, action: 'EXCEL_EXPORTED', details: `Exported Excel ${fileName}.`, metadata: { format: 'XLSX' } } }).catch(() => null);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}
