import pluginQuery from '@tanstack/eslint-plugin-query';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
      // API URLs must come from src/core/config/routes/api.routes.ts.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^\\/api\\//], TemplateElement[value.raw=/^\\/api\\//]',
          message: 'Use API_ROUTES from core/config/routes/api.routes.ts instead of inline API URLs.',
        },
      ],
    },
  },
  {
    files: ['src/core/config/**', 'next.config.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
]);

export default eslintConfig;
