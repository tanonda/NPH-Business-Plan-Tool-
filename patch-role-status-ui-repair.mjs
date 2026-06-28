import fs from 'node:fs';

const file = 'src/app/page.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/page.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-role-status-repair`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

const startMarker = '  const allowedStatusTransitions = (() => {';
const start = source.indexOf(startMarker);

if (start === -1) {
  console.warn('Could not find existing allowedStatusTransitions block. No UI patch applied.');
  fs.writeFileSync(file, source);
  process.exit(0);
}

const endMarker = '  const canChangeStatus = allowedStatusTransitions.length > 0;';
const end = source.indexOf(endMarker, start);

if (end === -1) {
  console.warn('Could not find canChangeStatus line. No UI patch applied.');
  fs.writeFileSync(file, source);
  process.exit(0);
}

const afterEnd = end + endMarker.length;

const replacement = `  const allowedStatusTransitions = (() => {
    if (role === 'ADMIN') {
      return (['DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED'] as Status[]).filter((item) => item !== status);
    }

    if (role === 'PLANNER' && status === 'DRAFT') {
      return ['REVIEW'] as Status[];
    }

    if (role === 'APPROVER' && status === 'REVIEW') {
      return ['APPROVED'] as Status[];
    }

    if (role === 'APPROVER' && status === 'APPROVED') {
      return ['SUBMITTED'] as Status[];
    }

    return [] as Status[];
  })();

  const canChangeStatus = allowedStatusTransitions.length > 0;`;

source = source.slice(0, start) + replacement + source.slice(afterEnd);

fs.writeFileSync(file, source);
console.log('Repaired role-based status UI transitions.');
