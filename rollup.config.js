import { babel } from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const extensions = [".ts", ".js"];

export default {
  input: "src/index.ts",
  output: [
    {
      file: "./build/esm/appHistory.js",
      format: "es",
      sourcemap: true,
    },
    {
      file: "./build/esm/appHistory.min.js",
      format: "es",
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  external: [/@babel\/runtime/],
  plugins: [
    resolve({ extensions }),
    babel({
      extensions,
      babelHelpers: "bundled",
      include: ["src/**/*"],
    }),
  ],
};
