import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VerificationDocument } from "@/components/lawyer/dashboard/types";

interface UseSettingsVerificationParams {
  lawyerProfile: any | null;
  setLawyerProfile: (value: any) => void;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useSettingsVerification({
  lawyerProfile,
  setLawyerProfile,
  toast,
}: UseSettingsVerificationParams) {
  const [verificationUploading, setVerificationUploading] = useState<string | null>(null);
  const [verificationBucketChecked, setVerificationBucketChecked] = useState(false);
  const [verificationBucketExists, setVerificationBucketExists] = useState(false);
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<VerificationDocument | null>(null);

  const getVerificationDocuments = (): VerificationDocument[] => {
    const docs = lawyerProfile?.verification_documents;
    if (Array.isArray(docs)) {
      return (docs as VerificationDocument[]).map((doc) => ({
        ...doc,
        type: doc.type || "other",
      }));
    }
    return [];
  };

  const ensureVerificationBucket = async () => {
    if (verificationBucketChecked) {
      return verificationBucketExists;
    }
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      const exists = (data || []).some((bucket) => bucket.name === "verification-documents");
      setVerificationBucketChecked(true);
      setVerificationBucketExists(exists);
      return exists;
    } catch (error: any) {
      setVerificationBucketChecked(true);
      setVerificationBucketExists(false);
      toast({
        title: "Upload unavailable",
        description: "Verification storage is not configured. Contact support.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getStoragePathFromUrl = (url: string) => {
    const marker = "/storage/v1/object/public/verification-documents/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.substring(idx + marker.length);
  };

  const handleVerificationUpload = async (docType: string, file?: File) => {
    if (!file || !lawyerProfile?.id) return;
    const bucketReady = await ensureVerificationBucket();
    if (!bucketReady) {
      toast({
        title: "Upload unavailable",
        description: "Verification storage is not configured. Contact support.",
        variant: "destructive",
      });
      return;
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Upload a PDF or image file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setVerificationUploading(docType);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${lawyerProfile.id}/${docType}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("verification-documents").getPublicUrl(filePath);

      const currentDocs = getVerificationDocuments();
      const updatedDocs = [
        ...currentDocs,
        {
          id: crypto.randomUUID(),
          type: docType as VerificationDocument["type"],
          url: publicUrl,
          uploaded_at: new Date().toISOString(),
          file_name: file.name,
          file_size: file.size,
        },
      ];

      const { error: updateError } = await supabase
        .from("lawyer_profiles")
        .update({
          verification_documents: updatedDocs,
          verification_status: "pending",
          verification_rejection_reason: null,
        })
        .eq("id", lawyerProfile.id);

      if (updateError) throw updateError;

      setLawyerProfile((prev: any) => ({
        ...prev,
        verification_documents: updatedDocs,
        verification_status: "pending",
        verification_rejection_reason: null,
      }));

      toast({
        title: "Document uploaded",
        description: "Your verification document was uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerificationUploading(null);
    }
  };

  const handleVerificationRemove = async (doc: VerificationDocument) => {
    if (!lawyerProfile?.id) return;
    const updatedDocs = getVerificationDocuments().filter((item) => item.id !== doc.id);
    const path = getStoragePathFromUrl(doc.url);
    if (path) {
      await supabase.storage.from("verification-documents").remove([path]);
    }
    const { error } = await supabase
      .from("lawyer_profiles")
      .update({ verification_documents: updatedDocs })
      .eq("id", lawyerProfile.id);

    if (error) {
      toast({
        title: "Failed to remove document",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLawyerProfile((prev: any) => ({
      ...prev,
      verification_documents: updatedDocs,
    }));
  };

  const handleVerificationReplace = async (doc: VerificationDocument, file?: File) => {
    if (!file || !lawyerProfile?.id) return;
    const bucketReady = await ensureVerificationBucket();
    if (!bucketReady) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Upload a PDF or image file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setVerificationUploading(doc.type);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${lawyerProfile.id}/${doc.type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("verification-documents").getPublicUrl(filePath);

      const updatedDocs = getVerificationDocuments().map((item) =>
        item.id === doc.id
          ? {
              ...item,
              url: publicUrl,
              uploaded_at: new Date().toISOString(),
              file_name: file.name,
              file_size: file.size,
            }
          : item
      );

      const { error: updateError } = await supabase
        .from("lawyer_profiles")
        .update({
          verification_documents: updatedDocs,
          verification_status: "pending",
          verification_rejection_reason: null,
        })
        .eq("id", lawyerProfile.id);

      if (updateError) throw updateError;

      setLawyerProfile((prev: any) => ({
        ...prev,
        verification_documents: updatedDocs,
        verification_status: "pending",
        verification_rejection_reason: null,
      }));
    } catch (error: any) {
      toast({
        title: "Replace failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setVerificationUploading(null);
    }
  };

  const handleResubmitVerification = async () => {
    if (!lawyerProfile?.id) return;
    const { error } = await supabase
      .from("lawyer_profiles")
      .update({
        verification_status: "pending",
        verification_rejection_reason: null,
      })
      .eq("id", lawyerProfile.id);

    if (error) {
      toast({
        title: "Resubmit failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLawyerProfile((prev: any) => ({
      ...prev,
      verification_status: "pending",
      verification_rejection_reason: null,
    }));

    toast({
      title: "Resubmitted for review",
      description: "Your documents were resubmitted for verification.",
    });
  };

  return {
    verificationUploading,
    verificationBucketChecked,
    verificationBucketExists,
    deleteDocDialogOpen,
    setDeleteDocDialogOpen,
    docToDelete,
    setDocToDelete,
    getVerificationDocuments,
    handleVerificationUpload,
    handleVerificationReplace,
    handleVerificationRemove,
    handleResubmitVerification,
  };
}
