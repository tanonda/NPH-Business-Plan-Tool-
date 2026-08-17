'use client';

type RoadmapPhase = {
  period: string;
  title: string;
  focus: string;
  status: 'Current' | 'Planned';
};

const pillars = [
  ['I', 'Governance & digital integration', 'EMR rollout, ED organogram, financial job codes', '16,692,000'],
  ['II', 'Clinical excellence & quality', 'Clinical audits, M&M cycles, ICU operationalisation', '5,000,000'],
  ['III', 'Nursing leadership & specialised care', 'Acuity-based staffing, clinical pathways, staff wellness', '22,965,000'],
  ['IV', 'Allied health & emergency pharmacy', 'Pharmacy, laboratory and specialist care pathways', '7,820,000'],
  ['V', 'Infrastructure resilience & cybersecurity', 'Power, CCTV/network resilience and facility readiness', '46,563,766'],
  ['VI', 'Biomedical engineering & assets', 'Asset registry, preventive maintenance and equipment lifecycle', '341,313,200'],
  ['VII', 'Prehospital & regional response', 'Dispatch, retrieval, ALS and community first responders', '2,305,234']
] as const;

const roadmap: RoadmapPhase[] = [
  { period: 'Q3 2026', title: 'Mobilisation & hard gate 1', focus: 'ED security and workflow infrastructure', status: 'Current' },
  { period: 'Q4 2026', title: 'Full system integration & hard gate 2', focus: 'Network validation, penetration testing and digital EHR rollout', status: 'Planned' },
  { period: 'Q1 2027', title: 'Administrative autonomy', focus: 'ED organogram realignment and dedicated MoH financial job codes', status: 'Planned' },
  { period: 'Q2 2027', title: 'Clinical quality & training', focus: 'WHO-aligned audits, M&M reviews and operational SOPs', status: 'Planned' },
  { period: 'Q3 2027', title: 'Regional integration', focus: 'Prehospital retrieval and community first responder expansion', status: 'Planned' },
  { period: '2028', title: 'Sustainability review', focus: 'Three-year KPI review and transition to routine operations', status: 'Planned' }
];

const workforce = [
  {
    role: 'Head of Department',
    purpose: 'Overall clinical, professional and administrative leadership; strategic development, workforce planning and disaster preparedness.',
    areas: ['Departmental leadership & clinical governance', 'Workforce development & performance management', 'Strategic planning, resource & financial management', 'Emergency preparedness & disaster response']
  },
  {
    role: 'Senior Registrar',
    purpose: 'Senior clinical leadership, supervision and quality improvement across the Emergency Department.',
    areas: ['Clinical care', 'Professionalism, communication & patient care', 'Quality & safety', 'Emergency preparedness & response', 'Leadership, supervision & professional development']
  },
  {
    role: 'Junior Registrar',
    purpose: 'Supervised emergency assessment and treatment while building clinical and teaching capability.',
    areas: ['Clinical care', 'Professionalism, communication & patient care', 'Emergency preparedness & response', 'Quality & safety', 'Professional & clinical development']
  }
];

export function EmergencyCareAlignmentPanel({ onStart2026Plan, canEditPlan }: { onStart2026Plan: () => void; canEditPlan: boolean }) {
  return (
    <section id="ed-transformation" className="panel transformation-panel">
      <div className="panel-title-row transformation-heading">
        <div>
          <p className="eyebrow">Emergency Care Services · 2026–2028</p>
          <h2>One operational chain: strategy → plan → budget → people</h2>
          <p className="muted">Use the approved transformation roadmap as the source for annual activities, budget requests, role expectations and performance reviews.</p>
        </div>
        <div className="actions">
          {canEditPlan && <button type="button" onClick={onStart2026Plan}>Start ED 2026 plan</button>}
          {!canEditPlan && <span className="muted">View-only while this plan is locked.</span>}
        </div>
      </div>

      <div className="alignment-flow" aria-label="Planning alignment flow">
        <span>Transformation pillars</span><b>→</b><span>Annual activities</span><b>→</b><span>Budget submission</span><b>→</b><span>Job descriptions</span><b>→</b><span>Performance appraisal</span>
      </div>

      <div className="alignment-budget">
        <div><span>2026 ED allocation</span><strong>VUV 6,000,000</strong></div>
        <div><span>Stated transformation shortfall</span><strong>VUV 327,946,750</strong></div>
        <p>Use the plan template to turn the seven pillars into budgetable activities. Validate source totals with Finance before submitting: the supplied proposal contains figures that do not reconcile to one single total.</p>
      </div>

      <h3>Strategic pillars and budget lines</h3>
      <div className="pillar-grid">
        {pillars.map(([number, title, action, cost]) => (
          <article className="pillar-card" key={number}>
            <span className="pillar-number">{number}</span>
            <div><h4>{title}</h4><p>{action}</p><strong>VUV {cost}</strong></div>
          </article>
        ))}
      </div>

      <h3>Roadmap gates</h3>
      <div className="roadmap-grid">
        {roadmap.map((phase) => <article key={phase.period} className="roadmap-card"><span>{phase.period}</span><h4>{phase.title}</h4><p>{phase.focus}</p><em className={phase.status === 'Current' ? 'current' : ''}>{phase.status}</em></article>)}
      </div>

      <div className="workforce-heading"><div><h3>Workforce, JD and appraisal alignment</h3><p className="muted">The appraisal KRAs below are drawn from the supplied position-specific appraisal forms and correspond to the role descriptions.</p></div></div>
      <div className="workforce-grid">
        {workforce.map((item) => <article className="workforce-card" key={item.role}><h4>{item.role}</h4><p>{item.purpose}</p><ul>{item.areas.map((area) => <li key={area}>{area}</li>)}</ul></article>)}
      </div>
    </section>
  );
}
