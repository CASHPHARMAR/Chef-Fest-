import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import RecipeCard from "@/components/recipe-card";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { RecipeWithUser } from "@shared/schema";

export default function SavedRecipes() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: savedRecipes, isLoading, error } = useQuery<RecipeWithUser[]>({
    queryKey: ["/api/saved-recipes"],
    enabled: !authLoading && isAuthenticated,
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">
                Saved Recipes
              </h1>
              <p className="text-lg text-muted-foreground">
                Your personal collection of favorite dishes
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <div className="p-5">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-muted rounded flex-1"></div>
                      <div className="h-8 w-12 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">
              Saved Recipes
            </h1>
            <p className="text-lg text-muted-foreground">
              Your personal collection of favorite dishes
            </p>
          </div>
          
          {savedRecipes && savedRecipes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} compact />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-bookmark text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold text-foreground mb-2">No saved recipes yet</h3>
              <p className="text-muted-foreground mb-6">
                Start saving your favorite recipes by clicking the heart icon on any recipe!
              </p>
              <button 
                onClick={() => window.location.href = "/"}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold btn-3d"
                data-testid="button-browse-recipes"
              >
                Browse Recipes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
