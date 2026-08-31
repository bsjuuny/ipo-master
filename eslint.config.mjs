import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

// eslint-config-next@15.5.24 still ships core-web-vitals.js/typescript.js as
// legacy eslintrc-shaped shareable configs (an object, not a flat-config array) -
// unlike the 16.x line, which exports flat-config arrays directly. FlatCompat is
// the standard bridge for using a legacy shareable config under ESLint 9's flat
// config (this is what `create-next-app` itself generates for this Next version).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;