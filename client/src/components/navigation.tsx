import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  onAuthClick?: (mode: "login" | "signup") => void;
}

export default function Navigation({ onAuthClick }: NavigationProps) {
  const [location] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  const isAdmin = user?.role === "admin";

  const navLinks = [
    { href: "/", label: "Home" },
    ...(isAuthenticated ? [{ href: "/saved-recipes", label: "Saved Recipes" }] : []),
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const handleMobileMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleAuthClick = (mode: "login" | "signup") => {
    if (onAuthClick) {
      onAuthClick(mode);
    } else {
      // If not on landing page, redirect to auth
      window.location.href = "/api/login";
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3" data-testid="logo">
            <i className="fas fa-utensils text-3xl text-primary"></i>
            <span className="font-display font-bold text-2xl text-foreground">Chef Fest</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors font-medium ${
                  location === link.href
                    ? "text-primary"
                    : link.label === "Admin"
                    ? "text-secondary hover:text-secondary/80"
                    : "text-foreground hover:text-primary"
                }`}
                data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label === "Admin" && <i className="fas fa-shield-alt mr-1"></i>}
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-user text-primary text-sm"></i>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {user?.firstName || user?.email?.split('@')[0] || "User"}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => handleAuthClick("login")}
                  data-testid="button-login"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => handleAuthClick("signup")}
                  className="btn-3d"
                  data-testid="button-signup"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-foreground"
            onClick={handleMobileMenuToggle}
            data-testid="button-mobile-menu"
          >
            <i className="fas fa-bars text-2xl"></i>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-border">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 transition-colors ${
                  location === link.href
                    ? "text-primary"
                    : link.label === "Admin"
                    ? "text-secondary hover:text-secondary/80"
                    : "text-foreground hover:text-primary"
                }`}
                onClick={() => setShowMobileMenu(false)}
                data-testid={`mobile-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label === "Admin" && <i className="fas fa-shield-alt mr-1"></i>}
                {link.label}
              </Link>
            ))}
            <hr className="border-border my-2" />
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLogout}
                data-testid="mobile-button-logout"
              >
                Logout
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => handleAuthClick("login")}
                  data-testid="mobile-button-login"
                >
                  Login
                </Button>
                <Button 
                  className="w-full btn-3d"
                  onClick={() => handleAuthClick("signup")}
                  data-testid="mobile-button-signup"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
