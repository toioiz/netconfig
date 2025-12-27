import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { StatusIndicator } from "@/components/status-indicator";
import { VendorBadge } from "@/components/vendor-badge";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Server,
  Plus,
  Search,
  Settings,
  Trash2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import type { Device, InsertDevice, DeviceVendor } from "@shared/schema";
import { insertDeviceSchema, deviceVendors } from "@shared/schema";

function AddDeviceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  
  const form = useForm<InsertDevice>({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: {
      hostname: "",
      ipAddress: "",
      vendor: "cisco",
      model: "",
    },
  });

  const createDevice = useMutation({
    mutationFn: async (data: InsertDevice) => {
      const res = await apiRequest("POST", "/api/devices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Device added",
        description: "The device has been added successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDevice) => {
    createDevice.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Enter the details for the new network device.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hostname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hostname</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="switch-core-01"
                      data-testid="input-hostname"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ipAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="192.168.1.1"
                      data-testid="input-ip-address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-vendor">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deviceVendors.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>
                          {vendor.charAt(0).toUpperCase() + vendor.slice(1)}
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
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Catalyst 9300"
                      data-testid="input-model"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createDevice.isPending}
                data-testid="button-submit-device"
              >
                {createDevice.isPending ? "Adding..." : "Add Device"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeviceRow({ device, onDelete }: { device: Device; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b p-4 last:border-b-0 hover-elevate active-elevate-2">
      <Link href={`/devices/${device.id}`} className="flex flex-1 items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Server className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{device.hostname}</span>
            <VendorBadge vendor={device.vendor} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{device.ipAddress}</span>
            <span>{device.model}</span>
          </div>
        </div>
        <StatusIndicator status={device.status} />
      </Link>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            onDelete(device.id);
          }}
          data-testid={`button-delete-device-${device.id}`}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Link href={`/devices/${device.id}`}>
          <Button variant="ghost" size="icon" data-testid={`button-view-device-${device.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Device deleted",
        description: "The device has been removed.",
      });
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredDevices = devices?.filter(
    (device) =>
      device.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ipAddress.includes(searchQuery) ||
      device.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteClick = (id: string) => {
    setDeviceToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Devices</h1>
          <p className="text-sm text-muted-foreground">
            Manage your network switches and routers
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-new-device">
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-devices"
          />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDevices && filteredDevices.length > 0 ? (
          <div>
            {filteredDevices.map((device) => (
              <DeviceRow
                key={device.id}
                device={device}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Server className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery ? "No devices found" : "No devices yet"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Add your first network device to get started"}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4"
                onClick={() => setAddDialogOpen(true)}
                data-testid="button-add-first-device-empty"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            )}
          </div>
        )}
      </Card>

      <AddDeviceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this device? This action cannot be
              undone and will remove all associated configurations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deviceToDelete && deleteDevice.mutate(deviceToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
