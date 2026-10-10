import { spawn, execSync } from 'node:child_process';

console.log('Starting neon login...');
const child = spawn('neon', ['login'], {
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let opened = false;

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);

  const match = text.match(/Auth Url:\s*(https:\/\/[^\s]+)/);
  if (match && !opened) {
    opened = true;
    const url = match[1];
    console.log('\n🌐 Opening browser for authorization now...');
    try {
      execSync(`start "" "${url}"`, { shell: 'cmd.exe' });
      console.log('Browser launched successfully. Please click Approve in your browser!');
    } catch (e) {
      console.error('Failed to open browser automatically:', e.message);
    }
  }
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk.toString());
});

child.on('close', (code) => {
  console.log(`\nneon login exited with code ${code}`);
  process.exit(code || 0);
});
