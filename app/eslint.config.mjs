// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const config = [
  {
    ignores: [
      'src/**/*.mjs',
      'src/**/*.d.*',
      '**/*.log',
      '**/.DS_Store',
      '*.',
      '.vscode/settings.json',
      '.history',
      '.yarn',
      'bazel-*',
      'bazel-bin',
      'bazel-out',
      'bazel-qwik',
      'bazel-testlogs',
      'dist',
      'dist-dev',
      'lib',
      'lib-types',
      'etc',
      'external',
      'node_modules',
      'temp',
      'tsc-out',
      'tsdoc-metadata.json',
      'target',
      'output',
      'rollup.config.js',
      'build',
      '.cache',
      '.vscode',
      '.rollup.cache',
      'dist',
      'tsconfig.tsbuildinfo',
      'vite.config.ts',
      '*.spec.tsx',
      '*.spec.ts',
      '.netlify',
      'pnpm-lock.yaml',
      'package-lock.json',
      'yarn.lock',
      'server',
      '.serverless',
    ],
  },
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
  ),
];
export default config;
