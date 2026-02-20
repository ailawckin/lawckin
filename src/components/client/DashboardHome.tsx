import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  Video, 
  DollarSign, 
  Star,
  AlertCircle,
  ArrowRight,
  Search,
  Briefcase,
  MessageSquare
} from "lucide-react";
import { format, isBefore, isAfter, subMinutes, formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { getPrimaryPracticeArea } from "@/lib/lawyerDisplay";

interface DashboardHomeProps {
  consultations: any[];
  onTabChange: (tab: string) => void;
  profile?: any;
}

const DashboardHome = ({ consultations, onTabChange, profile }: DashboardHomeProps) => {
  const navigate = useNavigate();
  
  const now = new Date();
  const upcomingConsultations = consultations
    .filter(c => c.status !== 'cancelled' && c.status !== 'completed')
    .filter(c => isAfter(new Date(c.scheduled_at), now))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  
  const completedConsultations = consultations.filter(c => c.status === 'completed');
  const nextConsultation = upcomingConsultations[0];
  
  const totalSpent = consultations
    .filter(c => c.amount && c.payment_status === 'paid')
    .reduce((sum, c) => sum + Number(c.amount), 0);
  
  const canJoinMeeting = nextConsultation && isBefore(now, new Date(nextConsultation.scheduled_at)) && 
    isAfter(now, subMinutes(new Date(nextConsultation.scheduled_at), 10));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {profile?.full_name || 'Client'}! 👋
              </h1>
              <p className="text-muted-foreground">
                {upcomingConsultations.length > 0 
                  ? `You have ${upcomingConsultations.length} upcoming consultation${upcomingConsultations.length > 1 ? 's' : ''}`
                  : "Ready to find legal help?"}
              </p>
            </div>
            {upcomingConsultations.length === 0 && (
              <Button size="lg" onClick={() => navigate("/lawyers")}>
                Find a Lawyer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Total Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedConsultations.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all consultations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingConsultations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {nextConsultation 
                ? formatDistanceToNow(new Date(nextConsultation.scheduled_at), { addSuffix: true })
                : 'No upcoming consultations'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Consultation Alert */}
      {nextConsultation && (
        <Alert className="border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Your next consultation is <strong>{formatDistanceToNow(new Date(nextConsultation.scheduled_at), { addSuffix: true })}</strong>
              </span>
              {canJoinMeeting && nextConsultation.meeting_link && (
                <Button size="sm" asChild>
                  <a href={nextConsultation.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Join Now
                  </a>
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Next Consultation Details */}
      {nextConsultation ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={nextConsultation.lawyer_profiles?.profiles?.avatar_url} />
                  <AvatarFallback>
                    {nextConsultation.lawyer_profiles?.profiles?.full_name?.[0] || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {nextConsultation.lawyer_profiles?.profiles?.full_name || "Lawyer"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {nextConsultation.lawyer_profiles
                      ? getPrimaryPracticeArea(nextConsultation.lawyer_profiles)
                      : ""}
                  </p>
                </div>
                <Badge variant={nextConsultation.status === 'confirmed' ? 'default' : 'outline'}>
                  {nextConsultation.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(nextConsultation.scheduled_at), "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(nextConsultation.scheduled_at), "h:mm a")}</span>
                </div>
                {nextConsultation.practice_areas?.name && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{nextConsultation.practice_areas.name}</span>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => onTabChange("consultations")} className="w-full">
                View All Consultations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Find a lawyer to help with your legal needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground mb-4">No upcoming consultations</p>
              <Button onClick={() => navigate("/lawyers")}>Find a Lawyer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" onClick={() => navigate("/lawyers")} className="h-auto py-4 flex-col gap-2">
              <Search className="h-5 w-5" />
              <span className="text-sm">Find Lawyers</span>
            </Button>
            <Button variant="outline" onClick={() => onTabChange("consultations")} className="h-auto py-4 flex-col gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">My Consultations</span>
            </Button>
            <Button variant="outline" onClick={() => onTabChange("messages")} className="h-auto py-4 flex-col gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm">Messages</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHome;
