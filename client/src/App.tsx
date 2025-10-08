import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import IngredientsInput from "@/pages/ingredients-input";
import PhotoUpload from "@/pages/photo-upload";
import RecipeDetails from "@/pages/recipe-details";
import SavedRecipes from "@/pages/saved-recipes";
import AdminPanel from "@/pages/admin-panel";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/ingredients" component={IngredientsInput} />
          <Route path="/photo-upload" component={PhotoUpload} />
          <Route path="/recipe/:id" component={RecipeDetails} />
          <Route path="/saved-recipes" component={SavedRecipes} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
