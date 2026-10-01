// ESLint flat config (ESLint 9).
//
// Why this file exists: `next lint` was REMOVED in Next 16, and this repo had no
// ESLint installed at all (not even in the lockfile). The previous
// `"lint": "next lint"` script therefore could never have worked — it was not a
// failing gate, it was a gate with no tool behind it.
//
// Scope note: this intentionally enables correctness rules only. The pre-existing
// codebase has never been linted, so switching on the full Next/stylistic preset
// would surface thousands of pre-existing findings and destroy the gate's value
// as a signal for NEW changes. Correctness first; widening is a separate,
// reviewable change with its own cleanup commit.
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';

// TypeScript/TSX must be parsed by the TS parser, or every `interface` and every
// type annotation is reported as a parse error. Rule overrides for TS rules must
// live in the SAME config object that declares the @typescript-eslint plugin,
// which is why they are merged here rather than set in a later object.
const tsConfigs = tseslint.configs.recommended.map(c => ({
  ...c,
  files: ['**/*.{ts,tsx}'],
  rules: {
    ...(c.rules || {}),
    // The codebase never had a linter; these are advisory rather than blockers.
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
  },
}));

export default [
  {
    ignores: [
      '.next/**',
      '.next-prod/**',
      'node_modules/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
  ...tsConfigs,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
