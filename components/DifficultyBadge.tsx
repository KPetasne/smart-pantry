import { FireIcon } from '@heroicons/react/24/outline';

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

const difficultyConfig = {
  easy: {
    icons: 1,
    color: 'green',
    label: 'Fácil',
  },
  medium: {
    icons: 2,
    color: 'yellow',
    label: 'Medio',
  },
  hard: {
    icons: 3,
    color: 'red',
    label: 'Difícil',
  },
};

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];
  
  const colorClasses = {
    green: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      icon: 'text-green-600',
    },
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: 'text-red-600',
    },
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
      <span className="flex gap-0.5">
        {Array.from({ length: config.icons }).map((_, index) => (
          <FireIcon key={index} className={`w-4 h-4 ${colors.icon}`} />
        ))}
      </span>
      <span>{config.label}</span>
    </span>
  );
}
