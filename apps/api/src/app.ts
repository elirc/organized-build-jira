// Archived pre-.NET migration. Kept for future review; not active.
// import cors from "cors";
// import express, { type ErrorRequestHandler } from "express";
// import helmet from "helmet";
// import morgan from "morgan";
// import { ZodError } from "zod";
// import { env } from "./config/env.js";
// import { attachActor } from "./middleware/requestContext.js";
// import { healthRouter } from "./routes/health.js";
// import { projectRouter } from "./routes/projects.js";
// 
// export function createApp() {
//   const app = express();
// 
//   app.use(helmet());
//   app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
//   app.use(express.json({ limit: "1mb" }));
//   app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
//   app.use(attachActor);
// 
//   app.use(healthRouter);
//   app.use("/api", projectRouter);
// 
//   app.use((_req, res) => {
//     res.status(404).json({ error: { code: "NOT_FOUND", message: "Route was not found." } });
//   });
// 
//   const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
//     void _next;
// 
//     if (error instanceof ZodError) {
//       res.status(400).json({
//         error: {
//           code: "VALIDATION_ERROR",
//           message: "Request validation failed.",
//           details: error.flatten()
//         }
//       });
//       return;
//     }
// 
//     console.error(error);
//     res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Unexpected server error." } });
//   };
// 
//   app.use(errorHandler);
//   return app;
// }
// 