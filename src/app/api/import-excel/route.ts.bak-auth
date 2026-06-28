import ExcelJS from 'exceljs';
import { ActivitySchema } from '@/lib/schemas';
import { z } from 'zod';

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && 'text' in (value as any)) return String((value as any).text || '').trim();
  if (typeof value === 'object' && 'richText' in (value as any)) return ((value as any).richText || []).map((r: any) => r.text).join('').trim();
  if (typeof value === 'object' && 'result' in (value as any)) return String((value as any).result || '').trim();
  return String(value).trim();
}

function money(value: unknown): number {
  const raw = text(value).replace(/,/g, '');
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function isMarked(value: unknown): boolean {
  return text(value).toLowerCase() === 'x';
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Upload an .xlsx file using field name file.' }, { status: 400 });

  const workbook = new ExcelJS.Workbook();
  const buffer = Buffer.from(await file.arrayBuffer());
  await workbook.xlsx.load(buffer);

  const bp = workbook.getWorksheet('61RB-BP');
  if (!bp) return Response.json({ error: 'Workbook is missing the 61RB-BP sheet.' }, { status: 400 });

  const planDefaults = {
    year: Number(text(bp.getCell('B1').value)) || 2026,
    costCenter: text(bp.getCell('F2').value) || '61RB',
    costCenterName: text(bp.getCell('G2').value) || 'Vila Central Hospital',
    ceilingAmount: money(bp.getCell('H2').value),
    facility: 'Vila Central Hospital',
    title: `${text(bp.getCell('F2').value) || '61RB'} Business Plan ${Number(text(bp.getCell('B1').value)) || 2026}`
  };

  const activities = [];
  for (let rowNumber = 5; rowNumber <= bp.rowCount; rowNumber++) {
    const row = bp.getRow(rowNumber);
    const activityDescription = text(row.getCell(7).value);
    const expenditureDescription = text(row.getCell(9).value);
    const estimatedCost = money(row.getCell(14).value);
    const recurrentBudget = money(row.getCell(15).value);

    if (!activityDescription && !expenditureDescription && estimatedCost === 0 && recurrentBudget === 0) continue;
    if (!activityDescription || !expenditureDescription) continue;

    const candidate = {
      subProgram: text(row.getCell(1).value),
      corporatePlanKeyActivity: text(row.getCell(2).value),
      outputOrServiceTarget: text(row.getCell(3).value),
      targetForYear: text(row.getCell(4).value),
      responsibility: text(row.getCell(5).value),
      activityNumber: text(row.getCell(6).value) || `RB${String(activities.length + 1).padStart(2, '0')}`,
      activityDescription,
      jobCode: text(row.getCell(8).value),
      expenditureDescription,
      estimatedCost,
      recurrentBudget: recurrentBudget || estimatedCost,
      developmentPartners: money(row.getCell(16).value),
      q1: isMarked(row.getCell(10).value),
      q2: isMarked(row.getCell(11).value),
      q3: isMarked(row.getCell(12).value),
      q4: isMarked(row.getCell(13).value),
      funding: 'Recurrent',
      budgetCategory: 'Operations',
      accountCode: '',
      sortOrder: activities.length + 1
    };

    const parsed = ActivitySchema.safeParse(candidate);
    if (parsed.success) activities.push(parsed.data);
  }

  return Response.json({ ...planDefaults, activities });
}
