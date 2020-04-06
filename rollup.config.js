import { terser } from "rollup-plugin-terser";
import resolve from '@rollup/plugin-node-resolve';

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
    isProduction ? terser() : null,
    resolve({ browser: true })
  ]
};