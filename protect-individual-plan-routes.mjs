import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const routes = [
  {
    file: 'src/app/api/plans/[id]/route.ts',
    guards: {
      GET: "const auth = await requireApiUser();\n  if (!auth.ok) return auth.response;",
      PUT: "const auth = await requireApiRole(['ADMIN', 'PLANNER']);\n  if (!auth.ok) return auth.response;",
      DELETE: "const auth = await requireApiRole(['ADMIN']);\n  if (!auth.ok) return auth.response;"
    }
  },
  {
    file: 'src/app/api/plans/[id]/status/route.ts',
    guards: {
      GET: "const auth = await requireApiUser();\n  if (!auth.ok) return auth.response;",
      PATCH: "const auth = await requireApiRole(['ADMIN', 'APPROVER']);\n  if (!auth.ok) return auth.response;"
    }
  },
  {
    file: 'src/app/api/plans/[id]/comments/route.ts',
    guards: {
      GET: "const auth = await requireApiUser();\n  if (!auth.ok) return auth.response;",
      POST: "const auth = await requireApiRole(['ADMIN', 'PLANNER', 'APPROVER', 'REVIEWER']);\n  if (!auth.ok) return auth.response;"
    }
  },
  {
    file: 'src/app/api/plans/[id]/audit/route.ts',
    guards: {
      GET: "const auth = await requireApiUser();\n  if (!auth.ok) return auth.response;"
    }
  },
  {
    file: 'src/app/api/plans/[id]/export/route.ts',
    guards: {
      GET: "const auth = await requireApiUser();\n  if (!auth.ok) return auth.response;"
    }
  },
  {
    file: 'src/app/api/plans/[id]/executive-report/route.ts',
    guards: {
      GET: "const auth = await requireApiUser();\n  if (!auth.ok) return auth.response;"
    }
  }
];

function ensureImport(source) {
  if (source.includes("@/lib/api-auth-guard")) return source;

  const importLine = "import { requireApiUser, requireApiRole } from '@/lib/api-auth-guard';\n";

  if (source.startsWith('import ')) {
    const lines = source.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImportIndex = i;
    }

    lines.splice(lastImportIndex + 1, 0, importLine.trimEnd());
    return lines.join('\n');
  }

  return importLine + source;
}

function patchFunction(source, method, guard) {
  const exportRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*{`);

  if (!exportRegex.test(source)) return source;

  const alreadyGuarded =
    source.includes(`function ${method}`) &&
    source.includes('requireApiUser') &&
    source.includes('if (!auth.ok) return auth.response');

  const methodStart = source.search(exportRegex);
  const nextExport = source.slice(methodStart + 1).search(/export\s+async\s+function\s+/);
  const methodBlock =
    nextExport === -1
      ? source.slice(methodStart)
      : source.slice(methodStart, methodStart + 1 + nextExport);

  if (methodBlock.includes('if (!auth.ok) return auth.response')) return source;

  return source.replace(exportRegex, (match) => `${match}\n  ${guard}\n`);
}

for (const route of routes) {
  const fullPath = path.join(root, route.file);

  if (!fs.existsSync(fullPath)) {
    console.warn(`Skipped missing file: ${route.file}`);
    continue;
  }

  let source = fs.readFileSync(fullPath, 'utf8');

  const backupPath = `${fullPath}.bak-auth`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, source);
  }

  source = ensureImport(source);

  for (const [method, guard] of Object.entries(route.guards)) {
    source = patchFunction(source, method, guard);
  }

  fs.writeFileSync(fullPath, source);
  console.log(`Protected: ${route.file}`);
}

console.log('Done. Individual plan routes are now protected.');
