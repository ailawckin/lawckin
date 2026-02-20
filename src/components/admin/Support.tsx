import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, MessageSquare, Mail, Clock, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface SupportTicket {
  id: string;
  subject: string;
  user_id: string | null;
  status: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  user_name?: string;
  user_email?: string;
}

export function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [searchQuery, statusFilter, priorityFilter, tickets]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user details
      const userIds = (data || []).map((t) => t.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profilesMap = new Map(
        (profiles || []).map((p) => [p.user_id, p])
      );

      const enrichedTickets = (data || []).map((ticket) => ({
        ...ticket,
        user_name: ticket.user_id ? profilesMap.get(ticket.user_id)?.full_name : null,
        user_email: ticket.user_id ? profilesMap.get(ticket.user_id)?.email : null,
      }));

      setTickets(enrichedTickets);
      setFilteredTickets(enrichedTickets);
    } catch (error: any) {
      toast({
        title: "Error loading tickets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchQuery) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: "Ticket status has been updated",
      });

      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !response.trim()) return;

    try {
      // Send email via Supabase Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-support-email', {
        body: {
          to: selectedTicket.user_email,
          subject: `Re: ${selectedTicket.subject}`,
          message: response,
          ticketId: selectedTicket.id,
        },
      });

      if (emailError) {
        console.warn("Email sending failed, but continuing with ticket update:", emailError);
        // Continue with ticket update even if email fails
      }

      // Update ticket status
      const { error: updateError } = await supabase
        .from("support_tickets")
        .update({
          status: "resolved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id);

      if (updateError) throw updateError;

      toast({
        title: "Response sent",
        description: emailError 
          ? "Ticket updated, but email could not be sent. Please contact the user directly."
          : "Response has been sent to the user via email",
      });

      setDialogOpen(false);
      setResponse("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error sending response",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Support Tickets</h2>
        <p className="text-muted-foreground">Manage customer support tickets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
          <CardDescription>View and manage support requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredTickets.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No tickets found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{ticket.user_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.user_email || "N/A"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(ticket.priority) as any}>
                        {ticket.priority || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.status === "resolved"
                            ? "default"
                            : ticket.status === "open"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {ticket.status || "open"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                        <Select
                          value={ticket.status || "open"}
                          onValueChange={(value) => handleUpdateStatus(ticket.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket && (
                <div className="mt-2 space-y-2">
                  <p className="font-medium">{selectedTicket.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    From: {selectedTicket.user_name} ({selectedTicket.user_email})
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your response here..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendResponse} disabled={!response.trim()}>
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

