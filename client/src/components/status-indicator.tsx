import { cn } from "@/lib/utils";
import type { DeviceStatus, PortStatus } from "@shared/schema";

interface StatusIndicatorProps {
  status: DeviceStatus | PortStatus;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const statusColors: Record<string, string> = {
  online: "bg-status-online",
  up: "bg-status-online",
  offline: "bg-status-offline",
  down: "bg-status-busy",
  syncing: "bg-status-away",
  disabled: "bg-status-offline",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  up: "Up",
  offline: "Offline",
  down: "Down",
  syncing: "Syncing",
  disabled: "Disabled",
};

export function StatusIndicator({ status, showLabel = true, size = "md" }: StatusIndicatorProps) {
  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-full", dotSize, statusColors[status])} />
      {showLabel && (
        <span className="text-sm capitalize">{statusLabels[status]}</span>
      )}
    </div>
  );
}
