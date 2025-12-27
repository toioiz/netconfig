import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for express-session
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table for local authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  displayName: varchar("display_name"),
  role: varchar("role").default("user"), // 'admin' or 'user'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Registration schema (for API validation)
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Device Permissions - ACL for user access to devices
export const devicePermissions = pgTable(
  "device_permissions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    deviceId: varchar("device_id").notNull(),
    canRead: boolean("can_read").default(true),
    canWrite: boolean("can_write").default(false),
    canDelete: boolean("can_delete").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_device_permissions_user").on(table.userId),
    index("IDX_device_permissions_device").on(table.deviceId),
  ]
);

export type DevicePermission = typeof devicePermissions.$inferSelect;
export type InsertDevicePermission = typeof devicePermissions.$inferInsert;
