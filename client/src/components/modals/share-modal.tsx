import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Recipe, RecipeWithUser } from "@shared/schema";

interface ShareModalProps {
  recipe: Recipe | RecipeWithUser;
  onClose: () => void;
}

export default function ShareModal({ recipe, onClose }: ShareModalProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const currentUrl = `${window.location.origin}/recipe/${recipe.id}`;
  
  const handleShareToInstagram = async () => {
    setIsSharing(true);
    try {
      // For Instagram sharing, we'll copy the link since Instagram doesn't support direct URL sharing
      await navigator.clipboard.writeText(currentUrl);
      toast({
        title: "Link Copied!",
        description: "Recipe link copied to clipboard. You can paste it in your Instagram story or bio.",
      });
      // Open Instagram in a new tab
      window.open("https://www.instagram.com/", "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
    setIsSharing(false);
  };

  const handleShareToX = () => {
    const text = `Check out this amazing recipe: ${recipe.name}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast({
        title: "Link Copied!",
        description: "Recipe link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" data-testid="share-modal">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-2xl text-foreground">Share Recipe</h3>
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={onClose}
              data-testid="button-close"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white btn-3d"
              onClick={handleShareToInstagram}
              disabled={isSharing}
              data-testid="button-share-instagram"
            >
              <i className="fab fa-instagram text-xl mr-2"></i>
              Share to Instagram
            </Button>
            
            <Button 
              className="w-full bg-black text-white btn-3d"
              onClick={handleShareToX}
              data-testid="button-share-x"
            >
              <i className="fab fa-x-twitter text-xl mr-2"></i>
              Share to X
            </Button>
            
            <Button 
              variant="outline"
              className="w-full btn-3d"
              onClick={handleCopyLink}
              data-testid="button-copy-link"
            >
              <i className="fas fa-link text-xl mr-2"></i>
              Copy Link
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Recipe Preview:</p>
            <p className="font-semibold text-foreground">{recipe.name}</p>
            {recipe.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
