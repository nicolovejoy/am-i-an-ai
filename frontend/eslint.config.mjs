import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a compatibility layer for older configs
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: { extends: [] },
});

export default [
  // Exclude build and dependency directories
  {
    ignores: [".next/**/*", "node_modules/**/*", "out/**/*"],
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
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // Special configuration for API files that need more flexibility
  {
    files: ["**/lib/api.ts", "**/services/api.ts"],
    rules: {
      "no-console": "warn",
    },
  },
];
