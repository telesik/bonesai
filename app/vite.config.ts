import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

/** Короткий хэш коммита; «+» в конце — в рабочем дереве есть незакоммиченное. */
function gitHash(): string {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const dirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
    return dirty ? `${hash}+` : hash;
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    __GIT_HASH__: JSON.stringify(gitHash()),
  },
});
