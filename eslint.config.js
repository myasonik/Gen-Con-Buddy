import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

const noInlineLiveRegions = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === 'aria-live') {
          context.report({
            node,
            message: 'Use announce() from src/lib/announce.ts instead of aria-live. Inline live regions are unreliable on Windows screen readers.',
          })
        }
        if (
          node.name.name === 'role' &&
          node.value?.type === 'Literal' &&
          (node.value.value === 'alert' || node.value.value === 'status')
        ) {
          context.report({
            node,
            message: `Use announce() from src/lib/announce.ts instead of role="${node.value.value}". Inline live regions are unreliable on Windows screen readers.`,
          })
        }
      },
    }
  },
}

export default tseslint.config(
  { ignores: ['dist', 'public/mockServiceWorker.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      local: { rules: { 'no-inline-live-regions': noInlineLiveRegions } },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-nested-ternary': 'error',
      'local/no-inline-live-regions': 'error',
    },
  },
  eslintConfigPrettier,
)
