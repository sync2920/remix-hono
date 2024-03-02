import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  type AppLoadContext,
  createCookieSessionStorage,
} from "@remix-run/node";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { remix } from "remix-hono/handler";
import { session } from "remix-hono/session";
import { cache } from "server/middlewares";
import { config } from "dotenv";

config();
console.log(process.env);

const app = new Hono();

/**
 * Serve assets files from build/client/assets
 */
app.use(
  "/assets/*",
  cache(60 * 60 * 24 * 365), // 1 year
  serveStatic({ root: "./build/client" })
);

/**
 * Serve public files
 */
app.use("*", cache(60 * 60), serveStatic({ root: "./build/client" })); // 1 hour

/**
 * Add logger middleware
 */
app.use("*", logger());

/**
 * Add session middleware (https://github.com/sergiodxa/remix-hono?tab=readme-ov-file#session-management)
 */
app.use(
  // @ts-expect-error - FIXME: require next remix-hono version
  session({
    autoCommit: true,
    createSessionStorage() {
      // if (!process.env.SESSION_SECRET) {
      //   throw new Error("SESSION_SECRET is not defined");
      // }

      const sessionStorage = createCookieSessionStorage({
        cookie: {
          name: "session",
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secrets: ["secret"],
          // secrets: [process.env.SESSION_SECRET],
          secure: process.env.NODE_ENV === "production",
        },
      });

      return {
        ...sessionStorage,
        // If a user doesn't come back to the app within 30 days, their session will be deleted.
        async commitSession(session) {
          return sessionStorage.commitSession(session, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        },
      };
    },
  })
);

/**
 * Add remix middleware to Hono server
 */
app.use(async (c, next) => {
  // eslint-disable-next-line import/no-unresolved -- this expected until you build the app
  const build = await import("../build/server/remix.mjs");

  return remix({
    build,
    mode: "production",
    getLoadContext() {
      return {
        appVersion: build.assets.version,
      } satisfies AppLoadContext;
    },
    // @ts-expect-error - FIXME: require next remix-hono version
  })(c, next);
});

/**
 * Start the production server
 */

serve(
  {
    ...app,
    port: Number(process.env.PORT) || 3000,
  }
);

export default app;

/**
 * Declare our loaders and actions context type
 */
declare module "@remix-run/node" {
  interface AppLoadContext {
    /**
     * The app version from the build assets
     */
    readonly appVersion: string;
  }
}
