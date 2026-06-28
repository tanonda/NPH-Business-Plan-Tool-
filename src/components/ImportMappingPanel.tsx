'use client';

import { ChangeEvent, useMemo, useState } from 'react';

type ActivityInput = {
  subProgram: string;
  corporatePlanKeyActivity: string;
  outputOrServiceTarget: string;
  targetForYear: string;
  responsibility: string;
  activityNumber: string;
  activityDescription: string;
  jobCode: string;
  expenditureDescription: string;
  estimatedCost: number;
  recurrentBudget: number;
  developmentPartners: number;
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
  funding: string;
  budgetCategory: string;
  accountCode: string;
  sortOrder: number;
};

type ImportMappingPanelProps = {
  onImported: (payload: {
    title?: string;
    year?: number;
    facility?: string;
    costCenter?: string;
    costCenterName?: string;
    ceilingAmount?: number;
    activities: ActivityInput[];
  }) => void;
};

type MappingState = {
  sheetName: string;
  headerRow: string;
  firstDataRow: string;
  previewOnly: boolean;
  mapping: Record<string, string>;
};

type ImportIssue = {
  row?: number;
  field?: string;
  message: string;
};

type ImportResponse = {
  title?: string;
  year?: number;
  facility?: string;
  costCenter?: string;
  costCenterName?: string;
  ceilingAmount?: number;
  activities?: ActivityInput[];
  preview?: ActivityInput[];
  issues?: ImportIssue[];
  detectedHeaders?: string[];
  sheetNames?: string[];
  rowCount?: number;
  message?: string;
  error?: string;
};

const DEFAULT_MAPPING: Record<string, string> = {
  subProgram: 'Sub Program',
  corporatePlanKeyActivity: 'Corporate Plan Key Activity',
  outputOrServiceTarget: 'Output/Service Target',
  targetForYear: 'Target for the Year',
  responsibility: 'Responsibility',
  activityNumber: 'Activity #',
  activityDescription: 'Activity Description',
  jobCode: 'Job Code',
  expenditureDescription: 'Description of Expenditure',
  estimatedCost: 'Estimated Cost',
  recurrentBudget: 'Recurrent Budget',
  developmentPartners: 'Development Partners',
  q1: 'Q1',
  q2: 'Q2',
  q3: 'Q3',
  q4: 'Q4',
  funding: 'Funding',
  budgetCategory: 'Budget Category',
  accountCode: 'Account Code'
};

const REQUIRED_FIELDS = ['activityNumber', 'activityDescription', 'estimatedCost'];

const FIELD_LABELS: Record<string, string> = {
  subProgram: 'Sub-program',
  corporatePlanKeyActivity: 'Corporate plan key activity',
  outputOrServiceTarget: 'Output/service target',
  targetForYear: 'Target for year',
  responsibility: 'Responsibility',
  activityNumber: 'Activity #',
  activityDescription: 'Activity description',
  jobCode: 'Job code',
  expenditureDescription: 'Description of expenditure',
  estimatedCost: 'Estimated cost',
  recurrentBudget: 'Recurrent budget',
  developmentPartners: 'Development partners',
  q1: 'Q1',
  q2: 'Q2',
  q3: 'Q3',
  q4: 'Q4',
  funding: 'Funding',
  budgetCategory: 'Budget category',
  accountCode: 'Account code'
};

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat('en-VU', { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function getIssueSummary(issues: ImportIssue[] = []) {
  if (issues.length === 0) return 'No import issues reported.';
  const grouped = issues.reduce<Record<string, number>>((acc, issue) => {
    const key = issue.field || 'general';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(grouped).map(([field, count]) => `${FIELD_LABELS[field] || field}: ${count}`).join(' · ');
}

export function ImportMappingPanel({ onImported }: ImportMappingPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<MappingState>({
    sheetName: '61RB-BP',
    headerRow: '',
    firstDataRow: '',
    previewOnly: true,
    mapping: DEFAULT_MAPPING
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Use this when a workbook does not match the standard 61RB template.');
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const previewRows = useMemo(() => result?.preview || result?.activities || [], [result]);
  const issues = result?.issues || [];
  const detectedHeaders = result?.detectedHeaders || [];
  const sheetNames = result?.sheetNames || [];

  function updateMapping(field: string, value: string) {
    setState((current) => ({
      ...current,
      mapping: {
        ...current.mapping,
        [field]: value
      }
    }));
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setMessage(selected ? `Selected ${selected.name}. Run preview first, then import.` : 'No workbook selected.');
  }

  async function submit(previewOnly: boolean) {
    if (!file) {
      setMessage('Choose an Excel workbook first.');
      return;
    }

    setLoading(true);
    setMessage(previewOnly ? 'Previewing mapped workbook...' : 'Importing mapped workbook...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('previewOnly', String(previewOnly));
    formData.append('mapping', JSON.stringify(state.mapping));

    if (state.sheetName.trim()) formData.append('sheetName', state.sheetName.trim());
    if (state.headerRow.trim()) formData.append('headerRow', state.headerRow.trim());
    if (state.firstDataRow.trim()) formData.append('firstDataRow', state.firstDataRow.trim());

    try {
      const res = await fetch('/api/import-excel-mapped', {
        method: 'POST',
        body: formData
      });

      const data: ImportResponse = await res.json().catch(() => ({}));
      setResult(data);

      if (!res.ok) {
        setMessage(data.error || 'Mapped import failed. Check sheet name, header row, and field mappings.');
        return;
      }

      const rows = data.preview?.length || data.activities?.length || 0;
      setMessage(previewOnly ? `Preview ready: ${rows} activities found.` : `Imported ${rows} activities from mapped workbook.`);

      if (!previewOnly && data.activities?.length) {
        onImported({
          title: data.title,
          year: data.year,
          facility: data.facility,
          costCenter: data.costCenter,
          costCenterName: data.costCenterName,
          ceilingAmount: data.ceilingAmount,
          activities: data.activities
        });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not process mapped import.');
    } finally {
      setLoading(false);
    }
  }

  function resetMapping() {
    setState((current) => ({ ...current, mapping: DEFAULT_MAPPING }));
    setMessage('Mapping reset to the standard 61RB field names.');
  }

  function applyDetectedHeader(field: string, header: string) {
    updateMapping(field, header);
  }

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h2>Mapped Excel import</h2>
          <p className="muted">
            Import non-standard workbooks by mapping their columns into the business plan activity fields.
          </p>
        </div>
        <button type="button" className="secondary" onClick={() => setAdvancedOpen((open) => !open)}>
          {advancedOpen ? 'Hide mapping' : 'Show mapping'}
        </button>
      </div>

      <div className="grid cols-4" style={{ marginTop: 14 }}>
        <label>
          Workbook
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} disabled={loading} />
        </label>
        <label>
          Sheet name
          <input
            value={state.sheetName}
            placeholder="Example: 61RB-BP"
            onChange={(e) => setState((current) => ({ ...current, sheetName: e.target.value }))}
          />
        </label>
        <label>
          Header row
          <input
            value={state.headerRow}
            placeholder="Auto-detect if blank"
            onChange={(e) => setState((current) => ({ ...current, headerRow: e.target.value }))}
          />
        </label>
        <label>
          First data row
          <input
            value={state.firstDataRow}
            placeholder="Auto-detect if blank"
            onChange={(e) => setState((current) => ({ ...current, firstDataRow: e.target.value }))}
          />
        </label>
      </div>

      {advancedOpen && (
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>Column mapping</h3>
              <p className="muted" style={{ marginTop: 4 }}>
                Enter a workbook header name or column letter such as A, B, C. Required: Activity #, Activity description, Estimated cost.
              </p>
            </div>
            <button type="button" className="secondary" onClick={resetMapping}>Reset mapping</button>
          </div>

          <div className="grid cols-3" style={{ marginTop: 14 }}>
            {Object.keys(FIELD_LABELS).map((field) => (
              <label key={field}>
                {FIELD_LABELS[field]} {REQUIRED_FIELDS.includes(field) ? <span style={{ color: 'var(--accent-orange)' }}>*</span> : null}
                <input
                  value={state.mapping[field] || ''}
                  onChange={(e) => updateMapping(field, e.target.value)}
                  placeholder="Header name or column letter"
                />
                {detectedHeaders.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) applyDetectedHeader(field, e.target.value);
                    }}
                    style={{ marginTop: 6 }}
                  >
                    <option value="">Use detected header...</option>
                    {detectedHeaders.map((header) => (
                      <option key={`${field}-${header}`} value={header}>{header}</option>
                    ))}
                  </select>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="actions" style={{ marginTop: 14 }}>
        <button type="button" className="secondary" disabled={loading || !file} onClick={() => void submit(true)}>
          {loading ? 'Working...' : 'Preview mapped import'}
        </button>
        <button type="button" disabled={loading || !file} onClick={() => void submit(false)}>
          Import mapped activities
        </button>
        <span className="muted">{message}</span>
      </div>

      {sheetNames.length > 0 && (
        <p className="footer-note">
          Detected sheets: {sheetNames.join(', ')}
        </p>
      )}

      {result && (
        <div className="grid cols-2" style={{ marginTop: 14 }}>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Import diagnostics</h3>
            <p className="muted">Rows detected: {result.rowCount ?? previewRows.length}</p>
            <p className={issues.length ? 'warn' : 'good'}>{getIssueSummary(issues)}</p>
            {issues.length > 0 && (
              <div className="table-wrap" style={{ maxHeight: 240, overflow: 'auto' }}>
                <table>
                  <thead><tr><th>Row</th><th>Field</th><th>Message</th></tr></thead>
                  <tbody>
                    {issues.slice(0, 25).map((issue, index) => (
                      <tr key={`${issue.row || 'general'}-${issue.field || 'field'}-${index}`}>
                        <td>{issue.row || '-'}</td>
                        <td>{issue.field ? FIELD_LABELS[issue.field] || issue.field : '-'}</td>
                        <td>{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Preview summary</h3>
            <div className="kpis" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="kpi"><span>Activities</span><strong>{previewRows.length}</strong></div>
              <div className="kpi"><span>Estimated</span><strong>VT {formatNumber(previewRows.reduce((sum, row) => sum + Number(row.estimatedCost || 0), 0))}</strong></div>
            </div>
            <p className="footer-note">
              Preview does not save anything. Use Import mapped activities to copy the mapped rows into the current draft form.
            </p>
          </div>
        </div>
      )}

      {previewRows.length > 0 && (
        <div className="table-wrap" style={{ marginTop: 14, maxHeight: 360, overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Activity #</th>
                <th>Sub-program</th>
                <th>Activity description</th>
                <th className="money">Estimated</th>
                <th className="money">Recurrent</th>
                <th>Quarters</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.slice(0, 50).map((activity, index) => (
                <tr key={`${activity.activityNumber || 'row'}-${index}`}>
                  <td>{activity.activityNumber}</td>
                  <td>{activity.subProgram}</td>
                  <td>{activity.activityDescription}</td>
                  <td className="money">VT {formatNumber(activity.estimatedCost)}</td>
                  <td className="money">VT {formatNumber(activity.recurrentBudget)}</td>
                  <td>{[
                    activity.q1 ? 'Q1' : '',
                    activity.q2 ? 'Q2' : '',
                    activity.q3 ? 'Q3' : '',
                    activity.q4 ? 'Q4' : ''
                  ].filter(Boolean).join(', ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previewRows.length > 50 && <p className="footer-note">Showing first 50 rows only.</p>}
        </div>
      )}
    </section>
  );
}
