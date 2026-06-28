import fs from 'node:fs';

const file = 'src/app/page.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/page.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-plan-lock-ui`;
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, source);
}

function replaceOnce(find, replace, label) {
  if (!source.includes(find)) {
    console.warn(`Skipped: ${label}`);
    return;
  }

  source = source.replace(find, replace);
  console.log(`Patched: ${label}`);
}

// Replace old canEditPlan rule with status-aware rule.
source = source.replace(
  `  const canEditPlan = role === 'ADMIN' || role === 'PLANNER';`,
  `  const canEditPlan =
    role === 'ADMIN' || (role === 'PLANNER' && status === 'DRAFT');`
);

if (!source.includes('const planLockedForUser')) {
  replaceOnce(
    `  const canImport = role === 'ADMIN' || role === 'PLANNER';`,
    `  const canImport = role === 'ADMIN' || role === 'PLANNER';

  const planLockedForUser = Boolean(selectedPlanId) && !canEditPlan;

  const planLockMessage =
    role === 'ADMIN'
      ? ''
      : status === 'REVIEW'
        ? 'This plan is under review and locked from normal editing.'
        : status === 'APPROVED'
          ? 'This plan is approved and locked from normal editing.'
          : status === 'SUBMITTED'
            ? 'This plan is submitted and fully locked.'
            : role !== 'PLANNER'
              ? 'Your role can view this plan but cannot edit plan content.'
              : '';`,
    'plan lock constants'
  );
}

if (!source.includes('{planLockedForUser && planLockMessage')) {
  replaceOnce(
    `<p className="muted">Status: {status}</p>`,
    `<p className="muted">Status: {status}</p>
          {planLockedForUser && planLockMessage && (
            <p className="notice">
              <strong>Locked:</strong> {planLockMessage}
            </p>
          )}`,
    'plan lock notice'
  );
}

// Disable common form fields when locked.
// These replacements are intentionally broad but safe for existing inputs/selects/textareas.
source = source.replaceAll(
  `onChange={(event) => setTitle(event.target.value)}`,
  `onChange={(event) => setTitle(event.target.value)} disabled={!canEditPlan}`
);

source = source.replaceAll(
  `onChange={(event) => setFacility(event.target.value)}`,
  `onChange={(event) => setFacility(event.target.value)} disabled={!canEditPlan}`
);

source = source.replaceAll(
  `onChange={(event) => setYear(Number(event.target.value))}`,
  `onChange={(event) => setYear(Number(event.target.value))} disabled={!canEditPlan}`
);

source = source.replaceAll(
  `onChange={(event) => setCostCenter(event.target.value)}`,
  `onChange={(event) => setCostCenter(event.target.value)} disabled={!canEditPlan}`
);

source = source.replaceAll(
  `onChange={(event) => setCostCenterName(event.target.value)}`,
  `onChange={(event) => setCostCenterName(event.target.value)} disabled={!canEditPlan}`
);

source = source.replaceAll(
  `onChange={(event) => setCeilingAmount(Number(event.target.value))}`,
  `onChange={(event) => setCeilingAmount(Number(event.target.value))} disabled={!canEditPlan}`
);

fs.writeFileSync(file, source);
console.log('Done. Plan lock UI patched.');
