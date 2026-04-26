import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      "tests/**/*_test.ts",
      "tests/**/*_test.tsx",
    ],
    exclude: [
      // Skip Rust integration tests that share the tests/ directory.
      "tests/**/*.rs",
      // ai_sidebar_test.tsx depends on @testing-library/user-event which is
      // not in package.json yet (would need a deps approval) — superseded by
      // tests/ai-sidebar.test.ts which exercises the same Tauri command
      // contract via mocked invoke.
      "tests/ai_sidebar_test.tsx",
    ],
    setupFiles: [],
  },
});
