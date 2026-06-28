import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';

const TEMPLATE_CANDIDATES = [
  process.env.EXCEL_TEMPLATE_PATH,
  path.join(process.cwd(), 'templates', 'vnh-business-plan-template.xlsx'),
  path.join(process.cwd(), 'public', 'templates', 'vnh-business-plan-template.xlsx')
].filter(Boolean) as string[];

type AnyRecord = Record<string, any>;

type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const QUARTER_MONTHS: Record<QuarterKey, number[]> = {
  q1: [0, 1, 2],
  q2: [3, 4, 5],
  q3: [6, 7, 8],
  q4: [9, 10, 11]
};

function text(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function number(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'object' && value && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    const result = (value as any).toNumber();
    return Number.isFinite(result) ? result : fallback;
  }
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = text(value).trim().toLowerCase();
  return normalized === 'x' || normalized === 'yes' || normalized === 'true' || normalized === '1';
}

function quarterCount(activity: AnyRecord): number {
  return (['q1', 'q2', 'q3', 'q4'] as QuarterKey[]).filter((quarter) => bool(activity[quarter])).length;
}

function monthlyAmount(activity: AnyRecord, monthIndex: number): number {
  const total = number(activity.estimatedCost ?? activity.recurrentBudget);
  const activeQuarters = quarterCount(activity);
  if (!activeQuarters || !total) return 0;

  const matchingQuarter = (Object.keys(QUARTER_MONTHS) as QuarterKey[]).find((quarter) =>
    QUARTER_MONTHS[quarter].includes(monthIndex)
  );

  if (!matchingQuarter || !bool(activity[matchingQuarter])) return 0;
  return total / activeQuarters / 3;
}

function getActivities(plan: AnyRecord): AnyRecord[] {
  return Array.isArray(plan.activities) ? plan.activities : [];
}

function computeTotals(plan: AnyRecord) {
  const activities = getActivities(plan);
  const estimated = activities.reduce((sum, activity) => sum + number(activity.estimatedCost), 0);
  const recurrent = activities.reduce((sum, activity) => sum + number(activity.recurrentBudget), 0);
  const developmentPartners = activities.reduce((sum, activity) => sum + number(activity.developmentPartners), 0);
  const ceiling = number(plan.ceilingAmount);
  const unfunded = estimated - recurrent - developmentPartners;
  const ceilingVariance = ceiling - estimated;

  return {
    activityCount: activities.length,
    estimated,
    recurrent,
    developmentPartners,
    unfunded,
    ceiling,
    ceilingVariance
  };
}

function applyWorksheetDefaults(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.properties.defaultRowHeight = 18;
}

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  row.alignment = { vertical: 'middle', wrapText: true };
  row.height = 24;
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
  });
}

function formatCurrencyColumns(sheet: ExcelJS.Worksheet, columns: number[]) {
  for (const colNumber of columns) {
    sheet.getColumn(colNumber).numFmt = '#,##0';
  }
}

function autosize(sheet: ExcelJS.Worksheet, maxWidth = 42) {
  sheet.columns.forEach((column) => {
    let width = 10;
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      const raw = cell.value;
      const value = typeof raw === 'object' && raw && 'text' in raw ? (raw as any).text : raw;
      width = Math.max(width, Math.min(maxWidth, text(value).length + 2));
    });
    column.width = width;
  });
}

async function loadWorkbookTemplate(): Promise<{ workbook: ExcelJS.Workbook; loadedTemplate: boolean; templatePath?: string }> {
  for (const templatePath of TEMPLATE_CANDIDATES) {
    try {
      const absolutePath = path.resolve(templatePath);
      const buffer = await fs.readFile(absolutePath);

      if (buffer.length < 4) {
        throw new Error(`Template file is too small: ${absolutePath}`);
      }

      const zipMagic = buffer.subarray(0, 2).toString('utf8');
      if (zipMagic !== 'PK') {
        throw new Error(`Template is not a valid .xlsx zip file: ${absolutePath}`);
      }

      const workbook = new ExcelJS.Workbook();

      // Important: use raw Buffer loading instead of workbook.xlsx.readFile().
      // readFile() has been failing inside Next.js bundled route handlers with
      // “Cannot read properties of undefined (reading 'sheets')”. Buffer loading
      // is more reliable in the app router runtime.
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

      if (!workbook.worksheets.length) {
        throw new Error(`Template loaded but contained no worksheets: ${absolutePath}`);
      }

      return { workbook, loadedTemplate: true, templatePath: absolutePath };
    } catch (error) {
      console.warn(`Excel template could not be loaded from ${templatePath}. Trying next option.`, error);
    }
  }

  return { workbook: new ExcelJS.Workbook(), loadedTemplate: false };
}

function ensureWorksheet(workbook: ExcelJS.Workbook, preferredNames: string[], fallbackName: string): ExcelJS.Worksheet {
  for (const name of preferredNames) {
    const found = workbook.getWorksheet(name);
    if (found) return found;
  }
  return workbook.addWorksheet(fallbackName);
}

function clearSheetForManagedExport(sheet: ExcelJS.Worksheet) {
  sheet.spliceRows(1, sheet.rowCount || 1);
}

function buildSummarySheet(workbook: ExcelJS.Workbook, plan: AnyRecord) {
  const sheet = ensureWorksheet(workbook, ['Summary', 'Dashboard'], 'Summary');
  clearSheetForManagedExport(sheet);
  applyWorksheetDefaults(sheet);

  const totals = computeTotals(plan);
  sheet.addRow(['VNH Business Plan Export']);
  sheet.getRow(1).font = { bold: true, size: 16 };
  sheet.addRow([]);
  sheet.addRow(['Plan Title', text(plan.title, 'Untitled Business Plan')]);
  sheet.addRow(['Year', number(plan.year, new Date().getFullYear())]);
  sheet.addRow(['Organization', text(plan.organization, 'Ministry of Health')]);
  sheet.addRow(['Facility', text(plan.facility, 'Vila Central Hospital')]);
  sheet.addRow(['Cost Centre', text(plan.costCenter, '61RB')]);
  sheet.addRow(['Cost Centre Name', text(plan.costCenterName, 'Vila Central Hospital Emergency Department')]);
  sheet.addRow(['Status', text(plan.status, 'DRAFT')]);
  sheet.addRow([]);
  sheet.addRow(['Metric', 'Value']);
  styleHeader(sheet.getRow(11));
  sheet.addRow(['Activity Count', totals.activityCount]);
  sheet.addRow(['Budget Ceiling', totals.ceiling]);
  sheet.addRow(['Total Estimated Cost', totals.estimated]);
  sheet.addRow(['Recurrent Budget', totals.recurrent]);
  sheet.addRow(['Development Partners', totals.developmentPartners]);
  sheet.addRow(['Unfunded Cost', totals.unfunded]);
  sheet.addRow(['Ceiling Variance', totals.ceilingVariance]);

  formatCurrencyColumns(sheet, [2]);
  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 26;
}

function buildActivitiesSheet(workbook: ExcelJS.Workbook, plan: AnyRecord) {
  const sheet = ensureWorksheet(workbook, ['61RB-BP', 'Activities', 'BP'], '61RB-BP');
  clearSheetForManagedExport(sheet);
  applyWorksheetDefaults(sheet);

  const headers = [
    'No.',
    'Sub Program',
    'Corporate Plan Key Activity',
    'Output / Service Target',
    'Target for Year',
    'Responsibility',
    'Activity Number',
    'Activity Description',
    'Job Code',
    'Expenditure Description',
    'Estimated Cost',
    'Recurrent Budget',
    'Development Partners',
    'Q1',
    'Q2',
    'Q3',
    'Q4',
    'Account Code',
    'Budget Category'
  ];

  sheet.addRow(headers);
  styleHeader(sheet.getRow(1));

  getActivities(plan).forEach((activity, index) => {
    sheet.addRow([
      index + 1,
      text(activity.subProgram),
      text(activity.corporatePlanKeyActivity),
      text(activity.outputOrServiceTarget),
      text(activity.targetForYear),
      text(activity.responsibility),
      text(activity.activityNumber),
      text(activity.activityDescription),
      text(activity.jobCode),
      text(activity.expenditureDescription),
      number(activity.estimatedCost),
      number(activity.recurrentBudget),
      number(activity.developmentPartners),
      bool(activity.q1) ? 'x' : '',
      bool(activity.q2) ? 'x' : '',
      bool(activity.q3) ? 'x' : '',
      bool(activity.q4) ? 'x' : '',
      text(activity.accountCode),
      text(activity.budgetCategory)
    ]);
  });

  const totalRow = sheet.addRow([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'TOTAL',
    { formula: `SUM(K2:K${Math.max(sheet.rowCount - 1, 2)})` },
    { formula: `SUM(L2:L${Math.max(sheet.rowCount - 1, 2)})` },
    { formula: `SUM(M2:M${Math.max(sheet.rowCount - 1, 2)})` },
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  totalRow.font = { bold: true };

  formatCurrencyColumns(sheet, [11, 12, 13]);
  autosize(sheet);
  sheet.getColumn(10).width = Math.max(sheet.getColumn(10).width || 0, 36);
}

function buildCostingSheet(workbook: ExcelJS.Workbook, plan: AnyRecord) {
  const sheet = ensureWorksheet(workbook, ['BP COSTING', 'Costings', 'Costing'], 'BP COSTING');
  clearSheetForManagedExport(sheet);
  applyWorksheetDefaults(sheet);

  const headers = [
    'No.',
    'Activity Number',
    'Activity Description',
    'Expenditure Description',
    'Account Code',
    'Budget Category',
    'Estimated Cost',
    ...MONTHS,
    'Annual Total'
  ];

  sheet.addRow(headers);
  styleHeader(sheet.getRow(1));

  getActivities(plan).forEach((activity, index) => {
    const monthlyValues = MONTHS.map((_, monthIndex) => monthlyAmount(activity, monthIndex));
    sheet.addRow([
      index + 1,
      text(activity.activityNumber),
      text(activity.activityDescription),
      text(activity.expenditureDescription),
      text(activity.accountCode),
      text(activity.budgetCategory),
      number(activity.estimatedCost),
      ...monthlyValues,
      monthlyValues.reduce((sum, value) => sum + value, 0)
    ]);
  });

  const lastActivityRow = Math.max(sheet.rowCount, 2);
  const totalRowValues: any[] = ['', '', '', '', '', 'TOTAL', { formula: `SUM(G2:G${lastActivityRow})` }];
  for (let col = 8; col <= 19; col++) {
    const letter = sheet.getColumn(col).letter;
    totalRowValues.push({ formula: `SUM(${letter}2:${letter}${lastActivityRow})` });
  }
  totalRowValues.push({ formula: `SUM(T2:T${lastActivityRow})` });
  const totalRow = sheet.addRow(totalRowValues);
  totalRow.font = { bold: true };

  formatCurrencyColumns(sheet, Array.from({ length: 14 }, (_, index) => index + 7));
  autosize(sheet);
  sheet.getColumn(4).width = Math.max(sheet.getColumn(4).width || 0, 38);
}

function buildCashflowSheet(workbook: ExcelJS.Workbook, plan: AnyRecord) {
  const sheet = ensureWorksheet(workbook, ['Cashflow 2026', 'Cashflow'], 'Cashflow 2026');
  clearSheetForManagedExport(sheet);
  applyWorksheetDefaults(sheet);

  const headers = ['No.', 'Activity Number', 'Activity Description', ...MONTHS, 'Annual Total'];
  sheet.addRow(headers);
  styleHeader(sheet.getRow(1));

  getActivities(plan).forEach((activity, index) => {
    const monthlyValues = MONTHS.map((_, monthIndex) => monthlyAmount(activity, monthIndex));
    sheet.addRow([
      index + 1,
      text(activity.activityNumber),
      text(activity.activityDescription),
      ...monthlyValues,
      monthlyValues.reduce((sum, value) => sum + value, 0)
    ]);
  });

  const lastActivityRow = Math.max(sheet.rowCount, 2);
  const totalRowValues: any[] = ['', 'TOTAL', ''];
  for (let col = 4; col <= 15; col++) {
    const letter = sheet.getColumn(col).letter;
    totalRowValues.push({ formula: `SUM(${letter}2:${letter}${lastActivityRow})` });
  }
  totalRowValues.push({ formula: `SUM(P2:P${lastActivityRow})` });
  const totalRow = sheet.addRow(totalRowValues);
  totalRow.font = { bold: true };

  formatCurrencyColumns(sheet, Array.from({ length: 13 }, (_, index) => index + 4));
  autosize(sheet);
  sheet.getColumn(3).width = Math.max(sheet.getColumn(3).width || 0, 38);
}

function applyWorkbookMetadata(workbook: ExcelJS.Workbook, plan: AnyRecord) {
  workbook.creator = 'VNH Business Plan Tool';
  workbook.lastModifiedBy = 'VNH Business Plan Tool';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = text(plan.title, 'Business Plan Export');
  workbook.title = text(plan.title, 'Business Plan Export');
}

export async function buildWorkbookBuffer(plan: AnyRecord): Promise<Buffer> {
  const { workbook, loadedTemplate, templatePath } = await loadWorkbookTemplate();
  applyWorkbookMetadata(workbook, plan);

  if (!loadedTemplate) {
    console.warn('No Excel template could be loaded. Creating generated workbook export.');
  } else {
    console.info(`Excel template loaded successfully: ${templatePath}`);
  }

  // The workbook can be template-backed or generated. These builders refresh the
  // managed export sheets while keeping any unrelated template sheets intact.
  buildSummarySheet(workbook, plan);
  buildActivitiesSheet(workbook, plan);
  buildCostingSheet(workbook, plan);
  buildCashflowSheet(workbook, plan);

  const output = await workbook.xlsx.writeBuffer();
  return Buffer.from(output);
}

export default buildWorkbookBuffer;
