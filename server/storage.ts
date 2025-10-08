import {
  users,
  recipes,
  reviews,
  savedRecipes,
  contactMessages,
  siteSettings,
  type User,
  type UpsertUser,
  type Recipe,
  type InsertRecipe,
  type Review,
  type InsertReview,
  type SavedRecipe,
  type InsertSavedRecipe,
  type ContactMessage,
  type InsertContactMessage,
  type SiteSettings,
  type UpdateSiteSettings,
  type RecipeWithUser,
  type RecipeWithReviews,
  type ReviewWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, avg, count, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Recipe operations
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  getRecipe(id: string): Promise<RecipeWithReviews | undefined>;
  getRecipes(limit?: number, offset?: number, filters?: {
    userId?: string;
    cuisine?: string;
    difficulty?: string;
    search?: string;
  }): Promise<RecipeWithUser[]>;
  getFeaturedRecipes(): Promise<RecipeWithUser[]>;
  updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: string): Promise<boolean>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsForRecipe(recipeId: string): Promise<ReviewWithUser[]>;
  updateReview(id: string, userId: string, updates: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: string, userId: string): Promise<boolean>;
  
  // Saved recipes operations
  saveRecipe(data: InsertSavedRecipe): Promise<SavedRecipe>;
  unsaveRecipe(userId: string, recipeId: string): Promise<boolean>;
  getSavedRecipes(userId: string): Promise<RecipeWithUser[]>;
  isRecipeSaved(userId: string, recipeId: string): Promise<boolean>;
  
  // Contact operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(isRead?: boolean): Promise<ContactMessage[]>;
  markMessageAsRead(id: string): Promise<boolean>;
  
  // Settings operations
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings>;
  
  // Admin operations
  getStats(): Promise<{
    totalUsers: number;
    totalRecipes: number;
    totalReviews: number;
    aiRequests: number;
  }>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  banUser(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Recipe operations
  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [newRecipe] = await db.insert(recipes).values(recipe).returning();
    return newRecipe;
  }

  async getRecipe(id: string): Promise<RecipeWithReviews | undefined> {
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, id));

    if (!recipe) return undefined;

    const recipeReviews = await db
      .select({
        review: reviews,
        user: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.recipeId, id), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt));

    const [{ avgRating }] = await db
      .select({ avgRating: avg(reviews.rating) })
      .from(reviews)
      .where(and(eq(reviews.recipeId, id), eq(reviews.isApproved, true)));

    const [{ reviewCount }] = await db
      .select({ reviewCount: count() })
      .from(reviews)
      .where(and(eq(reviews.recipeId, id), eq(reviews.isApproved, true)));

    return {
      ...recipe,
      reviews: recipeReviews.map(({ review, user }) => ({ ...review, user })),
      averageRating: avgRating ? Number(avgRating) : 0,
      reviewCount: reviewCount || 0,
    };
  }

  async getRecipes(
    limit = 20,
    offset = 0,
    filters: { userId?: string; cuisine?: string; difficulty?: string; search?: string } = {}
  ): Promise<RecipeWithUser[]> {
    let query = db
      .select({
        recipe: recipes,
        user: users,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.userId, users.id))
      .where(eq(recipes.isApproved, true));

    if (filters.userId) {
      query = query.where(eq(recipes.userId, filters.userId));
    }

    if (filters.cuisine) {
      query = query.where(eq(recipes.cuisine, filters.cuisine));
    }

    if (filters.difficulty) {
      query = query.where(eq(recipes.difficulty, filters.difficulty));
    }

    if (filters.search) {
      query = query.where(
        or(
          ilike(recipes.name, `%${filters.search}%`),
          ilike(recipes.description, `%${filters.search}%`)
        )
      );
    }

    const results = await query
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    return results.map(({ recipe, user }) => ({ ...recipe, user }));
  }

  async getFeaturedRecipes(): Promise<RecipeWithUser[]> {
    const results = await db
      .select({
        recipe: recipes,
        user: users,
      })
      .from(recipes)
      .leftJoin(users, eq(recipes.userId, users.id))
      .where(and(eq(recipes.isFeatured, true), eq(recipes.isApproved, true)))
      .orderBy(desc(recipes.createdAt))
      .limit(10);

    return results.map(({ recipe, user }) => ({ ...recipe, user }));
  }

  async updateRecipe(id: string, updates: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [recipe] = await db
      .update(recipes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return recipe;
  }

  async deleteRecipe(id: string): Promise<boolean> {
    const result = await db.delete(recipes).where(eq(recipes.id, id));
    return result.rowCount > 0;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getReviewsForRecipe(recipeId: string): Promise<ReviewWithUser[]> {
    const results = await db
      .select({
        review: reviews,
        user: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.recipeId, recipeId), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt));

    return results.map(({ review, user }) => ({ ...review, user }));
  }

  async updateReview(id: string, userId: string, updates: Partial<InsertReview>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)))
      .returning();
    return review;
  }

  async deleteReview(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.userId, userId)));
    return result.rowCount > 0;
  }

  // Saved recipes operations
  async saveRecipe(data: InsertSavedRecipe): Promise<SavedRecipe> {
    const [saved] = await db
      .insert(savedRecipes)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return saved;
  }

  async unsaveRecipe(userId: string, recipeId: string): Promise<boolean> {
    const result = await db
      .delete(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)));
    return result.rowCount > 0;
  }

  async getSavedRecipes(userId: string): Promise<RecipeWithUser[]> {
    const results = await db
      .select({
        recipe: recipes,
        user: users,
      })
      .from(savedRecipes)
      .innerJoin(recipes, eq(savedRecipes.recipeId, recipes.id))
      .leftJoin(users, eq(recipes.userId, users.id))
      .where(eq(savedRecipes.userId, userId))
      .orderBy(desc(savedRecipes.createdAt));

    return results.map(({ recipe, user }) => ({ ...recipe, user }));
  }

  async isRecipeSaved(userId: string, recipeId: string): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedRecipes)
      .where(and(eq(savedRecipes.userId, userId), eq(savedRecipes.recipeId, recipeId)))
      .limit(1);
    return !!saved;
  }

  // Contact operations
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  async getContactMessages(isRead?: boolean): Promise<ContactMessage[]> {
    let query = db.select().from(contactMessages);
    
    if (isRead !== undefined) {
      query = query.where(eq(contactMessages.isRead, isRead));
    }

    return await query.orderBy(desc(contactMessages.createdAt));
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(contactMessages)
      .set({ isRead: true })
      .where(eq(contactMessages.id, id));
    return result.rowCount > 0;
  }

  // Settings operations
  async getSiteSettings(): Promise<SiteSettings> {
    const [settings] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, "settings"));

    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db
        .insert(siteSettings)
        .values({ id: "settings" })
        .returning();
      return newSettings;
    }

    return settings;
  }

  async updateSiteSettings(updates: UpdateSiteSettings): Promise<SiteSettings> {
    const [settings] = await db
      .update(siteSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(siteSettings.id, "settings"))
      .returning();
    return settings;
  }

  // Admin operations
  async getStats(): Promise<{
    totalUsers: number;
    totalRecipes: number;
    totalReviews: number;
    aiRequests: number;
  }> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [recipeCount] = await db.select({ count: count() }).from(recipes);
    const [reviewCount] = await db.select({ count: count() }).from(reviews);
    
    return {
      totalUsers: userCount.count,
      totalRecipes: recipeCount.count,
      totalReviews: reviewCount.count,
      aiRequests: recipeCount.count, // Using recipe count as proxy for AI requests
    };
  }

  async getAllUsers(limit = 50, offset = 0): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async banUser(userId: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ role: "banned", updatedAt: new Date() })
      .where(eq(users.id, userId));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
