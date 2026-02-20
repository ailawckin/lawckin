export const getStatusColor = (status: string | null) => {
  switch (status) {
    case "resolved":
      return "default";
    case "pending":
      return "destructive";
    case "reviewing":
      return "secondary";
    default:
      return "outline";
  }
};

export const getEntityTypeLabel = (type: string) => {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};
