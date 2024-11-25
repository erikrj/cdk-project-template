// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import appsync from '@aws-appsync/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.mts'],
  },
  {
    files: ['src/*.mts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        // ecmaFeatures: { modules: true },
        // ecmaVersion: 2018,
        project: './tsconfig.json',
      },
    },
    plugins: { '@aws-appsync': appsync },
    rules: {
      ...appsync.configs.recommended.rules
    },
  },
  {
    ignores: ['dist/**/*'],
  }
)

// const config = [
  // {
  //   ignores: ['dist/**']
  // },
  // ...tseslint.config(
  //   eslint.configs.recommended,
  //   ...tseslint.configs.recommended,
  // ),
  // {
  //   plugins: {
  //     '@aws-appsync': appsync,
  //   },
  // },
// ];

// export default config;
