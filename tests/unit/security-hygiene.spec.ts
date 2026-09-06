import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { clearLegacySessions } from '../../src/auth/session';

async function filesUnder(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

describe('browser data hygiene', () => {
  it('removes legacy tokens while preserving the non-sensitive theme preference', () => {
    localStorage.setItem('auth_token', 'legacy-fixture');
    localStorage.setItem('user_id', 'legacy-user-fixture');
    localStorage.setItem('histae_theme', 'dark');
    sessionStorage.setItem('histae_admin_access_token', 'legacy-access-fixture');
    sessionStorage.setItem('histae_admin_refresh_token', 'legacy-refresh-fixture');

    clearLegacySessions();

    expect(localStorage.getItem('histae_theme')).toBe('dark');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_id')).toBeNull();
    expect(sessionStorage).toHaveLength(0);
  });

  it('keeps tokens, moderation content and personal data out of browser persistence and logs', async () => {
    const sourceFiles = (await filesUnder('src')).filter((path) => /\.(ts|tsx)$/.test(path));
    const source = (await Promise.all(sourceFiles.map((path) => readFile(path, 'utf8')))).join('\n')
      .replace("localStorage.setItem('histae_theme', next)", '');

    expect(source).not.toMatch(/(?:localStorage|sessionStorage)\.setItem\s*\(/);
    expect(source).not.toMatch(/console\.(?:log|info|warn|error|debug)\s*\(/);
  });

  it('contains no production-shaped secret in versioned test fixtures', async () => {
    const testFiles = (await filesUnder('tests')).filter((path) => /\.(ts|tsx)$/.test(path));
    const tests = (await Promise.all(testFiles.map((path) => readFile(path, 'utf8')))).join('\n');

    expect(tests).not.toMatch(/sk_live_[A-Za-z0-9]+/);
    expect(tests).not.toMatch(/Bearer\s+eyJ[A-Za-z0-9_-]+\./);
    expect(tests).not.toMatch(/\+33[1-9]\d{8}/);
  });
});
