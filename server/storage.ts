import type {
  Device,
  InsertDevice,
  Interface,
  InsertInterface,
  UpdateInterface,
  Vlan,
  InsertVlan,
  UpdateVlan,
  LacpGroup,
  InsertLacpGroup,
  UpdateLacpGroup,
  User,
  InsertUser,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined>;
  deleteDevice(id: string): Promise<boolean>;

  // Interfaces
  getInterfaces(deviceId: string): Promise<Interface[]>;
  getInterface(id: string): Promise<Interface | undefined>;
  createInterface(iface: InsertInterface): Promise<Interface>;
  updateInterface(id: string, updates: Partial<Interface>): Promise<Interface | undefined>;
  bulkUpdateInterfaces(ids: string[], updates: Partial<Interface>): Promise<Interface[]>;
  deleteInterfacesByDevice(deviceId: string): Promise<void>;

  // VLANs
  getVlans(deviceId: string): Promise<Vlan[]>;
  getAllVlans(): Promise<Vlan[]>;
  getVlan(id: string): Promise<Vlan | undefined>;
  createVlan(vlan: InsertVlan): Promise<Vlan>;
  updateVlan(id: string, updates: Partial<Vlan>): Promise<Vlan | undefined>;
  deleteVlan(id: string): Promise<boolean>;
  deleteVlansByDevice(deviceId: string): Promise<void>;

  // LACP Groups
  getLacpGroups(deviceId: string): Promise<LacpGroup[]>;
  getAllLacpGroups(): Promise<LacpGroup[]>;
  getLacpGroup(id: string): Promise<LacpGroup | undefined>;
  createLacpGroup(group: InsertLacpGroup): Promise<LacpGroup>;
  updateLacpGroup(id: string, updates: Partial<LacpGroup>): Promise<LacpGroup | undefined>;
  deleteLacpGroup(id: string): Promise<boolean>;
  deleteLacpGroupsByDevice(deviceId: string): Promise<void>;

  // Stats
  getStats(): Promise<{
    totalDevices: number;
    onlineDevices: number;
    totalVlans: number;
    totalLacpGroups: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private devices: Map<string, Device>;
  private interfaces: Map<string, Interface>;
  private vlans: Map<string, Vlan>;
  private lacpGroups: Map<string, LacpGroup>;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.interfaces = new Map();
    this.vlans = new Map();
    this.lacpGroups = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample devices
    const device1: Device = {
      id: randomUUID(),
      hostname: "switch-core-01",
      ipAddress: "192.168.1.1",
      vendor: "cisco",
      model: "Catalyst 9300",
      status: "online",
      lastSyncedAt: new Date().toISOString(),
    };

    const device2: Device = {
      id: randomUUID(),
      hostname: "switch-dist-02",
      ipAddress: "192.168.1.2",
      vendor: "juniper",
      model: "EX4300",
      status: "online",
      lastSyncedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    };

    const device3: Device = {
      id: randomUUID(),
      hostname: "switch-access-05",
      ipAddress: "192.168.1.5",
      vendor: "cisco",
      model: "Catalyst 2960X",
      status: "offline",
      lastSyncedAt: null,
    };

    this.devices.set(device1.id, device1);
    this.devices.set(device2.id, device2);
    this.devices.set(device3.id, device3);

    // Create sample interfaces for device1
    const portNames = [
      "GigabitEthernet0/1",
      "GigabitEthernet0/2",
      "GigabitEthernet0/3",
      "GigabitEthernet0/4",
      "GigabitEthernet0/5",
      "GigabitEthernet0/6",
      "GigabitEthernet0/7",
      "GigabitEthernet0/8",
      "TenGigabitEthernet0/1",
      "TenGigabitEthernet0/2",
    ];

    portNames.forEach((name, index) => {
      const iface: Interface = {
        id: randomUUID(),
        deviceId: device1.id,
        name,
        description: index < 4 ? "Server port" : "",
        status: index < 8 ? "up" : "down",
        speed: name.startsWith("Ten") ? "10G" : "1G",
        duplex: "full",
        mode: index < 6 ? "access" : "trunk",
        accessVlan: index < 6 ? 10 : null,
        trunkAllowedVlans: index >= 6 ? [10, 20, 30] : [],
        nativeVlan: index >= 6 ? 1 : null,
        lacpGroupId: null,
      };
      this.interfaces.set(iface.id, iface);
    });

    // Create sample VLANs for device1
    const vlan1: Vlan = {
      id: randomUUID(),
      deviceId: device1.id,
      vlanId: 10,
      name: "Production",
      description: "Production network",
    };

    const vlan2: Vlan = {
      id: randomUUID(),
      deviceId: device1.id,
      vlanId: 20,
      name: "Development",
      description: "Development network",
    };

    const vlan3: Vlan = {
      id: randomUUID(),
      deviceId: device1.id,
      vlanId: 30,
      name: "Management",
      description: "Management network",
    };

    this.vlans.set(vlan1.id, vlan1);
    this.vlans.set(vlan2.id, vlan2);
    this.vlans.set(vlan3.id, vlan3);

    // Create sample LACP group
    const lacpGroup: LacpGroup = {
      id: randomUUID(),
      deviceId: device1.id,
      groupNumber: 1,
      name: "Uplink-Bundle",
      mode: "active",
      loadBalancing: "src-dst-ip",
      minLinks: 1,
      maxLinks: 4,
    };

    this.lacpGroups.set(lacpGroup.id, lacpGroup);

    // Assign some interfaces to LACP group
    const interfaceArray = Array.from(this.interfaces.values());
    const tenGigInterfaces = interfaceArray.filter((i) =>
      i.name.startsWith("TenGigabitEthernet")
    );
    tenGigInterfaces.forEach((i) => {
      i.lacpGroupId = lacpGroup.id;
      this.interfaces.set(i.id, i);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Devices
  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: string): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = randomUUID();
    const device: Device = {
      ...insertDevice,
      id,
      status: "offline",
      lastSyncedAt: null,
    };
    this.devices.set(id, device);

    // Create default interfaces
    const portCount = 24;
    const portPrefix = insertDevice.vendor === "cisco" ? "GigabitEthernet0/" : "ge-0/0/";
    for (let i = 0; i < portCount; i++) {
      const iface: Interface = {
        id: randomUUID(),
        deviceId: id,
        name: `${portPrefix}${i + 1}`,
        description: "",
        status: "down",
        speed: "auto",
        duplex: "auto",
        mode: "access",
        accessVlan: 1,
        trunkAllowedVlans: [],
        nativeVlan: null,
        lacpGroupId: null,
      };
      this.interfaces.set(iface.id, iface);
    }

    // Create default VLAN 1
    const defaultVlan: Vlan = {
      id: randomUUID(),
      deviceId: id,
      vlanId: 1,
      name: "default",
      description: "Default VLAN",
    };
    this.vlans.set(defaultVlan.id, defaultVlan);

    return device;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    const updated = { ...device, ...updates };
    this.devices.set(id, updated);
    return updated;
  }

  async deleteDevice(id: string): Promise<boolean> {
    await this.deleteInterfacesByDevice(id);
    await this.deleteVlansByDevice(id);
    await this.deleteLacpGroupsByDevice(id);
    return this.devices.delete(id);
  }

  // Interfaces
  async getInterfaces(deviceId: string): Promise<Interface[]> {
    return Array.from(this.interfaces.values()).filter(
      (i) => i.deviceId === deviceId
    );
  }

  async getInterface(id: string): Promise<Interface | undefined> {
    return this.interfaces.get(id);
  }

  async createInterface(insertInterface: InsertInterface): Promise<Interface> {
    const id = randomUUID();
    const iface: Interface = { ...insertInterface, id };
    this.interfaces.set(id, iface);
    return iface;
  }

  async updateInterface(id: string, updates: Partial<Interface>): Promise<Interface | undefined> {
    const iface = this.interfaces.get(id);
    if (!iface) return undefined;
    const updated = { ...iface, ...updates };
    this.interfaces.set(id, updated);
    return updated;
  }

  async bulkUpdateInterfaces(ids: string[], updates: Partial<Interface>): Promise<Interface[]> {
    const result: Interface[] = [];
    for (const id of ids) {
      const updated = await this.updateInterface(id, updates);
      if (updated) result.push(updated);
    }
    return result;
  }

  async deleteInterfacesByDevice(deviceId: string): Promise<void> {
    const toDelete = Array.from(this.interfaces.entries())
      .filter(([_, i]) => i.deviceId === deviceId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.interfaces.delete(id));
  }

  // VLANs
  async getVlans(deviceId: string): Promise<Vlan[]> {
    return Array.from(this.vlans.values()).filter(
      (v) => v.deviceId === deviceId
    );
  }

  async getAllVlans(): Promise<Vlan[]> {
    return Array.from(this.vlans.values());
  }

  async getVlan(id: string): Promise<Vlan | undefined> {
    return this.vlans.get(id);
  }

  async createVlan(insertVlan: InsertVlan): Promise<Vlan> {
    const id = randomUUID();
    const vlan: Vlan = { ...insertVlan, id };
    this.vlans.set(id, vlan);
    return vlan;
  }

  async updateVlan(id: string, updates: Partial<Vlan>): Promise<Vlan | undefined> {
    const vlan = this.vlans.get(id);
    if (!vlan) return undefined;
    const updated = { ...vlan, ...updates };
    this.vlans.set(id, updated);
    return updated;
  }

  async deleteVlan(id: string): Promise<boolean> {
    return this.vlans.delete(id);
  }

  async deleteVlansByDevice(deviceId: string): Promise<void> {
    const toDelete = Array.from(this.vlans.entries())
      .filter(([_, v]) => v.deviceId === deviceId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.vlans.delete(id));
  }

  // LACP Groups
  async getLacpGroups(deviceId: string): Promise<LacpGroup[]> {
    return Array.from(this.lacpGroups.values()).filter(
      (g) => g.deviceId === deviceId
    );
  }

  async getAllLacpGroups(): Promise<LacpGroup[]> {
    return Array.from(this.lacpGroups.values());
  }

  async getLacpGroup(id: string): Promise<LacpGroup | undefined> {
    return this.lacpGroups.get(id);
  }

  async createLacpGroup(insertGroup: InsertLacpGroup): Promise<LacpGroup> {
    const id = randomUUID();
    const group: LacpGroup = { ...insertGroup, id };
    this.lacpGroups.set(id, group);
    return group;
  }

  async updateLacpGroup(id: string, updates: Partial<LacpGroup>): Promise<LacpGroup | undefined> {
    const group = this.lacpGroups.get(id);
    if (!group) return undefined;
    const updated = { ...group, ...updates };
    this.lacpGroups.set(id, updated);
    return updated;
  }

  async deleteLacpGroup(id: string): Promise<boolean> {
    // Remove LACP group from interfaces
    const interfaces = Array.from(this.interfaces.values()).filter(
      (i) => i.lacpGroupId === id
    );
    interfaces.forEach((i) => {
      i.lacpGroupId = null;
      this.interfaces.set(i.id, i);
    });
    return this.lacpGroups.delete(id);
  }

  async deleteLacpGroupsByDevice(deviceId: string): Promise<void> {
    const toDelete = Array.from(this.lacpGroups.entries())
      .filter(([_, g]) => g.deviceId === deviceId)
      .map(([id]) => id);
    toDelete.forEach((id) => this.lacpGroups.delete(id));
  }

  // Stats
  async getStats(): Promise<{
    totalDevices: number;
    onlineDevices: number;
    totalVlans: number;
    totalLacpGroups: number;
  }> {
    const devices = Array.from(this.devices.values());
    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.status === "online").length,
      totalVlans: this.vlans.size,
      totalLacpGroups: this.lacpGroups.size,
    };
  }
}

export const storage = new MemStorage();
