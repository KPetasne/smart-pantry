import Link from 'next/link';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface RecipeCardProps {
  id: number;
  title: string;
  ingredients: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  servings?: number;
}

export default function RecipeCard({ id, title, ingredients, difficulty, servings }: RecipeCardProps) {
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  };

  const difficultyLabels = {
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil',
  };

  return (
    <Link href={`/recipes/${id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
        <div className="mb-3 flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-sm font-semibold ${difficultyColors[difficulty]}`}>
            {difficultyLabels[difficulty]}
          </span>
          {servings && (
            <div className="flex items-center gap-1 text-gray-600">
              <UserGroupIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{servings}</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-semibold mb-1">Ingredientes:</p>
          <p className="line-clamp-2">{ingredients.slice(0, 5).join(', ')}{ingredients.length > 5 ? '...' : ''}</p>
        </div>
      </div>
    </Link>
  );
}
