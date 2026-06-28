import fs from 'node:fs';

const file = 'src/app/api/plans/[id]/status/route.ts';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/api/plans/[id]/status/route.ts');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-approval-snapshots`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

if (!source.includes("@/lib/approval-snapshots")) {
  source = source.replace(
    /import .*?;\n/,
    (match) => `${match}import { createApprovalSnapshot } from '@/lib/approval-snapshots';\n`
  );
  console.log('Added snapshot import.');
}

if (!source.includes('createApprovalSnapshot(params.id, requestedStatus')) {
  source = source.replace(
    `await prisma.auditLog.create({`,
    `if (requestedStatus === 'REVIEW' || requestedStatus === 'APPROVED' || requestedStatus === 'SUBMITTED') {
      await createApprovalSnapshot(params.id, requestedStatus, {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email
      }).catch((snapshotError) => {
        console.error('Approval snapshot creation failed', snapshotError);
      });
    }

    await prisma.auditLog.create({`
  );
  console.log('Added automatic snapshot creation.');
}

fs.writeFileSync(file, source);
console.log('Done. Status route now creates approval snapshots.');
