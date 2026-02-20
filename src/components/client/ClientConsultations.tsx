import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Download,
  FileText,
  Star,
  RefreshCw,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { format, isBefore, isAfter, subMinutes, formatDistanceToNow, differenceInDays, differenceInHours } from "date-fns";
import { useState } from "react";
import { getPrimaryLocation, getPrimaryPracticeArea } from "@/lib/lawyerDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useReviews } from "@/hooks/useReviews";

interface ClientConsultationsProps {
  consultations: any[];
  onCancelConsultation: (id: string) => void;
}

const ClientConsultations = ({ consultations, onCancelConsultation }: ClientConsultationsProps) => {
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [consultationNotes, setConsultationNotes] = useState<Record<string, string>>({});
  const [selectedRating, setSelectedRating] = useState<Record<string, number>>({});
  const [reviewText, setReviewText] = useState<Record<string, string>>({});
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [consultationToCancel, setConsultationToCancel] = useState<string | null>(null);
  const { submitReview, submitting } = useReviews();

  const handleCancelClick = (consultationId: string) => {
    setConsultationToCancel(consultationId);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (consultationToCancel) {
      onCancelConsultation(consultationToCancel);
    }
    setCancelDialogOpen(false);
    setConsultationToCancel(null);
  };

  const now = new Date();
  
  const upcoming = consultations
    .filter(c => 
      isAfter(new Date(c.scheduled_at), now) && 
      c.status !== 'cancelled' && 
      c.status !== 'completed'
    )
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  
  const past = consultations
    .filter(c => 
      isBefore(new Date(c.scheduled_at), now) || 
      c.status === 'completed'
    )
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  
  const cancelled = consultations
    .filter(c => c.status === 'cancelled')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const canJoinMeeting = (consultation: any) => {
    const meetingTime = new Date(consultation.scheduled_at);
    return isBefore(now, meetingTime) && 
           isAfter(now, subMinutes(meetingTime, 10)) &&
           consultation.meeting_link;
  };

  const getUrgencyBadge = (consultation: any) => {
    const hoursUntil = differenceInHours(new Date(consultation.scheduled_at), now);
    if (hoursUntil < 24) {
      return <Badge variant="destructive" className="ml-2">Urgent - within 24h</Badge>;
    } else if (hoursUntil < 48) {
      return <Badge variant="outline" className="ml-2">Soon</Badge>;
    }
    return null;
  };

  const getPreparationTips = (practiceArea: string) => {
    const tips: Record<string, string[]> = {
      "Family Law": [
        "Gather all relevant family documents (marriage certificates, birth certificates)",
        "Prepare a timeline of important events",
        "List any concerns about custody or support"
      ],
      "Real Estate": [
        "Collect property documents and contracts",
        "List all questions about the transaction",
        "Bring copies of any correspondence"
      ],
      "Business Law": [
        "Prepare business formation documents",
        "List your business structure questions",
        "Bring financial statements if relevant"
      ]
    };
    
    return tips[practiceArea] || [
      "Review all relevant documents",
      "Prepare your questions in advance",
      "Bring identification and any contracts"
    ];
  };

  const handleDownloadCalendar = (consultation: any) => {
    const event = {
      title: `Consultation with ${consultation.lawyer_profiles?.profiles?.full_name || 'Lawyer'}`,
      start: new Date(consultation.scheduled_at),
      duration: consultation.duration_minutes || 30,
      description: `Practice Area: ${consultation.practice_areas?.name || 'Legal Consultation'}`,
      location: consultation.meeting_link || 'Virtual Meeting'
    };

    // Create iCal format
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${format(event.start, "yyyyMMdd'T'HHmmss")}
DURATION:PT${event.duration}M
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultation-${consultation.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderConsultationCard = (consultation: any, isPast: boolean = false) => {
    const practiceArea = consultation.practice_areas?.name || '';
    const preparationTips = getPreparationTips(practiceArea);
    const primaryPracticeArea = consultation.lawyer_profiles
      ? getPrimaryPracticeArea(consultation.lawyer_profiles)
      : "";
    const primaryLocation = consultation.lawyer_profiles
      ? getPrimaryLocation(consultation.lawyer_profiles)
      : "";

    return (
      <Card key={consultation.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 space-y-4">
            {/* Header with Lawyer Info */}
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {consultation.lawyer_profiles?.profiles?.full_name || "Lawyer"}
                  </h3>
                  {!isPast && getUrgencyBadge(consultation)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {primaryPracticeArea}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {consultation.status === 'confirmed' && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
                {consultation.status === 'pending' && (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                {consultation.status === 'cancelled' && (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <Badge
                  variant={
                    consultation.status === "confirmed" ? "default" :
                    consultation.status === "completed" ? "secondary" :
                    consultation.status === "cancelled" ? "destructive" : "outline"
                  }
                >
                  {consultation.status}
                </Badge>
              </div>
            </div>

            {/* Countdown Timer for Upcoming */}
            {!isPast && consultation.status !== 'cancelled' && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>{formatDistanceToNow(new Date(consultation.scheduled_at), { addSuffix: true })}</strong>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Consultation Details */}
            <div className="grid gap-3 text-sm bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{format(new Date(consultation.scheduled_at), "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{format(new Date(consultation.scheduled_at), "h:mm a")} · {consultation.duration_minutes} minutes</span>
              </div>
              {practiceArea && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{practiceArea}</span>
                </div>
              )}
              {primaryLocation && primaryLocation !== "Not specified" && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{primaryLocation}</span>
                </div>
              )}
              {consultation.meeting_link && (
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <a 
                    href={consultation.meeting_link} 
                    className="text-primary hover:underline"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Virtual Meeting Link
                  </a>
                </div>
              )}
            </div>

            {/* Preparation Tips for Upcoming */}
            {!isPast && consultation.status !== 'cancelled' && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Preparation Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {preparationTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Notes Section for Upcoming */}
            {!isPast && consultation.status !== 'cancelled' && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setExpandedNotes(expandedNotes === consultation.id ? null : consultation.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {expandedNotes === consultation.id ? 'Hide Notes' : 'Add Notes & Questions'}
                </Button>
                
                {expandedNotes === consultation.id && (
                  <Textarea
                    placeholder="Write down questions or information for your lawyer..."
                    value={consultationNotes[consultation.id] || ''}
                    onChange={(e) => setConsultationNotes({
                      ...consultationNotes,
                      [consultation.id]: e.target.value
                    })}
                    rows={4}
                    className="mt-2"
                  />
                )}
              </div>
            )}

            {/* Rating for Past Consultations */}
            {isPast && consultation.status === 'completed' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">How was your consultation?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating({ ...selectedRating, [consultation.id]: star })}
                        className="transition-colors"
                        disabled={submitting}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            (selectedRating[consultation.id] || 0) >= star
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {selectedRating[consultation.id] && (
                    <>
                      <Textarea
                        placeholder="Share your experience (optional)..."
                        value={reviewText[consultation.id] || ""}
                        onChange={(e) => setReviewText({ ...reviewText, [consultation.id]: e.target.value })}
                        rows={3}
                      />
                      <Button 
                        size="sm" 
                        className="w-full"
                        disabled={submitting}
                        onClick={async () => {
                          const success = await submitReview(
                            consultation.id,
                            consultation.lawyer_id,
                            selectedRating[consultation.id],
                            reviewText[consultation.id]
                          );
                          if (success) {
                            setSelectedRating({ ...selectedRating, [consultation.id]: 0 });
                            setReviewText({ ...reviewText, [consultation.id]: "" });
                          }
                        }}
                      >
                        {submitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Refund Info for Cancelled */}
            {consultation.status === 'cancelled' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Refund Status: Processing</p>
                    <p className="text-sm">Expected within 5-7 business days to your original payment method</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {canJoinMeeting(consultation) && (
                <Button asChild className="flex-1">
                  <a href={consultation.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Join Meeting
                  </a>
                </Button>
              )}
              
              {!isPast && consultation.status !== 'cancelled' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadCalendar(consultation)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelClick(consultation.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}

              {isPast && consultation.status === 'completed' && (
                <Button size="sm" variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Book Follow-up
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDownloadCalendar(consultation)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Consultation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this consultation? This action cannot be undone. 
              You will receive a refund within 5-7 business days if the cancellation is more than 24 hours before the scheduled time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Consultation</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Consultation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <h1 className="text-3xl font-bold mb-2">My Consultations</h1>
        <p className="text-muted-foreground">Manage and track all your legal consultations</p>
      </div>

      {/* Upcoming */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upcoming ({upcoming.length})</h2>
        </div>
        
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map(c => renderConsultationCard(c, false))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground text-center mb-2">No upcoming consultations</p>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Schedule a consultation with a lawyer to get started
              </p>
              <Button>Find a Lawyer</Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Consultations ({past.length})</h2>
          <div className="space-y-4">
            {past.map(c => renderConsultationCard(c, true))}
          </div>
        </div>
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cancelled ({cancelled.length})</h2>
          <div className="space-y-4">
            {cancelled.map(c => renderConsultationCard(c, true))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientConsultations;
