/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  settings: {
    react: { version: '18.3' },
    'import/resolver': {
      typescript: { alwaysTryTypes: true, project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'] },
      node: true,
    },
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**/*.ts', '**/tests/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.turbo',
    '*.config.ts',
    '*.config.js',
    '*.config.cjs',
  ],
};
