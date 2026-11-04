import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// lib/ の関数だけをテストする。画面のテストはしないので、React プラグインと jsdom は入れていない
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
