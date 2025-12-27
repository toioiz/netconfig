import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDeviceSchema, insertVlanSchema, insertLacpGroupSchema, updateInterfaceSchema, registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { permissionStorage } from "./permissionStorage";
import { registerUser, loginUser, getUserById } from "./authService";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup session store with PostgreSQL
  const PgSession = connectPgSimple(session);
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "netconfig-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "lax",
      },
    })
  );

  // Authentication middleware
  const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await getUserById(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "Unauthorized" });
    }
    (req as any).user = user;
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const user = await registerUser(parsed);
      req.session.userId = user.id;
      res.status(201).json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Validation error" });
      }
      if (error.message === "Username already taken") {
        return res.status(409).json({ error: "Username already taken" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const user = await loginUser(parsed);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      req.session.userId = user.id;
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0]?.message || "Validation error" });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
  });

  // Permission check middleware
  const checkDeviceAccess = (permission: "read" | "write" | "delete") => {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        // Get device ID from params
        const deviceId = req.params.deviceId || req.params.id;
        if (!deviceId) {
          return next();
        }

        // Check if user is admin
        if (req.user?.role === "admin") {
          return next();
        }

        // Check specific permission
        const hasAccess = await permissionStorage.checkPermission(userId, deviceId, permission);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this device" });
        }

        next();
      } catch (error) {
        res.status(500).json({ error: "Permission check failed" });
      }
    };
  };
  
  // Stats
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Devices - Get all devices (filter by user permissions)
  app.get("/api/devices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      
      let devices = await storage.getDevices();
      
      // If not admin, filter by permissions
      if (userRole !== "admin") {
        const permissions = await permissionStorage.getDevicePermissions(userId);
        const allowedDeviceIds = permissions
          .filter(p => p.canRead)
          .map(p => p.deviceId);
        devices = devices.filter(d => allowedDeviceIds.includes(d.id));
      }
      
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: "Failed to get devices" });
    }
  });

  app.get("/api/devices/:id", isAuthenticated, checkDeviceAccess("read"), async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: "Failed to get device" });
    }
  });

  app.post("/api/devices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      
      // Only admins can create devices
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Only administrators can create devices" });
      }
      
      const parsed = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(parsed);
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create device" });
    }
  });

  app.patch("/api/devices/:id", isAuthenticated, checkDeviceAccess("write"), async (req, res) => {
    try {
      const device = await storage.updateDevice(req.params.id, req.body);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ error: "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", isAuthenticated, checkDeviceAccess("delete"), async (req, res) => {
    try {
      const deleted = await storage.deleteDevice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  // Interfaces
  app.get("/api/devices/:deviceId/interfaces", isAuthenticated, checkDeviceAccess("read"), async (req, res) => {
    try {
      const interfaces = await storage.getInterfaces(req.params.deviceId);
      res.json(interfaces);
    } catch (error) {
      res.status(500).json({ error: "Failed to get interfaces" });
    }
  });

  app.patch("/api/interfaces/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Validate update fields
      const allowedFields = ["speed", "duplex", "mode", "status", "accessVlan", "trunkAllowedVlans", "nativeVlan", "lacpGroupId", "description"];
      const validSpeeds = ["auto", "10M", "100M", "1G", "10G", "25G", "40G", "100G"];
      const validModes = ["access", "trunk"];
      const validStatuses = ["up", "down", "disabled"];
      const validDuplexes = ["auto", "full", "half"];

      const updates: Record<string, any> = {};
      for (const key of Object.keys(req.body)) {
        if (!allowedFields.includes(key)) continue;
        const value = req.body[key];
        if (key === "speed" && !validSpeeds.includes(value)) {
          return res.status(400).json({ error: `Invalid speed value: ${value}` });
        }
        if (key === "mode" && !validModes.includes(value)) {
          return res.status(400).json({ error: `Invalid mode value: ${value}` });
        }
        if (key === "status" && !validStatuses.includes(value)) {
          return res.status(400).json({ error: `Invalid status value: ${value}` });
        }
        if (key === "duplex" && !validDuplexes.includes(value)) {
          return res.status(400).json({ error: `Invalid duplex value: ${value}` });
        }
        updates[key] = value;
      }

      // Get interface to check device permission
      const existingIface = await storage.getInterface(req.params.id);
      if (!existingIface) {
        return res.status(404).json({ error: "Interface not found" });
      }

      // Check write permission for device
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      if (userRole !== "admin") {
        const hasAccess = await permissionStorage.checkPermission(userId, existingIface.deviceId, "write");
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this device" });
        }
      }

      const iface = await storage.updateInterface(req.params.id, updates);
      res.json(iface);
    } catch (error) {
      res.status(500).json({ error: "Failed to update interface" });
    }
  });

  app.post("/api/interfaces/bulk-update", isAuthenticated, async (req: any, res) => {
    try {
      const { ids, updates } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "IDs array is required and cannot be empty" });
      }
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Updates object is required" });
      }

      // Validate update fields
      const allowedFields = ["speed", "duplex", "mode", "status", "accessVlan", "trunkAllowedVlans", "nativeVlan", "lacpGroupId", "description"];
      const validSpeeds = ["auto", "10M", "100M", "1G", "10G", "25G", "40G", "100G"];
      const validModes = ["access", "trunk"];
      const validStatuses = ["up", "down", "disabled"];
      const validDuplexes = ["auto", "full", "half"];

      const validUpdates: Record<string, any> = {};
      for (const key of Object.keys(updates)) {
        if (!allowedFields.includes(key)) continue;
        const value = updates[key];
        if (key === "speed" && !validSpeeds.includes(value)) {
          return res.status(400).json({ error: `Invalid speed value: ${value}` });
        }
        if (key === "mode" && !validModes.includes(value)) {
          return res.status(400).json({ error: `Invalid mode value: ${value}` });
        }
        if (key === "status" && !validStatuses.includes(value)) {
          return res.status(400).json({ error: `Invalid status value: ${value}` });
        }
        if (key === "duplex" && !validDuplexes.includes(value)) {
          return res.status(400).json({ error: `Invalid duplex value: ${value}` });
        }
        validUpdates[key] = value;
      }

      // Verify all interfaces belong to the same device
      const firstInterface = await storage.getInterface(ids[0]);
      if (!firstInterface) {
        return res.status(404).json({ error: "One or more interfaces not found" });
      }
      const deviceId = firstInterface.deviceId;

      // Check write permission for device
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      if (userRole !== "admin") {
        const hasAccess = await permissionStorage.checkPermission(userId, deviceId, "write");
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this device" });
        }
      }

      for (const id of ids) {
        const iface = await storage.getInterface(id);
        if (!iface) {
          return res.status(404).json({ error: `Interface ${id} not found` });
        }
        if (iface.deviceId !== deviceId) {
          return res.status(400).json({ error: "All interfaces must belong to the same device" });
        }
      }

      const interfaces = await storage.bulkUpdateInterfaces(ids, validUpdates);
      res.json(interfaces);
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk update interfaces" });
    }
  });

  // VLANs
  app.get("/api/devices/:deviceId/vlans", isAuthenticated, checkDeviceAccess("read"), async (req, res) => {
    try {
      const vlans = await storage.getVlans(req.params.deviceId);
      res.json(vlans);
    } catch (error) {
      res.status(500).json({ error: "Failed to get VLANs" });
    }
  });

  app.post("/api/vlans", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertVlanSchema.parse(req.body);
      
      // Check write permission for device
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      if (userRole !== "admin") {
        const hasAccess = await permissionStorage.checkPermission(userId, parsed.deviceId, "write");
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this device" });
        }
      }
      
      const vlan = await storage.createVlan(parsed);
      res.status(201).json(vlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create VLAN" });
    }
  });

  app.delete("/api/vlans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const vlan = await storage.getVlan(req.params.id);
      if (!vlan) {
        return res.status(404).json({ error: "VLAN not found" });
      }
      
      // Check delete permission for device
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      if (userRole !== "admin") {
        const hasAccess = await permissionStorage.checkPermission(userId, vlan.deviceId, "write");
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this device" });
        }
      }
      
      await storage.deleteVlan(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete VLAN" });
    }
  });

  // LACP Groups
  app.get("/api/devices/:deviceId/lacp", isAuthenticated, checkDeviceAccess("read"), async (req, res) => {
    try {
      const groups = await storage.getLacpGroups(req.params.deviceId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to get LACP groups" });
    }
  });

  app.post("/api/lacp", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = insertLacpGroupSchema.parse(req.body);
      
      // Check write permission for device
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      if (userRole !== "admin") {
        const hasAccess = await permissionStorage.checkPermission(userId, parsed.deviceId, "write");
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this device" });
        }
      }
      
      const group = await storage.createLacpGroup(parsed);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create LACP group" });
    }
  });

  app.delete("/api/lacp/:id", isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getLacpGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "LACP group not found" });
      }
      
      // Check write permission for device
      const userId = req.user?.id;
      const userRole = await permissionStorage.getUserRole(userId);
      if (userRole !== "admin") {
        const hasAccess = await permissionStorage.checkPermission(userId, group.deviceId, "write");
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied to this device" });
        }
      }
      
      await storage.deleteLacpGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete LACP group" });
    }
  });

  // Config generation and import
  app.get("/api/devices/:deviceId/config", isAuthenticated, checkDeviceAccess("read"), async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.deviceId);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }

      const interfaces = await storage.getInterfaces(req.params.deviceId);
      const vlans = await storage.getVlans(req.params.deviceId);
      const lacpGroups = await storage.getLacpGroups(req.params.deviceId);

      let config = "";

      if (device.vendor === "cisco") {
        config = generateCiscoConfig(device, interfaces, vlans, lacpGroups);
      } else {
        config = generateJuniperConfig(device, interfaces, vlans, lacpGroups);
      }

      res.json({ config });
    } catch (error) {
      res.status(500).json({ error: "Failed to get config" });
    }
  });

  app.post("/api/devices/:deviceId/generate-config", isAuthenticated, checkDeviceAccess("read"), async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.deviceId);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }

      const interfaces = await storage.getInterfaces(req.params.deviceId);
      const vlans = await storage.getVlans(req.params.deviceId);
      const lacpGroups = await storage.getLacpGroups(req.params.deviceId);

      let config = "";

      if (device.vendor === "cisco") {
        config = generateCiscoConfig(device, interfaces, vlans, lacpGroups);
      } else {
        config = generateJuniperConfig(device, interfaces, vlans, lacpGroups);
      }

      res.json({ config });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate config" });
    }
  });

  app.post("/api/devices/:deviceId/import-config", isAuthenticated, checkDeviceAccess("write"), async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.deviceId);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }

      const { configText } = req.body;
      if (!configText || typeof configText !== "string") {
        return res.status(400).json({ error: "Configuration text is required" });
      }

      // Parse the configuration based on vendor
      if (device.vendor === "cisco") {
        await parseCiscoConfig(req.params.deviceId, configText);
      } else {
        await parseJuniperConfig(req.params.deviceId, configText);
      }

      // Update device sync status
      await storage.updateDevice(req.params.deviceId, {
        status: "online",
        lastSyncedAt: new Date().toISOString(),
      });

      res.json({ success: true, message: "Configuration imported successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to import config" });
    }
  });

  // Permission Management Routes (Admin only)
  const requireAdmin = async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userRole = await permissionStorage.getUserRole(userId);
    if (userRole !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  // Get current user's role and permissions
  app.get("/api/me/permissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const role = await permissionStorage.getUserRole(userId);
      const permissions = await permissionStorage.getDevicePermissions(userId);
      res.json({ role, permissions });
    } catch (error) {
      res.status(500).json({ error: "Failed to get permissions" });
    }
  });

  // List all users (admin only)
  app.get("/api/admin/users", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const users = await permissionStorage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Get permissions for a device (admin only)
  app.get("/api/admin/devices/:deviceId/permissions", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const permissions = await permissionStorage.getUsersWithDeviceAccess(req.params.deviceId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get device permissions" });
    }
  });

  // Grant device access (admin only)
  app.post("/api/admin/permissions", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { userId, deviceId, canRead, canWrite, canDelete } = req.body;
      if (!userId || !deviceId) {
        return res.status(400).json({ error: "userId and deviceId are required" });
      }
      const permission = await permissionStorage.grantDeviceAccess({
        userId,
        deviceId,
        canRead: canRead ?? true,
        canWrite: canWrite ?? false,
        canDelete: canDelete ?? false,
      });
      res.status(201).json(permission);
    } catch (error) {
      res.status(500).json({ error: "Failed to grant permission" });
    }
  });

  // Revoke device access (admin only)
  app.delete("/api/admin/permissions/:userId/:deviceId", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { userId, deviceId } = req.params;
      const deleted = await permissionStorage.revokeDeviceAccess(userId, deviceId);
      if (!deleted) {
        return res.status(404).json({ error: "Permission not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to revoke permission" });
    }
  });

  // Set user role (admin only)
  app.patch("/api/admin/users/:userId/role", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'user'" });
      }
      await permissionStorage.setUserRole(req.params.userId, role);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  return httpServer;
}

function generateCiscoConfig(
  device: any,
  interfaces: any[],
  vlans: any[],
  lacpGroups: any[]
): string {
  const lines: string[] = [];

  lines.push("!");
  lines.push(`hostname ${device.hostname}`);
  lines.push("!");

  // VLANs
  if (vlans.length > 0) {
    lines.push("!");
    vlans.forEach((vlan) => {
      lines.push(`vlan ${vlan.vlanId}`);
      lines.push(` name ${vlan.name}`);
    });
  }

  // Port-channels (LACP)
  lacpGroups.forEach((group) => {
    lines.push("!");
    lines.push(`interface Port-channel${group.groupNumber}`);
    if (group.name) {
      lines.push(` description ${group.name}`);
    }
    const memberPorts = interfaces.filter((i) => i.lacpGroupId === group.id);
    if (memberPorts.some((p) => p.mode === "trunk")) {
      lines.push(" switchport mode trunk");
      const trunkVlans = [...new Set(memberPorts.flatMap((p) => p.trunkAllowedVlans))];
      if (trunkVlans.length > 0) {
        lines.push(` switchport trunk allowed vlan ${trunkVlans.join(",")}`);
      }
    }
  });

  // Interfaces
  interfaces.forEach((iface) => {
    lines.push("!");
    lines.push(`interface ${iface.name}`);
    if (iface.description) {
      lines.push(` description ${iface.description}`);
    }
    if (iface.status === "disabled") {
      lines.push(" shutdown");
    } else {
      lines.push(" no shutdown");
    }
    if (iface.speed !== "auto") {
      lines.push(` speed ${iface.speed.replace("G", "000").replace("M", "")}`);
    }
    if (iface.duplex !== "auto") {
      lines.push(` duplex ${iface.duplex}`);
    }
    if (iface.mode === "access") {
      lines.push(" switchport mode access");
      if (iface.accessVlan) {
        lines.push(` switchport access vlan ${iface.accessVlan}`);
      }
    } else {
      lines.push(" switchport mode trunk");
      if (iface.trunkAllowedVlans.length > 0) {
        lines.push(` switchport trunk allowed vlan ${iface.trunkAllowedVlans.join(",")}`);
      }
      if (iface.nativeVlan) {
        lines.push(` switchport trunk native vlan ${iface.nativeVlan}`);
      }
    }
    if (iface.lacpGroupId) {
      const group = lacpGroups.find((g) => g.id === iface.lacpGroupId);
      if (group) {
        lines.push(` channel-group ${group.groupNumber} mode ${group.mode}`);
      }
    }
  });

  lines.push("!");
  lines.push("end");

  return lines.join("\n");
}

function generateJuniperConfig(
  device: any,
  interfaces: any[],
  vlans: any[],
  lacpGroups: any[]
): string {
  const lines: string[] = [];

  lines.push("system {");
  lines.push(`    host-name ${device.hostname};`);
  lines.push("}");
  lines.push("");

  // VLANs
  if (vlans.length > 0) {
    lines.push("vlans {");
    vlans.forEach((vlan) => {
      lines.push(`    ${vlan.name} {`);
      lines.push(`        vlan-id ${vlan.vlanId};`);
      if (vlan.description) {
        lines.push(`        description "${vlan.description}";`);
      }
      lines.push("    }");
    });
    lines.push("}");
    lines.push("");
  }

  // Interfaces
  lines.push("interfaces {");
  interfaces.forEach((iface) => {
    const portName = iface.name.replace("ge-", "");
    lines.push(`    ${iface.name} {`);
    if (iface.description) {
      lines.push(`        description "${iface.description}";`);
    }
    if (iface.status === "disabled") {
      lines.push("        disable;");
    }
    if (iface.speed !== "auto") {
      lines.push(`        speed ${iface.speed.toLowerCase()};`);
    }
    
    lines.push("        unit 0 {");
    lines.push("            family ethernet-switching {");
    if (iface.mode === "access") {
      lines.push("                interface-mode access;");
      if (iface.accessVlan) {
        const vlan = vlans.find((v) => v.vlanId === iface.accessVlan);
        if (vlan) {
          lines.push(`                vlan {`);
          lines.push(`                    members ${vlan.name};`);
          lines.push("                }");
        }
      }
    } else {
      lines.push("                interface-mode trunk;");
      if (iface.trunkAllowedVlans.length > 0) {
        const vlanNames = iface.trunkAllowedVlans
          .map((vid: number) => vlans.find((v) => v.vlanId === vid)?.name)
          .filter(Boolean);
        if (vlanNames.length > 0) {
          lines.push("                vlan {");
          lines.push(`                    members [ ${vlanNames.join(" ")} ];`);
          lines.push("                }");
        }
      }
      if (iface.nativeVlan) {
        const nativeVlan = vlans.find((v) => v.vlanId === iface.nativeVlan);
        if (nativeVlan) {
          lines.push(`                native-vlan-id ${iface.nativeVlan};`);
        }
      }
    }
    lines.push("            }");
    lines.push("        }");

    if (iface.lacpGroupId) {
      const group = lacpGroups.find((g) => g.id === iface.lacpGroupId);
      if (group) {
        lines.push(`        ether-options {`);
        lines.push(`            802.3ad ae${group.groupNumber};`);
        lines.push("        }");
      }
    }

    lines.push("    }");
  });

  // Aggregated ethernet interfaces
  lacpGroups.forEach((group) => {
    lines.push(`    ae${group.groupNumber} {`);
    if (group.name) {
      lines.push(`        description "${group.name}";`);
    }
    lines.push("        aggregated-ether-options {");
    lines.push(`            minimum-links ${group.minLinks};`);
    lines.push("            lacp {");
    lines.push(`                ${group.mode};`);
    lines.push("            }");
    lines.push("        }");
    lines.push("    }");
  });

  lines.push("}");

  return lines.join("\n");
}

async function parseCiscoConfig(deviceId: string, configText: string): Promise<void> {
  const lines = configText.split("\n");
  
  // Parse VLANs
  const vlanRegex = /^vlan (\d+)/;
  const vlanNameRegex = /^\s*name (.+)/;
  
  let currentVlan: { vlanId: number; name: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    const vlanMatch = line.match(vlanRegex);
    if (vlanMatch) {
      if (currentVlan) {
        await storage.createVlan({
          deviceId,
          vlanId: currentVlan.vlanId,
          name: currentVlan.name || `VLAN${currentVlan.vlanId}`,
          description: "",
        });
      }
      currentVlan = { vlanId: parseInt(vlanMatch[1]), name: "" };
      continue;
    }
    
    if (currentVlan) {
      const nameMatch = line.match(vlanNameRegex);
      if (nameMatch) {
        currentVlan.name = nameMatch[1];
      } else if (line.startsWith("vlan") || line.startsWith("interface") || line === "!") {
        await storage.createVlan({
          deviceId,
          vlanId: currentVlan.vlanId,
          name: currentVlan.name || `VLAN${currentVlan.vlanId}`,
          description: "",
        });
        currentVlan = null;
      }
    }
  }
  
  if (currentVlan) {
    await storage.createVlan({
      deviceId,
      vlanId: currentVlan.vlanId,
      name: currentVlan.name || `VLAN${currentVlan.vlanId}`,
      description: "",
    });
  }
}

async function parseJuniperConfig(deviceId: string, configText: string): Promise<void> {
  // Simple VLAN parsing for Juniper
  const vlanRegex = /(\w+)\s*\{\s*vlan-id\s+(\d+)/g;
  let match;
  
  while ((match = vlanRegex.exec(configText)) !== null) {
    await storage.createVlan({
      deviceId,
      vlanId: parseInt(match[2]),
      name: match[1],
      description: "",
    });
  }
}
