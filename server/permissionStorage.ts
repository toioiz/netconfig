import { db } from "./db";
import { users, devicePermissions, type DevicePermission, type InsertDevicePermission } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IPermissionStorage {
  getUserRole(userId: string): Promise<string>;
  checkPermission(userId: string, deviceId: string, permission: "read" | "write" | "delete"): Promise<boolean>;
  getDevicePermissions(userId: string): Promise<DevicePermission[]>;
  getUsersWithDeviceAccess(deviceId: string): Promise<DevicePermission[]>;
  grantDeviceAccess(permission: InsertDevicePermission): Promise<DevicePermission>;
  revokeDeviceAccess(userId: string, deviceId: string): Promise<boolean>;
  updatePermission(id: string, updates: Partial<DevicePermission>): Promise<DevicePermission | null>;
  setUserRole(userId: string, role: string): Promise<void>;
  getAllUsers(): Promise<Array<{ id: string; email: string | null; firstName: string | null; lastName: string | null; role: string | null }>>;
}

class PermissionStorage implements IPermissionStorage {
  async getUserRole(userId: string): Promise<string> {
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    return user?.role || "user";
  }

  async checkPermission(userId: string, deviceId: string, permission: "read" | "write" | "delete"): Promise<boolean> {
    const [perm] = await db
      .select()
      .from(devicePermissions)
      .where(and(eq(devicePermissions.userId, userId), eq(devicePermissions.deviceId, deviceId)));

    if (!perm) return false;

    switch (permission) {
      case "read":
        return perm.canRead ?? false;
      case "write":
        return perm.canWrite ?? false;
      case "delete":
        return perm.canDelete ?? false;
      default:
        return false;
    }
  }

  async getDevicePermissions(userId: string): Promise<DevicePermission[]> {
    return db.select().from(devicePermissions).where(eq(devicePermissions.userId, userId));
  }

  async getUsersWithDeviceAccess(deviceId: string): Promise<DevicePermission[]> {
    return db.select().from(devicePermissions).where(eq(devicePermissions.deviceId, deviceId));
  }

  async grantDeviceAccess(permission: InsertDevicePermission): Promise<DevicePermission> {
    const [result] = await db
      .insert(devicePermissions)
      .values(permission)
      .onConflictDoUpdate({
        target: devicePermissions.id,
        set: {
          canRead: permission.canRead,
          canWrite: permission.canWrite,
          canDelete: permission.canDelete,
        },
      })
      .returning();
    return result;
  }

  async revokeDeviceAccess(userId: string, deviceId: string): Promise<boolean> {
    const result = await db
      .delete(devicePermissions)
      .where(and(eq(devicePermissions.userId, userId), eq(devicePermissions.deviceId, deviceId)))
      .returning();
    return result.length > 0;
  }

  async updatePermission(id: string, updates: Partial<DevicePermission>): Promise<DevicePermission | null> {
    const [result] = await db
      .update(devicePermissions)
      .set(updates)
      .where(eq(devicePermissions.id, id))
      .returning();
    return result || null;
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<Array<{ id: string; email: string | null; firstName: string | null; lastName: string | null; role: string | null }>> {
    return db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    }).from(users);
  }
}

export const permissionStorage = new PermissionStorage();
