import { execSync } from 'node:child_process';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (e) {
    console.error(`Error running "${cmd}":`, e.message);
    return e.stdout ? e.stdout.trim() : '';
  }
}

const raw = run('git branch');
const branches = raw
  .split('\n')
  .map((b) => b.replace('*', '').trim())
  .filter(Boolean);

console.log('Synchronizing all branches with main:');

for (const b of branches) {
  if (b === 'main') continue;

  console.log(`\n➡️ Fast-forwarding "${b}" to match "main"...`);
  run(`git branch -f ${b} main`);
  console.log(`✅ Branch "${b}" is now at main (${run(`git rev-parse --short ${b}`)}).`);
}

console.log('\n🚀 Pushing all branches to origin...');
try {
  execSync('git push origin --all', { stdio: 'inherit' });
  console.log('🎉 All branches successfully pushed to origin!');
} catch (e) {
  console.error('Error during git push origin --all:', e);
}
