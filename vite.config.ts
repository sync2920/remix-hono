import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import devServer, { defaultOptions } from "@hono/vite-dev-server";
import esbuild from "esbuild";
import * as process from "process";

export default defineConfig((env) => {
  const currentEnv = {...process.env, ...loadEnv(env.mode, process.cwd())};
  console.log(currentEnv);
  return {
    define: {
      "SESSION_SECRET": JSON.stringify(currentEnv.SESSION_SECRET),
    },
    server: {
      port: 3000,
        https: {
        key: "./server/dev/key.pem",
          cert: "./server/dev/cert.pem",
      },
    },
    plugins: [
      devServer({
        injectClientScript: false,
        entry: "server/index.ts", // The file path of your server.
        exclude: [/^\/(app)\/.+/, ...defaultOptions.exclude],
      }),
      tsconfigPaths(),
      remix({
        serverBuildFile: "remix.mjs",
        buildEnd: async () => {
          await esbuild
            .build({
              // The final file name
              outfile: "build/server/index.mjs",
              // Our server entry point
              entryPoints: [process.env.NODE_ENV === "production" ? "server/production.ts" : "server/index.ts"],
              // Dependencies that should not be bundled
              // We import the remix build from "../build/server/remix.js", so no need to bundle it again
              external: ["./build/server/*"],
              platform: "node",
              format: "esm",
              // Don't include node_modules in the bundle
              packages: "external",
              bundle: true,
              logLevel: "info",
            })
            .catch((error: unknown) => {
              console.error(error);
              process.exit(1);
            });
        },
      }),
    ],
  }
});
