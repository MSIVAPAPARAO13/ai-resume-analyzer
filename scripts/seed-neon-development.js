import { execSync } from 'node:child_process';
import path from 'node:path';

console.log('Retrieving Neon development connection string...');
const rawCs = execSync('npx neon connection-string development', { encoding: 'utf-8' }).trim();

let cs = rawCs;
if (!cs.includes('sslmode=')) {
  cs += (cs.includes('?') ? '&' : '?') + 'sslmode=require';
}

console.log('🌱 Executing prisma seed against Neon development branch...');
try {
  execSync('npx tsx apps/api/prisma/seed.ts', {
    env: { ...process.env, DATABASE_URL: cs },
    stdio: 'inherit',
  });
  console.log('✅ Deterministic seed successfully populated on Neon development branch!');
} catch (err) {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
}
