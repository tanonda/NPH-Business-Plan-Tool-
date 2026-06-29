import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/api-auth-guard';
import { getUserDepartmentIds, userHasGlobalDepartmentAccess } from '@/lib/department-access';

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const departmentIds = userHasGlobalDepartmentAccess(auth.user)
    ? null
    : await getUserDepartmentIds(auth.user.id);

  const departments = await prisma.department.findMany({
    where: {
      isActive: true,
      ...(departmentIds ? { id: { in: departmentIds } } : {})
    }
  });

  const sorted = [...departments].sort((a: any, b: any) => {
    const left = `${a.code || ''} ${a.name || ''}`.trim();
    const right = `${b.code || ''} ${b.name || ''}`.trim();
    return left.localeCompare(right);
  });

  return NextResponse.json(sorted);
}
