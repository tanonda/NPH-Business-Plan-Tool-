import fs from 'node:fs';

const file = 'src/app/page.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/page.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-approval-snapshots-panel`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("@/components/ApprovalSnapshotsPanel")) {
  source = source.replace(
    "import { ApprovalCommentsPanel } from '@/components/ApprovalCommentsPanel';",
    "import { ApprovalCommentsPanel } from '@/components/ApprovalCommentsPanel';\nimport { ApprovalSnapshotsPanel } from '@/components/ApprovalSnapshotsPanel';"
  );
  console.log('Added ApprovalSnapshotsPanel import.');
}

if (!source.includes('<ApprovalSnapshotsPanel')) {
  source = source.replace(
    `{selectedPlanId && (
          <ApprovalCommentsPanel`,
    `{selectedPlanId && (
          <ApprovalSnapshotsPanel
            planId={selectedPlanId}
            planTitle={selectedPlan?.title || title}
          />
        )}

        {selectedPlanId && (
          <ApprovalCommentsPanel`
  );
  console.log('Added ApprovalSnapshotsPanel above comments.');
}

fs.writeFileSync(file, source);
console.log('Done. Approval Snapshots dashboard panel installed.');
