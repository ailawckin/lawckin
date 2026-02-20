import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContentModerationFiltersProps {
  searchQuery: string;
  statusFilter: string;
  entityFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onEntityChange: (value: string) => void;
}

export function ContentModerationFilters({
  searchQuery,
  statusFilter,
  entityFilter,
  onSearchChange,
  onStatusChange,
  onEntityChange,
}: ContentModerationFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-8"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="reviewing">Reviewing</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>
      <Select value={entityFilter} onValueChange={onEntityChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Entity Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="lawyer_profile">Lawyer Profile</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="message">Message</SelectItem>
          <SelectItem value="consultation">Consultation</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
