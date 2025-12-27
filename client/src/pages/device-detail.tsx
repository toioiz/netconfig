import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StatusIndicator } from "@/components/status-indicator";
import { VendorBadge } from "@/components/vendor-badge";
import { ConfigViewer } from "@/components/config-viewer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Settings,
  Network,
  Layers,
  FileText,
  Server,
} from "lucide-react";
import type {
  Device,
  Interface,
  Vlan,
  LacpGroup,
  InsertVlan,
  InsertLacpGroup,
  UpdateInterface,
} from "@shared/schema";
import {
  insertVlanSchema,
  insertLacpGroupSchema,
  portSpeedOptions,
  portModeOptions,
  portStatusOptions,
  lacpModeOptions,
  loadBalancingOptions,
} from "@shared/schema";
import { z } from "zod";

function InterfacesTab({ deviceId }: { deviceId: string }) {
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const { toast } = useToast();

  const { data: interfaces, isLoading } = useQuery<Interface[]>({
    queryKey: ["/api/devices", deviceId, "interfaces"],
  });

  const { data: vlans } = useQuery<Vlan[]>({
    queryKey: ["/api/devices", deviceId, "vlans"],
  });

  const { data: lacpGroups } = useQuery<LacpGroup[]>({
    queryKey: ["/api/devices", deviceId, "lacp"],
  });

  const updateInterface = useMutation({
    mutationFn: async (data: UpdateInterface) => {
      const res = await apiRequest("PATCH", `/api/interfaces/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", deviceId, "interfaces"] });
      toast({ title: "Interface updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async (data: { ids: string[]; updates: Partial<Interface> }) => {
      const res = await apiRequest("POST", `/api/interfaces/bulk-update`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", deviceId, "interfaces"] });
      setSelectedPorts([]);
      setBulkEditOpen(false);
      toast({ title: "Interfaces updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const togglePort = (id: string) => {
    setSelectedPorts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (interfaces && selectedPorts.length === interfaces.length) {
      setSelectedPorts([]);
    } else if (interfaces) {
      setSelectedPorts(interfaces.map((i) => i.id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedPorts.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-md bg-muted p-3">
          <span className="text-sm font-medium">
            {selectedPorts.length} port{selectedPorts.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPorts([])}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setBulkEditOpen(true)}
              data-testid="button-bulk-edit"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Bulk Edit
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={interfaces && selectedPorts.length === interfaces.length && interfaces.length > 0}
                  onCheckedChange={toggleAll}
                  data-testid="checkbox-select-all"
                />
              </TableHead>
              <TableHead>Port</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Speed</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>VLAN</TableHead>
              <TableHead>LACP</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interfaces && interfaces.length > 0 ? (
              interfaces.map((iface) => (
                <TableRow key={iface.id} className="hover-elevate">
                  <TableCell>
                    <Checkbox
                      checked={selectedPorts.includes(iface.id)}
                      onCheckedChange={() => togglePort(iface.id)}
                      data-testid={`checkbox-port-${iface.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{iface.name}</TableCell>
                  <TableCell>
                    <StatusIndicator status={iface.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={iface.speed}
                      onValueChange={(value) =>
                        updateInterface.mutate({ id: iface.id, speed: value as Interface["speed"] })
                      }
                    >
                      <SelectTrigger className="w-24" data-testid={`select-speed-${iface.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {portSpeedOptions.map((speed) => (
                          <SelectItem key={speed} value={speed}>
                            {speed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={iface.mode}
                      onValueChange={(value) =>
                        updateInterface.mutate({ id: iface.id, mode: value as Interface["mode"] })
                      }
                    >
                      <SelectTrigger className="w-24" data-testid={`select-mode-${iface.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {portModeOptions.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {iface.mode === "access" ? (
                      <Badge variant="outline">{iface.accessVlan || "N/A"}</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {iface.trunkAllowedVlans.length > 0
                          ? `${iface.trunkAllowedVlans.length} VLANs`
                          : "All"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {iface.lacpGroupId ? (
                      <Badge variant="outline">
                        {lacpGroups?.find((g) => g.id === iface.lacpGroupId)?.name || "Group"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {iface.description || "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No interfaces configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedCount={selectedPorts.length}
        vlans={vlans || []}
        lacpGroups={lacpGroups || []}
        onSubmit={(updates) => bulkUpdate.mutate({ ids: selectedPorts, updates })}
        isPending={bulkUpdate.isPending}
      />
    </div>
  );
}

function BulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  vlans,
  lacpGroups,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  vlans: Vlan[];
  lacpGroups: LacpGroup[];
  onSubmit: (updates: Partial<Interface>) => void;
  isPending: boolean;
}) {
  const [speed, setSpeed] = useState<string>("");
  const [mode, setMode] = useState<string>("");
  const [accessVlan, setAccessVlan] = useState<string>("");
  const [lacpGroup, setLacpGroup] = useState<string>("");

  const handleSubmit = () => {
    const updates: Partial<Interface> = {};
    if (speed) updates.speed = speed as Interface["speed"];
    if (mode) updates.mode = mode as Interface["mode"];
    if (accessVlan) updates.accessVlan = parseInt(accessVlan);
    if (lacpGroup) updates.lacpGroupId = lacpGroup === "none" ? null : lacpGroup;
    onSubmit(updates);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk Edit Interfaces</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedCount} selected interface{selectedCount > 1 ? "s" : ""}.
            Only filled fields will be updated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Speed</label>
            <Select value={speed} onValueChange={setSpeed}>
              <SelectTrigger data-testid="bulk-select-speed">
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent>
                {portSpeedOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mode</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger data-testid="bulk-select-mode">
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent>
                {portModeOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Access VLAN</label>
            <Select value={accessVlan} onValueChange={setAccessVlan}>
              <SelectTrigger data-testid="bulk-select-vlan">
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent>
                {vlans.map((v) => (
                  <SelectItem key={v.id} value={v.vlanId.toString()}>
                    VLAN {v.vlanId} - {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">LACP Group</label>
            <Select value={lacpGroup} onValueChange={setLacpGroup}>
              <SelectTrigger data-testid="bulk-select-lacp">
                <SelectValue placeholder="No change" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {lacpGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="button-apply-bulk">
            {isPending ? "Applying..." : "Apply Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VlansTab({ deviceId }: { deviceId: string }) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: vlans, isLoading } = useQuery<Vlan[]>({
    queryKey: ["/api/devices", deviceId, "vlans"],
  });

  const { data: interfaces } = useQuery<Interface[]>({
    queryKey: ["/api/devices", deviceId, "interfaces"],
  });

  const form = useForm<InsertVlan>({
    resolver: zodResolver(insertVlanSchema),
    defaultValues: {
      deviceId,
      vlanId: 1,
      name: "",
      description: "",
    },
  });

  const createVlan = useMutation({
    mutationFn: async (data: InsertVlan) => {
      const res = await apiRequest("POST", "/api/vlans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", deviceId, "vlans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "VLAN created" });
      form.reset({ deviceId, vlanId: 1, name: "", description: "" });
      setAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteVlan = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vlans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", deviceId, "vlans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "VLAN deleted" });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getPortCount = (vlanId: number) => {
    if (!interfaces) return 0;
    return interfaces.filter(
      (i) =>
        (i.mode === "access" && i.accessVlan === vlanId) ||
        (i.mode === "trunk" && i.trunkAllowedVlans.includes(vlanId))
    ).length;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-vlan">
          <Plus className="mr-2 h-4 w-4" />
          Add VLAN
        </Button>
      </div>

      {vlans && vlans.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vlans.map((vlan) => (
            <Card key={vlan.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-base">VLAN {vlan.vlanId}</CardTitle>
                  <CardDescription>{vlan.name}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(vlan.id)}
                  data-testid={`button-delete-vlan-${vlan.vlanId}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{getPortCount(vlan.vlanId)} ports</span>
                  {vlan.description && <span>{vlan.description}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No VLANs configured</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first VLAN to segment network traffic
          </p>
          <Button
            className="mt-4"
            onClick={() => setAddDialogOpen(true)}
            data-testid="button-add-first-vlan"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add VLAN
          </Button>
        </Card>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add VLAN</DialogTitle>
            <DialogDescription>Create a new VLAN on this device.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createVlan.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="vlanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VLAN ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={4094}
                        data-testid="input-vlan-id"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Production" data-testid="input-vlan-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional description" data-testid="input-vlan-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createVlan.isPending} data-testid="button-submit-vlan">
                  {createVlan.isPending ? "Creating..." : "Create VLAN"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete VLAN</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this VLAN? Ports using this VLAN will need to be reconfigured.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteVlan.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-vlan"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LacpTab({ deviceId }: { deviceId: string }) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: lacpGroups, isLoading } = useQuery<LacpGroup[]>({
    queryKey: ["/api/devices", deviceId, "lacp"],
  });

  const { data: interfaces } = useQuery<Interface[]>({
    queryKey: ["/api/devices", deviceId, "interfaces"],
  });

  const form = useForm<InsertLacpGroup>({
    resolver: zodResolver(insertLacpGroupSchema),
    defaultValues: {
      deviceId,
      groupNumber: 1,
      name: "",
      mode: "active",
      loadBalancing: "src-dst-ip",
      minLinks: 1,
      maxLinks: 8,
    },
  });

  const createLacpGroup = useMutation({
    mutationFn: async (data: InsertLacpGroup) => {
      const res = await apiRequest("POST", "/api/lacp", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", deviceId, "lacp"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "LACP group created" });
      form.reset({ deviceId, groupNumber: 1, name: "", mode: "active", loadBalancing: "src-dst-ip", minLinks: 1, maxLinks: 8 });
      setAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteLacpGroup = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lacp/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", deviceId, "lacp"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "LACP group deleted" });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getMemberCount = (groupId: string) => {
    if (!interfaces) return 0;
    return interfaces.filter((i) => i.lacpGroupId === groupId).length;
  };

  const getMemberPorts = (groupId: string) => {
    if (!interfaces) return [];
    return interfaces.filter((i) => i.lacpGroupId === groupId).map((i) => i.name);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-lacp">
          <Plus className="mr-2 h-4 w-4" />
          Add LACP Group
        </Button>
      </div>

      {lacpGroups && lacpGroups.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lacpGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Network className="h-4 w-4" />
                    {group.name || `Port-Channel ${group.groupNumber}`}
                  </CardTitle>
                  <CardDescription>Group {group.groupNumber}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(group.id)}
                  data-testid={`button-delete-lacp-${group.groupNumber}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {group.mode}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {group.loadBalancing}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Members: {getMemberCount(group.id)} ports</p>
                  {getMemberPorts(group.id).length > 0 && (
                    <p className="font-mono text-xs mt-1">
                      {getMemberPorts(group.id).slice(0, 4).join(", ")}
                      {getMemberPorts(group.id).length > 4 && "..."}
                    </p>
                  )}
                  <p className="mt-1">
                    Links: {group.minLinks} min / {group.maxLinks} max
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Network className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No LACP groups configured</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a LACP group to aggregate multiple links
          </p>
          <Button
            className="mt-4"
            onClick={() => setAddDialogOpen(true)}
            data-testid="button-add-first-lacp"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add LACP Group
          </Button>
        </Card>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add LACP Group</DialogTitle>
            <DialogDescription>Create a new link aggregation group.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createLacpGroup.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="groupNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={128}
                        data-testid="input-lacp-group-number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Uplink-Bundle" data-testid="input-lacp-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lacp-mode">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lacpModeOptions.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loadBalancing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Load Balancing</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lacp-load-balance">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadBalancingOptions.map((lb) => (
                          <SelectItem key={lb} value={lb}>
                            {lb}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minLinks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Links</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={16}
                          data-testid="input-lacp-min-links"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxLinks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Links</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={16}
                          data-testid="input-lacp-max-links"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 8)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLacpGroup.isPending} data-testid="button-submit-lacp">
                  {createLacpGroup.isPending ? "Creating..." : "Create Group"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete LACP Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this LACP group? Member ports will be removed from the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteLacpGroup.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-lacp"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ConfigTab({ device }: { device: Device }) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [configText, setConfigText] = useState("");
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<{ config: string }>({
    queryKey: ["/api/devices", device.id, "config"],
  });

  const importConfig = useMutation({
    mutationFn: async (configText: string) => {
      const res = await apiRequest("POST", `/api/devices/${device.id}/import-config`, { configText });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", device.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices", device.id, "interfaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices", device.id, "vlans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices", device.id, "lacp"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices", device.id, "config"] });
      toast({ title: "Configuration imported", description: "Device configuration has been parsed and applied." });
      setImportDialogOpen(false);
      setConfigText("");
    },
    onError: (error: Error) => {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    },
  });

  const generateConfig = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/devices/${device.id}/generate-config`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices", device.id, "config"] });
      toast({ title: "Configuration generated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="button-import-config">
          <Upload className="mr-2 h-4 w-4" />
          Import Config
        </Button>
        <Button
          variant="outline"
          onClick={() => generateConfig.mutate()}
          disabled={generateConfig.isPending}
          data-testid="button-generate-config"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateConfig.isPending ? "animate-spin" : ""}`} />
          {generateConfig.isPending ? "Generating..." : "Generate"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : config?.config ? (
        <ConfigViewer config={config.config} title={`${device.hostname} Configuration`} />
      ) : (
        <Card className="p-8 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Import an existing configuration or generate one from current settings
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => generateConfig.mutate()} disabled={generateConfig.isPending}>
              Generate Config
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Configuration</DialogTitle>
            <DialogDescription>
              Paste your {device.vendor === "cisco" ? "Cisco IOS" : "Juniper JunOS"} configuration below.
              The system will parse VLANs, interfaces, and LACP settings.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={`Paste your ${device.vendor === "cisco" ? "Cisco" : "Juniper"} configuration here...`}
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            className="h-64 font-mono text-sm"
            data-testid="textarea-import-config"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => importConfig.mutate(configText)}
              disabled={!configText.trim() || importConfig.isPending}
              data-testid="button-submit-import"
            >
              {importConfig.isPending ? "Importing..." : "Import Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: device, isLoading } = useQuery<Device>({
    queryKey: ["/api/devices", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="space-y-6">
        <Link href="/devices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Devices
          </Button>
        </Link>
        <Card className="p-8 text-center">
          <Server className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Device not found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The device you're looking for doesn't exist.
          </p>
          <Link href="/devices">
            <Button className="mt-4">View All Devices</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/devices">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">{device.hostname}</h1>
              <StatusIndicator status={device.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <VendorBadge vendor={device.vendor} />
              <span className="text-sm text-muted-foreground">{device.model}</span>
              <span className="text-sm text-muted-foreground">{device.ipAddress}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-sync-device">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
        </div>
      </div>

      <Tabs defaultValue="interfaces" className="space-y-4">
        <TabsList data-testid="device-tabs">
          <TabsTrigger value="interfaces" data-testid="tab-interfaces">
            <Settings className="mr-2 h-4 w-4" />
            Interfaces
          </TabsTrigger>
          <TabsTrigger value="vlans" data-testid="tab-vlans">
            <Layers className="mr-2 h-4 w-4" />
            VLANs
          </TabsTrigger>
          <TabsTrigger value="lacp" data-testid="tab-lacp">
            <Network className="mr-2 h-4 w-4" />
            LACP
          </TabsTrigger>
          <TabsTrigger value="config" data-testid="tab-config">
            <FileText className="mr-2 h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interfaces">
          <InterfacesTab deviceId={device.id} />
        </TabsContent>

        <TabsContent value="vlans">
          <VlansTab deviceId={device.id} />
        </TabsContent>

        <TabsContent value="lacp">
          <LacpTab deviceId={device.id} />
        </TabsContent>

        <TabsContent value="config">
          <ConfigTab device={device} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
