// Archived pre-.NET migration. Kept for future review; not active.
// import "dotenv/config";
// import { z } from "zod";
// 
// const envSchema = z.object({
//   NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
//   DATABASE_URL: z.string().default("file:./dev.db"),
//   API_PORT: z.coerce.number().int().positive().default(4000),
//   WEB_ORIGIN: z.string().default("http://localhost:5173")
// });
// 
// export const env = envSchema.parse(process.env);
// 
// process.env.DATABASE_URL = env.DATABASE_URL;
// 