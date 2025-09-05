import { FlatCompat } from '@eslint/eslintrc';
import importPlugin from 'eslint-plugin-import';

/**
 * FlatCompat allows you to reuse old .eslintrc configs.
 * We still convert `plugins: [...]` into an object (new flat style).
 */
const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next'],
    plugins: {
      import: importPlugin, // ✅ use object instead of array
    },
  }),
  {
    ignores: ['**/.next/**', '**/node_modules/**'], // ✅ don’t lint build folders
    rules: {
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',

      // import plugin rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'off', // ✅ turn this off (avoids Next.js build errors)
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
    },
  },
];

export default eslintConfig;
