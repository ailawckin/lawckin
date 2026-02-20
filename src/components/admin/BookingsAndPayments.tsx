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
import { Search, Calendar, DollarSign, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Booking {
  id: string;
  client_id: string;
  lawyer_id: string;
  scheduled_at: string;
  status: string;
  amount: number | null;
  payment_status: string | null;
  payment_intent_id: string | null;
  practice_area_id: string | null;
  client_name: string | null;
  lawyer_name: string | null;
  practice_area_name: string | null;
}

export function BookingsAndPayments() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [bookingToRefund, setBookingToRefund] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchQuery, statusFilter, paymentFilter, bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings_with_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBookings(data || []);
      setFilteredBookings(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading bookings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (booking) =>
          booking.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.lawyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          booking.practice_area_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter((booking) => booking.payment_status === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleRefund = async () => {
    if (!bookingToRefund) return;

    // Check if payment_intent_id exists
    if (!bookingToRefund.payment_intent_id) {
      toast({
        title: "Cannot process refund",
        description: "No payment intent ID found for this booking. Refund must be processed manually through Stripe.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Process Stripe refund via Edge Function
      const { data: refundData, error: refundError } = await supabase.functions.invoke('process-refund', {
        body: {
          paymentIntentId: bookingToRefund.payment_intent_id,
          amount: bookingToRefund.amount,
          bookingId: bookingToRefund.id,
        },
      });

      if (refundError) {
        // If edge function doesn't exist, show helpful message
        if (refundError.message?.includes('not found') || refundError.message?.includes('404')) {
          throw new Error('Refund function not configured. Please create the process-refund Edge Function in Supabase.');
        }
        throw new Error(`Stripe refund failed: ${refundError.message}`);
      }

      // Update booking payment status after successful refund
      const { error: updateError } = await supabase
        .from("consultations")
        .update({ payment_status: "refunded" })
        .eq("id", bookingToRefund.id);

      if (updateError) throw updateError;

      toast({
        title: "Refund processed",
        description: `Refund of $${bookingToRefund.amount?.toFixed(2)} has been processed successfully`,
      });

      setRefundDialogOpen(false);
      setBookingToRefund(null);
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error processing refund",
        description: error.message || "Failed to process refund. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const totalRevenue = bookings
    .filter((b) => b.payment_status === "paid" && b.amount)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const pendingPayments = bookings
    .filter((b) => b.payment_status === "pending" && b.amount)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Bookings & Payments</h2>
        <p className="text-muted-foreground">Manage all consultations and payment transactions</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All paid bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">All consultations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>View and manage consultation bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, lawyer, or practice area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <DollarSign className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredBookings.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No bookings found</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Lawyer</TableHead>
                    <TableHead>Practice Area</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.client_name || "Unknown"}
                      </TableCell>
                      <TableCell>{booking.lawyer_name || "Unknown"}</TableCell>
                      <TableCell>{booking.practice_area_name || "N/A"}</TableCell>
                      <TableCell>
                        {booking.scheduled_at &&
                          format(new Date(booking.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "completed"
                              ? "secondary"
                              : booking.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.amount ? `$${booking.amount.toFixed(2)}` : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.payment_status === "paid"
                              ? "default"
                              : booking.payment_status === "pending"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {booking.payment_status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.payment_status === "paid" && booking.amount && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setBookingToRefund(booking);
                              setRefundDialogOpen(true);
                            }}
                          >
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to process a refund for this booking?
              {bookingToRefund && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">
                    Amount: ${bookingToRefund.amount?.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Client: {bookingToRefund.client_name}
                  </p>
                </div>
              )}
              <p className="mt-3 text-sm text-destructive">
                Note: This will update the payment status. Actual refund processing should be done through Stripe.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

