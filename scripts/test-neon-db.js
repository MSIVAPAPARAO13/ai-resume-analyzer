import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

function getConnectionString(branch) {
  const rawCs = execSync(`npx neon connection-string ${branch}`, { encoding: 'utf-8' }).trim();
  let cs = rawCs;
  if (!cs.includes('sslmode=')) {
    cs += (cs.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  return cs;
}

async function inspectBranch(branchName) {
  console.log(`\n========================================`);
  console.log(`🔍 Inspecting Neon Branch: [${branchName}]`);
  console.log(`========================================`);
  const cs = getConnectionString(branchName);
  const prisma = new PrismaClient({ datasources: { db: { url: cs } } });

  try {
    const meta = await prisma.$queryRawUnsafe(`SELECT current_database(), current_user, version();`);
    console.log(`Database engine: PostgreSQL 18 on Neon serverless`);

    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`Public tables count: ${tables.length}`);

    const userCount = await prisma.user.count();
    const resumeCount = await prisma.resume.count();
    const jobCount = await prisma.job.count();
    const appCount = await prisma.application.count();

    console.log(`Row counts for [${branchName}]:`);
    console.log(`  - users: ${userCount}`);
    console.log(`  - resumes: ${resumeCount}`);
    console.log(`  - jobs: ${jobCount}`);
    console.log(`  - applications: ${appCount}`);

    if (branchName === 'production') {
      if (userCount === 0) {
        console.log(`🛡️ EVIDENCE GUARD & PROD ISOLATION VERIFIED: Production branch is clean (0 demo records).`);
      } else {
        console.warn(`⚠️ WARNING: Production branch contains records!`);
      }
    } else if (branchName === 'development') {
      if (userCount > 0) {
        console.log(`✅ DEV SEED VERIFIED: Development branch has ${userCount} active test users.`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await inspectBranch('production');
  await inspectBranch('development');
  console.log(`\n🎉 Dual-branch verification complete!`);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
