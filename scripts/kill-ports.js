#!/usr/bin/env node

// Runs automatically before `npm run dev` / `npm start` (see the root package.json's
// `predev`/`prestart` hooks - npm runs pre<script> before <script> for you). A
// previous session's services that didn't shut down cleanly leave nodemon/node
// processes bound to these ports, which otherwise turns into EADDRINUSE on every
// single port, every time, until someone notices and kills them by hand.
const { execSync } = require('child_process');

const PORTS = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009];

const killOnWindows = () => {
  let output;
  try {
    output = execSync('netstat -ano', { encoding: 'utf8' });
  } catch (err) {
    console.error('[kill-ports] Could not run netstat, skipping:', err.message);
    return;
  }

  const portSet = new Set(PORTS.map(String));
  const pidToPorts = new Map();

  output.split(/\r?\n/).forEach((line) => {
    const parts = line.trim().split(/\s+/);
    // TCP lines: Proto  Local Address  Foreign Address  State  PID
    if (parts[0] !== 'TCP' || parts.length < 5) return;
    const [, localAddr, , state, pid] = parts;
    if (state !== 'LISTENING' || !pid || pid === '0') return;
    const localPort = localAddr.slice(localAddr.lastIndexOf(':') + 1);
    if (!portSet.has(localPort)) return;
    if (!pidToPorts.has(pid)) pidToPorts.set(pid, new Set());
    pidToPorts.get(pid).add(localPort);
  });

  if (pidToPorts.size === 0) {
    console.log('[kill-ports] All clear - no stray processes on ports 5000-5009.');
    return;
  }

  for (const [pid, ports] of pidToPorts) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`[kill-ports] Killed PID ${pid} (was holding port${ports.size > 1 ? 's' : ''} ${[...ports].join(', ')})`);
    } catch (err) {
      console.warn(`[kill-ports] Could not kill PID ${pid} (may have already exited): ${err.message}`);
    }
  }
};

const killOnUnix = () => {
  const pids = new Set();
  for (const port of PORTS) {
    try {
      const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
      out.split('\n').filter(Boolean).forEach((pid) => pids.add(pid));
    } catch {
      // lsof exits non-zero when nothing is listening on that port - nothing to do
    }
  }

  if (pids.size === 0) {
    console.log('[kill-ports] All clear - no stray processes on ports 5000-5009.');
    return;
  }

  for (const pid of pids) {
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      console.log(`[kill-ports] Killed PID ${pid}`);
    } catch (err) {
      console.warn(`[kill-ports] Could not kill PID ${pid} (may have already exited): ${err.message}`);
    }
  }
};

if (process.platform === 'win32') killOnWindows();
else killOnUnix();
