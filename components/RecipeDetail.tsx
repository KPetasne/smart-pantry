import { UserGroupIcon, ClockIcon, FireIcon } from '@heroicons/react/24/outline';
import DifficultyBadge from './DifficultyBadge';
import RatingStars from './RatingStars';

interface RecipeDetailProps {
  recipe: {
    id: number;
    title: string;
    prepTime?: number;
    cookTime?: number;
    ingredients: string[];
    instructions: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    servings?: number;
    rating_count?: number;
    average_rating?: number;
    created_at: string;
  };
}

export default function RecipeDetail({ recipe }: RecipeDetailProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{recipe.title}</h1>
        
        {/* Rating Section */}
        <div className="mb-4">
          <RatingStars 
            average={recipe.average_rating} 
            count={recipe.rating_count} 
            recipeId={recipe.id}
            interactive={true}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <DifficultyBadge difficulty={recipe.difficulty} />
          {recipe.servings && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <UserGroupIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}</span>
            </div>
          )}
          {recipe.prepTime && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <ClockIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{recipe.prepTime} min prep</span>
            </div>
          )}
          {recipe.cookTime && (
            <div className="flex items-center gap-1.5 text-gray-600">
              <FireIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{recipe.cookTime} min cocción</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Ingredientes</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="text-lg">{ingredient}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Instrucciones</h2>
        <ol className="space-y-4">
          {recipe.instructions.map((instruction, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <p className="text-gray-700 text-lg flex-1 pt-1">{instruction}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
