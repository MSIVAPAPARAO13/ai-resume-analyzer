import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await argon2.hash('Password123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo@resumind.dev' },
    update: {
      passwordHash,
    },
    create: {
      email: 'demo@resumind.dev',
      passwordHash,
      name: 'Resumind Demo User',
      role: 'USER',
      plan: 'FREE',
      careerProfile: {
        create: {
          headline: 'Senior Full Stack Engineer & Cloud Architect',
          summary:
            'Passionate TypeScript and Cloud engineer with 7+ years designing scalable systems and AI tooling.',
          targetRole: 'Staff Software Engineer',
          targetLevel: 'Staff',
          experiences: {
            create: [
              {
                company: 'TechCorp Cloud Solutions',
                title: 'Senior Full Stack Engineer',
                employmentType: 'Full-time',
                location: 'San Francisco, CA',
                startDate: new Date('2022-03-01'),
                isCurrent: true,
                description:
                  'Leading microservices architecture and AI resume parsing pipelines.',
              },
              {
                company: 'Innovate Labs',
                title: 'Full Stack Engineer',
                employmentType: 'Full-time',
                location: 'Remote',
                startDate: new Date('2019-06-01'),
                endDate: new Date('2022-02-28'),
                isCurrent: false,
                description:
                  'Engineered high-throughput REST APIs and modern React applications.',
              },
            ],
          },
          education: {
            create: [
              {
                institution: 'State University of Technology',
                degree: 'Bachelor of Science',
                fieldOfStudy: 'Computer Science',
                startDate: new Date('2015-08-01'),
                endDate: new Date('2019-05-15'),
                isCurrent: false,
                grade: '3.8 GPA',
              },
            ],
          },
          skills: {
            create: [
              {
                name: 'TypeScript',
                category: 'Programming',
                proficiency: 'Expert',
              },
              { name: 'Node.js', category: 'Backend', proficiency: 'Expert' },
              { name: 'React', category: 'Frontend', proficiency: 'Advanced' },
              {
                name: 'PostgreSQL',
                category: 'Database',
                proficiency: 'Advanced',
              },
              {
                name: 'Docker',
                category: 'DevOps',
                proficiency: 'Intermediate',
              },
            ],
          },
          projects: {
            create: [
              {
                name: 'Resumind Career Twin',
                description:
                  'AI-powered resume optimization platform with ATS analytics.',
                technologies: [
                  'TypeScript',
                  'Express',
                  'React',
                  'PostgreSQL',
                  'Prisma',
                ],
                projectUrl: 'https://resumind.dev',
              },
            ],
          },
        },
      },
    },
    include: {
      careerProfile: {
        include: {
          experiences: true,
          education: true,
          skills: true,
          projects: true,
        },
      },
    },
  });

  console.log('✅ Seed completed successfully:', {
    userId: user.id,
    email: user.email,
    profileId: user.careerProfile?.id,
    experiencesCount: user.careerProfile?.experiences?.length ?? 0,
    skillsCount: user.careerProfile?.skills?.length ?? 0,
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
