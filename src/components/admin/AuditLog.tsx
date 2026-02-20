import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Fetch admin profiles separately
      const adminIds = [...new Set(logsData?.map(log => log.admin_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", adminIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      const enrichedLogs = logsData?.map(log => ({
        ...log,
        profiles: profilesMap.get(log.admin_id) || {
          full_name: "Unknown",
          email: "unknown@example.com"
        }
      })) || [];

      setLogs(enrichedLogs as any);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === "all" || log.entity_type === filter;
    const matchesSearch =
      search === "" ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("APPROVE")) return "default";
    if (action.includes("REJECT") || action.includes("DELETE")) return "destructive";
    if (action.includes("UPDATE")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Audit Log</h2>
        <p className="text-muted-foreground">Track all administrative actions</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search actions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="lawyer_profile">Lawyer Profiles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="firm">Firms</SelectItem>
            <SelectItem value="booking">Bookings</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Actions ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No audit logs found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.profiles.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.profiles.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {log.entity_type}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {log.entity_id?.slice(0, 8)}...
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
