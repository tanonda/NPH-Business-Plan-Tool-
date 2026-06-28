import fs from 'node:fs';

const file = 'src/app/page.tsx';

if (!fs.existsSync(file)) {
  console.error('Missing src/app/page.tsx');
  process.exit(1);
}

let source = fs.readFileSync(file, 'utf8');

const backup = `${file}.bak-role-ui`;
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

if (!source.includes("@/components/useCurrentUser")) {
  source = source.replace(
    "import { UserSessionBar } from '@/components/UserSessionBar';",
    "import { UserSessionBar } from '@/components/UserSessionBar';\nimport { useCurrentUser } from '@/components/useCurrentUser';"
  );
  console.log('Patched: useCurrentUser import');
}

replaceOnce(
  "  const [suggestingIndex, setSuggestingIndex] = useState<number | null>(null);",
  `  const [suggestingIndex, setSuggestingIndex] = useState<number | null>(null);

  const { user } = useCurrentUser();
  const role = user?.role || 'VIEWER';

  const canEditPlan = role === 'ADMIN' || role === 'PLANNER';
  const canDeletePlan = role === 'ADMIN';
  const canImport = role === 'ADMIN' || role === 'PLANNER';
  const canChangeStatus = role === 'ADMIN' || role === 'APPROVER';
  const canSuggestDescriptions =
    role === 'ADMIN' || role === 'PLANNER' || role === 'APPROVER' || role === 'REVIEWER';`,
  'role permission constants'
);

replaceOnce(
  "    const cleanActivities = activities.map((activity, index) => ({ ...activity, sortOrder: index + 1 }));",
  `    if (!canEditPlan) {
      setMessage('Your role does not allow saving or editing business plans.');
      return;
    }

    const cleanActivities = activities.map((activity, index) => ({ ...activity, sortOrder: index + 1 }));`,
  'savePlan permission guard'
);

replaceOnce(
  "    if (!selectedPlanId) {\n      setMessage('Save the plan first before changing approval status.');\n      return;\n    }",
  `    if (!canChangeStatus) {
      setMessage('Your role does not allow changing approval status.');
      return;
    }

    if (!selectedPlanId) {
      setMessage('Save the plan first before changing approval status.');
      return;
    }`,
  'changeStatus permission guard'
);

replaceOnce(
  "    if (!file) return;\n    setImporting(true);",
  `    if (!file) return;

    if (!canImport) {
      setMessage('Your role does not allow importing Excel workbooks.');
      event.target.value = '';
      return;
    }

    setImporting(true);`,
  'importExcel permission guard'
);

replaceOnce(
  "    if (!selectedPlanId) return;\n    if (!confirm('Delete this saved business plan?')) return;",
  `    if (!canDeletePlan) {
      setMessage('Only an ADMIN can delete saved business plans.');
      return;
    }

    if (!selectedPlanId) return;
    if (!confirm('Delete this saved business plan?')) return;`,
  'delete permission guard'
);

replaceOnce(
  "{(['DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED'] as Status[]).map((s) => (\n            <button type=\"button\" key={s} className={status === s ? '' : 'secondary'} onClick={() => changeStatus(s)}>{s}</button>\n          ))}",
  "{canChangeStatus && (['DRAFT', 'REVIEW', 'APPROVED', 'SUBMITTED'] as Status[]).map((s) => (\n            <button type=\"button\" key={s} className={status === s ? '' : 'secondary'} onClick={() => changeStatus(s)}>{s}</button>\n          ))}",
  'status buttons hidden by role'
);

replaceOnce(
  "{selectedPlanId && <button type=\"button\" className=\"danger\" onClick={deleteSelectedPlan}>Delete</button>}",
  "{canDeletePlan && selectedPlanId && <button type=\"button\" className=\"danger\" onClick={deleteSelectedPlan}>Delete</button>}",
  'delete button hidden by role'
);

replaceOnce(
  "<label>Import existing .xlsx<input type=\"file\" accept=\".xlsx\" onChange={importExcel} disabled={importing} /></label>",
  "{canImport && <label>Import existing .xlsx<input type=\"file\" accept=\".xlsx\" onChange={importExcel} disabled={importing} /></label>}",
  'import field hidden by role'
);

replaceOnce(
  "<button type=\"button\" className=\"secondary\" onClick={addActivity}>Add activity</button>",
  "{canEditPlan && <button type=\"button\" className=\"secondary\" onClick={addActivity}>Add activity</button>}",
  'add activity hidden by role'
);

replaceOnce(
  "disabled={suggestingIndex === index || !activity.activityDescription.trim()}",
  "disabled={suggestingIndex === index || !activity.activityDescription.trim() || !canSuggestDescriptions}",
  'suggest description disabled by role'
);

replaceOnce(
  "{activities.length > 1 && <button type=\"button\" className=\"danger\" onClick={() => removeActivity(index)}>Remove</button>}",
  "{canEditPlan && activities.length > 1 && <button type=\"button\" className=\"danger\" onClick={() => removeActivity(index)}>Remove</button>}",
  'remove activity hidden by role'
);

replaceOnce(
  "<button type=\"submit\">{selectedPlanId ? 'Update business plan' : 'Save business plan'}</button>",
  "{canEditPlan && <button type=\"submit\">{selectedPlanId ? 'Update business plan' : 'Save business plan'}</button>}",
  'save button hidden by role'
);

replaceOnce(
  "<td className=\"actions\"><button type=\"button\" className=\"secondary\" onClick={() => loadPlan(plan.id)}>Edit</button><a href={`/api/plans/${plan.id}/export`}>Export</a></td>",
  "<td className=\"actions\"><button type=\"button\" className=\"secondary\" onClick={() => loadPlan(plan.id)}>{canEditPlan ? 'Edit' : 'View'}</button><a href={`/api/plans/${plan.id}/export`}>Export</a></td>",
  'saved plan edit/view label'
);

replaceOnce(
  "<p className=\"footer-note\">Auth foundation is intentionally simple for the MVP: actions are attributed to the configured default admin user. Full login/roles can be added next.</p>",
  "<p className=\"footer-note\">Access is controlled by login sessions and role-based permissions.</p>",
  'old MVP auth footer removed'
);

fs.writeFileSync(file, source);
console.log('Done. Role-based UI controls patched.');
