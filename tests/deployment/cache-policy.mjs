import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = await mkdtemp(path.join(tmpdir(), 'histae-cache-test-'));
const upstream = createServer((request, response) => {
  const status = Number(new URL(request.url, 'http://localhost').searchParams.get('status') ?? 200);
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=31536000',
    'CDN-Cache-Control': 'public, max-age=31536000',
    'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000',
    'Surrogate-Control': 'max-age=31536000',
    Expires: 'Tue, 01 Jan 2030 00:00:00 GMT',
  });
  response.end('{}');
});
let caddy;

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

try {
  const upstreamPort = await listen(upstream);
  const reservation = createServer();
  const port = await listen(reservation);
  await new Promise((resolve) => reservation.close(resolve));
  const publicRoot = path.join(directory, 'public');
  await mkdir(path.join(publicRoot, 'assets'), { recursive: true });
  await writeFile(path.join(publicRoot, 'index.html'), '<!doctype html><title>Cache test</title>');
  await writeFile(path.join(publicRoot, 'assets', 'app-AbCd1234.js'), 'export const version = 1;');
  await writeFile(path.join(publicRoot, 'assets', 'app-AbCd1234.css'), 'body { color: black; }');
  await writeFile(path.join(publicRoot, 'assets', 'unversioned.js'), 'export const version = 1;');
  await copyFile(path.join(root, 'caddy-common.caddy'), path.join(directory, 'caddy-common.caddy'));
  const config = (await readFile(path.join(root, 'Caddyfile'), 'utf8'))
    .replace(':80 {', `http://127.0.0.1:${port} {`)
    .replace('root * /srv', `root * "${publicRoot.replaceAll('\\', '/')}"`);
  const configPath = path.join(directory, 'Caddyfile');
  await writeFile(configPath, config);
  let diagnostics = '';
  caddy = spawn(process.env.CADDY_BIN || 'caddy', ['run', '--config', configPath, '--adapter', 'caddyfile'], {
    windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'],
    env: { ...process.env, HISTAE_API_UPSTREAM: `http://127.0.0.1:${upstreamPort}`, XDG_CONFIG_HOME: directory, XDG_DATA_HOME: directory },
  });
  let startupError;
  caddy.on('error', (error) => { startupError = error; });
  caddy.stderr.on('data', (chunk) => { diagnostics = (diagnostics + chunk).slice(-8_000); });
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (startupError) throw startupError;
    if (caddy.exitCode !== null) throw new Error(`Caddy exited: ${diagnostics}`);
    try { ready = (await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(250) })).status === 204; } catch { /* Starting. */ }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.ok(ready, `Caddy did not start: ${diagnostics}`);

  for (const [url, status] of [
    ['/', 200], ['/login', 200], ['/index.html', 200], ['/healthz', 204],
    ['/assets/unversioned.js', 200], ['/assets/missing-AbCd1234.js', 404],
    ['/assets/app-AbCd1234.js.map', 404], ['/missing.js', 404],
    ['/api/cache-test?status=200', 200], ['/api/cache-test?status=401', 401], ['/api/cache-test?status=500', 500],
  ]) {
    const response = await fetch(base + url);
    await response.arrayBuffer();
    assert.equal(response.status, status, url);
    assert.equal(response.headers.get('cache-control'), 'no-store', url);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff', url);
    for (const header of ['cdn-cache-control', 'cloudflare-cdn-cache-control', 'surrogate-control', 'expires']) {
      assert.equal(response.headers.get(header), null, `${url}: ${header}`);
    }
  }
  for (const extension of ['js', 'css']) {
    const url = `${base}/assets/app-AbCd1234.${extension}`;
    const response = await fetch(url);
    assert.equal(response.status, 200);
    const etag = response.headers.get('etag');
    assert.ok(etag);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    await response.arrayBuffer();
    const head = await fetch(url, { method: 'HEAD' });
    assert.equal(head.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    const revalidated = await fetch(url, { headers: { 'If-None-Match': etag } });
    assert.equal(revalidated.status, 304);
    assert.equal(revalidated.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    const partial = await fetch(url, { headers: { Range: 'bytes=0-3' } });
    assert.equal(partial.status, 206);
    assert.equal(partial.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    await partial.arrayBuffer();
  }
  process.stdout.write('Cache policy passed: 11 private/error responses and 8 versioned asset responses.\n');
} finally {
  if (caddy && caddy.exitCode === null && caddy.pid) {
    const stopped = once(caddy, 'exit');
    caddy.kill();
    await stopped;
  }
  await new Promise((resolve) => upstream.close(resolve));
  assert.equal(path.dirname(directory), path.resolve(tmpdir()));
  assert.ok(path.basename(directory).startsWith('histae-cache-test-'));
  await rm(directory, { recursive: true, force: true });
}
