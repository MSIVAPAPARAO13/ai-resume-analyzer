import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

console.log('Retrieving Neon production connection string...');
const rawCs = execSync('neon connection-string production', { encoding: 'utf-8' }).trim();

let cs = rawCs;
if (!cs.includes('sslmode=')) {
  cs += (cs.includes('?') ? '&' : '?') + 'sslmode=require';
}

console.log('🚀 Executing prisma migrate deploy against Neon production branch...');
try {
  execSync('npx prisma migrate deploy --schema apps/api/prisma/schema.prisma', {
    env: { ...process.env, DATABASE_URL: cs },
    stdio: 'inherit',
  });
  console.log('✅ Prisma migrations deployed successfully to Neon!');
} catch (err) {
  console.error('❌ Migration deployment failed:', err.message);
  process.exit(1);
}

// Verify tables with Prisma Client
const prisma = new PrismaClient({
  datasources: { db: { url: cs } },
});

async function verify() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`\n📊 Verified public tables count: ${tables.length}`);
  console.log('Tables:', tables.map((t) => t.table_name).join(', '));
  await prisma.$disconnect();
}

verify().catch(console.error);
