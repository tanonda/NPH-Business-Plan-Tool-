import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@vnh.local';
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Business Plan Admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'admin123');

  if (!adminPassword) {
    throw new Error('DEFAULT_ADMIN_PASSWORD is required when seeding production.');
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: 'ADMIN',
      isActive: true,
      canAccessAllDepartments: true
    },
    create: {
      email: adminEmail,
      name: adminName,
      role: 'ADMIN',
      isActive: true,
      canAccessAllDepartments: true,
      passwordHash: hashPassword(adminPassword)
    }
  });

  const department = await prisma.department.upsert({
    where: { code: '61RB' },
    update: {
      name: 'Vila Central Hospital Emergency Department',
      facility: 'Vila Central Hospital',
      organization: 'Ministry of Health',
      isActive: true
    },
    create: {
      code: '61RB',
      name: 'Vila Central Hospital Emergency Department',
      facility: 'Vila Central Hospital',
      organization: 'Ministry of Health',
      isActive: true
    }
  });

  const existing = await prisma.businessPlan.findFirst({
    where: {
      title: 'VNH ED 2026 Business Plan',
      year: 2026,
      costCenter: '61RB'
    }
  });

  if (!existing) {
    await prisma.businessPlan.create({
      data: {
        title: 'VNH ED 2026 Business Plan',
        year: 2026,
        organization: 'Ministry of Health',
        facility: 'Vila Central Hospital',
        costCenter: '61RB',
        costCenterName: 'Vila Central Hospital Emergency Department',
        ceilingAmount: 283739303,
        status: 'DRAFT',
        ownerId: admin.id,
        createdById: admin.id,
        updatedById: admin.id,
        departmentId: department.id,
        activities: {
          create: [
            {
              subProgram: 'Management & Administration',
              corporatePlanKeyActivity: 'Strengthen Emergency Care Administration',
              outputOrServiceTarget: 'Align ED organogram with Ministry of Health strategic framework.',
              targetForYear: 'Implement an autonomous administrative and clinical tracking structure.',
              responsibility: 'HoD, Med Sup, Dir Hosp',
              activityNumber: 'RB01.01',
              activityDescription: 'Implement autonomous ED organogram and staffing scale',
              jobCode: '611180 VCH Administration',
              expenditureDescription: 'Consultant fees, staff workshops, administrative setup, reporting templates and implementation support.',
              estimatedCost: 1266000,
              recurrentBudget: 1266000,
              developmentPartners: 0,
              accountCode: '8CEC - Consultants Fees',
              activityCategory: 'Administration Support',
              budgetCategory: 'Finance_HR',
              q1: true,
              q2: true,
              q3: false,
              q4: false,
              sortOrder: 1
            },
            {
              subProgram: 'Management & Administration',
              corporatePlanKeyActivity: 'Digital patient information management',
              outputOrServiceTarget: 'Deploy comprehensive digital patient information system.',
              targetForYear: 'Transition to digital patient records and tracking.',
              responsibility: 'HoD, Admin Support, Clinical Leads',
              activityNumber: 'RB01.12',
              activityDescription: 'Deploy comprehensive digital patient information system',
              jobCode: '611180 VCH Administration',
              expenditureDescription: 'Software licensing, configuration, training, deployment support and data migration activities.',
              estimatedCost: 15000000,
              recurrentBudget: 15000000,
              developmentPartners: 0,
              accountCode: '8EET - Computer Software Purchases',
              activityCategory: 'System Evaluation ',
              budgetCategory: 'Assets_Infra',
              q1: true,
              q2: true,
              q3: true,
              q4: true,
              sortOrder: 2
            }
          ]
        },
        auditLogs: {
          create: {
            action: 'PLAN_CREATED' as any,
            details: 'Seeded default VNH ED 2026 Business Plan.',
            userId: admin.id,
            metadata: {
              seededBy: 'prisma/seed.ts',
              seededAt: new Date().toISOString()
            }
          }
        }
      }
    });
  }

  const transformation = await prisma.strategicPlan.findFirst({ where: { title: 'Clinical Transformation of Emergency Care Services (2026–2028)' } })
    || await prisma.strategicPlan.create({ data: { title: 'Clinical Transformation of Emergency Care Services (2026–2028)', description: 'Three-year VNH Emergency Department clinical transformation roadmap.', startYear: 2026, endYear: 2028, status: 'APPROVED', sourceReference: 'Comprehensive Clinical Transformation of the Emergency Care Services (2026–2028).pdf' } });

  const pillarSeeds = [
    ['I', 'Governance & Digital Health Integration', 'Establish the ED as an autonomous administrative entity to enhance fiscal accountability and operational efficiency.', 'Implement independent ED organogram, financial job codes, digital patient tracking and public communication.', 'MoH Health Information Systems; NSDP SOC 3.4', 16692000],
    ['II', 'Clinical Excellence & Quality Assurance', 'Formalise continuous quality improvement and expand intensive care capacity.', 'Institutionalise monthly clinical audits, M&M reviews, postgraduate training and ICU operationalisation.', 'MoH Quality Services; NSDP SOC 3.1', 5000000],
    ['III', 'Nursing Leadership & Specialised Care', 'Elevate nursing competency and transition to acuity-based staffing.', 'Nursing governance, specialty protocols, POCUS competency and workforce wellness.', 'NSDP SOC 3.4', 22965000],
    ['IV', 'Integrated Allied Health & Emergency Pharmacy', 'Embed multidisciplinary allied health and pharmaceutical expertise in acute care.', 'Clinical pharmacy, POCT optimisation and dental, ENT and ophthalmology pathways.', 'NSDP SOC 3.1', 7820000],
    ['V', 'Infrastructure Resilience & Cybersecurity', 'Secure critical facility assets and digital infrastructure for uninterrupted 24/7 service.', 'Power, HVAC, preventive maintenance, network integrity and cybersecurity monitoring.', 'MoH Capital; NSDP SOC 4.2', 46563766],
    ['VI', 'Biomedical Engineering & Asset Lifecycle Management', 'Maximise reliability, safety and lifecycle of critical equipment.', 'Asset registry, quarterly maintenance, decommissioning and strategic procurement.', 'MoH Capital', 341313200],
    ['VII', 'Prehospital Retrieval, Regional Integration & Disaster Response', 'Extend hospital reach through an integrated prehospital network and regional trauma hub.', 'Joint dispatch, ALS, aeromedical retrieval, telemetry, MCI protocols and first responders.', 'NSDP SOC 3.1', 2305234]
  ] as const;
  for (const [code, title, objective, operationalGuidance, strategicAlignment, indicativeAmount] of pillarSeeds) {
    const pillar = await prisma.strategicPillar.upsert({
      where: { strategicPlanId_code: { strategicPlanId: transformation.id, code } },
      update: { title, objective, operationalGuidance, strategicAlignment, type: 'MASTER', status: 'APPROVED', sourceReference: transformation.sourceReference },
      create: { strategicPlanId: transformation.id, code, title, objective, operationalGuidance, strategicAlignment, type: 'MASTER', status: 'APPROVED', sourceReference: transformation.sourceReference }
    });
    const allocation = await prisma.pillarBudgetAllocation.findFirst({ where: { pillarId: pillar.id, departmentId: department.id, fiscalYear: 2026, notes: 'Imported source estimate' } });
    if (!allocation) await prisma.pillarBudgetAllocation.create({ data: { pillarId: pillar.id, departmentId: department.id, fiscalYear: 2026, costCenterCode: '61RB', indicativeAmount, status: 'INDICATIVE', notes: 'Imported source estimate — requires Finance validation before approval.' } });
  }

  const jobSeeds = [
    { code: 'ED-HOD', title: 'Head of Department – Accident & Emergency Department', purpose: 'Provide overall clinical, professional, and administrative leadership of the Accident & Emergency Department, ensuring safe, high-quality, timely and efficient emergency care, strategic development, workforce planning and disaster preparedness.', reportsTo: 'Hospital Manager / Director of Clinical Services, Vanuatu National Hospital', supervises: 'Emergency Medicine consultants and registrars, medical officers, interns, ED nursing and administrative staff.', objectives: [['Departmental Leadership & Clinical Governance', 'Provide overall clinical and professional leadership.', 'Departmental performance indicators, staff and patient feedback confirm effective leadership.'], ['Workforce Development & Performance Management', 'Lead workforce planning, supervision and professional development.', 'Workforce plans, supervision records and development outcomes are maintained.'], ['Strategic Planning, Resource & Financial Management', 'Lead business planning, resource allocation and budget monitoring.', 'Approved plans and financial reports demonstrate accountable resource use.'], ['Emergency Preparedness & Disaster Response', 'Lead departmental disaster and mass-casualty readiness.', 'Exercises, protocols and post-event reviews demonstrate readiness.']] },
    { code: 'ED-SR', title: 'Senior Registrar Emergency Medicine', purpose: 'Deliver acute and emergency medical care and provide senior clinical leadership within the Emergency Department.', reportsTo: 'Consultant Emergency Physician / Head of Emergency Department', supervises: 'Junior Emergency Medicine Registrars, Medical Interns, ED Nurses and Intern Nurses.', objectives: [['Clinical Care', 'Independently assess and manage a wide range of emergency presentations.', 'Case records demonstrate independent, competent assessment and management.'], ['Professionalism, Communication & Patient Care', 'Escalate complex cases and communicate with families and clinical teams.', 'Timely, documented escalation and positive communication feedback.'], ['Quality & Safety', 'Participate in teaching, audits, M&M and quality improvement.', 'Attendance and contribution records demonstrate participation.'], ['Emergency Preparedness & Response', 'Lead resuscitations, trauma/disaster responses and coordinate patient flow.', 'Case records and team feedback confirm effective leadership.'], ['Leadership, Supervision & Professional Development', 'Mentor junior staff and deliver CME/case discussions.', 'Teaching activity and feedback records are maintained.']] },
    { code: 'ED-JR', title: 'Junior Registrar Emergency Medicine', purpose: 'Assess and manage emergency patients under supervision while building clinical, quality and teaching capability.', reportsTo: 'Consultant Emergency Physician / Head of Emergency Department; Senior Emergency Medicine Registrar', supervises: 'Supports supervision of interns and ED nurses when delegated.', objectives: [['Clinical Care', 'Assess and manage patients under supervision.', 'Accurate, timely assessment and management plans reviewed by senior staff.'], ['Professionalism, Communication & Patient Care', 'Recognise and escalate deteriorating patients and communicate clearly.', 'Timely escalation and complete referral/handover documentation.'], ['Emergency Preparedness & Response', 'Assist in procedures, resuscitations and critical care.', 'Documented participation with satisfactory senior-clinician feedback.'], ['Quality & Safety', 'Maintain records and participate in teaching, audits and workshops.', 'Audit results and attendance records demonstrate participation.'], ['Professional & Clinical Development', 'Participate in CME, peer learning and resource-limited clinical reasoning.', 'CME records and constructive senior feedback are maintained.']] }
  ];
  for (const seed of jobSeeds) {
    await prisma.jobDescription.upsert({
      where: { departmentId_code_version: { departmentId: department.id, code: seed.code, version: 1 } },
      update: { title: seed.title, purpose: seed.purpose, reportsTo: seed.reportsTo, supervises: seed.supervises, status: 'APPROVED', sourceReference: `${seed.code === 'ED-HOD' ? 'JD_HoD' : seed.code === 'ED-SR' ? 'JD_Senior_Registrar' : 'JD_Junior_Registrar'}_Emergency_Medicine.docx` },
      create: { departmentId: department.id, code: seed.code, title: seed.title, version: 1, purpose: seed.purpose, reportsTo: seed.reportsTo, supervises: seed.supervises, status: 'APPROVED', sourceReference: `${seed.code === 'ED-HOD' ? 'JD_HoD' : seed.code === 'ED-SR' ? 'JD_Senior_Registrar' : 'JD_Junior_Registrar'}_Emergency_Medicine.docx`, objectives: { create: seed.objectives.map(([kra, kta, kpi], sortOrder) => ({ kra, kta, kpi, targetDate: 'Continuous throughout the review period', sortOrder: sortOrder + 1 })) } }
    });
  }

  console.log('Seed complete.');
  console.log(`Default admin: ${adminEmail}`);
  console.log(`Default password: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
