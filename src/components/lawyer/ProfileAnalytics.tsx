import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfileViews } from "@/hooks/useProfileViews";
import { Eye, TrendingUp, TrendingDown, Users, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface ProfileAnalyticsProps {
  lawyerId: string;
}

const ProfileAnalytics = ({ lawyerId }: ProfileAnalyticsProps) => {
  const { stats, dailyViews, recentViewers, loading } = useProfileViews(lawyerId);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate percentage changes
  const weeklyChange = stats && stats.views_last_7_days > 0 
    ? Math.round(((stats.views_last_7_days / (stats.views_last_30_days - stats.views_last_7_days)) - 1) * 100)
    : 0;

  // Format chart data
  const chartData = dailyViews
    .slice()
    .reverse()
    .map(d => ({
      date: format(new Date(d.view_date), 'MMM dd'),
      views: d.view_count,
    }));

  const chartConfig = {
    views: {
      label: "Profile Views",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_views || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time profile views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Views</CardTitle>
            {weeklyChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.views_last_7_days || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {weeklyChange > 0 ? '+' : ''}{weeklyChange}% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Views</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.views_last_30_days || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unique_viewers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Authenticated users</p>
          </CardContent>
        </Card>
      </div>

      {/* Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Profile Views (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No view data available yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Viewers */}
      {recentViewers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentViewers.map((viewer) => (
                <div key={viewer.viewer_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={viewer.avatar_url || undefined} />
                      <AvatarFallback>
                        {viewer.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{viewer.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(viewer.viewed_at), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Viewed</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileAnalytics;
