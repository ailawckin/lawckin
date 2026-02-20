import { AlertCircle, ExternalLink, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LawyerProfileSummary, VerificationDocument } from "@/components/lawyer/dashboard/types";

interface VerificationDocumentsCardProps {
  lawyerProfile: LawyerProfileSummary | null;
  verificationBucketChecked: boolean;
  verificationBucketExists: boolean;
  verificationUploading: string | null;
  getVerificationDocuments: () => VerificationDocument[];
  handleVerificationUpload: (docType: VerificationDocument["type"], file?: File) => void;
  handleVerificationReplace: (doc: VerificationDocument, file?: File) => void;
  handleResubmitVerification: () => void;
  setDocToDelete: (doc: VerificationDocument | null) => void;
  setDeleteDocDialogOpen: (value: boolean) => void;
}

const VerificationDocumentsCard = ({
  lawyerProfile,
  verificationBucketChecked,
  verificationBucketExists,
  verificationUploading,
  getVerificationDocuments,
  handleVerificationUpload,
  handleVerificationReplace,
  handleResubmitVerification,
  setDocToDelete,
  setDeleteDocDialogOpen,
}: VerificationDocumentsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Documents</CardTitle>
        <CardDescription>Upload required documents to complete verification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Required documents</p>
          <ul className="space-y-1">
            <li>• Bar certificate (required)</li>
            <li>• Professional license (required)</li>
            <li>• Additional documents (optional)</li>
          </ul>
          <p>Accepted formats: PDF, JPG, PNG. Max size: 10MB.</p>
        </div>
        {lawyerProfile?.verification_status && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Current status: <strong>{lawyerProfile.verification_status}</strong>
            </AlertDescription>
          </Alert>
        )}
        {verificationBucketChecked && !verificationBucketExists && (
          <Alert className="border-destructive/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Verification uploads are unavailable. Contact support to enable the
              <strong> verification-documents</strong> storage bucket.
            </AlertDescription>
          </Alert>
        )}
        {lawyerProfile?.verification_status === "rejected" && (
          <Alert className="border-destructive/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {lawyerProfile?.verification_rejection_reason
                ? `Rejection reason: ${lawyerProfile.verification_rejection_reason}`
                : "Your documents were rejected. Please upload clearer or updated documents and resubmit."}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          {(["bar_certificate", "professional_license", "other"] as const).map((docType) => {
            const docs = getVerificationDocuments().filter((doc) => doc.type === docType);
            const label =
              docType === "bar_certificate"
                ? "Bar Certificate"
                : docType === "professional_license"
                  ? "Professional License"
                  : "Additional Document";
            return (
              <div key={docType} className="rounded-lg border p-3">
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {docs.length === 0
                    ? "Missing"
                    : lawyerProfile?.verification_status === "pending"
                      ? "Pending review"
                      : lawyerProfile?.verification_status === "approved"
                        ? "Approved"
                        : "Uploaded"}
                </p>
              </div>
            );
          })}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Bar Certificate</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(event) => handleVerificationUpload("bar_certificate", event.target.files?.[0])}
              disabled={verificationUploading === "bar_certificate"}
            />
          </div>
          <div className="space-y-2">
            <Label>Professional License</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(event) => handleVerificationUpload("professional_license", event.target.files?.[0])}
              disabled={verificationUploading === "professional_license"}
            />
          </div>
          <div className="space-y-2">
            <Label>Additional Document</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(event) => handleVerificationUpload("other", event.target.files?.[0])}
              disabled={verificationUploading === "other"}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Uploaded Documents</Label>
          {getVerificationDocuments().length ? (
            <div className="space-y-2">
              {getVerificationDocuments().map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center justify-between gap-2 border rounded-lg p-2">
                  <div className="text-sm">
                    <p className="font-medium">
                      {doc.type === "bar_certificate"
                        ? "Bar Certificate"
                        : doc.type === "professional_license"
                          ? "Professional License"
                          : "Additional Document"}
                    </p>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline text-xs inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {doc.file_name || "View document"}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : "Size unknown"}
                      {doc.uploaded_at ? ` • ${new Date(doc.uploaded_at).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(event) => handleVerificationReplace(doc, event.target.files?.[0])}
                      disabled={verificationUploading === doc.type}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDocToDelete(doc);
                        setDeleteDocDialogOpen(true);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
        </div>
        {lawyerProfile?.verification_status === "rejected" && (
          <Button onClick={handleResubmitVerification}>Resubmit for Review</Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VerificationDocumentsCard;
