import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DollarSign, 
  Download, 
  CreditCard,
  TrendingUp,
  FileText,
  Filter,
  Calendar as CalendarIcon,
  Plus,
  Trash2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { useState } from "react";

interface ClientPaymentsProps {
  consultations: any[];
}

const ClientPayments = ({ consultations }: ClientPaymentsProps) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLawyer, setFilterLawyer] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Mock payment methods - would come from Stripe
  const paymentMethods = [
    { id: '1', type: 'visa', last4: '4242', expiryMonth: 12, expiryYear: 2025, isDefault: true },
    { id: '2', type: 'mastercard', last4: '5555', expiryMonth: 8, expiryYear: 2024, isDefault: false },
  ];

  // Filter consultations with payment info
  let paymentsData = consultations
    .filter(c => c.amount)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  // Apply filters
  if (filterStatus !== "all") {
    paymentsData = paymentsData.filter(c => c.payment_status === filterStatus);
  }

  if (filterLawyer !== "all") {
    paymentsData = paymentsData.filter(c => c.lawyer_id === filterLawyer);
  }

  if (dateRange !== "all") {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
      case "this_month":
        startDate = startOfMonth(now);
        break;
      case "last_month":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "last_3_months":
        startDate = startOfMonth(subMonths(now, 3));
        break;
      default:
        startDate = new Date(0);
    }

    paymentsData = paymentsData.filter(c => {
      const date = new Date(c.scheduled_at);
      return date >= startDate && date <= endDate;
    });
  }

  const totalPaid = paymentsData
    .filter(c => c.payment_status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPending = paymentsData
    .filter(c => c.payment_status === 'pending')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalRefunded = paymentsData
    .filter(c => c.payment_status === 'refunded')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  // Get upcoming payments (future consultations)
  const upcomingPayments = consultations
    .filter(c => new Date(c.scheduled_at) > new Date() && c.payment_status === 'pending' && c.amount)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  // Unique lawyers for filter
  const lawyers = [...new Map(
    consultations
      .filter(c => c.lawyer_profiles?.profiles?.full_name)
      .map(c => [c.lawyer_id, c.lawyer_profiles.profiles.full_name])
  ).entries()];

  // Calculate monthly spending for chart
  const monthlySpending = paymentsData
    .filter(c => c.payment_status === 'paid')
    .reduce((acc: Record<string, number>, c) => {
      const month = format(new Date(c.scheduled_at), 'MMM yyyy');
      acc[month] = (acc[month] || 0) + Number(c.amount);
      return acc;
    }, {});

  const handleDownloadInvoice = (payment: any) => {
    // Generate and download PDF invoice
    const invoiceData = `
      INVOICE
      
      Consultation with ${payment.lawyer_profiles?.profiles?.full_name || 'Lawyer'}
      Date: ${format(new Date(payment.scheduled_at), "PPP")}
      Amount: $${Number(payment.amount).toFixed(2)}
      Status: ${payment.payment_status}
      Practice Area: ${payment.practice_areas?.name || 'Legal Consultation'}
      
      Thank you for using Lawckin!
    `;
    
    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${payment.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Payments & Invoices</h1>
        <p className="text-muted-foreground">Manage your payment history and methods</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentsData.filter(c => c.payment_status === 'paid').length} consultations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentsData.filter(c => c.payment_status === 'pending').length} awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Refunded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">${totalRefunded.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentsData.filter(c => c.payment_status === 'refunded').length} refunds processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">
                      {method.type} •••• {method.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                  {method.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
            <CardDescription>Future consultation payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {payment.lawyer_profiles?.profiles?.full_name || "Lawyer"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due: {format(new Date(payment.scheduled_at), "PPP")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${Number(payment.amount).toFixed(2)}</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Chart */}
      {Object.keys(monthlySpending).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Spending
            </CardTitle>
            <CardDescription>Your consultation expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(monthlySpending)
                .reverse()
                .slice(0, 6)
                .map(([month, amount]) => {
                  const maxAmount = Math.max(...Object.values(monthlySpending).map(Number));
                  const percentage = Math.min((Number(amount) / maxAmount) * 100, 100);
                  return (
                    <div key={month} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-24">{month}</span>
                      <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all flex items-center justify-end pr-3"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-semibold text-primary-foreground">
                            ${Number(amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Filter and view your payment history
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>

            {lawyers.length > 1 && (
              <Select value={filterLawyer} onValueChange={setFilterLawyer}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Lawyer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lawyers</SelectItem>
                  {lawyers.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {paymentsData.length > 0 ? (
            <div className="space-y-3">
              {paymentsData.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {payment.lawyer_profiles?.profiles?.full_name || "Lawyer"}
                      </p>
                      <Badge 
                        variant={
                          payment.payment_status === 'paid' ? 'default' :
                          payment.payment_status === 'pending' ? 'outline' :
                          payment.payment_status === 'refunded' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {payment.payment_status || 'pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.scheduled_at), "PPP")}
                    </p>
                    {payment.practice_areas?.name && (
                      <p className="text-xs text-muted-foreground">
                        {payment.practice_areas.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold text-lg">
                      ${Number(payment.amount).toFixed(2)}
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDownloadInvoice(payment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-2">No payments found</p>
              <p className="text-sm text-muted-foreground">
                {filterStatus !== "all" || filterLawyer !== "all" || dateRange !== "all"
                  ? "Try adjusting your filters"
                  : "Your payment history will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax Summary */}
      {paymentsData.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Annual Tax Summary</CardTitle>
            <CardDescription>Consultation expenses for tax purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Year to Date</p>
                <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Tax Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientPayments;
