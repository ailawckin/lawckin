import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Building2, Users, Home, Briefcase, Shield, Gavel, FileText, Heart, Landmark } from "lucide-react";

const iconMap: Record<string, any> = {
  "Family Law": Users,
  "Criminal Defense": Shield,
  "Corporate Law": Building2,
  "Real Estate": Home,
  "Employment Law": Briefcase,
  "Civil Litigation": Scale,
  "Immigration Law": Landmark,
  "Personal Injury": Heart,
  "Estate Planning": FileText,
  "Bankruptcy": Gavel,
};

const PracticeAreas = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    fetchPracticeAreas();
  }, []);

  const fetchPracticeAreas = async () => {
    const { data } = await supabase
      .from("practice_areas")
      .select("*")
      .order("name");

    if (data) {
      setAreas(data);
    }
  };
  return (
    <section id="practice-areas" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Practice Areas</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find specialized attorneys for your specific legal needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => {
            const Icon = iconMap[area.name] || Scale;
            return (
              <div
                key={area.id}
                className="elegant-card cursor-pointer group hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/practice-areas/${area.id}`)}
              >
                <Icon className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold mb-2">{area.name}</h3>
                <p className="text-muted-foreground">{area.description || "Expert legal services"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PracticeAreas;
