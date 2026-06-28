import fs from 'node:fs';
import path from 'node:path';

const files = [
  'src/app/api/plans/[id]/route.ts',
  'src/app/api/plans/[id]/status/route.ts',
  'src/app/api/plans/[id]/comments/route.ts',
  'src/app/api/plans/[id]/audit/route.ts',
  'src/app/api/plans/[id]/export/route.ts',
  'src/app/api/plans/[id]/executive-report/route.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.warn(`Skipped missing file: ${file}`);
    continue;
  }

  let source = fs.readFileSync(file, 'utf8');

  const backup = `${file}.bak-department-guard`;
  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, source);
  }

  if (!source.includes("@/lib/department-access")) {
    source = source.replace(
      /import .*?;\n/,
      (match) => `${match}import { requirePlanDepartmentAccess } from '@/lib/department-access';\n`
    );
  }

  if (source.includes('requirePlanDepartmentAccess(auth.user, params.id)')) {
    console.log(`Already guarded: ${file}`);
    fs.writeFileSync(file, source);
    continue;
  }

  source = source.replaceAll(
    'if (!auth.ok) return auth.response;',
    `if (!auth.ok) return auth.response;

  const departmentAccess = await requirePlanDepartmentAccess(auth.user, params.id);
  if (!departmentAccess.ok) return departmentAccess.response;`
  );

  fs.writeFileSync(file, source);
  console.log(`Added department guard: ${file}`);
}
