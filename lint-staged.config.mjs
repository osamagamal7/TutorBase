import path from 'node:path';

const root = process.cwd();

function rel(files, dir) {
  return files.map((file) => path.relative(path.join(root, dir), file)).join(' ');
}

export default {
  'apps/web/**/*.{js,jsx,ts,tsx,mjs}': (files) => [
    `pnpm --dir apps/web exec eslint --fix ${rel(files, 'apps/web')}`,
    `prettier --write ${files.join(' ')}`,
  ],
  'apps/api/**/*.ts': (files) => [
    `pnpm --dir apps/api exec oxlint --fix --type-aware ${rel(files, 'apps/api')}`,
    `prettier --write ${files.join(' ')}`,
  ],
  'packages/shared/**/*.ts': 'prettier --write',
  '**/*.{json,md,yml,yaml,css}': 'prettier --write',
};