import ExcelJS from 'exceljs';
import { ActivitySchema } from '@/lib/schemas';
import { requireApiUser, requireApiRole } from '@/lib/api-auth-guard';

/**
 * Drop-in route: src/app/api/import-excel-mapped/route.ts
 *
 * Purpose:
 * Import business plan activities from non-standard Excel workbooks by accepting
 * a user-supplied column mapping instead of assuming the fixed 61RB-BP layout.
 *
 * Request: multipart/form-data
 * - file: .xlsx workbook
 * - sheetName?: string
 * - headerRow?: number | string, default 1
 * - firstDataRow?: number | string, default headerRow + 1
 * - mapping?: JSON string where keys are ActivityInput fields and values are
 *   column letters, column numbers, or header names.
 * - defaults?: JSON string with optional plan defaults/title/year/facility/etc.
 * - previewOnly?: "true" | "false", default false
 * - maxPreviewRows?: number | string, default 20
 *
 * Example mapping:
 * {
 *   "subProgram": "Sub-Program",
 *   "activityNumber": "Activity #",
 *   "activityDescription": "Activity Description",
 *   "expenditureDescription": "Description of Expenditure",
 *   "jobCode": "Job Code",
 *   "estimatedCost": "Estimated Cost",
 *   "recurrentBudget": "Recurrent Budget",
 *   "developmentPartners": "Development Partners",
 *   "q1": "Q1",
 *   "q2": "Q2",
 *   "q3": "Q3",
 *   "q4": "Q4"
 * }
 */

type ActivityField =
  | 'subProgram'
  | 'corporatePlanKeyActivity'
  | 'outputOrServiceTarget'
  | 'targetForYear'
  | 'responsibility'
  | 'activityNumber'
  | 'activityDescription'
  | 'jobCode'
  | 'expenditureDescription'
  | 'estimatedCost'
  | 'recurrentBudget'
  | 'developmentPartners'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'funding'
  | 'budgetCategory'
  | 'accountCode';

type ColumnRef = string | number | null | undefined;
type Mapping = Partial<Record<ActivityField, ColumnRef>>;

type ImportIssue = {
  row: number;
  severity: 'warning' | 'error';
  message: string;
};

const REQUIRED_FIELDS: ActivityField[] = ['activityDescription', 'expenditureDescription'];

const DEFAULT_MAPPING: Mapping = {
  subProgram: 'A',
  corporatePlanKeyActivity: 'B',
  outputOrServiceTarget: 'C',
  targetForYear: 'D',
  responsibility: 'E',
  activityNumber: 'F',
  activityDescription: 'G',
  jobCode: 'H',
  expenditureDescription: 'I',
  q1: 'J',
  q2: 'K',
  q3: 'L',
  q4: 'M',
  estimatedCost: 'N',
  recurrentBudget: 'O',
  developmentPartners: 'P'
};

const HEADER_ALIASES: Record<ActivityField, string[]> = {
  subProgram: ['sub program', 'sub-program', 'programme', 'program', 'area', 'strategic area'],
  corporatePlanKeyActivity: ['corporate plan key activity', 'corporate activity', 'key activity'],
  outputOrServiceTarget: ['output/service target', 'output or service target', 'output', 'service target'],
  targetForYear: ['target for year', 'annual target', 'target'],
  responsibility: ['responsibility', 'responsible', 'responsible unit', 'owner'],
  activityNumber: ['activity #', 'activity no', 'activity number', 'activity code', 'code'],
  activityDescription: ['activity description', 'activity', 'description', 'planned activity'],
  jobCode: ['job code', 'job', 'cost centre code', 'cost center code'],
  expenditureDescription: ['description of expenditure', 'expenditure description', 'expenditure', 'cost description', 'description for expenditure'],
  estimatedCost: ['estimated cost', 'estimate', 'total estimated cost', 'total cost', 'budget'],
  recurrentBudget: ['recurrent budget', 'recurrent', 'recurrent cost', 'recurrent amount'],
  developmentPartners: ['development partners', 'development partner', 'donor', 'partner funding'],
  q1: ['q1', 'quarter 1', 'jan-mar', 'jan to mar'],
  q2: ['q2', 'quarter 2', 'apr-jun', 'apr to jun'],
  q3: ['q3', 'quarter 3', 'jul-sep', 'jul to sep'],
  q4: ['q4', 'quarter 4', 'oct-dec', 'oct to dec'],
  funding: ['funding', 'funding source', 'source of fund'],
  budgetCategory: ['budget category', 'category', 'account category'],
  accountCode: ['account code', 'account', 'budget code']
};

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in (value as any)) return String((value as any).text || '').trim();
  if (typeof value === 'object' && 'richText' in (value as any)) return ((value as any).richText || []).map((r: any) => r.text).join('').trim();
  if (typeof value === 'object' && 'result' in (value as any)) return String((value as any).result || '').trim();
  if (typeof value === 'object' && 'hyperlink' in (value as any) && 'text' in (value as any)) return String((value as any).text || '').trim();
  return String(value).trim();
}

function money(value: unknown): number {
  const raw = text(value)
    .replace(/,/g, '')
    .replace(/VT/gi, '')
    .replace(/VUV/gi, '')
    .replace(/\s/g, '')
    .replace(/^\((.*)\)$/u, '-$1');
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function booleanMark(value: unknown): boolean {
  const raw = text(value).toLowerCase();
  return ['x', '✓', '✔', 'yes', 'y', 'true', '1', 'selected', 'tick'].includes(raw);
}

function normaliseHeader(value: string): string {
  return value.toLowerCase().replace(/[\s_\-/#()]+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
}

function columnLetterToNumber(letter: string): number | null {
  const cleaned = letter.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(cleaned)) return null;
  let n = 0;
  for (const ch of cleaned) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

function safeJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getNumber(value: FormDataEntryValue | null, fallback: number): number {
  const n = Number(value || fallback);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function buildHeaderIndex(worksheet: ExcelJS.Worksheet, headerRow: number): Map<string, number> {
  const index = new Map<string, number>();
  const row = worksheet.getRow(headerRow);
  for (let col = 1; col <= worksheet.columnCount; col++) {
    const label = normaliseHeader(text(row.getCell(col).value));
    if (label && !index.has(label)) index.set(label, col);
  }
  return index;
}

function findColumnFromAliases(field: ActivityField, headerIndex: Map<string, number>): number | null {
  const aliases = HEADER_ALIASES[field] || [];
  for (const alias of aliases) {
    const exact = headerIndex.get(normaliseHeader(alias));
    if (exact) return exact;
  }

  for (const [header, col] of headerIndex.entries()) {
    if (aliases.some((alias) => header.includes(normaliseHeader(alias)) || normaliseHeader(alias).includes(header))) {
      return col;
    }
  }

  return null;
}

function resolveColumn(ref: ColumnRef, headerIndex: Map<string, number>, field: ActivityField): number | null {
  if (typeof ref === 'number' && Number.isFinite(ref) && ref > 0) return Math.floor(ref);
  if (typeof ref === 'string' && ref.trim()) {
    const raw = ref.trim();
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0) return Math.floor(numeric);

    const letter = columnLetterToNumber(raw);
    if (letter) return letter;

    const exact = headerIndex.get(normaliseHeader(raw));
    if (exact) return exact;
  }

  return findColumnFromAliases(field, headerIndex);
}

function cellValue(row: ExcelJS.Row, column: number | null): unknown {
  if (!column) return undefined;
  return row.getCell(column).value;
}

function hasAnyUsefulData(row: ExcelJS.Row): boolean {
  for (let col = 1; col <= row.cellCount; col++) {
    if (text(row.getCell(col).value)) return true;
  }
  return false;
}

function defaultTitle(sheetName: string, year: number): string {
  return `${sheetName || 'Imported'} Business Plan ${year}`;
}

export async function GET() {
  return Response.json({
    description: 'Mapped Excel import endpoint for non-standard business plan workbooks.',
    requiredFormFields: ['file'],
    optionalFormFields: ['sheetName', 'headerRow', 'firstDataRow', 'mapping', 'defaults', 'previewOnly', 'maxPreviewRows'],
    defaultMapping: DEFAULT_MAPPING,
    supportedFields: Object.keys(HEADER_ALIASES),
    requiredActivityFields: REQUIRED_FIELDS,
    exampleMapping: {
      activityNumber: 'Activity #',
      activityDescription: 'Activity Description',
      expenditureDescription: 'Description of Expenditure',
      estimatedCost: 'Estimated Cost',
      recurrentBudget: 'Recurrent Budget',
      q1: 'Q1',
      q2: 'Q2',
      q3: 'Q3',
      q4: 'Q4'
    }
  });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER']);
  if (!auth.ok) return auth.response;

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'Upload an .xlsx file using field name file.' }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.from(await file.arrayBuffer());
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const requestedSheetName = text(formData.get('sheetName'));
  const worksheet = requestedSheetName ? workbook.getWorksheet(requestedSheetName) : workbook.worksheets[0];
  if (!worksheet) {
    return Response.json({
      error: requestedSheetName ? `Workbook is missing sheet: ${requestedSheetName}` : 'Workbook has no worksheets.',
      sheets: workbook.worksheets.map((sheet) => sheet.name)
    }, { status: 400 });
  }

  const headerRow = getNumber(formData.get('headerRow'), 1);
  const firstDataRow = getNumber(formData.get('firstDataRow'), headerRow + 1);
  const previewOnly = text(formData.get('previewOnly')).toLowerCase() === 'true';
  const maxPreviewRows = getNumber(formData.get('maxPreviewRows'), 20);
  const userMapping = safeJson<Mapping>(formData.get('mapping'), {});
  const defaults = safeJson<Record<string, unknown>>(formData.get('defaults'), {});
  const mapping: Mapping = { ...DEFAULT_MAPPING, ...userMapping };

  const headerIndex = buildHeaderIndex(worksheet, headerRow);
  const resolvedColumns = {} as Record<ActivityField, number | null>;
  for (const field of Object.keys(HEADER_ALIASES) as ActivityField[]) {
    resolvedColumns[field] = resolveColumn(mapping[field], headerIndex, field);
  }

  const missingRequiredMappings = REQUIRED_FIELDS.filter((field) => !resolvedColumns[field]);
  if (missingRequiredMappings.length > 0) {
    return Response.json({
      error: 'Required mapping fields could not be resolved.',
      missingRequiredMappings,
      detectedHeaders: Array.from(headerIndex.entries()).map(([header, column]) => ({ header, column })),
      resolvedColumns,
      sheets: workbook.worksheets.map((sheet) => sheet.name)
    }, { status: 400 });
  }

  const issues: ImportIssue[] = [];
  const activities = [];
  const previewRows = [];

  for (let rowNumber = firstDataRow; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    if (!hasAnyUsefulData(row)) continue;

    const estimatedCost = money(cellValue(row, resolvedColumns.estimatedCost));
    const recurrentBudget = money(cellValue(row, resolvedColumns.recurrentBudget));
    const developmentPartners = money(cellValue(row, resolvedColumns.developmentPartners));
    const activityDescription = text(cellValue(row, resolvedColumns.activityDescription));
    const expenditureDescription = text(cellValue(row, resolvedColumns.expenditureDescription));

    if (!activityDescription && !expenditureDescription && estimatedCost === 0 && recurrentBudget === 0 && developmentPartners === 0) {
      continue;
    }

    const candidate = {
      subProgram: text(cellValue(row, resolvedColumns.subProgram)),
      corporatePlanKeyActivity: text(cellValue(row, resolvedColumns.corporatePlanKeyActivity)),
      outputOrServiceTarget: text(cellValue(row, resolvedColumns.outputOrServiceTarget)),
      targetForYear: text(cellValue(row, resolvedColumns.targetForYear)),
      responsibility: text(cellValue(row, resolvedColumns.responsibility)),
      activityNumber: text(cellValue(row, resolvedColumns.activityNumber)) || `IMP${String(activities.length + 1).padStart(3, '0')}`,
      activityDescription,
      jobCode: text(cellValue(row, resolvedColumns.jobCode)),
      expenditureDescription,
      estimatedCost,
      recurrentBudget: recurrentBudget || estimatedCost,
      developmentPartners,
      q1: booleanMark(cellValue(row, resolvedColumns.q1)),
      q2: booleanMark(cellValue(row, resolvedColumns.q2)),
      q3: booleanMark(cellValue(row, resolvedColumns.q3)),
      q4: booleanMark(cellValue(row, resolvedColumns.q4)),
      funding: text(cellValue(row, resolvedColumns.funding)) || 'Recurrent',
      budgetCategory: text(cellValue(row, resolvedColumns.budgetCategory)) || 'Admin',
      accountCode: text(cellValue(row, resolvedColumns.accountCode)),
      sortOrder: activities.length + 1
    };

    previewRows.push({ rowNumber, candidate });

    const parsed = ActivitySchema.safeParse(candidate);
    if (!parsed.success) {
      issues.push({
        row: rowNumber,
        severity: 'warning',
        message: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
      });
      continue;
    }

    activities.push(parsed.data);

    if (previewOnly && previewRows.length >= maxPreviewRows) break;
  }

  const year = Number(defaults.year || new Date().getFullYear());
  const planDefaults = {
    title: String(defaults.title || defaultTitle(worksheet.name, year)),
    organization: String(defaults.organization || 'Ministry of Health'),
    facility: String(defaults.facility || 'Vila Central Hospital'),
    costCenter: String(defaults.costCenter || ''),
    costCenterName: String(defaults.costCenterName || ''),
    year,
    ceilingAmount: Number(defaults.ceilingAmount || 0)
  };

  return Response.json({
    ...planDefaults,
    workbook: {
      fileName: file.name,
      sheetName: worksheet.name,
      sheets: workbook.worksheets.map((sheet) => sheet.name),
      headerRow,
      firstDataRow,
      rowCount: worksheet.rowCount
    },
    mapping: {
      requested: mapping,
      resolvedColumns,
      detectedHeaders: Array.from(headerIndex.entries()).map(([header, column]) => ({ header, column }))
    },
    previewOnly,
    importedActivityCount: activities.length,
    skippedOrWarningCount: issues.length,
    issues,
    previewRows: previewRows.slice(0, maxPreviewRows),
    activities
  });
}
