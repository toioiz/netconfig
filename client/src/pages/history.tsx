import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Clock, User, Server } from "lucide-react";

const mockHistory = [
  {
    id: "1",
    action: "Configuration Applied",
    device: "switch-core-01",
    user: "admin",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    details: "Applied VLAN changes",
  },
  {
    id: "2",
    action: "Device Added",
    device: "switch-access-05",
    user: "admin",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    details: "New Cisco Catalyst 9300 added",
  },
  {
    id: "3",
    action: "LACP Group Created",
    device: "switch-core-01",
    user: "admin",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    details: "Created Port-Channel 1",
  },
  {
    id: "4",
    action: "Config Imported",
    device: "switch-dist-02",
    user: "admin",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: "Imported running configuration",
  },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          View recent configuration changes and actions
        </p>
      </div>

      <Card>
        {mockHistory.length > 0 ? (
          <div className="divide-y">
            {mockHistory.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.action}</span>
                    <Badge variant="outline">{item.device}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.details}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CardContent className="p-8 text-center">
            <History className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No history yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configuration changes will appear here
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
