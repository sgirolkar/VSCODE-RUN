// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
      ],
      curly: 'warn',
      eqeqeq: 'warn',
      'no-throw-literal': 'warn',
      semi: 'warn',
    },
  },
  {
    files: ['src/webview.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        alert: 'readonly',
        console: 'readonly',
        acquireVsCodeApi: 'readonly',
      },
    },
    rules: {
      // Allow unused functions in webview.js as they're called from HTML
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-redeclare': 'off',
    },
  }
);
