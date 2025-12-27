import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusIndicator } from "@/components/status-indicator";
import { VendorBadge } from "@/components/vendor-badge";
import { Link } from "wouter";
import { Server, Network, Layers, ArrowRight, Plus, RefreshCw } from "lucide-react";
import type { Device, Vlan, LacpGroup } from "@shared/schema";

interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  totalVlans: number;
  totalLacpGroups: number;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  trend?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        {trend && (
          <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceCard({ device }: { device: Device }) {
  return (
    <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all">
      <Link href={`/devices/${device.id}`}>
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Server className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{device.hostname}</CardTitle>
              <p className="text-sm text-muted-foreground">{device.ipAddress}</p>
            </div>
          </div>
          <StatusIndicator status={device.status} showLabel={false} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <VendorBadge vendor={device.vendor} />
            <Badge variant="outline" className="text-xs">
              {device.model}
            </Badge>
          </div>
          {device.lastSyncedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Last synced: {new Date(device.lastSyncedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

export default function Dashboard() {
  const { data: devices, isLoading: devicesLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const recentDevices = devices?.slice(0, 4) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your network infrastructure
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-sync-all">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All
          </Button>
          <Link href="/devices">
            <Button size="sm" data-testid="button-add-device">
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Devices"
          value={stats?.totalDevices || 0}
          icon={Server}
          loading={statsLoading}
        />
        <StatCard
          title="Online Devices"
          value={stats?.onlineDevices || 0}
          icon={Network}
          loading={statsLoading}
        />
        <StatCard
          title="Total VLANs"
          value={stats?.totalVlans || 0}
          icon={Layers}
          loading={statsLoading}
        />
        <StatCard
          title="LACP Groups"
          value={stats?.totalLacpGroups || 0}
          icon={Network}
          loading={statsLoading}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Devices</h2>
          <Link href="/devices">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {devicesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-10 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentDevices.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentDevices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Server className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No devices yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first network device to get started
            </p>
            <Link href="/devices">
              <Button className="mt-4" data-testid="button-add-first-device">
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
