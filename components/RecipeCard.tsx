import Link from 'next/link';
import { UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import DifficultyBadge from './DifficultyBadge';
import RatingStars from './RatingStars';

interface Recipe {
  id: number;
  title: string;
  prepTime?: number;
  cookTime?: number;
  ingredients: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  servings?: number;
  rating_count?: number;
  average_rating?: number;
  image_url?: string;
}

interface RecipeCardProps extends Recipe {}

export default function RecipeCard({ 
  id, 
  title, 
  prepTime,
  cookTime, 
  ingredients, 
  difficulty, 
  servings,
  rating_count,
  average_rating,
  image_url
}: RecipeCardProps) {
  return (
    <Link href={`/recipes/${id}`} className="block mb-6 last:mb-0">
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-carbon/10 overflow-hidden">
        {image_url && (
          <div className="w-full h-48 relative">
            <img
              src={image_url}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-xl font-bold mb-2 text-carbon">{title}</h3>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={difficulty} />
            {servings && (
              <div className="flex items-center gap-1 text-carbon/70">
                <UserGroupIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{servings}</span>
              </div>
            )}
            {(prepTime || cookTime) && (
              <div className="flex items-center gap-1 text-carbon/70">
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{(prepTime || 0) + (cookTime || 0)} min</span>
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
      </div>
    </Link>
  );
}
