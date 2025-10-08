import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import HeroSlideshow from "@/components/hero-slideshow";
import AuthModal from "@/components/modals/auth-modal";
import About from "./about";
import Contact from "./contact";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleGetStarted = (type: "ingredients" | "photo") => {
    // Show auth modal first for non-authenticated users
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Redirect will happen automatically through useAuth hook
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onAuthClick={(mode) => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
      
      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden mt-16">
        <HeroSlideshow />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent -z-5"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-white mb-6 animate-fadeIn">
            Transform Ingredients<br/>Into Culinary Magic
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto animate-fadeIn" style={{animationDelay: "0.2s"}}>
            AI-powered recipe generation from ingredients or photos. Cook like a chef, effortlessly.
          </p>
          
          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto animate-fadeIn" style={{animationDelay: "0.4s"}}>
            {/* Card 1: I have ingredients */}
            <div 
              className="glass-effect rounded-2xl p-8 card-3d cursor-pointer"
              onClick={() => handleGetStarted("ingredients")}
              data-testid="ingredients-option"
            >
              <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-leaf text-4xl text-white"></i>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">I Have Ingredients</h3>
              <p className="text-white/80 mb-6">Enter your available ingredients and let AI create amazing recipes for you</p>
              <button className="w-full py-3 bg-white text-primary rounded-lg font-semibold btn-3d hover:bg-white/90">
                Get Started <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
            
            {/* Card 2: I have a photo */}
            <div 
              className="glass-effect rounded-2xl p-8 card-3d cursor-pointer"
              onClick={() => handleGetStarted("photo")}
              data-testid="photo-option"
            >
              <div className="bg-accent/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-camera text-4xl text-white"></i>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">I Have a Food Photo</h3>
              <p className="text-white/80 mb-6">Upload a food image and AI will identify it and provide the recipe</p>
              <button className="w-full py-3 bg-white text-accent rounded-lg font-semibold btn-3d hover:bg-white/90">
                Upload Photo <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <About />
      <Contact />

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <i className="fas fa-utensils text-2xl text-primary"></i>
                <span className="font-display font-bold text-xl">Chef Fest</span>
              </div>
              <p className="text-white/70">AI-powered recipe generation for home cooks</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#home" className="text-white/70 hover:text-white transition-colors">Home</a></li>
                <li><a href="#about" className="text-white/70 hover:text-white transition-colors">About</a></li>
                <li><a href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Features</h4>
              <ul className="space-y-2">
                <li><span className="text-white/70">Ingredient to Recipe</span></li>
                <li><span className="text-white/70">Photo Recognition</span></li>
                <li><span className="text-white/70">AI Generation</span></li>
                <li><span className="text-white/70">Reviews & Ratings</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg mb-4">Connect</h4>
              <p className="text-white/70 mb-3">calvinselassie1@gmail.com</p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/itz_calvin7?igsh=NHZpOGZtaDUwNDJw" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://x.com/itz_calvin7?t=skowuAFZGnucSdCV-ZKhnA&s=09" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <i className="fab fa-x-twitter"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-8 text-center text-white/70">
            <p>&copy; 2024 Chef Fest. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onModeSwitch={(mode) => setAuthMode(mode)}
        />
      )}
    </div>
  );
}
