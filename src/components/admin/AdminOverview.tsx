import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Building2, Calendar, DollarSign, AlertCircle, TrendingUp, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Stats {
  totalLawyers: number;
  verifiedLawyers: number;
  pendingLawyers: number;
  totalClients: number;
  totalFirms: number;
  totalBookings: number;
  pendingVerifications: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

export function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalLawyers: 0,
    verifiedLawyers: 0,
    pendingLawyers: 0,
    totalClients: 0,
    totalFirms: 0,
    totalBookings: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [dateRange, setDateRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentBookings();
    fetchRecentActivity();
  }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch lawyer stats
      const { data: lawyers } = await supabase
        .from("lawyer_profiles")
        .select("verified, verification_status");

      // Fetch client count
      const { count: clientCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client");

      // Fetch firms count
      const { count: firmsCount } = await supabase
        .from("firms")
        .select("*", { count: "exact", head: true });

      // Fetch bookings count
      const { count: bookingsCount } = await supabase
        .from("consultations")
        .select("*", { count: "exact", head: true });

      // Fetch revenue data
      const { data: consultations } = await supabase
        .from("consultations")
        .select("amount, payment_status, created_at");

      const verifiedCount = lawyers?.filter((l) => l.verified).length || 0;
      const pendingCount = lawyers?.filter((l) => l.verification_status === "pending").length || 0;

      // Calculate revenue
      const totalRevenue = consultations
        ?.filter((c) => c.payment_status === "paid" && c.amount)
        .reduce((sum, c) => sum + (parseFloat(String(c.amount)) || 0), 0) || 0;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const revenueThisMonth = consultations
        ?.filter(
          (c) =>
            c.payment_status === "paid" &&
            c.amount &&
            new Date(c.created_at) >= startOfMonth
        )
        .reduce((sum, c) => sum + (parseFloat(String(c.amount)) || 0), 0) || 0;

      setStats({
        totalLawyers: lawyers?.length || 0,
        verifiedLawyers: verifiedCount,
        pendingLawyers: pendingCount,
        totalClients: clientCount || 0,
        totalFirms: firmsCount || 0,
        totalBookings: bookingsCount || 0,
        pendingVerifications: pendingCount,
        totalRevenue,
        revenueThisMonth,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const { data } = await supabase
        .from("consultations")
        .select(`
          *,
          profiles!consultations_client_id_fkey(full_name, email),
          lawyer_profiles!consultations_lawyer_id_fkey(
            user_id,
            profiles!lawyer_profiles_user_id_fkey(full_name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentBookings(data || []);
    } catch (error) {
      console.error("Error fetching recent bookings:", error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      const activities: RecentActivity[] = (data || []).map((log) => ({
        id: log.id,
        type: log.action,
        description: `${log.action.replace(/_/g, " ")} - ${log.entity_type}`,
        timestamp: log.created_at,
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const statCards = [
    {
      title: "Total Lawyers",
      value: stats.totalLawyers,
      subtitle: `${stats.verifiedLawyers} verified`,
      icon: Users,
      color: "text-blue-600",
      onClick: () => navigate("/admin/lawyers"),
    },
    {
      title: "Pending Verification",
      value: stats.pendingLawyers,
      subtitle: "Awaiting review",
      icon: UserCheck,
      color: "text-orange-600",
      onClick: () => navigate("/admin/lawyers"),
    },
    {
      title: "Active Clients",
      value: stats.totalClients,
      subtitle: "Registered users",
      icon: Users,
      color: "text-green-600",
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtitle: `$${stats.revenueThisMonth.toLocaleString()} this month`,
      icon: DollarSign,
      color: "text-green-600",
      onClick: () => navigate("/admin/bookings"),
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      subtitle: "All time",
      icon: Calendar,
      color: "text-indigo-600",
      onClick: () => navigate("/admin/bookings"),
    },
    {
      title: "Firms",
      value: stats.totalFirms,
      subtitle: "Active firms",
      icon: Building2,
      color: "text-purple-600",
      onClick: () => navigate("/admin/users"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          <p className="text-muted-foreground">Monitor your platform's key metrics</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {stats.pendingVerifications > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.pendingVerifications} lawyer{stats.pendingVerifications !== 1 ? "s" : ""} pending verification.
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => navigate("/admin/lawyers")}
            >
              Review now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className={stat.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent bookings
              </p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {booking.profiles?.full_name || "Unknown Client"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.scheduled_at &&
                          format(new Date(booking.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate("/admin/bookings")}
                >
                  View All Bookings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate("/admin/audit")}
                >
                  View Audit Log
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
