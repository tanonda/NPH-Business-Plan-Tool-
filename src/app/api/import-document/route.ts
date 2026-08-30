import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { prisma } from '@/lib/prisma';
import { requireApiRole } from '@/lib/api-auth-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type ImportType = 'strategic-plan' | 'job-description';

function cleanText(value: string) {
  return value.replace(/\u0000/g, '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function codeFromFilename(filename: string, fallback: string) {
  const code = filename.replace(/\.[^.]+$/, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
  return code || fallback;
}

function firstHeading(text: string, filename: string) {
  const heading = text.split('\n').map((line) => line.trim()).find((line) => line.length >= 4 && line.length <= 140 && !/^page\s+\d+$/i.test(line));
  return heading || filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

async function extractText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension === 'docx') return cleanText((await mammoth.extractRawText({ buffer })).value);
  if (extension === 'pdf') {
    const parser = new PDFParse({ data: buffer });
    try {
      return cleanText((await parser.getText()).text);
    } finally {
      await parser.destroy();
    }
  }
  throw new Error('Only .docx and .pdf files are supported.');
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(['ADMIN', 'PLANNER']);
  if (!auth.ok) return auth.response;
  const formData = await request.formData();
  const file = formData.get('file');
  const importType = String(formData.get('type') || '') as ImportType;
  const commit = String(formData.get('commit') || '') === 'true';
  if (!(file instanceof File)) return NextResponse.json({ error: 'Upload a DOCX or PDF file using field name file.' }, { status: 400 });
  if (!['strategic-plan', 'job-description'].includes(importType)) return NextResponse.json({ error: 'Choose strategic-plan or job-description as the import type.' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'The document must be 10 MB or smaller.' }, { status: 413 });
  if (commit && importType === 'strategic-plan' && auth.user.role !== 'ADMIN') return NextResponse.json({ error: 'Only an administrator can import a Master Strategic Plan.' }, { status: 403 });

  let text: string;
  try {
    text = await extractText(file);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not extract document text.' }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: 'The document did not contain extractable text.' }, { status: 422 });

  const sourceReference = file.name;
  if (importType === 'job-description') {
    const title = firstHeading(text, file.name);
    const code = codeFromFilename(file.name, 'IMPORTED-JD');
    if (commit) {
      const jobDescription = await prisma.jobDescription.create({ data: { code, title, purpose: text.slice(0, 4000), sourceReference, status: 'DRAFT' } });
      return NextResponse.json({ ok: true, imported: 'job-description', record: jobDescription, characterCount: text.length });
    }
    return NextResponse.json({ ok: true, imported: 'job-description', sourceReference, characterCount: text.length, candidate: { code, title, purpose: text.slice(0, 4000), status: 'DRAFT' }, text });
  }

  const title = firstHeading(text, file.name);
  const code = codeFromFilename(file.name, 'IMPORTED-PLAN');
  if (commit) {
    const record = await prisma.$transaction(async (tx) => {
      const strategicPlan = await tx.strategicPlan.create({ data: { title, description: text.slice(0, 4000), startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 2, status: 'DRAFT', sourceReference } });
      const pillar = await tx.strategicPillar.create({ data: { strategicPlanId: strategicPlan.id, code, title, objective: text.slice(0, 4000), operationalGuidance: text.slice(4000, 8000), sourceReference, type: 'MASTER', status: 'DRAFT' } });
      return { strategicPlan, pillar };
    });
    return NextResponse.json({ ok: true, imported: 'strategic-plan', record, characterCount: text.length });
  }
  return NextResponse.json({ ok: true, imported: 'strategic-plan', sourceReference, characterCount: text.length, candidate: { code, title, description: text.slice(0, 4000), status: 'DRAFT' }, text });
}
