import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
  comment: z.string().optional(),
});

type FormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  recipeId: string;
}

export default function ReviewForm({ recipeId }: ReviewFormProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const form = useForm<FormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const selectedRating = form.watch("rating");

  const submitReviewMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", `/api/recipes/${recipeId}/reviews`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId] });
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback.",
      });
      form.reset();
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
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    submitReviewMutation.mutate(data);
  };

  const handleStarClick = (rating: number) => {
    form.setValue("rating", rating);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 mb-6 text-center">
        <h4 className="font-semibold text-lg text-foreground mb-2">Add Your Review</h4>
        <p className="text-muted-foreground mb-4">Please log in to leave a review</p>
        <Button 
          onClick={() => window.location.href = "/api/login"}
          data-testid="button-login-to-review"
        >
          Login to Review
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-xl p-6 mb-6">
      <h4 className="font-semibold text-lg text-foreground mb-4">Add Your Review</h4>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">Your Rating</FormLabel>
                <FormControl>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`text-2xl transition-colors ${
                          star <= (hoveredRating || selectedRating)
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }`}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => handleStarClick(star)}
                        data-testid={`star-${star}`}
                      >
                        <i className="fas fa-star"></i>
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">Your Comment (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your experience with this recipe..."
                    className="min-h-[80px] resize-none"
                    {...field}
                    data-testid="input-comment"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="btn-3d"
            disabled={submitReviewMutation.isPending}
            data-testid="button-submit-review"
          >
            {submitReviewMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                Submitting...
              </>
            ) : (
              "Submit Review"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
