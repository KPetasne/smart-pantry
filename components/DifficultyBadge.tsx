import { FireIcon } from '@heroicons/react/24/outline';

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

const difficultyConfig = {
  easy: {
    icons: 1,
    color: 'salvia',
    label: 'Fácil',
  },
  medium: {
    icons: 2,
    color: 'laton',
    label: 'Medio',
  },
  hard: {
    icons: 3,
    color: 'terracota',
    label: 'Difícil',
  },
};

export default function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];
  
  const colorClasses = {
    salvia: {
      bg: 'bg-salvia/20',
      text: 'text-salvia',
      icon: 'text-salvia',
    },
    laton: {
      bg: 'bg-laton/20',
      text: 'text-laton',
      icon: 'text-laton',
    },
    terracota: {
      bg: 'bg-terracota/20',
      text: 'text-terracota',
      icon: 'text-terracota',
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
