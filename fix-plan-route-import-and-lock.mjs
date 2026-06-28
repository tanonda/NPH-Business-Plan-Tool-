import fs from 'node:fs';

const file = 'src/app/api/plans/[id]/route.ts';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/api/plans/[id]/route.ts');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-role-repair`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("from 'next/server'")) {
  source = `import { NextRequest, NextResponse } from 'next/server';\n${source}`;
} else if (source.includes("import { NextRequest } from 'next/server';")) {
  source = source.replace(
    "import { NextRequest } from 'next/server';",
    "import { NextRequest, NextResponse } from 'next/server';"
  );
} else if (!source.includes('NextResponse')) {
  source = source.replace(
    /import\s*{([^}]+)}\s*from\s*'next\/server';/,
    (match, imports) => `import { ${imports.trim()}, NextResponse } from 'next/server';`
  );
}

// Remove accidentally inserted plan-lock block from GET by only keeping it inside PUT.
// This is conservative: it removes duplicate content-lock blocks before PUT if they exist.
const putIndex = source.indexOf('export async function PUT');
if (putIndex > -1) {
  const beforePut = source.slice(0, putIndex);
  const afterPut = source.slice(putIndex);

  const cleanedBeforePut = beforePut.replace(
    /\n\s*const existingPlan = await prisma\.businessPlan\.findUnique\({[\s\S]*?getPlanLockMessage\(existingPlan\.status, auth\.user\.role\)[\s\S]*?\{ status: 423 \}\s*\);\s*\n\s*}\s*/g,
    '\n'
  );

  source = cleanedBeforePut + afterPut;
}

fs.writeFileSync(file, source);
console.log('Fixed NextResponse import and removed accidental GET content-lock block.');
