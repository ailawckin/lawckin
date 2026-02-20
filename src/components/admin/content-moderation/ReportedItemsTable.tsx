import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Ban, Trash2, XCircle } from "lucide-react";
import { getEntityTypeLabel, getStatusColor } from "@/components/admin/content-moderation/utils";
import type { ReportedItem } from "@/components/admin/content-moderation/types";

interface ReportedItemsTableProps {
  reports: ReportedItem[];
  onAction: (report: ReportedItem, action: "dismiss" | "hide" | "delete") => void;
  onBan: (report: ReportedItem) => void;
}

export function ReportedItemsTable({ reports, onAction, onBan }: ReportedItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Entity</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Reporter</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reported</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell>
              <div>
                <p className="font-medium">{getEntityTypeLabel(report.entity_type)}</p>
                <p className="text-xs text-muted-foreground">ID: {report.entity_id.slice(0, 8)}...</p>
              </div>
            </TableCell>
            <TableCell className="max-w-xs truncate">
              {report.reason || "No reason provided"}
            </TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{report.reporter_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{report.reporter_email || "N/A"}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusColor(report.status) as any}>{report.status || "pending"}</Badge>
            </TableCell>
            <TableCell>{format(new Date(report.created_at), "MMM d, yyyy")}</TableCell>
            <TableCell>
              {report.status !== "resolved" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onAction(report, "dismiss")}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction(report, "hide")}>
                    <Eye className="h-4 w-4 mr-1" />
                    Hide
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onBan(report)}>
                    <Ban className="h-4 w-4 mr-1" />
                    Ban
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onAction(report, "delete")}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
              {report.status === "resolved" && report.action_taken && (
                <p className="text-xs text-muted-foreground">{report.action_taken}</p>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
