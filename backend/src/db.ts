import { createSchema, defineSchemas, createDatabase } from "monarch-orm";
import { string, array, literal, objectId, boolean, mixed } from "monarch-orm/types";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const userSchema = createSchema("users", {
  githubId: string(), // Using string for githubId to handle large numbers just in case
  username: string(),
  githubToken: string(),
});

const projectSchema = createSchema("projects", {
  name: string(),
  sourceRepos: array(string()),
  targetRepo: string().nullable(),
  userId: objectId().optional(),
});

const releaseMappingSchema = createSchema("releaseMappings", {
  projectId: objectId(),
  sourceReleaseId: string(),
  targetReleaseId: string().nullable(),
  status: literal("draft", "public").default("draft"),
  isCurrent: boolean().default(false),
  releaseData: mixed().optional(),
});

const stagedReleaseSchema = createSchema("stagedReleases", {
  projectId: objectId(),
  sourceReleaseId: string(),
  tag: string(),
  title: string(),
  body: string(),
  assets: array(mixed()),
  status: literal("draft", "public").default("draft"),
  targetReleaseId: string().nullable(),
  isCurrent: boolean().default(false),
  releaseData: mixed().optional(),
});

// Define schemas
export const schemas = defineSchemas({
  userSchema,
  projectSchema,
  releaseMappingSchema,
  stagedReleaseSchema,
});

// Initialize client
const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/akara_dev";
export const client = new MongoClient(uri);

// Initialize database
export const db = createDatabase(client.db(), schemas);
