import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { openaiService } from "./services/openai";
import multer from "multer";
import {
  insertRecipeSchema,
  insertReviewSchema,
  insertContactMessageSchema,
  updateSiteSettingsSchema,
  type User,
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Middleware to check admin role
const isAdmin = async (req: any, res: Response, next: any) => {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(req.user.claims.sub);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Recipe routes
  app.post('/api/recipes/generate-from-ingredients', isAuthenticated, async (req: any, res) => {
    try {
      const { ingredients, cuisineType, difficulty, cookingTime } = req.body;
      
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: "Ingredients are required" });
      }

      const recipes = await openaiService.generateRecipesFromIngredients(ingredients, {
        cuisineType,
        difficulty,
        cookingTime,
        count: 3,
      });

      // Generate images for recipes and save to database
      const savedRecipes = [];
      for (const recipe of recipes) {
        try {
          const imageUrl = await openaiService.generateRecipeImage(recipe.name, recipe.description);
          
          const savedRecipe = await storage.createRecipe({
            ...recipe,
            imageUrl,
            userId: req.user.claims.sub,
          });
          
          savedRecipes.push(savedRecipe);
        } catch (error) {
          console.error("Error saving recipe:", error);
          // Save recipe without image if image generation fails
          const savedRecipe = await storage.createRecipe({
            ...recipe,
            userId: req.user.claims.sub,
          });
          savedRecipes.push(savedRecipe);
        }
      }

      res.json(savedRecipes);
    } catch (error) {
      console.error("Error generating recipes:", error);
      res.status(500).json({ message: "Failed to generate recipes" });
    }
  });

  app.post('/api/recipes/identify-from-photo', isAuthenticated, upload.single('photo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Photo is required" });
      }

      const base64Image = req.file.buffer.toString('base64');
      const identifiedDish = await openaiService.identifyDishFromPhoto(base64Image);

      // Generate image and save recipe
      const imageUrl = await openaiService.generateRecipeImage(identifiedDish.name, identifiedDish.description);
      
      const savedRecipe = await storage.createRecipe({
        name: identifiedDish.name,
        description: identifiedDish.description,
        ingredients: identifiedDish.ingredients,
        instructions: identifiedDish.instructions,
        cookingTime: identifiedDish.cookingTime,
        difficulty: identifiedDish.difficulty,
        cuisine: identifiedDish.cuisine,
        servings: identifiedDish.servings,
        imageUrl,
        userId: req.user.claims.sub,
      });

      res.json({ recipe: savedRecipe, confidence: identifiedDish.confidence });
    } catch (error) {
      console.error("Error identifying dish:", error);
      res.status(500).json({ message: "Failed to identify dish from photo" });
    }
  });

  app.get('/api/recipes', async (req, res) => {
    try {
      const { page = "1", limit = "20", userId, cuisine, difficulty, search } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const recipes = await storage.getRecipes(
        parseInt(limit as string),
        offset,
        {
          userId: userId as string,
          cuisine: cuisine as string,
          difficulty: difficulty as string,
          search: search as string,
        }
      );
      
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get('/api/recipes/featured', async (req, res) => {
    try {
      const recipes = await storage.getFeaturedRecipes();
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching featured recipes:", error);
      res.status(500).json({ message: "Failed to fetch featured recipes" });
    }
  });

  app.get('/api/recipes/:id', async (req, res) => {
    try {
      const recipe = await storage.getRecipe(req.params.id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.delete('/api/recipes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const recipe = await storage.getRecipe(req.params.id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      const user = await storage.getUser(req.user.claims.sub);
      if (recipe.userId !== req.user.claims.sub && user?.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete this recipe" });
      }

      const deleted = await storage.deleteRecipe(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json({ message: "Recipe deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ message: "Failed to delete recipe" });
    }
  });

  // Review routes
  app.post('/api/recipes/:id/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        recipeId: req.params.id,
        userId: req.user.claims.sub,
      });

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.put('/api/reviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = insertReviewSchema.partial().parse(req.body);
      const review = await storage.updateReview(req.params.id, req.user.claims.sub, updates);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found or not authorized" });
      }

      res.json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete('/api/reviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const deleted = await storage.deleteReview(req.params.id, req.user.claims.sub);
      
      if (!deleted) {
        return res.status(404).json({ message: "Review not found or not authorized" });
      }

      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Saved recipes routes
  app.post('/api/saved-recipes', isAuthenticated, async (req: any, res) => {
    try {
      const { recipeId } = req.body;
      if (!recipeId) {
        return res.status(400).json({ message: "Recipe ID is required" });
      }

      const saved = await storage.saveRecipe({
        userId: req.user.claims.sub,
        recipeId,
      });

      res.json(saved);
    } catch (error) {
      console.error("Error saving recipe:", error);
      res.status(500).json({ message: "Failed to save recipe" });
    }
  });

  app.delete('/api/saved-recipes/:recipeId', isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.unsaveRecipe(req.user.claims.sub, req.params.recipeId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Saved recipe not found" });
      }

      res.json({ message: "Recipe unsaved successfully" });
    } catch (error) {
      console.error("Error unsaving recipe:", error);
      res.status(500).json({ message: "Failed to unsave recipe" });
    }
  });

  app.get('/api/saved-recipes', isAuthenticated, async (req: any, res) => {
    try {
      const recipes = await storage.getSavedRecipes(req.user.claims.sub);
      res.json(recipes);
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      res.status(500).json({ message: "Failed to fetch saved recipes" });
    }
  });

  app.get('/api/saved-recipes/:recipeId/status', isAuthenticated, async (req: any, res) => {
    try {
      const isSaved = await storage.isRecipeSaved(req.user.claims.sub, req.params.recipeId);
      res.json({ isSaved });
    } catch (error) {
      console.error("Error checking saved status:", error);
      res.status(500).json({ message: "Failed to check saved status" });
    }
  });

  // Contact routes
  app.post('/api/contact', async (req, res) => {
    try {
      const messageData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(messageData);
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error sending contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { page = "1", limit = "50" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const users = await storage.getAllUsers(parseInt(limit as string), offset);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!role || !["user", "admin", "banned"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put('/api/admin/recipes/:id/feature', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { featured } = req.body;
      const recipe = await storage.updateRecipe(req.params.id, { isFeatured: featured });
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      res.json(recipe);
    } catch (error) {
      console.error("Error updating recipe feature status:", error);
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });

  app.get('/api/admin/contact-messages', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  app.put('/api/admin/contact-messages/:id/read', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updated = await storage.markMessageAsRead(req.params.id);
      if (!updated) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get('/api/admin/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/admin/settings', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updates = updateSiteSettingsSchema.parse(req.body);
      const settings = await storage.updateSiteSettings(updates);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
