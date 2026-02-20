import { useState, useEffect, useCallback } from "react";
import { Menu, LogOut, LayoutDashboard, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import logo from "@/assets/lawckin-logo.png";
import FindLawyerModal from "./FindLawyerModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [findLawyerModalOpen, setFindLawyerModalOpen] = useState(false);
  const [isPracticeAreasActive, setIsPracticeAreasActive] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const fetchUserRole = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setUserRole(data.role);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  }, []);

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await Promise.all([fetchUserRole(user.id), fetchProfile(user.id)]);
    }
  }, [fetchProfile, fetchUserRole]);

  useEffect(() => {
    void checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        void Promise.all([fetchUserRole(session.user.id), fetchProfile(session.user.id)]);
      } else {
        setUser(null);
        setUserRole(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkUser, fetchProfile, fetchUserRole]);

  const isActive = (path: string) => location.pathname === path;

  // Track if practice areas section is in view
  useEffect(() => {
    if (location.pathname !== "/") {
      setIsPracticeAreasActive(false);
      return;
    }

    const checkHash = () => {
      setIsPracticeAreasActive(location.hash === "#practice-areas");
    };

    checkHash();
    window.addEventListener("hashchange", checkHash);

    // Handle scroll to top - clear hash and deactivate practice areas
    const handleScroll = () => {
      if (window.scrollY < 100 && location.hash === "#practice-areas") {
        window.history.replaceState(null, "", location.pathname);
        setIsPracticeAreasActive(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Also use IntersectionObserver to detect when section is in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setIsPracticeAreasActive(true);
            // Update hash without scrolling
            if (location.hash !== "#practice-areas") {
              window.history.replaceState(null, "", "#practice-areas");
            }
          } else if (entry.intersectionRatio < 0.1) {
            // Only deactivate if we've scrolled well past it or back to top
            if (entry.boundingClientRect.top < -200 || window.scrollY < 100) {
              setIsPracticeAreasActive(false);
              if (window.scrollY < 100 && location.hash === "#practice-areas") {
                window.history.replaceState(null, "", location.pathname);
              }
            }
          }
        });
      },
      { threshold: [0.1, 0.3, 0.5] }
    );

    const practiceAreasElement = document.getElementById("practice-areas");
    if (practiceAreasElement) {
      observer.observe(practiceAreasElement);
    }

    return () => {
      window.removeEventListener("hashchange", checkHash);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [location.pathname, location.hash]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
    navigate("/");
  };

  const getDashboardLink = () => {
    if (userRole === "lawyer") return "/lawyer-dashboard";
    if (userRole === "admin") return "/admin";
    return "/dashboard";
  };

  const handleScrollToTop = () => {
    // If we're on the home page, scroll to top
    if (window.location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      // Navigate to home page first, then scroll to top
      navigate("/");
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 300);
    }
  };

  const handleScrollToSection = (hash: string) => {
    // If we're on the home page, scroll to section
    if (window.location.pathname === "/") {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          const headerOffset = 80; // Account for fixed header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    } else {
      // Navigate to home page first, then scroll
      navigate("/");
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 300);
    }
  };

  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            to="/" 
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-2 hover:opacity-90 transition-all group"
          >
            <img src={logo} alt="Lawckin" className="h-10 w-auto group-hover:scale-105 transition-transform" />
            <span className="text-xl font-bold brand-wordmark">Lawckin</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              onClick={(e) => {
                if (location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`text-sm font-medium transition-colors ${
                isActive('/') && !isPracticeAreasActive ? 'text-primary font-semibold' : 'hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/lawyers" 
              className={`text-sm font-medium transition-colors ${
                isActive('/lawyers') ? 'text-primary font-semibold' : 'hover:text-primary'
              }`}
            >
              Find Lawyers
            </Link>
            <button
              onClick={() => handleScrollToSection("#practice-areas")}
              className={`text-sm font-medium transition-colors ${
                isPracticeAreasActive ? 'text-primary font-semibold' : 'hover:text-primary'
              }`}
            >
              Practice Areas
            </button>
            <button
              onClick={() => setFindLawyerModalOpen(true)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              aria-label="Quick search for lawyers"
            >
              <Search className="h-4 w-4" />
            </button>
          </nav>

        {/* Mobile Navigation */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open navigation menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors py-2 ${
                  isActive('/') && !isPracticeAreasActive ? 'text-primary font-semibold' : 'hover:text-primary'
                }`}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (location.pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                Home
              </Link>
              <Link 
                to="/lawyers" 
                className="text-sm font-medium hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Lawyers
              </Link>
              <button
                onClick={() => {
                  handleScrollToSection("#practice-areas");
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-sm font-medium transition-colors py-2 ${
                  isPracticeAreasActive ? 'text-primary font-semibold' : 'hover:text-primary'
                }`}
              >
                Practice Areas
              </button>
              
              <div className="border-t my-2" />
              
              {user ? (
                <>
                  <Link 
                    to={getDashboardLink()}
                    className="text-sm font-medium hover:text-primary transition-colors py-2 flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  {userRole === "admin" && (
                    <Link 
                      to="/admin"
                      className="text-sm font-medium hover:text-primary transition-colors py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-sm font-medium hover:text-primary transition-colors py-2 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => {
                      setFindLawyerModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start"
                  >
                    Find a Lawyer
                  </Button>
                  <Link 
                    to="/auth"
                    className="text-sm font-medium hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden lg:inline text-sm">
                    {profile?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                {userRole === "admin" && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                onClick={() => setFindLawyerModalOpen(true)}
                variant="default"
                size="sm"
                className="font-semibold"
              >
                Find a Lawyer
              </Button>
              <Link to="/auth">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>

    <FindLawyerModal open={findLawyerModalOpen} onOpenChange={setFindLawyerModalOpen} />
    </>
  );
};

export default Header;
