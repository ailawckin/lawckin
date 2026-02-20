import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
