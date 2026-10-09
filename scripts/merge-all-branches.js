import { execSync } from 'node:child_process';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (e) {
    return e.stdout ? e.stdout.trim() : '';
  }
}

const raw = run('git branch');
const branches = raw
  .split('\n')
  .map((b) => b.replace('*', '').trim())
  .filter(Boolean);

console.log('Found branches:', branches);

for (const b of branches) {
  if (b === 'main') continue;

  const ahead = run(`git rev-list --count main..${b}`);
  const behind = run(`git rev-list --count ${b}..main`);
  console.log(`Branch "${b}": ahead=${ahead}, behind=${behind}`);

  if (Number(ahead) > 0) {
    console.log(`⚠️ Branch ${b} has ${ahead} commits ahead of main! Merging into main...`);
    try {
      execSync(`git merge ${b} -m "merge(${b}): merge remaining changes into main"`, {
        stdio: 'inherit',
      });
      console.log(`✅ Successfully merged ${b} into main`);
    } catch (err) {
      console.error(`❌ Merge conflict or error merging ${b}:`, err);
    }
  } else {
    console.log(`✓ Branch "${b}" is already fully merged into main.`);
  }
}

console.log('\nChecking git status on main:');
console.log(run('git status'));
