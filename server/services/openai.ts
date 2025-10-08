import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface GeneratedRecipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  difficulty: "easy" | "medium" | "hard";
  cuisine: string;
  servings: number;
}

export interface IdentifiedDish {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  difficulty: "easy" | "medium" | "hard";
  cuisine: string;
  servings: number;
  confidence: number;
}

export class OpenAIService {
  async generateRecipesFromIngredients(
    ingredients: string[],
    options: {
      cuisineType?: string;
      difficulty?: string;
      cookingTime?: number;
      count?: number;
    } = {}
  ): Promise<GeneratedRecipe[]> {
    const { cuisineType, difficulty, cookingTime, count = 3 } = options;

    const ingredientsList = ingredients.join(", ");
    let prompt = `Create ${count} delicious recipes using these ingredients: ${ingredientsList}.`;

    if (cuisineType) {
      prompt += ` Focus on ${cuisineType} cuisine.`;
    }
    if (difficulty) {
      prompt += ` Make the recipes ${difficulty} difficulty.`;
    }
    if (cookingTime) {
      prompt += ` Keep cooking time under ${cookingTime} minutes.`;
    }

    prompt += `

    For each recipe, provide:
    - name: Descriptive recipe name
    - description: Brief appetizing description
    - ingredients: Complete list with quantities
    - instructions: Step-by-step cooking instructions
    - cookingTime: Total time in minutes
    - difficulty: easy, medium, or hard
    - cuisine: Type of cuisine
    - servings: Number of servings

    Respond with a JSON array of recipe objects.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional chef and recipe creator. Create detailed, delicious recipes that are easy to follow."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 8192,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const parsed = JSON.parse(content);
      return parsed.recipes || parsed || [];
    } catch (error) {
      console.error("Error generating recipes:", error);
      throw new Error("Failed to generate recipes. Please try again.");
    }
  }

  async identifyDishFromPhoto(base64Image: string): Promise<IdentifiedDish> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional chef and food expert. Analyze food images and provide detailed recipe information."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food image and identify the dish. Provide:
                - name: Dish name
                - description: Brief description
                - ingredients: List of ingredients with quantities
                - instructions: Step-by-step cooking instructions
                - cookingTime: Total time in minutes
                - difficulty: easy, medium, or hard
                - cuisine: Type of cuisine
                - servings: Number of servings
                - confidence: How confident you are in the identification (0-1)

                Respond with a JSON object containing this information.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error identifying dish:", error);
      throw new Error("Failed to identify dish from photo. Please try again.");
    }
  }

  async generateRecipeImage(recipeName: string, description: string): Promise<string> {
    try {
      const prompt = `A professional, appetizing photo of ${recipeName}. ${description}. Shot in natural lighting with beautiful presentation, high quality food photography style.`;

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data[0].url || "";
    } catch (error) {
      console.error("Error generating recipe image:", error);
      // Return a placeholder or throw error based on requirements
      return "";
    }
  }
}

export const openaiService = new OpenAIService();
