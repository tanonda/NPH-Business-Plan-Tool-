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
