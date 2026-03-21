import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "node",
    include: ["api/**/*.test.ts", "src/**/*.test.ts", "tests/**/*.test.ts"]
  }
});
