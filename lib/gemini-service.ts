import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPrompt, type Country } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface GeneratedRecipe {
  title: string;
  prepTime: number;
  cookTime: number;
  ingredients: string[];
  instructions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  servings?: number;
  country: string;
  language: string;
}

export class GeminiService {
  private model;

  constructor(modelName: string = 'gemini-2.5-flash') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    this.model = genAI.getGenerativeModel({ model: modelName });
  }

  async generateRecipe(ingredients?: string[], country: Country = 'argentina', language: string = 'es'): Promise<GeneratedRecipe> {
    const prompt = getPrompt(country, ingredients);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const recipe = this.parseRecipeResponse(text);
      return {
        ...recipe,
        country,
        language,
      };
    } catch (error) {
      console.error('Error generating recipe with Gemini:', error);
      throw new Error('Failed to generate recipe');
    }
  }

  private parseRecipeResponse(text: string): Omit<GeneratedRecipe, 'country' | 'language'> {
    // Remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
    }
    
    try {
      const parsed = JSON.parse(cleanedText);
      
      // Validate structure
      if (!parsed.title || !parsed.ingredients || !parsed.instructions) {
        throw new Error('Invalid recipe structure');
      }
      
      // Ensure difficulty is valid
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(parsed.difficulty)) {
        parsed.difficulty = 'medium';
      }
      
      // Validate servings if present
      let servings: number | undefined = undefined;
      if (parsed.servings !== undefined && parsed.servings !== null) {
        const servingsNum = typeof parsed.servings === 'number' ? parsed.servings : parseInt(parsed.servings, 10);
        if (!isNaN(servingsNum) && servingsNum >= 1 && servingsNum <= 12) {
          servings = servingsNum;
        }
      }
      
      // Extract prepTime, cookTime with defaults
      const prepTime = typeof parsed.prepTime === 'number' ? parsed.prepTime : 15;
      const cookTime = typeof parsed.cookTime === 'number' ? parsed.cookTime : 30;
      
      return {
        title: parsed.title,
        prepTime,
        cookTime,
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        instructions: Array.isArray(parsed.instructions) ? parsed.instructions : [],
        difficulty: parsed.difficulty,
        ...(servings !== undefined && { servings }),
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Response text:', text);
      throw new Error('Failed to parse recipe response');
    }
  }
}
