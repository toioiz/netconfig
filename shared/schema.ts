import { z } from "zod";

// Device Types
export const deviceVendors = ["cisco", "juniper"] as const;
export type DeviceVendor = (typeof deviceVendors)[number];

export const deviceStatusOptions = ["online", "offline", "syncing"] as const;
export type DeviceStatus = (typeof deviceStatusOptions)[number];

// Interface/Port Types
export const portStatusOptions = ["up", "down", "disabled"] as const;
export type PortStatus = (typeof portStatusOptions)[number];

export const portModeOptions = ["access", "trunk"] as const;
export type PortMode = (typeof portModeOptions)[number];

export const portSpeedOptions = ["auto", "10M", "100M", "1G", "10G", "25G", "40G", "100G"] as const;
export type PortSpeed = (typeof portSpeedOptions)[number];

export const duplexOptions = ["auto", "full", "half"] as const;
export type DuplexMode = (typeof duplexOptions)[number];

// LACP Types
export const lacpModeOptions = ["active", "passive"] as const;
export type LacpMode = (typeof lacpModeOptions)[number];

export const loadBalancingOptions = ["src-mac", "dst-mac", "src-dst-mac", "src-ip", "dst-ip", "src-dst-ip"] as const;
export type LoadBalancing = (typeof loadBalancingOptions)[number];

// Device Schema
export const deviceSchema = z.object({
  id: z.string(),
  hostname: z.string().min(1, "Hostname is required"),
  ipAddress: z.string().ip("Invalid IP address"),
  vendor: z.enum(deviceVendors),
  model: z.string().min(1, "Model is required"),
  status: z.enum(deviceStatusOptions),
  lastSyncedAt: z.string().nullable(),
});

export const insertDeviceSchema = deviceSchema.omit({ id: true, status: true, lastSyncedAt: true });

export type Device = z.infer<typeof deviceSchema>;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;

// Interface Schema
export const interfaceSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(portStatusOptions),
  speed: z.enum(portSpeedOptions),
  duplex: z.enum(duplexOptions),
  mode: z.enum(portModeOptions),
  accessVlan: z.number().nullable(),
  trunkAllowedVlans: z.array(z.number()),
  nativeVlan: z.number().nullable(),
  lacpGroupId: z.string().nullable(),
});

export const insertInterfaceSchema = interfaceSchema.omit({ id: true });
export const updateInterfaceSchema = interfaceSchema.partial().required({ id: true });

export type Interface = z.infer<typeof interfaceSchema>;
export type InsertInterface = z.infer<typeof insertInterfaceSchema>;
export type UpdateInterface = z.infer<typeof updateInterfaceSchema>;

// VLAN Schema
export const vlanSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  vlanId: z.number().min(1).max(4094),
  name: z.string().min(1, "VLAN name is required"),
  description: z.string(),
});

export const insertVlanSchema = vlanSchema.omit({ id: true });
export const updateVlanSchema = vlanSchema.partial().required({ id: true });

export type Vlan = z.infer<typeof vlanSchema>;
export type InsertVlan = z.infer<typeof insertVlanSchema>;
export type UpdateVlan = z.infer<typeof updateVlanSchema>;

// LACP Group Schema
export const lacpGroupSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  groupNumber: z.number().min(1).max(128),
  name: z.string(),
  mode: z.enum(lacpModeOptions),
  loadBalancing: z.enum(loadBalancingOptions),
  minLinks: z.number().min(1).max(16),
  maxLinks: z.number().min(1).max(16),
});

export const insertLacpGroupSchema = lacpGroupSchema.omit({ id: true });
export const updateLacpGroupSchema = lacpGroupSchema.partial().required({ id: true });

export type LacpGroup = z.infer<typeof lacpGroupSchema>;
export type InsertLacpGroup = z.infer<typeof insertLacpGroupSchema>;
export type UpdateLacpGroup = z.infer<typeof updateLacpGroupSchema>;

// Config Import Schema
export const configImportSchema = z.object({
  deviceId: z.string(),
  configText: z.string().min(1, "Configuration is required"),
});

export type ConfigImport = z.infer<typeof configImportSchema>;

// Re-export auth models for database migrations
export * from "./models/auth";
