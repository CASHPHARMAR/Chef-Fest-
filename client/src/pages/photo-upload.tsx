import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import RecipeCard from "@/components/recipe-card";
import type { Recipe } from "@shared/schema";

interface AnalysisResult {
  recipe: Recipe;
  confidence: number;
}

export default function PhotoUpload() {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await apiRequest("POST", "/api/recipes/identify-from-photo", formData);
      return response.json();
    },
    onSuccess: (result: AnalysisResult) => {
      setAnalysisResult(result);
      toast({
        title: "Photo Analyzed!",
        description: `Identified dish with ${Math.round(result.confidence * 100)}% confidence.`,
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
        description: error.message || "Failed to analyze photo",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clear previous results
      setAnalysisResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleAnalyze = () => {
    if (uploadedFile) {
      analyzeMutation.mutate(uploadedFile);
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPreviewUrl("");
    setAnalysisResult(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-foreground mb-4">
              Identify Your Dish
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload a food photo and discover its recipe
            </p>
          </div>
          
          <div className="bg-card rounded-2xl shadow-lg p-8 mb-8">
            {!uploadedFile ? (
              /* Upload Area */
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  isDragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary"
                }`}
                data-testid="upload-area"
              >
                <input {...getInputProps()} />
                <i className="fas fa-cloud-upload-alt text-6xl text-muted-foreground mb-4"></i>
                <p className="text-lg font-semibold text-foreground mb-2">
                  {isDragActive 
                    ? "Drop the image here..." 
                    : "Click to upload or drag and drop"
                  }
                </p>
                <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
              </div>
            ) : (
              /* Preview Area */
              <div className="space-y-6">
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Uploaded food" 
                    className="w-full h-64 object-cover rounded-xl"
                    data-testid="image-preview"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleReset}
                    data-testid="button-reset"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Change Photo
                  </Button>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full btn-3d"
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  data-testid="button-analyze"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                      Analyzing Photo...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search mr-2"></i>
                      Analyze Photo
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-display font-bold text-3xl text-foreground mb-2">
                  Analysis Complete!
                </h2>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <i className="fas fa-eye text-accent"></i>
                  <span>Confidence: {Math.round(analysisResult.confidence * 100)}%</span>
                </div>
              </div>
              
              <RecipeCard recipe={analysisResult.recipe} detailed />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
