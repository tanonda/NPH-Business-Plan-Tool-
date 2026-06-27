import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.businessPlan.findFirst({ where: { title: 'VNH ED 2026 Business Plan' } });
  if (existing) return;

  const plan = await prisma.businessPlan.create({
    data: {
      title: 'VNH ED 2026 Business Plan',
      ceilingAmount: 283739303,
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
            accountCode: '8CEC - Consultants Fees',
            budgetCategory: 'Administration',
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
            accountCode: '8EET - Computer Software Purchases',
            budgetCategory: 'Digital Systems',
            sortOrder: 2
          }
        ]
      }
    }
  });
  console.log(`Seeded ${plan.title}`);
}

main().finally(() => prisma.$disconnect());
