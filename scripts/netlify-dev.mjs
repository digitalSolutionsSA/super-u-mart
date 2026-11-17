#!/usr/bin/env node
/**
 * Runs `netlify dev` with polling file watchers.
 * The project lives on a network share (D: -> \\Server-pc\dssa), where native
 * file watching crashes the Netlify CLI ("UNKNOWN: unknown error, watch").
 *
 * Usage: npm run dev:netlify   (extra args are passed through)
 */
import { spawn } from 'node:child_process';

const quote = (a) => (/^[\w./:=@-]+$/.test(a) ? a : `"${a.replace(/"/g, '\\"')}"`);
const command = ['netlify', 'dev', ...process.argv.slice(2).map(quote)].join(' ');

const child = spawn(command, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    CHOKIDAR_USEPOLLING: '1',
    CHOKIDAR_INTERVAL: '500',
  },
});

child.on('exit', (code) => process.exit(code ?? 0));
