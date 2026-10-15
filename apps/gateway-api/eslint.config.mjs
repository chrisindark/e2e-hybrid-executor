import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import prettierPlugin from 'eslint-plugin-prettier';
import promisePlugin from 'eslint-plugin-promise';
import securityPlugin from 'eslint-plugin-security';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        node: true,
        jest: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      jest: jestPlugin,
      prettier: prettierPlugin,
      promise: promisePlugin,
      security: securityPlugin,
      'simple-import-sort': simpleImportSort,
      sonarjs: sonarjsPlugin,
      unicorn: unicornPlugin,
      'unused-imports': unusedImports,
    },
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      ...tseslint.configs.recommended.rules,

      // Prettier
      'prettier/prettier': 'warn',

      // Import Rules
      'import/order': 'off', // Disable default import/order rules
      'simple-import-sort/imports': 'warn', // Sort imports
      'simple-import-sort/exports': 'warn', // Sort exports

      // Unused Imports
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/consistent-type-imports': 'warn', // Prefer `import type`
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // Discourage use of `any`
      '@typescript-eslint/no-duplicate-enum-values': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn', // Handled by `unused-imports`
      '@typescript-eslint/strict-boolean-expressions': 'warn', // Warn for loose truthy/falsey checks
      '@typescript-eslint/no-floating-promises': 'error', // Catch unhandled promises
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // Avoid redundant type assertions
      '@typescript-eslint/no-unsafe-argument': 'warn', // Disallow passing unsafe arguments to functions
      '@typescript-eslint/no-unsafe-member-access': 'warn', // Warn for unsafe member access
      '@typescript-eslint/no-unsafe-call': 'warn', // Disallow unsafe calls
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // Prefer ?? over ||
      '@typescript-eslint/prefer-optional-chain': 'warn', // Prefer optional chaining
      '@typescript-eslint/no-var-requires': 'off',
      'prefer-const': 'error', // Enforce using `const` when variables are not reassigned
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Restrict usage of console.log
      'padding-line-between-statements': [
        'warn',
        { blankLine: 'always', prev: '*', next: 'function' }, // new line before a function starts
        { blankLine: 'always', prev: '*', next: 'return' }, // new line before a return statement
        { blankLine: 'always', prev: '*', next: 'class' }, // new line before class
        { blankLine: 'always', prev: '*', next: 'if' }, // new line before an if statement
      ],
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.js',
      'eslint.config.js',
      '.eslintrc.js',
    ],
  },
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
];
