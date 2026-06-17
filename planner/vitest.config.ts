import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["src/**/*.test.ts"],
        coverage: {
            reporter: ["text", "html"],
            include: ["src/utils/**/*.ts", "src/engine/**/*.ts"],
        },
    },
});
