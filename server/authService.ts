import bcrypt from "bcrypt";
import { db } from "./db";
import { users, type User, type LoginInput } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const SALT_ROUNDS = 10;

export async function createUser(input: { username: string; password: string; displayName?: string; role?: string }): Promise<User> {
  const { username, password, displayName, role } = input;
  
  // Check if username already exists
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    throw new Error("Username already taken");
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  // Create user
  const [newUser] = await db.insert(users).values({
    username,
    passwordHash,
    displayName: displayName || username,
    role: role || "user",
  }).returning();
  
  return newUser;
}

export async function ensureDefaultAdmin(): Promise<void> {
  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
  const count = Number(userCount[0]?.count || 0);
  
  if (count === 0) {
    console.log("Creating default admin user...");
    await createUser({
      username: "admin",
      password: "password",
      displayName: "Administrator",
      role: "admin",
    });
    console.log("Default admin user created (username: admin, password: password)");
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, userId)).returning();
  return result.length > 0;
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const result = await db.update(users).set({ passwordHash }).where(eq(users.id, userId)).returning();
  return result.length > 0;
}

export async function loginUser(input: LoginInput): Promise<User | null> {
  const { username, password } = input;
  
  // Find user by username
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) {
    return null;
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }
  
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users);
}

export async function getUserCount(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result[0]?.count || 0);
}
