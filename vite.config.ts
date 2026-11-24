import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // Relative base ensures GitHub Pages works cleanly under /<repo-name>/
  base: "./",
});
