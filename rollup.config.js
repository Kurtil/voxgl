import { terser } from "rollup-plugin-terser";

const isProduction = (process.env.BUILD === "production");

export default {
  input: "src/main.js",
  output: [{
    name: "voxgl",
    file: "dist/voxgl.js",
    format: "umd"
  }, {
    file: "dist/voxgl.esm.js",
    format: "es"
  }],
  plugins: [
    isProduction ? terser() : null
  ]
};