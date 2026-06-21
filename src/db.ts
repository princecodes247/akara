import { createSchema, defineSchemas, createDatabase } from "monarch-orm";
import { string, array, literal, objectId, boolean, mixed } from "monarch-orm/types";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const projectSchema = createSchema("projects", {
  name: string(),
  sourceRepos: array(string()),
  targetRepo: string().nullable(),
});

const releaseMappingSchema = createSchema("releaseMappings", {
  projectId: objectId(),
  sourceReleaseId: string(),
  targetReleaseId: string().optional(),
  status: literal("draft", "public").default("draft"),
  isCurrent: boolean().default(false),
  releaseData: mixed().optional(),
});

// Define schemas
export const schemas = defineSchemas({
  projectSchema,
  releaseMappingSchema,
});

// Initialize client
const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/akara_dev";
export const client = new MongoClient(uri);

// Initialize database
export const db = createDatabase(client.db(), schemas);
