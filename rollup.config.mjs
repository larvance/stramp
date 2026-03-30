import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import {defineConfig} from "rollup";

export default defineConfig({
    input: "dist/ts/Stramp.js",
    output: [
        {
            file: "dist/index.js",
            format: "esm",
            sourcemap: true
        },
        {
            file: "dist/index.cjs",
            format: "cjs",
            exports: "named",
            sourcemap: true
        },
        {
            file: "dist/index.min.js",
            format: "esm",
            plugins: [terser()],
            sourcemap: true
        }
    ],
    plugins: [
        nodeResolve({
            preferBuiltins: false
        }),
        commonjs()
    ]
});