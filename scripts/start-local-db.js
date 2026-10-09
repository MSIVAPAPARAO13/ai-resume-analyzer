import net from 'net';
import { spawn, execSync } from 'child_process';

console.log('[Local DB] Starting WSL PostgreSQL & Redis keepalive...');

// Spawn a persistent WSL process to keep services alive and running
const wslProcess = spawn(
  'wsl',
  [
    '-d',
    'Ubuntu',
    '-u',
    'root',
    '-e',
    'bash',
    '-c',
    'service postgresql start && /usr/bin/redis-server --bind 0.0.0.0 --protected-mode no --daemonize yes && sleep infinity',
  ],
  {
    stdio: 'inherit',
  },
);

wslProcess.on('error', (err) => {
  console.error('[Local DB] WSL process error:', err);
});

wslProcess.on('exit', (code) => {
  console.log(`[Local DB] WSL process exited with code ${code}`);
  process.exit(code || 0);
});

// Wait 2 seconds for services to initialize
setTimeout(() => {
  let wslIp = '127.0.0.1';
  try {
    const output = execSync('wsl -d Ubuntu -e ip -4 addr show eth0', {
      encoding: 'utf8',
    });
    const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
    if (match && match[1]) {
      wslIp = match[1];
    }
  } catch (err) {
    console.warn(
      '[Local DB] Could not detect WSL IP, defaulting to 192.168.19.225',
    );
    wslIp = '192.168.19.225';
  }

  console.log(`[Local DB] WSL IP detected: ${wslIp}`);

  function createProxy(localPort, remotePort, name) {
    const server = net.createServer((clientSocket) => {
      const remoteSocket = net.connect(remotePort, wslIp);
      clientSocket.pipe(remoteSocket);
      remoteSocket.pipe(clientSocket);

      clientSocket.on('error', () => {});
      remoteSocket.on('error', (err) => {
        console.error(
          `[Local DB] Remote ${name} (${wslIp}:${remotePort}) error:`,
          err.message,
        );
      });
    });

    server.listen(localPort, '0.0.0.0', () => {
      console.log(
        `[Local DB] Ready: localhost:${localPort} -> ${wslIp}:${remotePort} (${name})`,
      );
    });

    server.on('error', (err) => {
      console.error(
        `[Local DB] Bind error on port ${localPort} (${name}):`,
        err.message,
      );
    });
  }

  createProxy(5432, 5432, 'PostgreSQL');
  createProxy(6379, 6379, 'Redis');
}, 2500);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Local DB] Shutting down...');
  wslProcess.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('[Local DB] Terminating...');
  wslProcess.kill();
  process.exit(0);
});
