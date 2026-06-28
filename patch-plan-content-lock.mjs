import fs from 'node:fs';

const file = 'src/app/api/plans/[id]/route.ts';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/api/plans/[id]/route.ts');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-plan-lock`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("@/lib/plan-locking")) {
  source = source.replace(
    /import .*?;\n/,
    (match) => `${match}import { canEditPlanContent, getPlanLockMessage } from '@/lib/plan-locking';\n`
  );
  console.log('Added plan locking import.');
}

if (!source.includes('getPlanLockMessage(existingPlan.status, auth.user.role)')) {
  const putMatch = source.match(/export\s+async\s+function\s+PUT\s*\([\s\S]*?\)\s*{/);

  if (!putMatch) {
    console.error('Could not find PUT function in src/app/api/plans/[id]/route.ts');
    process.exit(1);
  }

  const insertAfter = `if (!departmentAccess.ok) return departmentAccess.response;`;

  source = source.replace(
    insertAfter,
    `${insertAfter}

  const existingPlan = await prisma.businessPlan.findUnique({
    where: { id: params.id },
    select: { id: true, status: true }
  });

  if (!existingPlan) {
    return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
  }

  if (!canEditPlanContent(existingPlan.status, auth.user.role)) {
    return NextResponse.json(
      {
        error: getPlanLockMessage(existingPlan.status, auth.user.role),
        status: existingPlan.status,
        role: auth.user.role
      },
      { status: 423 }
    );
  }`
  );

  console.log('Added content lock to PUT route.');
} else {
  console.log('PUT route already has content lock.');
}

fs.writeFileSync(file, source);
