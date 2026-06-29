function text(value: unknown) {
  return String(value ?? '').trim();
}

function number(value: unknown) {
  if (typeof value === 'object' && value && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    return Number((value as any).toNumber() || 0);
  }
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function activityKey(activity: any, index: number) {
  return text(activity.activityNumber) || text(activity.id) || `row-${index + 1}`;
}

type CompactActivity = {
  activityNumber: string;
  activityDescription: string;
  expenditureDescription: string;
  responsibility: string;
  estimatedCost: number;
  recurrentBudget: number;
  developmentPartners: number;
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
};

function compactActivity(activity: any): CompactActivity {
  return {
    activityNumber: text(activity.activityNumber),
    activityDescription: text(activity.activityDescription),
    expenditureDescription: text(activity.expenditureDescription),
    responsibility: text(activity.responsibility),
    estimatedCost: number(activity.estimatedCost),
    recurrentBudget: number(activity.recurrentBudget),
    developmentPartners: number(activity.developmentPartners),
    q1: Boolean(activity.q1),
    q2: Boolean(activity.q2),
    q3: Boolean(activity.q3),
    q4: Boolean(activity.q4)
  };
}

export function extractPlanFromSnapshot(snapshot: any) {
  const data = snapshot?.snapshotData || snapshot?.snapshot || snapshot;
  return data?.plan || data?.businessPlan || data || null;
}

export function comparePlanToSnapshot(currentPlan: any, snapshotRecord: any) {
  const snapshotPlan = extractPlanFromSnapshot(snapshotRecord);
  if (!snapshotPlan) return { hasSnapshot: false, changes: [], summary: { added: 0, removed: 0, changed: 0 } };

  const changes: any[] = [];
  const planFields = ['title', 'facility', 'costCenter', 'costCenterName', 'year', 'ceilingAmount', 'ceilingJustification', 'status'];

  for (const field of planFields) {
    const before = field === 'ceilingAmount' ? number(snapshotPlan[field]) : text(snapshotPlan[field]);
    const after = field === 'ceilingAmount' ? number(currentPlan[field]) : text(currentPlan[field]);
    if (before !== after) changes.push({ type: 'PLAN_FIELD_CHANGED', field, before, after });
  }

  const oldActivities = Array.isArray(snapshotPlan.activities) ? snapshotPlan.activities : [];
  const newActivities = Array.isArray(currentPlan.activities) ? currentPlan.activities : [];
  const oldMap = new Map<string, CompactActivity>(oldActivities.map((activity: any, index: number) => [activityKey(activity, index), compactActivity(activity)]));
  const newMap = new Map<string, CompactActivity>(newActivities.map((activity: any, index: number) => [activityKey(activity, index), compactActivity(activity)]));

  for (const [key, after] of newMap.entries()) {
    const before = oldMap.get(key);
    if (!before) {
      changes.push({ type: 'ACTIVITY_ADDED', activityNumber: key, after });
      continue;
    }

    (Object.keys(after) as Array<keyof CompactActivity>).forEach((field) => {
      if (before[field] !== after[field]) {
        changes.push({ type: 'ACTIVITY_FIELD_CHANGED', activityNumber: key, field, before: before[field], after: after[field] });
      }
    });
  }

  for (const [key, before] of oldMap.entries()) {
    if (!newMap.has(key)) changes.push({ type: 'ACTIVITY_REMOVED', activityNumber: key, before });
  }

  return {
    hasSnapshot: true,
    snapshot: {
      id: snapshotRecord.id,
      status: snapshotRecord.status,
      snapshotType: snapshotRecord.snapshotType,
      createdAt: snapshotRecord.createdAt,
      createdByName: snapshotRecord.createdByName
    },
    changes,
    summary: {
      added: changes.filter((change) => change.type === 'ACTIVITY_ADDED').length,
      removed: changes.filter((change) => change.type === 'ACTIVITY_REMOVED').length,
      changed: changes.filter((change) => change.type === 'PLAN_FIELD_CHANGED' || change.type === 'ACTIVITY_FIELD_CHANGED').length
    }
  };
}
