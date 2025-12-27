import { Badge } from "@/components/ui/badge";
import type { DeviceVendor } from "@shared/schema";
import { cn } from "@/lib/utils";

interface VendorBadgeProps {
  vendor: DeviceVendor;
}

export function VendorBadge({ vendor }: VendorBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-mono text-xs uppercase tracking-wide",
        vendor === "cisco" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        vendor === "juniper" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      )}
    >
      {vendor}
    </Badge>
  );
}
