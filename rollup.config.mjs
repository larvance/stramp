import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import {defineConfig} from "rollup";
import dts from "rollup-plugin-dts";

export default [
    defineConfig({
        input: "dist/ts/Stramp.js",
        output: [
            {
                file: "dist/index.js",
                format: "esm"
            },
            {
                file: "index.min.js",
                format: "esm",
                plugins: [terser()]
            }
        ],
        plugins: [
            nodeResolve({preferBuiltins: false}),
            commonjs()
        ]
    }),
    defineConfig({
        input: "dist/ts/Stramp.d.ts",
        output: {
            file: "index.d.ts",
            format: "es"
        },
        plugins: [dts()]
    })
];