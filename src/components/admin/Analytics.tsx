import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, DollarSign, Calendar } from "lucide-react";

interface AnalyticsData {
  bookingsByMonth: Array<{ month: string; bookings: number; revenue: number }>;
  lawyersByStatus: Array<{ status: string; count: number }>;
  practiceAreaBookings: Array<{ area: string; bookings: number }>;
  revenueByStatus: Array<{ status: string; revenue: number }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    bookingsByMonth: [],
    lawyersByStatus: [],
    practiceAreaBookings: [],
    revenueByStatus: [],
  });
  const [dateRange, setDateRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch bookings data
      const { data: bookings } = await supabase
        .from("consultations")
        .select("created_at, amount, payment_status, practice_area_id")
        .gte("created_at", startDate.toISOString());

      // Fetch lawyer status data
      const { data: lawyers } = await supabase
        .from("lawyer_profiles")
        .select("verification_status");

      // Process bookings by month
      const bookingsByMonthMap = new Map<string, { bookings: number; revenue: number }>();
      (bookings || []).forEach((booking) => {
        const month = new Date(booking.created_at).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const existing = bookingsByMonthMap.get(month) || { bookings: 0, revenue: 0 };
        existing.bookings += 1;
        if (booking.payment_status === "paid" && booking.amount) {
          existing.revenue += booking.amount;
        }
        bookingsByMonthMap.set(month, existing);
      });

      const bookingsByMonth = Array.from(bookingsByMonthMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Process lawyers by status
      const lawyersByStatusMap = new Map<string, number>();
      (lawyers || []).forEach((lawyer) => {
        const status = lawyer.verification_status || "pending";
        lawyersByStatusMap.set(status, (lawyersByStatusMap.get(status) || 0) + 1);
      });

      const lawyersByStatus = Array.from(lawyersByStatusMap.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
      }));

      // Process practice area bookings
      const { data: practiceAreas } = await supabase
        .from("practice_areas")
        .select("id, name");

      const practiceAreaMap = new Map(
        (practiceAreas || []).map((pa) => [pa.id, pa.name])
      );

      const practiceAreaBookingsMap = new Map<string, number>();
      (bookings || []).forEach((booking) => {
        if (booking.practice_area_id) {
          const areaName = practiceAreaMap.get(booking.practice_area_id) || "Unknown";
          practiceAreaBookingsMap.set(
            areaName,
            (practiceAreaBookingsMap.get(areaName) || 0) + 1
          );
        }
      });

      const practiceAreaBookings = Array.from(practiceAreaBookingsMap.entries())
        .map(([area, bookings]) => ({ area, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Process revenue by status
      const revenueByStatusMap = new Map<string, number>();
      (bookings || []).forEach((booking) => {
        if (booking.payment_status && booking.amount) {
          const status = booking.payment_status;
          revenueByStatusMap.set(
            status,
            (revenueByStatusMap.get(status) || 0) + booking.amount
          );
        }
      });

      const revenueByStatus = Array.from(revenueByStatusMap.entries()).map(
        ([status, revenue]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          revenue,
        })
      );

      setData({
        bookingsByMonth,
        lawyersByStatus,
        practiceAreaBookings,
        revenueByStatus,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Platform performance and insights</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Bookings and Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings & Revenue Trend</CardTitle>
              <CardDescription>Monthly bookings and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.bookingsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" fill="#8884d8" name="Bookings" />
                  <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Lawyers by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Lawyers by Status</CardTitle>
                <CardDescription>Verification status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.lawyersByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) =>
                        `${status}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.lawyersByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Practice Areas */}
            <Card>
              <CardHeader>
                <CardTitle>Top Practice Areas</CardTitle>
                <CardDescription>Most booked practice areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.practiceAreaBookings} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="area" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Status</CardTitle>
              <CardDescription>Revenue breakdown by payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenueByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

