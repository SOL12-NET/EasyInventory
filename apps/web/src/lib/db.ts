import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

export const hasDbConfig = Boolean(databaseUrl);

// Create database connection if DATABASE_URL is provided
export const pool = hasDbConfig ? new pg.Pool({ connectionString: databaseUrl }) : null;
export const db = pool ? drizzle(pool, { schema }) : null;
