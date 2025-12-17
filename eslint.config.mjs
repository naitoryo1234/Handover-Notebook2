import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Custom ignores:
    "main/**",           // Electron main process (CommonJS)
    "starters/**",       // Starter templates
    "scripts/**",        // Build scripts
    "history/**",        // Old history files
    "gem_planning/**",   // Planning docs
    "srccomponentsappointment/**", // Orphan folder
    "src/types/speech.d.ts", // Web Speech API type definitions
  ]),
]);

export default eslintConfig;
