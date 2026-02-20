import { useState, useRef, MouseEvent as ReactMouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import logo from "@/assets/lawckin-logo.png";
import FindLawyerModal from "./FindLawyerModal";
import { countryConfig } from "@/config/country";

const Hero = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  // Magnetic effect
  const handleButtonMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;
    const distanceX = e.clientX - buttonCenterX;
    const distanceY = e.clientY - buttonCenterY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    if (distance < 150) {
      const strength = (150 - distance) / 150;
      const moveX = (distanceX / distance) * 15 * strength;
      const moveY = (distanceY / distance) * 15 * strength;
      setButtonPosition({ x: moveX, y: moveY });
    } else {
      setButtonPosition({ x: 0, y: 0 });
    }
  };

  const handleButtonMouseLeave = () => {
    setButtonPosition({ x: 0, y: 0 });
  };

  // 3D tilt
  const handleButtonTilt = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleButtonTiltReset = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Ripple effect
  const handleButtonClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);
    setModalOpen(true);
    setTimeout(() => {
      setRipples(ripples => ripples.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <>
      <section className="relative pt-32 pb-20 px-4 overflow-hidden min-h-[70vh] flex items-center">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-6">
              <img src={logo} alt="Lawckin - Legal Marketplace Logo" className="h-24 md:h-32 lg:h-40 w-auto mx-auto" loading="eager" />
              <h1 className="text-3xl md:text-5xl font-bold">
                Find the perfect lawyer for your case
              </h1>
              <p className="text-xl md:text-2xl font-light text-muted-foreground">
                {countryConfig.copy.heroSubtitle}
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Main CTA with all animations */}
              <div
                className="relative inline-block animate-float"
                onMouseMove={handleButtonMouseMove}
                onMouseLeave={handleButtonMouseLeave}
              >
                {/* Pulsing glow */}
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>

                <Button 
                  ref={buttonRef}
                  size="lg"
                  onClick={handleButtonClick}
                  onMouseMove={handleButtonTilt}
                  onMouseLeave={handleButtonTiltReset}
                  className="relative h-20 px-16 text-xl font-bold shadow-2xl hover:shadow-[0_30px_80px_rgba(0,0,0,0.4)] transition-shadow duration-300 bg-gradient-to-r from-primary to-primary/90 group overflow-hidden border-2 border-primary/20"
                  style={{
                    transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px) perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${buttonPosition.x !== 0 || tilt.x !== 0 ? 1.05 : 1})`,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s',
                  }}
                  aria-label="Find your lawyer now"
                >
                  {/* Ripple effects */}
                  {ripples.map(ripple => (
                    <span
                      key={ripple.id}
                      className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
                      style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: '20px',
                        height: '20px',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}

                  {/* Shine effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>

                  {/* Button content */}
                  <span className="relative inline-flex items-center gap-3">
                    <svg className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Your Lawyer Now
                    <svg className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Button>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Free • No commitment • 100% confidential</span>
              </div>

              {/* Value propositions */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground" aria-label="Platform features">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Verified Attorneys</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Instant Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Transparent Pricing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FindLawyerModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};

export default Hero;
