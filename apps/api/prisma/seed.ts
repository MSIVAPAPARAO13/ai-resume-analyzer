import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@resumind.dev' },
    update: {},
    create: {
      email: 'demo@resumind.dev',
      name: 'Resumind Demo User',
      careerProfile: {
        create: {
          headline: 'Senior Full Stack Engineer',
          summary:
            'Experienced engineer passionate about scalable TypeScript architectures and AI-driven career tools.',
          targetRole: 'Staff Software Engineer',
          targetLevel: 'Senior / Staff',
        },
      },
    },
    include: {
      careerProfile: true,
    },
  });

  console.log('✅ Seed completed successfully:', {
    userId: user.id,
    email: user.email,
    profileId: user.careerProfile?.id,
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
