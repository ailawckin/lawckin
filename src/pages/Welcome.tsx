import { useNavigate } from "react-router-dom";
import { Scale, UserPlus, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Welcome = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: UserPlus,
      title: "Create Your Account",
      description: "Sign up and choose your role - client or lawyer",
    },
    {
      icon: Search,
      title: "Find the Right Lawyer",
      description: "Browse verified attorneys by practice area and expertise",
    },
    {
      icon: Calendar,
      title: "Book Consultation",
      description: "Schedule meetings at your convenience with instant booking",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold brand-wordmark">Lawckin</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="default">
            Get Started
          </Button>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">
              Welcome to <span className="text-primary brand-wordmark">Lawckin</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your gateway to connecting with professional legal experts instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {steps.map((step, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center space-y-6">
              <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join Lawckin today and experience seamless legal consultations
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Sign Up Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/")}>
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-8">For Lawyers</h3>
            <Card>
              <CardContent className="p-8">
                <p className="text-muted-foreground mb-6">
                  Are you a legal professional? Join our network and connect with clients who need your expertise.
                </p>
                <Button onClick={() => navigate("/auth")} variant="default" size="lg">
                  Join as a Lawyer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Welcome;
