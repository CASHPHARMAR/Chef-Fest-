import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, RecipeWithUser, ContactMessage, SiteSettings } from "@shared/schema";

interface Stats {
  totalUsers: number;
  totalRecipes: number;
  totalReviews: number;
  aiRequests: number;
}

export default function AdminPanel() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [isAuthenticated, authLoading, user, toast]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    enabled: !authLoading && isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !authLoading && isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const { data: recipes } = useQuery<RecipeWithUser[]>({
    queryKey: ["/api/recipes"],
    enabled: !authLoading && isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const { data: messages } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contact-messages"],
    enabled: !authLoading && isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/admin/settings"],
    enabled: !authLoading && isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
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
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const featureRecipeMutation = useMutation({
    mutationFn: async ({ recipeId, featured }: { recipeId: string; featured: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/recipes/${recipeId}/feature`, { featured });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success",
        description: "Recipe updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update recipe",
        variant: "destructive",
      });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const response = await apiRequest("DELETE", `/api/recipes/${recipeId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Success",
        description: "Recipe deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-8"></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-muted rounded"></div>
                ))}
              </div>
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
          <div className="mb-12">
            <h1 className="font-display font-bold text-4xl text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your Chef Fest platform</p>
          </div>
          
          {/* Stats Cards */}
          {stats && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-card rounded-xl p-6 card-3d">
                <div className="flex items-center justify-between mb-4">
                  <i className="fas fa-users text-3xl text-primary"></i>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                    Users
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1" data-testid="stat-users">
                  {stats.totalUsers}
                </h3>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
              
              <div className="bg-card rounded-xl p-6 card-3d">
                <div className="flex items-center justify-between mb-4">
                  <i className="fas fa-utensils text-3xl text-secondary"></i>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-semibold">
                    Recipes
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1" data-testid="stat-recipes">
                  {stats.totalRecipes}
                </h3>
                <p className="text-sm text-muted-foreground">Total Recipes</p>
              </div>
              
              <div className="bg-card rounded-xl p-6 card-3d">
                <div className="flex items-center justify-between mb-4">
                  <i className="fas fa-robot text-3xl text-accent"></i>
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                    AI
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1" data-testid="stat-ai">
                  {stats.aiRequests}
                </h3>
                <p className="text-sm text-muted-foreground">AI Requests</p>
              </div>
              
              <div className="bg-card rounded-xl p-6 card-3d">
                <div className="flex items-center justify-between mb-4">
                  <i className="fas fa-star text-3xl text-yellow-500"></i>
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-semibold">
                    Reviews
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1" data-testid="stat-reviews">
                  {stats.totalReviews}
                </h3>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          )}
          
          {/* Admin Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="recipes">Recipes</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-6">
              <div className="bg-card rounded-xl p-6">
                <h3 className="font-display font-bold text-xl text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {messages?.slice(0, 5).map((message) => (
                    <div key={message.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <i className="fas fa-envelope text-primary mt-1"></i>
                      <div>
                        <p className="font-semibold text-foreground">{message.name}</p>
                        <p className="text-sm text-muted-foreground">{message.email}</p>
                        <p className="text-sm text-foreground mt-1">{message.message}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No recent messages</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="recipes" className="space-y-6">
              <div className="bg-card rounded-xl p-6">
                <h3 className="font-display font-bold text-xl text-foreground mb-6">Recipe Management</h3>
                
                <div className="space-y-4">
                  {recipes?.map((recipe) => (
                    <div key={recipe.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      {recipe.imageUrl && (
                        <img 
                          src={recipe.imageUrl} 
                          alt={recipe.name}
                          className="w-16 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{recipe.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          By {recipe.user?.firstName || "Anonymous"} • {recipe.cuisine}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={recipe.isFeatured ? "default" : "outline"}
                          onClick={() => featureRecipeMutation.mutate({ 
                            recipeId: recipe.id, 
                            featured: !recipe.isFeatured 
                          })}
                          data-testid={`button-feature-${recipe.id}`}
                        >
                          <i className={`fas fa-star mr-1 ${recipe.isFeatured ? "text-yellow-400" : ""}`}></i>
                          {recipe.isFeatured ? "Featured" : "Feature"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRecipeMutation.mutate(recipe.id)}
                          data-testid={`button-delete-${recipe.id}`}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No recipes found</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <div className="bg-card rounded-xl p-6">
                <h3 className="font-display font-bold text-xl text-foreground mb-6">User Management</h3>
                
                <div className="space-y-4">
                  {users?.map((userItem) => (
                    <div key={userItem.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        {userItem.profileImageUrl ? (
                          <img 
                            src={userItem.profileImageUrl} 
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <i className="fas fa-user text-primary"></i>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {userItem.firstName && userItem.lastName 
                            ? `${userItem.firstName} ${userItem.lastName}`
                            : "Anonymous User"
                          }
                        </h4>
                        <p className="text-sm text-muted-foreground">{userItem.email}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        userItem.role === "admin" 
                          ? "bg-primary/10 text-primary"
                          : userItem.role === "banned"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary/10 text-secondary"
                      }`}>
                        {userItem.role}
                      </span>
                      {userItem.id !== user?.id && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRoleMutation.mutate({ 
                              userId: userItem.id, 
                              role: userItem.role === "admin" ? "user" : "admin"
                            })}
                            data-testid={`button-toggle-admin-${userItem.id}`}
                          >
                            {userItem.role === "admin" ? "Remove Admin" : "Make Admin"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateUserRoleMutation.mutate({ 
                              userId: userItem.id, 
                              role: "banned"
                            })}
                            data-testid={`button-ban-${userItem.id}`}
                          >
                            Ban
                          </Button>
                        </div>
                      )}
                    </div>
                  )) || (
                    <p className="text-muted-foreground">No users found</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <div className="bg-card rounded-xl p-6">
                <h3 className="font-display font-bold text-xl text-foreground mb-6">Site Settings</h3>
                
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Homepage Hero Text
                    </label>
                    <Input 
                      defaultValue={settings?.heroText}
                      placeholder="Transform Ingredients Into Culinary Magic"
                      data-testid="input-hero-text"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Featured Recipe ID
                    </label>
                    <Input 
                      defaultValue={settings?.featuredRecipeId || ""}
                      placeholder="recipe_123"
                      data-testid="input-featured-recipe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      AI Temperature (0-1)
                    </label>
                    <Input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="1"
                      defaultValue={settings?.aiTemperature}
                      placeholder="0.7"
                      data-testid="input-ai-temperature"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Max Recipe Results
                    </label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="10"
                      defaultValue={settings?.maxRecipeResults}
                      placeholder="3"
                      data-testid="input-max-results"
                    />
                  </div>
                  
                  <Button type="submit" className="btn-3d" data-testid="button-save-settings">
                    Save Settings
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
