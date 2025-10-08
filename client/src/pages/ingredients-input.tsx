import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import RecipeCard from "@/components/recipe-card";
import type { Recipe } from "@shared/schema";

const generateRecipeSchema = z.object({
  ingredients: z.string().min(1, "Please enter some ingredients"),
  cuisineType: z.string().optional(),
  difficulty: z.string().optional(),
  cookingTime: z.string().optional(),
});

type FormData = z.infer<typeof generateRecipeSchema>;

export default function IngredientsInput() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(generateRecipeSchema),
    defaultValues: {
      ingredients: "",
      cuisineType: "",
      difficulty: "",
      cookingTime: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const ingredients = data.ingredients
        .split(",")
        .map(i => i.trim())
        .filter(i => i.length > 0);

      const requestData = {
        ingredients,
        cuisineType: data.cuisineType || undefined,
        difficulty: data.difficulty || undefined,
        cookingTime: data.cookingTime ? parseInt(data.cookingTime) : undefined,
      };

      const response = await apiRequest("POST", "/api/recipes/generate-from-ingredients", requestData);
      return response.json();
    },
    onSuccess: (recipes: Recipe[]) => {
      setGeneratedRecipes(recipes);
      toast({
        title: "Recipes Generated!",
        description: `Created ${recipes.length} delicious recipes for you.`,
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
        description: error.message || "Failed to generate recipes",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">
              What's in Your Kitchen?
            </h1>
            <p className="text-lg text-muted-foreground">
              List your ingredients and we'll create delicious recipes
            </p>
          </div>
          
          <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Your Ingredients</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., chicken, tomatoes, garlic, olive oil, basil..."
                          className="min-h-[120px] resize-none"
                          {...field}
                          data-testid="input-ingredients"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">Separate ingredients with commas</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Optional Filters */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cuisineType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Cuisine Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cuisine">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="italian">Italian</SelectItem>
                            <SelectItem value="mexican">Mexican</SelectItem>
                            <SelectItem value="asian">Asian</SelectItem>
                            <SelectItem value="indian">Indian</SelectItem>
                            <SelectItem value="mediterranean">Mediterranean</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cookingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Cooking Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-time">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="15">Under 15 min</SelectItem>
                            <SelectItem value="30">Under 30 min</SelectItem>
                            <SelectItem value="60">Under 1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full btn-3d"
                  disabled={generateMutation.isPending}
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                      Generating Recipes...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-2"></i>
                      Generate Recipes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Generated Recipes */}
          {generatedRecipes.length > 0 && (
            <div className="space-y-6">
              <h2 className="font-display font-bold text-3xl text-foreground text-center">
                Your AI-Generated Recipes
              </h2>
              <div className="grid gap-6">
                {generatedRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} detailed />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
