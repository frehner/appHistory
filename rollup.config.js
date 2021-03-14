import { babel } from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";

const extensions = [".ts", ".js"];

export default {
  input: "src/index.ts",
  output: {
    dir: "./build/",
    format: "es",
  },
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
