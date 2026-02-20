import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentModerationFilters } from "@/components/admin/content-moderation/ContentModerationFilters";
import { ModerationActionDialog } from "@/components/admin/content-moderation/ModerationActionDialog";
import { ModerationBanDialog } from "@/components/admin/content-moderation/ModerationBanDialog";
import { ReportedItemsTable } from "@/components/admin/content-moderation/ReportedItemsTable";
import { ReportsPagination } from "@/components/admin/content-moderation/ReportsPagination";
import type { ReportedItem } from "@/components/admin/content-moderation/types";

const REPORTS_PER_PAGE = 20;

export function ContentModeration() {
  const [reports, setReports] = useState<ReportedItem[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<ReportedItem | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"dismiss" | "hide" | "ban" | "delete">("dismiss");
  const [actionNotes, setActionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
    setCurrentPage(1);
  }, [searchQuery, statusFilter, entityFilter, reports]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reported_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reporterIds = (data || []).map((report) => report.reporter_id).filter(Boolean);
      const { data: reporters } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", reporterIds);

      const reportersMap = new Map((reporters || []).map((reporter) => [reporter.user_id, reporter]));

      const enrichedReports = (data || []).map((report) => ({
        ...report,
        reporter_name: report.reporter_id ? reportersMap.get(report.reporter_id)?.full_name : null,
        reporter_email: report.reporter_id ? reportersMap.get(report.reporter_id)?.email : null,
      }));

      setReports(enrichedReports);
      setFilteredReports(enrichedReports);
    } catch (error: any) {
      toast({
        title: "Error loading reports",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.reason?.toLowerCase().includes(query) ||
          report.reporter_name?.toLowerCase().includes(query) ||
          report.entity_type.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (entityFilter !== "all") {
      filtered = filtered.filter((report) => report.entity_type === entityFilter);
    }

    setFilteredReports(filtered);
  };

  const handleAction = async () => {
    if (!selectedReport) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let actionTaken = "";
      const updateData: any = {
        status: "resolved",
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        action_taken: actionNotes || actionType,
      };

      switch (actionType) {
        case "dismiss":
          actionTaken = "Dismissed report";
          break;
        case "hide":
          actionTaken = "Hidden content";
          if (selectedReport.entity_type === "lawyer_profile") {
            await supabase
              .from("lawyer_profiles")
              .update({ status: "hidden" })
              .eq("id", selectedReport.entity_id);
          } else if (selectedReport.entity_type === "review") {
            await supabase
              .from("lawyer_reviews")
              .update({ status: "hidden" })
              .eq("id", selectedReport.entity_id);
          } else if (selectedReport.entity_type === "message") {
            await supabase
              .from("messages")
              .update({ status: "deleted" })
              .eq("id", selectedReport.entity_id);
          }
          break;
        case "ban": {
          actionTaken = "Banned user";
          let userIdToBan = selectedReport.entity_id;

          if (selectedReport.entity_type !== "profile") {
            if (selectedReport.entity_type === "lawyer_profile") {
              const { data: lawyerProfile } = await supabase
                .from("lawyer_profiles")
                .select("user_id")
                .eq("id", selectedReport.entity_id)
                .single();

              if (lawyerProfile?.user_id) {
                userIdToBan = lawyerProfile.user_id;
              }
            } else if (selectedReport.entity_type === "review") {
              const { data: review } = await supabase
                .from("lawyer_reviews")
                .select("user_id")
                .eq("id", selectedReport.entity_id)
                .single();

              if (review?.user_id) {
                userIdToBan = review.user_id;
              }
            } else if (selectedReport.entity_type === "message") {
              const { data: message } = await supabase
                .from("messages")
                .select("sender_id")
                .eq("id", selectedReport.entity_id)
                .single();

              if (message?.sender_id) {
                userIdToBan = message.sender_id;
              }
            }
          }

          const { error: banError } = await supabase
            .from("profiles")
            .update({
              banned: true,
              banned_at: new Date().toISOString(),
              ban_reason: actionNotes || "Banned via content moderation",
            })
            .eq("user_id", userIdToBan);

          if (banError) {
            console.error("Error banning user:", banError);
          }
          break;
        }
        case "delete":
          actionTaken = "Deleted content";
          if (selectedReport.entity_type === "lawyer_profile") {
            await supabase
              .from("lawyer_profiles")
              .delete()
              .eq("id", selectedReport.entity_id);
          } else if (selectedReport.entity_type === "review") {
            await supabase
              .from("lawyer_reviews")
              .delete()
              .eq("id", selectedReport.entity_id);
          } else if (selectedReport.entity_type === "message") {
            await supabase
              .from("messages")
              .delete()
              .eq("id", selectedReport.entity_id);
          } else if (selectedReport.entity_type === "consultation") {
            await supabase
              .from("consultations")
              .delete()
              .eq("id", selectedReport.entity_id);
          }
          break;
      }

      updateData.action_taken = actionTaken + (actionNotes ? `: ${actionNotes}` : "");

      const { error: updateError } = await supabase
        .from("reported_items")
        .update(updateData)
        .eq("id", selectedReport.id);

      if (updateError) throw updateError;

      await logAction({
        action: `MODERATE_${actionType.toUpperCase()}`,
        entityType: selectedReport.entity_type,
        entityId: selectedReport.entity_id,
        afterData: { action: actionType, notes: actionNotes },
      });

      toast({
        title: "Action completed",
        description: `${actionTaken} successfully`,
      });

      setActionDialogOpen(false);
      setBanDialogOpen(false);
      setActionNotes("");
      setSelectedReport(null);
      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error processing action",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(filteredReports.length / REPORTS_PER_PAGE);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Content Moderation</h2>
        <p className="text-muted-foreground">Review and manage reported content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reported Items</CardTitle>
          <CardDescription>Review user reports and take appropriate action</CardDescription>
        </CardHeader>
        <CardContent>
          <ContentModerationFilters
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            entityFilter={entityFilter}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onEntityChange={setEntityFilter}
          />

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredReports.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No reports found</p>
          ) : (
            <ReportedItemsTable
              reports={paginatedReports}
              onAction={(report, type) => {
                setSelectedReport(report);
                setActionType(type);
                setActionDialogOpen(true);
              }}
              onBan={(report) => {
                setSelectedReport(report);
                setActionType("ban");
                setBanDialogOpen(true);
              }}
            />
          )}

          <ReportsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={filteredReports.length}
            perPage={REPORTS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <ModerationActionDialog
        open={actionDialogOpen}
        actionType={actionType}
        actionNotes={actionNotes}
        selectedReport={selectedReport}
        onNotesChange={setActionNotes}
        onOpenChange={setActionDialogOpen}
        onConfirm={handleAction}
      />

      <ModerationBanDialog
        open={banDialogOpen}
        actionNotes={actionNotes}
        selectedReport={selectedReport}
        onNotesChange={setActionNotes}
        onOpenChange={setBanDialogOpen}
        onConfirm={handleAction}
      />
    </div>
  );
}
