import { RuleTester, type Rule } from "eslint";
import * as parser from "@typescript-eslint/parser";
import { describe, it } from "vitest";

const noInlineLiveRegions = {
  meta: { type: "problem" as const, schema: [] },
  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      JSXAttribute(node: Rule.Node): void {
        const attr = node as unknown as {
          name: { name: string };
          value?: { type: string; value: unknown };
        };
        if (attr.name.name === "aria-live") {
          context.report({
            node,
            message:
              "Use announce() from src/lib/announce.ts instead of aria-live. Inline live regions are unreliable on Windows screen readers.",
          });
        }
        if (
          attr.name.name === "role" &&
          attr.value?.type === "Literal" &&
          (attr.value.value === "alert" || attr.value.value === "status")
        ) {
          context.report({
            node,
            message: `Use announce() from src/lib/announce.ts instead of role="${attr.value.value}". Inline live regions are unreliable on Windows screen readers.`,
          });
        }
      },
    };
  },
};

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

describe("local/no-inline-live-regions", () => {
  // oxlint-disable-next-line jest/expect-expect
  it("reports aria-live attribute", () => {
    ruleTester.run("no-inline-live-regions", noInlineLiveRegions, {
      valid: [
        { code: `<div className="foo">test</div>` },
        { code: `<div role="button">test</div>` },
        { code: `<div role="main">test</div>` },
      ],
      invalid: [
        {
          code: `<div aria-live="polite">test</div>`,
          errors: [{ message: /Use announce\(\)/.source }],
        },
        {
          code: `<div aria-live="assertive">test</div>`,
          errors: [{ message: /Use announce\(\)/.source }],
        },
        {
          code: `<div role="alert">test</div>`,
          errors: [{ message: /Use announce\(\)/.source }],
        },
        {
          code: `<div role="status">test</div>`,
          errors: [{ message: /Use announce\(\)/.source }],
        },
      ],
    });
  });
});
