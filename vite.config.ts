import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        review: resolve(__dirname, "review.html"),
        effectReview: resolve(__dirname, "effect-review.html")
      }
    }
  },
  test: {
    environment: "node",
    include: ["api/**/*.test.ts", "src/**/*.test.ts", "tests/**/*.test.ts"]
  }
});
