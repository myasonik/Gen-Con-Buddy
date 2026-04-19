import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

const noInlineLiveRegions = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name === "aria-live") {
          context.report({
            node,
            message:
              "Use announce() from src/lib/announce.ts instead of aria-live. Inline live regions are unreliable on Windows screen readers.",
          });
        }
        if (
          node.name.name === "role" &&
          node.value?.type === "Literal" &&
          (node.value.value === "alert" || node.value.value === "status")
        ) {
          context.report({
            node,
            message: `Use announce() from src/lib/announce.ts instead of role="${node.value.value}". Inline live regions are unreliable on Windows screen readers.`,
          });
        }
      },
    };
  },
};

export default [
  { ignores: ["dist", "public/mockServiceWorker.js", "src/routeTree.gen.ts"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      local: { rules: { "no-inline-live-regions": noInlineLiveRegions } },
    },
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "local/no-inline-live-regions": "error",
    },
  },
  eslintConfigPrettier,
];
