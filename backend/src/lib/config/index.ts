import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default(3000),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string(),
  BASE_URL: z.url().optional(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
}).transform((env) => {
  if (!env.BASE_URL) {
    if (env.NODE_ENV !== 'production') {
      env.BASE_URL = `http://localhost:${env.PORT}`;
    }
  } else if (!env.BASE_URL.startsWith('http://') && !env.BASE_URL.startsWith('https://')) {
    // Force valid protocol if missing, assuming http:// for local
    env.BASE_URL = `http://${env.BASE_URL}`;
  }
  return env;
}).refine((env) => !!env.BASE_URL, {
  message: "BASE_URL is required in production environment",
  path: ["BASE_URL"],
});

const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('❌ Invalid environment variables:', envVars.error.format());
  process.exit(1);
}

const config = {
  ...envVars.data,
  BASE_URL: envVars.data.BASE_URL as string, // Type assertion since it's guaranteed by refine
};

export type Config = typeof config;

export default config;