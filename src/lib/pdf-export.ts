type PdfLine = { text: string; size?: number; bold?: boolean };

function escapePdfText(value: unknown) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ');
}

function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(value: unknown) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number(value));
}

function truncate(value: unknown, max = 95) {
  const text = String(value ?? '').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function planLines(plan: any, label = 'Business Plan Frozen Export'): PdfLine[] {
  const activities = Array.isArray(plan.activities) ? plan.activities : [];
  const total = activities.reduce((sum: number, activity: any) => sum + number(activity.estimatedCost), 0);
  const recurrent = activities.reduce((sum: number, activity: any) => sum + number(activity.recurrentBudget), 0);
  const dev = activities.reduce((sum: number, activity: any) => sum + number(activity.developmentPartners), 0);
  const lines: PdfLine[] = [
    { text: label, size: 18, bold: true },
    { text: `Plan: ${plan.title || 'Untitled'} | Status: ${plan.status || 'N/A'} | Year: ${plan.year || ''}`, size: 11 },
    { text: `Facility: ${plan.facility || ''} | Cost Centre: ${plan.costCenter || ''} ${plan.costCenterName || ''}`, size: 11 },
    { text: `Total Estimated: VT ${formatAmount(total)} | Recurrent: VT ${formatAmount(recurrent)} | Development Partners: VT ${formatAmount(dev)} | Unfunded: VT ${formatAmount(total - recurrent - dev)}`, size: 10 },
    { text: `Generated: ${new Date().toLocaleString('en-GB')}`, size: 9 },
    { text: ' ', size: 8 },
    { text: 'Activities', size: 13, bold: true }
  ];

  activities.slice(0, 90).forEach((activity: any, index: number) => {
    const quarters = ['q1', 'q2', 'q3', 'q4'].filter((q) => activity[q]).map((q) => q.toUpperCase()).join(', ') || 'No quarter';
    lines.push({
      text: `${index + 1}. ${activity.activityNumber || ''} | VT ${formatAmount(activity.estimatedCost)} | ${quarters} | ${truncate(activity.activityDescription, 85)}`,
      size: 8
    });
    if (activity.expenditureDescription) {
      lines.push({ text: `   Exp: ${truncate(activity.expenditureDescription, 100)}`, size: 7 });
    }
  });

  if (activities.length > 90) lines.push({ text: `... ${activities.length - 90} more activities omitted from PDF preview. Use Excel for full detail.`, size: 8 });
  return lines;
}

export function buildSimplePdfBuffer(lines: PdfLine[]) {
  const objects: string[] = [];
  const offsets: number[] = [];

  function addObject(content: string) {
    objects.push(content);
    return objects.length;
  }

  const pageWidth = 842;
  const pageHeight = 595;
  const left = 42;
  const lineGap = 13;
  const pageCapacity = 38;
  const pages: PdfLine[][] = [];

  for (let i = 0; i < lines.length; i += pageCapacity) {
    pages.push(lines.slice(i, i + pageCapacity));
  }

  const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageObjectIds: number[] = [];
  const pageContentIds: number[] = [];

  pages.forEach((pageLines, pageIndex) => {
    let y = pageHeight - 42;
    const streamLines = ['BT'];
    pageLines.forEach((line) => {
      const size = line.size || 9;
      const font = line.bold ? 'F2' : 'F1';
      streamLines.push(`/${font} ${size} Tf`);
      streamLines.push(`${left} ${y} Td (${escapePdfText(line.text)}) Tj`);
      streamLines.push(`${-left} 0 Td`);
      y -= lineGap + Math.max(0, size - 9) * 0.3;
    });
    streamLines.push('ET');
    const stream = streamLines.join('\n');
    const contentId = addObject(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    pageContentIds.push(contentId);
    const pageId = addObject(`<< /Type /Page /Parent __PAGES__  /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageObjectIds.push(pageId);
  });

  const pagesId = objects.length + 1;
  for (const pageId of pageObjectIds) {
    objects[pageId - 1] = objects[pageId - 1].replace('__PAGES__', `${pagesId} 0 R`);
  }
  addObject(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`);
  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

export function buildPlanPdfBuffer(plan: any, label?: string) {
  return buildSimplePdfBuffer(planLines(plan, label));
}
