import fs from 'node:fs';

const file = 'src/app/api/plans/route.ts';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/api/plans/route.ts');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-department-filter`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("@/lib/department-access")) {
  source = source.replace(
    /import .*?;\n/,
    (match) => `${match}import { getDepartmentScopedPlanWhere } from '@/lib/department-access';\n`
  );
  console.log('Added department filter import.');
}

const getStart = source.search(/export\s+async\s+function\s+GET\s*\(/);
if (getStart === -1) {
  console.error('Could not find GET function in /api/plans route.');
  process.exit(1);
}

const getBlock = source.slice(getStart);
if (!getBlock.includes('getDepartmentScopedPlanWhere')) {
  source = source.replace(
    /(export\s+async\s+function\s+GET\s*\([^)]*\)\s*{[\s\S]*?if\s*\(!auth\.ok\)\s*return\s*auth\.response;\s*)/,
    `$1\n  const departmentWhere = await getDepartmentScopedPlanWhere(auth.user);\n`
  );

  source = source.replace(
    /prisma\.businessPlan\.findMany\s*\(\s*{/,
    'prisma.businessPlan.findMany({\n    where: departmentWhere,'
  );

  console.log('Patched /api/plans GET with department filter.');
} else {
  console.log('/api/plans already has department filter.');
}

fs.writeFileSync(file, source);
