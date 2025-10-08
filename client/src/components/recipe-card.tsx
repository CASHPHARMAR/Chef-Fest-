import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ShareModal from "@/components/modals/share-modal";
import type { Recipe, RecipeWithUser, RecipeWithReviews } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe | RecipeWithUser | RecipeWithReviews;
  compact?: boolean;
  detailed?: boolean;
  showReviews?: boolean;
}

export default function RecipeCard({ 
  recipe, 
  compact = false, 
  detailed = false,
  showReviews = false 
}: RecipeCardProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showShareModal, setShowShareModal] = useState(false);

  // Check if recipe is saved
  const { data: saveStatus } = useQuery<{ isSaved: boolean }>({
    queryKey: ["/api/saved-recipes", recipe.id, "status"],
    enabled: isAuthenticated,
    retry: false,
  });

  const saveRecipeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/saved-recipes", { recipeId: recipe.id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes", recipe.id, "status"] });
      toast({
        title: "Recipe Saved!",
        description: "Added to your saved recipes",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to save recipe",
        variant: "destructive",
      });
    },
  });

  const unsaveRecipeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/saved-recipes/${recipe.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-recipes", recipe.id, "status"] });
      toast({
        title: "Recipe Unsaved",
        description: "Removed from your saved recipes",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to unsave recipe",
        variant: "destructive",
      });
    },
  });

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }

    if (saveStatus?.isSaved) {
      unsaveRecipeMutation.mutate();
    } else {
      saveRecipeMutation.mutate();
    }
  };

  const handleViewRecipe = () => {
    setLocation(`/recipe/${recipe.id}`);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  if (compact) {
    return (
      <div className="bg-card rounded-xl shadow-lg overflow-hidden card-3d" data-testid={`recipe-card-${recipe.id}`}>
        {recipe.imageUrl && (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.name}
            className="w-full h-48 object-cover"
            data-testid="recipe-image"
          />
        )}
        <div className="p-5">
          <h3 className="font-serif font-bold text-xl text-foreground mb-2" data-testid="recipe-name">
            {recipe.name}
          </h3>
          <div className="flex gap-2 mb-4">
            {recipe.cookingTime && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                {recipe.cookingTime} min
              </span>
            )}
            {recipe.difficulty && (
              <span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs font-medium">
                {recipe.difficulty}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 btn-3d"
              onClick={handleViewRecipe}
              data-testid="button-view"
            >
              View
            </Button>
            <Button
              size="sm"
              variant={saveStatus?.isSaved ? "destructive" : "outline"}
              onClick={handleSaveToggle}
              data-testid="button-save"
            >
              <i className={`fas ${saveStatus?.isSaved ? "fa-heart-broken" : "fa-heart"}`}></i>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (detailed) {
    return (
      <div className="bg-card rounded-2xl shadow-lg overflow-hidden mb-8 card-3d" data-testid={`recipe-detail-${recipe.id}`}>
        <div className="grid md:grid-cols-2 gap-0">
          {/* Recipe Image */}
          <div className="relative h-80 md:h-auto">
            {recipe.imageUrl ? (
              <img 
                src={recipe.imageUrl} 
                alt={recipe.name}
                className="w-full h-full object-cover"
                data-testid="recipe-image"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <i className="fas fa-utensils text-6xl text-muted-foreground"></i>
              </div>
            )}
            <Button
              size="sm"
              className="absolute top-4 right-4 rounded-full"
              variant={saveStatus?.isSaved ? "default" : "outline"}
              onClick={handleSaveToggle}
              data-testid="button-save-heart"
            >
              <i className={`${saveStatus?.isSaved ? "fas fa-heart text-red-500" : "far fa-heart"}`}></i>
            </Button>
          </div>
          
          {/* Recipe Details */}
          <div className="p-8">
            <h3 className="font-serif font-bold text-3xl text-foreground mb-4" data-testid="recipe-name">
              {recipe.name}
            </h3>
            
            {recipe.description && (
              <p className="text-muted-foreground mb-4" data-testid="recipe-description">
                {recipe.description}
              </p>
            )}
            
            {/* Recipe Meta */}
            <div className="flex flex-wrap gap-4 mb-6">
              {recipe.cookingTime && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <i className="far fa-clock mr-1"></i>{recipe.cookingTime} min
                </span>
              )}
              {recipe.difficulty && (
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                  <i className="fas fa-signal mr-1"></i>{recipe.difficulty}
                </span>
              )}
              {recipe.cuisine && (
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                  <i className="fas fa-globe mr-1"></i>{recipe.cuisine}
                </span>
              )}
              {recipe.servings && (
                <span className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium">
                  <i className="fas fa-users mr-1"></i>{recipe.servings} servings
                </span>
              )}
            </div>
            
            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div className="mb-6">
                <h4 className="font-display font-semibold text-lg text-foreground mb-3">Ingredients</h4>
                <ul className="space-y-2" data-testid="ingredients-list">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-secondary mt-1 mr-2"></i>
                      <span className="text-foreground">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Cooking Steps */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="mb-6">
                <h4 className="font-display font-semibold text-lg text-foreground mb-3">Cooking Steps</h4>
                <ol className="space-y-3" data-testid="instructions-list">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      <span className="text-foreground">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            {/* Reviews Summary */}
            {showReviews && "averageRating" in recipe && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-foreground">
                    {recipe.averageRating?.toFixed(1) || "0.0"}
                  </div>
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fas fa-star ${
                            star <= Math.round(recipe.averageRating || 0)
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }`}
                        ></i>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {recipe.reviewCount || 0} reviews
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1 btn-3d"
                onClick={handleViewRecipe}
                data-testid="button-view-full"
              >
                View Full Recipe
              </Button>
              <Button
                variant="outline"
                className="flex-1 btn-3d"
                onClick={handleShare}
                data-testid="button-share"
              >
                <i className="fas fa-share-alt mr-2"></i>Share
              </Button>
            </div>
          </div>
        </div>

        {showShareModal && (
          <ShareModal
            recipe={recipe}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    );
  }

  // Default card layout
  return (
    <div className="bg-card rounded-xl shadow-lg overflow-hidden card-3d" data-testid={`recipe-card-${recipe.id}`}>
      {recipe.imageUrl && (
        <img 
          src={recipe.imageUrl} 
          alt={recipe.name}
          className="w-full h-48 object-cover"
          data-testid="recipe-image"
        />
      )}
      <div className="p-5">
        <h3 className="font-serif font-bold text-xl text-foreground mb-2" data-testid="recipe-name">
          {recipe.name}
        </h3>
        
        {recipe.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2" data-testid="recipe-description">
            {recipe.description}
          </p>
        )}

        <div className="flex gap-2 mb-4">
          {recipe.cookingTime && (
            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
              {recipe.cookingTime} min
            </span>
          )}
          {recipe.difficulty && (
            <span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs font-medium">
              {recipe.difficulty}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 btn-3d"
            onClick={handleViewRecipe}
            data-testid="button-view"
          >
            View Recipe
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveToggle}
            data-testid="button-save"
          >
            <i className={`fas ${saveStatus?.isSaved ? "fa-heart text-red-500" : "fa-heart"}`}></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
