import { db } from "./db";
import { sql } from "drizzle-orm";

export async function initializeDatabase(): Promise<void> {
  console.log("Checking database tables...");
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR UNIQUE NOT NULL,
        password_hash VARCHAR NOT NULL,
        display_name VARCHAR,
        role VARCHAR DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS device_permissions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        device_id VARCHAR NOT NULL,
        can_read BOOLEAN DEFAULT true,
        can_write BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "IDX_device_permissions_user" ON device_permissions (user_id);
      CREATE INDEX IF NOT EXISTS "IDX_device_permissions_device" ON device_permissions (device_id);
    `);

    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
    throw error;
  }
}
