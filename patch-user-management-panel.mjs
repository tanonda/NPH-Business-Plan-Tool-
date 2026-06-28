import fs from 'node:fs';

const file = 'src/app/page.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/page.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-user-management`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("@/components/UserManagementPanel")) {
  source = source.replace(
    "import { UserSessionBar } from '@/components/UserSessionBar';",
    "import { UserSessionBar } from '@/components/UserSessionBar';\nimport { UserManagementPanel } from '@/components/UserManagementPanel';"
  );
  console.log('Added UserManagementPanel import.');
}

if (!source.includes('<UserManagementPanel />')) {
  source = source.replace(
    "<UserSessionBar />",
    "<UserSessionBar />\n        <UserManagementPanel />"
  );
  console.log('Added UserManagementPanel to dashboard.');
}

fs.writeFileSync(file, source);
console.log('Done. ADMIN-only user management panel installed.');
