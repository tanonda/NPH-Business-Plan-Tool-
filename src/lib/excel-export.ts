import ExcelJS from 'exceljs';
import path from 'path';
import { allocateMonthly, MONTHS, toNumber } from './business-plan-engine';

type ExportActivity = {
  subProgram: string;
  corporatePlanKeyActivity: string;
  outputOrServiceTarget: string;
  targetForYear: string;
  responsibility: string;
  activityNumber: string;
  activityDescription: string;
  jobCode: string;
  expenditureDescription: string;
  estimatedCost: unknown;
  recurrentBudget: unknown;
  developmentPartners: unknown;
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
  funding: string;
  budgetCategory: string;
  accountCode: string;
};

function columnLetter(index: number): string {
  let n = index;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

type ExportPlan = {
  title: string;
  year: number;
  costCenter: string;
  costCenterName: string;
  facility: string;
  ceilingAmount: unknown;
  activities: ExportActivity[];
};

function copyRowStyle(source: ExcelJS.Row, target: ExcelJS.Row) {
  source.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const targetCell = target.getCell(colNumber);
    targetCell.style = JSON.parse(JSON.stringify(cell.style ?? {}));
    if (cell.numFmt) targetCell.numFmt = cell.numFmt;
    if (cell.alignment) targetCell.alignment = { ...cell.alignment };
    if (cell.border) targetCell.border = JSON.parse(JSON.stringify(cell.border));
    if (cell.fill) targetCell.fill = JSON.parse(JSON.stringify(cell.fill));
  });
  target.height = source.height;
}

export async function buildWorkbookBuffer(plan: ExportPlan): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const templatePath = path.join(process.cwd(), 'templates', 'vnh-business-plan-template.xlsx');
  await workbook.xlsx.readFile(templatePath);

  const bp = workbook.getWorksheet('61RB-BP');
  const costing = workbook.getWorksheet('BP COSTING');
  const cashflow = workbook.getWorksheet('Cashflow 2026');
  if (!bp || !costing || !cashflow) throw new Error('Template is missing required worksheets.');

  bp.getCell('B1').value = plan.year;
  bp.getCell('F2').value = plan.costCenter;
  bp.getCell('G2').value = plan.costCenterName;
  bp.getCell('H2').value = toNumber(plan.ceilingAmount as any);

  const startBpRow = 5;
  const startCostingRow = 2;
  const bpStyleRow = bp.getRow(startBpRow);
  const costingStyleRow = costing.getRow(startCostingRow);

  // Clear editable data area conservatively. We preserve headers, sheet structure and formulas outside these rows.
  for (let r = startBpRow; r <= Math.max(bp.rowCount, startBpRow + 250); r++) {
    const row = bp.getRow(r);
    for (let c = 1; c <= 20; c++) row.getCell(c).value = null;
  }
  for (let r = startCostingRow; r <= Math.max(costing.rowCount, startCostingRow + 250); r++) {
    const row = costing.getRow(r);
    for (let c = 1; c <= 23; c++) row.getCell(c).value = null;
  }

  plan.activities.forEach((activity, idx) => {
    const bpRowNumber = startBpRow + idx;
    const bpRow = bp.getRow(bpRowNumber);
    copyRowStyle(bpStyleRow, bpRow);
    bpRow.getCell(1).value = activity.subProgram;
    bpRow.getCell(2).value = activity.corporatePlanKeyActivity;
    bpRow.getCell(3).value = activity.outputOrServiceTarget;
    bpRow.getCell(4).value = activity.targetForYear;
    bpRow.getCell(5).value = activity.responsibility;
    bpRow.getCell(6).value = activity.activityNumber;
    bpRow.getCell(7).value = activity.activityDescription;
    bpRow.getCell(8).value = activity.jobCode;
    bpRow.getCell(9).value = activity.expenditureDescription;
    bpRow.getCell(10).value = activity.q1 ? 'x' : '';
    bpRow.getCell(11).value = activity.q2 ? 'x' : '';
    bpRow.getCell(12).value = activity.q3 ? 'x' : '';
    bpRow.getCell(13).value = activity.q4 ? 'x' : '';
    bpRow.getCell(14).value = toNumber(activity.estimatedCost as any);
    bpRow.getCell(15).value = toNumber(activity.recurrentBudget as any);
    bpRow.getCell(16).value = toNumber(activity.developmentPartners as any) || null;
    bpRow.commit();

    const cRowNumber = startCostingRow + idx;
    const cRow = costing.getRow(cRowNumber);
    copyRowStyle(costingStyleRow, cRow);
    cRow.getCell(1).value = activity.jobCode;
    cRow.getCell(2).value = activity.activityDescription;
    cRow.getCell(3).value = activity.activityNumber;
    cRow.getCell(4).value = activity.expenditureDescription;
    cRow.getCell(5).value = toNumber(activity.recurrentBudget as any);
    cRow.getCell(6).value = 1;
    cRow.getCell(7).value = 1;
    cRow.getCell(8).value = { formula: `E${cRowNumber}*F${cRowNumber}*G${cRowNumber}` };
    cRow.getCell(9).value = activity.funding || 'Recurrent';
    cRow.getCell(10).value = activity.budgetCategory || 'Operations';
    cRow.getCell(11).value = activity.accountCode;

    const allocation = allocateMonthly({
      q1: activity.q1,
      q2: activity.q2,
      q3: activity.q3,
      q4: activity.q4,
      estimatedCost: toNumber(activity.estimatedCost as any),
      recurrentBudget: toNumber(activity.recurrentBudget as any)
    });
    MONTHS.forEach((month, monthIndex) => {
      cRow.getCell(12 + monthIndex).value = allocation[month];
    });
    cRow.commit();
  });

  const finalBpRow = startBpRow + plan.activities.length;
  bp.getCell('N2').value = { formula: `SUM(N${startBpRow}:N${finalBpRow - 1})` };
  bp.getCell('O2').value = { formula: `SUM(O${startBpRow}:O${finalBpRow - 1})` };

  MONTHS.forEach((month, idx) => {
    const costingCol = columnLetter(12 + idx);
    cashflow.getCell(8 + idx, 3).value = { formula: `SUM('BP COSTING'!${costingCol}:${costingCol})` };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
