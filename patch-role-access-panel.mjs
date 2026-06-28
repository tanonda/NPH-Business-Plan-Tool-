import fs from 'node:fs';

const file = 'src/app/page.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/page.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-role-access-panel`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("@/components/RoleAccessTestPanel")) {
  source = source.replace(
    "import { UserManagementPanel } from '@/components/UserManagementPanel';",
    "import { UserManagementPanel } from '@/components/UserManagementPanel';\nimport { RoleAccessTestPanel } from '@/components/RoleAccessTestPanel';"
  );
  console.log('Added RoleAccessTestPanel import.');
}

if (!source.includes('<RoleAccessTestPanel />')) {
  source = source.replace(
    '<UserManagementPanel />',
    '<UserManagementPanel />\n        <RoleAccessTestPanel />'
  );
  console.log('Added RoleAccessTestPanel to dashboard.');
}

fs.writeFileSync(file, source);
console.log('Done. ADMIN Role & Access Test Panel installed.');
