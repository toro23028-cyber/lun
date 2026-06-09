import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-redirects",
      closeBundle() {
        writeFileSync("dist/_redirects", "/* /index.html 200\n");
      },
    },
  ],
});
