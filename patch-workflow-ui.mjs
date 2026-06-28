import fs from 'node:fs';

const file = 'src/app/page.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/page.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-workflow-ui`;
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

if (!source.includes('const allowedStatusTransitions')) {
  replaceOnce(
    `  const canSuggestDescriptions =
    role === 'ADMIN' || role === 'PLANNER' || role === 'APPROVER' || role === 'REVIEWER';`,
    `  const canSuggestDescriptions =
    role === 'ADMIN' || role === 'PLANNER' || role === 'APPROVER' || role === 'REVIEWER';

  const allowedStatusTransitions = (() => {
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

  const canChangeStatus = allowedStatusTransitions.length > 0;`,
    'allowed status transition constants'
  );
}

// Remove older canChangeStatus declaration if patch created duplicate.
source = source.replace(
  `  const canChangeStatus = role === 'ADMIN' || role === 'APPROVER';
`,
  ''
);

replaceOnce(
  `{canChangeStatus && (['DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED'] as Status[]).map((s) => (
            <button type="button" key={s} className={status === s ? '' : 'secondary'} onClick={() => changeStatus(s)}>{s}</button>
          ))}`,
  `{canChangeStatus && allowedStatusTransitions.map((s) => (
            <button type="button" key={s} className="secondary" onClick={() => changeStatus(s)}>
              {status === 'DRAFT' && s === 'REVIEW' ? 'Submit for Review' : ''}
              {status === 'REVIEW' && s === 'APPROVED' ? 'Approve' : ''}
              {status === 'APPROVED' && s === 'SUBMITTED' ? 'Submit Final' : ''}
              {role === 'ADMIN' ? \`Move to \${s}\` : ''}
            </button>
          ))}`,
  'status buttons limited to valid transitions'
);

if (!source.includes('Approval workflow: DRAFT')) {
  replaceOnce(
    `<p className="muted">Status: {status}</p>`,
    `<p className="muted">Status: {status}</p>
          <p className="muted">Approval workflow: DRAFT → REVIEW → APPROVED → SUBMITTED</p>`,
    'workflow helper text'
  );
}

fs.writeFileSync(file, source);
console.log('Done. Workflow UI patched.');
