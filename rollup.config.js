import { babel } from "@rollup/plugin-babel";

export default {
  input: "src/appHistory.ts",
  output: {
    dir: "./build/",
    format: "es",
  },
  plugins: [
    babel({
      extensions: [".ts", ".js"],
    }),
  ],
};
