import { Star, MapPin, Briefcase, Eye, DollarSign, Building2, CalendarClock, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface LawyerCardProps {
  id?: string;
  name: string;
  specialty: string;
  practiceAreaDisplay?: string;
  location: string;
  experience: string;
  rating: number;
  reviews: number;
  image: string;
  viewCount?: number;
  hourlyRate?: number | null;
  firmName?: string | null;
  languages?: string[] | null;
  nextAvailableAt?: string | null;
}

const getPracticeAreaStyles = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes("family") || normalized.includes("divorce") || normalized.includes("child")) {
    return { accent: "bg-rose-500/80", label: "text-rose-700" };
  }
  if (normalized.includes("immigration") || normalized.includes("asylum") || normalized.includes("visa")) {
    return { accent: "bg-sky-500/80", label: "text-sky-700" };
  }
  if (normalized.includes("criminal") || normalized.includes("dui") || normalized.includes("defense")) {
    return { accent: "bg-amber-500/80", label: "text-amber-700" };
  }
  if (normalized.includes("corporate") || normalized.includes("business") || normalized.includes("startup")) {
    return { accent: "bg-indigo-500/80", label: "text-indigo-700" };
  }
  if (normalized.includes("real estate") || normalized.includes("property") || normalized.includes("housing")) {
    return { accent: "bg-emerald-500/80", label: "text-emerald-700" };
  }
  if (normalized.includes("employment") || normalized.includes("labor") || normalized.includes("workplace")) {
    return { accent: "bg-orange-500/80", label: "text-orange-700" };
  }
  if (normalized.includes("ip") || normalized.includes("intellectual") || normalized.includes("patent")) {
    return { accent: "bg-purple-500/80", label: "text-purple-700" };
  }
  return { accent: "bg-slate-400/80", label: "text-slate-600" };
};

const LawyerCard = ({
  id,
  name,
  specialty,
  practiceAreaDisplay,
  location,
  experience,
  rating,
  reviews,
  image,
  viewCount,
  hourlyRate,
  firmName,
  languages,
  nextAvailableAt,
}: LawyerCardProps) => {
  const navigate = useNavigate();
  const [views, setViews] = useState(viewCount || 0);
  const styles = getPracticeAreaStyles(specialty);
  const displaySpecialty = practiceAreaDisplay || specialty;
  const showRating = reviews > 0 && rating > 0;
  const isTopRated = rating >= 4.7 && reviews >= 10;
  const languageList = (languages || []).filter(Boolean);
  const primaryLanguages = languageList.slice(0, 2);
  const extraLanguageCount = Math.max(0, languageList.length - primaryLanguages.length);

  useEffect(() => {
    if (id && !viewCount) {
      fetchViewCount();
    }
  }, [id]);

  const fetchViewCount = async () => {
    if (!id) return;
    
    const { data } = await supabase
      .from('lawyer_view_stats')
      .select('total_views')
      .eq('lawyer_id', id)
      .maybeSingle();
    
    if (data) {
      setViews(data.total_views);
    }
  };
  
  return (
    <div className="elegant-card h-full flex flex-col relative overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-md">
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.accent}`} />
      <div className="flex gap-4">
        <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
          <img
            src={image}
            alt={`${name} - ${specialty} lawyer`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-snug truncate">{name}</h3>
              <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.12em] ${styles.label}`}>
                {displaySpecialty}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {showRating ? (
                <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                  <span>{rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({reviews})</span>
                </div>
              ) : (
                <Badge variant="outline" className="text-xs">New</Badge>
              )}
              {isTopRated && (
                <Badge variant="default" className="text-[10px] uppercase tracking-wider px-2">
                  Top Rated
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm min-h-[84px]">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs uppercase tracking-wide">Location</span>
              </div>
              <div className="truncate font-medium text-foreground">{location}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs uppercase tracking-wide">Experience</span>
              </div>
              <div className="truncate font-medium text-foreground">{experience}</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs uppercase tracking-wide">Firm</span>
              </div>
              <div className="truncate font-medium text-foreground">
                {firmName || "Independent"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs uppercase tracking-wide">Rate</span>
              </div>
              <div className="truncate font-medium text-foreground">
                {hourlyRate && hourlyRate > 0 ? `$${hourlyRate.toFixed(0)}/hour` : "On request"}
              </div>
            </div>
          </div>

          {(primaryLanguages.length > 0 || nextAvailableAt) && (
            <div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground">
              {primaryLanguages.length > 0 && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5" />
                  <span>
                    {primaryLanguages.join(", ")}
                    {extraLanguageCount > 0 ? ` +${extraLanguageCount}` : ""}
                  </span>
                </div>
              )}
              {nextAvailableAt && (
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>Next available {format(new Date(nextAvailableAt), "MMM d")}</span>
                </div>
              )}
            </div>
          )}

          {views > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              <span>{views} views</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border flex gap-2">
        <Button onClick={() => id && navigate(`/lawyers/${id}`)} variant="outline" className="flex-1">
          View Profile
        </Button>
        <Button onClick={() => id && navigate(`/book-consultation/${id}`)} className="flex-1">
          Book Consultation
        </Button>
      </div>
    </div>
  );
};

export default LawyerCard;
