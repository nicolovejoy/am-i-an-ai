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
  // Configuration for source files
  {
    files: ["**/*.ts"],
    ignores: ["**/*.test.ts", "**/tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
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
    },
    rules: {
      // Basic ESLint rules
      "no-unused-vars": "off", // Handled by TypeScript
      "no-console": "warn",
      "no-undef": "error",

      // Enforce functional programming patterns - using warning level during transition
      "functional/no-classes": "warn",
      "functional/no-this-expressions": "warn",
      "functional/no-let": "warn",
      "functional/immutable-data": "warn",
      "functional/readonly-type": "warn",
      "functional/no-loop-statements": "warn",
      "functional/prefer-tacit": "warn",

      // Enforce pure functions (no side effects) - using warning level during transition
      "functional/no-expression-statements": ["warn", { ignoreVoid: true }],
      "functional/functional-parameters": [
        "warn",
        { enforceParameterCount: false },
      ],

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",

      // Allow null assertions when necessary
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  // Configuration for test files
  {
    files: ["**/*.test.ts", "**/tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
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
    },
    rules: {
      // Relax rules for test files
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "functional/no-expression-statements": "off",
      "functional/immutable-data": "off",
      "functional/no-let": "off",
      "no-undef": "off", // Jest globals are defined
    },
  },
];
