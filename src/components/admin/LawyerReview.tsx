import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Info, FileText, ExternalLink } from "lucide-react";
import { getPrimaryPracticeArea } from "@/lib/lawyerDisplay";

interface PendingLawyer {
  id: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
  bar_number: string | null;
  specialty: string;
  practice_areas?: string[] | null;
  location?: string | null;
  ny_locations: string[] | null;
  tier: string;
  verification_status: string;
  verification_documents: any[] | null;
  verification_rejection_reason?: string | null;
  created_at: string;
}

type VerificationDocument = {
  id: string;
  type: "bar_certificate" | "professional_license" | "other";
  url: string;
  uploaded_at?: string;
  file_name?: string | null;
  file_size?: number | null;
};

export function LawyerReview() {
  const [pendingLawyers, setPendingLawyers] = useState<PendingLawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLawyer, setSelectedLawyer] = useState<PendingLawyer | null>(null);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const normalizeDocuments = (docs: any[] | null): VerificationDocument[] => {
    if (!docs || !Array.isArray(docs)) return [];
    return docs.map((doc: any) => {
      if (typeof doc === "string") {
        return {
          id: doc,
          type: "other",
          url: doc,
        };
      }
      return {
        id: doc.id || doc.url,
        type: doc.type || "other",
        url: doc.url,
        uploaded_at: doc.uploaded_at,
        file_name: doc.file_name,
        file_size: doc.file_size,
      };
    });
  };

  useEffect(() => {
    fetchPendingLawyers();
  }, []);

  const fetchPendingLawyers = async () => {
    setLoading(true);
    try {
      const { data: lawyersData, error: lawyersError } = await supabase
        .from("lawyer_profiles")
        .select("*")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });

      if (lawyersError) throw lawyersError;

      // Fetch profiles separately
      const userIds = lawyersData?.map(l => l.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p]) || []
      );

      const enrichedLawyers = lawyersData?.map(lawyer => ({
        ...lawyer,
        profiles: profilesMap.get(lawyer.user_id) || {
          full_name: "Unknown",
          email: "unknown@example.com"
        }
      })) || [];

      setPendingLawyers(enrichedLawyers as any);
    } catch (error: any) {
      toast({
        title: "Error loading pending lawyers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (lawyer: PendingLawyer) => {
    try {
      const { error } = await supabase
        .from("lawyer_profiles")
        .update({
          verified: true,
          verification_status: "approved",
        })
        .eq("id", lawyer.id);

      if (error) throw error;

      await logAction({
        action: "APPROVE_LAWYER",
        entityType: "lawyer_profile",
        entityId: lawyer.id,
        beforeData: { verified: false, verification_status: "pending" },
        afterData: { verified: true, verification_status: "approved" },
      });

      toast({
        title: "Lawyer approved",
        description: `${lawyer.profiles.full_name} has been verified.`,
      });

      fetchPendingLawyers();
    } catch (error: any) {
      toast({
        title: "Error approving lawyer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async (lawyer: PendingLawyer) => {
    try {
      const { error } = await supabase
        .from("lawyer_profiles")
        .update({
          verification_status: "rejected",
          verification_rejection_reason: rejectionReason || null,
        })
        .eq("id", lawyer.id);

      if (error) throw error;

      await logAction({
        action: "REJECT_LAWYER",
        entityType: "lawyer_profile",
        entityId: lawyer.id,
        beforeData: { verification_status: "pending" },
        afterData: { verification_status: "rejected", verification_rejection_reason: rejectionReason || null },
      });

      toast({
        title: "Lawyer rejected",
        description: `${lawyer.profiles.full_name}'s application has been rejected.`,
      });

      setRejectDialogOpen(false);
      setRejectionReason("");
      fetchPendingLawyers();
    } catch (error: any) {
      toast({
        title: "Error rejecting lawyer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Lawyer Review & Verification</h2>
        <p className="text-muted-foreground">Review and verify pending lawyer applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications ({pendingLawyers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : pendingLawyers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending verifications</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Bar Number</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLawyers.map((lawyer) => (
                  <TableRow key={lawyer.id}>
                    <TableCell className="font-medium">
                      {lawyer.profiles.full_name}
                    </TableCell>
                    <TableCell>{lawyer.profiles.email}</TableCell>
                    <TableCell>{lawyer.bar_number || "N/A"}</TableCell>
                    <TableCell>{getPrimaryPracticeArea(lawyer)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lawyer.ny_locations?.slice(0, 2).map((loc, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {loc}
                          </Badge>
                        ))}
                        {lawyer.ny_locations?.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{lawyer.ny_locations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge>{lawyer.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(lawyer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {normalizeDocuments(lawyer.verification_documents).length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedLawyer(lawyer);
                              setDocumentsDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Documents
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(lawyer)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedLawyer(lawyer);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Documents</DialogTitle>
            <DialogDescription>
              {selectedLawyer && (
                <div>
                  <p className="font-medium">{selectedLawyer.profiles.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Bar Number: {selectedLawyer.bar_number || "Not provided"}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {normalizeDocuments(selectedLawyer?.verification_documents || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {normalizeDocuments(selectedLawyer?.verification_documents || []).map((doc, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {doc.type === "bar_certificate"
                              ? "Bar Certificate"
                              : doc.type === "professional_license"
                                ? "Professional License"
                                : "Additional Document"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                      {doc.url && (
                        <div className="mt-3">
                          <img
                            src={doc.url}
                            alt={`Verification document ${index + 1}`}
                            className="w-full h-48 object-contain border rounded-md bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No verification documents uploaded
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject lawyer</DialogTitle>
            <DialogDescription>
              Provide a clear reason so the lawyer can resubmit correctly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Rejection reason</Label>
            <Input
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="e.g., bar certificate is unclear"
            />
            <Button
              variant="destructive"
              onClick={() => selectedLawyer && handleReject(selectedLawyer)}
            >
              Confirm rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
