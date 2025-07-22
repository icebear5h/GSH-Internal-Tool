import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // 1) pull in Next.js’ defaults
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 2) then override / disable whatever rules you need
  {
    rules: {
      // disable unescaped‑entity errors globally
      "react/no-unescaped-entities": "off",

      // or turn them into warnings:
      // "react/no-unescaped-entities": "warn",

      // disable plain <img> warnings
      "@next/next/no-img-element": "off",

      // either disable or relax hook exhaustive‑deps
      "react-hooks/exhaustive-deps": ["error",
        {
          // you can fine‑tune per‑hook if you like
          additionalHooks: "(useMyCustomHook)"
        }
      ],

      // disable typescript-explicit-any if you want
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];