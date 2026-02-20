import type { ReactNode } from "react";
import { AlertCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MessageFiltersProps {
  messageSearch: string;
  setMessageSearch: (value: string) => void;
  messageSearchLoading: boolean;
  messageSearchError: string;
  conversationFilter: string;
  setConversationFilter: (value: string) => void;
  messageDateFilter: string;
  setMessageDateFilter: (value: string) => void;
  resetMessageFilters: () => void;
  filtersActive: boolean;
  conversationFilterLabel: string;
  messageDateFilterLabel: string;
  messageBucketAvailable: boolean;
  highlightMatch: (text: string) => ReactNode;
}

export function MessageFilters({
  messageSearch,
  setMessageSearch,
  messageSearchLoading,
  messageSearchError,
  conversationFilter,
  setConversationFilter,
  messageDateFilter,
  setMessageDateFilter,
  resetMessageFilters,
  filtersActive,
  conversationFilterLabel,
  messageDateFilterLabel,
  messageBucketAvailable,
}: MessageFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients or messages"
            className="pl-8 pr-8"
            value={messageSearch}
            onChange={(event) => setMessageSearch(event.target.value)}
          />
          {messageSearchLoading && (
            <p className="mt-1 text-xs text-muted-foreground">Searching...</p>
          )}
          {messageSearchError && (
            <p className="mt-1 text-xs text-destructive">{messageSearchError}</p>
          )}
          {messageSearch && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1.5 h-6 w-6"
              onClick={() => setMessageSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="outline" aria-label="Filter conversations">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Conversation</p>
              <Select value={conversationFilter} onValueChange={setConversationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter conversations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conversations</SelectItem>
                  <SelectItem value="unread">Unread only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Date</p>
              <Select value={messageDateFilter} onValueChange={setMessageDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="week">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="month">Last month</SelectItem>
                  <SelectItem value="year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="ghost" onClick={resetMessageFilters}>
              Reset filters
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      {filtersActive && (
        <p className="text-xs text-muted-foreground">
          Filters: {conversationFilterLabel} · {messageDateFilterLabel}
        </p>
      )}
      {!messageBucketAvailable && (
        <Alert className="border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Attachments are unavailable. Create a `message-attachments` storage bucket.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
