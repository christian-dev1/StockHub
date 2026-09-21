// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      'no-console': 'error',
      // API URLs must come from core/config/routes/api.routes.ts.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^\\/api\\//], TemplateElement[value.raw=/^\\/api\\//]",
          message: 'Use API_ROUTES from core/config/routes/api.routes.ts instead of inline API URLs.',
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['src/app/core/logging/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.spec.ts', 'src/app/core/config/routes/api.routes.ts', 'src/environments/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
