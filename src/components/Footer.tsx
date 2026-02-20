import { Scale } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-6 w-6" />
              <span className="text-xl font-bold brand-wordmark">Lawckin</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Connecting clients with verified lawyers since 2025.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Clients</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/lawyers" className="hover:text-primary-foreground transition-colors">Find a Lawyer</Link></li>
              <li><Link to="/welcome" className="hover:text-primary-foreground transition-colors">How It Works</Link></li>
              <li><Link to="/#practice-areas" className="hover:text-primary-foreground transition-colors">Practice Areas</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">For Attorneys</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/welcome" className="hover:text-primary-foreground transition-colors">Join Our Network</Link></li>
              <li><Link to="/auth" className="hover:text-primary-foreground transition-colors">Sign Up</Link></li>
              <li><Link to="/lawyer-dashboard" className="hover:text-primary-foreground transition-colors">Lawyer Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Contact</Link></li>
              <li><Link to="/" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          <p>© 2025 Lawckin. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
