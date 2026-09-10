import base from "../../packages/config/eslint/base.js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  ...base,
  {
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/no-array-index-key": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
