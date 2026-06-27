import { prisma } from '@/lib/prisma';
import { buildWorkbookBuffer } from '@/lib/excel-export';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: params.id },
    include: { activities: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!plan) return Response.json({ error: 'Business plan not found' }, { status: 404 });

  const buffer = await buildWorkbookBuffer(plan as any);
  const fileName = `${plan.costCenter}-${plan.year}-business-plan.xlsx`.replace(/[^a-zA-Z0-9_.-]+/g, '-');

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  });
}
