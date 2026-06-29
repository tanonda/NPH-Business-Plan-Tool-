import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiRole, requireApiUser } from '@/lib/api-auth-guard';
import { DEFAULT_REFERENCE_DATA } from '@/lib/reference-data';

export const dynamic = 'force-dynamic';

type ReferenceInput = {
  list?: string;
  code?: string;
  label?: string;
  description?: string;
  category?: string;
  name?: string;
  display?: string;
  metadata?: Record<string, unknown>;
};

const staticMap: Record<string, any[]> = {
  departments: [...DEFAULT_REFERENCE_DATA.departments],
  'job-codes': [...DEFAULT_REFERENCE_DATA.jobCodes],
  'cost-centers': [...DEFAULT_REFERENCE_DATA.costCenters],
  'activity-categories': DEFAULT_REFERENCE_DATA.activityCategories.map((label) => ({ code: label, label })),
  'funding-sources': DEFAULT_REFERENCE_DATA.fundingSources.map((label) => ({ code: label, label })),
  'budget-categories': DEFAULT_REFERENCE_DATA.budgetCategories.map((label) => ({ code: label, label })),
  'account-codes': [...DEFAULT_REFERENCE_DATA.accountCodes],
  'nsdp-targets': DEFAULT_REFERENCE_DATA.nsdpTargets.map((label) => ({ code: label, label }))
};

const REFERENCE_LIST_NAMES: Record<string, string> = {
  departments: 'Departments',
  'job-codes': 'Job Codes',
  'cost-centers': 'Cost Centers',
  'activity-categories': 'Activity Categorisation',
  'funding-sources': 'Funding Sources',
  'budget-categories': 'Budget Categories',
  'account-codes': 'Account Codes',
  'nsdp-targets': 'NSDP Targets'
};

function displayFor(item: any) {
  return item.display || item.jobCode || item.label || item.name || item.description || item.code || '';
}

function mergeByDisplay(primary: any[], fallback: any[]) {
  const seen = new Set<string>();
  const merged: any[] = [];
  for (const item of [...primary, ...fallback]) {
    const key = String(displayFor(item)).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

async function getReferenceItems(list: string) {
  const referenceList = await prisma.referenceList.findUnique({
    where: { key: list },
    include: { items: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } }
  }).catch(() => null);

  const dbItems = referenceList?.items?.map((item: any) => ({
    id: item.id,
    code: item.code,
    label: item.label,
    description: item.description,
    category: item.category,
    display: item.metadata && typeof item.metadata === 'object' && 'display' in item.metadata ? (item.metadata as any).display : undefined,
    metadata: item.metadata
  })) || [];

  return mergeByDisplay(dbItems, staticMap[list] || []);
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const list = searchParams.get('list') || 'all';
  const category = searchParams.get('category') || '';

  try {
    if (list === 'all') {
      const all: Record<string, any[]> = {};
      for (const key of Object.keys(staticMap)) all[key] = await getReferenceItems(key);
      return NextResponse.json({ list, items: all, source: 'db-with-workbook-fallback' });
    }

    if (list === 'account-codes') {
      const items = await getReferenceItems(list);
      const filtered = category ? items.filter((item: any) => item.category === category) : items;
      return NextResponse.json({ list, items: filtered, source: 'db-with-workbook-fallback' });
    }

    if (list in staticMap) {
      return NextResponse.json({ list, items: await getReferenceItems(list), source: 'db-with-workbook-fallback' });
    }
  } catch (error) {
    console.warn('Reference DB lookup failed; using workbook fallback.', error);
  }

  const items = list === 'all' ? staticMap : (staticMap[list] || []);
  const filtered = list === 'account-codes' && category
    ? (items as any[]).filter((item) => item.category === category)
    : items;

  return NextResponse.json({ list, items: filtered, source: 'workbook-fallback' });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER', 'ACCOUNTING', 'FINANCE', 'BUDGET_OFFICER', 'DONOR_MANAGER']);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as ReferenceInput;
  const list = String(body.list || '').trim();
  if (!list || !(list in REFERENCE_LIST_NAMES)) {
    return NextResponse.json({ error: 'Unknown reference list.' }, { status: 400 });
  }

  const code = String(body.code || '').trim();
  const label = String(body.label || body.name || body.description || body.display || code || '').trim();
  const description = String(body.description || label).trim();
  const category = String(body.category || '').trim();
  const display = String(body.display || (code && label ? `${code} - ${label}` : label || code)).trim();

  if (!display && !code && !label) {
    return NextResponse.json({ error: 'Provide at least a code, label, or display value.' }, { status: 400 });
  }

  const referenceList = await prisma.referenceList.upsert({
    where: { key: list },
    update: { name: REFERENCE_LIST_NAMES[list] },
    create: { key: list, name: REFERENCE_LIST_NAMES[list] }
  });

  const existing = await prisma.referenceItem.findFirst({
    where: { referenceListId: referenceList.id, code: code || display, label }
  });

  const item = existing
    ? await prisma.referenceItem.update({
        where: { id: existing.id },
        data: { description, category, isActive: true, metadata: { ...(body.metadata || {}), display } }
      })
    : await prisma.referenceItem.create({
        data: {
          referenceListId: referenceList.id,
          code: code || display,
          label: label || display,
          description,
          category,
          sortOrder: 9999,
          metadata: { ...(body.metadata || {}), display }
        }
      });

  if (list === 'account-codes' && code) {
    await prisma.accountCode.upsert({
      where: { code },
      update: { description: label || description, budgetCategory: category || 'Other Codes Not Listed', isActive: true },
      create: { code, description: label || description, budgetCategory: category || 'Other Codes Not Listed', isActive: true }
    }).catch(() => null);
  }

  if (list === 'cost-centers' && code) {
    await prisma.costCenter.upsert({
      where: { code },
      update: { name: label || description || display, isActive: true },
      create: { code, name: label || description || display, facility: 'Vila Central Hospital', isActive: true }
    }).catch(() => null);
  }

  await prisma.auditLog.create({
    data: {
      userId: auth.user.id,
      action: 'REFERENCE_ITEM_CREATED',
      details: `Created/updated ${display} in ${list}`,
      metadata: { list, code, label, description, category, display }
    }
  }).catch(() => null);

  return NextResponse.json({ ok: true, item: { ...item, display } }, { status: existing ? 200 : 201 });
}
