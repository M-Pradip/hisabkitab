import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

export const sql = postgres(connectionString, {
  ssl: "require",
  max: 1,
  idle_timeout: 20,
});

let schemaReadyPromise = null;

export async function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id text PRIMARY KEY,
        session jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `;
  }

  return schemaReadyPromise;
}
