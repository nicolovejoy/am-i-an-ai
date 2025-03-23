import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simplify the configuration to avoid circular references
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: { extends: [] },
});

export default [
  // Exclude the .next folder from linting
  {
    ignores: [".next/**/*", "node_modules/**/*"],
  },

  // Base configuration for all TypeScript/TSX files
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        React: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        window: "readonly",
        localStorage: "readonly",
      },
      parser: await (async () => {
        const { default: typescriptEstree } = await import(
          "@typescript-eslint/parser"
        );
        return typescriptEstree;
      })(),
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
    plugins: {
      "@typescript-eslint": await (async () => {
        const { default: typescriptEslint } = await import(
          "@typescript-eslint/eslint-plugin"
        );
        return typescriptEslint;
      })(),
      functional: await (async () => {
        const { default: functional } = await import(
          "eslint-plugin-functional"
        );
        return functional;
      })(),
      react: await (async () => {
        const { default: react } = await import("eslint-plugin-react");
        return react;
      })(),
      "react-hooks": await (async () => {
        const { default: reactHooks } = await import(
          "eslint-plugin-react-hooks"
        );
        return reactHooks;
      })(),
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Basic ESLint rules
      "no-unused-vars": "off", // Handled by TypeScript
      "no-console": "warn",
      "no-undef": "error",

      // Enforce functional programming patterns
      "functional/no-classes": "error",
      "functional/no-this-expressions": "error",
      "functional/no-let": "error",
      "functional/immutable-data": "error",
      "functional/readonly-type": "warn",
      "functional/no-loop-statements": "warn",

      // Less strict for React components
      "functional/no-expression-statements": "off",
      "functional/functional-parameters": "off",

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",

      // React specific rules
      "react/prefer-stateless-function": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Special configuration for test files
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/test/**/*.ts",
      "**/test/**/*.tsx",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    rules: {
      // Disable rules that are too restrictive for test files
      "no-undef": "off",
      "functional/no-expression-statements": "off",
      "functional/immutable-data": "off",
      "functional/no-let": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // Special configuration for API files that need more flexibility
  {
    files: ["**/lib/api.ts", "**/services/api.ts"],
    rules: {
      // Relax some functional rules for API modules
      "functional/no-let": "off",
      "no-console": "warn",
    },
  },
];
