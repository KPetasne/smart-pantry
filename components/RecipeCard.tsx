import Link from 'next/link';
import { UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import DifficultyBadge from './DifficultyBadge';
import RatingStars from './RatingStars';

interface Recipe {
  id: number;
  title: string;
  prepTime?: number;
  ingredients: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  servings?: number;
  rating_count?: number;
  average_rating?: number;
}

interface RecipeCardProps extends Recipe {}

export default function RecipeCard({ 
  id, 
  title, 
  prepTime, 
  ingredients, 
  difficulty, 
  servings,
  rating_count,
  average_rating 
}: RecipeCardProps) {
  return (
    <Link href={`/recipes/${id}`} className="block mb-6 last:mb-0">
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <DifficultyBadge difficulty={difficulty} />
          {servings && (
            <div className="flex items-center gap-1 text-gray-600">
              <UserGroupIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{servings}</span>
            </div>
          )}
          {prepTime && (
            <div className="flex items-center gap-1 text-gray-600">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{prepTime} min</span>
            </div>
          )}
          <RatingStars 
            average={average_rating} 
            count={rating_count} 
          />
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-semibold mb-1">Ingredientes:</p>
          <p className="line-clamp-2">{ingredients.slice(0, 5).join(', ')}{ingredients.length > 5 ? '...' : ''}</p>
        </div>
      </div>
    </Link>
  );
}
