import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import RecipeCard from "@/components/recipe-card";
import ReviewForm from "@/components/review-form";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { RecipeWithReviews } from "@shared/schema";

export default function RecipeDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
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

  const { data: recipe, isLoading, error } = useQuery<RecipeWithReviews>({
    queryKey: ["/api/recipes", id],
    enabled: !authLoading && isAuthenticated && !!id,
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
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-4"></div>
              <div className="h-64 bg-muted rounded mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <i className="fas fa-exclamation-triangle text-6xl text-muted-foreground mb-4"></i>
            <h1 className="text-2xl font-bold text-foreground mb-2">Recipe Not Found</h1>
            <p className="text-muted-foreground mb-6">The recipe you're looking for doesn't exist.</p>
            <button 
              onClick={() => setLocation("/")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold btn-3d"
              data-testid="button-go-home"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Recipe Details */}
          <RecipeCard recipe={recipe} detailed showReviews />
          
          {/* Reviews Section */}
          <div className="mt-12 bg-card rounded-xl p-6">
            <h3 className="font-display font-bold text-2xl text-foreground mb-6">Reviews & Ratings</h3>
            
            {/* Overall Rating */}
            <div className="bg-muted/50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl font-bold text-foreground">
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
            
            {/* Add Review Form */}
            <ReviewForm recipeId={recipe.id} />
            
            {/* Reviews List */}
            <div className="space-y-4">
              {recipe.reviews && recipe.reviews.length > 0 ? (
                recipe.reviews.map((review) => (
                  <div key={review.id} className="bg-muted/30 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            {review.user?.profileImageUrl ? (
                              <img 
                                src={review.user.profileImageUrl} 
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <i className="fas fa-user text-primary"></i>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {review.user?.firstName && review.user?.lastName
                                ? `${review.user.firstName} ${review.user.lastName}`
                                : review.user?.email?.split('@')[0] || "Anonymous User"
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(review.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`fas fa-star ${
                                star <= review.rating ? "text-yellow-500" : "text-gray-300"
                              }`}
                            ></i>
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-foreground" data-testid={`review-comment-${review.id}`}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-comments text-4xl text-muted-foreground mb-3"></i>
                  <p className="text-muted-foreground">No reviews yet. Be the first to leave one!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
