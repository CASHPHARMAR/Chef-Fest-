import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import RecipeCard from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import type { RecipeWithUser } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  
  const { data: featuredRecipes, isLoading: featuredLoading } = useQuery<RecipeWithUser[]>({
    queryKey: ["/api/recipes/featured"],
  });

  const { data: recentRecipes, isLoading: recentLoading } = useQuery<RecipeWithUser[]>({
    queryKey: ["/api/recipes"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
            Welcome to Chef Fest
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your ingredients into culinary masterpieces with AI-powered recipe generation
          </p>
          
          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-3d"
              onClick={() => setLocation("/ingredients")}
              data-testid="button-ingredients"
            >
              <i className="fas fa-leaf mr-2"></i>
              From Ingredients
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="btn-3d"
              onClick={() => setLocation("/photo-upload")}
              data-testid="button-photo-upload"
            >
              <i className="fas fa-camera mr-2"></i>
              From Photo
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      {featuredRecipes && featuredRecipes.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display font-bold text-3xl text-foreground mb-8">Featured Recipes</h2>
            
            {featuredLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-xl shadow-lg overflow-hidden animate-pulse">
                    <div className="h-48 bg-muted"></div>
                    <div className="p-5">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Recipes */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-foreground mb-8">Recent Recipes</h2>
          
          {recentLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted"></div>
                  <div className="p-5">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentRecipes && recentRecipes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentRecipes.slice(0, 6).map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-utensils text-6xl text-muted-foreground mb-4"></i>
              <h3 className="text-xl font-semibold text-foreground mb-2">No recipes yet</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first recipe!</p>
              <Button onClick={() => setLocation("/ingredients")} data-testid="button-create-first">
                Create Recipe
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
